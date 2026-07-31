import { useQuery } from '@tanstack/react-query';
import {
  Card, CardHeader, CardBody, StatCard, PageHeader, QueryBoundary, LoadingScreen, EmptyState,
  inr, formatDate,
} from '@yatracab/ui';
import { IndianRupee, TrendingUp, CheckCircle2, Trophy, Wallet, Info } from 'lucide-react';
import { api } from '../api.js';

export default function Earnings() {
  const query = useQuery({ queryKey: ['driver-earnings-page'], queryFn: () => api.get('/driver/earnings').then((r) => r.earnings) });

  return (
    <div className="animate-fade-in">
      <PageHeader icon={Wallet} title="Earnings" subtitle="Fares are collected in cash — YatraCab keeps only the customer's advance fee." />

      <QueryBoundary query={query} loading={<LoadingScreen label="Loading earnings…" />}>
        {(e) => (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon={IndianRupee} label="Total cash earned" value={inr(e.totalCash)} tone="success" />
              <StatCard icon={TrendingUp} label="This week" value={inr(e.thisWeek)} tone="accent" />
              <StatCard icon={CheckCircle2} label="Completed rides" value={e.completedRides} tone="info" />
              <StatCard icon={Trophy} label="Loyalty points" value={e.loyaltyPoints} tone="warning" />
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-info-soft p-4 text-sm text-info">
              <Info size={16} className="mt-0.5 shrink-0" />
              You keep 100% of the ride fare in cash. The customer pays only a small Booking &amp; Safety Fee online to YatraCab.
            </div>

            <Card>
              <CardHeader title="Recent completed rides" icon={CheckCircle2} />
              <CardBody className="p-0">
                {e.recent?.length ? (
                  <div className="divide-y divide-ink-50">
                    {e.recent.map((r) => (
                      <div key={r._id} className="flex items-center justify-between px-5 py-3.5">
                        <div>
                          <p className="font-medium text-ink-800">{r.destination}</p>
                          <p className="text-xs text-ink-400">{formatDate(r.completedAt)}</p>
                        </div>
                        <p className="font-semibold text-success">{inr(r.fareAmount)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-5"><EmptyState icon={Wallet} title="No earnings yet" message="Completed rides and their cash fares will appear here." /></div>
                )}
              </CardBody>
            </Card>
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
