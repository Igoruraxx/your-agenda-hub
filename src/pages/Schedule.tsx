import React, { useState, useMemo, useCallback } from 'react';
import { format, addDays, startOfWeek, isToday, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, ChevronLeft, ChevronRight, Plus, X, CheckCircle2, MessageCircle, Dumbbell, List, CalendarDays, LayoutGrid, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

// 05:00 to 22:00 = 18 slots
const TIME_SLOTS = Array.from({ length: 18 }, (_, i) => {
  const h = 5 + i;
  return `${String(h).padStart(2, '0')}:00`;
});

type ViewMode = 'day' | 'week' | 'list';

function DraggableCard({ apt, onMarkDone, onDelete, onWhatsApp }: {
  apt: Appointment;
  onMarkDone: (apt: Appointment) => void;
  onDelete: (id: string) => void;
  onWhatsApp?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: apt.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`group relative rounded-[2px] bg-card/95 backdrop-blur-sm border border-border/50 shadow-lg hover:shadow-2xl p-4 hover-spring transition-all duration-300 z-10 ${apt.sessionDone ? 'opacity-75 ring-2 ring-muted/50' : ''} ${isDragging ? 'shadow-2xl scale-[1.02] ring-4 ring-accent/30 z-20 translate-y-[-2px] parallax-drag' : ''}`}>
      <div className="flex items-center gap-2">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none p-1.5 text-muted-foreground group-hover:scale-110 group-hover:text-accent transition-all duration-200 hover-spring rounded-[1px]">
          <GripVertical size={14} strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-wider text-primary">{apt.time}</span>
            <span className="text-base font-black text-foreground truncate leading-tight">{apt.studentName}</span>
          </div>
          {apt.muscleGroups && apt.muscleGroups.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {apt.muscleGroups.map(mg => {
                const group = MUSCLE_GROUPS.find(g => g.id === mg);
                return group ? (
                  <span key={mg} className="text-[11px] rounded-[1px] bg-accent/20 text-accent px-2 py-1 font-bold shadow-sm hover:bg-accent/40 transition-all hover-spring">
                    {group.emoji} {group.label}
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          {!apt.sessionDone && (
            <button onClick={() => onMarkDone(apt)} className="p-2 rounded-[2px] hover:bg-accent/20 hover:text-accent hover-spring text-success transition-all shadow-sm">
              <CheckCircle2 size={16} strokeWidth={2.5} />
            </button>
          )}
          {onWhatsApp && (
            <a href={onWhatsApp} target="_blank" rel="noopener noreferrer" className="p-2 rounded-[2px] hover:bg-accent/20 hover:text-accent hover-spring text-success transition-all shadow-sm" onClick={e => e.stopPropagation()}>
              <MessageCircle size={16} strokeWidth={2.5} />
            </a>
          )}
          <button onClick={() => onDelete(apt.id)} className="p-2 rounded-[2px] hover:bg-destructive/10 hover:text-destructive hover-spring text-destructive transition-all shadow-sm">
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

const Schedule: React.FC = () => {
  const { appointments, addAppointment, deleteAppointment, markSessionDone, updateAppointment } = useAppointments();
  const { students } = useStudents();
  const { success, error: showError } = useToast();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDoneModal, setShowDoneModal] = useState<Appointment | null>(null);
  const [newStudentId, setNewStudentId] = useState('');
  const [newTime, setNewTime] = useState('08:00');
  const [newDate, setNewDate] = useState('');
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleGroup[]>([]);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const dayAppointments = (appointments[dateKey] || []).sort((a, b) => a.time.localeCompare(b.time));

  const weekAppointments = useMemo(() => {
    const all: (Appointment & { dateKey: string })[] = [];
    weekDays.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      (appointments[key] || []).forEach(apt => all.push({ ...apt, dateKey: key }));
    });
    return all.sort((a, b) => a.dateKey.localeCompare(b.dateKey) || a.time.localeCompare(b.time));
  }, [appointments, weekDays]);

  const handlePrevWeek = () => setWeekStart(prev => addDays(prev, -7));
  const handleNextWeek = () => setWeekStart(prev => addDays(prev, 7));

  const getStudentPhone = (studentId: string) => {
    const s = students.find(st => st.id === studentId);
    return s?.phone ? `https://wa.me/${s.phone.replace(/\D/g, '')}` : undefined;
  };

  const handleAddAppointment = async () => {
    if (!newStudentId) { showError('Selecione um aluno'); return; }
    setSaving(true);
    try {
      const student = students.find(s => s.id === newStudentId);
      const aptDate = newDate || dateKey;
      await addAppointment({ studentId: newStudentId, studentName: student?.name || '', date: aptDate, time: newTime });
      success('Agendamento criado!');
      setShowNewModal(false);
      setNewStudentId('');
      setNewDate('');
    } catch { showError('Erro ao criar agendamento'); }
    finally { setSaving(false); }
  };

  const handleMarkDone = async () => {
    if (!showDoneModal) return;
    setSaving(true);
    try {
      await markSessionDone(showDoneModal.id, selectedMuscles);
      success('Sessão concluída!');
      setShowDoneModal(null);
      setSelectedMuscles([]);
    } catch { showError('Erro ao marcar sessão'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteAppointment(id); success('Removido'); } catch { showError('Erro ao remover'); }
  };

  const openDoneModal = (apt: Appointment) => { setShowDoneModal(apt); setSelectedMuscles([]); };
  const toggleMuscle = (id: MuscleGroup) => setSelectedMuscles(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const overId = String(over.id);
    if (overId.includes('_')) {
      const [newDateStr, newTimeStr] = overId.split('_');
      try {
        await updateAppointment(String(active.id), { date: newDateStr, time: newTimeStr });
        success('Agendamento movido!');
      } catch { showError('Erro ao mover'); }
    }
  };

  const openNewModal = (date?: string, time?: string) => {
    setNewDate(date || '');
    setNewTime(time || '08:00');
    setShowNewModal(true);
  };

  // ============ DAY VIEW with grid ============
  const renderDayView = () => (
    <>
      {/* Week strip */}
      <div className="flex gap-1 mb-6 stagger-reveal">
        {weekDays.map((day, index) => {
          const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
          const isTodayDate = isToday(day);
          const dayKey = format(day, 'yyyy-MM-dd');
          const count = (appointments[dayKey] || []).length;
          return (
            <button key={day.toISOString()} onClick={() => setSelectedDate(day)}
              className={`flex-1 flex flex-col items-center py-3 px-2 rounded-[2px] transition-all duration-300 shadow-sm hover:shadow-md hover-spring font-black text-xs tracking-wider uppercase ${isSelected ? 'bg-primary text-primary-foreground shadow-primary/25' : isTodayDate ? 'bg-accent text-accent-foreground shadow-accent/25' : 'bg-card/80 text-muted-foreground hover:bg-card hover:text-foreground border border-border/50'}`}
              style={{ '--stagger-index': index } as React.CSSProperties}
            >
              <span className="text-[10px]">{format(day, 'EEE', { locale: ptBR }).slice(0, 3)}</span>
              <span className="text-xl leading-none">{format(day, 'd')}</span>
              {count > 0 && <div className={`w-2 h-2 rounded-[1px] mt-1 shadow-sm ${isSelected ? 'bg-primary-foreground' : 'bg-accent'}`} />}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black tracking-[-0.05em] leading-tight text-foreground">{format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}</h2>
        <button onClick={() => openNewModal()} className="flex items-center gap-2 px-4 py-3 rounded-[2px] bg-primary text-primary-foreground hover-spring hover:scale-[1.02] shadow-lg hover:shadow-primary/25 font-black text-sm tracking-wider uppercase transition-all duration-200 border border-primary/20">
          <Plus size={16} strokeWidth={2.5} /> Novo
        </button>
      </div>

      {/* Grid diário com slots 05-22h */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="space-y-px stagger-reveal-container pt-2">
          {TIME_SLOTS.map((time, index) => {
            const slotApts = dayAppointments.filter(a => a.time === time);
            const droppableId = `${dateKey}_${time}`;
            return (
              <div key={time} className="group stagger-item flex items-stretch border-b border-border/20 hover:border-accent/30 transition-colors bg-card/50 hover:bg-card/70 backdrop-blur-sm rounded-[2px] overflow-hidden shadow-sm hover:shadow-md hover-spring" style={{ '--stagger-index': index } as React.CSSProperties}>
                <div className="w-16 shrink-0 flex items-center justify-end pr-3 pl-1 bg-border/20">
                  <span className="text-xs font-black tracking-widest text-muted-foreground uppercase">{time}</span>
                </div>
                <DroppableSlot id={droppableId} onClick={() => slotApts.length === 0 && openNewModal(dateKey, time)}>
                  {slotApts.length > 0 ? (
                    <div className="space-y-1.5 p-2 pt-1.5 flex-1">
                      {slotApts.map(apt => (
                        <DraggableCard key={apt.id} apt={apt} onMarkDone={openDoneModal} onDelete={handleDelete} onWhatsApp={getStudentPhone(apt.studentId)} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center flex-1 py-6 text-center group-hover:text-accent transition-colors">
                      <span className="text-xs font-bold tracking-wider uppercase text-muted-foreground/70 group-hover-spring">+ agendar às {time}</span>
                    </div>
                  )}
                </DroppableSlot>
              </div>
            );
          })}
        </div>
      </DndContext>
    </>
  );

  // ============ WEEK VIEW with grid ============
  const renderWeekView = () => (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="min-w-[700px]">
          {/* Header */}
          <div className="grid grid-cols-8 gap-px mb-1 sticky top-0 bg-background z-10">
            <div className="p-1 text-[10px] font-bold text-muted-foreground">Hora</div>
            {weekDays.map(day => (
              <div key={day.toISOString()} className={`p-1 text-center rounded-lg ${isToday(day) ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}>
                <div className="text-[10px] font-bold uppercase">{format(day, 'EEE', { locale: ptBR }).slice(0, 3)}</div>
                <div className="text-sm font-bold">{format(day, 'd')}</div>
              </div>
            ))}
          </div>
          {/* Time rows */}
          {TIME_SLOTS.map(time => (
            <div key={time} className="grid grid-cols-8 gap-px">
              <div className="p-1 text-[10px] font-bold text-muted-foreground flex items-start pt-2">{time}</div>
              {weekDays.map(day => {
                const key = format(day, 'yyyy-MM-dd');
                const slotApts = (appointments[key] || []).filter(a => a.time === time);
                const droppableId = `${key}_${time}`;
                return (
                  <DroppableSlot key={droppableId} id={droppableId} onClick={() => slotApts.length === 0 && openNewModal(key, time)}>
                    {slotApts.map(apt => (
                      <div key={apt.id} className={`text-[10px] p-1 rounded mb-0.5 cursor-pointer truncate ${apt.sessionDone ? 'bg-success/20 text-success' : 'bg-primary/10 text-primary'} font-medium`}
                        onClick={() => { setSelectedDate(day); setViewMode('day'); }}>
                        {apt.studentName}
                      </div>
                    ))}
                  </DroppableSlot>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </DndContext>
  );

  // ============ LIST VIEW ============
  const renderListView = () => {
    const grouped: Record<string, Appointment[]> = {};
    weekDays.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      const apts = appointments[key] || [];
      if (apts.length > 0) grouped[key] = apts.sort((a, b) => a.time.localeCompare(b.time));
    });

    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="space-y-4">
          {Object.keys(grouped).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <List size={40} className="text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum agendamento nesta semana</p>
            </div>
          ) : (
            Object.entries(grouped).map(([key, apts]) => {
              const day = new Date(key + 'T00:00:00');
              return (
                <div key={key}>
                  <div className={`flex items-center gap-2 mb-2 px-1 ${isToday(day) ? 'text-primary' : 'text-foreground'}`}>
                    <CalendarDays size={14} />
                    <span className="text-sm font-bold capitalize">{format(day, "EEEE, dd/MM", { locale: ptBR })}</span>
                    <span className="text-xs text-muted-foreground">({apts.length})</span>
                  </div>
                  <div className="space-y-2">
                    {apts.map(apt => (
                      <DraggableCard key={apt.id} apt={apt} onMarkDone={openDoneModal} onDelete={handleDelete} onWhatsApp={getStudentPhone(apt.studentId)} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DndContext>
    );
  };

  return (
    <div className="px-4 py-4">
      {/* View mode toggle */}
      <div className="flex gap-1 mb-6">
        {([
          { id: 'day' as ViewMode, label: 'DIA', icon: CalendarDays },
          { id: 'week' as ViewMode, label: 'SEMANA', icon: LayoutGrid },
          { id: 'list' as ViewMode, label: 'LISTA', icon: List },
        ]).map(v => (
          <button key={v.id} onClick={() => setViewMode(v.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-3 rounded-[2px] font-black text-sm tracking-wider uppercase transition-all shadow-sm hover:shadow-lg hover-spring ${viewMode === v.id ? 'bg-primary text-primary-foreground shadow-primary/30 ring-2 ring-primary/40' : 'bg-card/80 text-muted-foreground hover:bg-card hover:text-foreground border border-border/50 hover:border-accent/50'}`}>
            <v.icon size={18} strokeWidth={2.5} />{v.label}
          </button>
        ))}
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={handlePrevWeek} className="btn btn-ghost p-2"><ChevronLeft size={20} /></button>
        <span className="text-sm font-bold text-foreground">
          {format(weekStart, "dd MMM", { locale: ptBR })} — {format(addDays(weekStart, 6), "dd MMM yyyy", { locale: ptBR })}
        </span>
        <button onClick={handleNextWeek} className="btn btn-ghost p-2"><ChevronRight size={20} /></button>
      </div>

      {viewMode === 'day' && renderDayView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'list' && renderListView()}

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
                <select value={newStudentId} onChange={e => setNewStudentId(e.target.value)} className="input-field">
                  <option value="">Selecione um aluno</option>
                  {students.filter(s => s.isActive && !s.isConsulting).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Data</label>
                <input type="date" value={newDate || dateKey} onChange={e => setNewDate(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Horário</label>
                <select value={newTime} onChange={e => setNewTime(e.target.value)} className="input-field">
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <button onClick={handleAddAppointment} disabled={saving} className="btn btn-primary w-full py-3 text-sm font-bold">
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
                <Dumbbell size={20} className="text-primary" /> Concluir sessão
              </h3>
              <button onClick={() => setShowDoneModal(null)} className="text-muted-foreground"><X size={20} /></button>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Selecione os grupos musculares de <strong className="text-foreground">{showDoneModal.studentName}</strong>:
            </p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {MUSCLE_GROUPS.map(mg => (
                <button key={mg.id} onClick={() => toggleMuscle(mg.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedMuscles.includes(mg.id) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent-light'}`}>
                  <span>{mg.emoji}</span>{mg.label}
                </button>
              ))}
            </div>
            <button onClick={handleMarkDone} disabled={saving || selectedMuscles.length === 0} className="btn btn-primary w-full py-3 text-sm font-bold">
              {saving ? 'Salvando...' : `Concluir (${selectedMuscles.length} grupo${selectedMuscles.length !== 1 ? 's' : ''})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Droppable slot
function DroppableSlot({ id, children, onClick }: { id: string; children: React.ReactNode; onClick?: () => void }) {
  const { setNodeRef, isOver } = useSortable({ id });
  return (
    <div ref={setNodeRef} onClick={onClick}
      className={`flex-1 min-h-[40px] border border-border/30 rounded p-0.5 transition-colors cursor-pointer ${isOver ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}`}>
      {children}
    </div>
  );
}

export default Schedule;
