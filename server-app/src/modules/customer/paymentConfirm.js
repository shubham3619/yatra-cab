import {
  Payment,
  Ride,
  Driver,
  RIDE_STATUS,
  notify,
  logger,
} from '@yatracab/core';
import { emitToRide, emitToUser } from '../../realtime.js';

const otp6 = () => String(Math.floor(100000 + Math.random() * 900000));

/**
 * Turn a successful payment into a confirmed ride.
 *
 * Deliberately shared by the browser callback and the Razorpay webhook. The
 * browser can vanish the moment money leaves the rider's account — tab closed,
 * app killed, phone out of signal on the UPI return leg — and if confirmation
 * only ever ran there, we would hold the money with no ride. The webhook is
 * the authoritative path; the callback just makes it feel instant.
 *
 * Idempotent: whichever arrives second sees `status === 'paid'` and returns the
 * already-confirmed ride instead of assigning a second driver or reissuing the
 * rider's OTP codes.
 *
 * @param {(fn: Function) => Promise<any>} [assignDriver] injected so this file
 *        stays free of the controller's dependency graph.
 */
export async function confirmPaidRide({ payment, ride, paymentId, signature, assignDriver }) {
  if (payment.status === 'paid') {
    logger.info(`[payment] ${payment.orderId} already confirmed — ignoring duplicate`);
    return { ride, alreadyConfirmed: true };
  }

  payment.status = 'paid';
  if (paymentId) payment.paymentId = paymentId;
  if (signature) payment.signature = signature;
  payment.paidAt = new Date();
  await payment.save();

  if (ride.mode === 'fixed' && !ride.driver && assignDriver) {
    const driver = await assignDriver(ride);
    if (driver) ride.driver = driver._id;
  }

  ride.status = RIDE_STATUS.CONFIRMED;
  ride.verification = ride.verification || {};
  if (ride.verification.payment) ride.verification.payment.verifiedAt = new Date();
  // Only mint these once — a webhook arriving after the callback must not hand
  // the rider a new start code while the driver is holding the old one.
  if (!ride.verification.start?.code) ride.verification.start = { code: otp6() };
  if (!ride.verification.end?.code) ride.verification.end = { code: otp6() };
  await ride.save();

  if (ride.driver) {
    const driver = await Driver.findById(ride.driver).select('user');
    if (driver) {
      emitToUser(String(driver.user), 'ride:assigned', { rideId: String(ride._id) });
      notify(driver.user, { title: 'New ride assigned', body: 'A fixed-route ride is confirmed for you.' });
    }
  }
  notify(ride.customer, { title: 'Booking confirmed', body: 'Your advance fee is paid. Have a great trip!' });
  emitToRide(String(ride._id), 'ride:updated', { rideId: String(ride._id), status: ride.status });

  return { ride, alreadyConfirmed: false };
}

/** Look up the ride + payment a gateway event refers to. */
export async function findPaymentContext(orderId) {
  const payment = await Payment.findOne({ orderId });
  if (!payment) return null;
  const ride = await Ride.findById(payment.ride);
  if (!ride) return null;
  return { payment, ride };
}
