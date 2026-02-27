import React, { useState, useMemo } from 'react';
import { Plus, Search, X, Trash2, Users, MessageCircle, CalendarDays } from 'lucide-react';
import { Student } from '../types';
import { useToast } from '../hooks/useFitToast';
import { useStudents } from '../hooks/useStudents';
import { useAppointments } from '../hooks/useAppointments';
import { usePermissions } from '../hooks/usePermissions';
import { format, addDays, getDay, startOfWeek, addWeeks } from 'date-fns';

const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const DAY_MAP: Record<string, number> = { Segunda: 1, Terça: 2, Quarta: 3, Quinta: 4, Sexta: 5, Sábado: 6, Domingo: 0 };
const TIMES = Array.from({ length: 18 }, (_, i) => `${String(5 + i).padStart(2, '0')}:00`);

const Students: React.FC = () => {
  const { students, addStudent, updateStudent, deleteStudent } = useStudents();
  const { addAppointment } = useAppointments();
  const { canAddStudent } = usePermissions();
  const { success, error: showError } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [saving, setSaving] = useState(false);
  const [showAutoSchedule, setShowAutoSchedule] = useState(false);
  const [lastSavedStudent, setLastSavedStudent] = useState<Student | null>(null);
  const [creatingSchedule, setCreatingSchedule] = useState(false);

  const [formData, setFormData] = useState<Partial<Student>>({
    name: '', phone: '', plan: 'monthly', value: 0, weeklyFrequency: 1,
    selectedDays: [], selectedTimes: [], isConsulting: false, isActive: true, billingDay: 1,
  });

  const filtered = useMemo(() => {
    return students.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === 'all' || (filterStatus === 'active' ? s.isActive : !s.isActive);
      return matchSearch && matchStatus;
    });
  }, [students, searchTerm, filterStatus]);

  const resetForm = () => {
    setFormData({
      name: '', phone: '', plan: 'monthly', value: 0, weeklyFrequency: 1,
      selectedDays: [], selectedTimes: [], isConsulting: false, isActive: true, billingDay: 1,
    });
    setEditingStudent(null);
  };

  const openEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({ ...student });
    setShowForm(true);
  };

  const openNew = () => {
    if (!canAddStudent(students.length)) {
      showError('Limite de alunos atingido. Faça upgrade para Premium.');
      return;
    }
    resetForm();
    setShowForm(true);
  };

  const maxDays = formData.weeklyFrequency || 1;
  const selectedDaysCount = (formData.selectedDays || []).length;

  const toggleDay = (day: string) => {
    const days = formData.selectedDays || [];
    const times = formData.selectedTimes || [];
    if (days.includes(day)) {
      const idx = days.indexOf(day);
      setFormData({
        ...formData,
        selectedDays: days.filter((_, i) => i !== idx),
        selectedTimes: times.filter((_, i) => i !== idx),
      });
    } else {
      if (selectedDaysCount >= maxDays) {
        showError(`Máximo ${maxDays} dia${maxDays > 1 ? 's' : ''} para esta frequência`);
        return;
      }
      setFormData({
        ...formData,
        selectedDays: [...days, day],
        selectedTimes: [...times, '08:00'],
      });
    }
  };

  const setTimeForDay = (dayIdx: number, time: string) => {
    const times = [...(formData.selectedTimes || [])];
    times[dayIdx] = time;
    setFormData({ ...formData, selectedTimes: times });
  };

  const handleFrequencyChange = (freq: number) => {
    const days = formData.selectedDays || [];
    const times = formData.selectedTimes || [];
    if (days.length > freq) {
      setFormData({
        ...formData,
        weeklyFrequency: freq,
        selectedDays: days.slice(0, freq),
        selectedTimes: times.slice(0, freq),
      });
    } else {
      setFormData({ ...formData, weeklyFrequency: freq });
    }
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) { showError('Nome é obrigatório'); return; }
    setSaving(true);
    try {
      if (editingStudent) {
        await updateStudent(editingStudent.id, formData);
        success('Aluno atualizado!');
        setShowForm(false);
        resetForm();
      } else {
        const newStudent = await addStudent(formData as Omit<Student, 'id'>);
        success('Aluno adicionado!');
        setShowForm(false);

        // Offer auto-schedule if has days selected and not consulting
        if (!formData.isConsulting && (formData.selectedDays || []).length > 0 && newStudent) {
          setLastSavedStudent({ ...formData, id: newStudent.id } as Student);
          setShowAutoSchedule(true);
        }
        resetForm();
      }
    } catch {
      showError('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleAutoCreateSchedule = async () => {
    if (!lastSavedStudent) return;
    setCreatingSchedule(true);
    try {
      const today = new Date();
      const nextMonday = startOfWeek(today, { weekStartsOn: 1 });
      const startFrom = nextMonday <= today ? addWeeks(nextMonday, 0) : nextMonday;

      let count = 0;
      for (let week = 0; week < 4; week++) {
        const weekStart = addWeeks(startFrom, week);
        for (let dayIdx = 0; dayIdx < (lastSavedStudent.selectedDays || []).length; dayIdx++) {
          const dayName = lastSavedStudent.selectedDays[dayIdx];
          const time = lastSavedStudent.selectedTimes[dayIdx] || '08:00';
          const jsDay = DAY_MAP[dayName];

          // Find the date in this week for this day
          for (let d = 0; d < 7; d++) {
            const date = addDays(weekStart, d);
            if (getDay(date) === jsDay && date >= today) {
              await addAppointment({
                studentId: lastSavedStudent.id,
                studentName: lastSavedStudent.name,
                date: format(date, 'yyyy-MM-dd'),
                time,
              });
              count++;
              break;
            }
          }
        }
      }
      success(`${count} agendamentos criados para as próximas 4 semanas!`);
    } catch {
      showError('Erro ao criar agendamentos');
    } finally {
      setCreatingSchedule(false);
      setShowAutoSchedule(false);
      setLastSavedStudent(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este aluno?')) return;
    try {
      await deleteStudent(id);
      success('Aluno excluído');
    } catch {
      showError('Erro ao excluir');
    }
  };

  const getWhatsAppUrl = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '')}`;

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-primary" />
          <h1 className="text-lg font-bold text-foreground">Clientes</h1>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-accent-light text-primary">{students.length}</span>
        </div>
        <button onClick={openNew} className="btn btn-primary px-3 py-2 text-xs">
          <Plus size={14} /> Novo
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar aluno..." className="input-field pl-9 py-2.5 text-sm" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="input-field w-auto py-2.5 text-sm">
          <option value="all">Todos</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>
      </div>

      {/* Student list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users size={40} className="text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum aluno encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(student => (
            <div key={student.id}
              className={`card-surface p-4 cursor-pointer hover:shadow-md transition-shadow ${!student.isActive ? 'opacity-60' : ''}`}
              onClick={() => openEdit(student)}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground">{student.name}</p>
                    {student.isConsulting && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-warning/20 text-warning">Consultoria</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {student.plan === 'monthly' ? 'Mensal' : 'Por sessão'} · R$ {student.value.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground">{student.weeklyFrequency}x/semana</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {student.phone && (
                    <a href={getWhatsAppUrl(student.phone)} target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()} className="btn btn-ghost p-2">
                      <MessageCircle size={18} className="text-[#25D366]" />
                    </a>
                  )}
                  <button onClick={e => { e.stopPropagation(); handleDelete(student.id); }} className="btn btn-ghost p-2 text-destructive">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40">
          <div className="card-surface w-full max-w-md mx-4 p-6 rounded-t-2xl sm:rounded-2xl animate-fade-in-up max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">{editingStudent ? 'Editar aluno' : 'Novo aluno'}</h3>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-muted-foreground"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Nome</label>
                <input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="input-field" placeholder="Nome do aluno" />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Telefone</label>
                <input value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="input-field" placeholder="(99) 99999-9999" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Plano</label>
                  <select value={formData.plan} onChange={e => setFormData({ ...formData, plan: e.target.value as any })} className="input-field">
                    <option value="monthly">Mensal</option>
                    <option value="session">Por sessão</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Valor (R$)</label>
                  <input type="number" value={formData.value || 0} onChange={e => setFormData({ ...formData, value: Number(e.target.value) })} className="input-field" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                  Frequência semanal ({maxDays}x)
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <button key={n} type="button" onClick={() => handleFrequencyChange(n)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.weeklyFrequency === n ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {n}x
                    </button>
                  ))}
                </div>
              </div>

              {!formData.isConsulting && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                    Dias e horários <span className="text-primary">({selectedDaysCount}/{maxDays})</span>
                  </label>
                  <div className="space-y-2">
                    {DAYS.map(day => {
                      const isSelected = (formData.selectedDays || []).includes(day);
                      const dayIdx = (formData.selectedDays || []).indexOf(day);
                      const isDisabled = !isSelected && selectedDaysCount >= maxDays;
                      return (
                        <div key={day} className="flex items-center gap-2">
                          <button type="button" onClick={() => toggleDay(day)}
                            className={`flex-1 text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              isSelected ? 'bg-primary text-primary-foreground' : isDisabled ? 'bg-muted text-muted-foreground/40' : 'bg-muted text-muted-foreground'
                            }`}>
                            {day}
                          </button>
                          {isSelected && (
                            <select value={(formData.selectedTimes || [])[dayIdx] || '08:00'} onChange={e => setTimeForDay(dayIdx, e.target.value)} className="input-field w-24 py-2 text-sm">
                              {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={formData.isConsulting || false} onChange={e => setFormData({ ...formData, isConsulting: e.target.checked })} className="rounded" />
                  <span className="text-muted-foreground">Consultoria online</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={formData.isActive ?? true} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="rounded" />
                  <span className="text-muted-foreground">Ativo</span>
                </label>
              </div>

              {formData.plan === 'monthly' && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Dia de cobrança</label>
                  <input type="number" min={1} max={31} value={formData.billingDay || 1} onChange={e => setFormData({ ...formData, billingDay: Number(e.target.value) })} className="input-field" />
                </div>
              )}

              <button onClick={handleSave} disabled={saving} className="btn btn-primary w-full py-3 text-sm font-bold">
                {saving ? 'Salvando...' : editingStudent ? 'Salvar alterações' : 'Adicionar aluno'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-schedule modal */}
      {showAutoSchedule && lastSavedStudent && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40">
          <div className="card-surface w-full max-w-md mx-4 p-6 rounded-t-2xl sm:rounded-2xl animate-fade-in-up">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays size={20} className="text-primary" />
              <h3 className="text-lg font-bold text-foreground">Criar agendamentos</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Deseja criar agendamentos automáticos para <strong className="text-foreground">{lastSavedStudent.name}</strong> nas próximas 4 semanas?
            </p>
            <div className="text-xs text-muted-foreground mb-4 space-y-1">
              {(lastSavedStudent.selectedDays || []).map((day, i) => (
                <div key={day} className="flex items-center gap-2">
                  <span className="font-bold text-foreground">{day}</span>
                  <span>às {lastSavedStudent.selectedTimes[i] || '08:00'}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowAutoSchedule(false); setLastSavedStudent(null); }}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-muted text-muted-foreground">
                Não
              </button>
              <button onClick={handleAutoCreateSchedule} disabled={creatingSchedule}
                className="flex-1 btn btn-primary py-3 text-sm font-bold">
                {creatingSchedule ? 'Criando...' : 'Sim, criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
