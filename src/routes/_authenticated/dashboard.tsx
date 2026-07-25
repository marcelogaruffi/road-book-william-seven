// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Route as AuthedRoute } from "./route";
import { Card } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Plus, ExternalLink, Pencil, Trash2, Copy, Calendar, MapPin, 
  MoreVertical, BookOpen, MapPinned, Bus, ChevronRight, AlertCircle, Wrench, Settings2, ShieldAlert,
  ClipboardList, Route as RouteIcon, Banknote, Contact2, Music, Shirt, Volume2, Lightbulb, Projector, FileText, Drama, LayoutTemplate, DoorOpen, Video, Mic2
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
import { StageIcon, ClothesRackIcon, StarDoorIcon } from "@/components/CustomIcons";

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
  programacao?: any[];
};

type Tour = { id: string; slug: string; nome: string; espetaculo: string | null };

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard - Seven Produções Artísticas" }] }),
  component: Dashboard,
});

function Dashboard() {
  const [items, setItems] = useState<Roadbook[]>([]);
  
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

  async function load() {
    setLoading(true);
    const [{ data: rb, error: e1 }, { data: tr, error: e2 }, { data: evts }, { data: esc }] = await Promise.all([
      supabase.from("roadbooks").select("id,slug,espetaculo,cidade,estado,festival,data_inicial,data_final,tour_id,evento_id,programacao").order("data_inicial", { ascending: true }),
      supabase.from("tours").select("id,slug,nome,espetaculo").order("created_at", { ascending: false }),
      (profile && !['admin', 'dev', 'produtor'].includes(profile.role)) || isSimulating ? supabase.from("eventos").select("id, equipe") : Promise.resolve({ data: [] }),
      profile ? supabase.from("evento_escalas").select("evento_id, status").eq("usuario_id", profile.id) : Promise.resolve({ data: [] })
    ]);
    
    let roadbooksFinal = rb as Roadbook[] || [];
    if (profile && !['admin', 'dev', 'produtor'].includes(profile.role)) {
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
    setEscalasPendentes(esc?.filter(e => e.status === 'pendente').length || 0);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

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

  const getRoadbookStartDateTime = (rb: Roadbook): Date => {
    if (rb.programacao && Array.isArray(rb.programacao) && rb.programacao.length > 0) {
      const progs = [...rb.programacao].sort((a, b) => new Date(`${a.data}T${a.hora_inicio || a.hora || "00:00"}`).getTime() - new Date(`${b.data}T${b.hora_inicio || b.hora || "00:00"}`).getTime());
      const firstProg = progs[0];
      return new Date(`${firstProg.data}T${firstProg.hora_inicio || firstProg.hora || "00:00"}:00-03:00`);
    }
    return new Date(`${rb.data_inicial || "2000-01-01"}T00:00:00-03:00`);
  };

  const getRoadbookEndDateTime = (rb: Roadbook): Date => {
    if (rb.programacao && Array.isArray(rb.programacao) && rb.programacao.length > 0) {
      const progs = [...rb.programacao].sort((a, b) => new Date(`${a.data}T${a.hora_inicio || a.hora || "00:00"}`).getTime() - new Date(`${b.data}T${b.hora_inicio || b.hora || "00:00"}`).getTime());
      const lastProg = progs[progs.length - 1];
      return new Date(`${lastProg.data}T${lastProg.hora_fim || lastProg.hora_inicio || lastProg.hora || "23:59"}:00-03:00`);
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
  const realizados = items.filter(r => getRoadbookEndDateTime(r).getTime() < now.getTime()).sort((a, b) => getRoadbookStartDateTime(b).getTime() - getRoadbookStartDateTime(a).getTime());

  const renderRoadbookCard = (r: Roadbook, index: number) => (
    <Card key={r.id} className="p-5 flex flex-col md:flex-row md:items-center gap-5 justify-between group border-0 shadow-[0_2px_15px_rgb(0,0,0,0.02)] dark:shadow-[0_2px_15px_rgb(0,0,0,0.3)] bg-white dark:bg-card/60 dark:backdrop-blur-md dark:border dark:border-white/5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-300 rounded-[1.5rem] relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-100 dark:bg-white/5 group-hover:bg-primary transition-colors duration-300"></div>
      
      <div className="min-w-0 flex-1 pl-3">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-200 dark:bg-sky-500/20 dark:text-sky-300 dark:hover:bg-sky-500/30 border-none font-bold rounded-lg px-3 py-0.5">
            <Calendar className="size-3 mr-1.5 inline-block -mt-0.5" />
            {fmtDate(r.data_inicial)}
          </Badge>
          {r.festival && (
            <Badge variant="secondary" className="bg-fuchsia-100 text-fuchsia-700 hover:bg-fuchsia-200 dark:bg-fuchsia-500/20 dark:text-fuchsia-300 dark:hover:bg-fuchsia-500/30 border-none font-bold rounded-lg px-3 py-0.5">
              {r.festival}
            </Badge>
          )}
        </div>
        <h3 className="font-black text-xl text-slate-800 dark:text-white truncate mb-1.5">{r.espetaculo}</h3>
        <div className="flex items-center text-sm font-semibold text-slate-500 dark:text-slate-400 gap-1.5">
          <MapPin className="size-4" />
          <span>{r.cidade}{r.estado ? ` - ${r.estado}` : ""}</span>
        </div>
      </div>
      
      {/* Responsive Actions */}
      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0 md:pr-2 items-center border-t border-slate-100 dark:border-white/5 md:border-0 pt-4 md:pt-0 mt-2 md:mt-0">
        <Button variant="outline" className="rounded-xl h-11 w-full sm:w-auto bg-slate-50 shadow-sm hover:bg-primary hover:text-white hover:border-primary border-slate-200 dark:bg-white/5 dark:border-white/10 dark:text-slate-300 dark:hover:bg-primary dark:hover:text-white transition-colors font-bold" asChild>
          {profile?.role === 'motorista' ? (<a href={`/versao-motorista/${r.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="size-4 mr-2" /> Ver Roteiro</a>) : (<a href={`/rb/${r.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="size-4 mr-2" /> Ver Roteiro</a>)}
        </Button>
        
        {profile?.role !== 'motorista' && (
        <div className="grid grid-cols-4 sm:flex gap-2 w-full sm:w-auto sm:border-l sm:border-slate-200 dark:sm:border-white/10 sm:pl-3 sm:ml-1">
          <Button variant="outline" className="rounded-xl h-11 w-full sm:w-11 px-0 bg-slate-50 shadow-sm hover:bg-slate-200 border-slate-200 text-slate-500 dark:bg-white/5 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white transition-colors" asChild title="Versão para motorista">
            <a href={`/versao-motorista/${r.slug}`} target="_blank" rel="noreferrer">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
            </a>
          </Button>
          <Button variant="outline" className="rounded-xl h-11 w-full sm:w-11 px-0 bg-slate-50 shadow-sm hover:bg-slate-200 border-slate-200 text-slate-500 dark:bg-white/5 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white transition-colors" asChild title="Editar">
            <Link to="/roadbook/$id" params={{ id: r.id }}><Pencil className="size-4.5" /></Link>
          </Button>
          <Button variant="outline" className="rounded-xl h-11 w-full sm:w-11 px-0 bg-slate-50 shadow-sm hover:bg-slate-200 border-slate-200 text-slate-500 dark:bg-white/5 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white transition-colors" onClick={() => setDup(r)} title="Duplicar">
            <Copy className="size-4.5" />
          </Button>
          <Button variant="outline" onClick={() => setDeleteRbId(r.id)} className="rounded-xl h-11 w-full sm:w-11 px-0 bg-red-50/50 shadow-sm hover:bg-red-100 border-red-200 text-red-500 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/20 transition-colors" title="Excluir">
            <Trash2 className="size-4.5" />
          </Button>
        </div>
        )}
      </div>
    </Card>
  );


  return (
    <div className="max-w-7xl mx-auto space-y-12">
      
      {/* HEADER E STATS */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <Badge variant="outline" className="mb-3 border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400">Sistema Online</Badge>
            <h1 className="text-4xl xl:text-5xl font-black tracking-tight leading-snug pb-2 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
              Visão Geral
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base mt-2 font-medium">Bem-vindo de volta! Aqui está o resumo das suas turnês.</p>
          </div>
          {profile?.role !== 'motorista' && (<div className="flex gap-3 items-center">
            <Button asChild variant="outline" className="shadow-sm hover:shadow-md transition-all rounded-xl px-5 h-12 border-slate-200 dark:border-white/10 bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-white/5">
              <Link to="/tour/new"><Plus className="size-4 mr-2" />Nova Turnê</Link>
            </Button>
            <Button asChild className="shadow-[0_8px_20px_rgba(var(--primary),0.2)] hover:shadow-[0_12px_25px_rgba(var(--primary),0.3)] transition-all rounded-xl px-6 h-12 bg-primary dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 font-semibold text-white">
              <Link to="/roadbook/new"><Plus className="size-5 mr-2" />Novo Guia de Viagem</Link>
            </Button>
          </div>)}
        </div>

        {/* ALERTA DE ESCALAS PENDENTES */}
        {escalasPendentes > 0 && (
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                <AlertCircle className="size-6" />
              </div>
              <div>
                <h3 className="text-amber-800 dark:text-amber-200 font-bold text-lg">Você tem {escalasPendentes} convite(s) pendente(s)</h3>
                <p className="text-amber-700/80 dark:text-amber-300/80 text-sm font-medium mt-0.5">Responda às suas escalas para confirmar presença nos eventos.</p>
              </div>
            </div>
            <Button asChild className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white border-0 shadow-sm font-bold h-11 rounded-xl shrink-0">
              <Link to="/minhas-escalas">Ver Escalas</Link>
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="relative overflow-hidden p-6 xl:p-8 border-0 shadow-[0_4px_25px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl dark:border dark:border-white/10 transition-all hover:-translate-y-1.5 hover:shadow-[0_12px_35px_rgb(0,0,0,0.06)] rounded-3xl group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
            <div className="flex items-center gap-5 relative z-10">
              <div className="p-4 bg-emerald-100/50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 rounded-2xl shadow-sm ring-1 ring-emerald-200/50 dark:ring-emerald-800">
                <MapPin className="size-7" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1 truncate">
                  {currentCity}
                </h3>
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Cidade Atual</p>
              </div>
            </div>
          </Card>
          
          <Card className="relative overflow-hidden p-6 xl:p-8 border-0 shadow-[0_4px_25px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl dark:border dark:border-white/10 transition-all hover:-translate-y-1.5 hover:shadow-[0_12px_35px_rgb(0,0,0,0.06)] rounded-3xl group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400/10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
            <div className="flex items-center gap-5 relative z-10">
              <div className="p-4 bg-orange-100/50 dark:bg-orange-900/40 text-orange-600 dark:text-orange-300 rounded-2xl shadow-sm ring-1 ring-orange-200/50 dark:ring-orange-800">
                <Calendar className="size-7" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1 truncate">
                  {nextCity}
                </h3>
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Próxima Cidade</p>
              </div>
            </div>
          </Card>
        </div>

        {/* GRADES DE ACESSO RÁPIDO (MENUS) */}
        <section className="space-y-6 pt-4">
          <div className="flex items-center gap-3 px-2">
            <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">Acesso Rápido</h2>
            <div className="h-px flex-1 bg-slate-200 dark:bg-white/10 ml-4"></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            
            <Link to="/minhas-escalas" className="bg-white dark:bg-card/40 border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group flex flex-col items-center text-center gap-3">
              <div className="p-4 bg-primary/10 text-primary rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors">
                <ClipboardList className="size-6" />
              </div>
              <span className="font-bold text-slate-700 dark:text-slate-300">Minhas Escalas</span>
            </Link>
            
            <Link to="/viagens" className="bg-white dark:bg-card/40 border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group flex flex-col items-center text-center gap-3">
              <div className="p-4 bg-emerald-500/10 text-emerald-600 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <Bus className="size-6" />
              </div>
              <span className="font-bold text-slate-700 dark:text-slate-300">Minhas Viagens</span>
            </Link>



            {/* EVENTOS - ADMIN/PRODUTOR */}
            {['admin', 'dev', 'produtor'].includes(profile?.role || "") && (
              <Link to="/eventos" className="bg-white dark:bg-card/40 border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group flex flex-col items-center text-center gap-3">
                <div className="p-4 bg-sky-500/10 text-sky-600 rounded-2xl group-hover:bg-sky-500 group-hover:text-white transition-colors">
                  <Calendar className="size-6" />
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-300">Eventos</span>
              </Link>
            )}

            {/* PARTITURAS */}
            {['admin', 'dev', 'produtor', 'assistente_producao', 'stage_manager', 'musico'].includes(profile?.role || "") && (
              <Link to="/partituras" className="bg-white dark:bg-card/40 border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group flex flex-col items-center text-center gap-3">
                <div className="p-4 bg-fuchsia-500/10 text-fuchsia-600 rounded-2xl group-hover:bg-fuchsia-500 group-hover:text-white transition-colors">
                  <Music className="size-6" />
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-300">Partituras</span>
              </Link>
            )}


            
            {/* FIGURINOS GESTAO */}
            {['admin', 'dev', 'camareiro'].includes(profile?.role || "") && (
              <Link to="/figurinos" className="bg-white dark:bg-card/40 border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group flex flex-col items-center text-center gap-3">
                <div className="p-4 bg-pink-500/10 text-pink-600 rounded-2xl group-hover:bg-pink-500 group-hover:text-white transition-colors">
                  <ClothesRackIcon className="size-6" />
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-300">Figurinos</span>
              </Link>
            )}

            {/* MAPAS TÉCNICOS */}
            {['admin', 'dev', 'tecnico_som'].includes(profile?.role || "") && (
              <Link to="/som" className="bg-white dark:bg-card/40 border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group flex flex-col items-center text-center gap-3">
                <div className="p-4 bg-blue-500/10 text-blue-600 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <Mic2 className="size-6" />
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-300">Design de Som</span>
              </Link>
            )}
            {['admin', 'dev', 'iluminador'].includes(profile?.role || "") && (
              <Link to="/iluminacao" className="bg-white dark:bg-card/40 border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group flex flex-col items-center text-center gap-3">
                <div className="p-4 bg-amber-500/10 text-amber-600 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <Lightbulb className="size-6" />
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-300">Iluminação</span>
              </Link>
            )}
            {['admin', 'dev', 'tecnico_video'].includes(profile?.role || "") && (
              <Link to="/video" className="bg-white dark:bg-card/40 border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group flex flex-col items-center text-center gap-3">
                <div className="p-4 bg-purple-500/10 text-purple-600 rounded-2xl group-hover:bg-purple-500 group-hover:text-white transition-colors">
                  <Video className="size-6" />
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-300">Vídeo e Mídia Cênica</span>
              </Link>
            )}
            {['admin', 'dev', 'cenotecnico', 'roadie'].includes(profile?.role || "") && (
              <Link to="/palco" className="bg-white dark:bg-card/40 border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group flex flex-col items-center text-center gap-3">
                <div className="p-4 bg-slate-500/10 text-slate-600 rounded-2xl group-hover:bg-slate-500 group-hover:text-white transition-colors">
                  <StageIcon className="size-6" />
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-300">Palco / Cenário</span>
              </Link>
            )}
            {['admin', 'dev', 'camareiro'].includes(profile?.role || "") && (
              <Link to="/camarins" className="bg-white dark:bg-card/40 border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group flex flex-col items-center text-center gap-3">
                <div className="p-4 bg-pink-500/10 text-pink-600 rounded-2xl group-hover:bg-pink-500 group-hover:text-white transition-colors">
                  <StarDoorIcon className="size-6" />
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-300">Camarins</span>
              </Link>
            )}

          </div>
        </section>
      </section>

      {/* EVENTO ATUAL (Somente os 2 primeiros roadbooks) */}
      <section className="space-y-6 pt-4">
        <div className="flex items-center gap-3 px-2">
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">Próximos Eventos</h2>
          <div className="h-px flex-1 bg-slate-200 dark:bg-white/10 ml-4"></div>
        </div>
        
        {upcomingRoadbooks.length === 0 ? (
          <Card className="p-16 text-center border-dashed border-2 border-slate-200 dark:border-white/10 bg-transparent rounded-[2rem]">
            <p className="text-slate-500 dark:text-slate-400 font-medium">Você não possui eventos futuros programados.</p>
          </Card>
        ) : (
          <div className="grid gap-5">
            {upcomingRoadbooks.slice(0, 2).map(renderRoadbookCard)}
          </div>
        )}
      </section>

    </div>
  );
}
