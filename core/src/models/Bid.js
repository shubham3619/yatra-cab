import mongoose from 'mongoose';

// A blind driver quote on a Ride Alert. Drivers cannot see each other's bids.
const bidSchema = new mongoose.Schema(
  {
    ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true, index: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true, index: true },
    amount: { type: Number, required: true }, // >= route floor price
    note: String,
    status: {
      type: String,
      enum: ['active', 'accepted', 'rejected', 'expired', 'withdrawn'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true }
);

// One bid per driver per ride.
bidSchema.index({ ride: 1, driver: 1 }, { unique: true });

export const Bid = mongoose.models.Bid || mongoose.model('Bid', bidSchema);
