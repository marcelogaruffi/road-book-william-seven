import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Music, Plus, Trash2, Pencil, Save, X, Users, ChevronRight, ChevronLeft, Clapperboard, Map, Mic2, Lightbulb, FileText, Settings, Image as ImageIcon, FileUp, Link as LinkIcon, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/espetaculos")({
  head: () => ({ meta: [{ title: "Cadastro de Shows - Seven Produções Artísticas" }] }),
  component: EspetaculosPage,
});

type FichaItem = { funcao: string; nome: string };

type Espetaculo = {
  nome_espetaculo: string;
  grupo_cia: string | null;
  logo_espetaculo_url: string | null;
  logo_cia_url: string | null;
  sinopse: string | null;
  classificacao_indicativa: string | null;
  faixa_etaria: string | null;
  duracao: string | null;
  release_text: string | null;
  ficha_tecnica: FichaItem[] | null;
  personagens: string[] | null;
  instrumentos: string[] | null;
  rider_som: string | null;
  rider_luz: string | null;
  rider_video: string | null;
  mapa_palco_url: string | null;
  figurinos_url: string | null;
  assets_midia: any;
  created_at?: string;
};

const emptyShow: Espetaculo = {
  nome_espetaculo: "",
  grupo_cia: "",
  logo_espetaculo_url: null,
  logo_cia_url: null,
  sinopse: "",
  classificacao_indicativa: "",
  faixa_etaria: "",
  duracao: "",
  release_text: "",
  ficha_tecnica: [],
  personagens: [],
  instrumentos: [],
  rider_som: "",
  rider_luz: "",
  rider_video: "",
  mapa_palco_url: "",
  figurinos_url: "",
  assets_midia: {},
};

const FICHA_FUNCOES = [
  "Adaptação", "Cenografia", "Direção", "Direção de Arte", "Edição de Imagens", "Figurinos", "Fotografia",
  "Preparação Corporal", "Preparação Vocal", "Produção Executiva", "Produção Musical", "Outros"
];

function EspetaculosPage() {
  const [espetaculos, setEspetaculos] = useState<Espetaculo[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Navigation State
  const [view, setView] = useState<"list" | "wizard" | "dashboard">("list");
  
  const [currentShow, setCurrentShow] = useState<Espetaculo>(emptyShow);
  const [step, setStep] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [viewRiderModal, setViewRiderModal] = useState<string | null>(null);
  const [originalName, setOriginalName] = useState("");

  const [novaFicha, setNovaFicha] = useState({ funcao: "", nome: "", outroNome: "" });
  const [novoPersonagem, setNovoPersonagem] = useState("");
  const [novoInstrumento, setNovoInstrumento] = useState("");

  
  
  const somData = (() => {
    try {
      return currentShow.rider_som ? JSON.parse(currentShow.rider_som) : {};
    } catch {
      return { notas_gerais: currentShow.rider_som || '' };
    }
  })();

  
  const handleRiderSomUpload = async (file: File) => {
    if (!file) return;
    toast.info('Fazendo upload...');
    const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const { data: user } = await supabase.auth.getUser();
    const uid = user?.user?.id || 'public';
    const filePath = `${uid}/midias_eventos/${Date.now()}-${cleanName}`;
    
    const { error: uploadError } = await supabase.storage.from('midias_eventos').upload(filePath, file);
    
    if (uploadError) {
      toast.error('Erro no upload: ' + uploadError.message);
    } else {
      const { data: { publicUrl } } = supabase.storage.from('midias_eventos').getPublicUrl(filePath);
      
      const m = {...(currentShow.assets_midia||{})};
      const novoAnexo = { url: publicUrl, nome: file.name };
      m.anexos_som = [...(m.anexos_som || []), novoAnexo];
      setCurrentShow(s => ({ ...s, assets_midia: m }));
      
      toast.success('Arquivo anexado com sucesso!');
    }
  };

  const updateSomData = (key: string, value: any) => {
    const newData = { ...somData, [key]: value };
    setCurrentShow({ ...currentShow, rider_som: JSON.stringify(newData) });
  };

  const addSomEquipamento = () => {
    const list = somData.equipamentos_lista || [];
    updateSomData('equipamentos_lista', [...list, { id: Math.random().toString(36).substring(2, 9), qtd: '1', nome: '', detalhes: '' }]);
  };

  const removeSomEquipamento = (id: string) => {
    const list = (somData.equipamentos_lista || []).filter((e: any) => e.id !== id);
    updateSomData('equipamentos_lista', list);
  };


  const addSomInputList = () => {
    const list = somData.input_list_tabela || [];
    const proximoCanal = (list.length + 1).toString();
    updateSomData('input_list_tabela', [...list, { id: Math.random().toString(36).substring(2, 9), canal: proximoCanal, equipamento: '', obs: '' }]);
  };

  const removeSomInputList = (id: string) => {
    const list = (somData.input_list_tabela || []).filter((e: any) => e.id !== id);
    updateSomData('input_list_tabela', list);
  };

  const updateSomInputList = (id: string, field: string, value: string) => {
    const list = (somData.input_list_tabela || []).map((e: any) => 
      e.id === id ? { ...e, [field]: value } : e
    );
    updateSomData('input_list_tabela', list);
  };


  const updateSomEquipamento = (id: string, field: string, value: string) => {
    const list = (somData.equipamentos_lista || []).map((e: any) => 
      e.id === id ? { ...e, [field]: value } : e
    );
    updateSomData('equipamentos_lista', list);
  };


  const totalSteps = 10;
  const progressPercent = Math.round((step / totalSteps) * 100);

  useEffect(() => {
    if (view === "list") fetchEspetaculos();
  }, [view]);

  async function fetchEspetaculos() {
    setLoading(true);
    const { data, error } = await supabase
      .from("templates_espetaculos")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setEspetaculos(data || []);
    setLoading(false);
  }

  const handleFileUpload = async (file: File, folder: string) => {
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) throw new Error("Sessão expirada");
    
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${uid}/${folder}/${Date.now()}-${cleanName}`;
    
    const { error } = await supabase.storage.from("midias_eventos").upload(filePath, file);
    if (error) throw error;
    
    const { data } = supabase.storage.from("midias_eventos").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const uploadLogo = async (e: any, type: "logo_espetaculo_url" | "logo_cia_url") => {
    if (!e.target.files?.[0]) return;
    try {
      toast.loading("Enviando logo...");
      const url = await handleFileUpload(e.target.files[0], "logos");
      setCurrentShow(s => ({ ...s, [type]: url }));
      toast.dismiss();
      toast.success("Logo enviada com sucesso!");
    } catch (err: any) {
      toast.dismiss();
      toast.error("Erro: " + err.message);
    }
  };

  const uploadAnexo = async (e: any, key: string) => {
    if (!e.target.files?.[0]) return;
    try {
      toast.loading("Enviando anexo...");
      const url = await handleFileUpload(e.target.files[0], "anexos");
      setCurrentShow(s => ({ 
        ...s, 
        assets_midia: { ...(s.assets_midia || {}), [key]: url } 
      }));
      toast.dismiss();
      toast.success("Anexo salvo com sucesso!");
    } catch (err: any) {
      toast.dismiss();
      toast.error("Erro: " + err.message);
    }
  };

  const addFicha = () => {
    if (!novaFicha.funcao || !novaFicha.nome) return;
    const finalFuncao = novaFicha.funcao === "Outros" ? novaFicha.outroNome : novaFicha.funcao;
    if (!finalFuncao) return;
    
    const list = [...(currentShow.ficha_tecnica || []), { funcao: finalFuncao, nome: novaFicha.nome }];
    list.sort((a, b) => a.funcao.localeCompare(b.funcao));
    setCurrentShow({ ...currentShow, ficha_tecnica: list });
    setNovaFicha({ funcao: "", nome: "", outroNome: "" });
  };

  const saveWizard = async () => {
    if (!currentShow.nome_espetaculo.trim()) {
      toast.error("Nome do espetáculo é obrigatório");
      setStep(1);
      return;
    }
    try {
      toast.loading("Salvando espetáculo...");
      const payload = { ...currentShow };
      delete payload.created_at;

      if (isEditing) {
        if (originalName !== currentShow.nome_espetaculo) {
          const { error } = await supabase.from("templates_espetaculos").update(payload).eq("nome_espetaculo", originalName);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("templates_espetaculos").update(payload).eq("nome_espetaculo", currentShow.nome_espetaculo);
          if (error) throw error;
        }
      } else {
        const { error } = await supabase.from("templates_espetaculos").insert(payload);
        if (error) throw error;
      }
      
      toast.dismiss();
      toast.success("Espetáculo salvo com sucesso!");
      setView("dashboard");
    } catch (error: any) {
      toast.dismiss();
      toast.error("Erro ao salvar: " + error.message);
    }
  };

  const handleDelete = async (nome: string) => {
    if (!confirm("Tem certeza que deseja excluir o espetáculo " + nome + "?")) return;
    const { error } = await supabase.from("templates_espetaculos").delete().eq("nome_espetaculo", nome);
    if (error) toast.error(error.message);
    else {
      toast.success("Excluído com sucesso");
      setView("list");
    }
  };

  const renderTechStep = (
    title: string, 
    desc: string, 
    icon: any, 
    textKey: keyof Espetaculo, 
    attachmentKey: string,
    placeholder: string
  ) => {
    const Icon = icon;
    let textValue = (currentShow[textKey] as string) || "";
    if (textValue === "[object Object]") textValue = "";
    const attachmentUrl = currentShow.assets_midia?.[attachmentKey];

    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary"><Icon className="size-6"/></div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h3>
            <p className="text-sm text-slate-500">{desc}</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-2">
            <Label className="font-semibold text-sm">Detalhes em Texto</Label>
            <Textarea 
              className="min-h-[220px] resize-none text-sm bg-white dark:bg-slate-900 shadow-sm" 
              placeholder={placeholder}
              value={textValue} 
              onChange={e => setCurrentShow({...currentShow, [textKey]: e.target.value})} 
            />
          </div>
          
          <div className="space-y-2">
            <Label className="font-semibold text-sm">Arquivo Anexo (PDF, Imagem)</Label>
            {attachmentUrl ? (
              <div className="border rounded-xl p-4 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900 shadow-sm h-[220px] relative">
                <FileText className="size-12 text-primary mb-3" />
                <p className="font-bold text-sm text-slate-700 dark:text-slate-300">Arquivo Anexado</p>
                <a href={attachmentUrl} target="_blank" className="text-xs text-blue-500 hover:underline flex items-center justify-center mt-1 mb-4"><LinkIcon className="size-3 mr-1"/> Abrir Arquivo</a>
                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => {
                  const m = {...(currentShow.assets_midia||{})};
                  delete m[attachmentKey];
                  setCurrentShow({...currentShow, assets_midia: m});
                }}>
                  Remover
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-xl h-[220px] flex flex-col items-center justify-center text-slate-400 relative hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors bg-white dark:bg-slate-900 shadow-sm">
                <FileUp className="size-8 mb-3 opacity-50" />
                <span className="font-semibold text-sm">Clique para anexar arquivo</span>
                <span className="text-xs mt-1">Tamanho máx: 10MB</span>
                <input type="file" onChange={e => uploadAnexo(e, attachmentKey)} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // VIEW: LIST
  // ---------------------------------------------------------------------------
  if (view === "list") {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Meus Espetáculos</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie o seu catálogo de shows e padrões técnicos.</p>
          </div>
          <Button onClick={() => { setCurrentShow(emptyShow); setIsEditing(false); setStep(1); setView("wizard"); }} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg h-10 px-6 rounded-lg">
            <Plus className="mr-2 h-4 w-4" /> Novo Espetáculo
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400">Carregando...</div>
        ) : espetaculos.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/10">
            <Music className="size-12 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Nenhum espetáculo cadastrado</h3>
            <p className="text-sm text-slate-500 mt-2">Clique em "Novo Espetáculo" para começar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {espetaculos.map((show) => (
              <Card key={show.nome_espetaculo} className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group border-slate-200 dark:border-white/10" onClick={() => { setCurrentShow(show); setView("dashboard"); }}>
                <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800 relative overflow-hidden flex items-center justify-center">
                  {show.logo_espetaculo_url ? (
                    <img src={show.logo_espetaculo_url} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <Music className="size-8 text-slate-300 dark:text-slate-600" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-lg font-black text-white truncate shadow-black drop-shadow-md">{show.nome_espetaculo}</h3>
                    <p className="text-xs font-semibold text-white/90 truncate drop-shadow-md">{show.grupo_cia || "Sem companhia"}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!viewRiderModal} onOpenChange={val => { if (!val) setViewRiderModal(null) }}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Settings className="size-6 text-primary" /> 
                {viewRiderModal === 'rider_som' ? 'Rider de Som' :
                 viewRiderModal === 'rider_luz' ? 'Rider de Luz' :
                 viewRiderModal === 'rider_video' ? 'Rider de Vídeo' :
                 viewRiderModal === 'mapa_palco_url' ? 'Mapa de Palco' :
                 viewRiderModal === 'figurinos_url' ? 'Figurinos' : 'Visualizador'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              {viewRiderModal && typeof currentShow[viewRiderModal as keyof Espetaculo] === 'string' && (
                <div className="bg-slate-50 dark:bg-black/50 p-4 rounded-xl text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-medium">
                  {(() => {
                    const content = currentShow[viewRiderModal as keyof Espetaculo] as string;
                    try {
                      const data = JSON.parse(content);
                      return (
                        <div className="space-y-4">
                          {data.notas_gerais && (
                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white mb-1">Notas Gerais</h4>
                              <p className="text-sm">{data.notas_gerais}</p>
                            </div>
                          )}
                          {data.monitoracao && (
                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white mb-1">Monitoração</h4>
                              <p className="text-sm">{data.monitoracao}</p>
                            </div>
                          )}
                          {data.equipamentos_lista && data.equipamentos_lista.length > 0 && (
                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white mb-2">Equipamentos</h4>
                              <ul className="list-disc pl-5 text-sm space-y-1">
                                {data.equipamentos_lista.map((eq: any, idx: number) => (
                                  <li key={idx}>{eq.qtd}x {eq.nome} {eq.detalhes ? `(${eq.detalhes})` : ''}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {data.input_list_tabela && data.input_list_tabela.length > 0 && (
                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white mb-2">Input List</h4>
                              <table className="w-full text-sm text-left">
                                <thead className="bg-slate-200 dark:bg-slate-800">
                                  <tr><th className="p-2">CH</th><th className="p-2">Input</th><th className="p-2">Obs</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                  {data.input_list_tabela.map((eq: any, idx: number) => (
                                    <tr key={idx}><td className="p-2 font-bold">{eq.canal}</td><td className="p-2">{eq.equipamento}</td><td className="p-2 text-xs">{eq.obs}</td></tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    } catch (e) {
                      return content;
                    }
                  })()}
                </div>
              )}

              {viewRiderModal && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/10 pb-2">Anexos</h4>
                  {(() => {
                    let attachKey = '';
                    if (viewRiderModal === 'rider_som') attachKey = 'anexos_som';
                    else if (viewRiderModal === 'rider_luz') attachKey = 'anexos_luz';
                    else if (viewRiderModal === 'rider_video') attachKey = 'anexos_video';
                    else if (viewRiderModal === 'mapa_palco_url') attachKey = 'anexos_palco';
                    else if (viewRiderModal === 'figurinos_url') attachKey = 'anexos_figurino';

                    const anexosList = currentShow.assets_midia?.[attachKey] || [];
                    if (anexosList.length === 0) return <p className="text-sm text-slate-500">Nenhum anexo encontrado.</p>;

                    return (
                      <div className="grid grid-cols-2 gap-3">
                        {anexosList.map((anexo: any, index: number) => {
                          const url = typeof anexo === 'string' ? anexo : anexo.url;
                          const nome = typeof anexo === 'string' ? `Arquivo ${index + 1}` : anexo.nome;
                          return (
                            <a key={index} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 rounded-xl hover:bg-blue-100 transition-colors font-bold text-sm truncate">
                              <LinkIcon className="size-4 shrink-0" />
                              {nome}
                            </a>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW: WIZARD
  // ---------------------------------------------------------------------------
  if (view === "wizard") {
    return (
      <div className="-m-4 sm:-m-8 flex flex-col min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
        
        {/* Top Header Bar */}
        <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-4 sm:px-8 py-4 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                {isEditing ? <Pencil className="size-4 text-primary"/> : <Plus className="size-4 text-primary"/>} 
                {isEditing ? "Editar Espetáculo" : "Cadastro de Espetáculo"}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">Passo {step} de {totalSteps} • {progressPercent}% Concluído</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white" onClick={() => setView("list")}>
                Cancelar
              </Button>
              {step > 1 && (
                <Button variant="outline" size="sm" className="font-semibold" onClick={() => setStep(step - 1)}>
                  <ChevronLeft className="size-4 mr-1" /> Voltar
                </Button>
              )}
              {step < totalSteps ? (
                <Button size="sm" onClick={() => setStep(step + 1)} className="font-bold bg-primary hover:bg-primary/90 text-white shadow-md">
                  Próximo <ChevronRight className="size-4 ml-1" />
                </Button>
              ) : (
                <Button size="sm" onClick={saveWizard} className="font-bold bg-green-500 hover:bg-green-600 text-white shadow-md">
                  <Save className="size-4 mr-2" /> Salvar
                </Button>
              )}
            </div>
          </div>
          
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-300 ease-in-out" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
        
        {/* Wizard Content */}
        <div className="flex-1 p-6 sm:p-10 max-w-5xl mx-auto w-full">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-white/10 pb-3">Informações Básicas</h3>
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="font-semibold text-sm">Nome do Espetáculo *</Label>
                  <Input className="h-12 text-base font-semibold bg-white dark:bg-slate-900 shadow-sm" value={currentShow.nome_espetaculo} onChange={e => setCurrentShow({...currentShow, nome_espetaculo: e.target.value})} placeholder="Ex: O Fantasma da Ópera" />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-sm">Grupo / Cia</Label>
                  <Input className="h-10 text-sm bg-white dark:bg-slate-900 shadow-sm" value={currentShow.grupo_cia || ""} onChange={e => setCurrentShow({...currentShow, grupo_cia: e.target.value})} placeholder="Ex: Cia de Teatro X" />
                </div>
                <div className="grid sm:grid-cols-2 gap-5 pt-2">
                  <div className="space-y-2">
                    <Label className="font-semibold text-sm text-slate-700 dark:text-slate-300">Logo do Espetáculo</Label>
                    {currentShow.logo_espetaculo_url ? (
                      <div className="relative h-32 rounded-xl overflow-hidden border bg-white dark:bg-black shadow-sm">
                        <img src={currentShow.logo_espetaculo_url} className="w-full h-full object-contain" />
                        <Button size="icon" variant="destructive" className="absolute top-2 right-2 size-7" onClick={() => setCurrentShow({...currentShow, logo_espetaculo_url: null})}><Trash2 className="size-3"/></Button>
                      </div>
                    ) : (
                      <div className="h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-slate-400 relative hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors bg-white dark:bg-slate-900 shadow-sm">
                        <ImageIcon className="size-6 mb-2 opacity-50" />
                        <span className="text-xs font-semibold">Anexar Imagem</span>
                        <input type="file" accept="image/*" onChange={e => uploadLogo(e, "logo_espetaculo_url")} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-sm text-slate-700 dark:text-slate-300">Logo da Cia (Rodapés)</Label>
                    {currentShow.logo_cia_url ? (
                      <div className="relative h-32 rounded-xl overflow-hidden border bg-white dark:bg-black shadow-sm">
                        <img src={currentShow.logo_cia_url} className="w-full h-full object-contain" />
                        <Button size="icon" variant="destructive" className="absolute top-2 right-2 size-7" onClick={() => setCurrentShow({...currentShow, logo_cia_url: null})}><Trash2 className="size-3"/></Button>
                      </div>
                    ) : (
                      <div className="h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-slate-400 relative hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors bg-white dark:bg-slate-900 shadow-sm">
                        <ImageIcon className="size-6 mb-2 opacity-50" />
                        <span className="text-xs font-semibold">Anexar Imagem</span>
                        <input type="file" accept="image/*" onChange={e => uploadLogo(e, "logo_cia_url")} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-white/10 pb-3">Detalhes da Obra</h3>
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="font-semibold text-sm">Sinopse</Label>
                  <Textarea className="min-h-[140px] resize-none text-sm bg-white dark:bg-slate-900 shadow-sm" value={currentShow.sinopse || ""} onChange={e => setCurrentShow({...currentShow, sinopse: e.target.value})} placeholder="Escreva a sinopse..." />
                </div>
                <div className="grid sm:grid-cols-3 gap-5 pt-2">
                  <div className="space-y-2">
                    <Label className="font-semibold text-sm">Classificação Indicativa</Label>
                    <Input className="h-10 text-sm bg-white dark:bg-slate-900 shadow-sm" value={currentShow.classificacao_indicativa || ""} onChange={e => setCurrentShow({...currentShow, classificacao_indicativa: e.target.value})} placeholder="Ex: Livre" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-sm">Sugestão de Público</Label>
                    <Input className="h-10 text-sm bg-white dark:bg-slate-900 shadow-sm" value={currentShow.faixa_etaria || ""} onChange={e => setCurrentShow({...currentShow, faixa_etaria: e.target.value})} placeholder="Ex: Infanto-juvenil" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-sm">Duração Estimada</Label>
                    <Input className="h-10 text-sm bg-white dark:bg-slate-900 shadow-sm" value={currentShow.duracao || ""} onChange={e => setCurrentShow({...currentShow, duracao: e.target.value})} placeholder="Ex: 90 min" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-white/10 pb-3">Release de Imprensa</h3>
              <div className="space-y-2">
                <Label className="font-semibold text-sm text-slate-600">Texto Completo</Label>
                <Textarea className="min-h-[300px] resize-y text-sm p-4 leading-relaxed bg-white dark:bg-slate-900 shadow-sm" value={currentShow.release_text || ""} onChange={e => setCurrentShow({...currentShow, release_text: e.target.value})} placeholder="Cole aqui o texto completo de release do espetáculo..." />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-white/10 pb-3">Ficha Técnica</h3>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                <div className="grid sm:grid-cols-[1fr_2fr_auto] gap-3 items-end">
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-xs uppercase text-slate-500">Função</Label>
                    <Select value={novaFicha.funcao} onValueChange={v => setNovaFicha({...novaFicha, funcao: v})}>
                      <SelectTrigger className="h-10 text-sm bg-white dark:bg-black font-semibold"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        {FICHA_FUNCOES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <Label className="font-semibold text-xs uppercase text-slate-500">
                      {novaFicha.funcao === "Outros" ? "Qual função? E quem é?" : "Nome do Profissional"}
                    </Label>
                    <div className="flex gap-2">
                      {novaFicha.funcao === "Outros" && (
                        <Input className="w-1/3 h-10 text-sm bg-white dark:bg-black font-semibold" placeholder="Função..." value={novaFicha.outroNome} onChange={e => setNovaFicha({...novaFicha, outroNome: e.target.value})} />
                      )}
                      <Input className="flex-1 h-10 text-sm bg-white dark:bg-black font-semibold" placeholder="Nome..." value={novaFicha.nome} onChange={e => setNovaFicha({...novaFicha, nome: e.target.value})} />
                    </div>
                  </div>
                  <Button onClick={addFicha} type="button" className="h-10 bg-primary hover:bg-primary/90 text-white font-bold px-4 shadow-sm text-sm"><Plus className="size-4 mr-1"/> Adicionar</Button>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                {Object.entries(
                  (currentShow.ficha_tecnica || []).reduce((acc, item, idx) => {
                    if (!acc[item.funcao]) acc[item.funcao] = [];
                    acc[item.funcao].push({ ...item, originalIndex: idx });
                    return acc;
                  }, {} as Record<string, {funcao: string, nome: string, originalIndex: number}[]>)
                ).map(([funcao, items]) => (
                  <div key={funcao} className="bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 dark:bg-slate-950 px-3 py-2 border-b border-slate-100 dark:border-white/5 font-black text-primary text-[10px] uppercase tracking-wider">
                      {funcao}
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                      {items.map(item => (
                        <div key={item.originalIndex} className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                          <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{item.nome}</span>
                          <Button variant="ghost" size="icon" onClick={() => {
                            const ns = [...(currentShow.ficha_tecnica||[])];
                            ns.splice(item.originalIndex, 1);
                            setCurrentShow({...currentShow, ficha_tecnica: ns});
                          }} className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 size-7"><X className="size-4"/></Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {(!currentShow.ficha_tecnica || currentShow.ficha_tecnica.length === 0) && (
                  <div className="col-span-2 text-center py-8 text-slate-400 font-semibold border-2 border-dashed rounded-xl bg-slate-50 dark:bg-slate-900/50 text-sm">
                    Nenhum profissional na ficha técnica.
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <section className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                <h3 className="text-lg font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Users className="text-primary size-5"/> Personagens / Atores</h3>
                <div className="flex gap-2 mb-4">
                  <Input className="h-10 text-sm bg-slate-50 dark:bg-black font-semibold" placeholder="Nome do personagem..." value={novoPersonagem} onChange={e => setNovoPersonagem(e.target.value)} onKeyDown={e => { if(e.key==='Enter') { setCurrentShow({...currentShow, personagens: [...(currentShow.personagens||[]), novoPersonagem]}); setNovoPersonagem(""); }}} />
                  <Button className="h-10 px-6 font-bold text-sm shadow-sm" onClick={() => { if(novoPersonagem) { setCurrentShow({...currentShow, personagens: [...(currentShow.personagens||[]), novoPersonagem]}); setNovoPersonagem(""); } }}><Plus className="size-4 mr-1"/> Adicionar</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentShow.personagens?.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                      {p}
                      <button onClick={() => { const ns = [...(currentShow.personagens||[])]; ns.splice(i,1); setCurrentShow({...currentShow, personagens: ns}); }} className="hover:text-red-200"><X className="size-3"/></button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                <h3 className="text-lg font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Music className="text-emerald-500 size-5"/> Instrumentos / Banda</h3>
                <div className="flex gap-2 mb-4">
                  <Input className="h-10 text-sm bg-slate-50 dark:bg-black font-semibold" placeholder="Instrumento ou Músico..." value={novoInstrumento} onChange={e => setNovoInstrumento(e.target.value)} onKeyDown={e => { if(e.key==='Enter') { setCurrentShow({...currentShow, instrumentos: [...(currentShow.instrumentos||[]), novoInstrumento]}); setNovoInstrumento(""); }}} />
                  <Button className="h-10 px-6 font-bold text-sm shadow-sm" onClick={() => { if(novoInstrumento) { setCurrentShow({...currentShow, instrumentos: [...(currentShow.instrumentos||[]), novoInstrumento]}); setNovoInstrumento(""); } }}><Plus className="size-4 mr-1"/> Adicionar</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentShow.instrumentos?.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                      {p}
                      <button onClick={() => { const ns = [...(currentShow.instrumentos||[])]; ns.splice(i,1); setCurrentShow({...currentShow, instrumentos: ns}); }} className="hover:text-red-200"><X className="size-3"/></button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-white/10 pb-3 flex items-center gap-2">
                <Mic2 className="size-5 text-emerald-500" /> Rider de Áudio / Som Cadastrado
              </h3>
              
              <div className="space-y-6">

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold text-sm">Lista de Equipamentos (Padrão)</Label>
                    <Button type="button" onClick={addSomEquipamento} size="sm" variant="secondary"><Plus className="size-4 mr-2" /> Adicionar Equipamento</Button>
                  </div>
                  <div className="space-y-3">
                    {(somData.equipamentos_lista || []).length === 0 ? (
                      <div className="text-center p-6 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl text-slate-500 text-sm">
                        Nenhum equipamento listado.
                      </div>
                    ) : (
                      (somData.equipamentos_lista || []).map((eq: any, index: number) => (
                        <div key={eq.id} className="flex flex-col sm:flex-row gap-3 p-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl items-start sm:items-center">
                          <div className="w-8 shrink-0 flex items-center justify-center font-bold text-slate-400">
                            #{index + 1}
                          </div>
                          <div className="w-full sm:w-20">
                            <Input value={eq.qtd} onChange={e => updateSomEquipamento(eq.id, 'qtd', e.target.value)} placeholder="Qtd" className="bg-white dark:bg-black/50 text-center font-bold" />
                          </div>
                          <div className="w-full sm:flex-1">
                            <Input value={eq.nome} onChange={e => updateSomEquipamento(eq.id, 'nome', e.target.value)} placeholder="Nome do Equipamento (Ex: Shure SM58)" className="bg-white dark:bg-black/50" />
                          </div>
                          <div className="w-full sm:flex-1">
                            <Input value={eq.detalhes} onChange={e => updateSomEquipamento(eq.id, 'detalhes', e.target.value)} placeholder="Detalhes (Opcional)" className="bg-white dark:bg-black/50" />
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeSomEquipamento(eq.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0 self-end sm:self-auto"><Trash2 className="size-4"/></Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold text-sm">Input List (Tabela)</Label>
                    <Button type="button" onClick={addSomInputList} size="sm" variant="secondary"><Plus className="size-4 mr-2" /> Adicionar Canal</Button>
                  </div>
                  <div className="space-y-3">
                    {(somData.input_list_tabela || []).length === 0 ? (
                      <div className="text-center p-6 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl text-slate-500 text-sm">
                        Nenhum canal na Input List.
                      </div>
                    ) : (
                      (somData.input_list_tabela || []).map((eq: any) => (
                        <div key={eq.id} className="flex flex-col sm:flex-row gap-3 p-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl items-start sm:items-center">
                          <div className="w-full sm:w-24">
                            <Label className="sm:hidden text-xs text-slate-500 block mb-1">Canal</Label>
                            <Input value={eq.canal} onChange={e => updateSomInputList(eq.id, 'canal', e.target.value)} placeholder="Ex: 01" className="bg-white dark:bg-black/50 font-bold font-mono" />
                          </div>
                          <div className="w-full sm:flex-1">
                            <Label className="sm:hidden text-xs text-slate-500 block mb-1">Equipamento/Fonte</Label>
                            <Input value={eq.equipamento} onChange={e => updateSomInputList(eq.id, 'equipamento', e.target.value)} placeholder="Ex: Bumbo (Shure Beta 52)" className="bg-white dark:bg-black/50" />
                          </div>
                          <div className="w-full sm:flex-1">
                            <Label className="sm:hidden text-xs text-slate-500 block mb-1">Observações</Label>
                            <Input value={eq.obs} onChange={e => updateSomInputList(eq.id, 'obs', e.target.value)} placeholder="Ex: Direct Box / Phantom Power" className="bg-white dark:bg-black/50" />
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeSomInputList(eq.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0 self-end sm:self-auto"><Trash2 className="size-4"/></Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
                  <div className="space-y-2">
                    <Label className="font-semibold text-sm">Descritivo / Notas Gerais</Label>
                    <Textarea className="min-h-[120px] resize-none text-sm bg-white dark:bg-slate-900 shadow-sm" value={somData.notas_gerais || ''} onChange={e => updateSomData('notas_gerais', e.target.value)} placeholder="Informações adicionais do Rider..." />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-sm">Monitoração / Vias</Label>
                    <Textarea className="min-h-[120px] resize-none text-sm bg-white dark:bg-slate-900 shadow-sm" value={somData.monitoracao || ''} onChange={e => updateSomData('monitoracao', e.target.value)} placeholder="Ex: 4 vias In-Ear..." />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5">
                  <Label className="font-semibold text-sm">Arquivos do Rider (PDFs ou Imagens)</Label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {(currentShow.assets_midia?.anexos_som || []).map((anexo: any, index: number) => {
                        const url = typeof anexo === 'string' ? anexo : anexo.url;
                        const nome = typeof anexo === 'string' ? `Arquivo ${index + 1}` : anexo.nome;
                        
                        return (
                          <div key={index} className="border rounded-xl p-3 flex flex-col gap-2 bg-white dark:bg-slate-900 shadow-sm">
                            <div className="flex justify-between items-center">
                              <a href={url} target="_blank" rel="noreferrer" className="font-bold text-sm text-blue-500 hover:underline flex items-center gap-2 truncate max-w-[80%]">
                                <LinkIcon className="size-4 shrink-0"/> Ver Arquivo
                              </a>
                              <Button variant="ghost" size="icon" className="text-red-500 shrink-0 size-8" onClick={() => {
                                const m = {...(currentShow.assets_midia||{})};
                                m.anexos_som = m.anexos_som.filter((_: any, i: number) => i !== index);
                                setCurrentShow({...currentShow, assets_midia: m});
                              }}><X className="size-4"/></Button>
                            </div>
                            <Input 
                              value={nome}
                              onChange={(e) => {
                                const m = {...(currentShow.assets_midia||{})};
                                const lista = [...(m.anexos_som || [])];
                                const current = lista[index];
                                if (typeof current === 'string') {
                                  lista[index] = { url: current, nome: e.target.value };
                                } else {
                                  lista[index] = { ...current, nome: e.target.value };
                                }
                                m.anexos_som = lista;
                                setCurrentShow({...currentShow, assets_midia: m});
                              }}
                              placeholder="Nome do arquivo..."
                              className="h-8 text-sm bg-slate-50 dark:bg-black/50"
                            />
                          </div>
                        );
                      })}
                    
                    <div 
                        className="border-2 border-dashed rounded-xl h-[52px] flex items-center justify-center text-slate-400 relative hover:bg-slate-50 dark:hover:bg-slate-900/50 bg-white dark:bg-slate-900 shadow-sm transition-colors cursor-pointer"
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const file = e.dataTransfer.files?.[0]; if (file) handleRiderSomUpload(file); }}
                      >
                        <span className="text-sm font-semibold flex items-center"><Plus className="size-4 mr-1"/> Anexar Arquivo (ou arraste aqui)</span>
                        <input type="file" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleRiderSomUpload(file);
                        }} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                  </div>
                </div>

              </div>
            </div>
          )}
          {step === 7 && renderTechStep("Rider de Iluminação", "Mapa de luz, equipamentos e afinação", Lightbulb, "rider_luz", "anexo_luz", "Detalhes de refletores, mapa de DMX, cores, efeitos...")}
          {step === 8 && renderTechStep("Rider de Vídeo", "Projetores, painéis de LED e mappings", Clapperboard, "rider_video", "anexo_video", "Resolução, cabeamento, projetores exigidos...")}
          {step === 9 && renderTechStep("Mapa de Palco", "Disposição cenográfica e praticáveis", Map, "mapa_palco_url", "anexo_palco", "Instruções de montagem, dimensões mínimas...")}
          {step === 10 && renderTechStep("Figurinos & Camarins", "Rider de camarim, espelhos e araras", Users, "figurinos_url", "anexo_figurino", "Toalhas, espelhos de corpo, água, ferro de passar...")}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW: DASHBOARD
  // ---------------------------------------------------------------------------
  if (view === "dashboard" && currentShow) {
    return (
      <div className="-m-4 sm:-m-8 flex flex-col bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
        
        {/* Banner */}
        <div className="relative h-64 bg-slate-900 shrink-0 flex items-end px-4 sm:px-12 py-8 border-b-4 border-primary">
          {currentShow.logo_espetaculo_url && (
            <img src={currentShow.logo_espetaculo_url} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm mix-blend-screen" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
          
          <Button variant="secondary" size="sm" onClick={() => setView("list")} className="absolute top-6 left-6 font-bold z-20">
            <ChevronLeft className="size-4 mr-1"/> Voltar para Lista
          </Button>

          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-end w-full gap-6">
            <div className="flex items-center gap-6">
              <div className="size-28 rounded-2xl bg-white dark:bg-slate-800 p-2 shadow-2xl border-4 border-slate-950 overflow-hidden shrink-0">
                {currentShow.logo_espetaculo_url ? (
                  <img src={currentShow.logo_espetaculo_url} className="w-full h-full object-contain" />
                ) : (
                  <Music className="w-full h-full text-slate-300" />
                )}
              </div>
              <div className="mb-1">
                <h2 className="text-3xl font-black text-white leading-tight drop-shadow-md">{currentShow.nome_espetaculo}</h2>
                <p className="text-lg font-bold text-primary mt-1 drop-shadow-md">{currentShow.grupo_cia}</p>
                <div className="flex items-center gap-2 mt-3 text-xs font-bold text-slate-200">
                  {currentShow.duracao && <span className="bg-white/20 px-2 py-1 rounded-md backdrop-blur-sm shadow-sm">{currentShow.duracao}</span>}
                  {currentShow.classificacao_indicativa && <span className="bg-white/20 px-2 py-1 rounded-md backdrop-blur-sm shadow-sm">{currentShow.classificacao_indicativa}</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => { setIsEditing(true); setOriginalName(currentShow.nome_espetaculo); setStep(1); setView("wizard"); }} className="font-bold h-10 px-4 shadow-xl text-slate-900 hover:bg-white text-sm">
                <Pencil className="size-4 mr-2" /> Editar Obra
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-12 grid lg:grid-cols-2 gap-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <div className="space-y-8">
            <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
              <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-white/5 pb-3">
                <FileText className="size-5 text-primary" /> Sinopse
              </h3>
              <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap text-sm leading-relaxed">{currentShow.sinopse || "Sinopse não informada."}</p>
            </section>
            
            <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
              <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-white/5 pb-3">
                <Users className="size-5 text-primary" /> Ficha Técnica
              </h3>
              {currentShow.ficha_tecnica && currentShow.ficha_tecnica.length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(
                    currentShow.ficha_tecnica.reduce((acc, item) => {
                      if (!acc[item.funcao]) acc[item.funcao] = [];
                      acc[item.funcao].push(item.nome);
                      return acc;
                    }, {} as Record<string, string[]>)
                  ).map(([funcao, nomes]) => (
                    <div key={funcao} className="bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-white/5 overflow-hidden">
                      <div className="bg-slate-100/50 dark:bg-slate-900 px-3 py-2 border-b border-slate-100 dark:border-white/5 font-black text-primary text-[10px] uppercase tracking-wider">
                        {funcao}
                      </div>
                      <div className="px-3 py-2 font-bold text-slate-600 dark:text-slate-300 text-sm flex flex-col gap-1">
                        {nomes.map((n, i) => <span key={i}>{n}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 font-semibold text-sm">Nenhuma ficha técnica cadastrada.</p>
              )}
            </section>
          </div>

          <div className="space-y-8">
            <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
              <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-white/5 pb-3">
                <Settings className="size-5 text-primary" /> Necessidades Técnicas Cadastradas
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                    { title: "Rider de Som", icon: Mic2, color: "text-emerald-500", key: "rider_som", attach: "anexos_som" },
                    { title: "Rider de Luz", icon: Lightbulb, color: "text-amber-500", key: "rider_luz", attach: "anexos_luz" },
                    { title: "Rider Vídeo", icon: Clapperboard, color: "text-purple-500", key: "rider_video", attach: "anexos_video" },
                    { title: "Mapa Palco", icon: Map, color: "text-blue-500", key: "mapa_palco_url", attach: "anexos_palco" },
                    { title: "Figurinos", icon: Users, color: "text-pink-500", key: "figurinos_url", attach: "anexos_figurino" },
                  ].map((item, i) => {
                  const hasText = !!currentShow[item.key as keyof Espetaculo];
                  const hasAttach = !!currentShow.assets_midia?.[item.attach];
                  const Icon = item.icon;
                  return (
                    <div 
                      key={i} 
                      onClick={() => { if (hasText || hasAttach) setViewRiderModal(item.key) }}
                      className={`bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-white/5 flex flex-col items-center justify-center text-center ${(hasText || hasAttach) ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors' : 'opacity-70'}`}
                    >
                      <Icon className={`size-8 mb-2 ${(hasText || hasAttach) ? item.color : 'text-slate-300 dark:text-slate-700'}`} />
                      <span className="font-black text-slate-700 dark:text-slate-300 text-sm">{item.title}</span>
                      <div className="flex gap-1.5 mt-2">
                        {hasText && <span className="text-[9px] uppercase font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded-sm">Texto</span>}
                        {hasAttach && <span className="text-[9px] uppercase font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-sm">Anexo</span>}
                        {!hasText && !hasAttach && <span className="text-[9px] uppercase font-bold text-slate-400">Pendente</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
              <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-white/5 pb-3">
                <Music className="size-5 text-primary" /> Elenco e Banda
              </h3>
              <div className="flex flex-wrap gap-2">
                {currentShow.personagens?.map(p => (
                  <span key={p} className="bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">{p}</span>
                ))}
                {currentShow.instrumentos?.map(i => (
                  <span key={i} className="bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">{i}</span>
                ))}
                {(!currentShow.personagens?.length && !currentShow.instrumentos?.length) && (
                  <span className="text-sm font-semibold text-slate-400">Nenhum integrante cadastrado.</span>
                )}
              </div>
            </section>
            
            <div className="pt-8 border-t border-slate-200 dark:border-white/10 flex justify-end">
              <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 font-bold h-10 px-4 text-sm" onClick={() => handleDelete(currentShow.nome_espetaculo)}>
                <Trash2 className="size-4 mr-2" /> Excluir Espetáculo
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
