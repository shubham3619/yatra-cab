import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, CardBody, Button, Badge, Modal, Field, Input, Select, Table, PageHeader,
  QueryBoundary, LoadingScreen, EmptyState, toast, inr,
} from '@yatracab/ui';
import { Ticket, Plus, Power, Percent, IndianRupee } from 'lucide-react';
import { api } from '../api.js';

const blank = {
  code: '', description: '', type: 'flat', value: 100,
  maxDiscount: 0, minFare: 0, totalCoupons: 100, perUserLimit: 1, validUntil: '',
};

export default function Coupons() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);

  const query = useQuery({ queryKey: ['admin-coupons'], queryFn: () => api.get('/admin/coupons').then((r) => r.coupons) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-coupons'] });

  const create = useMutation({
    mutationFn: () => {
      const body = {
        ...form,
        code: form.code.toUpperCase().trim(),
        value: Number(form.value),
        maxDiscount: Number(form.maxDiscount) || 0,
        minFare: Number(form.minFare) || 0,
        totalCoupons: Number(form.totalCoupons),
        perUserLimit: Number(form.perUserLimit),
        validUntil: form.validUntil || undefined,
      };
      return api.post('/admin/coupons', body);
    },
    onSuccess: () => { toast.success('Coupon created'); setOpen(false); setForm(blank); invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const toggle = useMutation({
    mutationFn: (c) => (c.active ? api.del(`/admin/coupons/${c._id}`) : api.patch(`/admin/coupons/${c._id}`, { active: true })),
    onSuccess: () => { toast.success('Updated'); invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader icon={Ticket} title="Coupons" subtitle="Promo codes riders can apply to their booking fee." />
        <Button icon={Plus} onClick={() => setOpen(true)}>New coupon</Button>
      </div>

      <QueryBoundary
        query={query}
        loading={<LoadingScreen label="Loading coupons…" />}
        isEmpty={(d) => !d.length}
        empty={<EmptyState icon={Ticket} title="No coupons yet" message="Create one to start running an offer." />}
      >
        {(coupons) => (
          <Card>
            <CardBody>
              <Table
                head={['Code', 'Discount', 'Used / Total', 'Per user', 'Valid until', 'Status', '']}
                rows={coupons.map((c) => [
                  <div key="c">
                    <p className="font-semibold text-ink-900">{c.code}</p>
                    {c.description && <p className="text-xs text-ink-500">{c.description}</p>}
                  </div>,
                  <span key="d" className="font-medium text-ink-800">
                    {c.type === 'percent' ? `${c.value}%` : inr(c.value)}
                    {c.type === 'percent' && c.maxDiscount > 0 && <span className="text-xs text-ink-500"> (max {inr(c.maxDiscount)})</span>}
                    {c.minFare > 0 && <span className="block text-xs text-ink-400">on fares over {inr(c.minFare)}</span>}
                  </span>,
                  <span key="u">
                    <span className="font-medium text-ink-900">{c.usedCount}</span>
                    <span className="text-ink-400"> / {c.totalCoupons}</span>
                    <span className="mt-1 block h-1.5 w-24 overflow-hidden rounded-full bg-ink-200">
                      <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (c.usedCount / c.totalCoupons) * 100)}%` }} />
                    </span>
                  </span>,
                  c.perUserLimit,
                  c.validUntil ? new Date(c.validUntil).toLocaleDateString() : '—',
                  <Badge key="s" tone={!c.active ? 'neutral' : c.usedCount >= c.totalCoupons ? 'warning' : 'success'}>
                    {!c.active ? 'Inactive' : c.usedCount >= c.totalCoupons ? 'Fully claimed' : 'Active'}
                  </Badge>,
                  <Button key="a" size="sm" variant="ghost" icon={Power} loading={toggle.isPending} onClick={() => toggle.mutate(c)}>
                    {c.active ? 'Disable' : 'Enable'}
                  </Button>,
                ])}
              />
            </CardBody>
          </Card>
        )}
      </QueryBoundary>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New coupon"
        subtitle="Riders enter this code at payment."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button loading={create.isPending} onClick={() => create.mutate()}>Create</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Code" hint="letters & numbers">
              <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="WELCOME50" />
            </Field>
            <Field label="Number of coupons" hint="total redemptions">
              <Input type="number" min={1} value={form.totalCoupons} onChange={set('totalCoupons')} />
            </Field>
          </div>

          <Field label="Description" hint="shown to riders">
            <Input value={form.description} onChange={set('description')} placeholder="Launch offer" />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Discount type">
              <Select value={form.type} onChange={set('type')}>
                <option value="flat">Flat ₹ off</option>
                <option value="percent">Percent off</option>
              </Select>
            </Field>
            <Field label={form.type === 'percent' ? 'Percent off' : 'Amount off (₹)'}>
              <Input type="number" min={1} value={form.value} onChange={set('value')} />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {form.type === 'percent' && (
              <Field label="Max discount (₹)" hint="0 = uncapped">
                <Input type="number" min={0} value={form.maxDiscount} onChange={set('maxDiscount')} />
              </Field>
            )}
            <Field label="Minimum fare (₹)" hint="0 = any ride">
              <Input type="number" min={0} value={form.minFare} onChange={set('minFare')} />
            </Field>
            <Field label="Per rider limit">
              <Input type="number" min={1} value={form.perUserLimit} onChange={set('perUserLimit')} />
            </Field>
            <Field label="Valid until" hint="optional">
              <Input type="date" value={form.validUntil} onChange={set('validUntil')} />
            </Field>
          </div>

          <p className="flex items-start gap-1.5 rounded-xl bg-ink-50 p-3 text-xs text-ink-500">
            {form.type === 'percent' ? <Percent size={13} className="mt-0.5 shrink-0" /> : <IndianRupee size={13} className="mt-0.5 shrink-0" />}
            The discount comes off the online booking fee. Stock can be raised later, but never cut below what has already been redeemed.
          </p>
        </div>
      </Modal>
    </div>
  );
}
