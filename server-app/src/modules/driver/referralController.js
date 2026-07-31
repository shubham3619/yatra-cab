import { Driver, Referral, User, ensureReferralCode, catchAsync, ApiError, ok } from '@yatracab/core';

// GET /driver/referrals — my code + drivers I referred + recurring earnings.
export const myReferrals = catchAsync(async (req, res) => {
  const driver = await Driver.findOne({ user: req.user._id }).select('referralEarnings');
  if (!driver) throw ApiError.notFound('Driver profile not found');

  const code = await ensureReferralCode(req.user);
  const referrals = await Referral.find({ referrer: req.user._id, role: 'driver' })
    .sort({ recurringEarnings: -1 })
    .populate('referred', 'name phone')
    .lean();

  return ok(res, {
    referralCode: code,
    referralEarnings: driver.referralEarnings,
    referredCount: referrals.length,
    referrals,
  });
});
