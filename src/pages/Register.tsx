import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const BENEFITS = [
  'Agenda inteligente de atendimentos',
  'Gestão completa de clientes',
  'Comece grátis, upgrade quando quiser',
];

const Register: React.FC = () => {
  const { register, loginWithGoogle, setAuthScreen } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email || !password || !confirmPassword) { setError('Preencha todos os campos.'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setError('Por favor, insira um e-mail válido.'); return; }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }
    if (password !== confirmPassword) { setError('As senhas não coincidem.'); return; }
    setLoading(true);
    try {
      await register(name.trim(), email, password);
    } catch {
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch {
      setError('Erro ao entrar com Google.');
      setGoogleLoading(false);
    }
  };

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabel = ['', 'Fraca', 'Média', 'Forte'];
  const strengthColor = ['', 'bg-red-500', 'bg-yellow-500', 'bg-green-500'];

  return (
    <AuthLayout>
      <div className="space-y-5">
        <div className="text-center mb-2">
          <h2 className="text-xl font-bold" style={{color:'var(--n-900)'}}>Criar conta grátis</h2>
          <p className="text-sm mt-1" style={{color:'var(--n-500)'}}>Comece a gerenciar seus clientes hoje</p>
        </div>

        <div className="flex flex-col gap-1.5 rounded-xl px-4 py-3" style={{background:'var(--accent-light)',border:'1px solid var(--n-200)'}}>
          {BENEFITS.map(b => (
            <div key={b} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{background:'var(--accent)',color:'var(--n-0)'}}>
                <Check size={10} />
              </div>
              <span className="text-xs font-medium" style={{color:'var(--n-700)'}}>{b}</span>
            </div>
          ))}
        </div>

        {/* Google Register */}
        <button
          onClick={handleGoogleRegister}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-semibold transition-all hover:shadow-md disabled:opacity-50"
          style={{ background: 'var(--n-0)', border: '1.5px solid var(--n-300)', color: 'var(--n-700)' }}
        >
          {googleLoading ? <Loader2 size={18} className="animate-spin" /> : (<><GoogleIcon /> Registrar com Google</>)}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{background:'var(--n-200)'}} />
          <span className="text-xs" style={{color:'var(--n-400)'}}>ou crie com e-mail</span>
          <div className="flex-1 h-px" style={{background:'var(--n-200)'}} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{color:'var(--n-500)'}}>Nome completo</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{color:'var(--n-400)'}} />
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" autoComplete="name" className="input-base w-full pl-10 pr-4" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{color:'var(--n-500)'}}>E-mail</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{color:'var(--n-400)'}} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" autoComplete="email" className="input-base w-full pl-10 pr-4" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{color:'var(--n-500)'}}>Senha</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{color:'var(--n-400)'}} />
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" autoComplete="new-password" className="input-base w-full pl-10 pr-11" />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors touch-manipulation" style={{color:'var(--n-400)'}}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {password.length > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex gap-1 flex-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength ? strengthColor[passwordStrength] : 'bg-gray-200'}`} />
                  ))}
                </div>
                <span className={`text-xs font-medium ${passwordStrength === 1 ? 'text-red-400' : passwordStrength === 2 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {strengthLabel[passwordStrength]}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{color:'var(--n-500)'}}>Confirmar senha</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{color:'var(--n-400)'}} />
              <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repita a senha" autoComplete="new-password"
                className={`input-base w-full pl-10 pr-11 ${confirmPassword && confirmPassword !== password ? 'border-red-500' : ''}`} />
              <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors touch-manipulation" style={{color:'var(--n-400)'}}>
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg px-4 py-2.5" style={{background:'var(--error-light)',border:'1px solid var(--error)'}}>
              <p className="text-xs font-medium" style={{color:'var(--error)'}}>{error}</p>
            </div>
          )}

          <p className="text-xs text-center leading-relaxed" style={{color:'var(--n-400)'}}>
            Ao criar uma conta, você concorda com nossos{' '}
            <span className="cursor-pointer font-medium" style={{color:'var(--accent)'}}>Termos de Uso</span>
            {' '}e{' '}
            <span className="cursor-pointer font-medium" style={{color:'var(--accent)'}}>Política de Privacidade</span>.
          </p>

          <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 text-sm font-bold disabled:opacity-50">
            {loading ? <Loader2 size={18} className="animate-spin" /> : (<>Criar conta grátis <ArrowRight size={16} /></>)}
          </button>
        </form>

        <p className="text-center text-sm" style={{color:'var(--n-500)'}}>
          Já tem uma conta?{' '}
          <button onClick={() => setAuthScreen('login')} className="font-semibold transition-colors touch-manipulation" style={{color:'var(--accent)'}}>Entrar</button>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Register;
