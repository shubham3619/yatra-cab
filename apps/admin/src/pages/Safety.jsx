import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PageHeader, Card, StatCard, StatusBadge, Button,
  QueryBoundary, LoadingScreen, EmptyState,
  relativeTime, toast,
} from '@yatracab/ui';
import { ShieldAlert, MapPin, Phone, Navigation, Car, CheckCircle2 } from 'lucide-react';
import { api } from '../api.js';

const STATUS_META = {
  active: { label: 'Active', tone: 'danger' },
  resolved: { label: 'Resolved', tone: 'neutral' },
};

export default function Safety() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['safety-sos'],
    queryFn: () => api.get('/admin/safety/sos'),
    refetchInterval: 10000,
  });

  const resolve = useMutation({
    mutationFn: (id) => api.patch(`/admin/safety/sos/${id}/resolve`),
    onSuccess: () => {
      toast.success('SOS alert marked resolved');
      qc.invalidateQueries({ queryKey: ['safety-sos'] });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader icon={ShieldAlert} title="Safety" subtitle="Live SOS alerts raised by riders and drivers." />

      <QueryBoundary query={query} loading={<LoadingScreen label="Loading SOS board…" />}>
        {(data) => {
          const alerts = data.alerts || [];
          const activeCount = data.activeCount ?? alerts.filter((a) => a.status === 'active').length;
          // Active first, then most recent.
          const ordered = [...alerts].sort((a, b) => {
            if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
          });

          return (
            <div className="space-y-6">
              {activeCount > 0 ? (
                <div className="flex flex-col gap-3 rounded-2xl border border-danger/25 bg-danger-soft p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-danger">
                      <ShieldAlert size={20} />
                    </span>
                    <div>
                      <p className="font-semibold text-ink-900">{activeCount} active SOS alert{activeCount > 1 ? 's' : ''} need attention</p>
                      <p className="text-sm text-ink-600">Contact the person immediately and coordinate a response, then mark it resolved.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <StatCard icon={ShieldAlert} label="Active SOS alerts" value={0} sub="all riders and drivers safe" tone="success" />
                </div>
              )}

              {ordered.length === 0 ? (
                <EmptyState icon={ShieldAlert} title="No SOS alerts — all safe" message="Alerts raised from the rider or driver app will appear here in real time." />
              ) : (
                <div className="space-y-3">
                  {ordered.map((a) => {
                    const isActive = a.status === 'active';
                    const driver = a.ride?.driver?.user;
                    return (
                      <Card key={a._id} className={`p-5 ${isActive ? 'border-danger/30' : ''}`}>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusBadge meta={STATUS_META[a.status]} />
                              <span className="text-xs text-ink-400">{relativeTime(a.createdAt)}</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                              <span className="font-semibold text-ink-900">{a.user?.name || 'Unknown rider'}</span>
                              {a.user?.phone && (
                                <span className="inline-flex items-center gap-1.5 text-ink-600">
                                  <Phone size={14} className="text-accent" /> {a.user.phone}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ink-600">
                              {(a.ride?.destination) && (
                                <span className="inline-flex items-center gap-1.5">
                                  <Navigation size={14} className="text-accent" /> {a.ride.destination}
                                </span>
                              )}
                              {driver?.name && (
                                <span className="inline-flex items-center gap-1.5">
                                  <Car size={14} className="text-accent" /> {driver.name}
                                  {driver.phone ? ` · ${driver.phone}` : ''}
                                </span>
                              )}
                              {a.location && (a.location.lat != null) && (
                                <a
                                  href={`https://www.google.com/maps?q=${a.location.lat},${a.location.lng}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 text-accent hover:underline"
                                >
                                  <MapPin size={14} /> {Number(a.location.lat).toFixed(4)}, {Number(a.location.lng).toFixed(4)}
                                </a>
                              )}
                            </div>

                            {a.note && (
                              <p className="rounded-xl bg-ink-50 px-3 py-2 text-sm text-ink-700">{a.note}</p>
                            )}
                          </div>

                          {isActive && (
                            <div className="shrink-0">
                              <Button
                                variant="secondary"
                                icon={CheckCircle2}
                                loading={resolve.isPending && resolve.variables === a._id}
                                onClick={() => resolve.mutate(a._id)}
                              >
                                Mark resolved
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }}
      </QueryBoundary>
    </div>
  );
}
