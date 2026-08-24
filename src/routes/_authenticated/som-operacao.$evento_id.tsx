import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Maximize, Minimize, Music, Play, SkipBack, SkipForward, Plus, Trash2, Save, X, ListMusic, ListOrdered, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/som-operacao/$evento_id')({
  head: () => ({ meta: [{ title: 'Operação de Som' }] }),
  component: SomOperacaoScreen,
});

function SomOperacaoScreen() {
  const { evento_id } = Route.useParams();
  const navigate = useNavigate();
  const [mapa, setMapa] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Operation state
  const [isOperationMode, setIsOperationMode] = useState(false);
  const [activeCueIndex, setActiveCueIndex] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [hasStarted, setHasStarted] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsed, setElapsed] = useState(0);

  const handleStart = () => {
    setHasStarted(true);
    setStartTime(Date.now());
    setElapsed(0);
  };  const resetTimer = () => {
    setStartTime(Date.now());
    setElapsed(0);
  };

  useEffect(() => {
    if (hasStarted) {
      setStartTime(Date.now());
      setElapsed(0);
    }
  }, [activeCueIndex, hasStarted, isOperationMode]);

  useEffect(() => {
    if (!isOperationMode || !hasStarted) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, hasStarted, isOperationMode]);

  function parseDurationToSeconds(dur: string) {
    if (!dur) return 0;
    const parts = dur.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  }

  function formatSecondsToTime(sec: number) {
    if (sec < 0) sec = 0;
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  useEffect(() => {
    loadData();
    
    // Permitir sair do modo operação com a tecla Esc
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOperationMode) {
        setIsOperationMode(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [evento_id, isOperationMode]);

  // Prevenir scroll do body enquanto o player estiver aberto
  useEffect(() => {
    if (isOperationMode) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOperationMode]);

  const loadData = async () => {
    try {
      const { data, error } = await supabase
        .from('mapas_som')
        .select('*')
        .eq('evento_id', evento_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) setMapa(data);
    } catch (error) {
      console.error('Erro ao carregar mapa:', error);
      toast.error('Erro ao carregar os dados.');
    } finally {
      setLoading(false);
    }
  };

  const saveCues = async (updatedCues: Cue[]) => {
    if (!mapa) return;
    setSaving(true);

    try {
      const newJsonData = {
        ...(mapa.json_data || {}),
        cues_lista: updatedCues
      };

      const { error } = await supabase
        .from('mapas_som')
        .update({ json_data: newJsonData })
        .eq('id', mapa.id);

      if (error) throw error;
      
      setMapa({ ...mapa, json_data: newJsonData });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      const jd = mapa?.json_data || {};
      await saveCues(jd.cues_lista || []);
      toast.success('Deixas salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar');
    }
  };

  const updateCue = async (id: string, field: string, value: string) => {
    if (!mapa) return;
    const jd = mapa.json_data || {};
    const cues = jd.cues_lista || [];
    const updatedCues = cues.map((cue: any) => 
      cue.id === id ? { ...cue, [field]: value } : cue
    );
    
    setMapa({ ...mapa, json_data: { ...jd, cues_lista: updatedCues } });
  };

  const addCue = async () => {
    if (!mapa) return;
    const jd = mapa.json_data || {};
    const cues = jd.cues_lista || [];
    const maxFaixa = cues.length > 0 
      ? Math.max(...cues.map((c: any) => parseInt(c.faixa) || 0)) 
      : 0;
      
    const newCue = {
      id: Math.random().toString(36).substring(2, 9),
      faixa: (maxFaixa + 1).toString().padStart(2, '0'),
      nome_faixa: 'Nova Faixa',
      deixa_prep: '',
      deixa_go: '',
      duracao: '00:00',
      cena: '',
      descricao: ''
    };
    
    const updatedCues = [...cues, newCue];
    setMapa({ ...mapa, json_data: { ...jd, cues_lista: updatedCues } });
  };

  const deleteCue = async (id: string) => {
    if (!mapa) return;
    if (!confirm('Tem certeza que deseja remover esta deixa?')) return;
    
    const jd = mapa.json_data || {};
    const cues = jd.cues_lista || [];
    const updatedCues = cues.filter((cue: any) => cue.id !== id);
    
    setMapa({ ...mapa, json_data: { ...jd, cues_lista: updatedCues } });
  };

  const moveCue = (index: number, direction: 'up' | 'down') => {
    if (!mapa) return;
    const jd = mapa.json_data || {};
    const cues = [...(jd.cues_lista || [])];
    
    if (direction === 'up' && index > 0) {
      const temp = cues[index];
      cues[index] = cues[index - 1];
      cues[index - 1] = temp;
    } else if (direction === 'down' && index < cues.length - 1) {
      const temp = cues[index];
      cues[index] = cues[index + 1];
      cues[index + 1] = temp;
    }
    
    setMapa({ ...mapa, json_data: { ...jd, cues_lista: cues } });
  };

  const renumberCues = () => {
    if (!mapa) return;
    const jd = mapa.json_data || {};
    const cues = [...(jd.cues_lista || [])];
    
    const updatedCues = cues.map((cue: any, idx: number) => ({
      ...cue,
      faixa: (idx + 1).toString().padStart(2, '0')
    }));
    
    setMapa({ ...mapa, json_data: { ...jd, cues_lista: updatedCues } });
  };

  const formatDurationMask = (value: string) => {
    const numbers = parseInt(value.replace(/\D/g, ''), 10).toString();
    if (isNaN(parseInt(numbers))) return '00:00';
    
    const padded = numbers.padStart(3, '0');
    
    if (padded.length <= 4) {
      const mins = padded.slice(0, padded.length - 2).padStart(2, '0');
      const secs = padded.slice(padded.length - 2);
      return `${mins}:${secs}`;
    }
    
    const maxLen = padded.slice(0, 6);
    const hrs = maxLen.slice(0, maxLen.length - 4);
    const mins = maxLen.slice(maxLen.length - 4, maxLen.length - 2);
    const secs = maxLen.slice(maxLen.length - 2);
    return `${hrs}:${mins}:${secs}`;
  };

  const handleDurationChange = (id: string, value: string) => {
    const formatted = formatDurationMask(value);
    updateCue(id, 'duracao', formatted);
  };

  const startOperation = () => {
    setHasStarted(false);
    setIsOperationMode(true);
  };

  const stopOperation = () => {
    setIsOperationMode(false);
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  if (!mapa) return <div className="p-8 text-center">Mapa não encontrado.</div>;

  const jd = mapa.json_data || {};
  const cues = jd.cues_lista || [];
  const currentCue = cues[activeCueIndex];
  const nextCue = cues[activeCueIndex + 1];

  const totalSeconds = parseDurationToSeconds(currentCue?.duracao || '00:00');
  const remainingSeconds = Math.max(0, totalSeconds - elapsed);
  const isOvertime = elapsed > totalSeconds && totalSeconds > 0;

  // ---------------------------------------------------------------------------
  // MODO OPERAÇÃO (ESCURO / TELA CHEIA)
  // ---------------------------------------------------------------------------
  if (isOperationMode) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0B0F19] overflow-hidden flex flex-col w-full h-screen text-left font-sans">
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 md:p-6 bg-black/40 border-b border-white/5">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={stopOperation} className="rounded-full text-slate-400 hover:text-white hover:bg-white/10">
              <X className="size-6" />
            </Button>
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <span className="text-red-600 font-bold tracking-widest text-sm md:text-base">COXIA</span>
              <span className="text-slate-500 font-normal hidden sm:inline">- {mapa.nome}</span>
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 font-medium text-lg">
              {cues.length > 0 ? `${activeCueIndex + 1} de ${cues.length}` : '0 de 0'}
            </span>
          </div>
        </div>
  
        {cues.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <h3 className="text-2xl font-bold text-slate-300">Nenhuma deixa cadastrada</h3>
            <Button onClick={stopOperation} className="mt-6 bg-slate-800 text-white">Voltar e Adicionar</Button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col w-full h-full p-3 md:p-6 space-y-4 overflow-y-auto">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 shrink-0">
              
              {/* CURRENT CUE (LEFT) */}
              <div className="bg-[#151B2B] rounded-3xl p-4 md:p-6 shadow-2xl border border-amber-500/30 flex flex-col relative">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-500 rounded-t-3xl"></div>
                
                <div className="flex justify-between items-start mb-4">
                  <div className="text-amber-500 text-xs md:text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <div className="size-2 rounded-full bg-amber-500 animate-pulse"></div> AGORA NO PALCO
                  </div>
                  {totalSeconds > 0 && (
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex items-center gap-2 md:gap-3 bg-black/40 rounded-xl px-2 py-1 md:px-3 md:py-1.5 border border-white/10">
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase">Tempo Corrido</span>
                          <span className="text-white font-mono font-bold text-xs md:text-sm">{formatSecondsToTime(elapsed)}</span>
                        </div>
                        <div className="h-6 w-px bg-white/10"></div>
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase">Falta</span>
                          <span className={`font-mono font-bold text-xs md:text-sm ${isOvertime ? 'text-red-500' : 'text-amber-400'}`}>
                            {isOvertime ? '+' : '-'}{formatSecondsToTime(isOvertime ? elapsed - totalSeconds : remainingSeconds)}
                          </span>
                        </div>
                      </div>
                      {hasStarted && (
                        <button 
                          onClick={resetTimer}
                          className="text-[9px] md:text-[10px] text-slate-500 hover:text-amber-500 uppercase flex items-center gap-1 transition-colors font-bold px-1"
                        >
                          <RotateCcw className="size-3" /> Reiniciar Tempo
                        </button>
                      )}
                    </div>
                  )}
                </div>
                  
                  <h1 className="text-xl md:text-3xl font-black text-white uppercase tracking-tight font-serif leading-none mb-3 line-clamp-2">
                    {currentCue?.nome_faixa || 'Sem Nome'}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 text-slate-400 font-medium mb-5 bg-black/20 p-2.5 rounded-xl w-fit text-xs md:text-base">
                    <span>Faixa: <strong className="text-white">{currentCue?.faixa || '-'}</strong></span>
                    <span className="opacity-50">•</span>
                    <span>Cena: <strong className="text-white">{currentCue?.cena || '-'}</strong></span>
                    <span className="opacity-50">•</span>
                    <span>Tempo: <strong className="text-white">{currentCue?.duracao || '--:--'}</strong></span>
                  </div>
  
                  <div className="flex-1 space-y-2 md:space-y-3">
                    <div className="bg-amber-950/20 border border-amber-500/20 p-3 md:p-4 rounded-xl">
                      <div className="text-amber-500/80 text-[10px] font-black uppercase tracking-widest mb-1.5">Standby (Prepara)</div>
                      <div className="text-base md:text-lg font-medium text-amber-50 leading-snug">
                        {currentCue?.deixa_prep || '-'}
                      </div>
                    </div>
                    
                    <div className="bg-emerald-950/20 border border-emerald-500/20 p-3 md:p-4 rounded-xl">
                      <div className="text-emerald-500/80 text-[10px] font-black uppercase tracking-widest mb-1.5">GO (Ação)</div>
                      <div className="text-lg md:text-xl font-black text-emerald-50 leading-snug">
                        {currentCue?.deixa_go || '-'}
                      </div>
                    </div>
                  </div>
                </div>
  
                {/* NEXT CUE (RIGHT) */}
                <div className="bg-[#121826]/60 rounded-3xl p-4 md:p-6 shadow-inner border border-white/5 flex flex-col opacity-90">
                  <div className="text-slate-500 text-xs md:text-sm font-black uppercase tracking-widest mb-4">
                    NA SEQUÊNCIA
                  </div>
                  
                  {nextCue ? (
                    <>
                      <h2 className="text-lg md:text-2xl font-bold text-slate-300 uppercase tracking-tight font-serif leading-none mb-3 line-clamp-2">
                        {nextCue.nome_faixa || 'Sem Nome'}
                      </h2>
                      
                      <div className="flex flex-wrap items-center gap-2 md:gap-3 text-slate-500 font-medium mb-5 bg-black/20 p-2.5 rounded-xl w-fit text-xs md:text-base">
                        <span>Faixa: <strong className="text-slate-300">{nextCue.faixa || '-'}</strong></span>
                        <span className="opacity-50">•</span>
                        <span>Cena: <strong className="text-slate-300">{nextCue.cena || '-'}</strong></span>
                        <span className="opacity-50">•</span>
                        <span>Tempo: <strong className="text-slate-300">{nextCue.duracao || '--:--'}</strong></span>
                      </div>
  
                      <div className="flex-1 space-y-2 md:space-y-3">
                        <div className="bg-amber-950/10 border border-amber-500/10 p-3 rounded-xl">
                          <div className="text-amber-500/60 text-[10px] font-bold uppercase tracking-widest mb-1.5">Standby (Prepara)</div>
                          <div className="text-sm md:text-base text-amber-100/70 leading-snug">
                            {nextCue.deixa_prep || '-'}
                          </div>
                        </div>
                        <div className="bg-emerald-950/10 border border-emerald-500/10 p-3 rounded-xl">
                          <div className="text-emerald-500/60 text-[10px] font-bold uppercase tracking-widest mb-1.5">GO (Ação)</div>
                          <div className="text-base md:text-lg font-bold text-emerald-100/70 leading-snug">
                            {nextCue.deixa_go || '-'}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                      <span className="text-slate-400 font-bold">Fim da Playlist</span>
                    </div>
                  )}
                </div>
              </div>
  
              {/* CONTROLS */}
              <div className="sticky bottom-0 z-50 bg-[#151B2B] rounded-3xl p-3 md:p-5 border border-white/10 flex items-center justify-between shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                <Button 
                  variant="ghost" 
                  size="lg" 
                  onClick={() => setActiveCueIndex(Math.max(0, activeCueIndex - 1))}
                  disabled={activeCueIndex === 0}
                  className="h-14 w-14 md:w-auto md:px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-white disabled:opacity-20 transition-all font-bold text-base"
                >
                  <SkipBack className="size-5 md:mr-2" /> <span className="hidden md:inline">Anterior</span>
                </Button>
                
                <div className="flex items-center gap-2 md:gap-4">
                  {!hasStarted && (
                    <div 
                      onClick={handleStart}
                      className="h-16 md:h-20 px-6 md:px-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 shadow-[0_0_30px_rgba(5,150,105,0.4)] flex items-center justify-center text-white cursor-pointer transition-all active:scale-95 group"
                    >
                      <span className="text-lg md:text-2xl font-black uppercase tracking-widest">START</span>
                    </div>
                  )}
                  
                  <div 
                    onClick={() => {
                      if (!hasStarted) handleStart();
                      setActiveCueIndex(Math.min(cues.length - 1, activeCueIndex + 1));
                    }}
                    className="h-16 md:h-20 px-10 md:px-20 rounded-2xl bg-[#991b1b] hover:bg-[#b91c1c] shadow-[0_0_30px_rgba(153,27,27,0.4)] flex items-center justify-center text-white cursor-pointer transition-all active:scale-95 group"
                  >
                    <span className="text-lg md:text-2xl font-black uppercase tracking-widest mr-3">PRÓXIMA</span>
                    <Play className="size-7 md:size-10 opacity-90 group-hover:opacity-100" />
                  </div>
                </div>

                <Button 
                  variant="ghost" 
                  size="lg" 
                  onClick={() => setActiveCueIndex(Math.min(cues.length - 1, activeCueIndex + 1))}
                  disabled={activeCueIndex === cues.length - 1}
                  className="h-14 w-14 md:w-auto md:px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-white disabled:opacity-20 transition-all font-bold text-base"
                >
                <span className="hidden md:inline">Pular</span> <SkipForward className="size-5 md:ml-2" />
              </Button>
            </div>

            {/* UPCOMING LIST (SMALL FORMAT) */}
            <div className="mt-8 bg-[#121826]/40 rounded-3xl p-6 md:p-8 border border-white/5 flex flex-col shrink-0">
              <h3 className="text-slate-400 font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-sm">
                <ListMusic className="size-4" /> Resumo da Playlist
              </h3>
              <div className="space-y-2">
                {cues.map((cue: any, idx: number) => {
                  const isPast = idx < activeCueIndex;
                  const isCurrent = idx === activeCueIndex;
                  
                  return (
                    <div 
                      key={cue.id} 
                      className={`flex items-center p-3 rounded-xl border transition-colors cursor-pointer ${
                        isCurrent 
                          ? 'bg-amber-900/30 border-amber-500/50 text-white' 
                          : isPast 
                            ? 'bg-white/5 border-transparent text-slate-600'
                            : 'bg-[#151B2B] border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-300'
                      }`}
                      onClick={() => setActiveCueIndex(idx)}
                    >
                      <div className="w-12 font-mono text-sm opacity-50">{idx + 1}</div>
                      <div className="w-20 font-bold">{cue.faixa || '-'}</div>
                      <div className="flex-1 font-bold truncate pr-4">{cue.nome_faixa || 'Sem Nome'}</div>
                      <div className="w-24 hidden md:block opacity-70 truncate">{cue.cena || '-'}</div>
                      <div className="w-16 text-right font-mono text-sm opacity-70">{cue.duracao || '--:--'}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // MODO EDIÇÃO (TELA CLARA/PADRÃO)
  // ---------------------------------------------------------------------------
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/som-operacao' })} className="rounded-full">
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Lista de Deixas (Cues)</h1>
            <p className="text-slate-500 font-medium">{mapa.espetaculo}</p>
          </div>
        </div>
        <Button onClick={startOperation} className="bg-red-600 hover:bg-red-700 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-red-600/20 text-lg group">
          <Play className="size-5 mr-3 group-hover:scale-110 transition-transform" /> Iniciar Operação
        </Button>
      </div>

      <Card className="border-0 shadow-lg dark:bg-card/80 overflow-hidden rounded-3xl">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3 opacity-90">
            <ListMusic className="size-6" />
            <h2 className="text-xl font-bold">Gerenciamento de Playlist</h2>
          </div>
          <div className="flex flex-wrap gap-2 md:gap-3">
            <Button onClick={renumberCues} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <ListOrdered className="size-4 mr-2" /> Renumerar
            </Button>
            <Button onClick={addCue} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Plus className="size-4 mr-2" /> Adicionar Deixa
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white border-0">
              <Save className="size-4 mr-2" /> {saving ? 'Salvando...' : 'Salvar Lista'}
            </Button>
          </div>
        </div>

        <CardContent className="p-6 md:p-8 space-y-6">
          {cues.length === 0 ? (
            <div className="text-center p-12 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-slate-500">
              <Music className="size-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Sua lista está vazia.</p>
              <Button onClick={addCue} className="mt-4" variant="outline">Criar Primeira Deixa</Button>
            </div>
          ) : (
            cues.map((cue: any, idx: number) => (
              <div key={cue.id} className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 shadow-sm relative">
                <div className="absolute -left-3 -top-3 size-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                  {idx + 1}
                </div>
                
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="flex flex-col gap-1 items-center justify-center pt-5">
                    <Button variant="ghost" size="icon" onClick={() => moveCue(idx, 'up')} disabled={idx === 0} className="h-6 w-6 text-slate-400 hover:text-amber-600">
                      <ChevronUp className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => moveCue(idx, 'down')} disabled={idx === cues.length - 1} className="h-6 w-6 text-slate-400 hover:text-amber-600">
                      <ChevronDown className="size-4" />
                    </Button>
                  </div>
                  <div className="w-full md:w-24">
                    <Label className="text-xs font-bold text-slate-500 mb-1 block">FAIXA N°</Label>
                    <Input value={cue.faixa} onChange={e => updateCue(cue.id, 'faixa', e.target.value)} className="font-bold text-center bg-white dark:bg-black/50" placeholder="Ex: 01" />
                  </div>
                  <div className="flex-1 w-full">
                    <Label className="text-xs font-bold text-slate-500 mb-1 block">NOME DA FAIXA</Label>
                    <Input value={cue.nome_faixa} onChange={e => updateCue(cue.id, 'nome_faixa', e.target.value)} className="font-bold bg-white dark:bg-black/50" placeholder="Título da música ou efeito" />
                  </div>
                  <div className="w-full md:w-32">
                    <Label className="text-xs font-bold text-slate-500 mb-1 block">CENA</Label>
                    <Input value={cue.cena} onChange={e => updateCue(cue.id, 'cena', e.target.value)} className="bg-white dark:bg-black/50" placeholder="Ato 1" />
                  </div>
                  <div className="w-full md:w-28">
                    <Label className="text-xs font-bold text-slate-500 mb-1 block">DURAÇÃO</Label>
                    <Input value={cue.duracao} onChange={e => updateCue(cue.id, 'duracao', formatDurationMask(e.target.value))} className="text-center bg-white dark:bg-black/50" placeholder="00:00" />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeCue(cue.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 md:mt-6">
                    <Trash2 className="size-5" />
                  </Button>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
                  <div className="flex-1">
                    <Label className="text-xs font-bold text-amber-600 dark:text-amber-500 mb-1 block">DEIXA DE PREPARAÇÃO (STANDBY)</Label>
                    <Textarea 
                      value={cue.deixa_prep} 
                      onChange={e => updateCue(cue.id, 'deixa_prep', e.target.value)} 
                      className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 min-h-[60px] resize-y" 
                      placeholder="O que acontece antes para você se preparar..." 
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs font-bold text-emerald-600 dark:text-emerald-500 mb-1 block">DEIXA DE AÇÃO (GO)</Label>
                    <Textarea 
                      value={cue.deixa_go} 
                      onChange={e => updateCue(cue.id, 'deixa_go', e.target.value)} 
                      className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 min-h-[60px] resize-y font-medium" 
                      placeholder="Sinal exato para disparar a faixa..." 
                    />
                  </div>
                </div>
              </div>
            ))
          )}
          {cues.length > 0 && (
            <div className="pt-6 flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={addCue} 
                variant="outline" 
                className="flex-1 h-14 border-dashed border-2 border-slate-300 dark:border-white/20 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:border-amber-300 dark:hover:border-amber-700 font-bold"
              >
                <Plus className="size-5 mr-2" /> Adicionar Nova Deixa (Cue)
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving} 
                className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white border-0 font-bold shadow-sm"
              >
                <Save className="size-5 mr-2" /> {saving ? 'Salvando...' : 'Salvar Lista'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
