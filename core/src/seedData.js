// Reusable database seeding — populates routes, demo accounts, wallets,
// referrals, daily routes and sample rides. Used by `npm run seed` (with
// clear=true) and by the server's optional AUTO_SEED-on-boot (clear=false,
// only when the DB is empty).
import { User } from './models/User.js';
import { Driver } from './models/Driver.js';
import { Route } from './models/Route.js';
import { Ride } from './models/Ride.js';
import { Bid } from './models/Bid.js';
import { Payment } from './models/Payment.js';
import { Rating } from './models/Rating.js';
import { Otp } from './models/Otp.js';
import { DriverRoute } from './models/DriverRoute.js';
import { WalletTransaction } from './models/WalletTransaction.js';
import { Referral } from './models/Referral.js';
import { fixedFareForRoute } from './services/pricingService.js';
import { logger } from './utils/logger.js';

const ROUTES = [
  { origin: 'Jaipur', destination: 'Delhi', templeName: 'Capital Region', distanceKm: 280, estimatedMins: 300, fixedFare: { hatchback: 4500, sedan: 5500, suv: 7000, tempo: 10000 }, floorPrice: 4000, fairRange: { min: 4500, max: 6500 }, feePercent: 10 },
  { origin: 'Jaipur', destination: 'Udaipur', templeName: 'City of Lakes', distanceKm: 400, estimatedMins: 420, fixedFare: { hatchback: 6000, sedan: 7000, suv: 9000, tempo: 13000 }, floorPrice: 5500, fairRange: { min: 6000, max: 8500 }, feePercent: 10 },
  { origin: 'Jaipur', destination: 'Jodhpur', templeName: 'Blue City', distanceKm: 340, estimatedMins: 360, fixedFare: { hatchback: 5000, sedan: 6000, suv: 7800, tempo: 11000 }, floorPrice: 4500, fairRange: { min: 5000, max: 7500 }, feePercent: 10 },
  { origin: 'Jaipur', destination: 'Agra', templeName: 'City of the Taj', distanceKm: 240, estimatedMins: 270, fixedFare: { hatchback: 4000, sedan: 4800, suv: 6200, tempo: 9000 }, floorPrice: 3600, fairRange: { min: 4000, max: 6000 }, feePercent: 10 },
  { origin: 'Jaipur', destination: 'Ajmer', templeName: 'Ajmer & Pushkar', distanceKm: 135, estimatedMins: 150, fixedFare: { hatchback: 2500, sedan: 3000, suv: 4000, tempo: 6000 }, floorPrice: 2200, fairRange: { min: 2500, max: 3800 }, feePercent: 10 },
  { origin: 'Jaipur', destination: 'Bikaner', templeName: 'Desert City', distanceKm: 330, estimatedMins: 360, fixedFare: { hatchback: 4800, sedan: 5800, suv: 7500, tempo: 10500 }, floorPrice: 4300, fairRange: { min: 4800, max: 7000 }, feePercent: 10 },
];

const REQUIRED_DOCS = ['driving_licence', 'vehicle_rc', 'aadhaar', 'permit', 'insurance', 'profile_photo'];
const docsFor = (status) =>
  REQUIRED_DOCS.map((type) => ({ type, number: `${type.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`, url: 'https://placehold.co/600x400?text=Doc', status }));

/** True when the database has no routes yet (used to gate auto-seeding). */
export async function isDatabaseEmpty() {
  return (await Route.estimatedDocumentCount()) === 0;
}

/** Seed is needed if there are no routes OR no admin account (self-healing). */
export async function needsSeeding() {
  const [routeCount, hasAdmin] = await Promise.all([
    Route.estimatedDocumentCount(),
    User.exists({ role: 'admin' }),
  ]);
  return routeCount === 0 || !hasAdmin;
}

/**
 * Seed the database. Pass a real `demoEmail` to put it on the demo
 * admin/rider/driver accounts. `clear` wipes existing data first.
 */
export async function seedDatabase({ demoEmail, clear = true } = {}) {
  // Reconcile indexes with the current schema — drops any stale unique index
  // (e.g. a legacy unique index on email) that would break seeding/signups.
  await User.syncIndexes().catch((e) => logger.warn(`[seed] User.syncIndexes: ${e.message}`));

  if (clear) {
    logger.info('[seed] clearing existing data…');
    await Promise.all([
      User.deleteMany({}), Driver.deleteMany({}), Route.deleteMany({}),
      Ride.deleteMany({}), Bid.deleteMany({}), Payment.deleteMany({}),
      Rating.deleteMany({}), Otp.deleteMany({}),
      DriverRoute.deleteMany({}), WalletTransaction.deleteMany({}), Referral.deleteMany({}),
    ]);
  }

  logger.info('[seed] routes…');
  const routes = await Route.insertMany(ROUTES);
  const byDest = Object.fromEntries(routes.map((r) => [r.destination, r]));

  logger.info('[seed] accounts…');
  const admin = await User.create({ name: 'Ops Admin', phone: '9000000001', email: demoEmail || 'admin@yatracab.test', role: 'admin', isPhoneVerified: true });

  const customers = await User.create([
    { name: 'Radha Sharma', phone: '9000000010', email: 'radha@example.test', role: 'customer', isPhoneVerified: true, gender: 'female', vibes: ['music_lover', 'foodie'], emergencyContact: '9000000099', referralCode: 'RADXY7', points: 150, rating: 4.8, ratingCount: 6 },
    { name: 'Mohan Verma', phone: '9000000011', email: 'mohan@example.test', role: 'customer', isPhoneVerified: true, gender: 'male', vibes: ['silent_zone'], referralCode: 'MOHK3P', points: 50, rating: 4.6, ratingCount: 3 },
  ]);
  await User.updateOne({ _id: customers[1]._id }, { referredBy: customers[0]._id });
  await Referral.create({ referrer: customers[0]._id, referred: customers[1]._id, role: 'customer', code: 'RADXY7', rewardPoints: 50 });

  const driverSpecs = [
    { name: 'Suresh Yadav', phone: '9000000020', email: 'suresh@example.test', gender: 'male', code: 'SURA1B', wallet: 500, vehicle: { type: 'sedan', make: 'Maruti', model: 'Dzire', plateNumber: 'RJ14AB1234', color: 'White', seats: 4 }, status: 'approved', online: true, rides: 128, rating: 4.9 },
    { name: 'Ramesh Meena', phone: '9000000021', email: 'ramesh@example.test', gender: 'male', code: 'RAMC5D', wallet: 320, vehicle: { type: 'suv', make: 'Toyota', model: 'Innova Crysta', plateNumber: 'RJ14CD5678', color: 'Silver', seats: 7 }, status: 'approved', online: true, rides: 96, rating: 4.7 },
    { name: 'Sunita Devi', phone: '9000000022', email: 'sunita@example.test', gender: 'female', code: 'SUNE9F', wallet: 260, vehicle: { type: 'hatchback', make: 'Hyundai', model: 'i20', plateNumber: 'RJ14EF9012', color: 'Red', seats: 4 }, status: 'approved', online: true, rides: 54, rating: 4.8 },
    { name: 'Vikram Singh', phone: '9000000023', email: 'vikram@example.test', gender: 'male', code: 'VIKG3H', wallet: 200, vehicle: { type: 'suv', make: 'Mahindra', model: 'Scorpio', plateNumber: 'RJ14GH3456', color: 'Black', seats: 7 }, status: 'pending', online: false, rides: 0, rating: 5 },
  ];

  const drivers = [];
  for (const spec of driverSpecs) {
    // eslint-disable-next-line no-await-in-loop
    const user = await User.create({ name: spec.name, phone: spec.phone, email: spec.email, role: 'driver', gender: spec.gender, referralCode: spec.code, isPhoneVerified: true });
    // eslint-disable-next-line no-await-in-loop
    const driver = await Driver.create({
      user: user._id, homeStand: 'Jaipur', servesRoutes: routes.map((r) => r._id), vehicle: spec.vehicle,
      documents: docsFor(spec.status === 'approved' ? 'approved' : 'pending'), verificationStatus: spec.status,
      approvedAt: spec.status === 'approved' ? new Date() : undefined, isOnline: spec.online, walletBalance: spec.wallet,
      rating: spec.rating, ratingCount: Math.round(spec.rides / 3), completedRides: spec.rides, loyaltyPoints: spec.rides * 10,
    });
    // eslint-disable-next-line no-await-in-loop
    await WalletTransaction.create({ driver: driver._id, type: 'credit', amount: spec.wallet, reason: 'topup', balanceAfter: spec.wallet, note: 'Seed balance' });
    drivers.push({ user, driver, spec });
  }

  await Driver.updateOne({ _id: drivers[1].driver._id }, { referredByDriver: drivers[0].driver._id });
  await Driver.updateOne({ _id: drivers[2].driver._id }, { referredByDriver: drivers[1].driver._id });
  await Referral.create([
    { referrer: drivers[0].user._id, referred: drivers[1].user._id, role: 'driver', code: 'SURA1B' },
    { referrer: drivers[1].user._id, referred: drivers[2].user._id, role: 'driver', code: 'RAMC5D' },
  ]);

  logger.info('[seed] driver daily routes…');
  await DriverRoute.create([
    { driver: drivers[0].driver._id, origin: { address: 'Mansarovar, Jaipur', lat: 26.8506, lng: 75.7628 }, destination: { address: 'Sitapura, Jaipur', lat: 26.7683, lng: 75.8482 }, originPoint: { type: 'Point', coordinates: [75.7628, 26.8506] }, departureTime: '08:00', days: ['mon', 'tue', 'wed', 'thu', 'fri'], bookingType: 'seat_share', vehicleType: 'sedan', seatsTotal: 3, perSeatFare: 120, fullCabFare: 350, distanceKm: 14 },
    { driver: drivers[2].driver._id, origin: { address: 'Vaishali Nagar, Jaipur', lat: 26.9115, lng: 75.737 }, destination: { address: 'Ajmer', lat: 26.4499, lng: 74.6399 }, originPoint: { type: 'Point', coordinates: [75.737, 26.9115] }, departureTime: '09:30', days: ['sat', 'sun'], bookingType: 'seat_share', vehicleType: 'hatchback', seatsTotal: 3, perSeatFare: 700, fullCabFare: 2500, womenOnly: true, distanceKm: 135 },
  ]);

  logger.info('[seed] sample rides…');
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  for (let i = 0; i < 6; i += 1) {
    const route = routes[i % routes.length];
    const money = fixedFareForRoute(route, 'sedan');
    const customer = customers[i % customers.length];
    const d = drivers[i % 3];
    // eslint-disable-next-line no-await-in-loop
    const ride = await Ride.create({ customer: customer._id, route: route._id, driver: d.driver._id, mode: 'fixed', vehicleType: 'sedan', tripType: 'round_trip', scheduledAt: new Date(now - (i + 1) * dayMs), destination: route.destination, ...money, status: 'completed', completedAt: new Date(now - (i + 1) * dayMs + 6 * 3600 * 1000), ratedByCustomer: true, ratedByDriver: true });
    // eslint-disable-next-line no-await-in-loop
    const payment = await Payment.create({ ride: ride._id, customer: customer._id, amount: money.feeAmount, provider: 'mock', orderId: `order_seed_${ride._id}`, paymentId: `pay_seed_${i}`, status: 'paid', paidAt: ride.completedAt });
    ride.payment = payment._id;
    // eslint-disable-next-line no-await-in-loop
    await ride.save();
    // eslint-disable-next-line no-await-in-loop
    await Rating.create({ ride: ride._id, direction: 'customer_to_driver', from: customer._id, toDriver: d.driver._id, toUser: d.user._id, stars: 5, comment: 'Safe and on time.' });
  }

  {
    const route = byDest.Delhi;
    const money = fixedFareForRoute(route, 'suv');
    const ride = await Ride.create({ customer: customers[0]._id, route: route._id, driver: drivers[1].driver._id, mode: 'fixed', vehicleType: 'suv', tripType: 'round_trip', scheduledAt: new Date(now + 2 * dayMs), destination: route.destination, ...money, status: 'confirmed' });
    const payment = await Payment.create({ ride: ride._id, customer: customers[0]._id, amount: money.feeAmount, provider: 'mock', orderId: `order_seed_up_${ride._id}`, paymentId: 'pay_seed_up', status: 'paid', paidAt: new Date() });
    ride.payment = payment._id;
    await ride.save();
  }

  {
    const route = byDest.Udaipur;
    const alert = await Ride.create({ customer: customers[1]._id, route: route._id, mode: 'bidding', vehicleType: 'suv', tripType: 'round_trip', scheduledAt: new Date(now + 3 * dayMs), destination: route.destination, feePercent: route.feePercent, status: 'searching', biddingClosesAt: new Date(now + 6 * 3600 * 1000), notes: 'Family of 5 with luggage, need careful driving.' });
    await Bid.create([
      { ride: alert._id, driver: drivers[1].driver._id, amount: 8500, note: 'Innova Crysta, experienced on this route.' },
      { ride: alert._id, driver: drivers[3].driver._id, amount: 8900, note: 'AC SUV, water bottles included.' },
    ]);
  }

  logger.info(`[seed] done. Demo logins (OTP 123456): admin 9000000001 · rider 9000000010 · captain 9000000020`);
  return { admin, customers, drivers };
}
