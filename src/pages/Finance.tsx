import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, Users, Calendar, ChevronLeft, ChevronRight, CheckCircle2, Clock, AlertTriangle, MessageCircle } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Student, Appointment } from '../types';
import FeatureGate from '../components/FeatureGate';
import { usePermissions } from '../hooks/usePermissions';
import { useStudents } from '../hooks/useStudents';
import { useAppointments } from '../hooks/useAppointments';

const DAY_MAP: Record<string, number> = { Domingo: 0, Segunda: 1, Terça: 2, Quarta: 3, Quinta: 4, Sexta: 5, Sábado: 6 };
const CUR = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function buildMonthAppointments(students: Student[], monthDate: Date, today: Date): Appointment[] {
  const days = eachDayOfInterval({ start: startOfMonth(monthDate), end: endOfMonth(monthDate) });
  const apts: Appointment[] = [];
  students.filter(s => !s.isConsulting).forEach(student => {
    student.selectedDays.forEach((dayName, idx) => {
      const jsDay = DAY_MAP[dayName];
      const time = student.selectedTimes[idx] || '08:00';
      days.forEach(day => {
        if (getDay(day) !== jsDay) return;
        if (!student.isActive && isBefore(today, startOfDay(day))) return;
        apts.push({
          id: `${student.id}-${format(day, 'yyyy-MM-dd')}-${time}`,
          studentId: student.id,
          studentName: student.name,
          date: day,
          time,
          duration: 60,
        });
      });
    });
  });
  return apts;
}

const Finance: React.FC = () => {
  const { canAccessFinance } = usePermissions();
  const { students } = useStudents();
  const { appointments } = useAppointments();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const today = new Date();
  const monthApts = useMemo(() => buildMonthAppointments(students, currentMonth, today), [students, currentMonth]);

  const activeStudents = students.filter(s => s.isActive && !s.isConsulting);
  const monthlyStudents = activeStudents.filter(s => s.plan === 'monthly');
  const sessionStudents = activeStudents.filter(s => s.plan === 'session');

  // Count done sessions from real appointments
  const getDoneSessions = (studentId: string) => {
    let count = 0;
    Object.values(appointments).forEach(dayApts => {
      dayApts.forEach(a => {
        if (a.studentId === studentId && a.sessionDone) count++;
      });
    });
    return count;
  };

  const monthlyRevenue = monthlyStudents.reduce((acc, s) => acc + s.value, 0);
  const sessionRevenue = sessionStudents.reduce((acc, s) => {
    const count = monthApts.filter(a => a.studentId === s.id).length;
    return acc + (count * s.value);
  }, 0);
  const totalRevenue = monthlyRevenue + sessionRevenue;

  const getWhatsAppChargeUrl = (student: Student, amount: number) => {
    if (!student.phone) return undefined;
    const phone = student.phone.replace(/\D/g, '');
    const month = format(currentMonth, 'MMMM/yyyy', { locale: ptBR });
    const msg = encodeURIComponent(`Olá ${student.name}, seu pagamento de ${CUR(amount)} referente a ${month} está pendente. Qualquer dúvida, estou à disposição!`);
    return `https://wa.me/${phone}?text=${msg}`;
  };

  return (
    <FeatureGate allowed={canAccessFinance} title="Módulo Financeiro" description="Acompanhe receitas, pagamentos e projeções financeiras dos seus alunos.">
      <div className="px-4 py-4">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentMonth(prev => subMonths(prev, 1))} className="btn btn-ghost p-2"><ChevronLeft size={20} /></button>
          <h2 className="text-sm font-bold text-foreground capitalize">{format(currentMonth, "MMMM yyyy", { locale: ptBR })}</h2>
          <button onClick={() => setCurrentMonth(prev => addMonths(prev, 1))} className="btn btn-ghost p-2"><ChevronRight size={20} /></button>
        </div>

        {/* Revenue cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="card-surface p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={16} className="text-success" />
              <span className="text-xs font-bold text-muted-foreground">Receita total</span>
            </div>
            <p className="text-xl font-black text-foreground">{CUR(totalRevenue)}</p>
          </div>
          <div className="card-surface p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} className="text-primary" />
              <span className="text-xs font-bold text-muted-foreground">Alunos ativos</span>
            </div>
            <p className="text-xl font-black text-foreground">{activeStudents.length}</p>
          </div>
          <div className="card-surface p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} className="text-primary" />
              <span className="text-xs font-bold text-muted-foreground">Sessões do mês</span>
            </div>
            <p className="text-xl font-black text-foreground">{monthApts.length}</p>
          </div>
          <div className="card-surface p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-warning" />
              <span className="text-xs font-bold text-muted-foreground">Ticket médio</span>
            </div>
            <p className="text-xl font-black text-foreground">
              {activeStudents.length > 0 ? CUR(totalRevenue / activeStudents.length) : 'R$ 0'}
            </p>
          </div>
        </div>

        {/* Student breakdown */}
        <h3 className="text-sm font-bold text-foreground mb-3">Detalhamento por aluno</h3>
        <div className="space-y-2">
          {activeStudents.map(student => {
            const sessions = monthApts.filter(a => a.studentId === student.id).length;
            const doneSessions = getDoneSessions(student.id);
            const isSessionPlan = student.plan === 'session';
            const revenue = isSessionPlan ? sessions * student.value : student.value;
            const dueDay = student.billingDay || 1;
            const isPastDue = today.getDate() > dueDay;
            const remainingSessions = isSessionPlan ? Math.max(0, sessions - doneSessions) : 0;
            const sessionProgress = isSessionPlan && sessions > 0 ? (doneSessions / sessions) * 100 : 0;
            const pendingAmount = isSessionPlan ? remainingSessions * student.value : 0;
            const whatsAppUrl = getWhatsAppChargeUrl(student, isSessionPlan ? pendingAmount : revenue);

            return (
              <div key={student.id} className="card-surface p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">{student.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {isSessionPlan ? `${doneSessions}/${sessions} sessões` : 'Mensal'}
                      </span>
                      {!isSessionPlan && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock size={10} /> Vence dia {dueDay}
                          {isPastDue && <AlertTriangle size={10} className="text-warning" />}
                        </span>
                      )}
                    </div>
                    {/* Session progress bar */}
                    {isSessionPlan && sessions > 0 && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(sessionProgress, 100)}%` }} />
                        </div>
                        {remainingSessions > 0 && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {remainingSessions} restantes · Pendente: {CUR(pendingAmount)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{CUR(revenue)}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <CheckCircle2 size={12} className="text-success" />
                        <span className="text-[10px] text-success font-medium">Ativo</span>
                      </div>
                    </div>
                    {whatsAppUrl && (
                      <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost p-2">
                        <MessageCircle size={18} className="text-[#25D366]" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </FeatureGate>
  );
};

export default Finance;
