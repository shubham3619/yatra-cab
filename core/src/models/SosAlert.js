import mongoose from 'mongoose';

// An SOS raised during a trip. Notifies the emergency contact + ops, and
// surfaces on the admin safety board until resolved.
const sosSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride' },
    location: { lat: Number, lng: Number },
    note: String,
    status: { type: String, enum: ['active', 'resolved'], default: 'active', index: true },
    resolvedAt: Date,
  },
  { timestamps: true }
);

export const SosAlert = mongoose.models.SosAlert || mongoose.model('SosAlert', sosSchema);
