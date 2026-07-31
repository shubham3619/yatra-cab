import { useQuery } from '@tanstack/react-query';
import {
  Card, CardHeader, CardBody, Button, StatCard, PageHeader,
  QueryBoundary, LoadingScreen, EmptyState, toast, inr,
} from '@yatracab/ui';
import { Users, Copy, Gift, TrendingUp, UserPlus, Share2, Sparkles } from 'lucide-react';
import { api } from '../api.js';

const LEVELS = [
  { level: 'Level 1', pct: '15%' },
  { level: 'Level 2', pct: '8%' },
  { level: 'Level 3', pct: '4%' },
  { level: 'Level 4', pct: '3%' },
];

export default function Referrals() {
  const query = useQuery({ queryKey: ['driver-referrals'], queryFn: () => api.get('/driver/referrals') });

  return (
    <div className="animate-fade-in">
      <PageHeader icon={Users} title="Refer & earn" subtitle="Earn recurring commission on drivers you bring in — for life." />

      <QueryBoundary query={query} loading={<LoadingScreen label="Loading referrals…" />}>
        {(data) => {
          const copy = () => {
            navigator.clipboard?.writeText(data.referralCode)
              .then(() => toast.success('Copied!'))
              .catch(() => toast.error("Couldn't copy code"));
          };

          return (
            <div className="space-y-5">
              {/* Referral code */}
              <Card className="overflow-hidden border-0 bg-brand-gradient text-accent-fg shadow-glow">
                <CardBody>
                  <p className="text-sm opacity-90">Your referral code</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="rounded-xl bg-white/15 px-4 py-2 text-2xl font-semibold tracking-[0.2em]">{data.referralCode}</span>
                    <Button variant="secondary" icon={Copy} onClick={copy}>Copy</Button>
                  </div>
                  <p className="mt-3 max-w-md text-xs opacity-90">
                    Share your code. When drivers you refer complete rides, you earn a % of the platform commission — across 4 levels (15% / 8% / 4% / 3%). It's passive income for life.
                  </p>
                </CardBody>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard icon={Gift} label="Referral earnings" value={inr(data.referralEarnings)} tone="success" />
                <StatCard icon={UserPlus} label="Drivers referred" value={data.referredCount} tone="accent" />
              </div>

              {/* Level breakdown */}
              <Card>
                <CardHeader title="How the 4-level bonus works" icon={Sparkles} />
                <CardBody>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {LEVELS.map((l) => (
                      <div key={l.level} className="rounded-xl bg-ink-50 p-3 text-center">
                        <p className="text-xs text-ink-400">{l.level}</p>
                        <p className="mt-0.5 text-lg font-semibold text-accent">{l.pct}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-ink-500">Percentages apply to the platform commission on each ride your network completes.</p>
                </CardBody>
              </Card>

              {/* Referred drivers */}
              <Card>
                <CardHeader title="Drivers you referred" icon={Users} />
                <CardBody className="p-0">
                  {data.referrals?.length ? (
                    <div className="divide-y divide-ink-50">
                      {data.referrals.map((r) => (
                        <div key={r._id} className="flex items-center gap-3 px-5 py-3.5">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                            <TrendingUp size={18} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-ink-800">{r.referred?.name || 'Driver'}</p>
                            <p className="text-xs text-ink-400">{r.ridesCounted || 0} rides counted</p>
                          </div>
                          <p className="font-semibold text-success">{inr(r.recurringEarnings)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-5">
                      <EmptyState
                        icon={Share2}
                        title="No referrals yet"
                        message={`Share your code ${data.referralCode} with fellow drivers. You'll earn every time they drive.`}
                        action={<Button icon={Copy} onClick={() => { navigator.clipboard?.writeText(data.referralCode); toast.success('Copied!'); }}>Copy code</Button>}
                      />
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          );
        }}
      </QueryBoundary>
    </div>
  );
}
