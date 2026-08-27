import mongoose from 'mongoose';

// Ledger for the customer referral commission engine. One row per beneficiary
// per ride, so payouts are idempotent (unique ride+beneficiary), monthly caps
// are queryable, and the Rewards page can show a real statement.
const referralEarningSchema = new mongoose.Schema(
  {
    ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true, index: true },
    beneficiary: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // The rider whose ride generated this payout (equals beneficiary at level 0).
    source: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    level: { type: Number, required: true }, // 0 = own-ride cashback, 1..N = upline
    points: { type: Number, required: true },
    commissionBase: { type: Number, default: 0 }, // platform commission the pool came from
  },
  { timestamps: true }
);

referralEarningSchema.index({ ride: 1, beneficiary: 1 }, { unique: true });
referralEarningSchema.index({ beneficiary: 1, createdAt: -1 });

export const ReferralEarning =
  mongoose.models.ReferralEarning || mongoose.model('ReferralEarning', referralEarningSchema);
