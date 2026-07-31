import {
  User,
  Driver,
  requestOtp,
  verifyOtp,
  ensureReferralCode,
  applyReferral,
  credit as walletCredit,
  env,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshCookieOptions,
  catchAsync,
  ApiError,
  ok,
  created,
} from '@yatracab/core';

// POST /auth/request-otp
export const sendOtp = catchAsync(async (req, res) => {
  const { phone, email } = req.body;
  const result = await requestOtp(phone, { email, purpose: 'login' });
  return ok(res, {
    message: result.delivered
      ? 'OTP sent to your email.'
      : 'OTP generated. Check the server console (dev mode).',
    ...result,
  });
});

// POST /auth/verify-otp — verify, then create or log in the account.
export const confirmOtp = catchAsync(async (req, res) => {
  const { phone, code, role, name, email, gender, referralCode } = req.body;
  await verifyOtp(phone, code);

  let user = await User.findOne({ phone });
  let isNew = false;
  if (!user) {
    isNew = true;
    user = await User.create({ phone, role, name, email, gender, isPhoneVerified: true });
    // A new driver account gets a linked (unsubmitted) Driver profile + a free
    // starter wallet credit so their first rides' commission is pre-funded.
    if (role === 'driver') {
      const driver = await Driver.create({ user: user._id, vehicle: { type: 'sedan' } });
      if (env.business.driverWelcomeCredit > 0) {
        await walletCredit(driver._id, env.business.driverWelcomeCredit, 'bonus', { note: 'Welcome starter credit' });
      }
    }
    // Own referral code + apply any code they signed up with.
    await ensureReferralCode(user);
    if (referralCode) {
      try {
        await applyReferral(user, referralCode);
      } catch {
        /* invalid code — ignore, don't block signup */
      }
    }
  } else {
    if (email && !user.email) user.email = email;
    if (name && !user.name) user.name = name;
    user.isPhoneVerified = true;
    user.lastLoginAt = new Date();
    await user.save();
  }

  const accessToken = issueTokens(res, user);
  const payload = { user: user.toSafeJSON(), isNew, accessToken };
  return isNew ? created(res, payload) : ok(res, payload);
});

// POST /auth/refresh — rotate the access token from the refresh cookie.
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
  if (!user || user.isBlocked) throw ApiError.unauthorized('Account unavailable');
  const accessToken = issueTokens(res, user);
  return ok(res, { user: user.toSafeJSON(), accessToken });
});

// POST /auth/logout
export const logout = catchAsync(async (_req, res) => {
  res.clearCookie('refreshToken', { ...refreshCookieOptions(), maxAge: 0 });
  return ok(res, { message: 'Logged out' });
});

// GET /auth/me
export const me = catchAsync(async (req, res) => {
  const data = { user: req.user.toSafeJSON() };
  if (req.user.role === 'driver') {
    const driver = await Driver.findOne({ user: req.user._id }).populate('servesRoutes', 'origin destination templeName');
    data.driver = driver;
  }
  return ok(res, data);
});

// Sets the httpOnly refresh cookie and returns the short-lived access token
// (which the caller includes in the JSON body — the client keeps it in memory).
function issueTokens(res, user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions());
  return accessToken;
}
