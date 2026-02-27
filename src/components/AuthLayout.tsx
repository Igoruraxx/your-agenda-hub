import React from 'react';
import { CalendarDays } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex justify-center pt-14 pb-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-primary shadow-lg">
            <CalendarDays size={32} className="text-primary-foreground" strokeWidth={2} />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-black tracking-tight italic bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
              FITPRO
            </h1>
            <p className="text-sm font-bold tracking-wider mt-0.5 text-muted-foreground">
              AGENDA PERSONAL
            </p>
            <p className="text-xs font-medium mt-0.5 text-neutral-400">
              Gestão inteligente de agendamentos
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 pb-8 pt-2">
        <div className="w-full max-w-sm">
          <div className="card-surface p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
