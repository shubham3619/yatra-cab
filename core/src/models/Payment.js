import mongoose from 'mongoose';

// Tracks ONLY the online advance Booking & Safety Fee (never the ride fare,
// which is cash-to-driver). Amounts are always recomputed server-side.
const paymentSchema = new mongoose.Schema(
  {
    ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true }, // fee, in INR
    currency: { type: String, default: 'INR' },
    provider: { type: String, enum: ['mock', 'razorpay'], default: 'mock' },
    orderId: { type: String, index: true }, // gateway order id
    paymentId: String, // gateway payment id
    signature: String,
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'refunded'],
      default: 'created',
      index: true,
    },
    refund: {
      amount: Number,
      id: String,
      reason: String,
      at: Date,
    },
    paidAt: Date,
  },
  { timestamps: true }
);

export const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
