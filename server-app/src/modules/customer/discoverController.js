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

// GET /customer/daily-routes?lat=&lng=&type=&womenOnly=
// Driver's pre-set daily routine routes, nearest first (GPS priority sorting).
export const browseDailyRoutes = catchAsync(async (req, res) => {
  const { lat, lng, type, womenOnly } = req.query;
  const filter = { active: true };
  if (type) filter.bookingType = type;
  if (womenOnly === 'true') filter.womenOnly = true;

  let query;
  if (lat && lng) {
    filter.originPoint = {
      $near: { $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] }, $maxDistance: 50000 },
    };
    query = DriverRoute.find(filter);
  } else {
    query = DriverRoute.find(filter).sort({ createdAt: -1 });
  }

  const routes = await query
    .limit(40)
    .populate({ path: 'driver', select: 'vehicle rating completedRides user', populate: { path: 'user', select: 'name' } })
    .lean();

  return ok(res, { routes });
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
