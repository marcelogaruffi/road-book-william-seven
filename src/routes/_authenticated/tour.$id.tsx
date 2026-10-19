import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ExternalLink, Pencil, Plus, Route as RouteIcon, MapPin, Calendar, Briefcase, Image as ImageIcon, Save, ArrowLeft, Building2, Sparkles } from "lucide-react";
import { Route as AuthedRoute } from "./route";

type Tour = { 
  id: string; 
  slug: string; 
  nome: string; 
  espetaculo: string | null; 
  producao: string | null; 
  exibir_logo_espetaculo?: boolean; 
  exibir_logo_cia?: boolean; 
  exibir_logo_producao?: boolean; 
};

type Roadbook = { 
  id: string; 
  slug: string; 
  espetaculo: string; 
  cidade: string; 
  estado: string | null; 
  data_inicial: string | null; 
  data_final: string | null 
};

export const Route = createFileRoute("/_authenticated/tour/$id")({
  head: () => ({ meta: [{ title: "Gestão da Turnê - Áxis" }] }),
  component: EditTour,
});

function EditTour() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [tour, setTour] = useState<Tour | null>(null);
  const [cities, setCities] = useState<Roadbook[]>([]);
  const [busy, setBusy] = useState(false);
  const [espetaculosList, setEspetaculosList] = useState<string[]>([]);
  
  const { profile } = AuthedRoute.useRouteContext();
  const userRole = profile?.role || "elenco";
  const userFuncoes = profile?.funcoes || [];
  const hasRole = (r: string) => userRole === r || userFuncoes.includes(r);
  const canManageRoadbooks = ['dev', 'admin', 'produtor', 'assistente_producao', 'tour_manager'].some(r => hasRole(r));

  async function load() {
    const [{ data: t }, { data: c }, { data: e }] = await Promise.all([
      supabase.from("tours").select("id,slug,nome,espetaculo,producao,exibir_logo_espetaculo,exibir_logo_cia,exibir_logo_producao").eq("id", id).maybeSingle(),
      supabase.from("roadbooks").select("id,slug,espetaculo,cidade,estado,data_inicial,data_final").eq("tour_id", id).order("data_inicial", { ascending: true, nullsFirst: false }),
      supabase.from('templates_espetaculos').select("nome_espetaculo").neq('nome_espetaculo', 'ESTOQUE_GLOBAL'),
    ]);
    if (!t) { toast.error("Turnê não encontrada"); return; }
    setTour(t as Tour);
    setCities((c as Roadbook[]) ?? []);
    if (e) setEspetaculosList(e.map(d => d.nome_espetaculo));
  }

  useEffect(() => { load(); }, [id]);

  async function save() {
    if (!tour) return;
    setBusy(true);
    const { error } = await supabase.from("tours").update({
      nome: tour.nome, 
      espetaculo: tour.espetaculo === 'none' ? null : tour.espetaculo, 
      producao: tour.producao,
      exibir_logo_espetaculo: tour.exibir_logo_espetaculo ?? true,
      exibir_logo_cia: tour.exibir_logo_cia ?? true,
      exibir_logo_producao: tour.exibir_logo_producao ?? true,
    }).eq("id", tour.id);
    setBusy(false);
    if (error) {
      toast.error(getErrorMessage(error));
    } else {
      toast.success("Alterações salvas.");
      navigate({ to: "/tour" });
    }
  }

  if (!tour) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => window.history.back()} className="h-10 w-10 rounded-xl border-slate-200 dark:border-white/10 shrink-0">
            <ArrowLeft className="size-5 text-slate-600 dark:text-slate-300" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-none font-bold text-xs">
                Turnê
              </Badge>
              {tour.espetaculo && (
                <Badge variant="outline" className="border-slate-200 dark:border-white/10 font-medium text-xs">
                  {tour.espetaculo}
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {tour.nome}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Organize os dados da temporada, cidades e identidade visual.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button variant="outline" className="rounded-xl h-11 px-4 font-bold border-slate-200 dark:border-white/10" asChild>
            <a href={`/turne/${tour.slug}`} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4 mr-2 text-indigo-500" /> Página Pública
            </a>
          </Button>
          <Button onClick={save} disabled={busy} className="rounded-xl h-11 px-6 font-bold shadow-md bg-indigo-600 hover:bg-indigo-700 text-white">
            <Save className="size-4 mr-2" /> {busy ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA ESQUERDA: DADOS PRINCIPAIS */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-card/40 dark:backdrop-blur-md dark:border dark:border-white/10">
            <div className="h-2 w-full bg-indigo-500"></div>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Briefcase className="size-5 text-indigo-500" /> Informações da Turnê
              </CardTitle>
              <CardDescription>Defina o nome da turnê e o espetáculo vinculado.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300 font-bold">Nome da Turnê *</Label>
                <Input 
                  value={tour.nome} 
                  onChange={(e) => setTour({ ...tour, nome: e.target.value })} 
                  className="h-12 text-base border-slate-200 dark:border-white/10 rounded-xl font-semibold"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 font-bold">Espetáculo Vinculado</Label>
                  <Select 
                    value={tour.espetaculo || "none"} 
                    onValueChange={(val) => setTour({ ...tour, espetaculo: val === "none" ? null : val })}
                  >
                    <SelectTrigger className="h-11 border-slate-200 dark:border-white/10 rounded-xl">
                      <SelectValue placeholder="Selecione um espetáculo..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum espetáculo específico</SelectItem>
                      {espetaculosList.map(esp => (
                        <SelectItem key={esp} value={esp}>{esp}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 font-bold">Produção / Empresa</Label>
                  <Input 
                    value={tour.producao || ""} 
                    onChange={(e) => setTour({ ...tour, producao: e.target.value })} 
                    placeholder="Ex: Seven Produções" 
                    className="h-11 border-slate-200 dark:border-white/10 rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CIDADES E EVENTOS VINCULADOS */}
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-card/40 dark:backdrop-blur-md dark:border dark:border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <MapPin className="size-5 text-indigo-500" /> Cidades & Guias de Viagem
                </CardTitle>
                <CardDescription>Cidades e roteiros programados para esta temporada.</CardDescription>
              </div>
              {canManageRoadbooks && (
                <Button size="sm" asChild className="rounded-xl font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200">
                  <Link to="/roadbook/new">
                    <Plus className="size-4 mr-1.5" /> Adicionar Cidade
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent className="pt-6">
              {cities.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                    <Sparkles className="size-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">Sua turnê foi criada!</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                      Agora adicione as cidades e apresentações para começar a organizar a programação e o roteiro da equipe.
                    </p>
                  </div>
                  {canManageRoadbooks && (
                    <Button asChild className="rounded-xl font-bold mt-2 shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white">
                      <Link to="/roadbook/new">
                        <Plus className="size-4 mr-1.5" /> Criar Guia para esta Turnê
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {cities.map((c) => (
                    <div key={c.id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0 hover:bg-slate-50/60 dark:hover:bg-white/[0.02] px-2 rounded-xl transition-colors">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-base text-slate-800 dark:text-white truncate">
                            {c.cidade}{c.estado ? ` - ${c.estado}` : ""}
                          </p>
                          <Badge variant="secondary" className="text-xs font-semibold">
                            {c.espetaculo}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-medium">
                          <Calendar className="size-3.5 text-slate-400" />
                          {c.data_inicial ?? "Data a definir"} {c.data_final ? ` até ${c.data_final}` : ""}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" className="rounded-xl font-bold h-9 border-slate-200 dark:border-white/10" asChild>
                          <a href={`/rb/${c.slug}`} target="_blank" rel="noreferrer">
                            <ExternalLink className="size-3.5 mr-1.5" /> Ver Roteiro
                          </a>
                        </Button>
                        {canManageRoadbooks && (
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50" asChild title="Editar Guia">
                            <Link to="/roadbook/$id" params={{ id: c.id }}>
                              <Pencil className="size-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* COLUNA DIREITA: IDENTIDADE VISUAL */}
        <div className="space-y-6">
          <Card className="border-0 shadow-sm rounded-2xl bg-white dark:bg-card/40 dark:backdrop-blur-md dark:border dark:border-white/10">
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-white/10">
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="size-5 text-indigo-500" /> Identidade Visual
              </CardTitle>
              <CardDescription className="text-xs">
                Controle quais marcas aparecem no cabeçalho do Guia de Viagem (PDF).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Logo do Espetáculo</Label>
                  <p className="text-[11px] text-slate-500">Exibe a logo oficial da peça.</p>
                </div>
                <Switch 
                  checked={tour.exibir_logo_espetaculo ?? true} 
                  onCheckedChange={(checked) => setTour({ ...tour, exibir_logo_espetaculo: checked })}
                  className="data-[state=checked]:bg-indigo-500"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Logo da Cia</Label>
                  <p className="text-[11px] text-slate-500">Exibe a logo da companhia teatral.</p>
                </div>
                <Switch 
                  checked={tour.exibir_logo_cia ?? true} 
                  onCheckedChange={(checked) => setTour({ ...tour, exibir_logo_cia: checked })}
                  className="data-[state=checked]:bg-indigo-500"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Logo da Produção</Label>
                  <p className="text-[11px] text-slate-500">Exibe a marca da produtora.</p>
                </div>
                <Switch 
                  checked={tour.exibir_logo_producao ?? true} 
                  onCheckedChange={(checked) => setTour({ ...tour, exibir_logo_producao: checked })}
                  className="data-[state=checked]:bg-indigo-500"
                />
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
