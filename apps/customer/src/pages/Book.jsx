import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Card, CardBody, Button, Field, Input, Textarea, Select, Segmented, LocationInput,
  EmptyState, toast,
} from '@yatracab/ui';
import {
  MapPin, Navigation, Gavel, Info, Route as RouteIcon, ArrowDown, Clock,
  Users2, ShieldCheck, Minus, Plus, Train, ChevronDown,
} from 'lucide-react';
import { api } from '../api.js';
import { MapPicker } from '../components/MapPicker.jsx';
import { PHOTOS } from '../lib/photos.js';

const defaultWhen = () => {
  const d = new Date(Date.now() + 24 * 3600 * 1000);
  d.setMinutes(0, 0, 0);
  return d.toISOString().slice(0, 16);
};

export default function Book() {
  const navigate = useNavigate();
  // Deep-link presets from the home tiles: /book?mode=bidding&trip=one_way&type=seat_share
  const [params] = useSearchParams();
  // Every booking is an open request drivers quote on — there is no fixed-fare
  // path in the UI any more, so the rider never picks a vehicle or sees a price.
  const mode = 'bidding';
  const [pickup, setPickup] = useState(null); // { address, lat, lng }
  const [drop, setDrop] = useState(null);
  // Most riders take a single trip, so one-way is the default.
  const [tripType, setTripType] = useState(params.get('trip') === 'round_trip' ? 'round_trip' : 'one_way');
  const [scheduledAt, setScheduledAt] = useState(defaultWhen());
  const [passengers, setPassengers] = useState(2);
  const [notes, setNotes] = useState('');
  const [biddingWindowMins, setBiddingWindowMins] = useState(30);
  const [bookingType, setBookingType] = useState(params.get('type') === 'seat_share' ? 'seat_share' : 'full_cab');
  const [seats, setSeats] = useState(1);
  const [womenOnly, setWomenOnly] = useState(false);
  const [transportOpen, setTransportOpen] = useState(false);
  const [transportType, setTransportType] = useState('none');
  const [transportNumber, setTransportNumber] = useState('');
  const [transportAt, setTransportAt] = useState('');
  const [mapFor, setMapFor] = useState(null); // 'pickup' | 'drop'


  const hasTrip = pickup?.lat != null && drop?.lat != null;

  const quoteQuery = useQuery({
    queryKey: ['quote', pickup?.lat, pickup?.lng, drop?.lat, drop?.lng, drop?.address, tripType],
    enabled: hasTrip,
    queryFn: () =>
      api
        .post('/customer/rides/quote', { pickup, drop, tripType })
        .then((r) => r.quote),
  });
  const quote = quoteQuery.data;

  const onDropChange = (loc) => setDrop(loc);

  const book = useMutation({
    mutationFn: () => {
      const base = {
        // A Ride Alert carries no vehicle preference — drivers bid with theirs.
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
    if (pickup?.lat == null) return toast.error('Pick your pickup from the list or use your location');
    if (drop?.lat == null) return toast.error('Choose a drop location');
    book.mutate();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Book a ride</h1>
          <p className="text-sm text-ink-500">Tell us where and when — verified drivers send you their quotes.</p>
        </div>

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
                <span className="flex items-center gap-2">
                  <img src={PHOTOS.womenOnly} alt="Two women travelling together" className="h-7 w-7 rounded-full border-2 border-white object-cover shadow-sm" />
                  <ShieldCheck size={15} /> Women only
                </span>
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
                <LocationInput
                  value={pickup}
                  onChange={setPickup}
                  placeholder="Search pickup point"
                  allowCurrentLocation
                  icon={Navigation}
                  onOpenMap={() => setMapFor('pickup')}
                  onError={toast.error}
                />
              </div>
              <div className="flex justify-center">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink-100 text-ink-400"><ArrowDown size={14} /></span>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">Drop</p>
                <LocationInput
                  value={drop}
                  onChange={onDropChange}
                  placeholder="Search destination"
                  icon={MapPin}
                  refineNearby
                  onOpenMap={() => setMapFor('drop')}
                  onError={toast.error}
                />
              </div>
            </div>
          </div>

        </CardBody>
      </Card>

      {/* Trip details (once a trip is set) */}
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
                </>
              ) : null}
            </div>

            {/* No vehicle picker and no prices: the rider says where and when,
                every available driver quotes with their own cab, and the rider
                chooses on comfort and price from the bids. */}
            <div className="flex items-start gap-2.5 rounded-xl bg-accent-soft p-4 text-sm text-ink-700">
              <Gavel size={16} className="mt-0.5 shrink-0 text-accent" />
              <p>
                <span className="font-semibold text-ink-900">Drivers will quote for this trip.</span> Your request goes
                to every available driver right away. You'll see each one's vehicle, seats, rating and price — pick
                whichever suits you.
              </p>
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
                <Field label="Quote window" hint="how long drivers can bid">
                  <Select value={biddingWindowMins} onChange={(e) => setBiddingWindowMins(e.target.value)}>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={180}>3 hours</option>
                    <option value={360}>6 hours</option>
                    <option value={720}>12 hours</option>
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

            {/* Deliberately no fare here — price comes from the drivers' quotes. */}
            <div className="rounded-xl bg-ink-50 p-4 text-sm text-ink-600">
              <p className="flex items-center gap-1.5 font-medium text-ink-900"><Info size={15} /> What happens next</p>
              <ol className="mt-2 space-y-1 pl-4 text-ink-600 [&>li]:list-decimal">
                <li>Your trip reaches every available driver instantly.</li>
                <li>They send blind quotes — no one can see anyone else's price.</li>
                <li>You compare vehicle, rating and price, then accept the one you like.</li>
              </ol>
              <p className="mt-2 text-xs text-ink-500">Nothing is charged until you accept a quote.</p>
            </div>

            <Button className="w-full" size="lg" loading={book.isPending} icon={Gavel} onClick={submit}>
              Get driver quotes
            </Button>
          </CardBody>
        </Card>
      )}

      <MapPicker
        open={mapFor !== null}
        value={mapFor === 'pickup' ? pickup : drop}
        title={mapFor === 'pickup' ? 'Adjust pickup point' : 'Adjust drop point'}
        onClose={() => setMapFor(null)}
        onConfirm={(loc) => (mapFor === 'pickup' ? setPickup(loc) : onDropChange(loc))}
      />

      {!hasTrip && (
        <EmptyState icon={MapPin} title="Where to?" message="Set your pickup and drop above to request quotes from drivers." />
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
