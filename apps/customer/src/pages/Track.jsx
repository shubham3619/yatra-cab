import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Card, CardBody, StatusBadge, ErrorState, LoadingScreen, Logo,
  vehicleLabel, formatDateTime, RIDE_STATUS_META,
} from '@yatracab/ui';
import { Car, MapPin, Radio } from 'lucide-react';
import { api } from '../api.js';

export default function Track() {
  const { token } = useParams();
  const query = useQuery({
    queryKey: ['track', token],
    queryFn: () => api.get(`/shared/track/${token}`, { auth: false }).then((r) => r.trip),
    refetchInterval: 5000,
    retry: false,
  });

  return (
    <div className="min-h-screen bg-ink-100 px-4 py-8">
      <div className="mx-auto max-w-md space-y-5">
        <div className="flex justify-center">
          <Logo mark={Car} name="YatraCab" tagline="Live trip tracking" />
        </div>

        {query.isLoading ? (
          <LoadingScreen label="Loading trip…" />
        ) : query.isError ? (
          <ErrorState
            title="Link unavailable"
            message={query.error?.message || 'This tracking link has expired or is invalid.'}
          />
        ) : (
          <Trip trip={query.data} />
        )}
      </div>
    </div>
  );
}

function Trip({ trip }) {
  const loc = trip.driverLocation;
  return (
    <Card className="animate-fade-in">
      <CardBody className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-accent" />
            </span>
            <h1 className="text-lg font-semibold text-ink-900">Live trip tracking</h1>
          </div>
          <StatusBadge meta={RIDE_STATUS_META[trip.status]} />
        </div>

        {/* Pickup → drop */}
        <div className="rounded-xl border border-ink-100 p-4">
          <div className="flex gap-3">
            <div className="flex flex-col items-center pt-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-accent" />
              <span className="my-1 w-px flex-1 bg-ink-200" />
              <span className="h-2.5 w-2.5 rounded-full border-2 border-accent" />
            </div>
            <div className="flex-1 space-y-3 text-sm">
              <div>
                <p className="text-xs text-ink-400">Pickup</p>
                <p className="font-medium text-ink-800">{trip.pickup?.address || 'To be confirmed'}</p>
              </div>
              <div>
                <p className="text-xs text-ink-400">Drop</p>
                <p className="font-medium text-ink-800">{trip.drop?.address || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Driver location */}
        <div className="relative overflow-hidden rounded-xl border border-accent/20 bg-accent-soft p-5">
          <div className="absolute inset-0 bg-dotted opacity-60" />
          <div className="relative flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-accent">
              <Radio size={18} />
            </span>
            <div>
              <p className="text-sm font-medium text-ink-800">Driver's last known location</p>
              <p className="text-xs text-ink-500">
                {loc?.lat != null ? `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}` : 'Waiting for GPS…'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-ink-50 p-3">
            <p className="flex items-center gap-1 text-xs text-ink-400"><Car size={12} /> Vehicle</p>
            <p className="mt-0.5 font-medium text-ink-800">{vehicleLabel(trip.vehicleType)}</p>
          </div>
          <div className="rounded-xl bg-ink-50 p-3">
            <p className="flex items-center gap-1 text-xs text-ink-400"><MapPin size={12} /> Scheduled</p>
            <p className="mt-0.5 font-medium text-ink-800">{formatDateTime(trip.scheduledAt)}</p>
          </div>
        </div>

        <p className="text-center text-xs text-ink-400">This live link was shared with you by the rider. Updates every few seconds.</p>
      </CardBody>
    </Card>
  );
}
