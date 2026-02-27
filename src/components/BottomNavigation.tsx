import React from 'react';
import { Calendar, Users, TrendingUp, User, DollarSign, Settings } from 'lucide-react';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAdmin: boolean;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange, isAdmin }) => {
  const tabs = [
    { id: 'schedule', icon: Calendar, label: 'Agenda' },
    { id: 'students', icon: Users, label: 'Clientes' },
    { id: 'evolution', icon: TrendingUp, label: 'Evolução' },
    { id: 'finance', icon: DollarSign, label: 'Finanças' },
    { id: 'user', icon: User, label: 'Perfil' },
  ];

  if (isAdmin) {
    tabs.push({ id: 'admin', icon: Settings, label: 'Admin' });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-pb bg-card border-t border-border">
      <div className="flex justify-around items-center max-w-lg mx-auto px-1 py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg flex-1 transition-all duration-150 touch-manipulation active:scale-95"
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div
                className={`p-1.5 rounded-lg transition-all duration-150 ${
                  isActive ? 'bg-accent-light' : 'bg-transparent'
                }`}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className={isActive ? 'text-primary' : 'text-muted-foreground'}
                />
              </div>
              <span
                className={`text-[10px] font-semibold transition-colors duration-150 ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
