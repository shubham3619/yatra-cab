import { useQuery } from '@tanstack/react-query';
import {
  PageHeader, StatCard, Table, Badge,
  QueryBoundary, LoadingScreen, EmptyState,
  inr,
} from '@yatracab/ui';
import { Wallet, IndianRupee, ArrowDownCircle, ArrowUpCircle, TrendingUp, Info } from 'lucide-react';
import { api } from '../api.js';

// Friendly labels + tone for each wallet transaction reason.
const REASON_META = {
  commission: { label: 'Ride commission (in)', tone: 'success' },
  topup: { label: 'Wallet top-ups', tone: 'info' },
  referral_commission: { label: 'Referral payouts (out)', tone: 'warning' },
  commission_refund: { label: 'Commission refunds', tone: 'accent' },
  bonus: { label: 'Welcome bonuses', tone: 'accent' },
  penalty: { label: 'Penalties', tone: 'danger' },
  adjustment: { label: 'Adjustments', tone: 'neutral' },
};

const reasonLabel = (r) => REASON_META[r]?.label || r;
const reasonTone = (r) => REASON_META[r]?.tone || 'neutral';

export default function Finance() {
  const query = useQuery({
    queryKey: ['finance-wallet-summary'],
    queryFn: () => api.get('/admin/safety/wallet-summary'),
  });

  return (
    <div className="space-y-6">
      <PageHeader icon={Wallet} title="Finance" subtitle="Pay-to-Connect commission and referral payout oversight." />

      <div className="flex items-start gap-3 rounded-2xl border border-info/25 bg-info-soft p-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-info">
          <Info size={16} />
        </span>
        <p className="text-sm text-ink-700">
          Drivers pay a small commission from their wallet when a rider accepts them; riders pay fares directly to drivers.
        </p>
      </div>

      <QueryBoundary query={query} loading={<LoadingScreen label="Loading finance summary…" />}>
        {(data) => {
          const s = data.summary || {};
          const byReason = s.byReason || {};
          const netEarning = Number(s.commissionCollected || 0) - Number(s.referralPaid || 0);
          const reasonRows = Object.entries(byReason);

          return (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  icon={IndianRupee}
                  label="Commission collected"
                  value={inr(s.commissionCollected)}
                  sub={`${s.commissionCount ?? 0} ride${(s.commissionCount ?? 0) === 1 ? '' : 's'}`}
                  tone="success"
                />
                <StatCard icon={ArrowDownCircle} label="Driver wallet top-ups" value={inr(s.topups)} sub="added by drivers" tone="info" />
                <StatCard icon={ArrowUpCircle} label="Referral commission paid" value={inr(s.referralPaid)} sub="paid out to referrers" tone="warning" />
                <StatCard
                  icon={TrendingUp}
                  label="Net platform earning"
                  value={inr(netEarning)}
                  sub="commission − referral payouts"
                  tone={netEarning >= 0 ? 'accent' : 'danger'}
                />
              </div>

              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-ink-900">Breakdown by reason</h2>
                {reasonRows.length === 0 ? (
                  <EmptyState icon={Wallet} title="No wallet activity yet" message="Commission, top-ups and payouts will appear here." />
                ) : (
                  <Table
                    rowKey={([reason]) => reason}
                    data={reasonRows}
                    columns={[
                      {
                        key: 'reason', header: 'Reason', render: ([reason]) => (
                          <Badge tone={reasonTone(reason)}>{reasonLabel(reason)}</Badge>
                        ),
                      },
                      {
                        key: 'count', header: 'Count', align: 'right', render: ([, v]) => (
                          <span className="text-ink-500">{v.count ?? 0}</span>
                        ),
                      },
                      {
                        key: 'total', header: 'Total', align: 'right', render: ([, v]) => (
                          <span className="font-medium text-ink-900">{inr(v.total)}</span>
                        ),
                      },
                    ]}
                  />
                )}
              </section>
            </div>
          );
        }}
      </QueryBoundary>
    </div>
  );
}
