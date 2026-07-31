import mongoose from 'mongoose';

// Records who referred whom. Drivers earn a recurring commission on their
// referred drivers' rides; customers earn one-time cashback points.
const referralSchema = new mongoose.Schema(
  {
    referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    referred: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    role: { type: String, enum: ['customer', 'driver'], required: true },
    code: String,
    rewardPoints: { type: Number, default: 0 }, // customer signup cashback granted
    recurringEarnings: { type: Number, default: 0 }, // driver: total earned from referred driver
    ridesCounted: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Referral = mongoose.models.Referral || mongoose.model('Referral', referralSchema);
