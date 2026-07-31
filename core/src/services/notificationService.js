import { logger } from '../utils/logger.js';

/**
 * Single notification abstraction over push (FCM) + SMS/email. Mocked in this
 * build (logs the intent); swap real transports behind the same signature.
 *
 * Triggers: booking confirmation, driver assignment, new bid, ride reminders,
 * cancellation/refund status.
 */
export async function notify(userId, { title, body, data = {} } = {}) {
  logger.info(`[notify] → user ${userId}: ${title} — ${body}`, data);
  return { queued: true };
}

export async function notifyMany(userIds = [], payload) {
  await Promise.all(userIds.map((id) => notify(id, payload)));
  return { queued: userIds.length };
}
