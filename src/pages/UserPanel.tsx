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
    <div className="px-4 sm:px-6 lg:px-8 py-8 lg:py-12 min-h-[100dvh] scroll-mt-20 snap-start" data-stagger-index="0">
      {/* Profile header */}
      <div className="relative group mb-8 lg:mb-12 data-stagger-index="1"" data-stagger-index="1">
        <div className="rounded-[2px] bg-gradient-to-br from-card/95 via-card to-card/90 backdrop-blur-xl border border-border/50 shadow-2xl p-6 lg:p-8 hover-spring hover:shadow-3xl hover:-translate-y-2 transition-all duration-700 overflow-hidden hover:z-20">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 -skew-x-3 -translate-x-4 group-hover:translate-x-0 transition-transform duration-1000" />
          <div className="relative flex items-center gap-5 lg:gap-6">
            <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-[2px] bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center shadow-2xl ring-2 ring-primary/20 group-hover:scale-110 group-hover:ring-accent/40 transition-all duration-500 hover-spring">
              <span className="text-2xl lg:text-3xl font-black text-primary-foreground drop-shadow-lg tracking-[-0.05em]">{currentUser.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl lg:text-3xl font-black tracking-[-0.03em] text-foreground leading-tight group-hover:text-accent transition-colors duration-500 drop-shadow-md">{currentUser.name}</h2>
              <p className="text-base lg:text-lg font-medium text-muted-foreground/90 mt-1 tracking-wide">{currentUser.email}</p>
              <div className="flex items-center gap-2 mt-3">
                {isPremium ? (
                  <span className="flex items-center gap-1.5 text-sm lg:text-base font-black text-warning bg-warning/20 px-4 py-1.5 rounded-[2px] shadow-lg ring-1 ring-warning/30 hover:bg-warning/30 hover-spring hover:scale-[1.05] transition-all duration-300 whitespace-nowrap">
                    <Crown size={16} strokeWidth={2.5} /> Premium
                  </span>
                ) : (
                  <span className="text-sm lg:text-base font-black text-muted-foreground/80 bg-muted/50 px-4 py-1.5 rounded-[2px] shadow-sm ring-1 ring-border/50 hover:bg-muted hover-spring hover:scale-[1.02] transition-all duration-200 whitespace-nowrap">
                    Plano Gratuito
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-8 lg:mb-12 data-stagger-index="2"" data-stagger-index="2">
        <div className="group relative rounded-[2px] bg-card/95 backdrop-blur-sm border border-border/50 shadow-xl p-6 lg:p-8 text-center hover-spring hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] transition-all duration-500 z-10 lg:hover:z-20 lg:[&:nth-child(2)]:mt-4 lg:[&:nth-child(2)]:[-translate-x-4] lg:[&:nth-child(3)]:[translate-x-8] lg:[&:nth-child(3)]:shadow-[20px_0_40px_-10px_rgba(0,0,0,0.1)]">
          <Calendar size={28} className="text-primary mx-auto mb-3 lg:mb-4 drop-shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-400 stroke-primary/80" strokeWidth={2.5} />
          <p className="text-3xl lg:text-4xl font-black tracking-[-0.05em] text-foreground drop-shadow-md mb-2 leading-none">{todayApts.length}</p>
          <p className="text-xs lg:text-sm font-black tracking-widest uppercase text-muted-foreground/80 group-hover:text-accent transition-colors duration-300">Hoje</p>
        </div>
        <div className="group relative rounded-[2px] bg-card/95 backdrop-blur-sm border border-border/50 shadow-xl p-6 lg:p-8 text-center hover-spring hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] transition-all duration-500 z-10 lg:hover:z-20 lg:[&:nth-child(2)]:mt-4 lg:[&:nth-child(2)]:[-translate-x-4] lg:[&:nth-child(3)]:[translate-x-8] lg:[&:nth-child(3)]:shadow-[20px_0_40px_-10px_rgba(0,0,0,0.1)]">
          <Users size={28} className="text-accent mx-auto mb-3 lg:mb-4 drop-shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-400 stroke-accent/80" strokeWidth={2.5} />
          <p className="text-3xl lg:text-4xl font-black tracking-[-0.05em] text-foreground drop-shadow-md mb-2 leading-none">{activeStudents}</p>
          <p className="text-xs lg:text-sm font-black tracking-widest uppercase text-muted-foreground/80 group-hover:text-accent transition-colors duration-300">Alunos</p>
        </div>
        <div className="group relative rounded-[2px] bg-card/95 backdrop-blur-sm border border-border/50 shadow-xl p-6 lg:p-8 text-center hover-spring hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] transition-all duration-500 z-10 lg:hover:z-20 lg:[&:nth-child(2)]:mt-4 lg:[&:nth-child(2)]:[-translate-x-4] lg:[&:nth-child(3)]:[translate-x-8] lg:[&:nth-child(3)]:shadow-[20px_0_40px_-10px_rgba(0,0,0,0.1)]">
          <CheckCircle2 size={28} className="text-success mx-auto mb-3 lg:mb-4 drop-shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-400 stroke-success/80" strokeWidth={2.5} />
          <p className="text-3xl lg:text-4xl font-black tracking-[-0.05em] text-foreground drop-shadow-md mb-2 leading-none">{attendedToday.length}</p>
          <p className="text-xs lg:text-sm font-black tracking-widest uppercase text-muted-foreground/80 group-hover:text-accent transition-colors duration-300">Atendidos</p>
        </div>
      </div>

      {/* Session lists */}
      <div className="space-y-6 lg:space-y-8 mb-12" data-stagger-index="3">
        {/* Attended today */}
        {attendedToday.length > 0 && (
          <div className="group relative rounded-[2px] bg-gradient-to-r from-success/5 to-success/2 backdrop-blur-sm border border-success/30 shadow-xl p-6 lg:p-8 hover-spring hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 data-stagger-index="4"" data-stagger-index="4">
            <h3 className="text-sm lg:text-base font-black tracking-wider text-success uppercase mb-4 flex items-center gap-2 drop-shadow-md">
              <CheckCircle2 size={20} strokeWidth={3} className="drop-shadow-lg" /> ATENDIDOS HOJE ({attendedToday.length})
            </h3>
            <div className="space-y-3">
              {attendedToday.map((apt, idx) => (
                <div key={apt.id} className="group/item flex items-center justify-between py-3 px-4 rounded-[1px] bg-white/20 backdrop-blur-sm hover:bg-white/40 hover-spring hover:scale-[1.02] transition-all duration-300 border border-success/20 hover:border-success/40">
                  <span className="font-black text-base lg:text-lg text-foreground truncate group-hover/item:text-success transition-colors">{apt.studentName}</span>
                  <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground/80">
                    <span>{apt.time}</span>
                    {apt.muscleGroups && apt.muscleGroups.length > 0 && (
                      <span className="text-xs px-2.5 py-1 bg-success/30 text-success font-black rounded-[1px] shadow-sm hover:bg-success/50 hover-spring">
                        {apt.muscleGroups.length} grupos
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending today */}
        {pendingToday.length > 0 && (
          <div className="group relative rounded-[2px] bg-gradient-to-r from-muted/10 to-muted/5 backdrop-blur-sm border border-border/50 shadow-xl p-6 lg:p-8 hover-spring hover:shadow-2xl hover:-translate-y-1.5 [-20px] transition-all duration-500 data-stagger-index="5"" data-stagger-index="5">
            <h3 className="text-sm lg:text-base font-black tracking-wider text-muted-foreground uppercase mb-4 flex items-center gap-2 drop-shadow-md">
              PENDENTES HOJE ({pendingToday.length})
            </h3>
            <div className="space-y-3">
              {pendingToday.map((apt, idx) => (
                <div key={apt.id} className="group/item flex items-center justify-between py-3 px-4 rounded-[1px] bg-card/50 hover:bg-accent/10 hover:border-accent/30 hover-spring hover:scale-[1.02] transition-all duration-300 border border-border/30">
                  <span className="font-black text-base lg:text-lg text-foreground truncate group-hover/item:text-accent">{apt.studentName}</span>
                  <span className="text-sm font-bold text-muted-foreground tracking-wide">{apt.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tomorrow */}
        {tomorrowApts.length > 0 && (
          <div className="group relative rounded-[2px] bg-gradient-to-r from-accent/5 to-primary/5 backdrop-blur-sm border border-accent/30 shadow-xl p-6 lg:p-8 hover-spring hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 data-stagger-index="6"" data-stagger-index="6">
            <h3 className="text-sm lg:text-base font-black tracking-wider text-accent uppercase mb-4 flex items-center gap-2 drop-shadow-md">
              AMANHÃ ({tomorrowApts.length})
            </h3>
            <div className="space-y-3">
              {tomorrowApts.slice(0, 5).map((apt, idx) => (
                <div key={apt.id} className="group/item flex items-center justify-between py-3 px-4 rounded-[1px] bg-white/20 hover:bg-accent/20 hover-spring hover:scale-[1.02] transition-all duration-300 border border-accent/20 hover:border-accent/40">
                  <span className="font-black text-base lg:text-lg text-foreground truncate group-hover/item:text-accent transition-colors">{apt.studentName}</span>
                  <span className="text-sm font-bold text-muted-foreground tracking-wide">{apt.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action section */}
      <div className="space-y-4 lg:space-y-5 data-stagger-index="7">
        {/* Notifications */}
        <div className="group relative rounded-[2px] bg-card/95 backdrop-blur-sm border border-border/50 shadow-lg p-6 lg:p-8 hover-spring hover:shadow-xl hover:-translate-y-1 transition-all duration-400 cursor-pointer data-stagger-index="8"" data-stagger-index="8">
          <button onClick={() => setShowNotifSettings(!showNotifSettings)} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-4">
              {currentUser.notifications.enabled ? 
                <div className="w-12 h-12 rounded-[2px] bg-success/20 flex items-center justify-center shadow-md ring-1 ring-success/40 group-hover:scale-110 hover-spring transition-all duration-300">
                  <Bell size={22} className="text-success drop-shadow-lg" strokeWidth={2.5} />
                </div> 
              : 
                <div className="w-12 h-12 rounded-[2px] bg-muted/50 flex items-center justify-center shadow-sm ring-1 ring-border/50 group-hover:scale-110 hover-spring transition-all duration-300">
                  <BellOff size={22} className="text-muted-foreground" strokeWidth={2.5} />
                </div>
              }
              <div>
                <span className="text-base lg:text-lg font-black tracking-tight text-foreground block group-hover:text-accent transition-colors">Notificações</span>
                <span className={`inline-block text-xs lg:text-sm font-black px-3 py-1 rounded-[1px] mt-1 ${currentUser.notifications.enabled ? 'bg-success/20 text-success shadow-sm ring-1 ring-success/40' : 'bg-muted/50 text-muted-foreground shadow-sm ring-1 ring-border/50 hover-spring hover:bg-muted hover:scale-[1.05]'}`}>
                  {currentUser.notifications.enabled ? 'Ativas' : 'Desativadas'}
                </span>
              </div>
            </div>
          </button>

          {showNotifSettings && (
            <div className="mt-6 pt-6 border-t border-border/50 space-y-4 animate-fade-in-up">
              <label className="flex items-center justify-between group/label py-3 px-4 rounded-[1px] bg-muted/20 hover:bg-muted/40 hover-spring transition-all duration-200 cursor-pointer">
                <span className="text-base font-black text-foreground group-hover/label:text-accent">Ativar notificações</span>
                <input type="checkbox" checked={currentUser.notifications.enabled} onChange={e => updateUser({ notifications: { ...currentUser.notifications, enabled: e.target.checked } })} className="w-6 h-6 rounded-[1px] border-2 border-border/50 bg-card focus:ring-2 focus:ring-accent/50 hover:border-accent/60 transition-all duration-200" />
              </label>
              <label className="flex items-center justify-between group/label py-3 px-4 rounded-[1px] bg-muted/20 hover:bg-muted/40 hover-spring transition-all duration-200 cursor-pointer">
                <span className="text-base font-black text-foreground group-hover/label:text-accent">Notificar antes da sessão</span>
                <input type="checkbox" checked={currentUser.notifications.notifyBefore} onChange={e => updateUser({ notifications: { ...currentUser.notifications, notifyBefore: e.target.checked } })} className="w-6 h-6 rounded-[1px] border-2 border-border/50 bg-card focus:ring-2 focus:ring-accent/50 hover:border-accent/60 transition-all duration-200" />
              </label>
            </div>
          )}
        </div>

        {/* Plan upgrade / downgrade */}
        {!isPremium ? (
          <div className="group relative rounded-[2px] bg-gradient-to-r from-warning/10 to-warning/5 backdrop-blur-sm border border-warning/40 shadow-xl p-6 lg:p-8 hover-spring hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer data-stagger-index="9"" data-stagger-index="9">
            <button onClick={upgradeToPremium} className="w-full flex items-center gap-4">
              <div className="w-14 h-14 rounded-[2px] bg-warning/30 flex items-center justify-center shadow-lg ring-2 ring-warning/50 group-hover:scale-110 group-hover:rotate-3 hover-spring transition-all duration-400">
                <Crown size={24} className="text-warning drop-shadow-lg" strokeWidth={2.5} />
              </div>
              <div className="text-left flex-1">
                <span className="text-lg lg:text-xl font-black tracking-tight text-foreground block group-hover:text-warning transition-colors drop-shadow-md">Upgrade para Premium</span>
                <span className="text-sm lg:text-base font-bold text-muted-foreground/90 tracking-wide mt-1 block">Desbloqueie todos os módulos + suporte prioritário</span>
              </div>
            </button>
          </div>
        ) : (
          <div className="group relative rounded-[2px] bg-card/95 backdrop-blur-sm border border-border/50 shadow-lg p-6 lg:p-8 hover-spring hover:shadow-xl hover:-translate-y-1 transition-all duration-400 cursor-pointer data-stagger-index="9"" data-stagger-index="9">
            <button onClick={downgradeToFree} className="w-full flex items-center gap-4 text-muted-foreground">
              <div className="w-14 h-14 rounded-[2px] bg-muted/50 flex items-center justify-center shadow-sm ring-1 ring-border/50 group-hover:scale-110 hover-spring transition-all duration-300">
                <Shield size={24} className="text-muted-foreground" strokeWidth={2.5} />
              </div>
              <span className="text-lg lg:text-xl font-black tracking-tight group-hover:text-destructive transition-colors">Voltar para plano gratuito</span>
            </button>
          </div>
        )}

        {/* Logout */}
        <div className="group relative rounded-[2px] bg-destructive/5 backdrop-blur-sm border border-destructive/30 shadow-xl p-6 lg:p-8 hover-spring hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 cursor-pointer data-stagger-index="10">
          <button onClick={logout} className="w-full flex items-center gap-4 text-destructive hover:text-destructive-foreground hover:bg-destructive/10 hover-spring transition-all duration-300">
            <div className="w-14 h-14 rounded-[2px] bg-destructive/20 flex items-center justify-center shadow-md ring-1 ring-destructive/40 group-hover:scale-110 group-hover:rotate-12 transition-all duration-400 hover-spring">
              <LogOut size={24} strokeWidth={2.5} className="drop-shadow-lg" />
            </div>
            <span className="text-lg lg:text-xl font-black tracking-tight drop-shadow-md">Sair da conta</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserPanel;
