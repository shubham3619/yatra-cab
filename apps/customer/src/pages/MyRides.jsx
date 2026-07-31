import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Card, Badge, StatusBadge, Segmented, QueryBoundary, EmptyState, LoadingScreen,
  inr, formatDateTime, vehicleLabel, RIDE_STATUS_META,
} from '@yatracab/ui';
import { ScrollText, MapPin, ChevronRight, Car } from 'lucide-react';
import { api } from '../api.js';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];
const ACTIVE = ['pending_payment', 'searching', 'confirmed', 'ongoing'];

export default function MyRides() {
  const [filter, setFilter] = useState('all');
  const query = useQuery({ queryKey: ['my-rides'], queryFn: () => api.get('/customer/rides?limit=50').then((r) => r.rides) });

  const filtered = (rides) =>
    rides.filter((r) => (filter === 'all' ? true : filter === 'active' ? ACTIVE.includes(r.status) : r.status === 'completed'));

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">My rides</h1>
          <p className="text-sm text-ink-500">Your bookings and Ride Alerts.</p>
        </div>
        <Segmented value={filter} onChange={setFilter} options={FILTERS} />
      </div>

      <QueryBoundary
        query={query}
        loading={<LoadingScreen label="Loading your rides…" />}
        isEmpty={(d) => !filtered(d).length}
        empty={<EmptyState icon={ScrollText} title="No rides yet" message="Book a fixed-route ride or post a Ride Alert to get started." />}
      >
        {(rides) => (
          <div className="space-y-3">
            {filtered(rides).map((r) => (
              <Link key={r._id} to={`/rides/${r._id}`}>
                <Card hover className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                      <MapPin size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-ink-900">{r.destination || r.route?.destination}</p>
                        <StatusBadge meta={RIDE_STATUS_META[r.status]} />
                      </div>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-500">
                        <span className="inline-flex items-center gap-1"><Car size={12} /> {vehicleLabel(r.vehicleType)}</span>
                        <span>·</span>
                        <span>{formatDateTime(r.scheduledAt)}</span>
                        <span>·</span>
                        <Badge tone={r.mode === 'bidding' ? 'info' : 'accent'}>{r.mode === 'bidding' ? 'Bidding' : 'Fixed'}</Badge>
                      </p>
                    </div>
                    <div className="text-right">
                      {r.totalAmount > 0 && <p className="font-semibold text-ink-900">{inr(r.totalAmount)}</p>}
                      <ChevronRight size={16} className="ml-auto mt-1 text-ink-300" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
