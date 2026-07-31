import { Router } from 'express';
import Joi from 'joi';
import { User, Ride, validate, catchAsync, ApiError, ok, paginate, pageMeta } from '@yatracab/core';
import { adminGuard } from '../../middleware/adminGuard.js';

const router = Router();
router.use(...adminGuard);

// GET /admin/customers?q=
router.get(
  '/',
  catchAsync(async (req, res) => {
    const { page, limit, skip } = paginate(req.query);
    const filter = { role: 'customer' };
    if (req.query.q) {
      filter.$or = [
        { name: new RegExp(req.query.q, 'i') },
        { phone: new RegExp(req.query.q, 'i') },
        { email: new RegExp(req.query.q, 'i') },
      ];
    }
    const [customers, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);
    return ok(res, { customers, meta: pageMeta(page, limit, total) });
  })
);

// GET /admin/customers/:id
router.get(
  '/:id',
  catchAsync(async (req, res) => {
    const customer = await User.findOne({ _id: req.params.id, role: 'customer' }).lean();
    if (!customer) throw ApiError.notFound('Customer not found');
    const rides = await Ride.find({ customer: customer._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('route', 'destination')
      .lean();
    return ok(res, { customer, recentRides: rides });
  })
);

// PATCH /admin/customers/:id/block { blocked }
router.patch(
  '/:id/block',
  validate(Joi.object({ blocked: Joi.boolean().required() })),
  catchAsync(async (req, res) => {
    const customer = await User.findOne({ _id: req.params.id, role: 'customer' });
    if (!customer) throw ApiError.notFound('Customer not found');
    customer.isBlocked = !!req.body.blocked;
    await customer.save();
    return ok(res, { customer: customer.toSafeJSON() });
  })
);

export default router;
