import React, { useState, useEffect } from 'react';
import { Settings, Users, Crown, Shield, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AdminProfile {
  id: string;
  name: string;
  email: string;
  plan: string;
  is_admin: boolean;
  created_at: string;
}

const Admin: React.FC = () => {
  const { isAdmin } = useAuth();
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isAdmin) return;
    fetchProfiles();
  }, [isAdmin]);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('id, name, email, plan, is_admin, created_at').order('created_at', { ascending: false });
    if (!error && data) {
      setProfiles(data as AdminProfile[]);
      // Fetch student counts
      const counts: Record<string, number> = {};
      for (const p of data) {
        const { count } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('user_id', p.id);
        counts[p.id] = count || 0;
      }
      setStudentCounts(counts);
    }
    setLoading(false);
  };

  const togglePlan = async (profileId: string, currentPlan: string) => {
    const newPlan = currentPlan === 'premium' ? 'free' : 'premium';
    const { error } = await supabase.from('profiles').update({ plan: newPlan }).eq('id', profileId);
    if (!error) {
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, plan: newPlan } : p));
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

  const filtered = profiles.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.email.toLowerCase().includes(searchTerm.toLowerCase()));

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
          {filtered.map(profile => (
            <div key={profile.id} className="card-surface p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground truncate">{profile.name}</p>
                    {profile.is_admin && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">Admin</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users size={10} /> {studentCounts[profile.id] || 0} alunos
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Desde {format(new Date(profile.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                </div>
                <button onClick={() => togglePlan(profile.id, profile.plan)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    profile.plan === 'premium' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'
                  }`}>
                  {profile.plan === 'premium' ? <><Crown size={12} /> Premium</> : 'Free'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Admin;
