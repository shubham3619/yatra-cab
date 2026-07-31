import {
  User,
  requestOtp,
  verifyOtp,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshCookieOptions,
  catchAsync,
  ApiError,
  ok,
} from '@yatracab/core';

// POST /auth/request-otp — admins only (no self-signup on the ops panel).
export const sendOtp = catchAsync(async (req, res) => {
  const { phone } = req.body;
  const user = await User.findOne({ phone });
  if (!user || user.role !== 'admin') {
    throw ApiError.forbidden('This phone is not registered as an admin');
  }
  const result = await requestOtp(phone, { purpose: 'login' });
  return ok(res, { message: result.delivered ? 'OTP sent to your email.' : 'OTP generated (dev mode).', ...result });
});

// POST /auth/verify-otp
export const confirmOtp = catchAsync(async (req, res) => {
  const { phone, code } = req.body;
  const user = await User.findOne({ phone });
  if (!user || user.role !== 'admin') throw ApiError.forbidden('Not an admin account');
  if (user.isBlocked) throw ApiError.forbidden('Account is blocked');

  await verifyOtp(phone, code);
  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = issueTokens(res, user);
  return ok(res, { user: user.toSafeJSON(), accessToken });
});

export const refresh = catchAsync(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw ApiError.unauthorized('No refresh token');
  let claims;
  try {
    claims = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid refresh token');
  }
  const user = await User.findById(claims.sub);
  if (!user || user.role !== 'admin' || user.isBlocked) throw ApiError.unauthorized('Account unavailable');
  const accessToken = issueTokens(res, user);
  return ok(res, { user: user.toSafeJSON(), accessToken });
});

export const logout = catchAsync(async (_req, res) => {
  res.clearCookie('refreshToken', { ...refreshCookieOptions(), maxAge: 0 });
  return ok(res, { message: 'Logged out' });
});

export const me = catchAsync(async (req, res) => ok(res, { user: req.user.toSafeJSON() }));

function issueTokens(res, user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions());
  return accessToken;
}
