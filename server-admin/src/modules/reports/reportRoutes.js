import { Router } from 'express';
import { Ride, Payment, Driver, RIDE_STATUS, catchAsync, ok } from '@yatracab/core';
import { adminGuard } from '../../middleware/adminGuard.js';

const router = Router();
router.use(...adminGuard);

// GET /admin/reports/revenue?days=30 — daily fee revenue trend.
router.get(
  '/revenue',
  catchAsync(async (req, res) => {
    const days = Math.min(90, Math.max(7, Number(req.query.days) || 30));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const daily = await Payment.aggregate([
      { $match: { status: 'paid', paidAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
          fees: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const totals = daily.reduce((acc, d) => ({ fees: acc.fees + d.fees, count: acc.count + d.count }), { fees: 0, count: 0 });
    return ok(res, { days, series: daily.map((d) => ({ date: d._id, fees: d.fees, count: d.count })), totals });
  })
);

// GET /admin/reports/rides — status split + cancellation rate + mode split.
router.get(
  '/rides',
  catchAsync(async (_req, res) => {
    const [byStatus, byMode, total] = await Promise.all([
      Ride.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Ride.aggregate([{ $group: { _id: '$mode', count: { $sum: 1 } } }]),
      Ride.countDocuments(),
    ]);
    const statusMap = Object.fromEntries(byStatus.map((s) => [s._id, s.count]));
    const cancelled = (statusMap[RIDE_STATUS.CANCELLED] || 0) + (statusMap[RIDE_STATUS.NO_SHOW] || 0);
    return ok(res, {
      total,
      byStatus: statusMap,
      byMode: Object.fromEntries(byMode.map((m) => [m._id, m.count])),
      cancellationRate: total ? Number(((cancelled / total) * 100).toFixed(1)) : 0,
      completed: statusMap[RIDE_STATUS.COMPLETED] || 0,
    });
  })
);

// GET /admin/reports/leaderboards — top drivers + popular routes.
router.get(
  '/leaderboards',
  catchAsync(async (_req, res) => {
    const [topDrivers, popularRoutes] = await Promise.all([
      Driver.find({ verificationStatus: 'approved' })
        .sort({ completedRides: -1, rating: -1 })
        .limit(10)
        .populate('user', 'name')
        .select('completedRides rating loyaltyPoints vehicle user')
        .lean(),
      Ride.aggregate([
        { $match: { route: { $ne: null } } },
        { $group: { _id: '$route', rides: { $sum: 1 } } },
        { $sort: { rides: -1 } },
        { $limit: 8 },
        { $lookup: { from: 'routes', localField: '_id', foreignField: '_id', as: 'route' } },
        { $unwind: '$route' },
        { $project: { rides: 1, destination: '$route.destination', origin: '$route.origin' } },
      ]),
    ]);
    return ok(res, { topDrivers, popularRoutes });
  })
);

export default router;
