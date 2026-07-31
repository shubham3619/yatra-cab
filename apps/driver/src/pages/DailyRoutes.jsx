import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, CardBody, Button, IconButton, Field, Input, Select, Badge, Modal, Segmented, PageHeader,
  LocationInput, QueryBoundary, LoadingScreen, EmptyState, toast, inr, vehicleLabel,
} from '@yatracab/ui';
import {
  Repeat, Plus, MapPin, ArrowRight, Clock, Pencil, Trash2, Users2, Car, ShieldCheck,
} from 'lucide-react';
import { api } from '../api.js';

const DAYS = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

const emptyForm = {
  origin: null,
  destination: null,
  departureTime: '09:00',
  days: [],
  bookingType: 'seat_share',
  vehicleType: 'sedan',
  seatsTotal: 3,
  perSeatFare: 0,
  fullCabFare: 0,
  womenOnly: false,
};

export default function DailyRoutes() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['driver-daily-routes'], queryFn: () => api.get('/driver/daily-routes').then((r) => r.routes) });
  const [modal, setModal] = useState(null); // null | { route? }

  const invalidate = () => qc.invalidateQueries({ queryKey: ['driver-daily-routes'] });

  const toggle = useMutation({
    mutationFn: (route) => api.patch(`/driver/daily-routes/${route._id}`, buildPayload({ ...route, active: !route.active })),
    onSuccess: () => { toast.success('Route updated'); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id) => api.del(`/driver/daily-routes/${id}`),
    onSuccess: () => { toast.success('Route removed'); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        icon={Repeat}
        title="Daily routes"
        subtitle="Fixed daily trips that riders can find and book directly."
        action={<Button icon={Plus} onClick={() => setModal({})}>Add route</Button>}
      />

      <QueryBoundary
        query={query}
        loading={<LoadingScreen label="Loading your routes…" />}
        isEmpty={(d) => !d?.length}
        empty={<EmptyState icon={Repeat} title="No daily routes yet" message="Add a fixed route to appear directly in rider search." action={<Button icon={Plus} onClick={() => setModal({})}>Add route</Button>} />}
      >
        {(routes) => (
          <div className="space-y-3">
            {routes.map((r) => (
              <RouteCard
                key={r._id}
                route={r}
                onEdit={() => setModal({ route: r })}
                onDelete={() => del.mutate(r._id)}
                onToggle={() => toggle.mutate(r)}
                busy={toggle.isPending || del.isPending}
              />
            ))}
          </div>
        )}
      </QueryBoundary>

      {modal && (
        <RouteModal
          route={modal.route}
          onClose={() => setModal(null)}
          onDone={() => { invalidate(); setModal(null); }}
        />
      )}
    </div>
  );
}

function RouteCard({ route, onEdit, onDelete, onToggle, busy }) {
  const seatShare = route.bookingType === 'seat_share';
  return (
    <Card className={route.active ? '' : 'opacity-70'}>
      <CardBody className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-ink-900">
              <MapPin size={15} className="shrink-0 text-accent" />
              <span className="truncate">{route.origin?.address}</span>
              <ArrowRight size={14} className="shrink-0 text-ink-300" />
              <span className="truncate">{route.destination?.address}</span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink-500">
              <span className="inline-flex items-center gap-1"><Clock size={12} /> {route.departureTime}</span>
              <span className="inline-flex items-center gap-1"><Car size={12} /> {vehicleLabel(route.vehicleType)}</span>
              {route.distanceKm ? <span>{route.distanceKm} km</span> : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <IconButton icon={Pencil} label="Edit" onClick={onEdit} />
            <IconButton icon={Trash2} label="Delete" onClick={onDelete} className="hover:text-danger" />
          </div>
        </div>

        {/* Day chips */}
        <div className="flex flex-wrap gap-1.5">
          {DAYS.map((d) => {
            const on = route.days?.includes(d.key);
            return (
              <span key={d.key} className={`rounded-md px-2 py-0.5 text-xs font-medium ${on ? 'bg-accent text-accent-fg' : 'bg-ink-100 text-ink-400'}`}>
                {d.label}
              </span>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={seatShare ? 'info' : 'accent'}>
              {seatShare ? <><Users2 size={12} /> Seat share</> : <><Car size={12} /> Full cab</>}
            </Badge>
            {route.womenOnly && <Badge tone="warning" dot><ShieldCheck size={12} /> Women only</Badge>}
            <span className="text-sm font-semibold text-ink-900">
              {seatShare ? `${inr(route.perSeatFare)} / seat` : inr(route.fullCabFare)}
              {seatShare && route.seatsTotal ? <span className="ml-1 text-xs font-normal text-ink-400">· {route.seatsTotal} seats</span> : null}
            </span>
          </div>
          <Button size="sm" variant={route.active ? 'secondary' : 'success'} loading={busy} onClick={onToggle}>
            {route.active ? 'Active' : 'Inactive'}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function buildPayload(f) {
  return {
    origin: f.origin,
    destination: f.destination,
    departureTime: f.departureTime,
    days: f.days,
    bookingType: f.bookingType,
    vehicleType: f.vehicleType,
    seatsTotal: Number(f.seatsTotal),
    perSeatFare: Number(f.perSeatFare),
    fullCabFare: Number(f.fullCabFare),
    womenOnly: !!f.womenOnly,
    ...(f.active != null ? { active: f.active } : {}),
  };
}

function RouteModal({ route, onClose, onDone }) {
  const editing = !!route;
  const [form, setForm] = useState(() => (route ? { ...emptyForm, ...route } : emptyForm));
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const seatShare = form.bookingType === 'seat_share';

  const save = useMutation({
    mutationFn: () => {
      const payload = buildPayload({ ...form, active: editing ? form.active : true });
      return editing
        ? api.patch(`/driver/daily-routes/${route._id}`, payload)
        : api.post('/driver/daily-routes', payload);
    },
    onSuccess: () => { toast.success(editing ? 'Route updated' : 'Route added'); onDone(); },
    onError: (e) => toast.error(e.message),
  });

  const submit = () => {
    if (!form.origin?.lat || !form.origin?.lng) return toast.error('Pick an origin from the suggestions');
    if (!form.destination?.lat || !form.destination?.lng) return toast.error('Pick a destination from the suggestions');
    if (!form.days.length) return toast.error('Select at least one day');
    save.mutate();
  };

  const toggleDay = (key) => set({ days: form.days.includes(key) ? form.days.filter((d) => d !== key) : [...form.days, key] });

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? 'Edit route' : 'Add daily route'}
      subtitle="Riders will see this in their search results."
      size="lg"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button loading={save.isPending} onClick={submit}>{editing ? 'Save changes' : 'Add route'}</Button>
      </>}
    >
      <div className="space-y-4">
        <Field label="From">
          <LocationInput value={form.origin} onChange={(loc) => set({ origin: loc })} placeholder="Pickup point" allowCurrentLocation icon={MapPin} onError={(m) => toast.error(m)} />
        </Field>
        <Field label="To">
          <LocationInput value={form.destination} onChange={(loc) => set({ destination: loc })} placeholder="Drop point" icon={MapPin} onError={(m) => toast.error(m)} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Departure time">
            <Input type="time" value={form.departureTime} onChange={(e) => set({ departureTime: e.target.value })} />
          </Field>
          <Field label="Vehicle type">
            <Select value={form.vehicleType} onChange={(e) => set({ vehicleType: e.target.value })}>
              {['hatchback', 'sedan', 'suv', 'tempo'].map((t) => <option key={t} value={t}>{vehicleLabel(t)}</option>)}
            </Select>
          </Field>
        </div>

        <Field label="Days">
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d) => {
              const on = form.days.includes(d.key);
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => toggleDay(d.key)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${on ? 'border-accent bg-accent text-accent-fg' : 'border-ink-200 text-ink-600 hover:border-accent/40'}`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Booking type">
          <Segmented
            value={form.bookingType}
            onChange={(v) => set({ bookingType: v })}
            options={[{ value: 'seat_share', label: 'Seat share' }, { value: 'full_cab', label: 'Full cab' }]}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          {seatShare ? (
            <>
              <Field label="Total seats">
                <Input type="number" min={1} max={20} value={form.seatsTotal} onChange={(e) => set({ seatsTotal: e.target.value })} />
              </Field>
              <Field label="Fare per seat (₹)">
                <Input type="number" min={0} value={form.perSeatFare} onChange={(e) => set({ perSeatFare: e.target.value })} />
              </Field>
            </>
          ) : (
            <Field label="Full cab fare (₹)" className="sm:col-span-2">
              <Input type="number" min={0} value={form.fullCabFare} onChange={(e) => set({ fullCabFare: e.target.value })} />
            </Field>
          )}
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-ink-200 p-3.5">
          <input type="checkbox" checked={!!form.womenOnly} onChange={(e) => set({ womenOnly: e.target.checked })} className="h-4 w-4 accent-emerald-600" />
          <div>
            <p className="text-sm font-medium text-ink-800">Women only</p>
            <p className="text-xs text-ink-400">Only women riders can book this route.</p>
          </div>
        </label>
      </div>
    </Modal>
  );
}
