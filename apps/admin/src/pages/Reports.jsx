import { useQuery } from '@tanstack/react-query';
import {
  PageHeader, Card, StatCard, Table, Badge, StarRating,
  QueryBoundary, LoadingScreen, EmptyState,
  inr, vehicleLabel, RIDE_STATUS_META,
} from '@yatracab/ui';
import { BarChart3, IndianRupee, CheckCircle2, Navigation, Trophy, MapPin } from 'lucide-react';
import { api } from '../api.js';

export default function Reports() {
  const revenueQuery = useQuery({ queryKey: ['report-revenue'], queryFn: () => api.get('/admin/reports/revenue?days=30') });
  const ridesQuery = useQuery({ queryKey: ['report-rides'], queryFn: () => api.get('/admin/reports/rides') });
  const boardsQuery = useQuery({ queryKey: ['report-leaderboards'], queryFn: () => api.get('/admin/reports/leaderboards') });

  return (
    <div className="space-y-8">
      <PageHeader icon={BarChart3} title="Reports" subtitle="Revenue, ride trends and top performers." />

      {/* Revenue */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink-900">Revenue (last 30 days)</h2>
        <QueryBoundary query={revenueQuery} loading={<LoadingScreen label="Loading revenue…" />}>
          {(data) => {
            const series = data.series || [];
            const max = Math.max(1, ...series.map((d) => d.fees || 0));
            return (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <StatCard icon={IndianRupee} label="Total fee revenue" value={inr(data.totals?.fees)} sub={`${data.days ?? 30}-day window`} tone="success" />
                  <StatCard icon={CheckCircle2} label="Paid bookings" value={data.totals?.count ?? 0} sub="fee-paying rides" tone="accent" />
                </div>
                <Card className="p-5">
                  <p className="mb-4 text-sm font-medium text-ink-600">Daily fee revenue</p>
                  {series.length === 0 ? (
                    <EmptyState icon={BarChart3} title="No revenue data" message="Data will appear as bookings are paid." />
                  ) : (
                    <div className="flex h-48 items-end gap-1 overflow-x-auto">
                      {series.map((d) => (
                        <div key={d.date} className="group flex min-w-[10px] flex-1 flex-col items-center justify-end" title={`${d.date}: ${inr(d.fees)} · ${d.count} rides`}>
                          <div
                            className="w-full rounded-t bg-accent/80 transition-all group-hover:bg-accent"
                            style={{ height: `${Math.max(2, ((d.fees || 0) / max) * 100)}%` }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {series.length > 0 && (
                    <div className="mt-2 flex justify-between text-xs text-ink-400">
                      <span>{series[0]?.date}</span>
                      <span>{series[series.length - 1]?.date}</span>
                    </div>
                  )}
                </Card>
              </div>
            );
          }}
        </QueryBoundary>
      </section>

      {/* Rides breakdown */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink-900">Rides breakdown</h2>
        <QueryBoundary query={ridesQuery} loading={<LoadingScreen label="Loading ride stats…" />}>
          {(data) => {
            const byStatus = data.byStatus || {};
            const byMode = data.byMode || {};
            // Backend may return a 0–1 fraction or an already-scaled percentage.
            const rawRate = Number(data.cancellationRate || 0);
            const cancelPct = Math.round(rawRate <= 1 ? rawRate * 100 : rawRate);
            return (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <StatCard icon={Navigation} label="Total rides" value={data.total ?? 0} tone="accent" />
                  <StatCard icon={CheckCircle2} label="Completed" value={data.completed ?? 0} tone="success" />
                  <StatCard icon={BarChart3} label="Cancellation rate" value={`${cancelPct}%`} tone="danger" />
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card className="p-5">
                    <p className="mb-3 text-sm font-medium text-ink-600">By status</p>
                    <div className="space-y-2">
                      {Object.keys(byStatus).length === 0 ? (
                        <p className="text-sm text-ink-400">No data.</p>
                      ) : (
                        Object.entries(byStatus).map(([status, count]) => (
                          <div key={status} className="flex items-center justify-between text-sm">
                            <Badge tone={RIDE_STATUS_META[status]?.tone || 'neutral'}>{RIDE_STATUS_META[status]?.label || status}</Badge>
                            <span className="font-semibold text-ink-900">{count}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                  <Card className="p-5">
                    <p className="mb-3 text-sm font-medium text-ink-600">By mode</p>
                    <div className="space-y-2">
                      {Object.keys(byMode).length === 0 ? (
                        <p className="text-sm text-ink-400">No data.</p>
                      ) : (
                        Object.entries(byMode).map(([mode, count]) => (
                          <div key={mode} className="flex items-center justify-between text-sm">
                            <Badge tone={mode === 'bidding' ? 'info' : 'accent'}>{mode === 'bidding' ? 'Bidding' : 'Fixed'}</Badge>
                            <span className="font-semibold text-ink-900">{count}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            );
          }}
        </QueryBoundary>
      </section>

      {/* Leaderboards */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink-900">Leaderboards</h2>
        <QueryBoundary query={boardsQuery} loading={<LoadingScreen label="Loading leaderboards…" />}>
          {(data) => (
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-ink-600"><Trophy size={15} className="text-warning" /> Top drivers</p>
                <Table
                  rowKey={(d, i) => i}
                  data={data.topDrivers || []}
                  empty="No drivers yet"
                  columns={[
                    { key: 'name', header: 'Driver', render: (d) => <span className="font-medium text-ink-900">{d.user?.name || '—'}</span> },
                    { key: 'vehicle', header: 'Vehicle', render: (d) => vehicleLabel(d.vehicle?.type) },
                    { key: 'rides', header: 'Rides', align: 'right', render: (d) => d.completedRides ?? 0 },
                    { key: 'rating', header: 'Rating', align: 'right', render: (d) => <StarRating value={d.rating || 0} /> },
                  ]}
                />
              </div>
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-ink-600"><MapPin size={15} className="text-accent" /> Popular routes</p>
                {(data.popularRoutes || []).length === 0 ? (
                  <EmptyState icon={MapPin} title="No route data" message="Popular routes will appear here." />
                ) : (
                  <div className="space-y-2">
                    {data.popularRoutes.map((r, i) => (
                      <Card key={i} className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-medium text-ink-900">{r.destination}</p>
                          <p className="text-xs text-ink-500">from {r.origin}</p>
                        </div>
                        <Badge tone="accent">{r.rides} rides</Badge>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </QueryBoundary>
      </section>
    </div>
  );
}
