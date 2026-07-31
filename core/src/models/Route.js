import mongoose from 'mongoose';

// Admin-managed fare matrix + bidding guardrails for a temple route.
const routeSchema = new mongoose.Schema(
  {
    origin: { type: String, required: true, trim: true }, // e.g. Jaipur
    destination: { type: String, required: true, trim: true }, // e.g. Khatu Shyam Ji
    templeName: { type: String, trim: true },
    distanceKm: { type: Number, default: 0 },
    estimatedMins: { type: Number, default: 0 },
    // Fixed fare by vehicle type (round trip baseline, INR).
    fixedFare: {
      hatchback: { type: Number, default: 0 },
      sedan: { type: Number, default: 0 },
      suv: { type: Number, default: 0 },
      tempo: { type: Number, default: 0 },
    },
    // Bidding guardrails.
    floorPrice: { type: Number, default: 0 }, // minimum allowed bid
    fairRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
    feePercent: { type: Number, default: 10 }, // Booking & Safety Fee %
    surgeMultiplier: { type: Number, default: 1 }, // festival/seasonal
    supportsFixed: { type: Boolean, default: true },
    supportsBidding: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true, index: true },
    imageUrl: String,
  },
  { timestamps: true }
);

routeSchema.index({ origin: 1, destination: 1 }, { unique: true });

export const Route = mongoose.models.Route || mongoose.model('Route', routeSchema);
