import mongoose from 'mongoose';

// Ledger for the driver Pay-to-Connect wallet. Every balance change is a row.
const walletTxnSchema = new mongoose.Schema(
  {
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true, index: true },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    amount: { type: Number, required: true },
    reason: {
      type: String,
      enum: ['topup', 'commission', 'commission_refund', 'referral_commission', 'penalty', 'bonus', 'adjustment'],
      required: true,
    },
    balanceAfter: { type: Number, required: true },
    ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride' },
    note: String,
  },
  { timestamps: true }
);

walletTxnSchema.index({ driver: 1, createdAt: -1 });

export const WalletTransaction =
  mongoose.models.WalletTransaction || mongoose.model('WalletTransaction', walletTxnSchema);
