import React, { useState, useRef, useMemo } from 'react';
import { Camera, Plus, TrendingUp, ChevronDown, X, User, CalendarDays, Pencil, BarChart3, ArrowUp, ArrowDown, Minus, Upload } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import FeatureGate from '../components/FeatureGate';
import { usePermissions } from '../hooks/usePermissions';
import { useStudents } from '../hooks/useStudents';
import { useEvolution } from '../hooks/useEvolution';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bioimpedance } from '../types';

function DeltaIndicator({ current, previous, inverse = false }: { current: number; previous: number; inverse?: boolean }) {
  const diff = current - previous;
  if (Math.abs(diff) < 0.01) return <Minus size={10} className="text-muted-foreground" />;
  const isGood = inverse ? diff < 0 : diff > 0;
  return (
    <span className={`flex items-center gap-0.5 text-[10px] font-bold ${isGood ? 'text-success' : 'text-destructive'}`}>
      {diff > 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
      {Math.abs(diff).toFixed(1)}
    </span>
  );
}

const Evolution: React.FC = () => {
  const { canAccessEvolution } = usePermissions();
  const { students } = useStudents();
  const { photos, bioimpedance, measurements, addPhoto, addBioimpedance, addMeasurement, deletePhoto, deleteBioimpedance, deleteMeasurement } = useEvolution();
  const [activeTab, setActiveTab] = useState<'photos' | 'bioimpedance' | 'measurements' | 'charts'>('photos');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showBioModal, setShowBioModal] = useState(false);
  const [showMeasModal, setShowMeasModal] = useState(false);
  const [photoDate, setPhotoDate] = useState('');
  const [saving, setSaving] = useState(false);

  const frontRef = useRef<HTMLInputElement>(null);
  const sideRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const bioImageRef = useRef<HTMLInputElement>(null);

  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [sideFile, setSideFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [bioImageFile, setBioImageFile] = useState<File | null>(null);

  const [bioDate, setBioDate] = useState('');
  const [bioData, setBioData] = useState({ weight: 0, bodyFatPct: 0, bodyFatKg: 0, muscleMass: 0, visceralFat: 0, leanMass: 0, musclePct: 0 });
  const [measDate, setMeasDate] = useState('');
  const [measWeight, setMeasWeight] = useState(0);
  const [measHeight, setMeasHeight] = useState(0);
  const [measData, setMeasData] = useState({ chest: 0, waist: 0, hip: 0, arm: 0, thigh: 0, calf: 0 });
  const [sfData, setSfData] = useState({ triceps: 0, biceps: 0, subscapular: 0, suprailiac: 0, abdominal: 0 });

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const filteredPhotos = selectedStudentId ? photos.filter(p => p.studentId === selectedStudentId) : photos;
  const filteredBio = selectedStudentId ? bioimpedance.filter(b => b.studentId === selectedStudentId) : bioimpedance;
  const filteredMeas = selectedStudentId ? measurements.filter(m => m.studentId === selectedStudentId) : measurements;

  // Last bio for comparison
  const lastBio: Bioimpedance | undefined = filteredBio.length > 0 ? filteredBio[filteredBio.length - 1] : undefined;

  // Chart data
  const bioChartData = useMemo(() => {
    return filteredBio.map(b => ({
      date: format(b.date, 'dd/MM'),
      Peso: b.data.weight,
      'Gordura %': b.data.bodyFatPct,
      'Massa Muscular': b.data.muscleMass,
      'Massa Magra': b.data.leanMass,
    }));
  }, [filteredBio]);

  // Written evolution summary
  const evolutionSummary = useMemo(() => {
    if (filteredBio.length < 2) return null;
    const first = filteredBio[0];
    const last = filteredBio[filteredBio.length - 1];
    const weightDiff = last.data.weight - first.data.weight;
    const fatDiff = last.data.bodyFatKg - first.data.bodyFatKg;
    const muscleDiff = last.data.muscleMass - first.data.muscleMass;
    return { weightDiff, fatDiff, muscleDiff, sessions: filteredBio.length };
  }, [filteredBio]);

  const handleSavePhoto = async () => {
    if (!selectedStudentId || !photoDate) return;
    setSaving(true);
    try {
      await addPhoto({ studentId: selectedStudentId, date: photoDate, frontFile: frontFile || undefined, sideFile: sideFile || undefined, backFile: backFile || undefined });
      setShowPhotoModal(false);
      setFrontFile(null); setSideFile(null); setBackFile(null); setPhotoDate('');
    } catch {} finally { setSaving(false); }
  };

  const handleSaveBio = async () => {
    if (!selectedStudentId || !bioDate) return;
    setSaving(true);
    try {
      await addBioimpedance({ studentId: selectedStudentId, date: bioDate, data: bioData, imageFile: bioImageFile || undefined });
      setShowBioModal(false);
      setBioData({ weight: 0, bodyFatPct: 0, bodyFatKg: 0, muscleMass: 0, visceralFat: 0, leanMass: 0, musclePct: 0 });
      setBioImageFile(null);
    } catch {} finally { setSaving(false); }
  };

  const handleSaveMeas = async () => {
    if (!selectedStudentId || !measDate) return;
    setSaving(true);
    try {
      await addMeasurement({ studentId: selectedStudentId, date: measDate, weight: measWeight, height: measHeight, measurements: measData, skinfolds: sfData });
      setShowMeasModal(false);
    } catch {} finally { setSaving(false); }
  };

  const tabs = [
    { id: 'photos' as const, label: 'Fotos', icon: Camera },
    { id: 'bioimpedance' as const, label: 'Bio', icon: TrendingUp },
    { id: 'measurements' as const, label: 'Medidas', icon: Pencil },
    { id: 'charts' as const, label: 'Gráficos', icon: BarChart3 },
  ];

  return (
    <FeatureGate allowed={canAccessEvolution} title="Módulo de Evolução" description="Acompanhe a evolução dos seus alunos com fotos, bioimpedância e medidas corporais.">
      <div className="px-4 py-4">
        {/* Student selector */}
        <div className="relative group mb-8 lg:mb-12" data-stagger-index="1">
          <div className="rounded-[2px] bg-gradient-to-br from-card/95 via-card to-card/90 backdrop-blur-xl border border-border/50 shadow-2xl p-6 lg:p-8 hover-spring hover:shadow-3xl hover:-translate-y-2 transition-all duration-700 overflow-hidden hover:z-20">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 -skew-x-3 -translate-x-4 group-hover:translate-x-0 transition-transform duration-1000" />
            <button onClick={() => setShowStudentDropdown(!showStudentDropdown)} className="relative flex items-center justify-between w-full text-left">
              <div className="flex items-center gap-4 lg:gap-5">
                <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-[2px] bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center shadow-xl ring-2 ring-primary/30 group-hover:scale-110 group-hover:ring-accent/50 transition-all duration-500 hover-spring">
                  <User size={20} className="text-primary-foreground drop-shadow-md" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xl lg:text-2xl font-black tracking-[-0.04em] text-foreground leading-tight group-hover:text-accent transition-colors duration-500 drop-shadow-lg block">{selectedStudent?.name || 'Todos os alunos'}</span>
                  <span className="text-xs lg:text-sm font-bold tracking-wider text-muted-foreground/90 uppercase mt-1 block">Selector</span>
                </div>
              </div>
              <ChevronDown size={20} className="text-muted-foreground group-hover:text-accent transition-colors duration-300 shrink-0 ml-4" strokeWidth={2.5} />
            </button>
            {showStudentDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-[2px] bg-card/98 backdrop-blur-2xl border border-border/60 shadow-2xl z-30 max-h-64 overflow-hidden lg:-left-4 lg:w-[105%] lg:-translate-x-2 lg:group-hover:translate-x-0 transition-all duration-500 hover-spring">
                <div className="py-2 px-4 border-b border-border/50">
                  <button onClick={() => { setSelectedStudentId(''); setShowStudentDropdown(false); }} className="w-full text-left px-3 py-3 text-base font-black tracking-tight text-muted-foreground hover:text-accent hover:bg-accent/10 hover-spring rounded-[1px] transition-all duration-300 block truncate">Todos os alunos</button>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {students.map((s, i) => (
                    <button key={s.id} data-stagger-index={i+2} onClick={() => { setSelectedStudentId(s.id); setShowStudentDropdown(false); }} className="w-full text-left px-3 py-3 text-lg font-black tracking-[-0.02em] text-foreground hover:text-accent hover:bg-gradient-to-r hover:from-accent/10 hover:to-primary/5 hover-spring rounded-[1px] border-l-4 border-transparent hover:border-accent transition-all duration-300 block truncate hover:-translate-x-1 hover:shadow-md">
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs assimétricos */}
        <div className="relative mb-8 lg:mb-12" data-stagger-index="2">
          <div className="flex flex-col lg:flex-row gap-2 lg:gap-3 items-start lg:items-end -ml-2 lg:-ml-4 [&>*]:hover:z-20">
            {tabs.map((tab, i) => (
              <button 
                key={tab.id} 
                data-stagger-index={i+3}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative rounded-[2px] bg-card/95 backdrop-blur-sm border border-border/50 shadow-md hover:shadow-xl p-4 lg:p-5 hover-spring transition-all duration-500 font-black tracking-[-0.03em] text-sm lg:text-base uppercase leading-tight hover:-translate-y-1 hover:scale-[1.02] hover:border-accent/70 ${activeTab === tab.id ? 'bg-gradient-to-br from-primary via-accent to-primary shadow-2xl border-primary/80 text-primary-foreground ring-2 ring-primary/40 z-30 scale-[1.05] translate-y-[-4px]' : 'text-muted-foreground hover:text-accent hover:bg-accent/20'} ${i === 0 ? 'w-20 lg:w-24' : i === 1 ? 'w-28 lg:w-32 flex-1 lg:-translate-x-2 lg:mt-3' : i === 2 ? 'w-24 lg:w-28 lg:translate-x-4 lg:-mt-2' : 'w-22 lg:w-26 lg:translate-x-8'}`}
              >
                <div className="flex items-center justify-center lg:justify-start gap-2 lg:gap-3">
                  <tab.icon size={18} strokeWidth={3} className={`group-hover:scale-110 transition-transform duration-300 ${activeTab === tab.id ? 'stroke-primary-foreground' : ''}`} />
                  <span className="hidden lg:block whitespace-nowrap">{tab.label}</span>
                </div>
                {activeTab === tab.id && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-primary to-accent rounded-full shadow-lg" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Add button */}
        {selectedStudentId && activeTab !== 'charts' && (
          <div className="group relative mb-8 lg:mb-12" data-stagger-index="6">
            <button onClick={() => { if (activeTab === 'photos') setShowPhotoModal(true); else if (activeTab === 'bioimpedance') setShowBioModal(true); else setShowMeasModal(true); }}
              className="rounded-[2px] bg-gradient-to-br from-primary via-accent to-primary border border-primary/50 shadow-2xl hover:shadow-3xl hover-spring hover:-translate-y-2 hover:scale-[1.02] p-6 lg:p-8 transition-all duration-700 font-black tracking-[-0.03em] text-lg lg:text-xl uppercase text-primary-foreground w-full relative overflow-hidden z-10 hover:z-20">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-primary/20 -skew-x-6 -translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
              <div className="relative flex items-center justify-center gap-3">
                <Plus size={24} strokeWidth={3} className="drop-shadow-lg" />
                <span>Adicionar {activeTab === 'photos' ? 'Fotos' : activeTab === 'bioimpedance' ? 'Bioimpedância' : 'Medidas'}</span>
              </div>
            </button>
          </div>
        )}

        {/* Photos tab */}
        {activeTab === 'photos' && (
          <div className="space-y-3">
            {filteredPhotos.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-10">Nenhuma foto de evolução</p>
            ) : filteredPhotos.map(p => (
              <div key={p.id} className="card-surface p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-1"><CalendarDays size={12} />{format(p.date, "dd/MM/yyyy", { locale: ptBR })}</span>
                  <button onClick={() => deletePhoto(p.id)} className="text-destructive"><X size={16} /></button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[{ url: p.front, label: 'Frente' }, { url: p.side, label: 'Lado' }, { url: p.back, label: 'Costas' }].map(({ url, label }) => (
                    <div key={label} className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                      {url ? <img src={url} alt={label} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">{label}</div>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bioimpedance tab */}
        {activeTab === 'bioimpedance' && (
          <div className="space-y-5 lg:space-y-6 pt-2">
            {filteredBio.length === 0 ? (
              <div className="relative h-64 lg:h-72 flex flex-col items-center justify-center rounded-[2px] bg-gradient-to-br from-muted/60 to-card/90 backdrop-blur-xl border border-border/40 shadow-2xl" data-stagger-index="15">
                <TrendingUp size={56} strokeWidth={1.5} className="mx-auto mb-6 text-muted-foreground/50 rotate-12" />
                <p className="text-xl lg:text-2xl font-black tracking-[-0.05em] text-muted-foreground/80 text-center leading-tight drop-shadow-lg">Nenhum registro de bioimpedância</p>
              </div>
            ) : filteredBio.slice().reverse().map((b, idx) => {
              const prevBio = idx < filteredBio.length - 1 ? filteredBio[filteredBio.length - 2 - idx] : undefined;
              return (
                <div key={b.id} data-stagger-index={idx+16} className="group relative rounded-[2px] bg-card/95 backdrop-blur-sm border border-border/50 shadow-xl hover:shadow-3xl p-6 lg:p-8 hover-spring transition-all duration-700 z-10 hover:z-30 overflow-hidden [&:nth-child(odd)]:translate-y-4 lg:[&:nth-child(odd)]:-translate-x-6 [&:nth-child(even)]:-translate-x-3">
                  <div className="absolute top-4 right-4 z-40">
                    <button onClick={() => deleteBioimpedance(b.id)} className="p-2.5 rounded-[2px] bg-destructive/15 hover:bg-destructive/25 text-destructive hover-spring shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.1] hover:rotate-[-5deg]">
                      <X size={20} strokeWidth={2.5} />
                    </button>
                  </div>
                  <div className="flex items-start gap-4 mb-6 lg:mb-8">
                    <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-[2px] bg-gradient-to-br from-warning/30 to-primary/40 flex items-center justify-center shadow-2xl ring-2 ring-warning/40 shrink-0 mt-1 -translate-y-1">
                      <TrendingUp size={22} strokeWidth={3} className="text-warning drop-shadow-lg" />
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-xl lg:text-2xl font-black tracking-[-0.04em] text-foreground drop-shadow-2xl group-hover:text-accent transition-colors duration-500 leading-tight">{format(b.date, "dd/MM/yyyy")}</p>
                    </div>
                  </div>
                  {b.image && (
                    <div className="mb-6 lg:mb-10 rounded-[2px] overflow-hidden bg-muted/70 backdrop-blur-md shadow-2xl group/image hover-spring transition-all duration-700 cursor-pointer relative z-20 -mx-1 lg:-mx-2 h-32 lg:h-40">
                      <img src={b.image} alt="Bioimpedância" className="w-full h-full object-contain group-hover/image:scale-105 group-hover/image:rotate-1 transition-transform duration-700 will-change-transform" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-500 flex items-end p-4">
                        <span className="font-black text-primary-foreground text-base tracking-tight drop-shadow-2xl">Relatório Visual</span>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4 text-sm lg:text-base pt-2">
                    {[
                      { label: 'Peso', value: `${b.data.weight}kg`, key: 'weight', inverse: false, col: 'lg:col-span-1' },
                      { label: 'Gordura %', value: `${b.data.bodyFatPct}%`, key: 'bodyFatPct', inverse: true, col: 'lg:col-span-1 xl:col-span-2' },
                      { label: 'Massa Muscular', value: `${b.data.muscleMass}kg`, key: 'muscleMass', inverse: false, col: 'lg:col-span-1' },
                      { label: 'Gord. Visceral', value: `${b.data.visceralFat}`, key: 'visceralFat', inverse: true, col: 'xl:col-span-1' },
                    ].map((item, i) => (
                      <div key={item.key} data-stagger-index={20+i} className={`group/metric relative rounded-[2px] bg-gradient-to-br from-card/80 via-muted to-card/70 backdrop-blur-sm border border-border/40 shadow-lg hover:shadow-2xl p-4 lg:p-5 hover-spring hover:-translate-y-1.5 hover:scale-[1.02] transition-all duration-500 z-10 hover:z-20 ${item.col} ${i%2 ? '-translate-x-2 lg:-translate-x-4' : 'translate-x-1 lg:translate-x-3 translate-y-1'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <span className="text-xs lg:text-sm font-bold tracking-wider uppercase text-muted-foreground/90 block mb-1">{item.label}:</span>
                            <strong className="text-2xl lg:text-3xl font-black tracking-[-0.05em] text-foreground block drop-shadow-xl group-hover/metric:text-accent transition-colors duration-400">{item.value}</strong>
                          </div>
                          {prevBio && <DeltaIndicator current={b.data[item.key as keyof Bioimpedance['data']]} previous={prevBio.data[item.key as keyof Bioimpedance['data']]} inverse={item.inverse} />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Measurements tab */}
        {activeTab === 'measurements' && (
          <div className="space-y-5 lg:space-y-6 pt-2">
            {filteredMeas.length === 0 ? (
              <div className="relative h-64 lg:h-72 flex flex-col items-center justify-center rounded-[2px] bg-gradient-to-br from-muted/60 to-card/90 backdrop-blur-xl border border-border/40 shadow-2xl" data-stagger-index="25">
                <Pencil size={56} strokeWidth={1.5} className="mx-auto mb-6 text-muted-foreground/50 -rotate-6" />
                <p className="text-xl lg:text-2xl font-black tracking-[-0.05em] text-muted-foreground/80 text-center leading-tight drop-shadow-lg">Nenhuma medida registrada</p>
              </div>
            ) : filteredMeas.map((m, idx) => (
              <div key={m.id} data-stagger-index={idx+26} className="group relative rounded-[2px] bg-card/95 backdrop-blur-sm border border-border/50 shadow-xl hover:shadow-3xl p-6 lg:p-8 hover-spring transition-all duration-700 z-10 hover:z-30 overflow-hidden [&:nth-child(odd)]:-translate-x-5 lg:[&:nth-child(odd)]:translate-y-4 [&:nth-child(even)]:translate-x-4 lg:[&:nth-child(even)]:-translate-y-2">
                <div className="absolute top-4 right-4 z-40">
                  <button onClick={() => deleteMeasurement(m.id)} className="p-2.5 rounded-[2px] bg-destructive/15 hover:bg-destructive/25 text-destructive hover-spring shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.1] hover:rotate-5">
                    <X size={20} strokeWidth={2.5} />
                  </button>
                </div>
                <div className="flex items-start gap-4 mb-6 lg:mb-8">
                  <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-[2px] bg-gradient-to-br from-success/40 to-primary/50 flex items-center justify-center shadow-2xl ring-2 ring-success/50 shrink-0 mt-2">
                    <Pencil size={22} strokeWidth={3} className="text-success drop-shadow-lg" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xl lg:text-2xl font-black tracking-[-0.04em] text-foreground drop-shadow-2xl group-hover:text-accent transition-colors duration-500 leading-tight">{format(m.date, "dd/MM/yyyy")}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-4 text-base lg:text-lg pt-1">
                  {[
                    { label: 'Peso', value: `${m.weight}kg`, col: 'lg:col-span-1 xl:col-span-2', color: 'from-primary/20 to-accent/20' },
                    { label: 'Peito', value: `${m.measurements.chest}cm`, col: 'col-span-1', color: 'from-warning/30 to-warning/10' },
                    { label: 'Cintura', value: `${m.measurements.waist}cm`, col: 'col-span-1', color: 'from-destructive/20 to-destructive/5' },
                    { label: 'Braço', value: `${m.measurements.arm}cm`, col: 'lg:col-span-1', color: 'from-success/30 to-success/10' },
                    { label: 'Coxa', value: `${m.measurements.thigh}cm`, col: 'col-span-1 lg:col-span-2', color: 'from-accent/20 to-primary/10' },
                    { label: 'Panturrilha', value: `${m.measurements.calf}cm`, col: 'col-span-1', color: 'from-muted/40 to-border/20' },
                  ].map((item, i) => (
                    <div key={item.label} data-stagger-index={30+i} className={`group/metric relative rounded-[2px] bg-gradient-to-br ${item.color} backdrop-blur-sm border border-border/30 shadow-lg hover:shadow-2xl p-4 lg:p-5 hover-spring hover:-translate-y-2 hover:scale-[1.03] transition-all duration-500 z-10 hover:z-20 ${item.col} ${i%2 ? 'translate-y-2 lg:translate-y-4 -translate-x-3' : '-translate-x-1 lg:-translate-x-2'}`}>
                      <div className="flex flex-col items-center text-center h-full justify-center">
                        <span className="text-xs lg:text-sm font-bold tracking-wider uppercase text-muted-foreground/90 block mb-2 px-1">{item.label}</span>
                        <strong className="text-2xl lg:text-3xl font-black tracking-[-0.06em] text-foreground block drop-shadow-2xl group-hover/metric:text-accent transition-colors duration-500 leading-none">{item.value}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Charts tab */}
        {activeTab === 'charts' && (
          <div className="space-y-4">
            {!selectedStudentId ? (
              <p className="text-center text-sm text-muted-foreground py-10">Selecione um aluno para ver os gráficos</p>
            ) : bioChartData.length < 2 ? (
              <p className="text-center text-sm text-muted-foreground py-10">São necessários pelo menos 2 registros de bioimpedância</p>
            ) : (
              <>
                {/* Written summary */}
                {evolutionSummary && (
                  <div className="card-surface p-4">
                    <h4 className="text-xs font-bold text-muted-foreground mb-2">EVOLUÇÃO GERAL ({evolutionSummary.sessions} avaliações)</h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-foreground">
                        Peso: <strong className={evolutionSummary.weightDiff > 0 ? 'text-warning' : 'text-success'}>{evolutionSummary.weightDiff > 0 ? '+' : ''}{evolutionSummary.weightDiff.toFixed(1)}kg</strong>
                      </p>
                      <p className="text-foreground">
                        Gordura: <strong className={evolutionSummary.fatDiff > 0 ? 'text-destructive' : 'text-success'}>{evolutionSummary.fatDiff > 0 ? '+' : ''}{evolutionSummary.fatDiff.toFixed(1)}kg</strong>
                      </p>
                      <p className="text-foreground">
                        Massa Muscular: <strong className={evolutionSummary.muscleDiff > 0 ? 'text-success' : 'text-destructive'}>{evolutionSummary.muscleDiff > 0 ? '+' : ''}{evolutionSummary.muscleDiff.toFixed(1)}kg</strong>
                      </p>
                    </div>
                  </div>
                )}

                {/* Weight & Muscle chart */}
                <div className="card-surface p-4">
                  <h4 className="text-xs font-bold text-muted-foreground mb-3">PESO E MASSA MUSCULAR</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={bioChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line type="monotone" dataKey="Peso" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="Massa Muscular" stroke="hsl(var(--success))" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Body fat chart */}
                <div className="card-surface p-4">
                  <h4 className="text-xs font-bold text-muted-foreground mb-3">% GORDURA CORPORAL</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={bioChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                      <Line type="monotone" dataKey="Gordura %" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        )}

        {/* Photo modal - Brutal redesign */}
        {showPhotoModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/60 backdrop-blur-sm">
            <div className="group relative w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden rounded-[2px] bg-gradient-to-br from-card/98 via-card to-card/95 backdrop-blur-3xl border border-border/70 shadow-2xl hover:shadow-4xl hover-spring hover:-translate-y-1 transition-all duration-700" data-stagger-index="45">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/3 via-transparent to-accent/3 -skew-x-2 -translate-x-12 group-hover:translate-x-0 transition-transform duration-1200" />
              <div className="p-8 lg:p-10 relative z-10">
                <div className="flex items-start justify-between mb-8 lg:mb-12">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-[2px] bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center shadow-2xl ring-3 ring-primary/40">
                      <Camera size={24} strokeWidth={3} className="text-primary-foreground drop-shadow-lg" />
                    </div>
                    <div>
                      <h3 className="text-2xl lg:text-3xl font-black tracking-[-0.05em] text-foreground drop-shadow-2xl leading-tight">Adicionar Fotos</h3>
                      <p className="text-sm font-bold tracking-wider text-muted-foreground/90 uppercase mt-1">Progresso Visual</p>
                    </div>
                  </div>
                  <button onClick={() => setShowPhotoModal(false)} className="group/close p-3 rounded-[2px] bg-destructive/10 hover:bg-destructive/20 text-destructive hover-spring shadow-lg hover:shadow-xl transition-all duration-400 hover:scale-110 hover:rotate-90 shrink-0 ml-4">
                    <X size={22} strokeWidth={2.5} />
                  </button>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-black tracking-widest uppercase text-muted-foreground/80 mb-3">Data da Avaliação</label>
                    <input type="date" value={photoDate} onChange={e => setPhotoDate(e.target.value)} className="w-full rounded-[2px] bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg hover:shadow-xl hover:border-accent/60 focus:border-accent focus:shadow-2xl focus:outline-none p-4 lg:p-5 text-lg font-bold tracking-tight transition-all duration-500 hover-spring" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 lg:gap-6">
                    {[
                      { ref: frontRef, file: frontFile, set: setFrontFile, label: 'Frente', pos: 'col-span-1 row-span-2 lg:-translate-x-2' },
                      { ref: sideRef, file: sideFile, set: setSideFile, label: 'Lado', pos: 'col-span-2 row-span-1 lg:translate-y-3 z-10' },
                      { ref: backRef, file: backFile, set: setBackFile, label: 'Costas', pos: 'col-span-1 row-span-1 lg:translate-y-6 -translate-x-1' }
                    ].map(({ ref, file, set, label, pos }, i) => (
                      <div key={label} className={`group/upload relative ${pos}`}>
                        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => set(e.target.files?.[0] || null)} />
                        <button onClick={() => ref.current?.click()} className={`w-full h-32 lg:h-40 rounded-[2px] border-2 border-dashed overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-700 hover-spring group-hover/upload:scale-[1.02] relative ${file ? 'border-primary/70 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 shadow-primary/20 ring-2 ring-primary/40' : 'border-border/40 bg-gradient-to-br from-muted/30 to-card/60 hover:border-accent/50 hover:bg-accent/10 text-muted-foreground/70'}`}>
                          {file ? (
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent flex flex-col items-center justify-center text-primary-foreground font-black text-lg tracking-tight drop-shadow-2xl">
                              <span className="text-4xl mb-2">✓</span>
                              <span>Pronto</span>
                            </div>
                          ) : (
                            <>
                              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                                <Camera size={32} strokeWidth={1.5} />
                              </div>
                              <div className="relative flex flex-col items-center justify-center h-full text-center px-4">
                                <span className="text-lg lg:text-xl font-black tracking-tight mb-2 block">{label}</span>
                                <span className="text-xs uppercase tracking-wider text-muted-foreground/60">Clique para selecionar</span>
                              </div>
                            </>
                          )}
                          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-accent/20 text-accent-foreground text-xs font-black px-3 py-1 rounded-full shadow-lg whitespace-nowrap">Upload</div>
                        </button>
                      </div>
                    ))}
                  </div>
                  <button onClick={handleSavePhoto} disabled={saving || !photoDate} className="group relative w-full rounded-[2px] bg-gradient-to-r from-primary via-accent to-primary border border-primary/50 shadow-3xl hover:shadow-4xl hover-spring hover:-translate-y-2 p-6 lg:p-8 transition-all duration-700 font-black tracking-[-0.04em] text-xl lg:text-2xl uppercase text-primary-foreground overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover-spring:none z-20">
                    <div className="absolute inset-0 bg-gradient-to-r from-accent/30 to-primary/30 -skew-x-12 -translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
                    <div className="relative flex items-center justify-center gap-4">
                      {saving ? <span className="w-6 h-6 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Plus size={28} strokeWidth={3} className="drop-shadow-2xl" />}
                      <span>{saving ? 'Enviando...' : 'Salvar Fotos'}</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bio modal */}
        {showBioModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40">
            <div className="card-surface w-full max-w-md mx-4 p-6 rounded-t-2xl sm:rounded-2xl animate-fade-in-up max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">Bioimpedância</h3>
                <button onClick={() => setShowBioModal(false)} className="text-muted-foreground"><X size={20} /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Data</label>
                  <input type="date" value={bioDate} onChange={e => setBioDate(e.target.value)} className="input-field" />
                </div>

                {/* Photo upload */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Foto do exame</label>
                  <input ref={bioImageRef} type="file" accept="image/*" className="hidden" onChange={e => setBioImageFile(e.target.files?.[0] || null)} />
                  <button onClick={() => bioImageRef.current?.click()}
                    className={`w-full py-3 rounded-lg border-2 border-dashed flex items-center justify-center gap-2 text-sm transition-all ${bioImageFile ? 'border-primary bg-accent-light text-primary' : 'border-border text-muted-foreground'}`}>
                    <Upload size={16} />{bioImageFile ? bioImageFile.name : 'Anexar foto'}
                  </button>
                </div>

                {/* Comparison with last */}
                {lastBio && (
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-[10px] font-bold text-muted-foreground mb-1">ÚLTIMO REGISTRO ({format(lastBio.date, 'dd/MM/yyyy')})</p>
                    <div className="grid grid-cols-2 gap-1 text-[11px]">
                      <span>Peso: {lastBio.data.weight}kg</span>
                      <span>Gordura: {lastBio.data.bodyFatPct}%</span>
                      <span>M. Muscular: {lastBio.data.muscleMass}kg</span>
                      <span>G. Visceral: {lastBio.data.visceralFat}</span>
                    </div>
                  </div>
                )}

                {[
                  { key: 'weight', label: 'Peso (kg)' },
                  { key: 'bodyFatPct', label: '% Gordura' },
                  { key: 'bodyFatKg', label: 'Gordura (kg)' },
                  { key: 'muscleMass', label: 'Massa Muscular (kg)' },
                  { key: 'visceralFat', label: 'Gordura Visceral' },
                  { key: 'leanMass', label: 'Massa Magra (kg)' },
                  { key: 'musclePct', label: '% Músculo' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-xs font-bold text-muted-foreground mb-1 block">{label}</label>
                    <input type="number" step="0.1" value={(bioData as any)[key]} onChange={e => setBioData({ ...bioData, [key]: Number(e.target.value) })} className="input-field" />
                  </div>
                ))}
                <button onClick={handleSaveBio} disabled={saving} className="btn btn-primary w-full py-3 text-sm font-bold">
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Measurements modal */}
        {showMeasModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40">
            <div className="card-surface w-full max-w-md mx-4 p-6 rounded-t-2xl sm:rounded-2xl animate-fade-in-up max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">Medidas Corporais</h3>
                <button onClick={() => setShowMeasModal(false)} className="text-muted-foreground"><X size={20} /></button>
              </div>
              <div className="space-y-3">
                <input type="date" value={measDate} onChange={e => setMeasDate(e.target.value)} className="input-field" />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground mb-1 block">Peso (kg)</label>
                    <input type="number" step="0.1" value={measWeight} onChange={e => setMeasWeight(Number(e.target.value))} className="input-field" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground mb-1 block">Altura (cm)</label>
                    <input type="number" step="0.1" value={measHeight} onChange={e => setMeasHeight(Number(e.target.value))} className="input-field" />
                  </div>
                </div>
                <p className="text-xs font-bold text-muted-foreground mt-2">Circunferências (cm)</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(measData).map(([key, val]) => (
                    <div key={key}>
                      <label className="text-[10px] font-bold text-muted-foreground capitalize">{key === 'chest' ? 'Peito' : key === 'waist' ? 'Cintura' : key === 'hip' ? 'Quadril' : key === 'arm' ? 'Braço' : key === 'thigh' ? 'Coxa' : 'Panturrilha'}</label>
                      <input type="number" step="0.1" value={val} onChange={e => setMeasData({ ...measData, [key]: Number(e.target.value) })} className="input-field py-2" />
                    </div>
                  ))}
                </div>
                <p className="text-xs font-bold text-muted-foreground mt-2">Dobras cutâneas (mm)</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(sfData).map(([key, val]) => (
                    <div key={key}>
                      <label className="text-[10px] font-bold text-muted-foreground capitalize">{key === 'triceps' ? 'Tríceps' : key === 'biceps' ? 'Bíceps' : key === 'subscapular' ? 'Subescapular' : key === 'suprailiac' ? 'Suprailíaca' : 'Abdominal'}</label>
                      <input type="number" step="0.1" value={val} onChange={e => setSfData({ ...sfData, [key]: Number(e.target.value) })} className="input-field py-2" />
                    </div>
                  ))}
                </div>
                <button onClick={handleSaveMeas} disabled={saving} className="btn btn-primary w-full py-3 text-sm font-bold">
                  {saving ? 'Salvando...' : 'Salvar medidas'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </FeatureGate>
  );
};

export default Evolution;
