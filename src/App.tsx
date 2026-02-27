import React, { useState, useRef, Suspense, lazy } from 'react';
import { CalendarDays, Menu, X, Users, TrendingUp, User, DollarSign, Shield } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from './components/ui/sheet';
import ToastContainer from './components/ToastContainer';
import { useToast } from './hooks/useFitToast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

const Schedule = lazy(() => import('./pages/Schedule'));
const Students = lazy(() => import('./pages/Students'));
const Evolution = lazy(() => import('./pages/Evolution'));
const UserPanel = lazy(() => import('./pages/UserPanel'));
const Finance = lazy(() => import('./pages/Finance'));
const Admin = lazy(() => import('./pages/Admin'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));

const PageLoader = () => (
  <div className="flex items-center justify-center h-40">
    <div className="spinner" />
  </div>
);

function AppContent() {
  const [activeTab, setActiveTab] = useState('schedule');
  const [animKey, setAnimKey] = useState(0);
  const mainRef = useRef<HTMLElement>(null);
  const { toasts, removeToast } = useToast();
  const { isAdmin, isAuthenticated, loading, authScreen } = useAuth();

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setAnimKey(k => k + 1);
    if (mainRef.current) mainRef.current.scrollTop = 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-primary">
          <CalendarDays size={28} className="text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div className="text-center leading-none">
          <span className="text-2xl font-black tracking-tight italic bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
            FITPRO
          </span>
          <span className="block text-xs font-bold tracking-wider mt-0.5 text-muted-foreground">
            AGENDA PERSONAL
          </span>
        </div>
        <div className="spinner mt-4" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<PageLoader />}>
        {authScreen === 'login' && <Login />}
        {authScreen === 'register' && <Register />}
        {authScreen === 'forgot' && <ForgotPassword />}
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </Suspense>
    );
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'schedule': return <Schedule />;
      case 'students': return <Students />;
      case 'evolution': return <Evolution />;
      case 'user': return <UserPanel />;
      case 'finance': return <Finance />;
      case 'admin': return <Admin />;
      default: return <Schedule />;
    }
  };

  const navItems = [
    { id: 'schedule', icon: CalendarDays, label: 'Agenda' },
    { id: 'students', icon: Users, label: 'Alunos' },
    { id: 'evolution', icon: TrendingUp, label: 'Evolução' },
    { id: 'user', icon: User, label: 'Perfil' },
    { id: 'finance', icon: DollarSign, label: 'Financeiro' },
    ...(isAdmin ? [{ id: 'admin', icon: Shield, label: 'Admin' }] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 safe-area-pt bg-card/95 backdrop-blur-sm border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[2px] flex items-center justify-center bg-primary hover-spring">
              <CalendarDays size={20} className="text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <h1 className="text-2xl font-black tracking-[-0.05em] bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                FITPRO
              </h1>
              <span className="text-[9px] font-bold tracking-widest uppercase text-muted-foreground">Agenda Precision</span>
            </div>
          </div>
          <Sheet>
            <SheetTrigger className="lg:hidden p-2 hover-spring rounded-[2px] hover:bg-muted/50">
              <Menu size={20} className="text-foreground" />
            </SheetTrigger>
            <SheetContent side="right" className="p-0 w-[280px] rounded-l-[2px]">
              <div className="p-4 border-b border-border">
                <SheetClose asChild>
                  <button className="flex items-center gap-2 hover-spring">
                    <X size={20} />
                    <span className="font-bold text-sm">Fechar</span>
                  </button>
                </SheetClose>
              </div>
              <nav className="p-4 pt-2 flex flex-col gap-1">
                {navItems.map(({id, icon: Icon, label}) => (
                  <SheetClose key={id} asChild>
                    <button 
                      className={`w-full flex items-center gap-3 p-3 rounded-[2px] hover-spring text-left font-bold text-sm transition-colors ${activeTab === id ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-muted/80'}`}
                      onClick={() => handleTabChange(id)}
                    >
                      <Icon size={20} strokeWidth={2.5} />
                      <span>{label}</span>
                    </button>
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="flex min-h-dvh lg:min-h-screen">
        {/* Left Rail - desktop only */}
        <aside className="hidden lg:block fixed left-0 top-[60px] z-40 w-16 h-[calc(100dvh-60px)] bg-card/90 backdrop-blur-sm border-r border-border/50 shadow-lg transition-all duration-300 hover:translate-x-[2px]">
          <nav className="flex flex-col items-center gap-3 p-4 pt-8 h-full justify-center">
            {navItems.map(({id, icon: Icon}) => (
              <button
                key={id}
                className="w-11 h-11 rounded-[2px] flex items-center justify-center text-muted-foreground hover-spring hover:bg-accent/20 hover:text-accent data-[active=true]:bg-accent data-[active=true]:text-accent-foreground shadow-sm group relative overflow-hidden transition-all duration-200"
                data-active={activeTab === id}
                onClick={() => handleTabChange(id)}
              >
                <Icon size={18} strokeWidth={2.5} className="group-hover:scale-110 transition-transform duration-200" />
              </button>
            ))}
          </nav>
        </aside>
        <main 
          ref={mainRef}
          className="flex-1 w-full lg:ml-16 overflow-y-auto lg:pr-8"
          style={{
            paddingTop: 'calc(60px + env(safe-area-inset-top, 0px))',
            scrollBehavior: 'smooth',
            scrollSnapType: 'y mandatory',
          }}
        >
          <Suspense fallback={<PageLoader />}>
            <div key={animKey} className="animate-fade-in-up min-h-full">
              {renderActiveTab()}
            </div>
          </Suspense>
        </main>
      </div>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
