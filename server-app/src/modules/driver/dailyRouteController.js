import { Driver, DriverRoute, haversineKm, catchAsync, ApiError, ok, created } from '@yatracab/core';

async function myDriver(req) {
  const driver = await Driver.findOne({ user: req.user._id });
  if (!driver) throw ApiError.notFound('Driver profile not found');
  return driver;
}

function withGeoAndDistance(body) {
  const patch = { ...body };
  if (body.origin?.lat != null && body.origin?.lng != null) {
    patch.originPoint = { type: 'Point', coordinates: [body.origin.lng, body.origin.lat] };
  }
  if (body.origin?.lat != null && body.destination?.lat != null) {
    patch.distanceKm = Math.round(haversineKm(body.origin, body.destination) * 10) / 10;
  }
  return patch;
}

// GET /driver/daily-routes
export const listMine = catchAsync(async (req, res) => {
  const driver = await myDriver(req);
  const routes = await DriverRoute.find({ driver: driver._id }).sort({ createdAt: -1 }).lean();
  return ok(res, { routes });
});

// POST /driver/daily-routes
export const create = catchAsync(async (req, res) => {
  const driver = await myDriver(req);
  if (driver.verificationStatus !== 'approved') throw ApiError.forbidden('Get verified before publishing routes');
  const route = await DriverRoute.create({ driver: driver._id, ...withGeoAndDistance(req.body) });
  return created(res, { route });
});

// PATCH /driver/daily-routes/:id
export const update = catchAsync(async (req, res) => {
  const driver = await myDriver(req);
  const route = await DriverRoute.findOneAndUpdate(
    { _id: req.params.id, driver: driver._id },
    withGeoAndDistance(req.body),
    { new: true, runValidators: true }
  );
  if (!route) throw ApiError.notFound('Route not found');
  return ok(res, { route });
});

// DELETE /driver/daily-routes/:id
export const remove = catchAsync(async (req, res) => {
  const driver = await myDriver(req);
  const route = await DriverRoute.findOneAndDelete({ _id: req.params.id, driver: driver._id });
  if (!route) throw ApiError.notFound('Route not found');
  return ok(res, { message: 'Route removed' });
});
