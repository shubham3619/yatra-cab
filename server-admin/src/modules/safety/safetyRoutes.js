import { Router } from 'express';
import { SosAlert, WalletTransaction, Referral, catchAsync, ok, ApiError } from '@yatracab/core';
import { adminGuard } from '../../middleware/adminGuard.js';

const router = Router();
router.use(...adminGuard);

// GET /admin/safety/sos — active + recent SOS alerts.
router.get(
  '/sos',
  catchAsync(async (_req, res) => {
    const alerts = await SosAlert.find()
      .sort({ status: 1, createdAt: -1 })
      .limit(50)
      .populate('user', 'name phone')
      .populate({ path: 'ride', select: 'destination driver', populate: { path: 'driver', select: 'user', populate: { path: 'user', select: 'name phone' } } })
      .lean();
    return ok(res, { alerts, activeCount: alerts.filter((a) => a.status === 'active').length });
  })
);

// PATCH /admin/safety/sos/:id/resolve
router.patch(
  '/sos/:id/resolve',
  catchAsync(async (req, res) => {
    const alert = await SosAlert.findByIdAndUpdate(req.params.id, { status: 'resolved', resolvedAt: new Date() }, { new: true });
    if (!alert) throw ApiError.notFound('Alert not found');
    return ok(res, { alert });
  })
);

// GET /admin/safety/wallet-summary — Pay-to-Connect commission + referral payout totals.
router.get(
  '/wallet-summary',
  catchAsync(async (_req, res) => {
    const [byReason, referralTotal] = await Promise.all([
      WalletTransaction.aggregate([{ $group: { _id: '$reason', total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      Referral.aggregate([{ $group: { _id: null, recurring: { $sum: '$recurringEarnings' }, rides: { $sum: '$ridesCounted' } } }]),
    ]);
    const map = Object.fromEntries(byReason.map((r) => [r._id, { total: r.total, count: r.count }]));
    return ok(res, {
      summary: {
        commissionCollected: map.commission?.total || 0,
        commissionCount: map.commission?.count || 0,
        topups: map.topup?.total || 0,
        referralPaid: map.referral_commission?.total || 0,
        referralRecurring: referralTotal[0]?.recurring || 0,
        byReason: map,
      },
    });
  })
);

export default router;
