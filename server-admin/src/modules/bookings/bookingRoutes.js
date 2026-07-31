import { Router } from 'express';
import Joi from 'joi';
import {
  Ride,
  Payment,
  Driver,
  RIDE_STATUS,
  refund as gatewayRefund,
  notify,
  validate,
  catchAsync,
  ApiError,
  ok,
  paginate,
  pageMeta,
} from '@yatracab/core';
import { adminGuard } from '../../middleware/adminGuard.js';

const router = Router();
router.use(...adminGuard);

// GET /admin/bookings?status=&mode=
router.get(
  '/',
  catchAsync(async (req, res) => {
    const { page, limit, skip } = paginate(req.query);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.mode) filter.mode = req.query.mode;

    const [rides, total] = await Promise.all([
      Ride.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('customer', 'name phone')
        .populate('route', 'origin destination')
        .populate({ path: 'driver', select: 'user vehicle', populate: { path: 'user', select: 'name' } })
        .lean(),
      Ride.countDocuments(filter),
    ]);
    return ok(res, { rides, meta: pageMeta(page, limit, total) });
  })
);

// GET /admin/bookings/:id
router.get(
  '/:id',
  catchAsync(async (req, res) => {
    const ride = await Ride.findById(req.params.id)
      .populate('customer', 'name phone email rating')
      .populate('route')
      .populate({ path: 'driver', select: 'user vehicle rating', populate: { path: 'user', select: 'name phone' } })
      .populate('payment');
    if (!ride) throw ApiError.notFound('Booking not found');
    return ok(res, { ride });
  })
);

// PATCH /admin/bookings/:id/cancel { reason, fullRefund, penaltyDriver }
router.patch(
  '/:id/cancel',
  validate(
    Joi.object({
      reason: Joi.string().max(200).allow('').optional(),
      fullRefund: Joi.boolean().default(true),
      penaltyDriver: Joi.number().min(0).optional(),
    })
  ),
  catchAsync(async (req, res) => {
    const ride = await Ride.findById(req.params.id);
    if (!ride) throw ApiError.notFound('Booking not found');
    if ([RIDE_STATUS.COMPLETED, RIDE_STATUS.CANCELLED].includes(ride.status)) {
      throw ApiError.badRequest(`Cannot cancel a ${ride.status} booking`);
    }

    const payment = await Payment.findOne({ ride: ride._id, status: 'paid' });
    let refundAmount = 0;
    if (payment && req.body.fullRefund) {
      refundAmount = payment.amount;
      const r = await gatewayRefund({ paymentId: payment.paymentId, amount: refundAmount, reason: 'admin_cancel' });
      payment.status = 'refunded';
      payment.refund = { amount: refundAmount, id: r.id, reason: 'admin_cancel', at: new Date() };
      await payment.save();
    }

    ride.status = RIDE_STATUS.CANCELLED;
    ride.cancellation = { by: 'admin', reason: req.body.reason, at: new Date(), refundAmount };
    await ride.save();

    if (ride.driver && req.body.penaltyDriver) {
      const driver = await Driver.findById(ride.driver);
      driver.penalties.push({ amount: req.body.penaltyDriver, reason: req.body.reason || 'Admin penalty', ride: ride._id });
      driver.noShows += 1;
      await driver.save();
      notify(driver.user, { title: 'Penalty applied', body: `₹${req.body.penaltyDriver} — ${req.body.reason || 'cancellation'}` });
    }

    notify(ride.customer, { title: 'Booking cancelled by support', body: refundAmount ? `A refund of ₹${refundAmount} is being processed.` : 'Your booking was cancelled.' });
    return ok(res, { ride, refundAmount });
  })
);

export default router;
