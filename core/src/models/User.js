import mongoose from 'mongoose';

// One account model with a `role` discriminator. Driver-specific data lives
// in the Driver document (1:1 with a driver user). Auth is phone-based
// (OTP), but the OTP is currently delivered to `email` via Gmail SMTP.
const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    phone: { type: String, required: true, unique: true, index: true, trim: true },
    email: { type: String, lowercase: true, trim: true, index: true },
    role: {
      type: String,
      enum: ['customer', 'driver', 'admin'],
      default: 'customer',
      index: true,
    },
    isPhoneVerified: { type: Boolean, default: false },
    gender: { type: String, enum: ['female', 'male', 'other', 'unspecified'], default: 'unspecified' },
    // Vibe / personality badges (for carpool match & social travel).
    vibes: [{ type: String, enum: ['music_lover', 'silent_zone', 'podcast_fan', 'chatty', 'work_mode', 'foodie', 'non_smoker', 'pet_friendly'] }],
    emergencyContact: { type: String },
    savedRoutes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Route' }],
    // Referral / loyalty
    referralCode: { type: String, unique: true, sparse: true, index: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    points: { type: Number, default: 0 }, // cashback points, redeemable on rides
    fcmTokens: [{ type: String }],
    isBlocked: { type: Boolean, default: false },
    // Aggregate rating this user has received AS A CUSTOMER (drivers rate customers).
    rating: { type: Number, default: 5, min: 1, max: 5 },
    ratingCount: { type: Number, default: 0 },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.methods.toSafeJSON = function toSafeJSON() {
  const { _id, name, phone, email, role, isPhoneVerified, gender, vibes, emergencyContact, rating, ratingCount, isBlocked, referralCode, points, createdAt } = this;
  return { id: _id, name, phone, email, role, isPhoneVerified, gender, vibes, emergencyContact, rating, ratingCount, isBlocked, referralCode, points, createdAt };
};

export const User = mongoose.models.User || mongoose.model('User', userSchema);
