import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Calendar, Users, Briefcase, Camera, Save, MapPin, CheckCircle2 } from "lucide-react";
import { Route as AuthedRoute } from "./route";

export const Route = createFileRoute("/_authenticated/novo-projeto")({
  head: () => ({ meta: [{ title: "Novo Projeto - Seven Produções Artísticas" }] }),
  component: NovoProjetoWizard,
});

const STEPS = [
  { id: 1, title: "Dados Básicos", icon: Calendar, description: "Criação do Evento" },
  { id: 2, title: "Equipe", icon: Users, description: "Escalas e Contratos" },
  { id: 3, title: "Técnica", icon: Briefcase, description: "Importar Mapas" },
  { id: 4, title: "Mídias", icon: Camera, description: "Cronograma Social" },
  { id: 5, title: "Resumo", icon: CheckCircle2, description: "Finalização" },
];

function NovoProjetoWizard() {
  const { profile } = AuthedRoute.useRouteContext();
  const navigate = useNavigate();
  const userRole = profile?.role || "";
  const isAllowed = ['admin', 'dev', 'produtor'].includes(userRole);

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Dados Step 1
  const [cidade, setCidade] = useState("");
  const [local, setLocal] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [espetaculo, setEspetaculo] = useState("");
  const [templates, setTemplates] = useState<string[]>([]);
  const [eventoId, setEventoId] = useState<string | null>(null);

  // Dados Step 2 (Equipe)
  const [profiles, setProfiles] = useState<any[]>([]);
  const [escalas, setEscalas] = useState<any[]>([]);
  const [funcaoAtual, setFuncaoAtual] = useState("");
  const [membroAtual, setMembroAtual] = useState("");

  // Inicialização
  useEffect(() => {
    if (!isAllowed) {
      navigate({ to: "/dashboard", replace: true });
      return;
    }
    loadInitials();
  }, [isAllowed]);

  async function loadInitials() {
    const [tRes, pRes] = await Promise.all([
      supabase.from("templates_espetaculos").select("nome_espetaculo").order("nome_espetaculo"),
      supabase.from("profiles").select("id, nome, role").order("nome")
    ]);
    if (tRes.data) setTemplates(tRes.data.map(t => t.nome_espetaculo));
    if (pRes.data) setProfiles(pRes.data);
  }

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  // Ações de cada passo
  const handleSaveStep1 = async () => {
    if (!cidade || !local || !data || !espetaculo) {
      toast.warning("Preencha cidade, local, data e espetáculo.");
      return;
    }
    setLoading(true);
    const payload = { cidade, local, data, horario, espetaculo, created_by: profile?.id };
    
    if (eventoId) {
      await supabase.from("eventos").update(payload).eq("id", eventoId);
      setLoading(false);
      nextStep();
    } else {
      const { data: ev, error } = await supabase.from("eventos").insert(payload).select("id").single();
      setLoading(false);
      if (error) {
        toast.error("Erro ao criar evento");
      } else {
        setEventoId(ev.id);
        toast.success("Evento base criado!");
        nextStep();
      }
    }
  };

  const handleAddEscala = () => {
    if (!membroAtual || !funcaoAtual) return toast.warning("Selecione membro e função");
    const membro = profiles.find(p => p.id === membroAtual);
    if (!membro) return;
    
    // Check duplication
    if (escalas.find(e => e.usuario_id === membroAtual)) {
      return toast.warning("Membro já escalado");
    }

    setEscalas([...escalas, { 
      usuario_id: membroAtual, 
      nome: membro.nome,
      funcao: funcaoAtual 
    }]);
    setMembroAtual("");
    setFuncaoAtual("");
  };

  const handleRemoveEscala = (id: string) => {
    setEscalas(escalas.filter(e => e.usuario_id !== id));
  };

  const handleSaveStep2 = async () => {
    if (!eventoId) return;
    setLoading(true);
    // Delete old
    await supabase.from("evento_escalas").delete().eq("evento_id", eventoId);
    
    if (escalas.length > 0) {
      const insertData = escalas.map(e => ({
        evento_id: eventoId,
        usuario_id: e.usuario_id,
        funcao: e.funcao,
        status: "Pendente"
      }));
      const { error } = await supabase.from("evento_escalas").insert(insertData);
      if (error) toast.error("Erro ao salvar escalas");
      else toast.success("Equipe salva!");
    }
    setLoading(false);
    nextStep();
  };

  const handleSaveStep3 = async () => {
    if (!eventoId) return;
    setLoading(true);
    try {
      // Importar Som
      const { data: mSom } = await supabase.from("mapas_som").select("*").eq("espetaculo_nome", espetaculo).maybeSingle();
      if (mSom) await supabase.from("mapas_som").upsert({ evento_id: eventoId, inputs: mSom.inputs, outputs: mSom.outputs, stage_plot_url: mSom.stage_plot_url, input_list_url: mSom.input_list_url, rider_url: mSom.rider_url });
      
      // Importar Luz
      const { data: mLuz } = await supabase.from("mapas_luz").select("*").eq("espetaculo_nome", espetaculo).maybeSingle();
      if (mLuz) await supabase.from("mapas_luz").upsert({ evento_id: eventoId, rider_url: mLuz.rider_url, mapa_url: mLuz.mapa_url, patch_list_url: mLuz.patch_list_url });
      
      // Importar Video
      const { data: mVideo } = await supabase.from("mapas_video").select("*").eq("espetaculo_nome", espetaculo).maybeSingle();
      if (mVideo) await supabase.from("mapas_video").upsert({ evento_id: eventoId, rider_url: mVideo.rider_url, mapa_url: mVideo.mapa_url, patch_list_url: mVideo.patch_list_url });

      // Importar Arquivos de Palco
      const { data: pArquivos } = await supabase.from("arquivos_padrao").select("*").eq("espetaculo_nome", espetaculo);
      if (pArquivos && pArquivos.length > 0) {
        const toInsert = pArquivos.map(a => ({ evento_id: eventoId, nome: a.nome, arquivo_url: a.arquivo_url, tipo: a.tipo, ordem: a.ordem }));
        // apaga e insere
        await supabase.from("arquivos_eventos").delete().eq("evento_id", eventoId);
        await supabase.from("arquivos_eventos").insert(toInsert);
      }

      toast.success("Arquivos técnicos importados!");
    } catch (e) {
      toast.error("Erro ao importar arquivos técnicos.");
    }
    setLoading(false);
    nextStep();
  };

  const [midiaData, setMidiaData] = useState("");
  const [midiaPlataforma, setMidiaPlataforma] = useState("");
  const handleSaveStep4 = async () => {
    if (midiaData && midiaPlataforma) {
      setLoading(true);
      await supabase.from("midias_cronograma").insert({
        nome_espetaculo: espetaculo,
        data_postagem: midiaData,
        plataforma: midiaPlataforma,
        status: "Planejado",
        tipo_post: "Aviso de Show",
        conteudo_texto: `Show em ${cidade} - ${local} confirmado!`
      });
      setLoading(false);
    }
    nextStep();
  };

  const handleFinish = () => {
    navigate({ to: "/eventos" });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 pt-6 px-4 sm:px-0">
      <div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
          <MapPin className="size-8 text-primary" />
          Novo Projeto Completo
        </h1>
        <p className="text-slate-500 mt-2">Assistente guiado para estruturar rapidamente um novo evento e seus módulos.</p>
      </div>

      {/* Stepper Header */}
      <div className="flex items-center justify-between w-full relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 dark:bg-slate-800 -z-10"></div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary transition-all duration-300 -z-10" style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}></div>
        
        {STEPS.map((step) => {
          const isActive = currentStep === step.id;
          const isPast = currentStep > step.id;
          return (
            <div key={step.id} className="flex flex-col items-center gap-2">
              <div className={`size-10 rounded-full flex items-center justify-center transition-colors ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/30 ring-4 ring-primary/20' : isPast ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                <step.icon className="size-5" />
              </div>
              <span className={`text-xs font-bold ${isActive ? 'text-primary' : 'text-slate-500 dark:text-slate-400'} hidden sm:block`}>{step.title}</span>
            </div>
          );
        })}
      </div>

      {/* Main Content Area */}
      <Card className="border-0 shadow-lg dark:bg-card/80 backdrop-blur-sm rounded-2xl overflow-hidden mt-8">
        
        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/5">
          <CardTitle className="text-xl flex items-center gap-2">
            {STEPS[currentStep - 1].title}
          </CardTitle>
          <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* STEP 1: EVENTO */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <Label>Espetáculo *</Label>
                <Select value={espetaculo} onValueChange={setEspetaculo}>
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-900"><SelectValue placeholder="Selecione o show" /></SelectTrigger>
                  <SelectContent>
                    {templates.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cidade/Estado *</Label>
                  <Input value={cidade} onChange={e => setCidade(e.target.value)} placeholder="Ex: São Paulo - SP" className="bg-slate-50 dark:bg-slate-900" />
                </div>
                <div className="space-y-2">
                  <Label>Local do Evento *</Label>
                  <Input value={local} onChange={e => setLocal(e.target.value)} placeholder="Ex: Teatro Municipal" className="bg-slate-50 dark:bg-slate-900" />
                </div>
                <div className="space-y-2">
                  <Label>Data *</Label>
                  <Input type="date" value={data} onChange={e => setData(e.target.value)} className="bg-slate-50 dark:bg-slate-900" />
                </div>
                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Input type="time" value={horario} onChange={e => setHorario(e.target.value)} className="bg-slate-50 dark:bg-slate-900" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: EQUIPE */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl space-y-4">
                <h3 className="font-semibold text-slate-700 dark:text-slate-300">Adicionar Membro</h3>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3">
                  <Select value={membroAtual} onValueChange={setMembroAtual}>
                    <SelectTrigger className="bg-white dark:bg-black"><SelectValue placeholder="Selecione a pessoa" /></SelectTrigger>
                    <SelectContent>
                      {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={funcaoAtual} onValueChange={setFuncaoAtual}>
                    <SelectTrigger className="bg-white dark:bg-black"><SelectValue placeholder="Função" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Técnico de Som">Técnico de Som</SelectItem>
                      <SelectItem value="Técnico de Luz">Técnico de Luz</SelectItem>
                      <SelectItem value="Assistente de Palco">Assistente de Palco</SelectItem>
                      <SelectItem value="Produtor">Produtor</SelectItem>
                      <SelectItem value="Elenco">Elenco</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddEscala} variant="secondary" className="w-full sm:w-auto">Adicionar</Button>
                </div>
              </div>

              {escalas.length > 0 && (
                <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
                  {escalas.map(e => (
                    <div key={e.usuario_id} className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-white/10 last:border-0 bg-white dark:bg-slate-900/30">
                      <div>
                        <p className="font-bold text-sm">{e.nome}</p>
                        <p className="text-xs text-slate-500">{e.funcao}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveEscala(e.usuario_id)} className="text-red-500 hover:bg-red-50">Remover</Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: TÉCNICA */}
          {currentStep === 3 && (
            <div className="space-y-4 text-center py-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <Briefcase className="size-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Importar Necessidades Técnicas</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                O sistema copiará automaticamente os <strong>Mapas de Palco, Som, Luz, Vídeo e Props</strong> configurados como padrão para o espetáculo "{espetaculo}".
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-xl mt-6 inline-block">
                Ao clicar em "Importar e Avançar", os arquivos serão vinculados a este evento.
              </div>
            </div>
          )}

          {/* STEP 4: MÍDIAS */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
               <p className="text-slate-500 mb-4">Deseja programar um aviso de show para as redes sociais agora?</p>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data da Postagem</Label>
                  <Input type="date" value={midiaData} onChange={e => setMidiaData(e.target.value)} className="bg-slate-50 dark:bg-slate-900" />
                </div>
                <div className="space-y-2">
                  <Label>Plataforma</Label>
                  <Select value={midiaPlataforma} onValueChange={setMidiaPlataforma}>
                    <SelectTrigger className="bg-slate-50 dark:bg-slate-900"><SelectValue placeholder="Instagram, Facebook..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Instagram">Instagram</SelectItem>
                      <SelectItem value="Facebook">Facebook</SelectItem>
                      <SelectItem value="Twitter">Twitter / X</SelectItem>
                      <SelectItem value="TikTok">TikTok</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: RESUMO */}
          {currentStep === 5 && (
            <div className="text-center py-10 space-y-6 animate-in zoom-in-95 duration-500">
              <div className="size-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/20">
                <CheckCircle2 className="size-10" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-800 dark:text-white">Tudo Pronto!</h2>
                <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                  O evento <strong>{cidade} - {local}</strong> foi totalmente estruturado. Escalas, mapas e mídia foram vinculados.
                </p>
              </div>
              <Button onClick={handleFinish} className="h-12 px-8 rounded-full text-lg shadow-xl shadow-primary/30">
                Acessar Eventos
              </Button>
            </div>
          )}

        </CardContent>

        {/* Action Bar */}
        {currentStep < 5 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
            <Button variant="outline" onClick={prevStep} disabled={currentStep === 1 || loading} className="w-32">
              <ChevronLeft className="mr-2 size-4" /> Voltar
            </Button>
            
            {currentStep === 1 && (
              <Button onClick={handleSaveStep1} disabled={loading} className="w-32 bg-primary">
                Avançar <ChevronRight className="ml-2 size-4" />
              </Button>
            )}
            {currentStep === 2 && (
              <Button onClick={handleSaveStep2} disabled={loading} className="w-32 bg-primary">
                Avançar <ChevronRight className="ml-2 size-4" />
              </Button>
            )}
            {currentStep === 3 && (
              <Button onClick={handleSaveStep3} disabled={loading} className="w-48 bg-primary">
                Importar e Avançar <ChevronRight className="ml-2 size-4" />
              </Button>
            )}
            {currentStep === 4 && (
              <Button onClick={handleSaveStep4} disabled={loading} className="w-32 bg-primary">
                Concluir <CheckCircle2 className="ml-2 size-4" />
              </Button>
            )}
          </div>
        )}

      </Card>
    </div>
  );
}
