import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PageHeader, Table, Segmented, Select, Field, Textarea, Modal, Button, Badge, StatusBadge,
  QueryBoundary, LoadingScreen, EmptyState,
  inr, formatDateTime, vehicleLabel, RIDE_STATUS_META, toast,
} from '@yatracab/ui';
import { ClipboardList, MapPin, XCircle } from 'lucide-react';
import { api } from '../api.js';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'searching', label: 'Bidding' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const CANCELLABLE = ['pending_payment', 'searching', 'confirmed', 'ongoing'];

export default function Bookings() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('all');
  const [mode, setMode] = useState('all');
  const [activeId, setActiveId] = useState(null);
  const [reason, setReason] = useState('');
  const [penaltyDriver, setPenaltyDriver] = useState(false);

  const params = new URLSearchParams();
  if (status !== 'all') params.set('status', status);
  if (mode !== 'all') params.set('mode', mode);

  const listQuery = useQuery({
    queryKey: ['bookings', status, mode],
    queryFn: () => api.get(`/admin/bookings?${params.toString()}`).then((r) => r.rides),
  });

  const detailQuery = useQuery({
    queryKey: ['booking', activeId],
    queryFn: () => api.get(`/admin/bookings/${activeId}`).then((r) => r.ride),
    enabled: !!activeId,
  });

  const cancel = useMutation({
    mutationFn: () => api.patch(`/admin/bookings/${activeId}/cancel`, { reason: reason.trim(), fullRefund: true, penaltyDriver }),
    onSuccess: () => {
      toast.success('Booking cancelled & refunded');
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['booking', activeId] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      closeModal();
    },
    onError: (e) => toast.error(e.message),
  });

  const closeModal = () => { setActiveId(null); setReason(''); setPenaltyDriver(false); };

  const columns = [
    {
      key: 'destination', header: 'Destination', render: (r) => (
        <span className="font-medium text-ink-900">{r.destination || r.route?.destination || '—'}</span>
      ),
    },
    { key: 'customer', header: 'Customer', render: (r) => r.customer?.name || '—' },
    { key: 'driver', header: 'Driver', render: (r) => r.driver?.user?.name || <span className="text-ink-400">Unassigned</span> },
    {
      key: 'mode', header: 'Mode', render: (r) => (
        <Badge tone={r.mode === 'bidding' ? 'info' : 'accent'}>{r.mode === 'bidding' ? 'Bidding' : 'Fixed'}</Badge>
      ),
    },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge meta={RIDE_STATUS_META[r.status]} /> },
    { key: 'total', header: 'Total', align: 'right', render: (r) => <span className="font-medium text-ink-900">{inr(r.totalAmount)}</span> },
    { key: 'scheduledAt', header: 'When', align: 'right', render: (r) => <span className="text-ink-500">{formatDateTime(r.scheduledAt || r.createdAt)}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader icon={ClipboardList} title="Bookings" subtitle="Every ride across the platform." />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented value={status} onChange={setStatus} options={STATUS_FILTERS} className="flex-wrap" />
        <Field className="sm:w-44">
          <Select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="all">All modes</option>
            <option value="fixed">Fixed fare</option>
            <option value="bidding">Bidding</option>
          </Select>
        </Field>
      </div>

      <QueryBoundary
        query={listQuery}
        loading={<LoadingScreen label="Loading bookings…" />}
        isEmpty={(d) => !d?.length}
        empty={<EmptyState icon={ClipboardList} title="No bookings found" message="Try a different filter." />}
      >
        {(rides) => (
          <Table rowKey={(r) => r._id} data={rides} columns={columns} onRowClick={(r) => setActiveId(r._id)} />
        )}
      </QueryBoundary>

      <Modal
        open={!!activeId}
        onClose={closeModal}
        title={detailQuery.data?.destination || detailQuery.data?.route?.destination || 'Booking'}
        subtitle="Ride detail"
        size="lg"
        footer={<Button variant="secondary" onClick={closeModal}>Close</Button>}
      >
        {detailQuery.isLoading ? (
          <LoadingScreen label="Loading booking…" />
        ) : detailQuery.isError ? (
          <p className="text-sm text-danger">{detailQuery.error?.message}</p>
        ) : detailQuery.data ? (
          <div className="space-y-5">
            <div className="rounded-xl bg-ink-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-ink-600">
                  <MapPin size={15} className="text-accent" />
                  {detailQuery.data.route?.origin || '—'} → {detailQuery.data.route?.destination || detailQuery.data.destination}
                </div>
                <StatusBadge meta={RIDE_STATUS_META[detailQuery.data.status]} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                <Info label="Mode" value={detailQuery.data.mode === 'bidding' ? 'Bidding' : 'Fixed'} />
                <Info label="Vehicle" value={vehicleLabel(detailQuery.data.vehicleType)} />
                <Info label="Scheduled" value={formatDateTime(detailQuery.data.scheduledAt)} />
                <Info label="Customer" value={detailQuery.data.customer?.name || '—'} />
                <Info label="Driver" value={detailQuery.data.driver?.user?.name || 'Unassigned'} />
                <Info label="Created" value={formatDateTime(detailQuery.data.createdAt)} />
              </div>
            </div>

            <div className="rounded-xl border border-ink-200 p-4">
              <p className="mb-2 text-sm font-semibold text-ink-700">Fare breakdown</p>
              <Row label="Ride fare" value={inr(detailQuery.data.fareAmount)} />
              <Row label="Platform fee" value={inr(detailQuery.data.feeAmount)} />
              <div className="my-2 border-t border-ink-100" />
              <Row label="Total" value={inr(detailQuery.data.totalAmount)} bold />
            </div>

            {CANCELLABLE.includes(detailQuery.data.status) && (
              <div className="rounded-xl border border-danger/25 bg-danger-soft p-4">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink-700"><XCircle size={15} className="text-danger" /> Cancel & refund</p>
                <Field label="Cancellation reason">
                  <Textarea placeholder="Reason for admin cancellation…" value={reason} onChange={(e) => setReason(e.target.value)} />
                </Field>
                <label className="mt-3 flex items-center gap-2 text-sm text-ink-700">
                  <input type="checkbox" checked={penaltyDriver} onChange={(e) => setPenaltyDriver(e.target.checked)} className="h-4 w-4 rounded border-ink-300 text-accent focus:ring-accent" />
                  Apply penalty to driver
                </label>
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="danger"
                    icon={XCircle}
                    loading={cancel.isPending}
                    onClick={() => reason.trim() ? cancel.mutate() : toast.error('Enter a cancellation reason')}
                  >
                    Cancel & full refund
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs text-ink-400">{label}</p>
      <p className="font-medium text-ink-800">{value}</p>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className={`text-sm ${bold ? 'font-semibold text-ink-900' : 'text-ink-600'}`}>{label}</span>
      <span className={`${bold ? 'text-base font-semibold text-ink-900' : 'text-sm font-medium text-ink-800'}`}>{value}</span>
    </div>
  );
}
