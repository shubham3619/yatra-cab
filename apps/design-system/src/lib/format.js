// Shared formatting + status metadata used across all portals.

export const inr = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n || 0));

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const formatDateTime = (d) =>
  d
    ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '—';

export const formatTime = (d) =>
  d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';

export function timeUntil(date) {
  if (!date) return '';
  const ms = new Date(date).getTime() - Date.now();
  if (ms <= 0) return 'closed';
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m left`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m left`;
}

export function relativeTime(date) {
  if (!date) return '';
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

// Ride status → label + tone (drives StatusBadge colors).
export const RIDE_STATUS_META = {
  pending_payment: { label: 'Awaiting payment', tone: 'warning' },
  searching: { label: 'Bidding open', tone: 'info' },
  confirmed: { label: 'Confirmed', tone: 'success' },
  ongoing: { label: 'On the way', tone: 'info' },
  completed: { label: 'Completed', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
  no_show: { label: 'No-show', tone: 'danger' },
};

export const VERIFICATION_META = {
  unsubmitted: { label: 'Not submitted', tone: 'neutral' },
  pending: { label: 'Pending review', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
};

export const vehicleLabel = (t) =>
  ({ hatchback: 'Hatchback', sedan: 'Sedan', suv: 'SUV', tempo: 'Tempo Traveller' }[t] || t);

export const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('') || '?';
