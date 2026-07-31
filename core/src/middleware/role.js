import { ApiError } from '../utils/apiError.js';

/**
 * Restrict a route to one or more roles. Requires requireAuth to have run.
 *   router.post('/bids', requireAuth, allow('driver'), controller)
 */
export const allow =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Requires role: ${roles.join(' or ')}`));
    }
    next();
  };
