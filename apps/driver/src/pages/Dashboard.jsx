import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, CardBody, Button, Badge, StatCard, StatusBadge, StarRating, QueryBoundary, LoadingScreen, EmptyState,
  toast, inr, formatDateTime, vehicleLabel, VERIFICATION_META, RIDE_STATUS_META,
} from '@yatracab/ui';
import {
  Power, Gavel, Route as RouteIcon, IndianRupee, Trophy, Star, AlertTriangle, ArrowRight, CheckCircle2, ClipboardCheck, Repeat, Users,
} from 'lucide-react';
import { api } from '../api.js';

function QuickAction({ to, icon: Icon, title, sub }) {
  return (
    <Link to={to}>
      <Card hover className="p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent"><Icon size={20} /></span>
          <div className="flex-1">
            <p className="font-semibold text-ink-900">{title}</p>
            <p className="text-sm text-ink-500">{sub}</p>
          </div>
          <ArrowRight size={18} className="text-ink-300" />
        </div>
      </Card>
    </Link>
  );
}

export default function Dashboard() {
  const qc = useQueryClient();
  const profileQ = useQuery({ queryKey: ['driver-profile'], queryFn: () => api.get('/driver/profile').then((r) => r.driver) });
  const earningsQ = useQuery({ queryKey: ['driver-earnings'], queryFn: () => api.get('/driver/earnings').then((r) => r.earnings) });
  const ridesQ = useQuery({ queryKey: ['driver-active'], queryFn: () => api.get('/driver/rides?status=confirmed').then((r) => r.rides) });

  const toggle = useMutation({
    mutationFn: (isOnline) => api.patch('/driver/status', { isOnline }),
    onSuccess: (res) => { toast.success(res.isOnline ? 'You are online' : 'You are offline'); qc.invalidateQueries({ queryKey: ['driver-profile'] }); },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <QueryBoundary query={profileQ} loading={<LoadingScreen label="Loading your dashboard…" />}>
        {(driver) => {
          const approved = driver.verificationStatus === 'approved';
          return (
            <>
              {/* Verification gate */}
              {!approved && (
                <Card className="border-warning/30 bg-warning-soft">
                  <CardBody className="flex items-start gap-3">
                    <AlertTriangle size={20} className="mt-0.5 shrink-0 text-warning" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-ink-900">Verification {VERIFICATION_META[driver.verificationStatus]?.label?.toLowerCase()}</p>
                        <StatusBadge meta={VERIFICATION_META[driver.verificationStatus]} />
                      </div>
                      <p className="mt-1 text-sm text-ink-600">
                        {driver.verificationStatus === 'pending'
                          ? 'Our team is reviewing your documents. You can go online once approved.'
                          : driver.verificationStatus === 'rejected'
                          ? `Rejected: ${driver.rejectionReason || 'please re-submit your documents.'}`
                          : 'Complete your profile and submit documents to start receiving rides.'}
                      </p>
                      <Link to="/profile"><Button size="sm" variant="secondary" className="mt-3" icon={ClipboardCheck}>Complete onboarding</Button></Link>
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Online toggle */}
              {approved && (
                <Card className={driver.isOnline ? 'border-success/30 bg-success-soft' : ''}>
                  <CardBody className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${driver.isOnline ? 'bg-success text-white' : 'bg-ink-200 text-ink-500'}`}>
                        <Power size={22} />
                      </span>
                      <div>
                        <p className="font-semibold text-ink-900">{driver.isOnline ? "You're online" : "You're offline"}</p>
                        <p className="text-sm text-ink-500">{driver.isOnline ? 'Receiving ride alerts on your routes' : 'Go online to receive alerts'}</p>
                      </div>
                    </div>
                    <Button variant={driver.isOnline ? 'secondary' : 'success'} loading={toggle.isPending} onClick={() => toggle.mutate(!driver.isOnline)}>
                      {driver.isOnline ? 'Go offline' : 'Go online'}
                    </Button>
                  </CardBody>
                </Card>
              )}

              {/* Stats */}
              <QueryBoundary query={earningsQ} loading={<LoadingScreen />}>
                {(e) => (
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <StatCard icon={IndianRupee} label="This week (cash)" value={inr(e.thisWeek)} tone="success" />
                    <StatCard icon={CheckCircle2} label="Completed rides" value={e.completedRides} tone="accent" />
                    <StatCard icon={Star} label="Rating" value={Number(e.rating).toFixed(1)} sub={`${e.ratingCount} ratings`} tone="warning" />
                    <StatCard icon={Trophy} label="Loyalty points" value={e.loyaltyPoints} tone="info" />
                  </div>
                )}
              </QueryBoundary>

              {/* Quick actions */}
              <div className="grid gap-3 sm:grid-cols-2">
                <Link to="/alerts">
                  <Card hover className="p-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent"><Gavel size={20} /></span>
                      <div className="flex-1">
                        <p className="font-semibold text-ink-900">Ride Alerts</p>
                        <p className="text-sm text-ink-500">Bid on open trips</p>
                      </div>
                      <ArrowRight size={18} className="text-ink-300" />
                    </div>
                  </Card>
                </Link>
                <Link to="/rides">
                  <Card hover className="p-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent"><RouteIcon size={20} /></span>
                      <div className="flex-1">
                        <p className="font-semibold text-ink-900">My assignments</p>
                        <p className="text-sm text-ink-500">Start & complete rides</p>
                      </div>
                      <ArrowRight size={18} className="text-ink-300" />
                    </div>
                  </Card>
                </Link>
                <QuickAction to="/earnings" icon={IndianRupee} title="Earnings" sub="Cash & loyalty points" />
                <QuickAction to="/daily-routes" icon={Repeat} title="Daily routes" sub="Publish fixed trips" />
                <QuickAction to="/referrals" icon={Users} title="Refer & earn" sub="Invite drivers, earn for life" />
              </div>

              {/* Upcoming confirmed rides */}
              <div>
                <p className="mb-2 text-sm font-medium text-ink-600">Upcoming rides</p>
                <QueryBoundary query={ridesQ} loading={<LoadingScreen />} isEmpty={(d) => !d?.length} empty={<EmptyState icon={RouteIcon} title="No upcoming rides" message="Confirmed bookings will appear here." />}>
                  {(rides) => (
                    <div className="space-y-3">
                      {rides.map((r) => (
                        <Link key={r._id} to={`/rides/${r._id}`}>
                          <Card hover className="flex items-center gap-4 p-4">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent"><RouteIcon size={20} /></div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-ink-900">{r.destination || r.route?.destination}</p>
                                <StatusBadge meta={RIDE_STATUS_META[r.status]} />
                              </div>
                              <p className="text-xs text-ink-500">{formatDateTime(r.scheduledAt)} · {vehicleLabel(r.vehicleType)}</p>
                            </div>
                            <p className="font-semibold text-ink-900">{inr(r.fareAmount)}</p>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  )}
                </QueryBoundary>
              </div>
            </>
          );
        }}
      </QueryBoundary>
    </div>
  );
}
