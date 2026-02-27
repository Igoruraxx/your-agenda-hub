import React, { useState } from 'react';
import { Crown, Check, X, Zap, Users, TrendingUp, DollarSign, Download, Headphones, Calendar, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { STRIPE_PLANS, StripePlanKey } from '../lib/stripe';

interface PricingPlansProps {
  onClose: () => void;
  highlightFeature?: 'finance' | 'evolution' | 'students' | 'schedule' | 'export';
}

const FEATURES = [
  { icon: Users, label: 'Clientes ativos', free: 'Até 5', premium: 'Ilimitados', key: 'students' },
  { icon: Calendar, label: 'Agenda avançada', free: false, premium: true, key: 'schedule' },
  { icon: TrendingUp, label: 'Módulo de Evolução', free: false, premium: true, key: 'evolution' },
  { icon: DollarSign, label: 'Módulo Financeiro', free: false, premium: true, key: 'finance' },
  { icon: Download, label: 'Exportar dados', free: false, premium: true, key: 'export' },
  { icon: Headphones, label: 'Suporte prioritário', free: false, premium: true, key: 'support' },
];

const FEATURE_LABELS: Record<string, string> = {
  finance: 'Módulo Financeiro',
  evolution: 'Módulo de Evolução',
  students: 'mais clientes',
  schedule: 'Agenda Avançada',
  export: 'Exportação de dados',
};

const PricingPlans: React.FC<PricingPlansProps> = ({ onClose, highlightFeature }) => {
  const { isPremium, refreshSubscription } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<StripePlanKey>('yearly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async () => {
    setError('');
    setLoading(true);
    try {
      const plan = STRIPE_PLANS[selectedPlan];
      const { data, error: fnError } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: plan.price_id },
      });
      if (fnError) throw new Error(fnError.message);
      if (data?.url) {
        window.open(data.url, '_blank');
        setTimeout(() => refreshSubscription(), 5000);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao iniciar pagamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50" style={{background:'rgba(0,0,0,0.4)',backdropFilter:'blur(4px)'}}>
      <div className="w-full sm:max-w-md overflow-hidden max-h-[92dvh] flex flex-col rounded-t-2xl sm:rounded-2xl" style={{background:'var(--n-0)',border:'1px solid var(--n-200)',boxShadow:'var(--sh-lg)'}}>

        {/* Header */}
        <div className="relative px-6 pt-6 pb-6 flex-shrink-0" style={{background:'var(--n-50)',borderBottom:'1px solid var(--n-200)'}}>
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-black/5 transition-colors touch-manipulation">
            <X size={16} style={{color:'var(--n-400)'}} />
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{background:'var(--warning-light)',border:'1px solid var(--warning)'}}>
              <Crown size={24} style={{color:'var(--warning)'}} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold" style={{color:'var(--n-900)'}}>Upgrade para Premium</h2>
              <p className="text-xs" style={{color:'var(--n-500)'}}>Desbloqueie todo o potencial</p>
            </div>
          </div>
          {highlightFeature && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2 mt-1" style={{background:'var(--accent-light)',border:'1px solid var(--accent)'}}>
              <Zap size={14} style={{color:'var(--accent)'}} className="flex-shrink-0" />
              <p className="text-xs" style={{color:'var(--n-900)'}}>
                Você precisa do Premium para acessar <strong style={{color:'var(--accent)'}}>{FEATURE_LABELS[highlightFeature]}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {/* Plan selection */}
          <div className="flex gap-2">
            {(['monthly', 'yearly'] as StripePlanKey[]).map(key => {
              const plan = STRIPE_PLANS[key];
              const isSelected = selectedPlan === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedPlan(key)}
                  className="flex-1 rounded-xl p-3 text-center transition-all"
                  style={{
                    background: isSelected ? 'var(--accent-light)' : 'var(--n-0)',
                    border: isSelected ? '2px solid var(--accent)' : '1.5px solid var(--n-200)',
                  }}
                >
                  <div className="text-xs font-bold" style={{color: isSelected ? 'var(--accent)' : 'var(--n-500)'}}>{plan.name}</div>
                  <div className="text-lg font-extrabold mt-1" style={{color:'var(--n-900)'}}>{plan.price}</div>
                  <div className="text-[10px]" style={{color:'var(--n-500)'}}>{plan.description}</div>
                  {key === 'yearly' && (
                    <div className="text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full inline-block" style={{background:'var(--success-light)',color:'var(--success)'}}>
                      {STRIPE_PLANS.yearly.savings}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Feature comparison */}
          <div className="rounded-xl overflow-hidden" style={{border:'1px solid var(--n-200)'}}>
            <div className="grid grid-cols-3 px-4 py-2.5 text-xs font-bold uppercase tracking-wider" style={{background:'var(--n-50)',borderBottom:'1px solid var(--n-200)',color:'var(--n-500)'}}>
              <span>Recurso</span>
              <span className="text-center">Gratuito</span>
              <span className="text-center" style={{color:'var(--accent)'}}>Premium</span>
            </div>
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              const isHighlighted = highlightFeature === feat.key;
              return (
                <div key={feat.key} className="grid grid-cols-3 items-center px-4 py-3"
                  style={{ background: isHighlighted ? 'var(--accent-light)' : 'var(--n-0)', borderBottom: i < FEATURES.length - 1 ? '1px solid var(--n-100)' : 'none' }}>
                  <div className="flex items-center gap-2">
                    <Icon size={14} style={{color: isHighlighted ? 'var(--accent)' : 'var(--n-400)'}} />
                    <span className="text-xs font-semibold" style={{color: isHighlighted ? 'var(--accent)' : 'var(--n-600)'}}>{feat.label}</span>
                  </div>
                  <div className="flex justify-center">
                    {typeof feat.free === 'string' ? <span className="text-xs" style={{color:'var(--n-500)'}}>{feat.free}</span>
                      : feat.free ? <Check size={15} style={{color:'var(--success)'}} /> : <X size={15} style={{color:'var(--n-300)'}} />}
                  </div>
                  <div className="flex justify-center">
                    {typeof feat.premium === 'string' ? <span className="text-xs font-bold" style={{color:'var(--accent)'}}>{feat.premium}</span>
                      : <Check size={15} style={{color:'var(--accent)'}} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 pb-6 pt-3 flex-shrink-0" style={{borderTop:'1px solid var(--n-200)'}}>
          {error && (
            <div className="rounded-lg px-3 py-2 mb-2" style={{background:'var(--error-light)',border:'1px solid var(--error)'}}>
              <p className="text-xs" style={{color:'var(--error)'}}>{error}</p>
            </div>
          )}
          {isPremium ? (
            <div className="flex items-center justify-center gap-2 text-sm py-3 rounded-lg" style={{background:'var(--success-light)',color:'var(--success)'}}>
              <Check size={16} /> Você já é Premium!
            </div>
          ) : (
            <>
              <button onClick={handleCheckout} disabled={loading} className="btn btn-primary w-full py-3.5 font-extrabold text-sm mb-2 disabled:opacity-50">
                {loading ? <Loader2 size={18} className="animate-spin" /> : `Assinar ${STRIPE_PLANS[selectedPlan].name}`}
              </button>
              <button onClick={onClose} className="w-full py-2 text-sm transition-colors touch-manipulation" style={{color:'var(--n-500)'}}>
                Continuar com o plano gratuito
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PricingPlans;
