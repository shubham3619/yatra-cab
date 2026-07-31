import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, CardHeader, CardBody, Button, Field, Input, StatCard, Modal, PageHeader,
  QueryBoundary, LoadingScreen, EmptyState, toast, inr, relativeTime,
} from '@yatracab/ui';
import {
  Wallet as WalletIcon, Plus, ArrowUpRight, ArrowDownLeft, Gift, Info, IndianRupee,
} from 'lucide-react';
import { api } from '../api.js';

const REASON_LABEL = {
  topup: 'Wallet top-up',
  commission: 'Ride commission',
  commission_refund: 'Commission refund',
  referral_commission: 'Referral earning',
  penalty: 'Penalty',
  bonus: 'Bonus',
  adjustment: 'Adjustment',
};

const QUICK_AMOUNTS = [200, 500, 1000];

export default function Wallet() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['driver-wallet'], queryFn: () => api.get('/driver/wallet').then((r) => r.wallet) });
  const [open, setOpen] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['driver-wallet'] });

  return (
    <div className="animate-fade-in">
      <PageHeader icon={WalletIcon} title="Wallet" subtitle="Your Pay-to-Connect prepaid balance." />

      <QueryBoundary query={query} loading={<LoadingScreen label="Loading wallet…" />}>
        {(wallet) => (
          <div className="space-y-5">
            {/* Balance card */}
            <Card className="overflow-hidden border-0 bg-brand-gradient text-accent-fg shadow-glow">
              <CardBody className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm opacity-90">Available balance</p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight">{inr(wallet.balance)}</p>
                  <p className="mt-2 max-w-sm text-xs opacity-90">
                    Commission for connecting with riders is charged from here (Pay-to-Connect).
                  </p>
                </div>
                <Button variant="secondary" icon={Plus} onClick={() => setOpen(true)}>Add money</Button>
              </CardBody>
            </Card>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <StatCard icon={Gift} label="Referral earnings" value={inr(wallet.referralEarnings)} tone="success" />
              <StatCard icon={IndianRupee} label="Wallet balance" value={inr(wallet.balance)} tone="accent" />
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-info-soft p-4 text-sm text-info">
              <Info size={16} className="mt-0.5 shrink-0" />
              You pay a small platform commission from this wallet each time you connect with a rider. Keep a balance topped up so you never miss a booking.
            </div>

            {/* Transactions */}
            <Card>
              <CardHeader title="Transactions" icon={WalletIcon} />
              <CardBody className="p-0">
                {wallet.transactions?.length ? (
                  <div className="divide-y divide-ink-50">
                    {wallet.transactions.map((t) => {
                      const credit = t.type === 'credit';
                      return (
                        <div key={t._id} className="flex items-center gap-3 px-5 py-3.5">
                          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${credit ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>
                            {credit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-ink-800">{REASON_LABEL[t.reason] || t.reason}</p>
                            <p className="truncate text-xs text-ink-400">
                              {t.note ? `${t.note} · ` : ''}{relativeTime(t.createdAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${credit ? 'text-success' : 'text-danger'}`}>
                              {credit ? '+' : '−'}{inr(t.amount)}
                            </p>
                            <p className="text-xs text-ink-400">Bal {inr(t.balanceAfter)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-5">
                    <EmptyState icon={WalletIcon} title="No transactions yet" message="Top-ups, commissions and referral earnings will appear here." />
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}
      </QueryBoundary>

      <TopupModal open={open} onClose={() => setOpen(false)} onDone={invalidate} />
    </div>
  );
}

function TopupModal({ open, onClose, onDone }) {
  const [amount, setAmount] = useState(500);

  const topup = useMutation({
    mutationFn: (amt) => api.post('/driver/wallet/topup', { amount: amt }),
    onSuccess: (res) => {
      toast.success(res.message || 'Money added to your wallet');
      onDone();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const submit = () => {
    const amt = Number(amount);
    if (!amt || amt < 1) return toast.error('Enter a valid amount');
    topup.mutate(amt);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add money"
      subtitle="Mock payment gateway — no real charge."
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button icon={Plus} loading={topup.isPending} onClick={submit}>Add {inr(amount)}</Button>
      </>}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {QUICK_AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAmount(a)}
              className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-all ${Number(amount) === a ? 'border-accent bg-accent text-accent-fg' : 'border-ink-200 text-ink-700 hover:border-accent/40'}`}
            >
              {inr(a)}
            </button>
          ))}
        </div>
        <Field label="Custom amount">
          <Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" />
        </Field>
      </div>
    </Modal>
  );
}
