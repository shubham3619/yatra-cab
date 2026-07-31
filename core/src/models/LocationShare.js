import mongoose from 'mongoose';

// A shareable, time-limited live-location link for a trip (safety feature).
const locationShareSchema = new mongoose.Schema(
  {
    ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true, index: true },
    sharer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true, index: true },
    lastLocation: { lat: Number, lng: Number, at: Date },
    expiresAt: { type: Date, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

locationShareSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const LocationShare = mongoose.models.LocationShare || mongoose.model('LocationShare', locationShareSchema);
