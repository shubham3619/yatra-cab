import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, CardHeader, CardBody, Button, Field, Input, Select, Badge, StatusBadge, PageHeader,
  QueryBoundary, LoadingScreen, toast, vehicleLabel, VERIFICATION_META, useAuth,
} from '@yatracab/ui';
import { Car, FileCheck2, MapPin, ShieldCheck, Upload, CheckCircle2, Clock, XCircle, User } from 'lucide-react';
import { api } from '../api.js';

const DOC_TYPES = [
  { type: 'driving_licence', label: 'Driving Licence', required: true },
  { type: 'vehicle_rc', label: 'Vehicle RC', required: true },
  { type: 'aadhaar', label: 'Aadhaar', required: true },
  { type: 'permit', label: 'Commercial / Tourist Permit', required: true },
  { type: 'insurance', label: 'Passenger Insurance', required: true },
  { type: 'profile_photo', label: 'Profile Photo', required: false },
];

const docTone = { approved: 'success', pending: 'warning', rejected: 'danger' };

export default function Profile() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['driver-profile-page'], queryFn: () => api.get('/driver/profile').then((r) => r.driver) });
  const routesQ = useQuery({ queryKey: ['all-routes'], queryFn: () => api.get('/shared/routes').then((r) => r.routes) });

  return (
    <div className="animate-fade-in">
      <PageHeader icon={User} title="Driver profile" subtitle="Vehicle, routes and documents. Get verified to start driving." />
      <QueryBoundary query={query} loading={<LoadingScreen label="Loading profile…" />}>
        {(driver) => <Inner driver={driver} routes={routesQ.data || []} onChange={() => qc.invalidateQueries({ queryKey: ['driver-profile-page'] })} />}
      </QueryBoundary>
    </div>
  );
}

function Inner({ driver, routes, onChange }) {
  const { user, refreshMe } = useAuth();
  const [vehicle, setVehicle] = useState(driver.vehicle || {});
  const [serves, setServes] = useState((driver.servesRoutes || []).map((r) => r._id || r));
  const [gender, setGender] = useState(user?.gender || 'unspecified');

  useEffect(() => {
    setVehicle(driver.vehicle || {});
    setServes((driver.servesRoutes || []).map((r) => r._id || r));
  }, [driver]);

  useEffect(() => {
    setGender(user?.gender || 'unspecified');
  }, [user?.gender]);

  const saveProfile = useMutation({
    mutationFn: () => api.patch('/driver/profile', { vehicle, servesRoutes: serves, gender }),
    onSuccess: () => { toast.success('Profile saved'); onChange(); refreshMe?.(); },
    onError: (e) => toast.error(e.message),
  });

  const submitDoc = useMutation({
    mutationFn: (payload) => api.post('/driver/documents', payload),
    onSuccess: () => { toast.success('Document saved'); onChange(); },
    onError: (e) => toast.error(e.message),
  });

  const submitVerification = useMutation({
    mutationFn: () => api.post('/driver/submit-verification'),
    onSuccess: () => { toast.success('Submitted for verification!'); onChange(); },
    onError: (e) => toast.error(e.message),
  });

  const docByType = Object.fromEntries((driver.documents || []).map((d) => [d.type, d]));
  const approved = driver.verificationStatus === 'approved';

  const toggleRoute = (id) => setServes((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="space-y-5">
      {/* Status */}
      <Card>
        <CardBody className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent"><ShieldCheck size={22} /></span>
            <div>
              <p className="font-semibold text-ink-900">Verification</p>
              <p className="text-sm text-ink-500">{approved ? 'You are approved to drive.' : 'Complete the steps below to get verified.'}</p>
            </div>
          </div>
          <StatusBadge meta={VERIFICATION_META[driver.verificationStatus]} />
        </CardBody>
      </Card>

      {/* Vehicle */}
      <Card>
        <CardHeader title="Vehicle details" icon={Car} />
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vehicle type">
              <Select value={vehicle.type || 'sedan'} onChange={(e) => setVehicle({ ...vehicle, type: e.target.value })}>
                {['hatchback', 'sedan', 'suv', 'tempo'].map((t) => <option key={t} value={t}>{vehicleLabel(t)}</option>)}
              </Select>
            </Field>
            <Field label="Seats"><Input type="number" value={vehicle.seats || 4} onChange={(e) => setVehicle({ ...vehicle, seats: Number(e.target.value) })} /></Field>
            <Field label="Make"><Input value={vehicle.make || ''} onChange={(e) => setVehicle({ ...vehicle, make: e.target.value })} placeholder="Maruti" /></Field>
            <Field label="Model"><Input value={vehicle.model || ''} onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })} placeholder="Dzire" /></Field>
            <Field label="Plate number"><Input value={vehicle.plateNumber || ''} onChange={(e) => setVehicle({ ...vehicle, plateNumber: e.target.value.toUpperCase() })} placeholder="RJ14AB1234" /></Field>
            <Field label="Colour"><Input value={vehicle.color || ''} onChange={(e) => setVehicle({ ...vehicle, color: e.target.value })} placeholder="White" /></Field>
            <Field label="Gender" hint="Helps match women-only rides">
              <Select value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
                <option value="unspecified">Prefer not to say</option>
              </Select>
            </Field>
          </div>
        </CardBody>
      </Card>

      {/* Routes served */}
      <Card>
        <CardHeader title="Routes you serve" subtitle="You'll get Ride Alerts for these" icon={MapPin} />
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {routes.map((r) => {
              const on = serves.includes(r._id);
              return (
                <button key={r._id} onClick={() => toggleRoute(r._id)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all ${on ? 'border-accent bg-accent text-accent-fg' : 'border-ink-200 text-ink-600 hover:border-accent/40'}`}>
                  {r.destination}
                </button>
              );
            })}
          </div>
          <Button className="mt-4" loading={saveProfile.isPending} onClick={() => saveProfile.mutate()}>Save vehicle &amp; routes</Button>
        </CardBody>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader title="Documents (KYC)" subtitle="Required for verification" icon={FileCheck2} />
        <CardBody className="space-y-3">
          {DOC_TYPES.map((d) => (
            <DocRow key={d.type} def={d} doc={docByType[d.type]} onSubmit={(payload) => submitDoc.mutate({ type: d.type, ...payload })} busy={submitDoc.isPending} />
          ))}
        </CardBody>
      </Card>

      {/* Submit */}
      {!approved && (
        <Button size="lg" className="w-full" icon={Upload} loading={submitVerification.isPending} onClick={() => submitVerification.mutate()}>
          Submit for verification
        </Button>
      )}
    </div>
  );
}

function DocRow({ def, doc, onSubmit, busy }) {
  const [number, setNumber] = useState(doc?.number || '');
  const StatusIcon = doc?.status === 'approved' ? CheckCircle2 : doc?.status === 'rejected' ? XCircle : Clock;

  return (
    <div className="rounded-xl border border-ink-200 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-ink-800">{def.label}</span>
          {def.required && !doc && <Badge tone="neutral">Required</Badge>}
          {doc && (
            <Badge tone={docTone[doc.status] || 'neutral'} dot>
              <StatusIcon size={12} /> {doc.status}
            </Badge>
          )}
        </div>
      </div>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder={`${def.label} number`} className="flex-1" />
        <Button variant="secondary" size="md" loading={busy} onClick={() => onSubmit({ number, url: 'https://placehold.co/600x400?text=Doc' })}>
          {doc ? 'Update' : 'Upload'}
        </Button>
      </div>
      {doc?.rejectionReason && <p className="mt-1.5 text-xs text-danger">Rejected: {doc.rejectionReason}</p>}
    </div>
  );
}
