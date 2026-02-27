import React, { useState } from 'react';
import { Crown, Bell, BellOff, LogOut, Calendar, Users, Shield, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PLAN_LIMITS } from '../types';
import { useStudents } from '../hooks/useStudents';
import { useAppointments } from '../hooks/useAppointments';
import { format } from 'date-fns';

const UserPanel: React.FC = () => {
  const { currentUser, isPremium, logout, updateUser, upgradeToPremium, downgradeToFree } = useAuth();
  const { students } = useStudents();
  const { appointments } = useAppointments();
  const [showNotifSettings, setShowNotifSettings] = useState(false);

  const planLimits = PLAN_LIMITS[currentUser.plan];
  const activeStudents = students.filter(s => s.isActive).length;

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const todayApts = appointments[todayKey] || [];
  const attendedToday = todayApts.filter(a => a.sessionDone);
  const pendingToday = todayApts.filter(a => !a.sessionDone);

  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowKey = format(tomorrowDate, 'yyyy-MM-dd');
  const tomorrowApts = appointments[tomorrowKey] || [];

  return (
    <div className="px-4 py-4">
      {/* Profile header */}
      <div className="card-surface p-5 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
            <span className="text-xl font-black text-primary-foreground">{currentUser.name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-foreground">{currentUser.name}</h2>
            <p className="text-sm text-muted-foreground">{currentUser.email}</p>
            <div className="flex items-center gap-1.5 mt-1">
              {isPremium ? (
                <span className="flex items-center gap-1 text-xs font-bold text-warning bg-warning/10 px-2 py-0.5 rounded-full"><Crown size={12} /> Premium</span>
              ) : (
                <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Plano Gratuito</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="card-surface p-3 text-center">
          <Calendar size={16} className="text-primary mx-auto mb-1" />
          <p className="text-xl font-black text-foreground">{todayApts.length}</p>
          <p className="text-[10px] text-muted-foreground">Hoje</p>
        </div>
        <div className="card-surface p-3 text-center">
          <Users size={16} className="text-primary mx-auto mb-1" />
          <p className="text-xl font-black text-foreground">{activeStudents}</p>
          <p className="text-[10px] text-muted-foreground">Alunos</p>
        </div>
        <div className="card-surface p-3 text-center">
          <CheckCircle2 size={16} className="text-success mx-auto mb-1" />
          <p className="text-xl font-black text-foreground">{attendedToday.length}</p>
          <p className="text-[10px] text-muted-foreground">Atendidos</p>
        </div>
      </div>

      {/* Attended today */}
      {attendedToday.length > 0 && (
        <div className="card-surface p-4 mb-3">
          <h3 className="text-xs font-bold text-success mb-2 flex items-center gap-1"><CheckCircle2 size={12} /> ATENDIDOS HOJE</h3>
          <div className="space-y-1.5">
            {attendedToday.map(apt => (
              <div key={apt.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{apt.studentName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{apt.time}</span>
                  {apt.muscleGroups && apt.muscleGroups.length > 0 && (
                    <span className="text-[10px] text-primary bg-accent-light px-1.5 py-0.5 rounded">{apt.muscleGroups.length} grupos</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending today */}
      {pendingToday.length > 0 && (
        <div className="card-surface p-4 mb-3">
          <h3 className="text-xs font-bold text-muted-foreground mb-2">PENDENTES HOJE</h3>
          <div className="space-y-1.5">
            {pendingToday.map(apt => (
              <div key={apt.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{apt.studentName}</span>
                <span className="text-muted-foreground">{apt.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tomorrow */}
      {tomorrowApts.length > 0 && (
        <div className="card-surface p-4 mb-3">
          <h3 className="text-xs font-bold text-muted-foreground mb-2">AMANHÃ</h3>
          <div className="space-y-1.5">
            {tomorrowApts.slice(0, 5).map(apt => (
              <div key={apt.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{apt.studentName}</span>
                <span className="text-muted-foreground">{apt.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications */}
      <button onClick={() => setShowNotifSettings(!showNotifSettings)} className="w-full card-surface p-4 flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {currentUser.notifications.enabled ? <Bell size={18} className="text-primary" /> : <BellOff size={18} className="text-muted-foreground" />}
          <span className="text-sm font-bold text-foreground">Notificações</span>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${currentUser.notifications.enabled ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
          {currentUser.notifications.enabled ? 'Ativas' : 'Desativadas'}
        </span>
      </button>

      {showNotifSettings && (
        <div className="card-surface p-4 mb-3 space-y-3 animate-fade-in-up">
          <label className="flex items-center justify-between">
            <span className="text-sm text-foreground">Ativar notificações</span>
            <input type="checkbox" checked={currentUser.notifications.enabled} onChange={e => updateUser({ notifications: { ...currentUser.notifications, enabled: e.target.checked } })} className="rounded" />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-foreground">Notificar antes da sessão</span>
            <input type="checkbox" checked={currentUser.notifications.notifyBefore} onChange={e => updateUser({ notifications: { ...currentUser.notifications, notifyBefore: e.target.checked } })} className="rounded" />
          </label>
        </div>
      )}

      {/* Plan upgrade / downgrade */}
      {!isPremium ? (
        <button onClick={upgradeToPremium} className="w-full card-surface p-4 flex items-center gap-3 mb-3 hover:shadow-md transition-shadow">
          <Crown size={18} className="text-warning" />
          <div className="text-left">
            <span className="text-sm font-bold text-foreground block">Upgrade para Premium</span>
            <span className="text-xs text-muted-foreground">Desbloqueie todos os módulos</span>
          </div>
        </button>
      ) : (
        <button onClick={downgradeToFree} className="w-full card-surface p-4 flex items-center gap-3 mb-3">
          <Shield size={18} className="text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Voltar para plano gratuito</span>
        </button>
      )}

      {/* Logout */}
      <button onClick={logout} className="w-full card-surface p-4 flex items-center gap-3 text-destructive hover:shadow-md transition-shadow">
        <LogOut size={18} />
        <span className="text-sm font-bold">Sair da conta</span>
      </button>
    </div>
  );
};

export default UserPanel;
