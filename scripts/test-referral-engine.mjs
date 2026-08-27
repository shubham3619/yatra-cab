import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const dir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(dir, '../.env') });

const { User, Ride, Referral, ReferralEarning, payCustomerRideCommission } =
  await import(path.resolve(dir, '../core/src/index.js'));

await mongoose.connect(process.env.MONGODB_URI);

let pass = 0, fail = 0;
const check = (name, got, want) => {
  const okk = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${okk ? '  PASS' : '  FAIL'}  ${name}${okk ? '' : `  got=${JSON.stringify(got)} want=${JSON.stringify(want)}`}`);
  okk ? pass++ : fail++;
};

const TAG = 'MLMTEST';
const cleanup = async () => {
  const us = await User.find({ name: new RegExp(`^${TAG}`) }).select('_id').lean();
  const ids = us.map(u => u._id);
  await Promise.all([
    ReferralEarning.deleteMany({ beneficiary: { $in: ids } }),
    Ride.deleteMany({ customer: { $in: ids } }),
    Referral.deleteMany({ $or: [{ referrer: { $in: ids } }, { referred: { $in: ids } }] }),
    User.deleteMany({ _id: { $in: ids } }),
  ]);
};
await cleanup();

let seq = 0;
const mkUser = async (label, referredBy) => User.create({
  name: `${TAG}-${label}`, phone: `9${String(Date.now()).slice(-8)}${String(seq++).padStart(3, '0')}`, role: 'customer', referredBy,
});
const mkRide = async (customer, { commission = 100, status = 'completed', ago = 0 } = {}) => Ride.create({
  customer, pickup: { address: 'A' }, drop: { address: 'B' },
  status, completedAt: new Date(Date.now() - ago),
  feeAmount: commission, fareAmount: 1000, totalAmount: 1100,
  scheduledAt: new Date(), vehicleType: 'sedan', tripType: 'one_way', mode: 'fixed',
});

console.log('\n── T1: full 3-level chain, commission ₹100 ──');
// A -> B -> C -> D   (D rides; C is L1, B is L2, A is L3)
const A = await mkUser('A');
const B = await mkUser('B', A._id);
const C = await mkUser('C', B._id);
const D = await mkUser('D', C._id);
await Referral.create({ referrer: C._id, referred: D._id, role: 'customer', ridesCounted: 0 });
// uplines must be active riders
for (const u of [A, B, C]) await mkRide(u._id, { ago: 2 * 24 * 3600 * 1000 });

const ride1 = await mkRide(D._id, { commission: 100 });
const r1 = await payCustomerRideCommission(ride1);
check('pool = 20% of ₹100', r1.pool, 20);
check('L1 (C) = 75% of pool', r1.payouts.find(p => p.level === 1)?.points, 15);
check('L2 (B) = 19% of pool', r1.payouts.find(p => p.level === 2)?.points, 4);
check('L3 (A) = 6% of pool', r1.payouts.find(p => p.level === 3)?.points, 1);
check('chain spent = pool', r1.chainSpent, 20);
check('rider cashback = 10% base', r1.cashback, 10);
check('pool conserved (chain + leftover)', r1.chainSpent + (r1.cashback - 10), 20);

const [a, b, c, d] = await Promise.all([A, B, C, D].map(u => User.findById(u._id).select('points').lean()));
check('A points credited', a.points, 1);
check('B points credited', b.points, 4);
check('C points credited', c.points, 15);
check('D points credited', d.points, 10);

console.log('\n── T2: idempotency (re-run same ride) ──');
const again = await payCustomerRideCommission(ride1);
check('second call returns null', again, null);
const c2 = await User.findById(C._id).select('points').lean();
check('no double credit', c2.points, 15);

console.log('\n── T3: inactive upline → share rolls to rider ──');
const E = await mkUser('E');            // no rides ⇒ inactive
const F = await mkUser('F', E._id);
await Referral.create({ referrer: E._id, referred: F._id, role: 'customer', ridesCounted: 0 });
const ride3 = await mkRide(F._id, { commission: 100 });
const r3 = await payCustomerRideCommission(ride3);
check('inactive upline earns nothing', r3.payouts.length, 0);
check('whole pool returns to rider', r3.cashback, 30); // 10 base + 20 pool

console.log('\n── T4: earning window closes after N rides ──');
const G = await mkUser('G');
const H = await mkUser('H', G._id);
await mkRide(G._id, { ago: 1 * 24 * 3600 * 1000 });
await Referral.create({ referrer: G._id, referred: H._id, role: 'customer', ridesCounted: 25 });
const ride4 = await mkRide(H._id, { commission: 100 });
const r4 = await payCustomerRideCommission(ride4);
check('closed window pays no chain', r4.chainSpent, 0);
check('closed window: pool to rider', r4.cashback, 30);

console.log('\n── T5: referral cycle is safe ──');
const X = await mkUser('X');
const Y = await mkUser('Y', X._id);
await User.updateOne({ _id: X._id }, { referredBy: Y._id }); // X <-> Y cycle
await mkRide(X._id, { ago: 1 * 24 * 3600 * 1000 });
await mkRide(Y._id, { ago: 1 * 24 * 3600 * 1000 });
const ride5 = await mkRide(Y._id, { commission: 100 });
const r5 = await payCustomerRideCommission(ride5);
check('cycle terminates, pool respected', r5.chainSpent <= 20, true);

console.log('\n── T6: monthly cap ──');
const P = await mkUser('P');
const Q = await mkUser('Q', P._id);
await mkRide(P._id, { ago: 1 * 24 * 3600 * 1000 });
await Referral.create({ referrer: P._id, referred: Q._id, role: 'customer', ridesCounted: 0 });
// pre-load P with earnings just under the ₹1000 cap
await ReferralEarning.create({ ride: new mongoose.Types.ObjectId(), beneficiary: P._id, source: Q._id, level: 1, points: 995 });
const ride6 = await mkRide(Q._id, { commission: 100 });
const r6 = await payCustomerRideCommission(ride6);
check('award clipped to remaining cap', r6.payouts.find(p => p.level === 1)?.points, 5);
check('clipped remainder to rider', r6.cashback, 10 + (20 - 5));

console.log('\n── T7: zero commission is a no-op ──');
const Z = await mkUser('Z');
const rideZ = await mkRide(Z._id, { commission: 0 });
check('no payout without commission', await payCustomerRideCommission(rideZ), null);

await cleanup();
await mongoose.disconnect();
console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
