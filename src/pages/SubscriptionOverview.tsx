import React from 'react';
import { Crown, Clock, CheckCircle, XCircle, Shield, CreditCard, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface SubscriptionOverviewProps {
  onBack?: () => void;
}

const SubscriptionOverview: React.FC<SubscriptionOverviewProps> = ({ onBack }) => {
  const { currentUser, isPremium, refreshSubscription } = useAuth();
  const [loadingPortal, setLoadingPortal] = React.useState(false);

  const fmt = (d: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('pt-BR');
  };

  const handleManageSubscription = async () => {
    setLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (err) {
      console.error('Portal error:', err);
    } finally {
      setLoadingPortal(false);
    }
  };

  return (
    <div style={{background:'var(--n-0)',color:'var(--n-900)'}}>
      <div className="relative overflow-hidden px-5 pt-8 pb-6" style={{background: isPremium ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'linear-gradient(135deg, var(--n-400), var(--n-600))'}}>
        <div className="relative flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3" style={{background:'rgba(255,255,255,0.2)'}}>
            <Crown size={32} style={{color:'#fff'}} />
          </div>
          <h2 className="text-xl font-extrabold text-white mb-1">Plano {isPremium ? 'Premium' : 'Gratuito'}</h2>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{background:'rgba(255,255,255,0.2)', color:'#fff'}}>
            {isPremium ? <CheckCircle size={12} /> : <XCircle size={12} />}
            {isPremium ? 'Assinatura ativa' : 'Sem assinatura'}
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-3">
        {currentUser.subscriptionEndDate && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{background:'var(--n-50)',border:'1px solid var(--n-200)'}}>
            <Clock size={16} style={{color:'var(--n-500)'}} />
            <div>
              <div className="text-xs" style={{color:'var(--n-500)'}}>Válido até</div>
              <div className="text-sm font-bold" style={{color:'var(--n-900)'}}>{fmt(currentUser.subscriptionEndDate)}</div>
            </div>
          </div>
        )}

        {isPremium && (
          <button
            onClick={handleManageSubscription}
            disabled={loadingPortal}
            className="btn btn-secondary w-full py-3 text-sm font-semibold gap-2 disabled:opacity-50"
          >
            {loadingPortal ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
            Gerenciar assinatura
          </button>
        )}

        <button onClick={() => refreshSubscription()} className="btn btn-ghost w-full py-2.5 text-xs">
          Atualizar status
        </button>
      </div>
    </div>
  );
};

export default SubscriptionOverview;
