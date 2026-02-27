import React, { useState } from 'react';
import { Tag, Check, Sparkles, Users, TrendingUp, DollarSign, Calendar, Download, Loader2, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { STRIPE_PLANS, StripePlanKey } from '../lib/stripe';

const plans = [
  {
    id: 'monthly' as StripePlanKey,
    label: 'Mensal',
    price: STRIPE_PLANS.monthly.price,
    perMonth: 'R$ 24,99/mês',
    note: 'Cobrança mensal',
    desc: 'Cancele quando quiser',
  },
  {
    id: 'yearly' as StripePlanKey,
    label: 'Anual',
    price: STRIPE_PLANS.yearly.price,
    perMonth: 'R$ 16,66/mês',
    note: 'Cobrança anual',
    desc: 'Melhor custo-benefício',
    tag: STRIPE_PLANS.yearly.savings,
    old: 'R$ 299,88',
    recommended: true,
  },
];

const features = [
  { icon: Users, label: 'Clientes ilimitados' },
  { icon: Calendar, label: 'Agenda avançada' },
  { icon: TrendingUp, label: 'Módulo de evolução' },
  { icon: DollarSign, label: 'Módulo financeiro' },
  { icon: Download, label: 'Exportar dados' },
];

const SubscriptionPlans: React.FC = () => {
  const { isPremium, refreshSubscription } = useAuth();
  const [selected, setSelected] = useState<StripePlanKey>('yearly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async () => {
    setError('');
    setLoading(true);
    try {
      const plan = STRIPE_PLANS[selected];
      const { data, error: fnError } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: plan.price_id },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.url) {
        window.open(data.url, '_blank');
        // Refresh subscription after a delay
        setTimeout(() => refreshSubscription(), 5000);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao iniciar pagamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{background:'var(--n-0)',color:'var(--n-900)'}}>
      <div className="px-5 pt-6 pb-5 text-center" style={{background:'var(--n-50)',borderBottom:'1px solid var(--n-200)'}}>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3" style={{background:'var(--accent-light)',color:'var(--accent)'}}>
          <Sparkles size={12} />
          Clientes Ilimitados
        </div>
        <h2 className="text-xl font-extrabold mb-1" style={{color:'var(--n-900)'}}>Escolha seu plano</h2>
        <p className="text-sm" style={{color:'var(--n-500)'}}>Todos os planos incluem acesso completo</p>
      </div>

      <div className="px-4 py-5 space-y-4">
        {isPremium && (
          <div className="flex items-center justify-center gap-2 text-sm py-3 rounded-xl" style={{background:'var(--success-light)',color:'var(--success)',border:'1px solid var(--success)'}}>
            <Crown size={16} />
            <span className="font-bold">Você já é Premium!</span>
          </div>
        )}

        <div className="space-y-2.5">
          {plans.map((plan) => {
            const isSelected = selected === plan.id;
            return (
              <button
                key={plan.id}
                onClick={() => setSelected(plan.id)}
                className="w-full rounded-xl p-4 text-left transition-all relative overflow-hidden"
                style={{
                  background: isSelected ? 'var(--accent-light)' : 'var(--n-0)',
                  border: isSelected ? '2px solid var(--accent)' : '1.5px solid var(--n-200)',
                  boxShadow: isSelected ? '0 0 0 3px rgba(37,99,235,0.08)' : 'none',
                }}
              >
                {plan.recommended && (
                  <div className="absolute top-0 right-0 px-2.5 py-0.5 text-[10px] font-bold rounded-bl-lg" style={{background:'var(--accent)',color:'#fff'}}>
                    RECOMENDADO
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                      style={{ border: isSelected ? '2px solid var(--accent)' : '2px solid var(--n-300)', background: isSelected ? 'var(--accent)' : 'transparent' }}>
                      {isSelected && <Check size={12} style={{color:'#fff'}} strokeWidth={3} />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{color:'var(--n-900)'}}>{plan.label}</span>
                        {plan.tag && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5" style={{background:'var(--success-light)',color:'var(--success)'}}>
                            <Tag size={9} /> {plan.tag}
                          </span>
                        )}
                      </div>
                      <div className="text-xs mt-0.5" style={{color:'var(--n-500)'}}>{plan.desc} · {plan.perMonth}</div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {plan.old && <div className="text-[10px] line-through" style={{color:'var(--n-400)'}}>{plan.old}</div>}
                    <div className="text-lg font-extrabold" style={{color: isSelected ? 'var(--accent)' : 'var(--n-900)'}}>{plan.price}</div>
                    <div className="text-[10px]" style={{color:'var(--n-500)'}}>{plan.note}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-xl p-4" style={{background:'var(--n-50)',border:'1px solid var(--n-200)'}}>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{color:'var(--n-500)'}}>Incluso em todos os planos</p>
          <div className="grid grid-cols-2 gap-2">
            {features.map((feat) => (
              <div key={feat.label} className="flex items-center gap-2">
                <Check size={14} style={{color:'var(--success)'}} />
                <span className="text-xs font-medium" style={{color:'var(--n-700)'}}>{feat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-lg px-4 py-2.5" style={{background:'var(--error-light)',border:'1px solid var(--error)'}}>
            <p className="text-xs font-medium" style={{color:'var(--error)'}}>{error}</p>
          </div>
        )}

        {!isPremium && (
          <>
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="btn btn-primary w-full py-3.5 text-sm font-extrabold disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Assinar agora'}
            </button>
            <p className="text-center text-[11px]" style={{color:'var(--n-400)'}}>
              Pagamento seguro via Stripe · Cancele quando quiser
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPlans;
