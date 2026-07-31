import mongoose from 'mongoose';

// Two-way rating after a completed ride. `direction` records who rated whom.
const ratingSchema = new mongoose.Schema(
  {
    ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true, index: true },
    direction: { type: String, enum: ['customer_to_driver', 'driver_to_customer'], required: true },
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // when rating a customer
    toDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' }, // when rating a driver
    stars: { type: Number, required: true, min: 1, max: 5 },
    comment: String,
  },
  { timestamps: true }
);

// One rating per rater per ride.
ratingSchema.index({ ride: 1, from: 1 }, { unique: true });

export const Rating = mongoose.models.Rating || mongoose.model('Rating', ratingSchema);
