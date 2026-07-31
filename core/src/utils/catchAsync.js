/**
 * Wrap an async Express handler so rejected promises flow to the central
 * error handler instead of hanging the request. Keeps controllers free of
 * scattered try/catch.
 */
export const catchAsync = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
