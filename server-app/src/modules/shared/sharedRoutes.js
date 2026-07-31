import { Router } from 'express';
import { Route, LocationShare, Ride, catchAsync, ok, ApiError, paymentPublicConfig, env } from '@yatracab/core';

const router = Router();

// GET /shared/track/:token — PUBLIC live-tracking view for a shared trip link.
router.get(
  '/track/:token',
  catchAsync(async (req, res) => {
    const share = await LocationShare.findOne({ token: req.params.token, active: true });
    if (!share || share.expiresAt < new Date()) throw ApiError.notFound('This tracking link has expired');
    const ride = await Ride.findById(share.ride)
      .select('destination pickup dropLocation driverLocation status scheduledAt vehicleType')
      .lean();
    if (!ride) throw ApiError.notFound('Trip not found');
    return ok(res, {
      trip: {
        status: ride.status,
        pickup: ride.pickup,
        drop: ride.dropLocation || { address: ride.destination },
        driverLocation: ride.driverLocation,
        scheduledAt: ride.scheduledAt,
        vehicleType: ride.vehicleType,
      },
    });
  })
);

// Public config the frontends need at boot.
router.get(
  '/config',
  catchAsync(async (_req, res) =>
    ok(res, {
      config: {
        appName: 'YatraCab',
        feePercent: env.business.feePercent,
        freeCancelWindowHours: env.business.freeCancelWindowHours,
        cancelProcessingFee: env.business.cancelProcessingFee,
        payment: paymentPublicConfig(),
      },
    })
  )
);

// Active temple routes + fare matrix (used by customer booking & driver feed).
router.get(
  '/routes',
  catchAsync(async (req, res) => {
    const filter = { isActive: true };
    if (req.query.mode === 'fixed') filter.supportsFixed = true;
    if (req.query.mode === 'bidding') filter.supportsBidding = true;
    const routes = await Route.find(filter).sort({ destination: 1 }).lean();
    return ok(res, { routes });
  })
);

router.get(
  '/routes/:id',
  catchAsync(async (req, res) => {
    const route = await Route.findById(req.params.id).lean();
    if (!route) throw ApiError.notFound('Route not found');
    return ok(res, { route });
  })
);

export default router;
