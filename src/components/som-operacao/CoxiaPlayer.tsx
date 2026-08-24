import { Button } from '@/components/ui/button';
import { Play, SkipBack, SkipForward, X, ListMusic, RotateCcw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

type Cue = {
  id: string;
  faixa: string;
  nome_faixa: string;
  cena: string;
  duracao: string;
  deixa_prep: string;
  deixa_go: string;
};

interface CoxiaPlayerProps {
  cues: Cue[];
  espetaculo: string;
  onClose: () => void;
}

export function CoxiaPlayer({ cues, espetaculo, onClose }: CoxiaPlayerProps) {
  const [activeCueIndex, setActiveCueIndex] = useState(0);

  // Permitir sair do player com a tecla Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevenir scroll do body enquanto o player estiver aberto
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const [hasStarted, setHasStarted] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsed, setElapsed] = useState(0);

  const handleStart = () => {
    setHasStarted(true);
    setStartTime(Date.now());
    setElapsed(0);
  };

  const resetTimer = () => {
    setStartTime(Date.now());
    setElapsed(0);
  };

  useEffect(() => {
    if (hasStarted) {
      setStartTime(Date.now());
      setElapsed(0);
    }
  }, [activeCueIndex, hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, hasStarted]);

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

  const currentCue = cues[activeCueIndex];
  const nextCue = cues[activeCueIndex + 1];
  
  const totalSeconds = parseDurationToSeconds(currentCue?.duracao || '00:00');
  const remainingSeconds = Math.max(0, totalSeconds - elapsed);
  const isOvertime = elapsed > totalSeconds && totalSeconds > 0;

  const stopOperation = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0B0F19] overflow-hidden flex flex-col w-full h-screen text-left">
      {/* HEADER */}
      <div className="flex items-center justify-between p-4 md:p-6 bg-black/40 border-b border-white/5">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={stopOperation} className="rounded-full text-slate-400 hover:text-white hover:bg-white/10">
            <X className="size-6" />
          </Button>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <span className="text-red-600 font-bold tracking-widest text-sm md:text-base">COXIA</span>
            <span className="text-slate-500 font-normal hidden sm:inline">- {espetaculo}</span>
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
          <Button onClick={stopOperation} className="mt-6 bg-slate-800 text-white hover:bg-slate-700">Voltar</Button>
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
              {cues.map((cue: Cue, idx: number) => {
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
