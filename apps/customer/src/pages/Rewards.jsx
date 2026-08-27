import { useQuery } from '@tanstack/react-query';
import {
  Card, CardHeader, CardBody, Button, Badge, Avatar,
  QueryBoundary, EmptyState, LoadingScreen, toast,
} from '@yatracab/ui';
import { Gift, Copy, Users, Sparkles, Share2, TrendingUp, Network, Receipt, Link2 } from 'lucide-react';
import { api } from '../api.js';
import { InviteContacts } from '../components/InviteContacts.jsx';

const LEVEL_TONE = { 0: 'accent', 1: 'success', 2: 'warning', 3: 'info' };

export default function Rewards() {
  const query = useQuery({ queryKey: ['referral'], queryFn: () => api.get('/customer/referral') });
  const earningsQuery = useQuery({
    queryKey: ['referral-earnings'],
    queryFn: () => api.get('/customer/referral/earnings').then((r) => r.earnings),
  });

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code)
      .then(() => toast.success('Referral code copied!'))
      .catch(() => toast.error('Could not copy — code is ' + code));
  };

  // A share link drops friends straight onto signup with the code prefilled.
  // The page carries OG tags, so WhatsApp previews it with the YatraCab mark.
  const inviteLink = (code) => `${window.location.origin}/?ref=${code}`;

  const copyLink = (code) => {
    const link = inviteLink(code);
    navigator.clipboard?.writeText(link)
      .then(() => toast.success('Invite link copied!'))
      .catch(() => toast.error('Could not copy — link is ' + link));
  };

  // Native share sheet where available (mobile); clipboard fallback elsewhere.
  const shareLink = async (code) => {
    const url = inviteLink(code);
    const payload = {
      title: 'YatraCab — Rides, your way',
      text: `Book temple & outstation cabs on YatraCab. Use my code ${code} and we both get 50 points.`,
      url,
    };
    if (navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return; // user dismissed the sheet
      }
    }
    copyLink(code);
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
                  <div className="mt-4 flex gap-6 border-t border-white/25 pt-3 text-sm">
                    <div>
                      <p className="opacity-80">From your rides</p>
                      <p className="text-lg font-semibold">{data.cashbackEarned}</p>
                    </div>
                    <div>
                      <p className="opacity-80">From your network</p>
                      <p className="text-lg font-semibold">{data.chainEarned}</p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Network — total chain size, then each level broken out */}
            <Card>
              <CardHeader title="Your chain" subtitle="You earn on every ride they take." icon={Network} />
              <CardBody>
                <div className="rounded-2xl bg-ink-900 p-5 text-white">
                  <p className="text-xs font-medium uppercase tracking-wide text-white/60">Total people in your chain</p>
                  <p className="mt-1 font-display text-5xl font-bold">{data.chainSize ?? 0}</p>
                  <p className="mt-1 text-sm text-white/70">across 3 levels</p>
                </div>

                <div className="mt-3 space-y-2">
                  {data.levels?.map((l) => (
                    <div key={l.level} className="flex items-center gap-3 rounded-xl border border-ink-200 p-3.5">
                      <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-ink-100">
                        <span className="text-[10px] font-medium uppercase leading-none text-ink-400">Lvl</span>
                        <span className="font-display text-lg font-bold leading-tight text-ink-900">{l.level}</span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink-900">
                          {l.members} {l.members === 1 ? 'person' : 'people'}
                        </p>
                        <p className="text-xs text-ink-500">
                          {l.weight}% of each reward pool · {l.rides} {l.rides === 1 ? 'ride' : 'rides'} earned from
                        </p>
                      </div>
                      <span className="shrink-0 text-right">
                        <span className="block font-display text-lg font-bold text-ink-900">{l.points}</span>
                        <span className="block text-[11px] text-ink-400">points</span>
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-2 rounded-xl bg-ink-50 p-4 text-sm text-ink-600">
                  <p className="flex items-center gap-1.5 font-medium text-ink-900"><TrendingUp size={15} /> How the chain pays</p>
                  <p>
                    Every completed ride sets aside a reward pool. Your uplines share it —
                    <span className="font-semibold text-ink-900"> Level 1 gets 75%</span>, Level 2 gets 19%, Level 3 gets 6%.
                  </p>
                  <p>
                    Chain rewards run for a friend's first <span className="font-semibold text-ink-900">{data.config?.windowRides ?? 25} rides</span>.
                    Anything your chain doesn't claim comes back to you as ride cashback.
                  </p>
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
                  <Button variant="soft" icon={Link2} onClick={() => copyLink(data.referralCode)}>Link</Button>
                </div>
                <Button className="w-full" size="lg" icon={Share2} onClick={() => shareLink(data.referralCode)}>
                  Share invite
                </Button>
                <div className="flex items-start gap-2 rounded-xl bg-ink-50 p-4 text-sm text-ink-600">
                  <Share2 size={16} className="mt-0.5 shrink-0 text-accent" />
                  <p>
                    Refer friends. When they join you <span className="font-semibold text-ink-800">both get 50 points</span> —
                    then you keep earning on every ride they take, and on their friends' rides too.
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* Invite contacts */}
            <InviteContacts />

            {/* Earnings statement */}
            <Card>
              <CardHeader title="Earnings" subtitle="Where your points came from." icon={Receipt} />
              <CardBody>
                {!earningsQuery.data?.length ? (
                  <EmptyState
                    icon={Receipt}
                    title="No earnings yet"
                    message="Take a ride, or invite a friend — your points will show up here."
                  />
                ) : (
                  <div className="space-y-2">
                    {earningsQuery.data.map((e) => (
                      <div key={e.id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
                        <Badge tone={LEVEL_TONE[e.level] || 'neutral'}>{e.label}</Badge>
                        <p className="min-w-0 flex-1 truncate text-sm text-ink-700">{e.from}</p>
                        <span className="shrink-0 text-sm font-semibold text-ink-900">+{e.points}</span>
                      </div>
                    ))}
                  </div>
                )}
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
