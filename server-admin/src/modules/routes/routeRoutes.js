import { Router } from 'express';
import Joi from 'joi';
import { Route, validate, catchAsync, ApiError, ok, created } from '@yatracab/core';
import { adminGuard } from '../../middleware/adminGuard.js';

const router = Router();
router.use(...adminGuard);

const fareSchema = Joi.object({
  hatchback: Joi.number().min(0).default(0),
  sedan: Joi.number().min(0).default(0),
  suv: Joi.number().min(0).default(0),
  tempo: Joi.number().min(0).default(0),
});

const routeSchema = Joi.object({
  origin: Joi.string().max(60).required(),
  destination: Joi.string().max(80).required(),
  templeName: Joi.string().max(80).allow('').optional(),
  distanceKm: Joi.number().min(0).default(0),
  estimatedMins: Joi.number().min(0).default(0),
  fixedFare: fareSchema.default(),
  floorPrice: Joi.number().min(0).default(0),
  fairRange: Joi.object({ min: Joi.number().min(0).default(0), max: Joi.number().min(0).default(0) }).default(),
  feePercent: Joi.number().min(0).max(100).default(10),
  surgeMultiplier: Joi.number().min(1).max(5).default(1),
  supportsFixed: Joi.boolean().default(true),
  supportsBidding: Joi.boolean().default(true),
  isActive: Joi.boolean().default(true),
  imageUrl: Joi.string().max(400).allow('').optional(),
});

// GET /admin/routes (full list, including inactive)
router.get(
  '/',
  catchAsync(async (_req, res) => {
    const routes = await Route.find().sort({ destination: 1 }).lean();
    return ok(res, { routes });
  })
);

// POST /admin/routes
router.post(
  '/',
  validate(routeSchema),
  catchAsync(async (req, res) => {
    try {
      const route = await Route.create(req.body);
      return created(res, { route });
    } catch (err) {
      if (err.code === 11000) throw ApiError.conflict('A route with this origin + destination already exists');
      throw err;
    }
  })
);

// PATCH /admin/routes/:id (partial update — fares, floor, fee, surge, active)
router.patch(
  '/:id',
  validate(routeSchema.fork(Object.keys(routeSchema.describe().keys), (s) => s.optional())),
  catchAsync(async (req, res) => {
    const route = await Route.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!route) throw ApiError.notFound('Route not found');
    return ok(res, { route });
  })
);

// DELETE /admin/routes/:id (soft delete → deactivate)
router.delete(
  '/:id',
  catchAsync(async (req, res) => {
    const route = await Route.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!route) throw ApiError.notFound('Route not found');
    return ok(res, { route, message: 'Route deactivated' });
  })
);

export default router;
