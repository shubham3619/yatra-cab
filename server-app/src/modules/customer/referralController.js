import { Referral, ensureReferralCode, catchAsync, ok } from '@yatracab/core';

// GET /customer/referral — my code, points balance, and who I referred.
export const myReferral = catchAsync(async (req, res) => {
  const code = await ensureReferralCode(req.user);
  const referrals = await Referral.find({ referrer: req.user._id, role: 'customer' })
    .sort({ createdAt: -1 })
    .populate('referred', 'name')
    .lean();
  return ok(res, { referralCode: code, points: req.user.points, referredCount: referrals.length, referrals });
});
