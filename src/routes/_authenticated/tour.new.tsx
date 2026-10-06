import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { makeTourSlug } from "@/lib/slug";
import { Route as RouteIcon, Megaphone, Image as ImageIcon, Briefcase, Map, ArrowLeft, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/tour/new")({
  head: () => ({ meta: [{ title: "Nova Turnê" }] }),
  component: NewTour,
});

function NewTour() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [espetaculo, setEspetaculo] = useState("");
  const [producao, setProducao] = useState("");
  const [espetaculosList, setEspetaculosList] = useState<string[]>([]);
  const [exibirLogoEspetaculo, setExibirLogoEspetaculo] = useState(true);
  const [exibirLogoCia, setExibirLogoCia] = useState(true);
  const [exibirLogoProducao, setExibirLogoProducao] = useState(true);
  const [busy, setBusy] = useState(false);
  
  useEffect(() => {
    supabase.from('templates_espetaculos').select("nome_espetaculo").neq('nome_espetaculo', 'ESTOQUE_GLOBAL').then(({ data }) => {
      if (data) setEspetaculosList(data.map(d => d.nome_espetaculo));
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome) return;
    setBusy(true);

    try {
      const { data, error } = await supabase.from("tours").insert({
        nome,
        espetaculo,
        producao,
        slug: makeTourSlug(nome),
        exibir_logo_espetaculo: exibirLogoEspetaculo,
        exibir_logo_cia: exibirLogoCia,
        exibir_logo_producao: exibirLogoProducao,
      }).select().single();

      if (error) {
        toast.error("Erro ao criar turnê: " + error.message);
      } else {
        toast.success("Turnê criada com sucesso!");
        navigate({ to: `/tour/${data.id}` as any });
      }
    } finally { 
      setBusy(false); 
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 w-full max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" onClick={() => window.history.back()} className="h-10 w-10 rounded-full border-slate-200">
          <ArrowLeft className="size-5 text-slate-600" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <Map className="size-8 text-indigo-500" /> Nova Turnê
          </h1>
          <p className="text-slate-500 mt-1">Crie um agrupamento de viagens e eventos para a sua temporada</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Coluna da Esquerda - Dados Principais */}
          <div className="md:col-span-2 space-y-6">
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white">
              <div className="h-2 w-full bg-indigo-500"></div>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Briefcase className="size-5 text-indigo-500" /> Informações Básicas
                </CardTitle>
                <CardDescription>Defina o nome da turnê e qual espetáculo ela pertence.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold">Nome da Turnê <span className="text-red-500">*</span></Label>
                  <Input 
                    value={nome} 
                    onChange={(e) => setNome(e.target.value)} 
                    placeholder="Ex: Turnê Nordeste 2026, Temporada SP..." 
                    className="h-12 text-lg border-slate-200 focus-visible:ring-indigo-500"
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-bold">Espetáculo Vinculado</Label>
                    <Select value={espetaculo} onValueChange={setEspetaculo}>
                      <SelectTrigger className="h-11 border-slate-200 focus:ring-indigo-500">
                        <SelectValue placeholder="Selecione..." />
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
                    <Label className="text-slate-700 font-bold">Produção / Empresa</Label>
                    <Input 
                      value={producao} 
                      onChange={(e) => setProducao(e.target.value)} 
                      placeholder="Ex: Seven Produções" 
                      className="h-11 border-slate-200 focus-visible:ring-indigo-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna da Direita - Configurações Visuais */}
          <div className="space-y-6">
            <Card className="border-0 shadow-sm rounded-2xl bg-white h-full">
              <CardHeader className="pb-4 border-b border-slate-100">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="size-5 text-indigo-500" /> Identidade Visual
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure quais logos aparecerão no cabeçalho do Roadbook (PDF).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-slate-700">Logo do Espetáculo</Label>
                    <p className="text-[11px] text-slate-500">Exibe a logo oficial da peça.</p>
                  </div>
                  <Switch 
                    checked={exibirLogoEspetaculo} 
                    onCheckedChange={setExibirLogoEspetaculo} 
                    className="data-[state=checked]:bg-indigo-500"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-slate-700">Logo da Cia</Label>
                    <p className="text-[11px] text-slate-500">Exibe a logo da companhia teatral.</p>
                  </div>
                  <Switch 
                    checked={exibirLogoCia} 
                    onCheckedChange={setExibirLogoCia} 
                    className="data-[state=checked]:bg-indigo-500"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-slate-700">Logo da Produção</Label>
                    <p className="text-[11px] text-slate-500">Exibe a logo da Seven Produções.</p>
                  </div>
                  <Switch 
                    checked={exibirLogoProducao} 
                    onCheckedChange={setExibirLogoProducao} 
                    className="data-[state=checked]:bg-indigo-500"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

        </div>

        <div className="flex gap-4 justify-end pt-4 border-t border-slate-200">
          <Button type="button" variant="ghost" onClick={() => window.history.back()} className="h-12 px-6 rounded-xl font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100">
            Cancelar
          </Button>
          <Button type="submit" disabled={busy} className="h-12 px-8 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200">
            {busy ? "Salvando..." : (
              <>
                <Save className="mr-2 size-5" /> Criar Turnê
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
