import {
  DriverRoute,
  Ride,
  Driver,
  RIDE_STATUS,
  env,
  computeCommission,
  seatShareFare,
  debit as walletDebit,
  notify,
  catchAsync,
  ApiError,
  ok,
  created,
} from '@yatracab/core';
import { emitToUser } from '../../realtime.js';

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const haversineKm = (aLat, aLng, bLat, bLng) => {
  if ([aLat, aLng, bLat, bLng].some((n) => typeof n !== 'number' || Number.isNaN(n))) return null;
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
};

// GET /customer/daily-routes?lat=&lng=&type=&womenOnly=
// Driver's pre-set daily routine routes, nearest first (GPS priority sorting).
export const browseDailyRoutes = catchAsync(async (req, res) => {
  const { lat, lng, type, womenOnly, from, to, radiusKm } = req.query;
  const filter = { active: true };
  if (type) filter.bookingType = type;
  if (womenOnly === 'true') filter.womenOnly = true;

  // Free-text from → to search. Riders type a city or landmark, so match
  // loosely against the stored addresses rather than requiring an exact place.
  if (from?.trim()) filter['origin.address'] = new RegExp(escapeRegex(from.trim()), 'i');
  if (to?.trim()) filter['destination.address'] = new RegExp(escapeRegex(to.trim()), 'i');

  // With coordinates, $near sorts by distance from the rider's pickup, so
  // vehicles starting nearby (or passing close) surface first.
  let query;
  if (lat && lng) {
    filter.originPoint = {
      $near: {
        $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
        $maxDistance: Math.round((Number(radiusKm) || 50) * 1000),
      },
    };
    query = DriverRoute.find(filter);
  } else {
    query = DriverRoute.find(filter).sort({ createdAt: -1 });
  }

  const routes = await query
    .limit(40)
    .populate({ path: 'driver', select: 'vehicle rating completedRides user', populate: { path: 'user', select: 'name' } })
    .lean();

  // Surface the distance so the UI can show "2.4 km from you" on each result.
  const withDistance =
    lat && lng
      ? routes.map((r) => ({
          ...r,
          distanceFromYouKm: haversineKm(Number(lat), Number(lng), r.origin?.lat, r.origin?.lng),
        }))
      : routes;

  return ok(res, { routes: withDistance, searched: Boolean(from || to || (lat && lng)) });
});

// POST /customer/daily-routes/:id/book  { seats, scheduledAt }
export const bookDailyRoute = catchAsync(async (req, res) => {
  const route = await DriverRoute.findById(req.params.id).populate('driver');
  if (!route || !route.active) throw ApiError.notFound('This route is no longer available');
  const driver = route.driver;
  if (!driver || driver.verificationStatus !== 'approved') throw ApiError.badRequest('Driver unavailable');

  // Women-only safety filter.
  if (route.womenOnly && req.user.gender !== 'female') {
    throw ApiError.forbidden('This is a women-only ride');
  }

  const isShare = route.bookingType === 'seat_share';
  const seats = isShare ? Math.min(req.body.seats || 1, route.seatsTotal) : 1;
  const fareAmount = isShare ? seatShareFare(route.perSeatFare, seats) : route.fullCabFare;
  if (!fareAmount) throw ApiError.badRequest('This route has no fare set');

  const commission = computeCommission(fareAmount, env.business.commissionPercent);

  const ride = await Ride.create({
    customer: req.user._id,
    driver: driver._id,
    mode: 'fixed',
    bookingType: route.bookingType,
    seatsTotal: route.seatsTotal,
    seatsBooked: isShare ? seats : 0,
    perSeatFare: route.perSeatFare,
    womenOnly: route.womenOnly,
    vehicleType: route.vehicleType,
    tripType: 'one_way',
    pickup: route.origin,
    dropLocation: route.destination,
    destination: route.destination?.address,
    distanceKm: route.distanceKm,
    scheduledAt: req.body.scheduledAt,
    passengers: seats,
    fareAmount,
    feeAmount: 0,
    totalAmount: fareAmount,
    commission: { percent: commission.percent, amount: commission.amount, status: 'pending' },
    status: RIDE_STATUS.CONFIRMED,
  });

  // Pay-to-Connect: charge the driver's wallet; success unlocks contact.
  const debitRes = await walletDebit(driver._id, commission.amount, 'commission', { ride: ride._id, note: 'Daily-route booking commission' });
  if (debitRes.ok) {
    ride.commission.status = 'charged';
    ride.contactUnlocked = true;
    ride.connectOtp = String(Math.floor(1000 + Math.random() * 9000));
    await ride.save();
  }

  emitToUser(String(driver.user._id || driver.user), 'ride:assigned', { rideId: String(ride._id) });
  notify(driver.user._id || driver.user, {
    title: 'New booking on your daily route',
    body: debitRes.ok ? `₹${commission.amount} commission charged. Contact the rider.` : `Add ₹${debitRes.shortBy} to your wallet to connect.`,
  });

  return created(res, { ride });
});
