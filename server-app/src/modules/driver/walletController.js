import {
  Driver,
  Ride,
  RIDE_STATUS,
  getWallet as walletState,
  topup as walletTopup,
  debit as walletDebit,
  notify,
  catchAsync,
  ApiError,
  ok,
} from '@yatracab/core';
import { emitToRide, emitToUser } from '../../realtime.js';

async function myDriver(req) {
  const driver = await Driver.findOne({ user: req.user._id });
  if (!driver) throw ApiError.notFound('Driver profile not found');
  return driver;
}

// GET /driver/wallet
export const getWallet = catchAsync(async (req, res) => {
  const driver = await myDriver(req);
  const wallet = await walletState(driver._id);
  return ok(res, { wallet });
});

// POST /driver/wallet/topup { amount }  (mock gateway)
export const topupWallet = catchAsync(async (req, res) => {
  const driver = await myDriver(req);
  const { balance, txn } = await walletTopup(driver._id, req.body.amount);
  return ok(res, { balance, txn, message: `₹${req.body.amount} added to your wallet` });
});

// POST /driver/rides/:id/settle-commission
// Used when a ride was accepted but the wallet was short — driver tops up then
// settles here to unlock the customer's contact (Pay-to-Connect).
export const settleCommission = catchAsync(async (req, res) => {
  const driver = await myDriver(req);
  const ride = await Ride.findOne({ _id: req.params.id, driver: driver._id }).populate('customer', 'name');
  if (!ride) throw ApiError.notFound('Ride not found');
  if (ride.commission?.status === 'charged' && ride.contactUnlocked) {
    return ok(res, { ride, message: 'Already connected' });
  }
  if (ride.commission?.status !== 'pending') throw ApiError.badRequest('No commission due for this ride');

  const result = await walletDebit(driver._id, ride.commission.amount, 'commission', { ride: ride._id, note: 'Pay-to-Connect commission' });
  if (!result.ok) {
    throw ApiError.badRequest(`Low wallet balance. Add ₹${result.shortBy} to connect with the customer.`);
  }

  ride.commission.status = 'charged';
  ride.contactUnlocked = true;
  await ride.save();

  emitToUser(String(ride.customer._id), 'ride:connected', { rideId: String(ride._id) });
  emitToRide(String(ride._id), 'ride:updated', { rideId: String(ride._id), status: ride.status });
  notify(ride.customer._id, { title: 'Driver connected', body: 'Your driver is confirmed — you can now contact each other.' });

  return ok(res, { ride, balance: result.balance, message: 'Commission paid — contact unlocked' });
});
