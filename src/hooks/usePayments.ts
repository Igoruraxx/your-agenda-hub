import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format, startOfMonth, endOfMonth, differenceInDays, isBefore, startOfDay } from 'date-fns';

export interface Payment {
  id: string;
  userId: string;
  studentId: string;
  amount: number;
  dueDate: string;
  paidAt: string | null;
  status: 'pending' | 'paid' | 'overdue';
  monthRef: string;
  createdAt: string;
}

function rowToPayment(row: any): Payment {
  return {
    id: row.id,
    userId: row.user_id,
    studentId: row.student_id,
    amount: row.amount,
    dueDate: row.due_date,
    paidAt: row.paid_at,
    status: row.status,
    monthRef: row.month_ref,
    createdAt: row.created_at,
  };
}

export function usePayments() {
  const { currentUser, isAuthenticated } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async (monthRef?: string) => {
    if (!isAuthenticated || !currentUser.id) return;
    setLoading(true);

    let query = supabase
      .from('payments')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('due_date');

    if (monthRef) {
      query = query.eq('month_ref', monthRef);
    }

    const { data, error } = await query;
    if (!error && data) {
      setPayments(data.map(rowToPayment));
    }
    setLoading(false);
  }, [currentUser.id, isAuthenticated]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const createPayment = useCallback(async (payment: {
    studentId: string;
    amount: number;
    dueDate: string;
    monthRef: string;
  }) => {
    if (!currentUser.id) return;
    const { data, error } = await supabase
      .from('payments')
      .insert({
        user_id: currentUser.id,
        student_id: payment.studentId,
        amount: payment.amount,
        due_date: payment.dueDate,
        month_ref: payment.monthRef,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (data) {
      const newPayment = rowToPayment(data);
      setPayments(prev => [...prev, newPayment]);
      return newPayment;
    }
  }, [currentUser.id]);

  const markAsPaid = useCallback(async (paymentId: string) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('payments')
      .update({ status: 'paid', paid_at: now })
      .eq('id', paymentId);

    if (error) throw new Error(error.message);
    setPayments(prev => prev.map(p =>
      p.id === paymentId ? { ...p, status: 'paid' as const, paidAt: now } : p
    ));
  }, []);

  const markAsOverdue = useCallback(async (paymentId: string) => {
    const { error } = await supabase
      .from('payments')
      .update({ status: 'overdue' })
      .eq('id', paymentId);

    if (error) throw new Error(error.message);
    setPayments(prev => prev.map(p =>
      p.id === paymentId ? { ...p, status: 'overdue' as const } : p
    ));
  }, []);

  const generateMonthlyPayments = useCallback(async (
    students: { id: string; name: string; plan: string; value: number; billingDay?: number; isActive: boolean; isConsulting: boolean }[],
    monthDate: Date
  ) => {
    if (!currentUser.id) return;
    const monthRef = format(monthDate, 'yyyy-MM');
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    // Check existing payments for this month
    const { data: existing } = await supabase
      .from('payments')
      .select('student_id')
      .eq('user_id', currentUser.id)
      .eq('month_ref', monthRef);

    const existingStudentIds = new Set((existing || []).map((p: any) => p.student_id));

    const activeStudents = students.filter(s => s.isActive && !s.isConsulting);
    const toCreate = activeStudents.filter(s => !existingStudentIds.has(s.id));

    if (toCreate.length === 0) return;

    const inserts = toCreate.map(s => {
      const billingDay = Math.min(s.billingDay || 1, 28);
      const dueDate = format(new Date(year, month, billingDay), 'yyyy-MM-dd');
      return {
        user_id: currentUser.id,
        student_id: s.id,
        amount: s.value,
        due_date: dueDate,
        month_ref: monthRef,
        status: 'pending' as const,
      };
    });

    const { data, error } = await supabase
      .from('payments')
      .insert(inserts)
      .select();

    if (!error && data) {
      const newPayments = data.map(rowToPayment);
      setPayments(prev => [...prev, ...newPayments]);
    }
  }, [currentUser.id]);

  const getOverdueDays = (dueDate: string): number => {
    const due = new Date(dueDate + 'T00:00:00');
    const today = startOfDay(new Date());
    if (isBefore(today, due)) return 0;
    return differenceInDays(today, due);
  };

  return {
    payments,
    loading,
    fetchPayments,
    createPayment,
    markAsPaid,
    markAsOverdue,
    generateMonthlyPayments,
    getOverdueDays,
  };
}
