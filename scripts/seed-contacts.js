// Generate synthetic invite-contacts so the POC has realistic volume to test
// against — dedupe, number normalization, and joined-user matching — without
// putting any real person's details in the database.
//
//   npm run seed:contacts                    (200 contacts per customer)
//   CONTACTS_PER_USER=2000 npm run seed:contacts
//   CONTACTS_PURGE=1 npm run seed:contacts   (drop synthetic rows and exit)
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const dir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(dir, '../.env') });

const { connectDB, disconnectDB, logger, User, Contact, normalizePhone } = await import('@yatracab/core');

const FIRST = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Ananya', 'Diya', 'Aadhya', 'Saanvi', 'Pari', 'Anika', 'Navya', 'Riya', 'Myra', 'Kiara'];
const LAST = ['Sharma', 'Verma', 'Gupta', 'Singh', 'Jain', 'Agarwal', 'Meena', 'Choudhary', 'Rathore', 'Shekhawat'];

// Deterministic PRNG so repeated runs produce the same fixture set.
let seed = 42;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

// Synthetic numbers only: +91 999 9xx xxxx sits inside a range reserved for
// fictional use, so nothing here can dial a real handset.
const fakeNumber = (n) => normalizePhone(`9999${String(900000 + n).slice(-6)}`);

async function run() {
  await connectDB();

  if (process.env.CONTACTS_PURGE) {
    const { deletedCount } = await Contact.deleteMany({ source: 'synthetic' });
    logger.info(`[seed:contacts] Purged ${deletedCount} synthetic contacts.`);
    await disconnectDB();
    process.exit(0);
  }

  const perUser = Number(process.env.CONTACTS_PER_USER || 200);
  const customers = await User.find({ role: 'customer' }).select('_id name phone').lean();
  if (!customers.length) {
    logger.warn('[seed:contacts] No customers found — run `npm run seed` first.');
    await disconnectDB();
    process.exit(0);
  }

  let total = 0;
  for (const customer of customers) {
    const rows = [];
    for (let i = 0; i < perUser; i += 1) {
      // ~8% of a contact list overlapping with real users is a realistic rate
      // for testing the joined-user match path.
      const overlap = rnd() < 0.08;
      const other = overlap ? pick(customers) : null;
      rows.push({
        owner: customer._id,
        name: other?.name || `${pick(FIRST)} ${pick(LAST)}`,
        phone: other ? normalizePhone(other.phone) : fakeNumber(total + i),
        source: 'synthetic',
        consentedAt: new Date(),
      });
    }

    await Contact.bulkWrite(
      rows.map((r) => ({
        updateOne: { filter: { owner: r.owner, phone: r.phone }, update: { $set: r }, upsert: true },
      })),
      { ordered: false }
    );
    total += rows.length;
  }

  // Link the synthetic rows whose numbers match a real account.
  const all = await Contact.find({ source: 'synthetic' }).select('_id owner phone').lean();
  const byPhone = new Map(customers.map((c) => [normalizePhone(c.phone), c._id]));
  const links = all.filter((c) => byPhone.has(c.phone) && String(byPhone.get(c.phone)) !== String(c.owner));
  if (links.length) {
    await Contact.bulkWrite(
      links.map((c) => ({ updateOne: { filter: { _id: c._id }, update: { $set: { joinedUser: byPhone.get(c.phone) } } } }))
    );
  }

  const stored = await Contact.countDocuments({ source: 'synthetic' });
  logger.info(`[seed:contacts] ${customers.length} customers × ${perUser} → ${stored} stored (${links.length} matched to accounts).`);
  await disconnectDB();
  process.exit(0);
}

run().catch((err) => {
  logger.error(`Contact seed failed: ${err.message}`, { stack: err.stack });
  process.exit(1);
});
