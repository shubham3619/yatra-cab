import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PageHeader, Card, Button, Modal, Field, Input, Badge,
  QueryBoundary, LoadingScreen, EmptyState,
  inr, vehicleLabel, toast,
} from '@yatracab/ui';
import { Route as RouteIcon, Plus, Pencil, Trash2, Power } from 'lucide-react';
import { api } from '../api.js';

const VEHICLES = ['hatchback', 'sedan', 'suv', 'tempo'];

const emptyForm = () => ({
  origin: '', destination: '', templeName: '', distanceKm: '', estimatedMins: '',
  fixedFare: { hatchback: '', sedan: '', suv: '', tempo: '' },
  floorPrice: '', fairRange: { min: '', max: '' },
  feePercent: 10, surgeMultiplier: 1,
});

function toForm(r) {
  return {
    origin: r.origin ?? '', destination: r.destination ?? '', templeName: r.templeName ?? '',
    distanceKm: r.distanceKm ?? '', estimatedMins: r.estimatedMins ?? '',
    fixedFare: {
      hatchback: r.fixedFare?.hatchback ?? '', sedan: r.fixedFare?.sedan ?? '',
      suv: r.fixedFare?.suv ?? '', tempo: r.fixedFare?.tempo ?? '',
    },
    floorPrice: r.floorPrice ?? '',
    fairRange: { min: r.fairRange?.min ?? '', max: r.fairRange?.max ?? '' },
    feePercent: r.feePercent ?? 10, surgeMultiplier: r.surgeMultiplier ?? 1,
  };
}

function buildPayload(f) {
  const num = (v) => (v === '' || v == null ? undefined : Number(v));
  return {
    origin: f.origin.trim(), destination: f.destination.trim(), templeName: f.templeName.trim() || undefined,
    distanceKm: num(f.distanceKm), estimatedMins: num(f.estimatedMins),
    fixedFare: {
      hatchback: num(f.fixedFare.hatchback) || 0, sedan: num(f.fixedFare.sedan) || 0,
      suv: num(f.fixedFare.suv) || 0, tempo: num(f.fixedFare.tempo) || 0,
    },
    floorPrice: num(f.floorPrice), fairRange: { min: num(f.fairRange.min), max: num(f.fairRange.max) },
    feePercent: num(f.feePercent), surgeMultiplier: num(f.surgeMultiplier),
  };
}

export default function Routes() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null); // 'new' | route object | null
  const [form, setForm] = useState(emptyForm());

  const query = useQuery({ queryKey: ['routes-admin'], queryFn: () => api.get('/admin/routes').then((r) => r.routes) });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['routes-admin'] });

  const save = useMutation({
    mutationFn: () =>
      editing === 'new'
        ? api.post('/admin/routes', buildPayload(form))
        : api.patch(`/admin/routes/${editing._id}`, buildPayload(form)),
    onSuccess: () => { toast.success(editing === 'new' ? 'Route created' : 'Route updated'); invalidate(); closeModal(); },
    onError: (e) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: (route) => route.isActive ? api.del(`/admin/routes/${route._id}`) : api.patch(`/admin/routes/${route._id}`, { isActive: true }),
    onSuccess: (_d, route) => { toast.success(route.isActive ? 'Route deactivated' : 'Route activated'); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const openNew = () => { setForm(emptyForm()); setEditing('new'); };
  const openEdit = (r) => { setForm(toForm(r)); setEditing(r); };
  const closeModal = () => setEditing(null);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setFare = (v, val) => setForm((f) => ({ ...f, fixedFare: { ...f.fixedFare, [v]: val } }));
  const setRange = (k, val) => setForm((f) => ({ ...f, fairRange: { ...f.fairRange, [k]: val } }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={RouteIcon}
        title="Routes & Fares"
        subtitle="The pricing engine — fixed fares, floor prices, fair ranges and surge."
        action={<Button icon={Plus} onClick={openNew}>Add route</Button>}
      />

      <QueryBoundary
        query={query}
        loading={<LoadingScreen label="Loading routes…" />}
        isEmpty={(d) => !d?.length}
        empty={<EmptyState icon={RouteIcon} title="No routes yet" message="Add your first route to start pricing." action={<Button icon={Plus} onClick={openNew}>Add route</Button>} />}
      >
        {(routes) => (
          <div className="grid gap-4 lg:grid-cols-2">
            {routes.map((r) => (
              <Card key={r._id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-ink-900">{r.destination}</p>
                      {!r.isActive && <Badge tone="danger">Inactive</Badge>}
                    </div>
                    <p className="text-xs text-ink-500">from {r.origin}{r.distanceKm ? ` · ${r.distanceKm} km` : ''}{r.estimatedMins ? ` · ~${Math.round(r.estimatedMins / 60)}h` : ''}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="sm" variant="ghost" icon={Pencil} onClick={() => openEdit(r)}>Edit</Button>
                    <Button
                      size="sm"
                      variant={r.isActive ? 'ghost' : 'success'}
                      icon={r.isActive ? Trash2 : Power}
                      onClick={() => toggleActive.mutate(r)}
                    >
                      {r.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>

                {/* Fixed-fare matrix */}
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {VEHICLES.map((v) => (
                    <div key={v} className="rounded-xl bg-ink-50 p-2.5 text-center">
                      <p className="text-[11px] font-medium text-ink-400">{vehicleLabel(v)}</p>
                      <p className="mt-0.5 text-sm font-semibold text-ink-900">{inr(r.fixedFare?.[v])}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Badge tone="neutral">Floor {inr(r.floorPrice)}</Badge>
                  <Badge tone="neutral">Fair {inr(r.fairRange?.min)}–{inr(r.fairRange?.max)}</Badge>
                  <Badge tone="info">Fee {r.feePercent}%</Badge>
                  <Badge tone={r.surgeMultiplier > 1 ? 'warning' : 'neutral'}>Surge ×{r.surgeMultiplier}</Badge>
                  {r.supportsFixed && <Badge tone="accent">Fixed</Badge>}
                  {r.supportsBidding && <Badge tone="accent">Bidding</Badge>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </QueryBoundary>

      <Modal
        open={!!editing}
        onClose={closeModal}
        title={editing === 'new' ? 'Add route' : 'Edit route'}
        subtitle="Set the fare matrix and pricing rules"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button
              loading={save.isPending}
              onClick={() => form.origin.trim() && form.destination.trim() ? save.mutate() : toast.error('Origin and destination are required')}
            >
              {editing === 'new' ? 'Create route' : 'Save changes'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Origin"><Input value={form.origin} onChange={(e) => setField('origin', e.target.value)} placeholder="Jaipur" /></Field>
            <Field label="Destination"><Input value={form.destination} onChange={(e) => setField('destination', e.target.value)} placeholder="Khatu Shyam Ji" /></Field>
            <Field label="Landmark / area" hint="optional"><Input value={form.templeName} onChange={(e) => setField('templeName', e.target.value)} placeholder="e.g. Capital Region" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Distance (km)"><Input type="number" value={form.distanceKm} onChange={(e) => setField('distanceKm', e.target.value)} /></Field>
              <Field label="Est. mins"><Input type="number" value={form.estimatedMins} onChange={(e) => setField('estimatedMins', e.target.value)} /></Field>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-ink-700">Fixed fare per vehicle</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {VEHICLES.map((v) => (
                <Field key={v} label={vehicleLabel(v)}>
                  <Input type="number" value={form.fixedFare[v]} onChange={(e) => setFare(v, e.target.value)} placeholder="0" />
                </Field>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Floor price"><Input type="number" value={form.floorPrice} onChange={(e) => setField('floorPrice', e.target.value)} /></Field>
            <Field label="Fair range min"><Input type="number" value={form.fairRange.min} onChange={(e) => setRange('min', e.target.value)} /></Field>
            <Field label="Fair range max"><Input type="number" value={form.fairRange.max} onChange={(e) => setRange('max', e.target.value)} /></Field>
            <Field label="Fee %"><Input type="number" value={form.feePercent} onChange={(e) => setField('feePercent', e.target.value)} /></Field>
            <Field label="Surge ×"><Input type="number" step="0.1" value={form.surgeMultiplier} onChange={(e) => setField('surgeMultiplier', e.target.value)} /></Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}
