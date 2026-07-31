import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PageHeader, Table, Segmented, Input, Field, Textarea, Modal, Button, Badge, StatusBadge,
  Avatar, StarRating, QueryBoundary, LoadingScreen, EmptyState,
  vehicleLabel, formatDateTime, VERIFICATION_META, RIDE_STATUS_META, inr, toast,
} from '@yatracab/ui';
import { Car, Search, Ban, ShieldCheck, IndianRupee } from 'lucide-react';
import { api } from '../api.js';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function Drivers() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [penaltyAmount, setPenaltyAmount] = useState('');
  const [penaltyReason, setPenaltyReason] = useState('');

  const params = new URLSearchParams();
  if (status !== 'all') params.set('status', status);
  if (q.trim()) params.set('q', q.trim());

  const listQuery = useQuery({
    queryKey: ['drivers', status, q.trim()],
    queryFn: () => api.get(`/admin/drivers?${params.toString()}`).then((r) => r.drivers),
  });

  const detailQuery = useQuery({
    queryKey: ['driver', activeId],
    queryFn: () => api.get(`/admin/drivers/${activeId}`),
    enabled: !!activeId,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['drivers'] });
    qc.invalidateQueries({ queryKey: ['driver', activeId] });
  };

  const block = useMutation({
    mutationFn: ({ id, blocked }) => api.patch(`/admin/drivers/${id}/block`, { blocked }),
    onSuccess: (_d, v) => { toast.success(v.blocked ? 'Driver blocked' : 'Driver unblocked'); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const penalty = useMutation({
    mutationFn: ({ amount, reason }) => api.post(`/admin/drivers/${activeId}/penalty`, { amount, reason }),
    onSuccess: () => { toast.success('Penalty applied'); setPenaltyAmount(''); setPenaltyReason(''); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const closeModal = () => { setActiveId(null); setPenaltyAmount(''); setPenaltyReason(''); };

  const columns = [
    {
      key: 'driver', header: 'Driver', render: (d) => (
        <div className="flex items-center gap-3">
          <Avatar name={d.user?.name} size={36} />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink-900">{d.user?.name || '—'}</p>
            <p className="text-xs text-ink-500">{d.user?.phone}</p>
          </div>
        </div>
      ),
    },
    { key: 'vehicle', header: 'Vehicle', render: (d) => vehicleLabel(d.vehicle?.type) },
    { key: 'status', header: 'Status', render: (d) => <StatusBadge meta={VERIFICATION_META[d.verificationStatus]} /> },
    {
      key: 'online', header: 'Online', render: (d) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-600">
          <span className={`h-2 w-2 rounded-full ${d.isOnline ? 'bg-success' : 'bg-ink-300'}`} />
          {d.isOnline ? 'Online' : 'Offline'}
        </span>
      ),
    },
    { key: 'rating', header: 'Rating', render: (d) => <StarRating value={d.rating || 0} /> },
    { key: 'completedRides', header: 'Rides', align: 'right', render: (d) => d.completedRides ?? 0 },
    {
      key: 'actions', header: 'Actions', align: 'right', render: (d) => (
        <Button
          size="sm"
          variant={d.user?.isBlocked ? 'success' : 'secondary'}
          icon={d.user?.isBlocked ? ShieldCheck : Ban}
          onClick={(e) => { e.stopPropagation(); block.mutate({ id: d._id, blocked: !d.user?.isBlocked }); }}
        >
          {d.user?.isBlocked ? 'Unblock' : 'Block'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader icon={Car} title="Drivers" subtitle="All registered drivers across the fleet." />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented value={status} onChange={setStatus} options={STATUS_FILTERS} />
        <div className="relative sm:w-72">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <Input placeholder="Search name or phone…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      </div>

      <QueryBoundary
        query={listQuery}
        loading={<LoadingScreen label="Loading drivers…" />}
        isEmpty={(d) => !d?.length}
        empty={<EmptyState icon={Car} title="No drivers found" message="Try a different filter or search term." />}
      >
        {(drivers) => (
          <Table rowKey={(d) => d._id} data={drivers} columns={columns} onRowClick={(d) => setActiveId(d._id)} />
        )}
      </QueryBoundary>

      <Modal
        open={!!activeId}
        onClose={closeModal}
        title={detailQuery.data?.driver?.user?.name || 'Driver'}
        subtitle="Driver detail & recent rides"
        size="lg"
        footer={<Button variant="secondary" onClick={closeModal}>Close</Button>}
      >
        {detailQuery.isLoading ? (
          <LoadingScreen label="Loading driver…" />
        ) : detailQuery.isError ? (
          <p className="text-sm text-danger">{detailQuery.error?.message}</p>
        ) : detailQuery.data ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-4 rounded-xl bg-ink-50 p-4">
              <Avatar name={detailQuery.data.driver?.user?.name} size={48} />
              <div className="min-w-0">
                <p className="font-semibold text-ink-900">{detailQuery.data.driver?.user?.name}</p>
                <p className="text-sm text-ink-500">{detailQuery.data.driver?.user?.phone} · {detailQuery.data.driver?.user?.email || 'no email'}</p>
              </div>
              <div className="ml-auto flex flex-wrap gap-2">
                <StatusBadge meta={VERIFICATION_META[detailQuery.data.driver?.verificationStatus]} />
                <Badge tone="accent">{vehicleLabel(detailQuery.data.driver?.vehicle?.type)}</Badge>
                {detailQuery.data.driver?.user?.isBlocked && <Badge tone="danger">Blocked</Badge>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <Stat label="Completed" value={detailQuery.data.driver?.completedRides ?? 0} />
              <Stat label="Rating" value={(detailQuery.data.driver?.rating || 0).toFixed(1)} />
              <Stat label="Loyalty" value={detailQuery.data.driver?.loyaltyPoints ?? 0} />
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-ink-700">Recent rides</p>
              {(detailQuery.data.recentRides || []).length === 0 ? (
                <p className="text-sm text-ink-400">No rides yet.</p>
              ) : (
                <div className="space-y-2">
                  {detailQuery.data.recentRides.map((r) => (
                    <div key={r._id} className="flex items-center justify-between rounded-xl border border-ink-100 px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium text-ink-900">{r.destination || r.route?.destination || '—'}</p>
                        <p className="text-xs text-ink-400">{formatDateTime(r.scheduledAt || r.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge meta={RIDE_STATUS_META[r.status]} />
                        <span className="font-medium text-ink-900">{inr(r.totalAmount || r.fareAmount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-ink-200 p-4">
              <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ink-700"><IndianRupee size={15} /> Apply penalty</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Amount">
                  <Input type="number" min={1} placeholder="500" value={penaltyAmount} onChange={(e) => setPenaltyAmount(e.target.value)} />
                </Field>
                <Field label="Reason">
                  <Input placeholder="No-show / late cancellation" value={penaltyReason} onChange={(e) => setPenaltyReason(e.target.value)} />
                </Field>
              </div>
              <div className="mt-3 flex justify-end">
                <Button
                  variant="danger"
                  size="sm"
                  loading={penalty.isPending}
                  onClick={() =>
                    Number(penaltyAmount) > 0 && penaltyReason.trim()
                      ? penalty.mutate({ amount: Number(penaltyAmount), reason: penaltyReason.trim() })
                      : toast.error('Enter an amount and reason')
                  }
                >
                  Apply penalty
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-ink-50 p-3">
      <p className="text-lg font-semibold text-ink-900">{value}</p>
      <p className="text-xs text-ink-400">{label}</p>
    </div>
  );
}
