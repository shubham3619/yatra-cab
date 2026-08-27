import mongoose from 'mongoose';

// A contact the owner explicitly selected to invite. There is no bulk
// address-book import: the browser's Contact Picker only ever returns the
// entries the user tapped, so every row here is one deliberate pick (or a
// number typed by hand). `consentedAt` records when the owner chose it.
const contactSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, trim: true },
    phone: { type: String, required: true, trim: true }, // normalized, +91XXXXXXXXXX
    source: { type: String, enum: ['picker', 'manual', 'synthetic'], required: true },
    consentedAt: { type: Date, default: Date.now },
    invitedAt: { type: Date },
    inviteCount: { type: Number, default: 0 },
    // Set once the number turns up as a real signup, so referrals can attribute.
    joinedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// One row per number per owner — re-picking the same person updates in place.
contactSchema.index({ owner: 1, phone: 1 }, { unique: true });

export const Contact = mongoose.models.Contact || mongoose.model('Contact', contactSchema);

/** Normalize to E.164, defaulting to India (+91) when no country code is given. */
export function normalizePhone(raw = '') {
  const digits = String(raw).replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
  if (digits.startsWith('+')) return digits;
  const bare = digits.replace(/^0+/, '');
  if (bare.length === 10) return `+91${bare}`;
  if (bare.length === 12 && bare.startsWith('91')) return `+${bare}`;
  return `+${bare}`;
}
