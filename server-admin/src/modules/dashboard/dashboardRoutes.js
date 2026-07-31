import { Router } from 'express';
import { Driver, User, Ride, Payment, RIDE_STATUS, catchAsync, ok } from '@yatracab/core';
import { adminGuard } from '../../middleware/adminGuard.js';

const router = Router();
router.use(...adminGuard);

// GET /admin/dashboard — top-line ops metrics + recent activity.
router.get(
  '/',
  catchAsync(async (_req, res) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      totalDrivers,
      pendingDrivers,
      approvedDrivers,
      onlineDrivers,
      totalCustomers,
      ridesByStatus,
      revenueAgg,
      todayRides,
      recentRides,
      pendingRefunds,
    ] = await Promise.all([
      Driver.countDocuments(),
      Driver.countDocuments({ verificationStatus: 'pending' }),
      Driver.countDocuments({ verificationStatus: 'approved' }),
      Driver.countDocuments({ isOnline: true }),
      User.countDocuments({ role: 'customer' }),
      Ride.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Payment.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Ride.countDocuments({ createdAt: { $gte: startOfDay } }),
      Ride.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .populate('customer', 'name')
        .populate('route', 'destination')
        .lean(),
      Payment.countDocuments({ status: 'refunded' }),
    ]);

    const statusMap = Object.fromEntries(ridesByStatus.map((s) => [s._id, s.count]));
    const revenue = revenueAgg[0] || { total: 0, count: 0 };

    return ok(res, {
      stats: {
        drivers: { total: totalDrivers, pending: pendingDrivers, approved: approvedDrivers, online: onlineDrivers },
        customers: totalCustomers,
        rides: {
          total: Object.values(statusMap).reduce((a, b) => a + b, 0),
          today: todayRides,
          ongoing: statusMap[RIDE_STATUS.ONGOING] || 0,
          completed: statusMap[RIDE_STATUS.COMPLETED] || 0,
          cancelled: statusMap[RIDE_STATUS.CANCELLED] || 0,
          byStatus: statusMap,
        },
        revenue: { totalFees: revenue.total, paidCount: revenue.count, refundedCount: pendingRefunds },
      },
      recentRides,
    });
  })
);

export default router;
