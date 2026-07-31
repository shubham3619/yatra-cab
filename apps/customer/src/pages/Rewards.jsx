import { useQuery } from '@tanstack/react-query';
import {
  Card, CardHeader, CardBody, Button, Badge, Avatar,
  QueryBoundary, EmptyState, LoadingScreen, toast,
} from '@yatracab/ui';
import { Gift, Copy, Users, Sparkles, Share2 } from 'lucide-react';
import { api } from '../api.js';

export default function Rewards() {
  const query = useQuery({ queryKey: ['referral'], queryFn: () => api.get('/customer/referral') });

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code)
      .then(() => toast.success('Referral code copied!'))
      .catch(() => toast.error('Could not copy — code is ' + code));
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">Rewards</h1>
        <p className="text-sm text-ink-500">Earn points, refer friends, ride for less.</p>
      </div>

      <QueryBoundary query={query} loading={<LoadingScreen label="Loading your rewards…" />}>
        {(data) => (
          <>
            {/* Points balance */}
            <Card className="overflow-hidden">
              <CardBody className="relative bg-brand-gradient text-accent-fg">
                <div className="absolute inset-0 bg-dotted opacity-20" />
                <div className="relative">
                  <p className="flex items-center gap-1.5 text-sm font-medium opacity-90"><Sparkles size={15} /> Points balance</p>
                  <p className="mt-1 text-5xl font-bold">{data.points}</p>
                  <p className="mt-1 text-sm opacity-90">1 point = ₹1 off your next ride</p>
                </div>
              </CardBody>
            </Card>

            {/* Referral code */}
            <Card>
              <CardHeader title="Your referral code" subtitle="Share it and earn together." icon={Gift} />
              <CardBody className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-accent/40 bg-accent-soft p-4">
                  <span className="flex-1 font-display text-2xl font-bold tracking-wider text-accent">{data.referralCode}</span>
                  <Button variant="soft" icon={Copy} onClick={() => copyCode(data.referralCode)}>Copy</Button>
                </div>
                <div className="flex items-start gap-2 rounded-xl bg-ink-50 p-4 text-sm text-ink-600">
                  <Share2 size={16} className="mt-0.5 shrink-0 text-accent" />
                  <p>
                    Refer friends. When they take their first ride, you <span className="font-semibold text-ink-800">BOTH get 50 points</span>.
                    Even your friend's friends earn you points <Badge tone="accent">Level 2</Badge>.
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* Referred friends */}
            <Card>
              <CardHeader title="Friends you've referred" subtitle={`${data.referredCount} joined`} icon={Users} />
              <CardBody>
                {!data.referrals?.length ? (
                  <EmptyState
                    icon={Gift}
                    title="No referrals yet"
                    message={`Share your code ${data.referralCode} with friends to start earning points together.`}
                  />
                ) : (
                  <div className="space-y-2">
                    {data.referrals.map((ref, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
                        <Avatar name={ref.referred?.name || 'Friend'} size={38} />
                        <p className="font-medium text-ink-800">{ref.referred?.name || 'A friend'}</p>
                        <Badge tone="success" className="ml-auto">Joined</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </>
        )}
      </QueryBoundary>
    </div>
  );
}
