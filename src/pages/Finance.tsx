import React, { useState, useMemo, useEffect } from 'react';
import { DollarSign, TrendingUp, Users, Calendar, ChevronLeft, ChevronRight, CheckCircle2, Clock, AlertTriangle, MessageCircle, Filter, XCircle } from 'lucide-react';
import { format, addMonths, subMonths, differenceInDays, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Student } from '../types';
import FeatureGate from '../components/FeatureGate';
import { usePermissions } from '../hooks/usePermissions';
import { useStudents } from '../hooks/useStudents';
import { useAppointments } from '../hooks/useAppointments';
import { usePayments, Payment } from '../hooks/usePayments';
import { useToast } from '../hooks/useFitToast';

const CUR = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

type FilterStatus = 'all' | 'pending' | 'paid' | 'overdue';

const Finance: React.FC = () => {
  const { canAccessFinance } = usePermissions();
  const { students } = useStudents();
  const { appointments } = useAppointments();
  const { payments, loading, markAsPaid, markAsOverdue, generateMonthlyPayments, getOverdueDays, fetchPayments } = usePayments();
  const { success, error: showError } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [processing, setProcessing] = useState<string | null>(null);

  const monthRef = format(currentMonth, 'yyyy-MM');

  // Auto-generate payments for the month
  useEffect(() => {
    if (students.length > 0) {
      generateMonthlyPayments(students, currentMonth);
    }
  }, [students, currentMonth, generateMonthlyPayments]);

  // Fetch payments for selected month
  useEffect(() => {
    fetchPayments(monthRef);
  }, [monthRef, fetchPayments]);

  const activeStudents = students.filter(s => s.isActive && !s.isConsulting);
  const monthPayments = payments.filter(p => p.monthRef === monthRef);

  // Count done sessions per student from real appointments
  const getDoneSessions = (studentId: string) => {
    let count = 0;
    Object.values(appointments).forEach(dayApts => {
      dayApts.forEach(a => {
        if (a.studentId === studentId && a.sessionDone) count++;
      });
    });
    return count;
  };

  // Get total expected sessions this month for a student
  const getMonthSessions = (student: Student) => {
    let count = 0;
    Object.values(appointments).forEach(dayApts => {
      dayApts.forEach(a => {
        if (a.studentId === student.id) count++;
      });
    });
    return count;
  };

  // Summaries
  const summaries = useMemo(() => {
    let predicted = 0;
    let received = 0;
    let pending = 0;
    let overdue = 0;

    monthPayments.forEach(p => {
      predicted += p.amount;
      if (p.status === 'paid') received += p.amount;
      else if (p.status === 'overdue') overdue += p.amount;
      else pending += p.amount;
    });

    // Also check pending payments that are past due
    monthPayments.forEach(p => {
      if (p.status === 'pending' && getOverdueDays(p.dueDate) > 0) {
        overdue += p.amount;
        pending -= p.amount;
      }
    });

    return { predicted, received, pending: Math.max(0, pending), overdue };
  }, [monthPayments, getOverdueDays]);

  // Enriched student data with payment info
  const studentPayments = useMemo(() => {
    return activeStudents.map(student => {
      const payment = monthPayments.find(p => p.studentId === student.id);
      const isSessionPlan = student.plan === 'session';
      const totalSessions = getMonthSessions(student);
      const doneSessions = getDoneSessions(student.id);
      const remainingSessions = Math.max(0, totalSessions - doneSessions);
      const sessionProgress = totalSessions > 0 ? (doneSessions / totalSessions) * 100 : 0;

      let amount = student.value;
      let pendingAmount = 0;
      if (isSessionPlan) {
        amount = totalSessions * student.value;
        pendingAmount = remainingSessions * student.value;
      }

      const overdueDays = payment ? getOverdueDays(payment.dueDate) : 0;
      const effectiveStatus = payment
        ? (payment.status === 'pending' && overdueDays > 0 ? 'overdue' : payment.status)
        : 'pending';

      return {
        student,
        payment,
        isSessionPlan,
        totalSessions,
        doneSessions,
        remainingSessions,
        sessionProgress,
        amount,
        pendingAmount,
        overdueDays,
        effectiveStatus,
      };
    });
  }, [activeStudents, monthPayments, appointments]);

  const filteredStudents = useMemo(() => {
    if (filter === 'all') return studentPayments;
    return studentPayments.filter(sp => sp.effectiveStatus === filter);
  }, [studentPayments, filter]);

  const handleMarkPaid = async (paymentId: string) => {
    setProcessing(paymentId);
    try {
      await markAsPaid(paymentId);
      success('Pagamento registrado!');
    } catch { showError('Erro ao dar baixa'); }
    finally { setProcessing(null); }
  };

  const getWhatsAppChargeUrl = (student: Student, amount: number, overdueDays: number) => {
    if (!student.phone) return undefined;
    const phone = student.phone.replace(/\D/g, '');
    const month = format(currentMonth, 'MMMM/yyyy', { locale: ptBR });
    let msg = `Olá ${student.name}, seu pagamento de ${CUR(amount)} referente a ${month} está pendente.`;
    if (overdueDays > 0) {
      msg += ` O pagamento está em atraso há ${overdueDays} dia${overdueDays > 1 ? 's' : ''}.`;
    }
    msg += ' Qualquer dúvida, estou à disposição!';
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-success/20 text-success">Pago</span>;
      case 'overdue': return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">Atrasado</span>;
      default: return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-warning/20 text-warning">Pendente</span>;
    }
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

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="card-surface p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={16} className="text-primary" />
              <span className="text-xs font-bold text-muted-foreground">Receita prevista</span>
            </div>
            <p className="text-xl font-black text-foreground">{CUR(summaries.predicted)}</p>
          </div>
          <div className="card-surface p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={16} className="text-success" />
              <span className="text-xs font-bold text-muted-foreground">Recebido</span>
            </div>
            <p className="text-xl font-black text-success">{CUR(summaries.received)}</p>
          </div>
          <div className="card-surface p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className="text-warning" />
              <span className="text-xs font-bold text-muted-foreground">Pendente</span>
            </div>
            <p className="text-xl font-black text-warning">{CUR(summaries.pending)}</p>
          </div>
          <div className="card-surface p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-destructive" />
              <span className="text-xs font-bold text-muted-foreground">Atrasado</span>
            </div>
            <p className="text-xl font-black text-destructive">{CUR(summaries.overdue)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-1 mb-4">
          {([
            { id: 'all' as FilterStatus, label: 'Todos' },
            { id: 'pending' as FilterStatus, label: 'Pendentes' },
            { id: 'paid' as FilterStatus, label: 'Pagos' },
            { id: 'overdue' as FilterStatus, label: 'Atrasados' },
          ]).map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${filter === f.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Student payment list */}
        <h3 className="text-sm font-bold text-foreground mb-3">Detalhamento por aluno</h3>
        {loading ? (
          <div className="flex justify-center py-10"><div className="spinner" /></div>
        ) : (
          <div className="space-y-2">
            {filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Filter size={32} className="text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum aluno neste filtro</p>
              </div>
            ) : (
              filteredStudents.map(({ student, payment, isSessionPlan, totalSessions, doneSessions, remainingSessions, sessionProgress, amount, pendingAmount, overdueDays, effectiveStatus }) => {
                const whatsAppUrl = getWhatsAppChargeUrl(student, isSessionPlan ? pendingAmount : amount, overdueDays);
                const isPaid = effectiveStatus === 'paid';

                return (
                  <div key={student.id} className={`card-surface p-4 ${isPaid ? 'opacity-70' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold text-foreground">{student.name}</p>
                          {statusBadge(effectiveStatus)}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            {isSessionPlan ? `${doneSessions}/${totalSessions} sessões` : 'Mensal'}
                          </span>
                          {!isSessionPlan && payment && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock size={10} /> Vence {format(new Date(payment.dueDate + 'T00:00:00'), 'dd/MM')}
                            </span>
                          )}
                          {overdueDays > 0 && effectiveStatus !== 'paid' && (
                            <span className="text-[10px] font-bold text-destructive flex items-center gap-0.5">
                              <AlertTriangle size={10} /> {overdueDays} dia{overdueDays > 1 ? 's' : ''} de atraso
                            </span>
                          )}
                        </div>

                        {/* Session progress bar */}
                        {isSessionPlan && totalSessions > 0 && (
                          <div className="mt-2">
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(sessionProgress, 100)}%` }} />
                            </div>
                            <div className="flex justify-between mt-0.5">
                              <p className="text-[10px] text-muted-foreground">
                                {doneSessions} concluída{doneSessions !== 1 ? 's' : ''}
                              </p>
                              {remainingSessions > 0 && (
                                <p className="text-[10px] text-warning font-bold">
                                  {remainingSessions} restante{remainingSessions > 1 ? 's' : ''} · {CUR(pendingAmount)}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0 ml-3">
                        <p className="text-sm font-bold text-foreground">{CUR(amount)}</p>

                        <div className="flex gap-1">
                          {/* Mark as paid button */}
                          {payment && effectiveStatus !== 'paid' && (
                            <button
                              onClick={() => handleMarkPaid(payment.id)}
                              disabled={processing === payment.id}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-success/10 text-success hover:bg-success/20 transition-all"
                            >
                              <CheckCircle2 size={12} />
                              {processing === payment.id ? '...' : 'Baixa'}
                            </button>
                          )}

                          {/* WhatsApp charge */}
                          {whatsAppUrl && effectiveStatus !== 'paid' && (
                            <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-all">
                              <MessageCircle size={12} /> Cobrar
                            </a>
                          )}
                        </div>

                        {isPaid && payment?.paidAt && (
                          <span className="text-[10px] text-success">
                            Pago em {format(new Date(payment.paidAt), 'dd/MM')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </FeatureGate>
  );
};

export default Finance;
