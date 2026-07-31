import { requireAuth, allow } from '@yatracab/core';

// Every admin API route (except health + auth) must be an authenticated admin.
// Kept as an explicit named guard so the hardened intent is obvious.
export const adminGuard = [requireAuth, allow('admin')];
