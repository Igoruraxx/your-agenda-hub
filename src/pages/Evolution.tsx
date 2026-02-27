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
        <div className="relative mb-4">
          <button onClick={() => setShowStudentDropdown(!showStudentDropdown)} className="w-full flex items-center justify-between card-surface px-4 py-3">
            <div className="flex items-center gap-2">
              <User size={16} className="text-primary" />
              <span className="text-sm font-bold text-foreground">{selectedStudent?.name || 'Todos os alunos'}</span>
            </div>
            <ChevronDown size={16} className="text-muted-foreground" />
          </button>
          {showStudentDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 card-surface rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto">
              <button onClick={() => { setSelectedStudentId(''); setShowStudentDropdown(false); }} className="w-full text-left px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted">Todos os alunos</button>
              {students.map(s => (
                <button key={s.id} onClick={() => { setSelectedStudentId(s.id); setShowStudentDropdown(false); }} className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-muted">{s.name}</button>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              <tab.icon size={14} />{tab.label}
            </button>
          ))}
        </div>

        {/* Add button */}
        {selectedStudentId && activeTab !== 'charts' && (
          <button onClick={() => { if (activeTab === 'photos') setShowPhotoModal(true); else if (activeTab === 'bioimpedance') setShowBioModal(true); else setShowMeasModal(true); }}
            className="btn btn-primary w-full py-2.5 text-sm font-bold mb-4">
            <Plus size={16} /> Adicionar
          </button>
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
          <div className="space-y-3">
            {filteredBio.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-10">Nenhum registro de bioimpedância</p>
            ) : filteredBio.slice().reverse().map((b, idx) => {
              const prevBio = idx < filteredBio.length - 1 ? filteredBio[filteredBio.length - 2 - idx] : undefined;
              return (
                <div key={b.id} className="card-surface p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-muted-foreground">{format(b.date, "dd/MM/yyyy")}</span>
                    <button onClick={() => deleteBioimpedance(b.id)} className="text-destructive"><X size={16} /></button>
                  </div>
                  {b.image && (
                    <div className="mb-3 rounded-lg overflow-hidden bg-muted aspect-video">
                      <img src={b.image} alt="Bioimpedância" className="w-full h-full object-contain" />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {[
                      { label: 'Peso', value: `${b.data.weight}kg`, key: 'weight' as const, inverse: false },
                      { label: 'Gordura', value: `${b.data.bodyFatPct}%`, key: 'bodyFatPct' as const, inverse: true },
                      { label: 'Massa Muscular', value: `${b.data.muscleMass}kg`, key: 'muscleMass' as const, inverse: false },
                      { label: 'Gordura Visceral', value: `${b.data.visceralFat}`, key: 'visceralFat' as const, inverse: true },
                    ].map(item => (
                      <div key={item.key} className="bg-muted rounded-lg px-3 py-2 flex items-center justify-between">
                        <div><span className="text-muted-foreground text-xs">{item.label}:</span> <strong>{item.value}</strong></div>
                        {prevBio && <DeltaIndicator current={b.data[item.key]} previous={prevBio.data[item.key]} inverse={item.inverse} />}
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
          <div className="space-y-3">
            {filteredMeas.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-10">Nenhuma medida registrada</p>
            ) : filteredMeas.map(m => (
              <div key={m.id} className="card-surface p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-muted-foreground">{format(m.date, "dd/MM/yyyy")}</span>
                  <button onClick={() => deleteMeasurement(m.id)} className="text-destructive"><X size={16} /></button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  {[
                    { label: 'Peso', value: `${m.weight}kg` },
                    { label: 'Peito', value: `${m.measurements.chest}cm` },
                    { label: 'Cintura', value: `${m.measurements.waist}cm` },
                    { label: 'Braço', value: `${m.measurements.arm}cm` },
                    { label: 'Coxa', value: `${m.measurements.thigh}cm` },
                    { label: 'Panturrilha', value: `${m.measurements.calf}cm` },
                  ].map(item => (
                    <div key={item.label} className="bg-muted rounded-lg px-2 py-1.5 text-center">
                      <div className="text-[10px] text-muted-foreground">{item.label}</div>
                      <div className="font-bold text-foreground">{item.value}</div>
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

        {/* Photo modal */}
        {showPhotoModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40">
            <div className="card-surface w-full max-w-md mx-4 p-6 rounded-t-2xl sm:rounded-2xl animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">Adicionar fotos</h3>
                <button onClick={() => setShowPhotoModal(false)} className="text-muted-foreground"><X size={20} /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Data</label>
                  <input type="date" value={photoDate} onChange={e => setPhotoDate(e.target.value)} className="input-field" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { ref: frontRef, file: frontFile, set: setFrontFile, label: 'Frente' },
                    { ref: sideRef, file: sideFile, set: setSideFile, label: 'Lado' },
                    { ref: backRef, file: backFile, set: setBackFile, label: 'Costas' },
                  ].map(({ ref, file, set, label }) => (
                    <div key={label}>
                      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => set(e.target.files?.[0] || null)} />
                      <button onClick={() => ref.current?.click()}
                        className={`w-full aspect-[3/4] rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 text-xs transition-all ${file ? 'border-primary bg-accent-light' : 'border-border text-muted-foreground'}`}>
                        <Camera size={20} />{file ? '✓' : label}
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={handleSavePhoto} disabled={saving} className="btn btn-primary w-full py-3 text-sm font-bold">
                  {saving ? 'Enviando...' : 'Salvar fotos'}
                </button>
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
