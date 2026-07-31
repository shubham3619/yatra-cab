import { verifyAccessToken } from '../utils/tokens.js';
import { ApiError } from '../utils/apiError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { User } from '../models/User.js';

/**
 * Verify the Bearer access token, load the user, and reject blocked accounts.
 * Attaches `req.user` (the Mongoose doc) and `req.auth` (decoded claims).
 */
export const requireAuth = catchAsync(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw ApiError.unauthorized('Missing access token');

  let claims;
  try {
    claims = verifyAccessToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired token');
  }

  const user = await User.findById(claims.sub);
  if (!user) throw ApiError.unauthorized('Account no longer exists');
  if (user.isBlocked) throw ApiError.forbidden('Account is blocked');

  req.user = user;
  req.auth = claims;
  next();
});

// Decode the token if present but don't require it (public-with-context routes).
export const optionalAuth = catchAsync(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      const claims = verifyAccessToken(token);
      const user = await User.findById(claims.sub);
      if (user && !user.isBlocked) {
        req.user = user;
        req.auth = claims;
      }
    } catch {
      /* ignore — treated as anonymous */
    }
  }
  next();
});
