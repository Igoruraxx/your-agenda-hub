import React, { useState, useEffect } from 'react';
import { Settings, Users, Crown, Shield, Search, Trash2, Plus, X, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format, differenceInDays, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '../hooks/useFitToast';

interface AdminProfile {
  id: string;
  name: string;
  email: string;
  plan: string;
  is_admin: boolean;
  premium_expires_at: string | null;
  premium_origin: string;
  trial_started_at: string | null;
  created_at: string;
}

const ORIGIN_LABELS: Record<string, { label: string; color: string }> = {
  trial: { label: 'Trial', color: 'bg-primary/10 text-primary' },
  courtesy: { label: 'Cortesia', color: 'bg-warning/10 text-warning' },
  paid: { label: 'Pago', color: 'bg-success/10 text-success' },
};

const Admin: React.FC = () => {
  const { isAdmin } = useAuth();
  const { success, error: showError } = useToast();
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [showPremiumModal, setShowPremiumModal] = useState<AdminProfile | null>(null);
  const [premiumDays, setPremiumDays] = useState(30);
  const [premiumOrigin, setPremiumOrigin] = useState<'courtesy' | 'paid'>('courtesy');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    fetchProfiles();
  }, [isAdmin]);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, plan, is_admin, premium_expires_at, premium_origin, trial_started_at, created_at')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProfiles(data as AdminProfile[]);
      const counts: Record<string, number> = {};
      for (const p of data) {
        const { count } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('user_id', p.id);
        counts[p.id] = count || 0;
      }
      setStudentCounts(counts);
    }
    setLoading(false);
  };

  const getDaysRemaining = (expiresAt: string | null): number => {
    if (!expiresAt) return 0;
    const expires = new Date(expiresAt);
    const now = new Date();
    if (isBefore(expires, now)) return 0;
    return differenceInDays(expires, now);
  };

  const handleGrantPremium = async () => {
    if (!showPremiumModal) return;
    setSaving(true);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + premiumDays);

      const { error } = await supabase.from('profiles').update({
        plan: 'premium',
        premium_expires_at: expiresAt.toISOString(),
        premium_origin: premiumOrigin,
      }).eq('id', showPremiumModal.id);

      if (error) throw error;

      setProfiles(prev => prev.map(p =>
        p.id === showPremiumModal.id
          ? { ...p, plan: 'premium', premium_expires_at: expiresAt.toISOString(), premium_origin: premiumOrigin }
          : p
      ));
      success(`Premium de ${premiumDays} dias concedido!`);
      setShowPremiumModal(null);
    } catch { showError('Erro ao conceder premium'); }
    finally { setSaving(false); }
  };

  const handleRemovePremium = async (profileId: string) => {
    const { error } = await supabase.from('profiles').update({
      plan: 'free',
      premium_expires_at: null,
      premium_origin: 'trial',
    }).eq('id', profileId);

    if (!error) {
      setProfiles(prev => prev.map(p =>
        p.id === profileId ? { ...p, plan: 'free', premium_expires_at: null, premium_origin: 'trial' } : p
      ));
      success('Premium removido');
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!confirm('Tem certeza que deseja remover este personal? Esta ação não pode ser desfeita.')) return;
    // Delete students, appointments, etc. first
    await supabase.from('appointments').delete().eq('user_id', profileId);
    await supabase.from('students').delete().eq('user_id', profileId);
    await supabase.from('payments').delete().eq('user_id', profileId);
    const { error } = await supabase.from('profiles').delete().eq('id', profileId);
    if (!error) {
      setProfiles(prev => prev.filter(p => p.id !== profileId));
      success('Personal removido');
    } else {
      showError('Erro ao remover');
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <Shield size={48} className="text-muted-foreground mb-4" />
        <h2 className="text-lg font-bold text-foreground mb-2">Acesso restrito</h2>
        <p className="text-sm text-muted-foreground">Apenas administradores podem acessar este painel.</p>
      </div>
    );
  }

  const filtered = profiles.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-2 mb-4">
        <Settings size={20} className="text-primary" />
        <h1 className="text-lg font-bold text-foreground">Painel Admin</h1>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-accent-light text-primary">{profiles.length}</span>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar personal..." className="input-field pl-9 py-2.5 text-sm" />
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="spinner" /></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(profile => {
            const daysRemaining = getDaysRemaining(profile.premium_expires_at);
            const originInfo = ORIGIN_LABELS[profile.premium_origin] || ORIGIN_LABELS.trial;
            const isPremium = profile.plan === 'premium';

            return (
              <div key={profile.id} className="card-surface p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-foreground truncate">{profile.name}</p>
                      {profile.is_admin && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">Admin</span>
                      )}
                      {isPremium && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${originInfo.color}`}>
                          {originInfo.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users size={10} /> {studentCounts[profile.id] || 0} alunos
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Desde {format(new Date(profile.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>

                    {/* Premium info */}
                    {isPremium && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <Clock size={10} className="text-primary" />
                        {daysRemaining > 0 ? (
                          <span className="text-[11px] text-primary font-bold">
                            {daysRemaining} dia{daysRemaining > 1 ? 's' : ''} restante{daysRemaining > 1 ? 's' : ''}
                          </span>
                        ) : profile.premium_expires_at ? (
                          <span className="text-[11px] text-destructive font-bold">Expirado</span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">Sem expiração</span>
                        )}
                        {profile.premium_expires_at && (
                          <span className="text-[10px] text-muted-foreground">
                            · Exp: {format(new Date(profile.premium_expires_at), 'dd/MM/yyyy')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0 ml-3">
                    {/* Plan badge */}
                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                      isPremium ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'
                    }`}>
                      {isPremium ? <><Crown size={12} /> Premium</> : 'Free'}
                    </span>

                    {/* Actions */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => { setShowPremiumModal(profile); setPremiumDays(30); setPremiumOrigin('courtesy'); }}
                        className="flex items-center gap-0.5 px-2 py-1 rounded text-[10px] font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                      >
                        <Plus size={10} /> Premium
                      </button>
                      {isPremium && (
                        <button
                          onClick={() => handleRemovePremium(profile.id)}
                          className="flex items-center gap-0.5 px-2 py-1 rounded text-[10px] font-bold bg-warning/10 text-warning hover:bg-warning/20 transition-all"
                        >
                          Remover
                        </button>
                      )}
                      {!profile.is_admin && (
                        <button
                          onClick={() => handleDeleteProfile(profile.id)}
                          className="flex items-center gap-0.5 px-2 py-1 rounded text-[10px] font-bold bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all"
                        >
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Grant Premium Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40">
          <div className="card-surface w-full max-w-md mx-4 p-6 rounded-t-2xl sm:rounded-2xl animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">Conceder Premium</h3>
              <button onClick={() => setShowPremiumModal(null)} className="text-muted-foreground"><X size={20} /></button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Para <strong className="text-foreground">{showPremiumModal.name}</strong>
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Dias de premium</label>
                <div className="flex gap-2">
                  {[7, 15, 30, 60, 90].map(d => (
                    <button key={d} onClick={() => setPremiumDays(d)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${premiumDays === d ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {d}d
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Origem</label>
                <div className="flex gap-2">
                  <button onClick={() => setPremiumOrigin('courtesy')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${premiumOrigin === 'courtesy' ? 'bg-warning text-warning-foreground' : 'bg-muted text-muted-foreground'}`}>
                    Cortesia
                  </button>
                  <button onClick={() => setPremiumOrigin('paid')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${premiumOrigin === 'paid' ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}`}>
                    Pago
                  </button>
                </div>
              </div>

              <button onClick={handleGrantPremium} disabled={saving} className="btn btn-primary w-full py-3 text-sm font-bold">
                {saving ? 'Salvando...' : `Conceder ${premiumDays} dias`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
