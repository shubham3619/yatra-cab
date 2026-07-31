import { logger } from '../utils/logger.js';

/**
 * Live delay tracking for train/flight arrivals. Mocked here — returns a
 * pseudo delay derived from the transport number so it's stable per number.
 * Swap for a real rail/aviation API (e.g. RailwayAPI / AviationStack) behind
 * this same signature.
 */
export async function fetchArrivalDelay({ type, number }) {
  if (!type || type === 'none' || !number) return { delayMins: 0, source: 'none' };
  // Deterministic pseudo-delay: 0–75 min based on the digits in the number.
  const digits = String(number).replace(/\D/g, '') || '0';
  const seed = digits.split('').reduce((a, c) => a + Number(c), 0);
  const delayMins = (seed * 7) % 80; // 0..79
  logger.info(`[delay] ${type} ${number} → +${delayMins}m (mock)`);
  return { delayMins, source: 'mock' };
}
