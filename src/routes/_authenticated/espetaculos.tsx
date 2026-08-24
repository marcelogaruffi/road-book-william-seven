import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Music, Plus, Trash2, Pencil, Save, X, Users, Upload, ChevronRight, ChevronLeft, Eye, Clapperboard, Map, Mic2, Lightbulb, FileText, Settings, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

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
};

const FICHA_FUNCOES = [
  "Adaptação", "Cenografia", "Direção", "Direção de Arte", "Edição de Imagens", "Figurinos", "Fotografia",
  "Preparação Corporal", "Preparação Vocal", "Produção Executiva", "Produção Musical", "Outros"
];

function EspetaculosPage() {
  const [espetaculos, setEspetaculos] = useState<Espetaculo[]>([]);
  const [loading, setLoading] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [currentShow, setCurrentShow] = useState<Espetaculo>(emptyShow);
  const [step, setStep] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [originalName, setOriginalName] = useState("");

  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [selectedShow, setSelectedShow] = useState<Espetaculo | null>(null);

  // Ficha Técnica state for step 4
  const [novaFicha, setNovaFicha] = useState({ funcao: "", nome: "", outroNome: "" });
  const [novoPersonagem, setNovoPersonagem] = useState("");
  const [novoInstrumento, setNovoInstrumento] = useState("");

  useEffect(() => {
    fetchEspetaculos();
  }, []);

  async function fetchEspetaculos() {
    setLoading(true);
    const { data, error } = await supabase
      .from("templates_espetaculos")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast.error(error.message);
    } else {
      setEspetaculos(data || []);
    }
    setLoading(false);
  }

  const handleFileUpload = async (file: File, path: string) => {
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) throw new Error("Sessão expirada");
    
    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = `${uid}/espetaculos/${Date.now()}-${path}.${ext}`;
    
    const { error } = await supabase.storage.from("midias-eventos").upload(filePath, file);
    if (error) throw error;
    
    const { data } = supabase.storage.from("midias-eventos").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const uploadLogoEsp = async (e: any) => {
    if (!e.target.files?.[0]) return;
    try {
      toast.loading("Enviando logo do espetáculo...");
      const url = await handleFileUpload(e.target.files[0], "logo_esp");
      setCurrentShow(s => ({ ...s, logo_espetaculo_url: url }));
      toast.dismiss();
      toast.success("Logo enviada!");
    } catch (err: any) {
      toast.dismiss();
      toast.error("Erro: " + err.message);
    }
  };

  const uploadLogoCia = async (e: any) => {
    if (!e.target.files?.[0]) return;
    try {
      toast.loading("Enviando logo da Cia...");
      const url = await handleFileUpload(e.target.files[0], "logo_cia");
      setCurrentShow(s => ({ ...s, logo_cia_url: url }));
      toast.dismiss();
      toast.success("Logo enviada!");
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

  const removeFicha = (idx: number) => {
    const list = [...(currentShow.ficha_tecnica || [])];
    list.splice(idx, 1);
    setCurrentShow({ ...currentShow, ficha_tecnica: list });
  };

  const saveWizard = async () => {
    if (!currentShow.nome_espetaculo.trim()) {
      toast.error("Nome do espetáculo é obrigatório");
      setStep(1);
      return;
    }
    try {
      toast.loading("Salvando espetáculo...");
      
      const payload = {
        nome_espetaculo: currentShow.nome_espetaculo,
        grupo_cia: currentShow.grupo_cia,
        logo_espetaculo_url: currentShow.logo_espetaculo_url,
        logo_cia_url: currentShow.logo_cia_url,
        sinopse: currentShow.sinopse,
        classificacao_indicativa: currentShow.classificacao_indicativa,
        faixa_etaria: currentShow.faixa_etaria,
        duracao: currentShow.duracao,
        release_text: currentShow.release_text,
        ficha_tecnica: currentShow.ficha_tecnica,
        personagens: currentShow.personagens,
        instrumentos: currentShow.instrumentos,
        rider_som: currentShow.rider_som,
        rider_luz: currentShow.rider_luz,
        rider_video: currentShow.rider_video,
        mapa_palco_url: currentShow.mapa_palco_url,
        figurinos_url: currentShow.figurinos_url,
      };

      if (isEditing) {
        if (originalName !== currentShow.nome_espetaculo) {
          // Can't easily change PK in Supabase without cascade if it's used as FK, but if it's not we can just delete/insert or update.
          // Updating a PK string might fail if RLS or cascades are tricky. We'll attempt an update.
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
      setWizardOpen(false);
      fetchEspetaculos();
      if (dashboardOpen) {
        setSelectedShow({ ...currentShow, ...payload });
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error("Erro ao salvar: " + error.message);
    }
  };

  const openNew = () => {
    setCurrentShow(emptyShow);
    setIsEditing(false);
    setStep(1);
    setWizardOpen(true);
  };

  const openEdit = (show: Espetaculo) => {
    setCurrentShow({ ...emptyShow, ...show });
    setOriginalName(show.nome_espetaculo);
    setIsEditing(true);
    setStep(1);
    setWizardOpen(true);
  };

  const openDashboard = (show: Espetaculo) => {
    setSelectedShow(show);
    setDashboardOpen(true);
  };

  const handleDelete = async (nome: string) => {
    if (!confirm("Tem certeza que deseja excluir o espetáculo " + nome + "?")) return;
    const { error } = await supabase.from("templates_espetaculos").delete().eq("nome_espetaculo", nome);
    if (error) toast.error(error.message);
    else {
      toast.success("Excluído com sucesso");
      if (selectedShow?.nome_espetaculo === nome) setDashboardOpen(false);
      fetchEspetaculos();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Meus Espetáculos
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Cadastre os shows do seu catálogo com Ficha Técnica, Riders e Informações Básicas.
          </p>
        </div>
        <Button onClick={openNew} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg h-12 px-6 rounded-xl">
          <Plus className="mr-2 h-5 w-5" /> Novo Espetáculo
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Carregando...</div>
      ) : espetaculos.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-white/10">
          <Music className="size-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">Nenhum espetáculo cadastrado</h3>
          <p className="text-slate-500 mt-2">Clique em "Novo Espetáculo" para começar a montar o seu catálogo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {espetaculos.map((show) => (
            <Card key={show.nome_espetaculo} className="overflow-hidden hover:shadow-xl transition-all cursor-pointer group border-slate-200 dark:border-white/10" onClick={() => openDashboard(show)}>
              <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800 relative overflow-hidden flex items-center justify-center">
                {show.logo_espetaculo_url ? (
                  <img src={show.logo_espetaculo_url} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <Music className="size-12 text-slate-300 dark:text-slate-600" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-black text-white truncate">{show.nome_espetaculo}</h3>
                  <p className="text-sm font-semibold text-white/80 truncate">{show.grupo_cia || "Sem companhia"}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* DASHBOARD DO ESPETÁCULO */}
      <Dialog open={dashboardOpen} onOpenChange={setDashboardOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-50 dark:bg-slate-950 border-0 shadow-2xl">
          {selectedShow && (
            <div className="flex flex-col max-h-[90vh]">
              <div className="relative h-48 bg-slate-900 shrink-0 flex items-end p-8">
                {selectedShow.logo_espetaculo_url && (
                  <img src={selectedShow.logo_espetaculo_url} className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
                
                <div className="relative z-10 flex justify-between items-end w-full gap-4">
                  <div className="flex items-center gap-6">
                    <div className="size-24 rounded-2xl bg-white dark:bg-slate-800 p-2 shadow-xl border-4 border-slate-950 overflow-hidden shrink-0">
                      {selectedShow.logo_espetaculo_url ? (
                        <img src={selectedShow.logo_espetaculo_url} className="w-full h-full object-contain" />
                      ) : (
                        <Music className="w-full h-full text-slate-300" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-white leading-none">{selectedShow.nome_espetaculo}</h2>
                      <p className="text-lg font-bold text-primary mt-1">{selectedShow.grupo_cia}</p>
                      <div className="flex items-center gap-3 mt-3 text-sm font-semibold text-slate-300">
                        {selectedShow.duracao && <span className="bg-white/10 px-2 py-1 rounded-md">{selectedShow.duracao}</span>}
                        {selectedShow.classificacao_indicativa && <span className="bg-white/10 px-2 py-1 rounded-md">{selectedShow.classificacao_indicativa}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => openEdit(selectedShow)} className="font-bold">
                      <Pencil className="size-4 mr-2" /> Editar Padrões
                    </Button>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-8">
                    <section>
                      <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2 mb-4">
                        <FileText className="size-5 text-primary" /> Sinopse
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{selectedShow.sinopse || "Não informada."}</p>
                    </section>
                    
                    <section>
                      <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2 mb-4">
                        <Users className="size-5 text-primary" /> Ficha Técnica
                      </h3>
                      {selectedShow.ficha_tecnica && selectedShow.ficha_tecnica.length > 0 ? (
                        <ul className="space-y-2">
                          {selectedShow.ficha_tecnica.map((item, i) => (
                            <li key={i} className="flex justify-between items-center text-sm bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-white/5">
                              <span className="font-bold text-slate-700 dark:text-slate-300">{item.funcao}</span>
                              <span className="text-slate-500">{item.nome}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-500">Nenhuma ficha técnica cadastrada.</p>
                      )}
                    </section>
                  </div>

                  <div className="space-y-8">
                    <section>
                      <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2 mb-4">
                        <Settings className="size-5 text-primary" /> Necessidades Técnicas Padrão
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-white/5 flex flex-col items-center justify-center text-center">
                          <Mic2 className={`size-8 mb-2 ${selectedShow.rider_som ? 'text-green-500' : 'text-slate-300'}`} />
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Rider de Som</span>
                          <span className="text-xs font-semibold text-slate-400">{selectedShow.rider_som ? 'Cadastrado' : 'Pendente'}</span>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-white/5 flex flex-col items-center justify-center text-center">
                          <Lightbulb className={`size-8 mb-2 ${selectedShow.rider_luz ? 'text-amber-500' : 'text-slate-300'}`} />
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Rider de Luz</span>
                          <span className="text-xs font-semibold text-slate-400">{selectedShow.rider_luz ? 'Cadastrado' : 'Pendente'}</span>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-white/5 flex flex-col items-center justify-center text-center">
                          <Map className={`size-8 mb-2 ${selectedShow.mapa_palco_url ? 'text-blue-500' : 'text-slate-300'}`} />
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Mapa de Palco</span>
                          <span className="text-xs font-semibold text-slate-400">{selectedShow.mapa_palco_url ? 'Cadastrado' : 'Pendente'}</span>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-white/5 flex flex-col items-center justify-center text-center">
                          <Clapperboard className={`size-8 mb-2 ${selectedShow.rider_video ? 'text-purple-500' : 'text-slate-300'}`} />
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Rider Vídeo</span>
                          <span className="text-xs font-semibold text-slate-400">{selectedShow.rider_video ? 'Cadastrado' : 'Pendente'}</span>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2 mb-4">
                        <Users className="size-5 text-primary" /> Elenco e Banda
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedShow.personagens?.map(p => (
                          <span key={p} className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 text-xs font-bold px-3 py-1.5 rounded-full">{p}</span>
                        ))}
                        {selectedShow.instrumentos?.map(i => (
                          <span key={i} className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-full">{i}</span>
                        ))}
                        {(!selectedShow.personagens?.length && !selectedShow.instrumentos?.length) && (
                          <span className="text-sm text-slate-500">Nenhum integrante cadastrado.</span>
                        )}
                      </div>
                    </section>
                  </div>
                </div>
              </ScrollArea>
              
              <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900 flex justify-end">
                <Button variant="outline" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(selectedShow.nome_espetaculo)}>
                  <Trash2 className="size-4 mr-2" /> Excluir Espetáculo
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* WIZARD MODAL */}
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-w-3xl min-h-[600px] flex flex-col p-0 overflow-hidden bg-slate-50 dark:bg-slate-950 border-0 shadow-2xl">
          <div className="flex bg-slate-900 text-white p-6 shrink-0 items-center justify-between">
            <div>
              <h2 className="text-2xl font-black">{isEditing ? "Editar Espetáculo" : "Novo Espetáculo"}</h2>
              <p className="text-slate-400 font-semibold mt-1">Passo {step} de 6</p>
            </div>
            <div className="flex gap-2">
              {[1,2,3,4,5,6].map(s => (
                <div key={s} className={`h-2 w-8 rounded-full transition-colors ${s === step ? 'bg-primary' : s < step ? 'bg-primary/40' : 'bg-slate-800'}`} />
              ))}
            </div>
          </div>
          
          <ScrollArea className="flex-1 p-6 sm:p-10">
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white border-b pb-2">Informações Básicas</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-bold">Nome do Espetáculo *</Label>
                    <Input className="h-12 text-lg font-bold" value={currentShow.nome_espetaculo} onChange={e => setCurrentShow({...currentShow, nome_espetaculo: e.target.value})} placeholder="Ex: O Fantasma da Ópera" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Grupo / Cia</Label>
                    <Input className="h-12" value={currentShow.grupo_cia || ""} onChange={e => setCurrentShow({...currentShow, grupo_cia: e.target.value})} placeholder="Ex: Cia de Teatro X" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-2 border p-4 rounded-xl bg-white dark:bg-slate-900">
                      <Label className="font-bold text-slate-700 dark:text-slate-300">Logo do Espetáculo</Label>
                      {currentShow.logo_espetaculo_url ? (
                        <div className="relative h-32 rounded-lg overflow-hidden border">
                          <img src={currentShow.logo_espetaculo_url} className="w-full h-full object-contain" />
                          <Button size="icon" variant="destructive" className="absolute top-2 right-2 size-8" onClick={() => setCurrentShow({...currentShow, logo_espetaculo_url: null})}><Trash2 className="size-4"/></Button>
                        </div>
                      ) : (
                        <div className="h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-slate-400 relative">
                          <ImageIcon className="size-8 mb-2 opacity-50" />
                          <span className="text-sm font-semibold">Anexar Logo</span>
                          <input type="file" accept="image/*" onChange={uploadLogoEsp} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 border p-4 rounded-xl bg-white dark:bg-slate-900">
                      <Label className="font-bold text-slate-700 dark:text-slate-300">Logo da Companhia (Rodapés)</Label>
                      {currentShow.logo_cia_url ? (
                        <div className="relative h-32 rounded-lg overflow-hidden border">
                          <img src={currentShow.logo_cia_url} className="w-full h-full object-contain" />
                          <Button size="icon" variant="destructive" className="absolute top-2 right-2 size-8" onClick={() => setCurrentShow({...currentShow, logo_cia_url: null})}><Trash2 className="size-4"/></Button>
                        </div>
                      ) : (
                        <div className="h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-slate-400 relative">
                          <ImageIcon className="size-8 mb-2 opacity-50" />
                          <span className="text-sm font-semibold">Anexar Logo Cia</span>
                          <input type="file" accept="image/*" onChange={uploadLogoCia} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white border-b pb-2">Detalhes do Espetáculo</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-bold">Sinopse</Label>
                    <Textarea className="min-h-[150px] resize-none" value={currentShow.sinopse || ""} onChange={e => setCurrentShow({...currentShow, sinopse: e.target.value})} placeholder="Escreva a sinopse do espetáculo..." />
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label className="font-bold">Classificação Indicativa</Label>
                      <Input value={currentShow.classificacao_indicativa || ""} onChange={e => setCurrentShow({...currentShow, classificacao_indicativa: e.target.value})} placeholder="Ex: Livre, 14 anos" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold">Sugestão de Público</Label>
                      <Input value={currentShow.faixa_etaria || ""} onChange={e => setCurrentShow({...currentShow, faixa_etaria: e.target.value})} placeholder="Ex: Infanto-juvenil" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold">Duração Estimada</Label>
                      <Input value={currentShow.duracao || ""} onChange={e => setCurrentShow({...currentShow, duracao: e.target.value})} placeholder="Ex: 90 minutos" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white border-b pb-2">Release para Imprensa</h3>
                <div className="space-y-2">
                  <Label className="font-bold text-slate-600">Release Completo</Label>
                  <Textarea className="min-h-[300px] resize-y" value={currentShow.release_text || ""} onChange={e => setCurrentShow({...currentShow, release_text: e.target.value})} placeholder="Cole aqui o texto completo de release do espetáculo para ser usado em materiais de imprensa e redes sociais..." />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white border-b pb-2">Ficha Técnica</h3>
                <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/10 space-y-4">
                  <div className="grid sm:grid-cols-[1fr_2fr_auto] gap-3">
                    <div className="space-y-2">
                      <Label className="font-bold text-xs uppercase text-slate-500">Função</Label>
                      <Select value={novaFicha.funcao} onValueChange={v => setNovaFicha({...novaFicha, funcao: v})}>
                        <SelectTrigger className="bg-white dark:bg-black"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                          {FICHA_FUNCOES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2 flex-1">
                      <Label className="font-bold text-xs uppercase text-slate-500">
                        {novaFicha.funcao === "Outros" ? "Qual função? E quem é?" : "Nome do Profissional"}
                      </Label>
                      <div className="flex gap-2">
                        {novaFicha.funcao === "Outros" && (
                          <Input className="w-1/3 bg-white dark:bg-black" placeholder="Função..." value={novaFicha.outroNome} onChange={e => setNovaFicha({...novaFicha, outroNome: e.target.value})} />
                        )}
                        <Input className="flex-1 bg-white dark:bg-black" placeholder="Nome..." value={novaFicha.nome} onChange={e => setNovaFicha({...novaFicha, nome: e.target.value})} />
                      </div>
                    </div>

                    <div className="pt-6">
                      <Button onClick={addFicha} type="button" className="bg-primary hover:bg-primary/90 text-white font-bold"><Plus className="size-4 mr-2"/> Adicionar</Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mt-6">
                  {currentShow.ficha_tecnica?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-white dark:bg-slate-900 rounded-lg border shadow-sm">
                      <div className="flex items-center gap-4">
                        <span className="font-black text-slate-700 dark:text-slate-300 w-48 truncate">{item.funcao}</span>
                        <span className="text-slate-600 dark:text-slate-400">{item.nome}</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeFicha(idx)} className="text-slate-400 hover:text-red-500"><Trash2 className="size-4"/></Button>
                    </div>
                  ))}
                  {(!currentShow.ficha_tecnica || currentShow.ficha_tecnica.length === 0) && (
                    <div className="text-center py-8 text-slate-400 font-semibold border-2 border-dashed rounded-xl">
                      Nenhum profissional adicionado à ficha técnica.
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <section>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white border-b pb-2 mb-4">Personagens / Atores</h3>
                  <div className="flex gap-2 mb-4">
                    <Input className="h-12" placeholder="Nome do personagem..." value={novoPersonagem} onChange={e => setNovoPersonagem(e.target.value)} onKeyDown={e => { if(e.key==='Enter') { setCurrentShow({...currentShow, personagens: [...(currentShow.personagens||[]), novoPersonagem]}); setNovoPersonagem(""); }}} />
                    <Button className="h-12 px-6" onClick={() => { if(novoPersonagem) { setCurrentShow({...currentShow, personagens: [...(currentShow.personagens||[]), novoPersonagem]}); setNovoPersonagem(""); } }}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentShow.personagens?.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 px-3 py-1.5 rounded-full text-sm font-bold shadow-sm">
                        {p}
                        <button onClick={() => { const ns = [...(currentShow.personagens||[])]; ns.splice(i,1); setCurrentShow({...currentShow, personagens: ns}); }} className="hover:text-red-500"><X className="size-3"/></button>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white border-b pb-2 mb-4">Instrumentos / Banda</h3>
                  <div className="flex gap-2 mb-4">
                    <Input className="h-12" placeholder="Instrumento ou Músico..." value={novoInstrumento} onChange={e => setNovoInstrumento(e.target.value)} onKeyDown={e => { if(e.key==='Enter') { setCurrentShow({...currentShow, instrumentos: [...(currentShow.instrumentos||[]), novoInstrumento]}); setNovoInstrumento(""); }}} />
                    <Button className="h-12 px-6" onClick={() => { if(novoInstrumento) { setCurrentShow({...currentShow, instrumentos: [...(currentShow.instrumentos||[]), novoInstrumento]}); setNovoInstrumento(""); } }}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentShow.instrumentos?.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 px-3 py-1.5 rounded-full text-sm font-bold shadow-sm">
                        {p}
                        <button onClick={() => { const ns = [...(currentShow.instrumentos||[])]; ns.splice(i,1); setCurrentShow({...currentShow, instrumentos: ns}); }} className="hover:text-red-500"><X className="size-3"/></button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white border-b pb-2">Necessidades Técnicas (Padrão)</h3>
                <p className="text-sm text-slate-500 mb-6">Estas informações serão carregadas automaticamente como padrão ao criar um novo evento para este espetáculo.</p>
                
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2 border p-4 rounded-xl bg-white dark:bg-slate-900">
                      <Label className="font-bold flex items-center gap-2"><Mic2 className="size-4 text-primary"/> Rider de Som</Label>
                      <Textarea className="resize-y" placeholder="Link do GDrive, equipamentos ou inputs..." value={currentShow.rider_som || ""} onChange={e => setCurrentShow({...currentShow, rider_som: e.target.value})} />
                    </div>
                    <div className="space-y-2 border p-4 rounded-xl bg-white dark:bg-slate-900">
                      <Label className="font-bold flex items-center gap-2"><Lightbulb className="size-4 text-amber-500"/> Rider de Luz</Label>
                      <Textarea className="resize-y" placeholder="Canais, mapas, links..." value={currentShow.rider_luz || ""} onChange={e => setCurrentShow({...currentShow, rider_luz: e.target.value})} />
                    </div>
                    <div className="space-y-2 border p-4 rounded-xl bg-white dark:bg-slate-900">
                      <Label className="font-bold flex items-center gap-2"><Clapperboard className="size-4 text-purple-500"/> Rider de Vídeo</Label>
                      <Textarea className="resize-y" placeholder="Projetores, telões, links..." value={currentShow.rider_video || ""} onChange={e => setCurrentShow({...currentShow, rider_video: e.target.value})} />
                    </div>
                    <div className="space-y-2 border p-4 rounded-xl bg-white dark:bg-slate-900">
                      <Label className="font-bold flex items-center gap-2"><Map className="size-4 text-blue-500"/> Mapa de Palco (URL / Link)</Label>
                      <Input placeholder="Cole um link do mapa de palco..." value={currentShow.mapa_palco_url || ""} onChange={e => setCurrentShow({...currentShow, mapa_palco_url: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>

          <div className="p-4 bg-white dark:bg-black border-t border-slate-200 dark:border-white/10 flex justify-between shrink-0">
            <Button variant="ghost" className="font-bold" onClick={() => step > 1 ? setStep(step - 1) : setWizardOpen(false)}>
              {step > 1 ? <><ChevronLeft className="size-4 mr-2" /> Voltar</> : "Cancelar"}
            </Button>
            
            {step < 6 ? (
              <Button onClick={() => setStep(step + 1)} className="font-bold px-8 bg-primary hover:bg-primary/90 text-white">
                Próximo <ChevronRight className="size-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={saveWizard} className="font-bold px-8 bg-green-500 hover:bg-green-600 text-white">
                <Save className="size-4 mr-2" /> Salvar Espetáculo
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
