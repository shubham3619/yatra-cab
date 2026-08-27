import { Referral, ReferralEarning, User, ensureReferralCode, catchAsync, ok, env } from '@yatracab/core';

const LEVEL_LABEL = { 0: 'Ride cashback', 1: 'Level 1', 2: 'Level 2', 3: 'Level 3' };

// GET /customer/referral — code, points, my chain, and lifetime earnings.
export const myReferral = catchAsync(async (req, res) => {
  const code = await ensureReferralCode(req.user);
  const me = req.user._id;

  const [referrals, byLevel, network] = await Promise.all([
    Referral.find({ referrer: me, role: 'customer' })
      .sort({ createdAt: -1 })
      .populate('referred', 'name')
      .lean(),
    ReferralEarning.aggregate([
      { $match: { beneficiary: me } },
      { $group: { _id: '$level', points: { $sum: '$points' }, rides: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    // Level 2 = people referred by the people I referred.
    User.find({ referredBy: me }).select('_id').lean(),
  ]);

  // Walk the tree down three levels to size the chain.
  const l1Ids = network.map((u) => u._id);
  const l2 = l1Ids.length ? await User.find({ referredBy: { $in: l1Ids } }).select('_id').lean() : [];
  const l2Ids = l2.map((u) => u._id);
  const l3Count = l2Ids.length ? await User.countDocuments({ referredBy: { $in: l2Ids } }) : 0;

  const earnedByLevel = Object.fromEntries(byLevel.map((r) => [r._id, r]));
  const levels = [1, 2, 3].map((lvl) => ({
    level: lvl,
    label: `Level ${lvl}`,
    weight: [75, 19, 6][lvl - 1],
    members: [network.length, l2.length, l3Count][lvl - 1],
    points: earnedByLevel[lvl]?.points || 0,
    rides: earnedByLevel[lvl]?.rides || 0,
  }));

  return ok(res, {
    referralCode: code,
    points: req.user.points,
    referredCount: referrals.length,
    referrals,
    levels,
    chainEarned: levels.reduce((sum, l) => sum + l.points, 0),
    cashbackEarned: earnedByLevel[0]?.points || 0,
    // Everyone below you, across all three levels.
    chainSize: network.length + l2.length + l3Count,
    network: { level1: network.length, level2: l2.length, level3: l3Count },
    config: {
      levelWeights: [75, 19, 6],
      windowRides: env.business.customerReferralWindowRides,
      monthlyCap: env.business.customerReferralMonthlyCap,
    },
  });
});

// GET /customer/referral/earnings — paginated statement.
export const myReferralEarnings = catchAsync(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const earnings = await ReferralEarning.find({ beneficiary: req.user._id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('source', 'name')
    .lean();
  return ok(res, {
    earnings: earnings.map((e) => ({
      id: e._id,
      level: e.level,
      label: LEVEL_LABEL[e.level] || `Level ${e.level}`,
      points: e.points,
      from: e.level === 0 ? 'Your ride' : e.source?.name || 'A rider',
      at: e.createdAt,
    })),
  });
});
