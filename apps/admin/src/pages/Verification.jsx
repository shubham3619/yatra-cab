import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PageHeader, Card, Button, Modal, Field, Textarea, Badge, StatusBadge, Avatar,
  QueryBoundary, LoadingScreen, EmptyState,
  vehicleLabel, formatDate, VERIFICATION_META, toast,
} from '@yatracab/ui';
import {
  BadgeCheck, Car, FileText, Check, X, ShieldCheck, Phone, MapPin,
} from 'lucide-react';
import { api } from '../api.js';

const DOC_META = {
  approved: { label: 'Approved', tone: 'success' },
  pending: { label: 'Pending', tone: 'warning' },
  rejected: { label: 'Rejected', tone: 'danger' },
};

export default function Verification() {
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  const listQuery = useQuery({
    queryKey: ['verification-queue'],
    queryFn: () => api.get('/admin/drivers?status=pending').then((r) => r.drivers),
  });

  const detailQuery = useQuery({
    queryKey: ['driver', activeId],
    queryFn: () => api.get(`/admin/drivers/${activeId}`),
    enabled: !!activeId,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['verification-queue'] });
    qc.invalidateQueries({ queryKey: ['driver', activeId] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const approve = useMutation({
    mutationFn: () => api.patch(`/admin/drivers/${activeId}/approve`),
    onSuccess: () => { toast.success('Driver approved'); invalidate(); setActiveId(null); },
    onError: (e) => toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: (reason) => api.patch(`/admin/drivers/${activeId}/reject`, { reason }),
    onSuccess: () => { toast.success('Driver rejected'); invalidate(); setShowReject(false); setRejectReason(''); setActiveId(null); },
    onError: (e) => toast.error(e.message),
  });

  const docAction = useMutation({
    mutationFn: ({ type, status, rejectionReason }) =>
      api.patch(`/admin/drivers/${activeId}/documents/${type}`, { status, rejectionReason }),
    onSuccess: () => { toast.success('Document updated'); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const closeModal = () => { setActiveId(null); setShowReject(false); setRejectReason(''); };

  return (
    <div className="space-y-6">
      <PageHeader icon={BadgeCheck} title="Driver verification" subtitle="Review documents and approve drivers before they go live." />

      <QueryBoundary
        query={listQuery}
        loading={<LoadingScreen label="Loading verification queue…" />}
        isEmpty={(d) => !d?.length}
        empty={<EmptyState icon={ShieldCheck} title="Queue is clear" message="No drivers are waiting for verification right now." />}
      >
        {(drivers) => (
          <div className="grid gap-4 sm:grid-cols-2">
            {drivers.map((d) => (
              <Card key={d._id} hover className="p-5 cursor-pointer" onClick={() => setActiveId(d._id)}>
                <div className="flex items-start gap-3">
                  <Avatar name={d.user?.name} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold text-ink-900">{d.user?.name || 'Unnamed driver'}</p>
                      <StatusBadge meta={VERIFICATION_META[d.verificationStatus]} />
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-500"><Phone size={12} /> {d.user?.phone}</p>
                    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-500">
                      <span className="inline-flex items-center gap-1"><Car size={12} /> {vehicleLabel(d.vehicle?.type)}</span>
                      {d.vehicle?.registrationNumber && <><span>·</span><span>{d.vehicle.registrationNumber}</span></>}
                    </p>
                    {d.servesRoutes?.length > 0 && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-ink-400">
                        <MapPin size={12} /> {d.servesRoutes.map((r) => r.destination).filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </QueryBoundary>

      <Modal
        open={!!activeId}
        onClose={closeModal}
        title={detailQuery.data?.driver?.user?.name || 'Driver'}
        subtitle="Verify documents and decide"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>Close</Button>
            <Button variant="danger" icon={X} onClick={() => setShowReject((v) => !v)}>Reject all</Button>
            <Button variant="success" icon={Check} loading={approve.isPending} onClick={() => approve.mutate()}>Approve driver</Button>
          </>
        }
      >
        {detailQuery.isLoading ? (
          <LoadingScreen label="Loading driver…" />
        ) : detailQuery.isError ? (
          <p className="text-sm text-danger">{detailQuery.error?.message}</p>
        ) : detailQuery.data ? (
          <div className="space-y-5">
            <DriverSummary driver={detailQuery.data.driver} />

            {showReject && (
              <div className="rounded-xl border border-danger/25 bg-danger-soft p-4">
                <Field label="Rejection reason">
                  <Textarea
                    placeholder="Explain why this driver is being rejected…"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </Field>
                <div className="mt-3 flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowReject(false)}>Cancel</Button>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={reject.isPending}
                    onClick={() => rejectReason.trim() ? reject.mutate(rejectReason.trim()) : toast.error('Enter a reason')}
                  >
                    Confirm rejection
                  </Button>
                </div>
              </div>
            )}

            <div>
              <p className="mb-2 text-sm font-semibold text-ink-700">Documents</p>
              <div className="space-y-2">
                {(detailQuery.data.driver?.documents || []).length === 0 && (
                  <p className="text-sm text-ink-400">No documents submitted.</p>
                )}
                {(detailQuery.data.driver?.documents || []).map((doc) => (
                  <div key={doc.type} className="rounded-xl border border-ink-200 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-ink-400" />
                        <div>
                          <p className="text-sm font-medium capitalize text-ink-900">{String(doc.type).replace(/_/g, ' ')}</p>
                          {doc.number && <p className="text-xs text-ink-500">{doc.number}</p>}
                        </div>
                      </div>
                      <StatusBadge meta={DOC_META[doc.status] || DOC_META.pending} />
                    </div>
                    {doc.expiresAt && <p className="mt-1 text-xs text-ink-400">Expires {formatDate(doc.expiresAt)}</p>}
                    {doc.rejectionReason && <p className="mt-1 text-xs text-danger">Reason: {doc.rejectionReason}</p>}
                    <div className="mt-2 flex items-center gap-2">
                      {doc.url && (
                        <a href={doc.url} target="_blank" rel="noreferrer" className="text-xs font-medium text-accent hover:underline">View file</a>
                      )}
                      <div className="ml-auto flex gap-2">
                        <Button size="sm" variant="success" icon={Check} loading={docAction.isPending} onClick={() => docAction.mutate({ type: doc.type, status: 'approved' })}>Approve</Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={X}
                          onClick={() => {
                            const reason = window.prompt('Reason for rejecting this document?');
                            if (reason) docAction.mutate({ type: doc.type, status: 'rejected', rejectionReason: reason });
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function DriverSummary({ driver }) {
  if (!driver) return null;
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl bg-ink-50 p-4">
      <Avatar name={driver.user?.name} size={48} />
      <div className="min-w-0">
        <p className="font-semibold text-ink-900">{driver.user?.name}</p>
        <p className="text-sm text-ink-500">{driver.user?.phone} · {driver.user?.email || 'no email'}</p>
      </div>
      <div className="ml-auto flex flex-wrap gap-2">
        <Badge tone="accent">{vehicleLabel(driver.vehicle?.type)}</Badge>
        {driver.vehicle?.registrationNumber && <Badge tone="neutral">{driver.vehicle.registrationNumber}</Badge>}
        <Badge tone="info">{driver.completedRides ?? 0} rides</Badge>
      </div>
    </div>
  );
}
