import crypto from 'crypto';
import {
  SosAlert,
  LocationShare,
  Ride,
  Driver,
  notify,
  catchAsync,
  ApiError,
  ok,
  created,
} from '@yatracab/core';
import { emitToUser } from '../../realtime.js';

// POST /customer/safety/sos { rideId?, lat, lng, note }
export const raiseSos = catchAsync(async (req, res) => {
  const { rideId, lat, lng, note } = req.body;
  const alert = await SosAlert.create({
    user: req.user._id,
    ride: rideId,
    location: lat != null && lng != null ? { lat, lng } : undefined,
    note,
  });

  // Alert the emergency contact (mock), the driver, and ops.
  if (req.user.emergencyContact) {
    notify(req.user._id, { title: 'SOS sent', body: `Your emergency contact ${req.user.emergencyContact} has been alerted with your location.` });
  }
  if (rideId) {
    const ride = await Ride.findById(rideId).select('driver');
    if (ride?.driver) {
      const driver = await Driver.findById(ride.driver).select('user');
      if (driver) emitToUser(String(driver.user), 'safety:sos', { rideId, at: Date.now() });
    }
  }
  return created(res, { alert, message: 'SOS raised. Stay safe — help has been alerted.' });
});

// POST /customer/safety/share { rideId }  → shareable live-tracking link
export const createShare = catchAsync(async (req, res) => {
  const ride = await Ride.findOne({ _id: req.body.rideId, customer: req.user._id });
  if (!ride) throw ApiError.notFound('Ride not found');

  const token = crypto.randomBytes(12).toString('hex');
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12h
  await LocationShare.create({ ride: ride._id, sharer: req.user._id, token, expiresAt });

  return created(res, {
    token,
    expiresAt,
    // The frontend builds the full URL; this is the path a recipient opens.
    trackPath: `/track/${token}`,
    message: 'Share this link with your family to track the trip live.',
  });
});
