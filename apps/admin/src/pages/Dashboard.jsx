import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  PageHeader, StatCard, Table, Badge, StatusBadge, Button,
  QueryBoundary, LoadingScreen, EmptyState,
  inr, formatDateTime, RIDE_STATUS_META,
} from '@yatracab/ui';
import {
  LayoutDashboard, Car, UserCheck, Users, Navigation, Activity,
  IndianRupee, BadgeCheck, ArrowRight, ShieldAlert,
} from 'lucide-react';
import { api } from '../api.js';

export default function Dashboard() {
  const query = useQuery({ queryKey: ['dashboard'], queryFn: () => api.get('/admin/dashboard') });
  const sosQuery = useQuery({
    queryKey: ['safety-sos'],
    queryFn: () => api.get('/admin/safety/sos'),
    refetchInterval: 10000,
  });
  const activeSos = sosQuery.data?.activeCount ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader icon={LayoutDashboard} title="Dashboard" subtitle="Live snapshot of YatraCab operations." />

      {activeSos > 0 && (
        <Link
          to="/safety"
          className="flex items-center gap-2.5 rounded-full border border-danger/25 bg-danger-soft px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
        >
          <ShieldAlert size={16} />
          <span>{activeSos} active SOS alert{activeSos > 1 ? 's' : ''} — review now</span>
          <ArrowRight size={15} className="ml-auto" />
        </Link>
      )}

      <QueryBoundary query={query} loading={<LoadingScreen label="Loading dashboard…" />}>
        {(data) => {
          const s = data.stats || {};
          const drivers = s.drivers || {};
          const rides = s.rides || {};
          const revenue = s.revenue || {};
          const recent = data.recentRides || [];

          return (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <StatCard icon={Car} label="Drivers online" value={drivers.online ?? 0} sub={`${drivers.approved ?? 0} approved · ${drivers.total ?? 0} total`} tone="success" />
                <StatCard icon={UserCheck} label="Pending verification" value={drivers.pending ?? 0} sub="drivers awaiting review" tone="warning" />
                <StatCard icon={Users} label="Riders" value={s.customers ?? 0} sub="registered riders" tone="info" />
                <StatCard icon={Navigation} label="Rides today" value={rides.today ?? 0} sub={`${rides.total ?? 0} all-time`} tone="accent" />
                <StatCard icon={Activity} label="Ongoing rides" value={rides.ongoing ?? 0} sub={`${rides.completed ?? 0} completed · ${rides.cancelled ?? 0} cancelled`} tone="info" />
                <StatCard icon={IndianRupee} label="Fee revenue" value={inr(revenue.totalFees)} sub={`${revenue.paidCount ?? 0} paid · ${revenue.refundedCount ?? 0} refunded`} tone="success" />
              </div>

              {drivers.pending > 0 && (
                <div className="flex flex-col gap-3 rounded-2xl border border-warning/25 bg-warning-soft p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-warning">
                      <BadgeCheck size={20} />
                    </span>
                    <div>
                      <p className="font-semibold text-ink-900">{drivers.pending} driver{drivers.pending > 1 ? 's' : ''} awaiting verification</p>
                      <p className="text-sm text-ink-600">Review documents to let approved drivers start accepting rides.</p>
                    </div>
                  </div>
                  <Link to="/verification">
                    <Button icon={ArrowRight}>Review queue</Button>
                  </Link>
                </div>
              )}

              <div>
                <h2 className="mb-3 text-lg font-semibold text-ink-900">Recent rides</h2>
                {recent.length === 0 ? (
                  <EmptyState icon={Navigation} title="No rides yet" message="New bookings will show up here." />
                ) : (
                  <Table
                    rowKey={(r) => r._id}
                    data={recent}
                    columns={[
                      { key: 'destination', header: 'Destination', render: (r) => (
                        <span className="font-medium text-ink-900">{r.destination || r.route?.destination || '—'}</span>
                      ) },
                      { key: 'customer', header: 'Customer', render: (r) => r.customer?.name || '—' },
                      { key: 'mode', header: 'Mode', render: (r) => (
                        <Badge tone={r.mode === 'bidding' ? 'info' : 'accent'}>{r.mode === 'bidding' ? 'Bidding' : 'Fixed'}</Badge>
                      ) },
                      { key: 'status', header: 'Status', render: (r) => <StatusBadge meta={RIDE_STATUS_META[r.status]} /> },
                      { key: 'amount', header: 'Amount', align: 'right', render: (r) => (
                        <span className="font-medium text-ink-900">{inr(r.totalAmount || r.fareAmount)}</span>
                      ) },
                      { key: 'time', header: 'When', align: 'right', render: (r) => (
                        <span className="text-ink-500">{formatDateTime(r.scheduledAt || r.createdAt)}</span>
                      ) },
                    ]}
                  />
                )}
              </div>
            </div>
          );
        }}
      </QueryBoundary>
    </div>
  );
}
