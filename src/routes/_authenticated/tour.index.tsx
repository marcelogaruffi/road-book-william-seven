import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Route as RouteIcon, MapPin, Calendar, Users, Edit, Trash2, ArrowRight } from "lucide-react";
import { customConfirm } from "@/lib/custom-confirm";

export const Route = createFileRoute("/_authenticated/tour/")({
  head: () => ({ meta: [{ title: "Turnês - Seven Produções Artísticas" }] }),
  component: ToursPage,
});

function ToursPage() {
  const navigate = useNavigate();
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTours();
  }, []);

  async function fetchTours() {
    setLoading(true);
    // Fetch tours with a count of related eventos
    const { data, error } = await supabase
      .from('tours')
      .select('*, eventos(id, data, cidade)')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error("Erro ao buscar turnês: " + error.message);
    } else {
      setTours(data || []);
    }
    setLoading(false);
  }

  async function handleDelete(id: string, name: string) {
    const ok = await customConfirm({
      title: "Apagar Turnê",
      description: `Tem certeza que deseja apagar a turnê "${name}"? Esta ação não pode ser desfeita e todos os eventos vinculados perderão a referência de turnê.`,
      confirmText: "Sim, apagar",
      cancelText: "Não, cancelar",
      variant: "destructive"
    });
    if (!ok) return;

    const { error } = await supabase.from('tours').delete().eq('id', id);
    if (error) {
      toast.error("Erro ao deletar: " + error.message);
    } else {
      toast.success("Turnê removida com sucesso");
      fetchTours();
    }
  }

  // Separar em ativas (tem eventos futuros ou não tem eventos) e finalizadas (só eventos passados)
  const now = new Date().toISOString().substring(0, 10);
  
  const isTourActive = (tour: any) => {
    if (!tour.eventos || tour.eventos.length === 0) return true;
    return tour.eventos.some((rb: any) => rb.data >= now);
  };

  const activeTours = tours.filter(isTourActive);
  const finishedTours = tours.filter(t => !isTourActive(t));

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">Turnês</h1>
          <p className="text-slate-500 mt-1">Gerencie e acompanhe todas as turnês da sua equipe.</p>
        </div>
        <Button asChild className="bg-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
          <Link to="/tour/new">
            <Plus className="mr-2 size-4" />
            Nova Turnê
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl" />)}
        </div>
      ) : tours.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
          <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <RouteIcon className="size-10 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Nenhuma turnê cadastrada</h2>
          <p className="text-slate-500 max-w-md mb-8">
            Você ainda não possui nenhuma turnê. Crie sua primeira turnê para começar a agrupar seus eventos e shows.
          </p>
          <Button asChild size="lg">
            <Link to="/tour/new">Criar Primeira Turnê</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
          {activeTours.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="flex size-3 rounded-full bg-emerald-500 animate-pulse" />
                Turnês Ativas e Próximas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {activeTours.map(tour => (
                  <TourCard key={tour.id} tour={tour} onDelete={() => handleDelete(tour.id, tour.nome)} />
                ))}
              </div>
            </div>
          )}

          {finishedTours.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-slate-500 dark:text-slate-400">
                Turnês Finalizadas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 opacity-75 hover:opacity-100 transition-opacity">
                {finishedTours.map(tour => (
                  <TourCard key={tour.id} tour={tour} onDelete={() => handleDelete(tour.id, tour.nome)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TourCard({ tour, onDelete }: { tour: any, onDelete: () => void }) {
  const eventosCount = tour.eventos?.length || 0;
  
  const nowTime = new Date().getTime();
  const isHappening = tour.eventos?.some((rb: any) => {
    if (!rb.data) return false;
    const rbTime = new Date(rb.data).getTime();
    const diff = Math.abs(rbTime - nowTime);
    return diff < 4 * 24 * 60 * 60 * 1000; // happening within a 4-day window
  });
  
  return (
    <Card className={`flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm group ${isHappening ? 'ring-2 ring-primary/50 shadow-[0_0_20px_rgba(var(--primary),0.2)]' : ''}`}>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start mb-2">
          <Badge variant={isHappening ? 'default' : 'secondary'} className={isHappening ? 'animate-pulse' : ''}>
            {isHappening ? 'Acontecendo' : (tour.eventos?.length > 0 ? 'Agendada' : 'Sem eventos')}
          </Badge>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="size-8" asChild>
              <Link to="/tour/$id" params={{ id: tour.id }}><Edit className="size-4 text-slate-500 hover:text-primary" /></Link>
            </Button>
            <Button variant="ghost" size="icon" className="size-8" onClick={onDelete}>
              <Trash2 className="size-4 text-slate-500 hover:text-destructive" />
            </Button>
          </div>
        </div>
        <CardTitle className="text-2xl group-hover:text-primary transition-colors line-clamp-1">{tour.nome}</CardTitle>
        <CardDescription className="flex items-center gap-1.5 mt-1 font-medium text-slate-500">
          <Users className="size-4" /> {tour.espetaculo}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 pb-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
          <RouteIcon className="size-4 shrink-0 text-slate-400" />
          <span className="line-clamp-1">{tour.espetaculo || "Vários espetáculos"}</span>
        </div>
        
        {tour.eventos && tour.eventos.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {tour.eventos.slice(0, 10).map((rb: any) => (
              <Badge key={rb.id} variant="outline" className="bg-white dark:bg-slate-900 text-xs font-normal border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                <MapPin className="size-3 mr-1 opacity-50" />
                {rb.cidade}
              </Badge>
            ))}
            {tour.eventos.length > 10 && (
              <Badge variant="outline" className="bg-white dark:bg-slate-900 text-xs font-normal border-transparent text-slate-400">
                +{tour.eventos.length - 10} mais
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 flex justify-between gap-2 border-t border-slate-100 dark:border-slate-800/50 mt-4 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/20">
        <div className="flex gap-1.5">
          <Button variant="ghost" size="icon" className="size-9 text-slate-400 hover:text-primary hover:bg-primary/10" asChild>
            <Link to="/tour/$id" params={{ id: tour.id }} title="Editar Turnê">
              <Edit className="size-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="size-9 text-slate-400 hover:text-red-500 hover:bg-red-500/10" onClick={onDelete} title="Excluir Turnê">
            <Trash2 className="size-4" />
          </Button>
        </div>
        <Button size="sm" className="rounded-full pl-4 pr-3" asChild>
          <Link to="/tour/$id" params={{ id: tour.id }}>
            Acessar <ArrowRight className="ml-1.5 size-3.5" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
