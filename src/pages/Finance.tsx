import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, Users, Calendar, ChevronLeft, ChevronRight, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Student, Appointment } from '../types';
import FeatureGate from '../components/FeatureGate';
import { usePermissions } from '../hooks/usePermissions';
import { useStudents } from '../hooks/useStudents';

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
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const today = new Date();
  const monthApts = useMemo(() => buildMonthAppointments(students, currentMonth, today), [students, currentMonth]);

  const activeStudents = students.filter(s => s.isActive && !s.isConsulting);
  const monthlyStudents = activeStudents.filter(s => s.plan === 'monthly');
  const sessionStudents = activeStudents.filter(s => s.plan === 'session');

  const monthlyRevenue = monthlyStudents.reduce((acc, s) => acc + s.value, 0);
  const sessionRevenue = sessionStudents.reduce((acc, s) => {
    const count = monthApts.filter(a => a.studentId === s.id).length;
    return acc + (count * s.value);
  }, 0);
  const totalRevenue = monthlyRevenue + sessionRevenue;

  return (
    <FeatureGate
      allowed={canAccessFinance}
      title="Módulo Financeiro"
      description="Acompanhe receitas, pagamentos e projeções financeiras dos seus alunos."
    >
      <div className="px-4 py-4">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentMonth(prev => subMonths(prev, 1))} className="btn btn-ghost p-2"><ChevronLeft size={20} /></button>
          <h2 className="text-sm font-bold text-foreground capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </h2>
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
            const revenue = student.plan === 'monthly' ? student.value : sessions * student.value;
            const dueDay = student.billingDay || 1;
            const isPastDue = today.getDate() > dueDay;

            return (
              <div key={student.id} className="card-surface p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">{student.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {student.plan === 'monthly' ? 'Mensal' : `${sessions} sessões`}
                      </span>
                      {student.plan === 'monthly' && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock size={10} /> Vence dia {dueDay}
                          {isPastDue && <AlertTriangle size={10} className="text-warning" />}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{CUR(revenue)}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <CheckCircle2 size={12} className="text-success" />
                      <span className="text-[10px] text-success font-medium">Ativo</span>
                    </div>
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
