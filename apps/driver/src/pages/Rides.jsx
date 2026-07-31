import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Card, StatusBadge, Segmented, QueryBoundary, LoadingScreen, EmptyState, Avatar,
  inr, formatDateTime, vehicleLabel, RIDE_STATUS_META,
} from '@yatracab/ui';
import { Route as RouteIcon, ChevronRight, MapPin } from 'lucide-react';
import { api } from '../api.js';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];
const ACTIVE = ['confirmed', 'ongoing'];

export default function Rides() {
  const [filter, setFilter] = useState('all');
  const query = useQuery({ queryKey: ['driver-rides'], queryFn: () => api.get('/driver/rides?limit=50').then((r) => r.rides) });

  const apply = (rides) =>
    rides.filter((r) => (filter === 'all' ? true : filter === 'active' ? ACTIVE.includes(r.status) : r.status === 'completed'));

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">My assignments</h1>
          <p className="text-sm text-ink-500">Rides assigned to you.</p>
        </div>
        <Segmented value={filter} onChange={setFilter} options={FILTERS} />
      </div>

      <QueryBoundary
        query={query}
        loading={<LoadingScreen label="Loading rides…" />}
        isEmpty={(d) => !apply(d).length}
        empty={<EmptyState icon={RouteIcon} title="No rides here" message="Win a bid or get a fixed-route assignment to see rides." />}
      >
        {(rides) => (
          <div className="space-y-3">
            {apply(rides).map((r) => (
              <Link key={r._id} to={`/rides/${r._id}`}>
                <Card hover className="flex items-center gap-4 p-4">
                  <Avatar name={r.customer?.name} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-ink-900 inline-flex items-center gap-1"><MapPin size={13} className="text-accent" />{r.destination || r.route?.destination}</p>
                      <StatusBadge meta={RIDE_STATUS_META[r.status]} />
                    </div>
                    <p className="mt-0.5 text-xs text-ink-500">{r.customer?.name} · {formatDateTime(r.scheduledAt)} · {vehicleLabel(r.vehicleType)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-ink-900">{inr(r.fareAmount)}</p>
                    <ChevronRight size={16} className="ml-auto mt-1 text-ink-300" />
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
