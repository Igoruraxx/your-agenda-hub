import React, { useState, useRef, Suspense, lazy } from 'react';
import { CalendarDays } from 'lucide-react';
import BottomNavigation from './components/BottomNavigation';
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

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 max-w-lg mx-auto safe-area-pt bg-card border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary">
            <CalendarDays size={18} className="text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="leading-none">
            <span className="text-lg font-black tracking-tight italic bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
              FITPRO
            </span>
            <span className="block text-[10px] font-bold tracking-wider text-muted-foreground" style={{ marginTop: '-1px' }}>
              AGENDA PERSONAL
            </span>
          </div>
        </div>
      </header>

      <main
        ref={mainRef}
        className="relative z-10 max-w-lg mx-auto overflow-y-auto"
        style={{
          height: '100dvh',
          scrollBehavior: 'smooth',
          paddingTop: 'calc(60px + env(safe-area-inset-top, 0px))',
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <Suspense fallback={<PageLoader />}>
          <div key={animKey} className="animate-fade-in-up min-h-full">
            {renderActiveTab()}
          </div>
        </Suspense>
      </main>

      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} isAdmin={isAdmin} />
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
