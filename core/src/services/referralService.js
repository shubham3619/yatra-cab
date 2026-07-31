import { User } from '../models/User.js';
import { Driver } from '../models/Driver.js';
import { Referral } from '../models/Referral.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { credit as walletCredit } from './walletService.js';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(seed = '') {
  const prefix = (seed.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'YTR');
  let rand = '';
  for (let i = 0; i < 4; i += 1) rand += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return `${prefix}${rand}`;
}

/** Ensure a user has a unique referral code; returns it. */
export async function ensureReferralCode(user) {
  if (user.referralCode) return user.referralCode;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = randomCode(user.name);
    // eslint-disable-next-line no-await-in-loop
    const exists = await User.exists({ referralCode: code });
    if (!exists) {
      user.referralCode = code;
      // eslint-disable-next-line no-await-in-loop
      await user.save();
      return code;
    }
  }
  return null;
}

/**
 * Apply a referral code when a NEW user signs up.
 * - Customer: both referrer and referred get signup cashback points.
 * - Driver: link referredByDriver so the referrer earns recurring commission.
 */
export async function applyReferral(newUser, code) {
  if (!code || newUser.referredBy) return null;
  const referrer = await User.findOne({ referralCode: code.toUpperCase() });
  if (!referrer || String(referrer._id) === String(newUser._id)) return null;

  newUser.referredBy = referrer._id;
  await newUser.save();

  const referral = await Referral.create({ referrer: referrer._id, referred: newUser._id, role: newUser.role, code: code.toUpperCase() });

  if (newUser.role === 'customer') {
    // Level 1: direct referrer + the new user both earn signup points.
    const pts = env.business.referralSignupPoints;
    await User.updateOne({ _id: referrer._id }, { $inc: { points: pts } });
    await User.updateOne({ _id: newUser._id }, { $inc: { points: pts } });
    referral.rewardPoints = pts;
    await referral.save();
    // Level 2: the person who referred the referrer earns a smaller reward.
    if (referrer.referredBy) {
      const l2 = Math.round(pts * 0.4);
      await User.updateOne({ _id: referrer.referredBy }, { $inc: { points: l2 } });
      logger.info(`[referral] customer L2 +${l2} pts → ${referrer.referredBy}`);
    }
    logger.info(`[referral] customer ${newUser._id} referred by ${referrer._id}: +${pts} pts each`);
  } else if (newUser.role === 'driver') {
    const [refDriver, newDriver] = await Promise.all([
      Driver.findOne({ user: referrer._id }).select('_id'),
      Driver.findOne({ user: newUser._id }).select('_id'),
    ]);
    if (refDriver && newDriver) {
      newDriver.referredByDriver = refDriver._id;
      await newDriver.save();
      logger.info(`[referral] driver ${newDriver._id} linked to referrer driver ${refDriver._id}`);
    }
  }
  return referral;
}

// Multi-level driver referral: each level up the chain earns this % of the
// ride's platform commission (total 30% reserved for the referral pool; the
// rest is the platform's profit). Funded entirely from commission → zero risk.
const REFERRAL_LEVEL_PCT = [15, 8, 4, 3]; // L1, L2, L3, L4

/**
 * Walk up to 4 levels of the driver referral chain when a driver earns, paying
 * each ancestor their share of the platform commission from that ride.
 * @returns {Array<{driver, level, reward}>}
 */
export async function payDriverRecurringCommission(driver, platformCommission, ride) {
  if (!driver || platformCommission <= 0) return [];
  const payouts = [];
  let currentId = driver.referredByDriver;

  for (let level = 0; level < REFERRAL_LEVEL_PCT.length && currentId; level += 1) {
    // eslint-disable-next-line no-await-in-loop
    const ancestor = await Driver.findById(currentId).select('referredByDriver user');
    if (!ancestor) break;
    const reward = Math.round((platformCommission * REFERRAL_LEVEL_PCT[level]) / 100);
    if (reward > 0) {
      // eslint-disable-next-line no-await-in-loop
      await walletCredit(ancestor._id, reward, 'referral_commission', { ride: ride?._id, note: `Level ${level + 1} referral` });
      // eslint-disable-next-line no-await-in-loop
      await Driver.updateOne({ _id: ancestor._id }, { $inc: { referralEarnings: reward } });
      payouts.push({ driver: ancestor._id, level: level + 1, reward });
    }
    currentId = ancestor.referredByDriver;
  }

  if (payouts[0]) {
    await Referral.updateOne({ referred: driver.user }, { $inc: { recurringEarnings: payouts[0].reward, ridesCounted: 1 } });
  }
  if (payouts.length) logger.info(`[referral] chain payout on ride ${ride?._id}: ${payouts.map((p) => `L${p.level}:₹${p.reward}`).join(' ')}`);
  return payouts;
}

/** Redeem customer points as a discount (₹). Caps at the available amount. */
export function pointsToDiscount(points, maxDiscount) {
  const value = Math.floor(points * env.business.pointValue);
  return Math.max(0, Math.min(value, maxDiscount));
}
