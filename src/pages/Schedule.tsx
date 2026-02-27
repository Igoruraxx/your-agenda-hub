import React, { useState, useMemo } from 'react';
import { format, addDays, startOfWeek, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, ChevronLeft, ChevronRight, Plus, X, CheckCircle2, MessageCircle, Dumbbell, List } from 'lucide-react';
import { Appointment, MuscleGroup } from '../types';
import { useToast } from '../hooks/useFitToast';
import { useAppointments } from '../hooks/useAppointments';
import { useStudents } from '../hooks/useStudents';

const MUSCLE_GROUPS: { id: MuscleGroup; label: string; emoji: string }[] = [
  { id: 'peito', label: 'Peito', emoji: '🫀' },
  { id: 'costas', label: 'Costas', emoji: '🔙' },
  { id: 'ombros', label: 'Ombros', emoji: '🏋️' },
  { id: 'biceps', label: 'Bíceps', emoji: '💪' },
  { id: 'triceps', label: 'Tríceps', emoji: '🦾' },
  { id: 'quadriceps', label: 'Quadríceps', emoji: '🦵' },
  { id: 'posterior', label: 'Posterior', emoji: '🦿' },
  { id: 'gluteos', label: 'Glúteos', emoji: '🍑' },
  { id: 'panturrilha', label: 'Panturrilha', emoji: '🦶' },
  { id: 'abdomen', label: 'Abdômen', emoji: '⚡' },
  { id: 'trapezio', label: 'Trapézio', emoji: '🔺' },
  { id: 'antebraco', label: 'Antebraço', emoji: '🤜' },
  { id: 'full_body', label: 'Full Body', emoji: '🔥' },
  { id: 'cardio', label: 'Cardio', emoji: '❤️' },
];

const TIME_SLOTS = Array.from({ length: 15 }, (_, i) => {
  const h = 6 + i;
  return `${String(h).padStart(2, '0')}:00`;
});

const Schedule: React.FC = () => {
  const { appointments, addAppointment, deleteAppointment, markSessionDone } = useAppointments();
  const { students } = useStudents();
  const { success, error: showError } = useToast();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDoneModal, setShowDoneModal] = useState<Appointment | null>(null);
  const [newStudentId, setNewStudentId] = useState('');
  const [newTime, setNewTime] = useState('08:00');
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleGroup[]>([]);
  const [saving, setSaving] = useState(false);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const dayAppointments = appointments[dateKey] || [];

  const handlePrevWeek = () => setWeekStart(prev => addDays(prev, -7));
  const handleNextWeek = () => setWeekStart(prev => addDays(prev, 7));

  const handleAddAppointment = async () => {
    if (!newStudentId) { showError('Selecione um aluno'); return; }
    setSaving(true);
    try {
      const student = students.find(s => s.id === newStudentId);
      await addAppointment({
        studentId: newStudentId,
        studentName: student?.name || '',
        date: dateKey,
        time: newTime,
      });
      success('Agendamento criado!');
      setShowNewModal(false);
      setNewStudentId('');
    } catch {
      showError('Erro ao criar agendamento');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkDone = async () => {
    if (!showDoneModal) return;
    setSaving(true);
    try {
      await markSessionDone(showDoneModal.id, selectedMuscles);
      success('Sessão concluída!');
      setShowDoneModal(null);
      setSelectedMuscles([]);
    } catch {
      showError('Erro ao marcar sessão');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAppointment(id);
      success('Agendamento removido');
    } catch {
      showError('Erro ao remover');
    }
  };

  const toggleMuscle = (id: MuscleGroup) => {
    setSelectedMuscles(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  return (
    <div className="px-4 py-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={handlePrevWeek} className="btn btn-ghost p-2"><ChevronLeft size={20} /></button>
        <span className="text-sm font-bold text-foreground">
          {format(weekStart, "dd MMM", { locale: ptBR })} — {format(addDays(weekStart, 6), "dd MMM yyyy", { locale: ptBR })}
        </span>
        <button onClick={handleNextWeek} className="btn btn-ghost p-2"><ChevronRight size={20} /></button>
      </div>

      {/* Week days */}
      <div className="flex gap-1 mb-4">
        {weekDays.map(day => {
          const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
          const isTodayDate = isToday(day);
          const dayKey = format(day, 'yyyy-MM-dd');
          const count = (appointments[dayKey] || []).length;

          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-all duration-150 ${
                isSelected ? 'bg-primary text-primary-foreground' : isTodayDate ? 'bg-accent-light text-primary' : 'bg-card text-muted-foreground'
              }`}
            >
              <span className="text-[10px] font-bold uppercase">
                {format(day, 'EEE', { locale: ptBR }).slice(0, 3)}
              </span>
              <span className="text-lg font-bold">{format(day, 'd')}</span>
              {count > 0 && (
                <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-primary-foreground' : 'bg-primary'}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Day header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-foreground">
          {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </h2>
        <button
          onClick={() => setShowNewModal(true)}
          className="btn btn-primary px-3 py-2 text-xs"
        >
          <Plus size={14} /> Novo
        </button>
      </div>

      {/* Appointments list */}
      {dayAppointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <List size={40} className="text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum agendamento para este dia</p>
        </div>
      ) : (
        <div className="space-y-2">
          {dayAppointments.sort((a, b) => a.time.localeCompare(b.time)).map(apt => (
            <div key={apt.id} className={`card-surface p-4 ${apt.sessionDone ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-primary">
                    <Clock size={14} />
                    {apt.time}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{apt.studentName}</p>
                    {apt.muscleGroups && apt.muscleGroups.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {apt.muscleGroups.map(mg => {
                          const group = MUSCLE_GROUPS.find(g => g.id === mg);
                          return group ? (
                            <span key={mg} className="text-xs bg-accent-light text-primary px-1.5 py-0.5 rounded-md font-medium">
                              {group.emoji} {group.label}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  {!apt.sessionDone && (
                    <button
                      onClick={() => { setShowDoneModal(apt); setSelectedMuscles([]); }}
                      className="btn btn-ghost p-2 text-success"
                      title="Marcar como feita"
                    >
                      <CheckCircle2 size={18} />
                    </button>
                  )}
                  {apt.phone && (
                    <a
                      href={`https://wa.me/${apt.phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost p-2 text-success"
                    >
                      <MessageCircle size={18} />
                    </a>
                  )}
                  <button onClick={() => handleDelete(apt.id)} className="btn btn-ghost p-2 text-destructive">
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New appointment modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40">
          <div className="card-surface w-full max-w-md mx-4 p-6 rounded-t-2xl sm:rounded-2xl animate-fade-in-up max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">Novo agendamento</h3>
              <button onClick={() => setShowNewModal(false)} className="text-muted-foreground"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Aluno</label>
                <select
                  value={newStudentId}
                  onChange={e => setNewStudentId(e.target.value)}
                  className="input-field"
                >
                  <option value="">Selecione um aluno</option>
                  {students.filter(s => s.isActive && !s.isConsulting).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Horário</label>
                <select value={newTime} onChange={e => setNewTime(e.target.value)} className="input-field">
                  {TIME_SLOTS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleAddAppointment}
                disabled={saving}
                className="btn btn-primary w-full py-3 text-sm font-bold"
              >
                {saving ? 'Salvando...' : 'Criar agendamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark done modal */}
      {showDoneModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40">
          <div className="card-surface w-full max-w-md mx-4 p-6 rounded-t-2xl sm:rounded-2xl animate-fade-in-up max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Dumbbell size={20} className="text-primary" />
                Concluir sessão
              </h3>
              <button onClick={() => setShowDoneModal(null)} className="text-muted-foreground"><X size={20} /></button>
            </div>

            <p className="text-sm text-muted-foreground mb-3">
              Selecione os grupos musculares treinados por <strong className="text-foreground">{showDoneModal.studentName}</strong>:
            </p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {MUSCLE_GROUPS.map(mg => (
                <button
                  key={mg.id}
                  onClick={() => toggleMuscle(mg.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedMuscles.includes(mg.id)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent-light'
                  }`}
                >
                  <span>{mg.emoji}</span>
                  {mg.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleMarkDone}
              disabled={saving || selectedMuscles.length === 0}
              className="btn btn-primary w-full py-3 text-sm font-bold"
            >
              {saving ? 'Salvando...' : `Concluir (${selectedMuscles.length} grupo${selectedMuscles.length !== 1 ? 's' : ''})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
