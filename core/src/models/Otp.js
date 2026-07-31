import mongoose from 'mongoose';

// OTP store backed by MongoDB (Redis is optional in this build). A TTL index
// auto-expires codes; `expiresAt` is set to now + OTP_TTL_MS on issue.
const otpSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, index: true },
    codeHash: { type: String, required: true },
    purpose: { type: String, enum: ['login', 'verify'], default: 'login' },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// TTL: Mongo removes the doc once expiresAt passes.
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Otp = mongoose.models.Otp || mongoose.model('Otp', otpSchema);
