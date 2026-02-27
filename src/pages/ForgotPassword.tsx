import React, { useState } from 'react';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';

const ForgotPassword: React.FC = () => {
  const { forgotPassword, setAuthScreen } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Informe seu e-mail.'); return; }

    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      setError('Erro ao enviar e-mail. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-5">
        <button
          onClick={() => setAuthScreen('login')}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors touch-manipulation -mb-1"
        >
          <ArrowLeft size={15} />
          Voltar para login
        </button>

        {sent ? (
          <div className="flex flex-col items-center text-center py-6 gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-success/10">
              <CheckCircle2 size={32} className="text-success" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">E-mail enviado!</h2>
              <p className="text-sm mt-2 text-muted-foreground leading-relaxed">
                Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
              </p>
            </div>
            <button
              onClick={() => setAuthScreen('login')}
              className="btn btn-primary px-6 py-2.5 text-sm font-bold mt-2"
            >
              Voltar para login
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-foreground">Esqueceu sua senha?</h2>
              <p className="text-sm mt-1 text-muted-foreground">
                Informe seu e-mail e enviaremos instruções para redefinir sua senha.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">E-mail</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="input-field pl-11"
                    autoComplete="email"
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 text-center">{error}</div>
              )}

              <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 text-sm font-bold">
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Enviar instruções'}
              </button>
            </form>
          </>
        )}
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
