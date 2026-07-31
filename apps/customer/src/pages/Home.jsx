import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Card, CardBody, Button, Field, Input, Textarea, Select, Segmented, Badge, LocationInput,
  QueryBoundary, EmptyState, LoadingScreen, toast, inr, vehicleLabel,
} from '@yatracab/ui';
import {
  MapPin, Navigation, Car, Gavel, IndianRupee, Info, Route as RouteIcon, ArrowDown, Clock, Star,
  Users2, ShieldCheck, Minus, Plus, Train, ChevronDown,
} from 'lucide-react';
import { api } from '../api.js';

const VEHICLES = ['hatchback', 'sedan', 'suv', 'tempo'];
const defaultWhen = () => {
  const d = new Date(Date.now() + 24 * 3600 * 1000);
  d.setMinutes(0, 0, 0);
  return d.toISOString().slice(0, 16);
};

export default function Home() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('fixed');
  const [pickup, setPickup] = useState(null); // { address, lat, lng }
  const [drop, setDrop] = useState(null);
  const [routeId, setRouteId] = useState(null); // set when a popular destination is chosen
  const [vehicleType, setVehicleType] = useState('sedan');
  const [tripType, setTripType] = useState('round_trip');
  const [scheduledAt, setScheduledAt] = useState(defaultWhen());
  const [passengers, setPassengers] = useState(2);
  const [notes, setNotes] = useState('');
  const [biddingWindowMins, setBiddingWindowMins] = useState(30);
  const [bookingType, setBookingType] = useState('full_cab');
  const [seats, setSeats] = useState(1);
  const [womenOnly, setWomenOnly] = useState(false);
  const [transportOpen, setTransportOpen] = useState(false);
  const [transportType, setTransportType] = useState('none');
  const [transportNumber, setTransportNumber] = useState('');
  const [transportAt, setTransportAt] = useState('');

  const routesQuery = useQuery({ queryKey: ['routes'], queryFn: () => api.get('/shared/routes').then((r) => r.routes) });

  const hasTrip = !!routeId || (pickup?.lat != null && drop?.lat != null);

  const quoteQuery = useQuery({
    queryKey: ['quote', routeId, pickup?.lat, pickup?.lng, drop?.lat, drop?.lng, drop?.address, tripType],
    enabled: hasTrip,
    queryFn: () =>
      api
        .post('/customer/rides/quote', routeId ? { routeId, tripType } : { pickup, drop, tripType })
        .then((r) => r.quote),
  });
  const quote = quoteQuery.data;
  const fare = quote?.fares?.[vehicleType];

  const chooseRoute = (route) => {
    setRouteId(route._id);
    setDrop({ address: route.destination }); // label only; priced from the route matrix
  };
  const onDropChange = (loc) => {
    setDrop(loc);
    setRouteId(null); // typing a custom drop leaves popular-route pricing
  };

  const book = useMutation({
    mutationFn: () => {
      const base = {
        vehicleType,
        tripType,
        scheduledAt: new Date(scheduledAt).toISOString(),
        passengers: Number(passengers),
        pickup,
        notes: notes.trim() || undefined,
        bookingType,
        womenOnly,
      };
      if (bookingType === 'seat_share') base.seats = Number(seats);
      if (transportType !== 'none') {
        base.transport = {
          type: transportType,
          number: transportNumber.trim() || undefined,
          scheduledAt: transportAt ? new Date(transportAt).toISOString() : undefined,
        };
      }
      if (routeId) base.routeId = routeId;
      else base.drop = drop;
      const payload = mode === 'bidding' ? { ...base, biddingWindowMins: Number(biddingWindowMins) } : base;
      return mode === 'fixed' ? api.post('/customer/rides/fixed', payload) : api.post('/customer/rides/alert', payload);
    },
    onSuccess: (res) => {
      toast.success(mode === 'fixed' ? 'Ride created — complete payment' : 'Ride Alert posted!');
      navigate(`/rides/${res.ride._id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const submit = () => {
    if (!pickup?.address) return toast.error('Set your pickup location');
    if (!routeId && pickup?.lat == null) return toast.error('Pick your pickup from the list or use your location');
    if (!routeId && drop?.lat == null) return toast.error('Choose a drop location');
    if (routeId && !drop) return toast.error('Choose a destination');
    book.mutate();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Book a ride</h1>
          <p className="text-sm text-ink-500">Set your pickup &amp; drop — pay a fixed fare, or let drivers bid.</p>
        </div>
        <Segmented value={mode} onChange={setMode} options={[{ value: 'fixed', label: 'Fixed fare' }, { value: 'bidding', label: 'Ride Alert' }]} />
      </div>

      {/* Booking type: full cab vs share seats */}
      <Card>
        <CardBody className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-sm font-medium text-ink-600"><Users2 size={15} className="text-accent" /> How do you want to travel?</p>
            <Segmented
              value={bookingType}
              onChange={setBookingType}
              options={[{ value: 'full_cab', label: 'Full cab' }, { value: 'seat_share', label: 'Share seats' }]}
            />
          </div>

          {bookingType === 'seat_share' && (
            <div className="grid gap-3 rounded-xl bg-ink-50 p-3.5 sm:grid-cols-2 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink-700">Seats</span>
                <div className="flex items-center gap-3">
                  <IconStep icon={Minus} disabled={seats <= 1} onClick={() => setSeats((s) => Math.max(1, s - 1))} />
                  <span className="w-5 text-center text-base font-semibold text-ink-900">{seats}</span>
                  <IconStep icon={Plus} disabled={seats >= 4} onClick={() => setSeats((s) => Math.min(4, s + 1))} />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWomenOnly((v) => !v)}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                  womenOnly ? 'border-accent bg-accent-soft text-accent' : 'border-ink-200 text-ink-600 hover:border-accent/40'
                }`}
              >
                <span className="flex items-center gap-1.5"><ShieldCheck size={15} /> Women only</span>
                <span className={`relative h-5 w-9 rounded-full transition-colors ${womenOnly ? 'bg-accent' : 'bg-ink-300'}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${womenOnly ? 'left-4' : 'left-0.5'}`} />
                </span>
              </button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Pickup + drop */}
      <Card>
        <CardBody className="space-y-3">
          <div className="relative">
            <div className="space-y-2.5">
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">Pickup</p>
                <LocationInput value={pickup} onChange={setPickup} placeholder="Search pickup point" allowCurrentLocation icon={Navigation} onError={toast.error} />
              </div>
              <div className="flex justify-center">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink-100 text-ink-400"><ArrowDown size={14} /></span>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">Drop</p>
                <LocationInput value={drop} onChange={onDropChange} placeholder="Search destination" icon={MapPin} onError={toast.error} />
              </div>
            </div>
          </div>

          {/* Popular destinations */}
          <QueryBoundary query={routesQuery} loading={<div className="h-6" />} isEmpty={() => false}>
            {(routes) => (
              <div>
                <p className="mb-2 mt-1 flex items-center gap-1 text-xs text-ink-400"><Star size={12} /> Popular destinations</p>
                <div className="flex flex-wrap gap-2">
                  {routes.map((r) => (
                    <button
                      key={r._id}
                      onClick={() => chooseRoute(r)}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                        routeId === r._id ? 'border-accent bg-accent text-accent-fg' : 'border-ink-200 text-ink-600 hover:border-accent/40'
                      }`}
                    >
                      {r.destination}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </QueryBoundary>
        </CardBody>
      </Card>

      {/* Trip details + fare (once a trip is set) */}
      {hasTrip && (
        <Card className="animate-fade-in">
          <CardBody className="space-y-4">
            {/* Distance / ETA */}
            <div className="flex items-center gap-4 rounded-xl bg-accent-soft px-4 py-3 text-sm">
              {quoteQuery.isLoading ? (
                <span className="text-accent">Calculating route…</span>
              ) : quote ? (
                <>
                  <span className="flex items-center gap-1.5 font-medium text-accent"><RouteIcon size={15} /> {quote.distanceKm} km</span>
                  <span className="flex items-center gap-1.5 text-ink-500"><Clock size={15} /> ~{Math.round(quote.estimatedMins / 60) || 1}h {quote.estimatedMins % 60}m</span>
                  {routeId && <Badge tone="accent">Popular route</Badge>}
                </>
              ) : null}
            </div>

            {/* Vehicle */}
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-ink-600"><Car size={15} className="text-accent" /> Vehicle type</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {VEHICLES.map((v) => (
                  <button
                    key={v}
                    onClick={() => setVehicleType(v)}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                      vehicleType === v ? 'border-accent bg-accent-soft text-accent' : 'border-ink-200 text-ink-600 hover:border-accent/40'
                    }`}
                  >
                    {vehicleLabel(v)}
                    {quote?.fares?.[v] && <span className="mt-0.5 block text-xs font-normal text-ink-400">{inr(quote.fares[v].fareAmount)}</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Trip type">
                <Select value={tripType} onChange={(e) => setTripType(e.target.value)}>
                  <option value="round_trip">Round trip</option>
                  <option value="one_way">One way</option>
                </Select>
              </Field>
              <Field label="When">
                <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
              </Field>
              <Field label="Passengers">
                <Input type="number" min={1} max={12} value={passengers} onChange={(e) => setPassengers(e.target.value)} />
              </Field>
              {mode === 'bidding' && (
                <Field label="Bidding window" hint="minutes">
                  <Select value={biddingWindowMins} onChange={(e) => setBiddingWindowMins(e.target.value)}>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                  </Select>
                </Field>
              )}
            </div>

            <Field label="Notes" hint="optional">
              <Textarea placeholder="Extra stops, luggage, wheelchair access…" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>

            {/* Arriving by train/flight? (collapsible) */}
            <div className="rounded-xl border border-ink-200">
              <button
                type="button"
                onClick={() => setTransportOpen((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-ink-700"
              >
                <span className="flex items-center gap-1.5"><Train size={15} className="text-accent" /> Arriving by train/flight?</span>
                <ChevronDown size={16} className={`text-ink-400 transition-transform ${transportOpen ? 'rotate-180' : ''}`} />
              </button>
              {transportOpen && (
                <div className="space-y-3 border-t border-ink-100 p-4 animate-fade-in">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Mode">
                      <Select value={transportType} onChange={(e) => setTransportType(e.target.value)}>
                        <option value="none">None</option>
                        <option value="train">Train</option>
                        <option value="flight">Flight</option>
                        <option value="bus">Bus</option>
                      </Select>
                    </Field>
                    <Field label="Number" hint="train / flight no.">
                      <Input value={transportNumber} onChange={(e) => setTransportNumber(e.target.value)} placeholder="e.g. 12956 / AI-501" disabled={transportType === 'none'} />
                    </Field>
                  </div>
                  <Field label="Scheduled arrival">
                    <Input type="datetime-local" value={transportAt} onChange={(e) => setTransportAt(e.target.value)} disabled={transportType === 'none'} />
                  </Field>
                  <p className="flex items-start gap-1.5 text-xs text-ink-500">
                    <Info size={13} className="mt-0.5 shrink-0" />
                    We'll auto-adjust your pickup time if your train/flight is delayed.
                  </p>
                </div>
              )}
            </div>

            {/* Fare summary */}
            {mode === 'fixed' ? (
              <div className="rounded-xl bg-ink-50 p-4">
                <Row label="Ride fare (cash to driver)" value={fare ? inr(fare.fareAmount) : '—'} />
                <Row label={`Booking & Safety Fee (${fare?.feePercent ?? 10}%)`} value={fare ? inr(fare.feeAmount) : '—'} hint="paid online now" />
                <div className="my-2 border-t border-ink-200" />
                <Row label="You pay online" value={fare ? inr(fare.feeAmount) : '—'} bold />
                <p className="mt-2 flex items-start gap-1.5 text-xs text-ink-500">
                  <Info size={13} className="mt-0.5 shrink-0" />
                  {routeId ? 'Platform-fixed fare for this popular route.' : 'Estimated from distance.'} Only the advance fee is online; the fare is cash to your driver.
                  {bookingType === 'seat_share' && ' This is the whole-cab estimate — split across seats.'}
                </p>
              </div>
            ) : (
              <div className="rounded-xl bg-accent-soft p-4 text-sm text-accent">
                <p className="flex items-center gap-1.5 font-medium"><Gavel size={15} /> Reverse bidding</p>
                <p className="mt-1 text-accent/80">
                  Verified drivers will send blind quotes {fare ? `(typical ${inr(fare.fareAmount)})` : ''}. You compare price, rating &amp; vehicle, then pay a {fare?.feePercent ?? 10}% fee on the quote you accept.
                </p>
              </div>
            )}

            <Button className="w-full" size="lg" loading={book.isPending} icon={mode === 'fixed' ? IndianRupee : Gavel} onClick={submit}>
              {mode === 'fixed'
                ? fare ? `Book & pay ${inr(fare.feeAmount)} advance` : 'Book ride'
                : 'Post Ride Alert'}
            </Button>
          </CardBody>
        </Card>
      )}

      {!hasTrip && (
        <EmptyState icon={MapPin} title="Where to?" message="Set your pickup and drop above — or tap a popular destination — to see fares." />
      )}
    </div>
  );
}

function IconStep({ icon: Icon, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 text-ink-600 transition-colors hover:border-accent/40 disabled:opacity-40"
    >
      <Icon size={15} />
    </button>
  );
}

function Row({ label, value, hint, bold }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className={`text-sm ${bold ? 'font-semibold text-ink-900' : 'text-ink-600'}`}>
        {label}
        {hint && <span className="ml-1 text-xs text-ink-400">· {hint}</span>}
      </span>
      <span className={`${bold ? 'text-lg font-semibold text-accent' : 'text-sm font-medium text-ink-800'}`}>{value}</span>
    </div>
  );
}
