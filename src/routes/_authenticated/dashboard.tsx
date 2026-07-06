import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Plus, ExternalLink, Pencil, Trash2, Copy, Calendar, MapPin, 
  MoreVertical, BookOpen, MapPinned, Bus, ChevronRight 
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
  const [profile, setProfile] = useState<any>(null);
  const [dup, setDup] = useState<Roadbook | null>(null);

  async function load() {
    setLoading(true);
    const { data: authData } = await supabase.auth.getUser();
    if (authData.user) {
      const { data: p } = await supabase.from('profiles').select('role').eq('id', authData.user.id).single();
      if (p) setProfile(p);
    }

    const [{ data: rb, error: e1 }, { data: tr, error: e2 }] = await Promise.all([
      supabase.from("roadbooks").select("id,slug,espetaculo,cidade,estado,festival,data_inicial,data_final,tour_id").order("data_inicial", { ascending: true }),
      supabase.from("tours").select("id,slug,nome,espetaculo").order("created_at", { ascending: false }),
    ]);
    if (e1) toast.error(e1.message);
    if (e2) toast.error(e2.message);
    setItems((rb as Roadbook[]) ?? []);
    setTours((tr as Tour[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const [deleteRbId, setDeleteRbId] = useState<string | null>(null);
  
  async function onDelete(id: string) {
    const { error } = await supabase.from("roadbooks").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Excluído"); load(); }
    setDeleteRbId(null);
  }

  const [deleteTourId, setDeleteTourId] = useState<string | null>(null);

  async function onDeleteTour(id: string) {
    const { error } = await supabase.from("tours").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Excluída"); load(); }
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

  const hoje = new Date().toISOString().split('T')[0];
  const proximos = items.filter(r => r.data_inicial && r.data_inicial >= hoje);
  const nextCity = proximos.length > 0 ? proximos[0].cidade : (items.length > 0 ? items[items.length - 1].cidade : "Nenhuma");

  const currentCity = items.find(r => r.data_inicial === hoje)?.cidade || "Nenhuma";


  return (
    <div className="max-w-7xl mx-auto space-y-12">
      
      {/* HEADER E STATS */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <Badge variant="outline" className="mb-3 border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400">Sistema Online</Badge>
            <h1 className="text-4xl xl:text-5xl font-black tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
              Visão Geral
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base mt-2 font-medium">Bem-vindo de volta! Aqui está o resumo das suas turnês.</p>
          </div>
          {profile?.role !== 'motorista' && (<div className="flex gap-3 items-center">
            <Button asChild variant="outline" className="shadow-sm hover:shadow-md transition-all rounded-xl px-5 h-12 border-slate-200 dark:border-white/10 bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-white/5">
              <Link to="/tour/new"><Plus className="size-4 mr-2" />Nova Turnê</Link>
            </Button>
            <Button asChild className="shadow-[0_8px_20px_rgba(var(--primary),0.2)] hover:shadow-[0_12px_25px_rgba(var(--primary),0.3)] transition-all rounded-xl px-6 h-12 bg-primary dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 font-semibold text-white">
              <Link to="/roadbook/new"><Plus className="size-5 mr-2" />Novo Road Book</Link>
            </Button>
          </div>)}
        </div>

        {profile?.role === 'motorista' ? (
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="relative overflow-hidden p-6 xl:p-8 border-0 shadow-[0_4px_25px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl dark:border dark:border-white/10 transition-all hover:-translate-y-1.5 hover:shadow-[0_12px_35px_rgb(0,0,0,0.06)] rounded-3xl group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
            <div className="flex items-center gap-5 relative z-10">
              <div className="p-4 bg-blue-100/50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-2xl shadow-sm ring-1 ring-blue-200/50 dark:ring-blue-800">
                <MapPinned className="size-7" />
              </div>
              <div>
                <h3 className="text-4xl font-black text-slate-800 dark:text-white mb-1">{tours.length}</h3>
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Turnês Ativas</p>
              </div>
            </div>
          </Card>
          
          <Card className="relative overflow-hidden p-6 xl:p-8 border-0 shadow-[0_4px_25px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl dark:border dark:border-white/10 transition-all hover:-translate-y-1.5 hover:shadow-[0_12px_35px_rgb(0,0,0,0.06)] rounded-3xl group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
            <div className="flex items-center gap-5 relative z-10">
              <div className="p-4 bg-purple-100/50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 rounded-2xl shadow-sm ring-1 ring-purple-200/50 dark:ring-purple-800">
                <BookOpen className="size-7" />
              </div>
              <div>
                <h3 className="text-4xl font-black text-slate-800 dark:text-white mb-1">{items.length}</h3>
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Road Books</p>
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
      
      )}</section>

      {/* TURNÊS */}
      <section id="turnes" className="space-y-6 pt-4 scroll-mt-24">
        <div className="flex items-center gap-3 px-2">
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">Minhas Turnês</h2>
          <div className="h-px flex-1 bg-slate-200 dark:bg-white/10 ml-4"></div>
        </div>
        
        {tours.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-2 border-slate-200 dark:border-white/10 bg-transparent rounded-[2rem]">
            <p className="text-slate-500 dark:text-slate-400 font-medium">Você ainda não tem turnês criadas.</p>
          </Card>
        ) : (
          <div className="grid xl:grid-cols-3 md:grid-cols-2 gap-6">
            {tours.map((t, i) => {
              const count = items.filter((r) => r.tour_id === t.id).length;
              const gradient = getGradient(i);
              const iconColor = getIconColor(i);
              
              return (
                <Card key={t.id} className="p-6 flex flex-col gap-5 group border-0 shadow-[0_2px_15px_rgb(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] bg-white dark:bg-card/40 dark:backdrop-blur-md dark:border dark:border-white/5 hover:shadow-[0_12px_30px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all duration-300 rounded-[2rem] relative overflow-hidden">
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br ${gradient} transition-opacity duration-500 pointer-events-none`}></div>
                  
                  <div className="flex items-start justify-between gap-4 relative z-10">
                    <div className={`p-3.5 rounded-2xl ${iconColor} shrink-0 shadow-sm ring-1 ring-white/20`}>
                      <Bus className="size-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0 pt-1">
                      <h3 className="font-bold text-xl text-slate-800 dark:text-white truncate">{t.nome}</h3>
                      {t.espetaculo && <p className="text-sm text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">{t.espetaculo}</p>}
                    </div>
                    
                    {profile?.role !== 'motorista' && (<DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400">
                          <MoreVertical className="size-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-2xl shadow-xl dark:border-white/10 w-48 p-2">
                        <DropdownMenuItem asChild className="rounded-xl py-2.5">
                           <a href={`/turne/${t.slug}`} target="_blank" rel="noreferrer" className="cursor-pointer font-semibold text-slate-700 dark:text-slate-200"><ExternalLink className="size-4 mr-3" /> Abrir Turnê</a>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="rounded-xl py-2.5">
                           <Link to="/tour/$id" params={{ id: t.id }} className="cursor-pointer font-semibold text-slate-700 dark:text-slate-200"><Pencil className="size-4 mr-3" /> Editar Detalhes</Link>
                        </DropdownMenuItem>
                        <div className="h-px bg-slate-100 dark:bg-white/10 my-1 -mx-2"></div>
                        <DropdownMenuItem onClick={() => setDeleteTourId(t.id)} className="text-red-500 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-500/10 rounded-xl py-2.5 font-semibold">
                          <Trash2 className="size-4 mr-3" /> Excluir Turnê
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                )}
                  </div>

                  <div className="mt-auto relative z-10 flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-4">
                    <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-300 dark:border-white/10 rounded-full px-3 py-1 font-semibold">{count} Cidades</Badge>
                    <Button variant="link" className="px-0 text-primary font-bold h-auto hover:no-underline group-hover:translate-x-1 transition-transform" asChild>
                       <a href={`/turne/${t.slug}`} target="_blank" rel="noreferrer">Ver detalhes <ChevronRight className="size-4 ml-1" /></a>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ROAD BOOKS */}
      <section id="roadbooks" className="space-y-6 pt-4 scroll-mt-24">
        <div className="flex items-center gap-3 px-2">
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white\">{profile?.role === 'motorista' ? 'Programações de viagem recentes' : 'Road Books Recentes'}</h2>
          <div className="h-px flex-1 bg-slate-200 dark:bg-white/10 ml-4"></div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : items.length === 0 ? (
           <Card className="p-16 text-center border-dashed border-2 border-slate-200 dark:border-white/10 bg-transparent rounded-[2rem]">
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-6">Nenhum road book cadastrado.</p>
            <Button asChild className="rounded-full shadow-lg h-12 px-8"><Link to="/roadbook/new"><Plus className="size-4 mr-2" />Criar o primeiro</Link></Button>
          </Card>
        ) : (
          <div className="grid gap-5">
            {items.map((r, index) => (
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
                    {profile?.role === 'motorista' ? (<a href={`/versao-motorista/${r.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="size-4 mr-2\" /> Ver Roteiro</a>) : (<a href={`/rb/${r.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="size-4 mr-2\" /> Ver Roteiro</a>)}
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
            ))}
          </div>
        )}
      </section>

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
            <DialogTitle>Excluir Roadbook</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja excluir? Esta ação não poderá ser desfeita.
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
