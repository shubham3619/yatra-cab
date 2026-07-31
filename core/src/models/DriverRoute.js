import mongoose from 'mongoose';

const place = { address: String, lat: Number, lng: Number };

// A driver's pre-set daily routine — a fixed route + rate that appears directly
// in rider search (full cab or per-seat carpool).
const driverRouteSchema = new mongoose.Schema(
  {
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true, index: true },
    origin: place,
    destination: place,
    // Geo point of the origin for nearby sorting.
    originPoint: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [75.7873, 26.9124] }, // [lng, lat]
    },
    departureTime: { type: String, default: '09:00' }, // HH:mm
    days: [{ type: String, enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] }],
    bookingType: { type: String, enum: ['full_cab', 'seat_share'], default: 'seat_share' },
    vehicleType: { type: String, enum: ['hatchback', 'sedan', 'suv', 'tempo'], default: 'sedan' },
    seatsTotal: { type: Number, default: 3 },
    perSeatFare: { type: Number, default: 0 },
    fullCabFare: { type: Number, default: 0 },
    womenOnly: { type: Boolean, default: false },
    active: { type: Boolean, default: true, index: true },
    distanceKm: { type: Number, default: 0 },
  },
  { timestamps: true }
);

driverRouteSchema.index({ originPoint: '2dsphere' });

export const DriverRoute = mongoose.models.DriverRoute || mongoose.model('DriverRoute', driverRouteSchema);
