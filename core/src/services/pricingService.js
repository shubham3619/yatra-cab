import { env } from '../config/env.js';

/** Round to whole rupees. */
const inr = (n) => Math.round(n);

/** Booking & Safety Fee for a given fare. */
export function computeFee(fareAmount, feePercent = env.business.feePercent) {
  return inr((fareAmount * feePercent) / 100);
}

/** Pay-to-Connect commission charged to the driver's wallet on accept. */
export function computeCommission(fareAmount, percent = env.business.commissionPercent) {
  return { percent, amount: inr((fareAmount * percent) / 100) };
}

/** Total fare for a seat-share booking. */
export function seatShareFare(perSeatFare, seats = 1) {
  return inr(perSeatFare * seats);
}

/**
 * Full money breakdown shown to the customer.
 * @returns {{ fareAmount, feeAmount, totalAmount, feePercent }}
 */
export function priceBreakdown(fareAmount, feePercent = env.business.feePercent, surge = 1) {
  const fare = inr(fareAmount * (surge || 1));
  const fee = computeFee(fare, feePercent);
  return { fareAmount: fare, feeAmount: fee, totalAmount: fare + fee, feePercent };
}

/** Fixed fare for a route + vehicle, with the route's surge applied. */
export function fixedFareForRoute(route, vehicleType) {
  const base = route?.fixedFare?.[vehicleType] || 0;
  return priceBreakdown(base, route.feePercent, route.surgeMultiplier);
}

// ── Distance-based dynamic pricing (point-to-point trips) ───────────────────
// Per-vehicle base + per-km rates (INR). A round trip applies a return factor
// (< 2× because the driver isn't paid full idle return). Tune here or via env.
export const FARE_RATES = {
  hatchback: { base: 400, perKm: 8 },
  sedan: { base: 500, perKm: 9 },
  suv: { base: 700, perKm: 12 },
  tempo: { base: 1000, perKm: 18 },
};
const ROUND_TRIP_FACTOR = 1.8;
const AVG_SPEED_KMPH = 45;

const toRad = (d) => (d * Math.PI) / 180;

/** Great-circle distance in km between two {lat,lng} points. */
export function haversineKm(a, b) {
  if (a?.lat == null || a?.lng == null || b?.lat == null || b?.lng == null) return 0;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export const estimatedMinutes = (distanceKm) => Math.max(5, Math.round((distanceKm / AVG_SPEED_KMPH) * 60));

/** Estimated one-vehicle fare for a distance + trip type (rounded to ₹10). */
export function estimateFareByDistance(distanceKm, vehicleType, tripType = 'round_trip') {
  const r = FARE_RATES[vehicleType] || FARE_RATES.sedan;
  let fare = r.base + r.perKm * distanceKm;
  if (tripType === 'round_trip') fare *= ROUND_TRIP_FACTOR;
  fare = Math.max(fare, r.base * 2); // minimum fare
  return Math.round(fare / 10) * 10;
}

/**
 * Full money breakdown for a point-to-point trip.
 * @returns {{ distanceKm, estimatedMins, fareAmount, feeAmount, totalAmount, feePercent }}
 */
export function quoteByDistance({ pickup, drop, vehicleType, tripType = 'round_trip', feePercent = env.business.feePercent }) {
  const distanceKm = Math.round(haversineKm(pickup, drop) * 10) / 10;
  const fare = estimateFareByDistance(distanceKm, vehicleType, tripType);
  return { distanceKm, estimatedMins: estimatedMinutes(distanceKm), ...priceBreakdown(fare, feePercent) };
}

/**
 * Refund policy (TRD §9.3): the online fee is refunded minus a processing
 * fee if cancelled inside the free-cancel window; forfeited if later. Driver
 * no-show → full refund (handled by the caller passing reason='driver_no_show').
 *
 * @returns {{ refundAmount:number, forfeited:number, reasonLabel:string }}
 */
export function computeRefund({ feeAmount, scheduledAt, now = new Date(), by = 'customer', reason }) {
  if (reason === 'driver_no_show' || by === 'driver') {
    return { refundAmount: feeAmount, forfeited: 0, reasonLabel: 'Driver no-show — full refund' };
  }
  const hoursBefore = (new Date(scheduledAt).getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursBefore >= env.business.freeCancelWindowHours) {
    const processing = Math.min(env.business.cancelProcessingFee, feeAmount);
    return {
      refundAmount: Math.max(0, feeAmount - processing),
      forfeited: processing,
      reasonLabel: `Free-cancel window — refund minus ₹${processing} processing`,
    };
  }
  return { refundAmount: 0, forfeited: feeAmount, reasonLabel: 'Late cancellation — advance forfeited' };
}
