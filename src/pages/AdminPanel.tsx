import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  Users, Shield, Crown, ArrowLeft, Search, Trash2,
  Clock, X, Plus, RefreshCw, Loader2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AdminUser, SubscriptionStatus } from '../types';

const fmt = (d: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const STATUS_LABELS: Record<SubscriptionStatus, { label: string; style: Record<string, string> }> = {
  free: { label: 'Free', style: { background: 'var(--n-100)', color: 'var(--n-500)' } },
  active: { label: 'Premium', style: { background: 'var(--accent-light)', color: 'var(--accent-dark)' } },
  canceled: { label: 'Cancelado', style: { background: 'var(--warning-light)', color: 'var(--warning)' } },
  past_due: { label: 'Atrasado', style: { background: 'var(--error-light)', color: 'var(--error)' } },
};

const AdminPanel: React.FC = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch profiles
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (pErr) throw pErr;

      // Fetch student counts
      let studentCounts: Record<string, number> = {};
      try {
        const { data: sData } = await supabase.from('students').select('user_id');
        if (sData) {
          studentCounts = sData.reduce((acc: Record<string, number>, curr: any) => {
            acc[curr.user_id] = (acc[curr.user_id] || 0) + 1;
            return acc;
          }, {});
        }
      } catch {}

      // Fetch all roles
      let userRoles: Record<string, string[]> = {};
      try {
        const { data: rData } = await supabase.from('user_roles').select('user_id, role');
        if (rData) {
          rData.forEach((r: any) => {
            if (!userRoles[r.user_id]) userRoles[r.user_id] = [];
            userRoles[r.user_id].push(r.role);
          });
        }
      } catch {}

      const mapped: AdminUser[] = (profiles || []).map((p: any) => ({
        id: p.id,
        name: p.name || 'Sem nome',
        email: p.email || '',
        phone: p.phone || undefined,
        subscriptionStatus: (p.subscription_status || 'free') as SubscriptionStatus,
        subscriptionProductId: p.subscription_product_id || undefined,
        subscriptionEndDate: p.subscription_end_date || undefined,
        studentCount: studentCounts[p.id] || 0,
        createdAt: p.created_at,
        roles: userRoles[p.id] || ['user'],
      }));

      setUsers(mapped);
    } catch (err: any) {
      console.error('[Admin] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isAdmin) fetchUsers(); }, [isAdmin, fetchUsers]);

  const selectedUser = useMemo(() => users.find(u => u.id === selectedUserId) ?? null, [users, selectedUserId]);

  const filtered = useMemo(() => {
    return users.filter(u =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const stats = useMemo(() => ({
    total: users.length,
    premium: users.filter(u => u.subscriptionStatus === 'active').length,
    free: users.filter(u => u.subscriptionStatus === 'free').length,
    admins: users.filter(u => u.roles.includes('admin')).length,
  }), [users]);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza? Isso removerá o usuário e todos os seus dados.')) return;
    await supabase.from('appointments').delete().eq('user_id', userId);
    await supabase.from('payments').delete().eq('user_id', userId);
    await supabase.from('students').delete().eq('user_id', userId);
    await supabase.from('user_roles').delete().eq('user_id', userId);
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (!error) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      setSelectedUserId(null);
    }
  };

  const handleToggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    if (isCurrentlyAdmin) {
      await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'admin');
    } else {
      await supabase.from('user_roles').insert({ user_id: userId, role: 'admin' });
    }
    fetchUsers();
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <Shield size={48} style={{color:'var(--n-400)'}} className="mb-4" />
        <h2 className="text-lg font-bold mb-2" style={{color:'var(--n-900)'}}>Acesso restrito</h2>
        <p className="text-sm" style={{color:'var(--n-500)'}}>Apenas superadmins podem acessar este painel.</p>
      </div>
    );
  }

  // User detail view
  if (selectedUser) {
    const statusInfo = STATUS_LABELS[selectedUser.subscriptionStatus];
    const isUserAdmin = selectedUser.roles.includes('admin');

    return (
      <div className="px-4 py-4 animate-fade-in-up">
        <button onClick={() => setSelectedUserId(null)} className="flex items-center gap-2 text-sm font-semibold mb-4" style={{color:'var(--accent)'}}>
          <ArrowLeft size={16} /> Voltar
        </button>

        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{background:'var(--accent)',color:'var(--n-0)'}}>
              <span className="text-lg font-extrabold">{selectedUser.name.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-extrabold truncate" style={{color:'var(--n-900)'}}>{selectedUser.name}</h2>
              <p className="text-xs truncate" style={{color:'var(--n-500)'}}>{selectedUser.email}</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1" style={statusInfo.style}>
              {selectedUser.subscriptionStatus === 'active' && <Crown size={11} />}
              {statusInfo.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="stat-chip">
              <div className="stat-chip-value">{selectedUser.studentCount}</div>
              <div className="stat-chip-label">Alunos</div>
            </div>
            <div className="stat-chip">
              <div className="stat-chip-value" style={{fontSize:'0.875rem'}}>{fmt(selectedUser.createdAt)}</div>
              <div className="stat-chip-label">Desde</div>
            </div>
          </div>

          {selectedUser.subscriptionEndDate && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{background:'var(--n-50)',border:'1px solid var(--n-200)'}}>
              <Clock size={14} style={{color:'var(--accent)'}} />
              <span className="text-xs" style={{color:'var(--n-600)'}}>Assinatura até: <strong>{fmt(selectedUser.subscriptionEndDate)}</strong></span>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <button
              onClick={() => handleToggleAdmin(selectedUser.id, isUserAdmin)}
              className="btn w-full py-2.5 text-xs font-bold"
              style={{
                background: isUserAdmin ? 'var(--error-light)' : 'var(--accent-light)',
                color: isUserAdmin ? 'var(--error)' : 'var(--accent)',
                border: `1px solid ${isUserAdmin ? 'var(--error)' : 'var(--accent)'}`,
              }}
            >
              <Shield size={14} />
              {isUserAdmin ? 'Remover Admin' : 'Tornar Admin'}
            </button>

            <button
              onClick={() => handleDeleteUser(selectedUser.id)}
              className="btn btn-danger w-full py-2.5 text-xs font-bold"
            >
              <Trash2 size={14} /> Remover Usuário
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Users list
  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield size={20} style={{color:'var(--accent)'}} />
          <h1 className="text-lg font-bold" style={{color:'var(--n-900)'}}>Painel Admin</h1>
        </div>
        <button onClick={fetchUsers} className="p-2 rounded-lg transition-colors" style={{color:'var(--n-400)'}}>
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'Total', value: stats.total },
          { label: 'Premium', value: stats.premium },
          { label: 'Free', value: stats.free },
          { label: 'Admins', value: stats.admins },
        ].map(s => (
          <div key={s.label} className="stat-chip">
            <div className="stat-chip-value text-base">{s.value}</div>
            <div className="stat-chip-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:'var(--n-400)'}} />
        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar por nome ou email..." className="input-base w-full pl-9" />
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin" style={{color:'var(--accent)'}} /></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(user => {
            const statusInfo = STATUS_LABELS[user.subscriptionStatus];
            const isUserAdmin = user.roles.includes('admin');

            return (
              <button
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className="card w-full text-left p-4 transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:'var(--n-100)',color:'var(--n-600)'}}>
                      <span className="text-sm font-bold">{user.name.charAt(0)}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold truncate" style={{color:'var(--n-900)'}}>{user.name}</p>
                        {isUserAdmin && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{background:'var(--error-light)',color:'var(--error)'}}>ADMIN</span>
                        )}
                      </div>
                      <p className="text-xs truncate" style={{color:'var(--n-500)'}}>{user.email}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px]" style={{color:'var(--n-400)'}}>
                          <Users size={9} className="inline mr-0.5" />{user.studentCount} alunos
                        </span>
                        <span className="text-[10px]" style={{color:'var(--n-400)'}}>
                          Desde {fmt(user.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-lg text-[10px] font-bold flex-shrink-0" style={statusInfo.style}>
                    {statusInfo.label}
                  </span>
                </div>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-10">
              <p className="text-sm" style={{color:'var(--n-400)'}}>Nenhum usuário encontrado</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
