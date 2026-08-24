import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Music, Plus, Trash2, Pencil, Save, X, Users, ChevronRight, ChevronLeft, Clapperboard, Map, Mic2, Lightbulb, FileText, Settings, Image as ImageIcon, FileUp, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

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
  const [originalName, setOriginalName] = useState("");

  const [novaFicha, setNovaFicha] = useState({ funcao: "", nome: "", outroNome: "" });
  const [novoPersonagem, setNovoPersonagem] = useState("");
  const [novoInstrumento, setNovoInstrumento] = useState("");

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
    
    // Clean file name
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `\${uid}/\${folder}/\${Date.now()}-\${cleanName}`;
    
    // Fix bucket name from midias-eventos to midias_eventos
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
    const textValue = (currentShow[textKey] as string) || "";
    const attachmentUrl = currentShow.assets_midia?.[attachmentKey];

    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center gap-4 border-b pb-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary"><Icon className="size-8"/></div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white">{title}</h3>
            <p className="text-slate-500">{desc}</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 pt-4">
          <div className="space-y-3">
            <Label className="font-bold text-lg">Detalhes em Texto</Label>
            <Textarea 
              className="min-h-[250px] resize-none text-base" 
              placeholder={placeholder}
              value={textValue} 
              onChange={e => setCurrentShow({...currentShow, [textKey]: e.target.value})} 
            />
          </div>
          
          <div className="space-y-3">
            <Label className="font-bold text-lg">Arquivo Anexo (PDF, Imagem)</Label>
            {attachmentUrl ? (
              <div className="border rounded-xl p-6 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-900 gap-4 h-[250px]">
                <FileText className="size-16 text-primary" />
                <div>
                  <p className="font-bold text-slate-700 dark:text-slate-300">Arquivo Anexado</p>
                  <a href={attachmentUrl} target="_blank" className="text-sm text-blue-500 hover:underline flex items-center justify-center mt-1"><LinkIcon className="size-3 mr-1"/> Ver Arquivo</a>
                </div>
                <Button variant="destructive" onClick={() => {
                  const m = {...(currentShow.assets_midia||{})};
                  delete m[attachmentKey];
                  setCurrentShow({...currentShow, assets_midia: m});
                }}>
                  Remover Anexo
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-xl h-[250px] flex flex-col items-center justify-center text-slate-400 relative hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <FileUp className="size-12 mb-4 opacity-50" />
                <span className="font-semibold text-lg">Clique para anexar arquivo</span>
                <span className="text-sm">Tamanho máx: 10MB</span>
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
          <Button onClick={() => { setCurrentShow(emptyShow); setIsEditing(false); setStep(1); setView("wizard"); }} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg h-12 px-6 rounded-xl">
            <Plus className="mr-2 h-5 w-5" /> Cadastrar Novo Espetáculo
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400">Carregando...</div>
        ) : espetaculos.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-white/10">
            <Music className="size-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">Nenhum espetáculo cadastrado</h3>
            <p className="text-slate-500 mt-2">Clique em "Novo Espetáculo" para começar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {espetaculos.map((show) => (
              <Card key={show.nome_espetaculo} className="overflow-hidden hover:shadow-xl transition-all cursor-pointer group border-slate-200 dark:border-white/10" onClick={() => { setCurrentShow(show); setView("dashboard"); }}>
                <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800 relative overflow-hidden flex items-center justify-center">
                  {show.logo_espetaculo_url ? (
                    <img src={show.logo_espetaculo_url} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <Music className="size-12 text-slate-300 dark:text-slate-600" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-black text-white truncate shadow-black drop-shadow-md">{show.nome_espetaculo}</h3>
                    <p className="text-sm font-semibold text-white/90 truncate drop-shadow-md">{show.grupo_cia || "Sem companhia"}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW: WIZARD
  // ---------------------------------------------------------------------------
  if (view === "wizard") {
    const totalSteps = 10;
    return (
      <div className="max-w-5xl mx-auto min-h-[85vh] flex flex-col bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden relative">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-black">{isEditing ? "Editar Espetáculo" : "Cadastro de Espetáculo"}</h2>
              <p className="text-slate-400 font-semibold mt-1">Passo {step} de {totalSteps}</p>
            </div>
            <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => setView("list")}><X className="size-6"/></Button>
          </div>
          <div className="flex gap-1 h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            {Array.from({length: totalSteps}).map((_, i) => (
              <div key={i} className={`flex-1 h-full \${i + 1 <= step ? 'bg-primary' : 'bg-transparent'}`} />
            ))}
          </div>
        </div>
        
        {/* Body */}
        <div className="flex-1 p-6 md:p-10 overflow-y-auto pb-32">
          {step === 1 && (
            <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white border-b pb-4">Informações Básicas</h3>
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="font-bold text-lg">Nome do Espetáculo *</Label>
                  <Input className="h-14 text-xl font-bold bg-slate-50 dark:bg-slate-900" value={currentShow.nome_espetaculo} onChange={e => setCurrentShow({...currentShow, nome_espetaculo: e.target.value})} placeholder="Ex: O Fantasma da Ópera" />
                </div>
                <div className="space-y-3">
                  <Label className="font-bold text-lg">Grupo / Cia</Label>
                  <Input className="h-14 text-lg bg-slate-50 dark:bg-slate-900" value={currentShow.grupo_cia || ""} onChange={e => setCurrentShow({...currentShow, grupo_cia: e.target.value})} placeholder="Ex: Cia de Teatro X" />
                </div>
                <div className="grid sm:grid-cols-2 gap-6 pt-4">
                  <div className="space-y-3 border p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                    <Label className="font-bold text-slate-700 dark:text-slate-300 text-base">Logo do Espetáculo</Label>
                    {currentShow.logo_espetaculo_url ? (
                      <div className="relative h-40 rounded-xl overflow-hidden border bg-white dark:bg-black">
                        <img src={currentShow.logo_espetaculo_url} className="w-full h-full object-contain" />
                        <Button size="icon" variant="destructive" className="absolute top-2 right-2 size-8" onClick={() => setCurrentShow({...currentShow, logo_espetaculo_url: null})}><Trash2 className="size-4"/></Button>
                      </div>
                    ) : (
                      <div className="h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-slate-400 relative hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <ImageIcon className="size-10 mb-2 opacity-50" />
                        <span className="text-sm font-bold">Anexar Imagem</span>
                        <input type="file" accept="image/*" onChange={e => uploadLogo(e, "logo_espetaculo_url")} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 border p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                    <Label className="font-bold text-slate-700 dark:text-slate-300 text-base">Logo da Cia (Rodapés)</Label>
                    {currentShow.logo_cia_url ? (
                      <div className="relative h-40 rounded-xl overflow-hidden border bg-white dark:bg-black">
                        <img src={currentShow.logo_cia_url} className="w-full h-full object-contain" />
                        <Button size="icon" variant="destructive" className="absolute top-2 right-2 size-8" onClick={() => setCurrentShow({...currentShow, logo_cia_url: null})}><Trash2 className="size-4"/></Button>
                      </div>
                    ) : (
                      <div className="h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-slate-400 relative hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <ImageIcon className="size-10 mb-2 opacity-50" />
                        <span className="text-sm font-bold">Anexar Imagem</span>
                        <input type="file" accept="image/*" onChange={e => uploadLogo(e, "logo_cia_url")} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white border-b pb-4">Detalhes da Obra</h3>
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="font-bold text-lg">Sinopse</Label>
                  <Textarea className="min-h-[180px] resize-none text-base bg-slate-50 dark:bg-slate-900" value={currentShow.sinopse || ""} onChange={e => setCurrentShow({...currentShow, sinopse: e.target.value})} placeholder="Escreva a sinopse..." />
                </div>
                <div className="grid sm:grid-cols-3 gap-6 pt-2">
                  <div className="space-y-3">
                    <Label className="font-bold">Classificação Indicativa</Label>
                    <Input className="h-12 bg-slate-50 dark:bg-slate-900" value={currentShow.classificacao_indicativa || ""} onChange={e => setCurrentShow({...currentShow, classificacao_indicativa: e.target.value})} placeholder="Ex: Livre" />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold">Sugestão de Público</Label>
                    <Input className="h-12 bg-slate-50 dark:bg-slate-900" value={currentShow.faixa_etaria || ""} onChange={e => setCurrentShow({...currentShow, faixa_etaria: e.target.value})} placeholder="Ex: Infanto-juvenil" />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold">Duração Estimada</Label>
                    <Input className="h-12 bg-slate-50 dark:bg-slate-900" value={currentShow.duracao || ""} onChange={e => setCurrentShow({...currentShow, duracao: e.target.value})} placeholder="Ex: 90 minutos" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white border-b pb-4">Release de Imprensa</h3>
              <div className="space-y-3">
                <Label className="font-bold text-slate-600 text-lg">Texto Completo</Label>
                <Textarea className="min-h-[400px] resize-y text-base p-6 leading-relaxed bg-slate-50 dark:bg-slate-900" value={currentShow.release_text || ""} onChange={e => setCurrentShow({...currentShow, release_text: e.target.value})} placeholder="Cole aqui o texto completo de release do espetáculo..." />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white border-b pb-4">Ficha Técnica</h3>
              <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-inner">
                <div className="grid sm:grid-cols-[1fr_2fr_auto] gap-4 items-end">
                  <div className="space-y-2">
                    <Label className="font-bold text-sm uppercase text-slate-500">Função</Label>
                    <Select value={novaFicha.funcao} onValueChange={v => setNovaFicha({...novaFicha, funcao: v})}>
                      <SelectTrigger className="h-12 bg-white dark:bg-black font-semibold"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        {FICHA_FUNCOES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label className="font-bold text-sm uppercase text-slate-500">
                      {novaFicha.funcao === "Outros" ? "Qual função? E quem é?" : "Nome do Profissional"}
                    </Label>
                    <div className="flex gap-2">
                      {novaFicha.funcao === "Outros" && (
                        <Input className="w-1/3 h-12 bg-white dark:bg-black font-semibold" placeholder="Função..." value={novaFicha.outroNome} onChange={e => setNovaFicha({...novaFicha, outroNome: e.target.value})} />
                      )}
                      <Input className="flex-1 h-12 bg-white dark:bg-black font-semibold" placeholder="Nome do profissional..." value={novaFicha.nome} onChange={e => setNovaFicha({...novaFicha, nome: e.target.value})} />
                    </div>
                  </div>
                  <Button onClick={addFicha} type="button" className="h-12 bg-primary hover:bg-primary/90 text-white font-bold px-6 shadow-md"><Plus className="size-5 mr-2"/> Add</Button>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-3 mt-6">
                {currentShow.ficha_tecnica?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
                    <div>
                      <div className="font-black text-primary text-sm uppercase">{item.funcao}</div>
                      <div className="font-bold text-slate-700 dark:text-slate-200 text-lg">{item.nome}</div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeFicha(idx)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"><Trash2 className="size-5"/></Button>
                  </div>
                ))}
                {(!currentShow.ficha_tecnica || currentShow.ficha_tecnica.length === 0) && (
                  <div className="col-span-2 text-center py-12 text-slate-400 font-semibold border-2 border-dashed rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                    Nenhum profissional na ficha técnica.
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-10 max-w-4xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
              <section className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/10">
                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2"><Users className="text-primary size-6"/> Personagens / Atores</h3>
                <div className="flex gap-3 mb-6">
                  <Input className="h-14 text-lg bg-white dark:bg-black font-semibold" placeholder="Nome do personagem..." value={novoPersonagem} onChange={e => setNovoPersonagem(e.target.value)} onKeyDown={e => { if(e.key==='Enter') { setCurrentShow({...currentShow, personagens: [...(currentShow.personagens||[]), novoPersonagem]}); setNovoPersonagem(""); }}} />
                  <Button className="h-14 px-8 font-bold text-lg shadow-md" onClick={() => { if(novoPersonagem) { setCurrentShow({...currentShow, personagens: [...(currentShow.personagens||[]), novoPersonagem]}); setNovoPersonagem(""); } }}><Plus className="size-5 mr-1"/> Add</Button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {currentShow.personagens?.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
                      {p}
                      <button onClick={() => { const ns = [...(currentShow.personagens||[])]; ns.splice(i,1); setCurrentShow({...currentShow, personagens: ns}); }} className="hover:text-red-200"><X className="size-4"/></button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/10">
                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2"><Music className="text-emerald-500 size-6"/> Instrumentos / Banda</h3>
                <div className="flex gap-3 mb-6">
                  <Input className="h-14 text-lg bg-white dark:bg-black font-semibold" placeholder="Instrumento ou Músico..." value={novoInstrumento} onChange={e => setNovoInstrumento(e.target.value)} onKeyDown={e => { if(e.key==='Enter') { setCurrentShow({...currentShow, instrumentos: [...(currentShow.instrumentos||[]), novoInstrumento]}); setNovoInstrumento(""); }}} />
                  <Button className="h-14 px-8 font-bold text-lg shadow-md" onClick={() => { if(novoInstrumento) { setCurrentShow({...currentShow, instrumentos: [...(currentShow.instrumentos||[]), novoInstrumento]}); setNovoInstrumento(""); } }}><Plus className="size-5 mr-1"/> Add</Button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {currentShow.instrumentos?.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
                      {p}
                      <button onClick={() => { const ns = [...(currentShow.instrumentos||[])]; ns.splice(i,1); setCurrentShow({...currentShow, instrumentos: ns}); }} className="hover:text-red-200"><X className="size-4"/></button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {step === 6 && renderTechStep("Rider de Áudio / Som", "Padrão de microfones, mesas e canais", Mic2, "rider_som", "anexo_som", "Detalhes de inputs, consoles exigidos, side fills...")}
          {step === 7 && renderTechStep("Rider de Iluminação", "Mapa de luz, equipamentos e afinação", Lightbulb, "rider_luz", "anexo_luz", "Detalhes de refletores, mapa de DMX, cores, efeitos...")}
          {step === 8 && renderTechStep("Rider de Vídeo", "Projetores, painéis de LED e mappings", Clapperboard, "rider_video", "anexo_video", "Resolução, cabeamento, projetores exigidos...")}
          {step === 9 && renderTechStep("Mapa de Palco", "Disposição cenográfica e praticáveis", Map, "mapa_palco_url", "anexo_palco", "Instruções de montagem, dimensões mínimas...")}
          {step === 10 && renderTechStep("Figurinos & Camarins", "Rider de camarim, espelhos e araras", Users, "figurinos_url", "anexo_figurino", "Toalhas, espelhos de corpo, água, ferro de passar...")}
        </div>
        
        {/* Fixed Footer Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-t border-slate-200 dark:border-white/10 flex justify-between shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-10">
          <Button variant="outline" className="h-14 px-6 text-lg font-bold" onClick={() => step > 1 ? setStep(step - 1) : setView("list")}>
            {step > 1 ? <><ChevronLeft className="size-5 mr-2" /> Voltar</> : "Cancelar"}
          </Button>
          
          {step < totalSteps ? (
            <Button onClick={() => setStep(step + 1)} className="h-14 px-10 text-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-xl">
              Próximo <ChevronRight className="size-5 ml-2" />
            </Button>
          ) : (
            <Button onClick={saveWizard} className="h-14 px-10 text-lg font-bold bg-green-500 hover:bg-green-600 text-white shadow-xl animate-pulse">
              <Save className="size-5 mr-2" /> Salvar Espetáculo
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW: DASHBOARD
  // ---------------------------------------------------------------------------
  if (view === "dashboard" && currentShow) {
    return (
      <div className="max-w-6xl mx-auto flex flex-col bg-slate-50 dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden min-h-[85vh]">
        <div className="relative h-64 bg-slate-900 shrink-0 flex items-end p-8 border-b-4 border-primary">
          {currentShow.logo_espetaculo_url && (
            <img src={currentShow.logo_espetaculo_url} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm mix-blend-screen" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
          
          <div className="relative z-10 flex justify-between items-end w-full gap-6">
            <div className="flex items-center gap-8">
              <div className="size-32 rounded-3xl bg-white dark:bg-slate-800 p-3 shadow-2xl border-4 border-slate-950 overflow-hidden shrink-0">
                {currentShow.logo_espetaculo_url ? (
                  <img src={currentShow.logo_espetaculo_url} className="w-full h-full object-contain" />
                ) : (
                  <Music className="w-full h-full text-slate-300" />
                )}
              </div>
              <div className="mb-2">
                <h2 className="text-4xl font-black text-white leading-tight drop-shadow-md">{currentShow.nome_espetaculo}</h2>
                <p className="text-xl font-bold text-primary mt-1 drop-shadow-md">{currentShow.grupo_cia}</p>
                <div className="flex items-center gap-3 mt-4 text-sm font-bold text-slate-200">
                  {currentShow.duracao && <span className="bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm shadow-sm">{currentShow.duracao}</span>}
                  {currentShow.classificacao_indicativa && <span className="bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm shadow-sm">{currentShow.classificacao_indicativa}</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mb-2">
              <Button variant="secondary" onClick={() => { setIsEditing(true); setOriginalName(currentShow.nome_espetaculo); setStep(1); setView("wizard"); }} className="font-bold h-12 px-6 shadow-xl text-slate-900 hover:bg-white">
                <Pencil className="size-4 mr-2" /> Editar Obra
              </Button>
              <Button variant="ghost" onClick={() => setView("list")} className="font-bold h-12 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20">
                <X className="size-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 p-8 grid lg:grid-cols-2 gap-10 overflow-y-auto">
          <div className="space-y-10">
            <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3 mb-6">
                <FileText className="size-6 text-primary" /> Sinopse
              </h3>
              <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap text-lg leading-relaxed">{currentShow.sinopse || "Sinopse não informada."}</p>
            </section>
            
            <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3 mb-6">
                <Users className="size-6 text-primary" /> Ficha Técnica
              </h3>
              {currentShow.ficha_tecnica && currentShow.ficha_tecnica.length > 0 ? (
                <ul className="space-y-3">
                  {currentShow.ficha_tecnica.map((item, i) => (
                    <li key={i} className="flex justify-between items-center text-base bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                      <span className="font-black text-slate-700 dark:text-slate-300 uppercase text-sm tracking-wide">{item.funcao}</span>
                      <span className="font-bold text-slate-500">{item.nome}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 font-semibold">Nenhuma ficha técnica cadastrada.</p>
              )}
            </section>
          </div>

          <div className="space-y-10">
            <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3 mb-6">
                <Settings className="size-6 text-primary" /> Compilado de Necessidades Técnicas
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { title: "Rider de Som", icon: Mic2, color: "text-emerald-500", key: "rider_som", attach: "anexo_som" },
                  { title: "Rider de Luz", icon: Lightbulb, color: "text-amber-500", key: "rider_luz", attach: "anexo_luz" },
                  { title: "Rider Vídeo", icon: Clapperboard, color: "text-purple-500", key: "rider_video", attach: "anexo_video" },
                  { title: "Mapa Palco", icon: Map, color: "text-blue-500", key: "mapa_palco_url", attach: "anexo_palco" },
                  { title: "Figurinos", icon: Users, color: "text-pink-500", key: "figurinos_url", attach: "anexo_figurino" },
                ].map((item, i) => {
                  const hasText = !!currentShow[item.key as keyof Espetaculo];
                  const hasAttach = !!currentShow.assets_midia?.[item.attach];
                  const Icon = item.icon;
                  return (
                    <div key={i} className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-white/5 flex flex-col items-center justify-center text-center">
                      <Icon className={`size-10 mb-3 \${(hasText || hasAttach) ? item.color : 'text-slate-300 dark:text-slate-700'}`} />
                      <span className="font-black text-slate-700 dark:text-slate-300">{item.title}</span>
                      <div className="flex gap-2 mt-2">
                        {hasText && <span className="text-[10px] uppercase font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-md">Texto</span>}
                        {hasAttach && <span className="text-[10px] uppercase font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md">Anexo</span>}
                        {!hasText && !hasAttach && <span className="text-[10px] uppercase font-bold text-slate-400">Pendente</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3 mb-6">
                <Music className="size-6 text-primary" /> Elenco e Banda
              </h3>
              <div className="flex flex-wrap gap-3">
                {currentShow.personagens?.map(p => (
                  <span key={p} className="bg-indigo-500 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-sm">{p}</span>
                ))}
                {currentShow.instrumentos?.map(i => (
                  <span key={i} className="bg-emerald-500 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-sm">{i}</span>
                ))}
                {(!currentShow.personagens?.length && !currentShow.instrumentos?.length) && (
                  <span className="text-lg font-semibold text-slate-400">Nenhum integrante cadastrado.</span>
                )}
              </div>
            </section>
          </div>
        </div>
        
        <div className="p-6 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-white/10 flex justify-end shrink-0">
          <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 font-bold h-12 px-6" onClick={() => handleDelete(currentShow.nome_espetaculo)}>
            <Trash2 className="size-5 mr-2" /> Excluir Espetáculo Definitivamente
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
