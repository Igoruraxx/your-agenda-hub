import React, { useState, useEffect } from 'react';
import { Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AuthLayout from '../components/AuthLayout';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [sessionReady, setSessionReady] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event from the URL token
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
        setChecking(false);
      }
    });

    // Also check if we already have a session (user clicked link and was auto-logged in)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      }
      setChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Preencha todos os campos.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.message || 'Erro ao redefinir senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const goToApp = () => {
    window.location.href = '/';
  };

  if (checking) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
      </AuthLayout>
    );
  }

  if (!sessionReady) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center text-center py-6 gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--error-light)', border: '1px solid var(--error)' }}>
            <AlertCircle size={28} style={{ color: 'var(--error)' }} />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--n-900)' }}>Link inválido ou expirado</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--n-500)' }}>
              O link de redefinição de senha é inválido ou já expirou. Solicite um novo link.
            </p>
          </div>
          <button onClick={goToApp} className="btn btn-primary w-full py-3 text-sm font-bold mt-2">
            Voltar para login
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="space-y-5">
        {success ? (
          <div className="flex flex-col items-center text-center py-6 gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--success-light)', border: '1px solid var(--success)' }}>
              <CheckCircle2 size={28} style={{ color: 'var(--success)' }} />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--n-900)' }}>Senha redefinida!</h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--n-500)' }}>
                Sua senha foi alterada com sucesso. Você já pode acessar sua conta.
              </p>
            </div>
            <button onClick={goToApp} className="btn btn-primary w-full py-3 text-sm font-bold mt-2">
              Ir para o app
            </button>
          </div>
        ) : (
          <>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--accent-light)', border: '1px solid var(--n-200)' }}>
                <Lock size={26} style={{ color: 'var(--accent)' }} />
              </div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--n-900)' }}>Nova senha</h2>
              <p className="text-sm mt-1.5 leading-relaxed" style={{ color: 'var(--n-500)' }}>
                Crie uma nova senha para sua conta.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--n-500)' }}>Nova senha</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--n-400)' }} />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                    className="input-base w-full pl-10 pr-4"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--n-500)' }}>Confirmar senha</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--n-400)' }} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    autoComplete="new-password"
                    className="input-base w-full pl-10 pr-4"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg px-4 py-2.5" style={{ background: 'var(--error-light)', border: '1px solid var(--error)' }}>
                  <p className="text-xs font-medium" style={{ color: 'var(--error)' }}>{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 text-sm font-bold disabled:opacity-50">
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Redefinir senha'}
              </button>
            </form>
          </>
        )}
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;
