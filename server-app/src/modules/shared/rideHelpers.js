import { Driver, User } from '@yatracab/core';

/**
 * Pick an eligible driver for a fixed-route ride: approved + online + serving
 * the route and vehicle type, nearest first. Falls back to any approved driver
 * with the right vehicle if none are actively online on that route.
 */
export async function assignDriverForFixedRide(ride) {
  const base = {
    verificationStatus: 'approved',
    'vehicle.type': ride.vehicleType,
  };

  if (ride.route) {
    const online = await Driver.findOne({
      ...base,
      isOnline: true,
      servesRoutes: ride.route,
    }).sort({ rating: -1, completedRides: -1 });
    if (online) return online;
  }

  return Driver.findOne(base).sort({ isOnline: -1, rating: -1, completedRides: -1 });
}

/** Fold a new star rating into a running average on a document. */
function fold(doc, stars) {
  const count = doc.ratingCount || 0;
  doc.rating = Number(((doc.rating * count + stars) / (count + 1)).toFixed(2));
  doc.ratingCount = count + 1;
}

export async function applyRatingToDriver(driverId, stars) {
  const driver = await Driver.findById(driverId);
  if (!driver) return;
  fold(driver, stars);
  await driver.save();
}

export async function applyRatingToCustomer(userId, stars) {
  const user = await User.findById(userId);
  if (!user) return;
  fold(user, stars);
  await user.save();
}

/** Public-safe shape of a bid for the customer (price + driver trust signals). */
export function shapeBidForCustomer(bid) {
  const d = bid.driver || {};
  const u = d.user || {};
  return {
    id: bid._id,
    amount: bid.amount,
    note: bid.note,
    status: bid.status,
    createdAt: bid.createdAt,
    driver: {
      id: d._id,
      name: u.name || 'YatraCab Driver',
      rating: d.rating,
      completedRides: d.completedRides,
      vehicle: d.vehicle,
    },
  };
}
