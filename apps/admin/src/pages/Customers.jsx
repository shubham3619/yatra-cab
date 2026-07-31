import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PageHeader, Table, Input, Modal, Button, Badge, StatusBadge, Avatar, StarRating,
  QueryBoundary, LoadingScreen, EmptyState,
  formatDate, formatDateTime, RIDE_STATUS_META, inr, toast,
} from '@yatracab/ui';
import { Users, Search, Ban, ShieldCheck } from 'lucide-react';
import { api } from '../api.js';

export default function Customers() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [activeId, setActiveId] = useState(null);

  const params = new URLSearchParams();
  if (q.trim()) params.set('q', q.trim());

  const listQuery = useQuery({
    queryKey: ['customers', q.trim()],
    queryFn: () => api.get(`/admin/customers?${params.toString()}`).then((r) => r.customers),
  });

  const detailQuery = useQuery({
    queryKey: ['customer', activeId],
    queryFn: () => api.get(`/admin/customers/${activeId}`),
    enabled: !!activeId,
  });

  const block = useMutation({
    mutationFn: ({ id, blocked }) => api.patch(`/admin/customers/${id}/block`, { blocked }),
    onSuccess: (_d, v) => {
      toast.success(v.blocked ? 'Customer blocked' : 'Customer unblocked');
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['customer', activeId] });
    },
    onError: (e) => toast.error(e.message),
  });

  const columns = [
    {
      key: 'customer', header: 'Customer', render: (c) => (
        <div className="flex items-center gap-3">
          <Avatar name={c.name} size={36} />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink-900">{c.name || '—'}</p>
            <p className="text-xs text-ink-500">{c.phone}</p>
          </div>
        </div>
      ),
    },
    { key: 'email', header: 'Email', render: (c) => <span className="text-ink-600">{c.email || '—'}</span> },
    { key: 'rating', header: 'Rating', render: (c) => <StarRating value={c.rating || 0} /> },
    { key: 'createdAt', header: 'Joined', render: (c) => <span className="text-ink-500">{formatDate(c.createdAt)}</span> },
    {
      key: 'actions', header: 'Actions', align: 'right', render: (c) => (
        <Button
          size="sm"
          variant={c.isBlocked ? 'success' : 'secondary'}
          icon={c.isBlocked ? ShieldCheck : Ban}
          onClick={(e) => { e.stopPropagation(); block.mutate({ id: c._id, blocked: !c.isBlocked }); }}
        >
          {c.isBlocked ? 'Unblock' : 'Block'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader icon={Users} title="Riders" subtitle="All registered riders on the platform." />

      <div className="flex justify-end">
        <div className="relative sm:w-72">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <Input placeholder="Search name or phone…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      </div>

      <QueryBoundary
        query={listQuery}
        loading={<LoadingScreen label="Loading customers…" />}
        isEmpty={(d) => !d?.length}
        empty={<EmptyState icon={Users} title="No customers found" message="Try a different search term." />}
      >
        {(customers) => (
          <Table rowKey={(c) => c._id} data={customers} columns={columns} onRowClick={(c) => setActiveId(c._id)} />
        )}
      </QueryBoundary>

      <Modal
        open={!!activeId}
        onClose={() => setActiveId(null)}
        title={detailQuery.data?.customer?.name || 'Customer'}
        subtitle="Customer detail & recent rides"
        size="lg"
        footer={<Button variant="secondary" onClick={() => setActiveId(null)}>Close</Button>}
      >
        {detailQuery.isLoading ? (
          <LoadingScreen label="Loading customer…" />
        ) : detailQuery.isError ? (
          <p className="text-sm text-danger">{detailQuery.error?.message}</p>
        ) : detailQuery.data ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-4 rounded-xl bg-ink-50 p-4">
              <Avatar name={detailQuery.data.customer?.name} size={48} />
              <div className="min-w-0">
                <p className="font-semibold text-ink-900">{detailQuery.data.customer?.name}</p>
                <p className="text-sm text-ink-500">{detailQuery.data.customer?.phone} · {detailQuery.data.customer?.email || 'no email'}</p>
                <p className="text-xs text-ink-400">Joined {formatDate(detailQuery.data.customer?.createdAt)}</p>
              </div>
              <div className="ml-auto flex flex-wrap gap-2">
                <StarRating value={detailQuery.data.customer?.rating || 0} />
                {detailQuery.data.customer?.isBlocked && <Badge tone="danger">Blocked</Badge>}
              </div>
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
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
