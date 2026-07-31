import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, CardHeader, CardBody, Button, Badge, StatusBadge, Avatar, StarRating, StarPicker, Field, Textarea,
  QueryBoundary, LoadingScreen, toast, inr, formatDateTime, vehicleLabel, RIDE_STATUS_META,
} from '@yatracab/ui';
import {
  ArrowLeft, MapPin, Car, CalendarClock, Users, Phone, Play, CheckCircle2, Star, Navigation, Radio, Info, Wallet, Lock,
} from 'lucide-react';
import { api } from '../api.js';
import { getSocket } from '../socket.js';

export default function RideDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['driver-ride', id], queryFn: () => api.get(`/driver/rides?limit=100`).then((r) => r.rides.find((x) => x._id === id)) });
  const ride = query.data;

  const refetch = () => { query.refetch(); qc.invalidateQueries({ queryKey: ['driver-rides'] }); qc.invalidateQueries({ queryKey: ['driver-active'] }); };

  const mutate = (path, ok) =>
    useMutation({ mutationFn: () => api.patch(`/driver/rides/${id}/${path}`), onSuccess: () => { toast.success(ok); refetch(); }, onError: (e) => toast.error(e.message) });

  const start = mutate('start', 'Ride started — drive safe!');
  const complete = mutate('complete', 'Ride completed');

  const call = useMutation({
    mutationFn: () => api.post(`/driver/rides/${id}/call`),
    onSuccess: (res) => toast.success(res.message || `Connecting via ${res.virtualNumber}`),
    onError: (e) => toast.error(e.message),
  });

  const settle = useMutation({
    mutationFn: () => api.post(`/driver/rides/${id}/settle-commission`),
    onSuccess: (res) => { toast.success(res.message || 'Contact unlocked'); refetch(); qc.invalidateQueries({ queryKey: ['driver-wallet'] }); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <button onClick={() => navigate('/rides')} className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700"><ArrowLeft size={16} /> All rides</button>

      <QueryBoundary query={query} loading={<LoadingScreen label="Loading ride…" />}>
        {(ride) =>
          !ride ? (
            <Card><CardBody className="text-center text-ink-500 py-10">Ride not found.</CardBody></Card>
          ) : (
            <>
              <Card>
                <CardBody>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-xl font-semibold text-ink-900 inline-flex items-center gap-1.5"><MapPin size={18} className="text-accent" />{ride.destination || ride.route?.destination}</h1>
                        <StatusBadge meta={RIDE_STATUS_META[ride.status]} />
                      </div>
                      <p className="mt-1 text-sm text-ink-500">from {ride.route?.origin || 'Jaipur'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-ink-400">Fare (cash)</p>
                      <p className="text-xl font-semibold text-accent">{inr(ride.fareAmount)}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Meta icon={Car} label="Vehicle" value={vehicleLabel(ride.vehicleType)} />
                    <Meta icon={CalendarClock} label="When" value={formatDateTime(ride.scheduledAt)} />
                    <Meta icon={Users} label="Passengers" value={ride.passengers} />
                    <Meta icon={Navigation} label="Trip" value={ride.tripType === 'round_trip' ? 'Round trip' : 'One way'} />
                  </div>
                  {ride.pickup?.address && <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-ink-50 p-3 text-sm text-ink-600"><MapPin size={14} className="mt-0.5 shrink-0" /> Pickup: {ride.pickup.address}</p>}
                  {ride.notes && <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-ink-50 p-3 text-sm text-ink-600"><Info size={14} className="mt-0.5 shrink-0" /> {ride.notes}</p>}
                </CardBody>
              </Card>

              {/* Pay-to-Connect: commission pending */}
              {ride.commission?.status === 'pending' && (
                <Card className="border-warning/40 bg-warning-soft">
                  <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-warning text-white"><Lock size={20} /></span>
                      <div>
                        <p className="font-semibold text-ink-900">Rider contact locked</p>
                        <p className="text-sm text-ink-600">Add {inr(ride.commission.amount)} to your wallet to unlock the rider's contact (Pay-to-Connect).</p>
                      </div>
                    </div>
                    <Button variant="primary" icon={Wallet} loading={settle.isPending} onClick={() => settle.mutate()} className="shrink-0">
                      Pay {inr(ride.commission.amount)} &amp; unlock
                    </Button>
                  </CardBody>
                </Card>
              )}

              {/* Customer + contact */}
              <Card>
                <CardHeader title="Your passenger" icon={Users} />
                <CardBody className="space-y-3">
                  {ride.commission?.status === 'charged' && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-xs font-medium text-success">
                      <CheckCircle2 size={13} /> Commission paid · contact unlocked
                    </div>
                  )}
                  <div className="flex items-center gap-3 rounded-xl bg-accent-soft p-4">
                    <Avatar name={ride.customer?.name} size={46} />
                    <div className="flex-1">
                      <p className="font-semibold text-ink-900">{ride.customer?.name || 'Customer'}</p>
                      <StarRating value={ride.customer?.rating || 5} size={12} />
                    </div>
                    {['confirmed', 'ongoing'].includes(ride.status) && (
                      <Button variant="soft" icon={Phone} loading={call.isPending} onClick={() => call.mutate()}>Call</Button>
                    )}
                  </div>
                </CardBody>
              </Card>

              {/* Actions per status */}
              {ride.status === 'confirmed' && (
                <Button size="lg" className="w-full" icon={Play} loading={start.isPending} onClick={() => start.mutate()}>Start ride</Button>
              )}
              {ride.status === 'ongoing' && (
                <>
                  <LocationSharer rideId={id} />
                  <Button size="lg" variant="success" className="w-full" icon={CheckCircle2} loading={complete.isPending} onClick={() => complete.mutate()}>Complete ride & collect cash</Button>
                </>
              )}
              {ride.status === 'completed' && <RateCustomer ride={ride} onRated={refetch} />}
            </>
          )
        }
      </QueryBoundary>
    </div>
  );
}

function Meta({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-ink-50 p-3">
      <p className="flex items-center gap-1 text-xs text-ink-400"><Icon size={12} /> {label}</p>
      <p className="mt-0.5 text-sm font-medium text-ink-800">{value}</p>
    </div>
  );
}

// Simulate GPS by emitting jittered Jaipur coordinates over the socket so the
// customer's tracking view updates live. Real app would use the Geolocation API.
function LocationSharer({ rideId }) {
  const [sharing, setSharing] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearInterval(timer.current), []);

  const toggle = () => {
    const socket = getSocket();
    if (!socket) return toast.error('Not connected');
    if (sharing) {
      clearInterval(timer.current);
      setSharing(false);
      return;
    }
    setSharing(true);
    let lat = 26.9124;
    let lng = 75.7873;
    const tick = () => {
      lat += (Math.random() - 0.3) * 0.01;
      lng += (Math.random() - 0.3) * 0.01;
      socket.emit('driver:location', { rideId, lat, lng });
    };
    tick();
    timer.current = setInterval(tick, 3000);
    toast.success('Sharing live location with passenger');
  };

  return (
    <Card className={sharing ? 'border-accent/40 bg-accent-soft' : ''}>
      <CardBody className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${sharing ? 'bg-accent text-accent-fg' : 'bg-ink-200 text-ink-500'}`}><Radio size={20} /></span>
          <div>
            <p className="font-semibold text-ink-900">{sharing ? 'Sharing live location' : 'Share live location'}</p>
            <p className="text-sm text-ink-500">Let your passenger track the trip</p>
          </div>
        </div>
        <Button variant={sharing ? 'secondary' : 'primary'} onClick={toggle}>{sharing ? 'Stop' : 'Start'}</Button>
      </CardBody>
    </Card>
  );
}

function RateCustomer({ ride, onRated }) {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const rate = useMutation({
    mutationFn: () => api.post(`/driver/rides/${ride._id}/rate`, { stars, comment: comment || undefined }),
    onSuccess: () => { toast.success('Passenger rated'); onRated(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader title="Ride completed" subtitle="Rate your passenger" icon={CheckCircle2} />
      <CardBody>
        {ride.ratedByDriver ? (
          <div className="flex items-center gap-2 rounded-xl bg-success-soft p-4 text-sm text-success"><CheckCircle2 size={16} /> You've rated this passenger.</div>
        ) : (
          <>
            <div className="mb-3 flex items-center gap-2"><Star size={16} className="text-warning" /> <span className="font-medium text-ink-800">How was {ride.customer?.name || 'the passenger'}?</span></div>
            <StarPicker value={stars} onChange={setStars} />
            <Field className="mt-3"><Textarea placeholder="Optional note" value={comment} onChange={(e) => setComment(e.target.value)} /></Field>
            <Button className="mt-3" loading={rate.isPending} onClick={() => rate.mutate()}>Submit rating</Button>
          </>
        )}
      </CardBody>
    </Card>
  );
}
