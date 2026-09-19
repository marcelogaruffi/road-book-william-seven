// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Route as AuthedRoute } from "./route";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Plus, ExternalLink, Pencil, Trash2, Copy, Calendar, MapPin, 
  MoreVertical, BookOpen, MapPinned, Bus, ChevronRight, AlertCircle, Wrench, Settings2, ShieldAlert
} from "lucide-react";
import { toast } from "sonner";
import { DuplicateRoadbookDialog } from "@/components/DuplicateRoadbookDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

type Roadbook = {
  id: string;
  slug: string;
  espetaculo: string;
  cidade: string;
  estado: string | null;
  festival: string | null;
  data_inicial: string | null;
  data_final: string | null;
  tour_id: string | null;
  automacoes?: any;
  programacao?: any[];
};

type Tour = { id: string; slug: string; nome: string; espetaculo: string | null };

export const Route = createFileRoute("/_authenticated/viagens")({
  head: () => ({ meta: [{ title: "Viagens - Seven Produções Artísticas" }] }),
  component: Viagens,
});

function Viagens() {
  const [items, setItems] = useState<Roadbook[]>([]);
  const [logosEspetaculos, setLogosEspetaculos] = useState<Record<string, string>>({});
  
  const fmtDate = (d?: string | null) => {
    if (!d) return "";
    const [y, m, day] = d.split('-');
    if (day) return `${day}/${m}/${y}`;
    return d;
  };

  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile, isSimulating } = AuthedRoute.useRouteContext();
  const [dup, setDup] = useState<Roadbook | null>(null);
  const [escalasPendentes, setEscalasPendentes] = useState<number>(0);

  const isAdminRole = profile ? ['admin', 'dev', 'produtor', 'assistente_producao', 'tour_manager'].includes(profile.role) : false;
  const showAll = isAdminRole;

  async function load() {
    setLoading(true);
      const [{ data: rb, error: e1 }, { data: tr, error: e2 }, { data: evts }, { data: esc }, { data: tempRes }] = await Promise.all([
      supabase.from("roadbooks").select("id,slug,espetaculo,cidade,estado,festival,data_inicial,data_final,tour_id,evento_id,programacao,automacoes").order("data_inicial", { ascending: true }),
      supabase.from("tours").select("id,slug,nome,espetaculo").order("created_at", { ascending: false }),
      (profile && !showAll) || isSimulating ? supabase.from("eventos").select("id, equipe") : Promise.resolve({ data: [] }),
      profile ? supabase.from("evento_escalas").select("evento_id, status").eq("usuario_id", profile.id) : Promise.resolve({ data: [] }),
      supabase.from("templates_espetaculos").select("nome_espetaculo, logo_espetaculo_url").neq("nome_espetaculo", "ESTOQUE_GLOBAL")
    ]);
    
    let roadbooksFinal = rb as Roadbook[] || [];
    if (profile && !showAll) {
       roadbooksFinal = roadbooksFinal.filter(r => {
         const eId = (r as any).evento_id;
         if (!eId) return false;
         
         const isAceita = esc?.some(e => String(e.evento_id) === String(eId) && String(e.status).toLowerCase().includes('aceit'));
         if (isAceita) return true;

         const evt = evts?.find(e => String(e.id) === String(eId));
         const isInEquipe = evt?.equipe && Array.isArray(evt.equipe) && evt.equipe.includes(profile.id);
         return isInEquipe;
       });
    }

    if (e1) toast.error(e1.message);
    if (e2) toast.error(e2.message);
    setItems(roadbooksFinal);
    setTours((tr as Tour[]) ?? []);
    if (tempRes) {
      const logos: Record<string, string> = {};
      tempRes.forEach(t => {
        if (t.logo_espetaculo_url) logos[t.nome_espetaculo] = t.logo_espetaculo_url;
      });
      setLogosEspetaculos(logos);
    }
    setEscalasPendentes(esc?.filter(e => e.status === 'pendente').length || 0);
    setLoading(false);
  }

  useEffect(() => { load(); }, [showAll, profile?.id, isSimulating]);

  const [deleteRbId, setDeleteRbId] = useState<string | null>(null);
  
  async function onDelete(id: string) {
    const { error } = await supabase.from("roadbooks").delete().eq("id", id);
    if (error) toast.error(getErrorMessage(error)); else { toast.success("Excluído"); load(); }
    setDeleteRbId(null);
  }

  const [deleteTourId, setDeleteTourId] = useState<string | null>(null);

  async function onDeleteTour(id: string) {
    const { error } = await supabase.from("tours").delete().eq("id", id);
    if (error) toast.error(getErrorMessage(error)); else { toast.success("Excluída"); load(); }
    setDeleteTourId(null);
  }

  const getGradient = (index: number) => {
    const gradients = [
      "from-blue-500/20 to-cyan-500/20",
      "from-purple-500/20 to-pink-500/20",
      "from-orange-500/20 to-amber-500/20",
      "from-emerald-500/20 to-teal-500/20",
      "from-rose-500/20 to-red-500/20"
    ];
    return gradients[index % gradients.length];
  };
  
  const getIconColor = (index: number) => {
    const colors = [
      "text-blue-500 bg-blue-500/10",
      "text-purple-500 bg-purple-500/10",
      "text-orange-500 bg-orange-500/10",
      "text-emerald-500 bg-emerald-500/10",
      "text-rose-500 bg-rose-500/10"
    ];
    return colors[index % colors.length];
  };

  const safeTime = (t: string | null | undefined, def: string) => (t || def).substring(0, 5) + ":00-03:00";

  const getRoadbookStartDateTime = (rb: Roadbook): Date => {
    if (rb.programacao && Array.isArray(rb.programacao) && rb.programacao.length > 0) {
      const progs = [...rb.programacao].sort((a, b) => new Date(`${a.data}T${safeTime(a.hora_inicio || a.hora, "00:00")}`).getTime() - new Date(`${b.data}T${safeTime(b.hora_inicio || b.hora, "00:00")}`).getTime());
      const firstProg = progs[0];
      return new Date(`${firstProg.data}T${safeTime(firstProg.hora_inicio || firstProg.hora, "00:00")}`);
    }
    return new Date(`${rb.data_inicial || "2000-01-01"}T00:00:00-03:00`);
  };

  const getRoadbookEndDateTime = (rb: Roadbook): Date => {
    if (rb.programacao && Array.isArray(rb.programacao) && rb.programacao.length > 0) {
      const progs = [...rb.programacao].sort((a, b) => new Date(`${a.data}T${safeTime(a.hora_inicio || a.hora, "00:00")}`).getTime() - new Date(`${b.data}T${safeTime(b.hora_inicio || b.hora, "00:00")}`).getTime());
      const lastProg = progs[progs.length - 1];
      return new Date(`${lastProg.data}T${safeTime(lastProg.hora_fim || lastProg.hora_inicio || lastProg.hora, "23:59")}`);
    }
    return new Date(`${rb.data_final || rb.data_inicial || "2000-01-01"}T23:59:59-03:00`);
  };

  const now = new Date();
  
  const eventosAtuais = items.filter(r => getRoadbookStartDateTime(r) <= now && getRoadbookEndDateTime(r) >= now).sort((a, b) => getRoadbookStartDateTime(a).getTime() - getRoadbookStartDateTime(b).getTime());
  const futuros = items.filter(r => getRoadbookStartDateTime(r) > now).sort((a, b) => getRoadbookStartDateTime(a).getTime() - getRoadbookStartDateTime(b).getTime());

  const upcomingRoadbooks = items.filter(r => getRoadbookEndDateTime(r) >= now);
  upcomingRoadbooks.sort((a, b) => getRoadbookStartDateTime(a).getTime() - getRoadbookStartDateTime(b).getTime());

  const currentCity = upcomingRoadbooks.length > 0 ? upcomingRoadbooks[0].cidade : "Sem viagem";
  const nextCity = upcomingRoadbooks.length > 1 ? upcomingRoadbooks[1].cidade : "Sem viagem";
  
  const hoje = now.toISOString().split('T')[0];
  const realizados = items.filter(r => getRoadbookEndDateTime(r) < now).sort((a, b) => getRoadbookStartDateTime(b).getTime() - getRoadbookStartDateTime(a).getTime());

  const renderRoadbookCard = (r: Roadbook, index: number) => {
    const isPast = getRoadbookEndDateTime(r) < now;
    let monthStr = '';
    let dayStr = '';
    if (r.data_inicial) {
      const dt1 = new Date(r.data_inicial + 'T12:00:00Z');
      monthStr = dt1.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      dayStr = dt1.toLocaleDateString('pt-BR', { day: '2-digit' });
      
      if (r.data_final && r.data_final !== r.data_inicial) {
        const dt2 = new Date(r.data_final + 'T12:00:00Z');
        const m2 = dt2.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
        const d2 = dt2.toLocaleDateString('pt-BR', { day: '2-digit' });
        
        if (monthStr === m2) {
          dayStr = `${dayStr} a ${d2}`;
        } else {
          dayStr = `${dayStr}/${monthStr} - ${d2}/${m2}`;
          monthStr = 'PERÍODO';
        }
      }
    }

    const logoUrl = logosEspetaculos[r.espetaculo];
    const bannerUrl = r.automacoes?.foto_capa_url || logoUrl;

    return (
      <Card key={r.id} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col relative h-full">
        {/* Banner with overlapping Date Square */}
        <div className="h-40 bg-indigo-50 dark:bg-slate-800 flex items-center justify-center relative group/banner shrink-0">
          
          <div className="absolute inset-0 overflow-hidden">
            {bannerUrl ? (
              <img 
                id={`banner-${r.id}`}
                src={bannerUrl} 
                className={`w-full h-full group-hover/banner:scale-105 transition-transform duration-500 ${r.automacoes?.capa_contain ? 'object-contain' : 'object-cover'}`} 
                style={{ objectPosition: `50% ${r.automacoes?.capa_pos_y ?? 50}%` }}
                alt="Capa" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-indigo-800 dark:text-indigo-400 font-black text-2xl opacity-40 group-hover/banner:scale-110 transition-transform">
                  {r.espetaculo?.toUpperCase() || 'ROADBOOK'}
                </span>
              </div>
            )}
          </div>

          {isAdminRole && bannerUrl && (
            <div className="absolute top-2 left-2 z-20 flex gap-2 items-center bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 opacity-0 group-hover/banner:opacity-100 transition-opacity">
              <span className="text-white text-[10px] font-bold uppercase tracking-wider">Ajustar</span>
              <input 
                type="range" 
                min="0" max="100" 
                className="w-16 h-1 accent-white cursor-pointer"
                defaultValue={r.automacoes?.capa_pos_y ?? 50} 
                onChange={(e) => {
                   const img = document.getElementById(`banner-${r.id}`);
                   if (img) img.style.objectPosition = `50% ${e.target.value}%`;
                }}
                onMouseUp={async (e) => {
                   const y = parseInt((e.target as HTMLInputElement).value);
                   const novas = { ...(r.automacoes || {}), capa_pos_y: y };
                   await supabase.from("roadbooks").update({ automacoes: novas }).eq("id", r.id);
                   toast.success("Posição salva!");
                }}
                onTouchEnd={async (e) => {
                   const y = parseInt((e.target as HTMLInputElement).value);
                   const novas = { ...(r.automacoes || {}), capa_pos_y: y };
                   await supabase.from("roadbooks").update({ automacoes: novas }).eq("id", r.id);
                   toast.success("Posição salva!");
                }}
              />
              <div className="w-px h-4 bg-white/20 mx-1"></div>
              <label className="flex items-center gap-1 cursor-pointer text-white text-[10px] font-bold uppercase tracking-wider">
                <input 
                  type="checkbox" 
                  className="accent-white cursor-pointer"
                  defaultChecked={r.automacoes?.capa_contain || false}
                  onChange={async (e) => {
                    const contain = e.target.checked;
                    const img = document.getElementById(`banner-${r.id}`);
                    if (img) {
                      img.classList.remove('object-cover', 'object-contain');
                      img.classList.add(contain ? 'object-contain' : 'object-cover');
                    }
                    const novas = { ...(r.automacoes || {}), capa_contain: contain };
                    await supabase.from("roadbooks").update({ automacoes: novas }).eq("id", r.id);
                    toast.success(contain ? "Imagem ajustada (Caber)" : "Imagem preenchida (Cortar)");
                  }}
                />
                Caber
              </label>
            </div>
          )}

          {/* Quadrado da Data Flutuante */}
          <div className="absolute -bottom-4 right-4 bg-white dark:bg-slate-900 shadow-lg rounded-xl flex flex-col items-center justify-center min-w-[3.5rem] px-3 h-16 border-2 border-slate-300 dark:border-slate-600 z-10 group-hover/banner:-translate-y-1 transition-transform">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">{monthStr}</span>
            <span className="text-lg font-black text-slate-800 dark:text-slate-100 leading-none tracking-tighter whitespace-nowrap">{dayStr}</span>
          </div>
        </div>
        <a href={profile?.role === 'motorista' ? `/versao-motorista/${r.slug}` : `/rb/${r.slug}`} target="_blank" rel="noreferrer" className="absolute inset-0 z-0"></a>

        <div className="p-4 pt-5 flex flex-col flex-1 bg-white dark:bg-slate-900/50">
          <div className="flex-1 relative z-10">
            {isAdminRole && (
              <div className="absolute -top-3 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg p-1 shadow-sm">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" asChild title="Editar">
                  <Link to="/roadbook/$id" params={{ id: r.id }}><Pencil className="size-4" /></Link>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" onClick={() => setDup(r)} title="Duplicar">
                  <Copy className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => setDeleteRbId(r.id)} title="Excluir">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            )}

            <a href={profile?.role === 'motorista' ? `/versao-motorista/${r.slug}` : `/rb/${r.slug}`} target="_blank" rel="noreferrer">
              <h4 className="text-lg font-black text-[var(--foreground)] leading-tight truncate pr-16 hover:text-indigo-600 transition-colors" title={r.cidade + (r.estado ? ' - ' + r.estado : '')}>
                {r.cidade} {r.estado ? `- ${r.estado}` : ''}
              </h4>
            </a>
            
            <p className="text-xs text-[var(--muted-foreground)] font-medium mt-1 truncate" title={r.festival || ''}>
              📍 {r.festival ? r.festival : (r.cidade + (r.estado ? ` - ${r.estado}` : ''))}
            </p>
            
            <div className="flex flex-col gap-1 mt-3 mb-2">
              <p className="text-xs text-[var(--muted-foreground)] font-medium flex items-center gap-1.5">
                <Calendar className="size-3.5 text-slate-400" /> {fmtDate(r.data_inicial)}
                {r.data_final && r.data_final !== r.data_inicial ? ` até ${fmtDate(r.data_final)}` : ''}
              </p>
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800 mt-auto relative z-10" onClick={(e) => e.stopPropagation()}>
              <div className="flex gap-2 flex-1 mr-2">
                {r.tour_id && tours.find(t => t.id === r.tour_id) && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md leading-tight line-clamp-2" title={tours.find(t => t.id === r.tour_id)?.nome || ''}>
                    {tours.find(t => t.id === r.tour_id)?.nome || ''}
                  </span>
                )}
              </div>
            
            <div className="flex gap-1">
              {profile?.role !== 'motorista' && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" asChild title="Abrir Guia">
                  <a href={`/rb/${r.slug}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" />
                  </a>
                </Button>
              )}
              {(isAdminRole || profile?.role === 'motorista') && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors" asChild title="Acessar Roteiro (Motorista)">
                  <a href={`/versao-motorista/${r.slug}`} target="_blank" rel="noreferrer">
                    <Bus className="size-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      
      {/* HEADER E STATS */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <Badge variant="outline" className="mb-3 border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400">Sistema Online</Badge>
            <h1 className="text-4xl xl:text-5xl font-black tracking-tight leading-snug pb-2 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
              {showAll ? "Todos os Guias" : "Minhas Viagens"}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base mt-2 font-medium">Gerencie suas turnês e guias de viagem.</p>
          </div>
          {showAll && (
            <Button asChild className="shadow-[0_8px_20px_rgba(var(--primary),0.2)] hover:shadow-[0_12px_25px_rgba(var(--primary),0.3)] transition-all rounded-xl px-6 h-12 bg-primary dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 font-semibold text-white">
              <Link to="/roadbook/new"><Plus className="size-5 mr-2" />Novo Guia de Viagem</Link>
            </Button>
          )}
        </div>
      </section>


      {/* EVENTO ATUAL */}
      {eventosAtuais.length > 0 && (
        <section className="space-y-6 pt-4 scroll-mt-24">
          <div className="flex items-center gap-3 px-2">
            <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">Viagem em Andamento</h2>
            <div className="h-px flex-1 bg-slate-200 dark:bg-white/10 ml-4"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
            {eventosAtuais.map(renderRoadbookCard)}
          </div>
        </section>
      )}

      {/* ROAD BOOKS - RECENTES / FUTUROS */}
      <section id="roadbooks" className="space-y-6 pt-4 scroll-mt-24">
        <div className="flex items-center gap-3 px-2">
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">Próximas Viagens</h2>
          <div className="h-px flex-1 bg-slate-200 dark:bg-white/10 ml-4"></div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : futuros.length === 0 ? (
           <Card className="p-16 text-center border-dashed border-2 border-slate-200 dark:border-white/10 bg-transparent rounded-[2rem]">
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-6">Nenhum evento próximo.</p>
            {showAll && (
              <Button asChild className="rounded-full shadow-lg h-12 px-8"><Link to="/roadbook/new"><Plus className="size-4 mr-2" />Criar o primeiro</Link></Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
            {futuros.map(renderRoadbookCard)}
          </div>
        )}
      </section>

      {/* ROAD BOOKS - REALIZADOS */}
      {realizados.length > 0 && (
        <section id="realizados" className="space-y-6 pt-4 scroll-mt-24">
          <div className="flex items-center gap-3 px-2">
            <h2 className="text-2xl font-black tracking-tight text-slate-500 dark:text-slate-400">Viagens Passadas</h2>
            <div className="h-px flex-1 bg-slate-200 dark:bg-white/10 ml-4"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
            {realizados.map(renderRoadbookCard)}
          </div>
        </section>
      )}

      {dup && (
        <DuplicateRoadbookDialog
          open={!!dup}
          onOpenChange={(v) => !v && setDup(null)}
          sourceId={dup.id}
          defaultEspetaculo={dup.espetaculo}
          defaultCidade={dup.cidade}
          onDone={load}
        />
      )}

      <Dialog open={!!deleteRbId} onOpenChange={(open) => !open && setDeleteRbId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Excluir Guia de Viagem</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Tem certeza que deseja excluir permanentemente este guia de viagem? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRbId(null)}>Cancelar</Button>
            <Button onClick={() => deleteRbId && onDelete(deleteRbId)} className="bg-red-500 hover:bg-red-600">Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTourId} onOpenChange={(open) => !open && setDeleteTourId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Turnê</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja excluir esta turnê? Os Road Books vinculados a ela serão mantidos, mas a turnê não poderá ser recuperada.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTourId(null)}>Cancelar</Button>
            <Button onClick={() => deleteTourId && onDeleteTour(deleteTourId)} className="bg-red-500 hover:bg-red-600">Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
