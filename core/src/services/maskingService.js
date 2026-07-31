import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

/**
 * Number masking (anti-bypass core feature). The client can only ask to
 * "connect me to my driver/customer"; it never receives a real number.
 *
 * In this build a MOCK ExoPhone is returned. Wire Exotel's connect API here
 * (server-side) when going live — real numbers must never reach the browser
 * or be logged in plaintext.
 */
const EXOPHONE = env.exotel?.callerId || '+91 80 4718 4718';

export async function connectCall({ fromUserId, toUserId }) {
  // Real impl: look up both numbers by id, call Exotel connect with ExoPhone.
  logger.info(`[masking] bridging call ${fromUserId} → ${toUserId} via ExoPhone`);
  return {
    virtualNumber: EXOPHONE,
    status: 'connecting',
    message: 'Connecting your call through a masked YatraCab number…',
  };
}
