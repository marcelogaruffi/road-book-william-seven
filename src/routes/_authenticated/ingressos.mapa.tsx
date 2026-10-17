import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GridEventos } from "@/components/GridEventos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ImageCropperModal } from "@/components/ImageCropperModal";
import { 
  Ticket, 
  MapPin, 
  Plus, 
  Layers, 
  Eye, 
  Save, 
  Trash2, 
  Check, 
  Building2, 
  Upload, 
  Info,
  Calendar,
  Image as ImageIcon,
  DoorOpen,
  Camera,
  Crop
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/ingressos/mapa")({
  head: () => ({ meta: [{ title: "Mapa de Assentos - Áxis - Gestão de Teatros e Shows" }] }),
  component: MapaAssentosPage,
});

export type SetorConfig = {
  id: string;
  nome: string; // Ex: Plateia Central, Frisas Ímpares, Camarote 1º Andar
  nivel: "terreo" | "1_andar" | "2_andar" | "camarote" | "frisa" | "vip";
  capacidadeTotal: number;
  regraNumeracao: "par_impar" | "sequencial" | "livre";
  fileirasInfo?: string; // Ex: "Fileiras A a P, 22 a 26 cadeiras por fila com corredor central"
  portaAcessoSugerida?: string; // Ex: "Porta Ímpar (Esquerda)" ou "Geral"
  observacoes?: string; // Ex: "Fileira D tem 4 assentos PCD nas pontas"
};

export type MapaTeatroEvento = {
  eventoId: string;
  teatroNome: string;
  cidade: string;
  capacidadeTotal: number;
  imagemPlantaUrl: string;
  imagemIngressoUrl?: string; // Foto oficial calibrada para a capa do bilhete (Recomendado: 1200x500px, proporção 2.4:1)
  observacoesGerais?: string;
  setores: SetorConfig[];
};

export type TeatroCadastrado = {
  id: string;
  nome: string;
  cidade: string;
  capacidadeTotal: number;
  imagemPlantaUrl?: string;
  imagemIngressoUrl?: string;
  setores: SetorConfig[];
};

function MapaAssentosPage() {
  const [selectedEventoId, setSelectedEventoId] = useState<string>("");
  const [activeEvento, setActiveEvento] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [teatrosSalvos, setTeatrosSalvos] = useState<TeatroCadastrado[]>([]);

  // Dados do Mapa do Evento Selecionado
  const [teatroNome, setTeatroNome] = useState<string>("");
  const [imagemPlantaUrl, setImagemPlantaUrl] = useState<string>("");
  const [imagemIngressoUrl, setImagemIngressoUrl] = useState<string>("");
  const [observacoesGerais, setObservacoesGerais] = useState<string>("");
  const [setores, setSetores] = useState<SetorConfig[]>([]);

  // Modais
  const [modalSetorOpen, setModalSetorOpen] = useState(false);
  const [editingSetorId, setEditingSetorId] = useState<string | null>(null);
  const [modalImagemOpen, setModalImagemOpen] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [rawImageToCrop, setRawImageToCrop] = useState<string>("");

  // Form do Setor
  const [setorNome, setSetorNome] = useState("");
  const [setorNivel, setSetorNivel] = useState<SetorConfig["nivel"]>("terreo");
  const [setorCapacidade, setSetorCapacidade] = useState<number>(100);
  const [setorRegra, setSetorRegra] = useState<SetorConfig["regraNumeracao"]>("par_impar");
  const [setorFileirasInfo, setSetorFileirasInfo] = useState("");
  const [setorPorta, setSetorPorta] = useState("");
  const [setorObs, setSetorObs] = useState("");

  // Carregar Teatros Padrões já cadastrados
  useEffect(() => {
    carregarTeatrosCadastrados();
  }, []);

  async function carregarTeatrosCadastrados() {
    const salvos = localStorage.getItem("axis_catalogo_teatros");
    let catalogo: TeatroCadastrado[] = [];
    if (salvos) {
      try {
        catalogo = JSON.parse(salvos);
      } catch (e) {
        console.error(e);
      }
    }

    if (catalogo.length === 0) {
      try {
        const { data: evs } = await supabase.from("eventos").select("id, cidade, local").not("local", "is", null);
        const uniqueTeatrosMap = new Map<string, TeatroCadastrado>();

        if (evs && evs.length > 0) {
          evs.forEach((ev) => {
            const nomeT = ev.local?.trim();
            if (nomeT && !uniqueTeatrosMap.has(nomeT)) {
              uniqueTeatrosMap.set(nomeT, {
                id: `teatro_${nomeT.toLowerCase().replace(/\s+/g, "_")}`,
                nome: nomeT,
                cidade: ev.cidade || "",
                capacidadeTotal: 450,
                imagemPlantaUrl: "",
                setores: [
                  {
                    id: "s_plateia",
                    nome: "Plateia Baixa (Térreo)",
                    nivel: "terreo",
                    capacidadeTotal: 300,
                    regraNumeracao: "par_impar",
                    fileirasInfo: "Fileiras A a M (Par à direita, Ímpar à esquerda)",
                    portaAcessoSugerida: "Portas A e B",
                    observacoes: "Corredor central divisório"
                  },
                  {
                    id: "s_balcao",
                    nome: "Balcão Nobre",
                    nivel: "1_andar",
                    capacidadeTotal: 150,
                    regraNumeracao: "par_impar",
                    fileirasInfo: "Fileiras A a F",
                    portaAcessoSugerida: "Porta Superior 1º Andar"
                  }
                ]
              });
            }
          });
        }

        if (!uniqueTeatrosMap.has("Teatro Barreto Júnior")) {
          uniqueTeatrosMap.set("Teatro Barreto Júnior", {
            id: "teatro_barreto_junior",
            nome: "Teatro Barreto Júnior",
            cidade: "Recife / PE",
            capacidadeTotal: 450,
            imagemPlantaUrl: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80",
            setores: [
              {
                id: "s_barreto_plateia",
                nome: "Plateia Central (Térreo)",
                nivel: "terreo",
                capacidadeTotal: 320,
                regraNumeracao: "par_impar",
                fileirasInfo: "Fileiras A a O • 20 a 24 poltronas por fila",
                portaAcessoSugerida: "Portas Laterais (Ímpar à esquerda, Par à direita)",
                observacoes: "Poltronas PCD na Fileira A (assentos 01 e 02)"
              },
              {
                id: "s_barreto_frisas",
                nome: "Frisas Térreo",
                nivel: "frisa",
                capacidadeTotal: 40,
                regraNumeracao: "sequencial",
                fileirasInfo: "Frisas 1 a 6 com 6 lugares cada",
                portaAcessoSugerida: "Acesso Lateral Palco"
              },
              {
                id: "s_barreto_camarote",
                nome: "Camarotes Superiores",
                nivel: "camarote",
                capacidadeTotal: 90,
                regraNumeracao: "sequencial",
                fileirasInfo: "Camarotes 1 a 8",
                portaAcessoSugerida: "Escadaria Principal 1º Andar"
              }
            ]
          });
        }

        catalogo = Array.from(uniqueTeatrosMap.values());
        localStorage.setItem("axis_catalogo_teatros", JSON.stringify(catalogo));
      } catch (e) {
        console.error(e);
      }
    }

    setTeatrosSalvos(catalogo);
  }

  // Ao selecionar um evento da grade
  const handleSelectEvento = async (eventoId: string, rbId?: any, fullEvento?: any) => {
    setSelectedEventoId(eventoId);
    setLoading(true);

    try {
      let ev = fullEvento;
      if (!ev) {
        const { data } = await supabase.from("eventos").select("*").eq("id", eventoId).single();
        ev = data;
      }
      setActiveEvento(ev);

      // Carregar mapa salvo para este evento
      const storageKey = `axis_mapa_evento_${eventoId}`;
      const salvo = localStorage.getItem(storageKey);

      if (salvo) {
        const parsed: MapaTeatroEvento = JSON.parse(salvo);
        setTeatroNome(parsed.teatroNome || ev?.local || "Teatro do Evento");
        setImagemPlantaUrl(parsed.imagemPlantaUrl || "");
        setImagemIngressoUrl(parsed.imagemIngressoUrl || "");
        setObservacoesGerais(parsed.observacoesGerais || "");
        setSetores(parsed.setores || []);
      } else {
        const tNome = ev?.local || "";
        const teatroPadrao = teatrosSalvos.find(t => t.nome.toLowerCase() === tNome.toLowerCase()) || teatrosSalvos[0];

        setTeatroNome(tNome || teatroPadrao?.nome || "Teatro do Evento");
        setImagemPlantaUrl(teatroPadrao?.imagemPlantaUrl || "");
        setImagemIngressoUrl(teatroPadrao?.imagemIngressoUrl || "");
        setObservacoesGerais(
          `Planta e distribuição de poltronas para o evento em ${ev?.cidade || "Praça"}.`
        );
        setSetores(teatroPadrao?.setores || []);

        salvarNoStorage(eventoId, {
          eventoId,
          teatroNome: tNome || teatroPadrao?.nome || "Teatro do Evento",
          cidade: ev?.cidade || "",
          capacidadeTotal: teatroPadrao?.capacidadeTotal || 400,
          imagemPlantaUrl: teatroPadrao?.imagemPlantaUrl || "",
          imagemIngressoUrl: teatroPadrao?.imagemIngressoUrl || "",
          observacoesGerais: `Planta e distribuição de poltronas para o evento em ${ev?.cidade || "Praça"}.`,
          setores: teatroPadrao?.setores || []
        });
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar dados do evento.");
    } finally {
      setLoading(false);
    }
  };

  const salvarNoStorage = (evId: string, dados: MapaTeatroEvento) => {
    localStorage.setItem(`axis_mapa_evento_${evId}`, JSON.stringify(dados));
    localStorage.setItem(`planta_teatro_${evId}`, JSON.stringify({
      teatro: dados.teatroNome,
      setores: dados.setores,
      imagemIngressoUrl: dados.imagemIngressoUrl
    }));
  };

  const handleSalvarMapa = () => {
    if (!selectedEventoId) return;

    const capacidadeTotal = setores.reduce((acc, s) => acc + (Number(s.capacidadeTotal) || 0), 0);

    const dados: MapaTeatroEvento = {
      eventoId: selectedEventoId,
      teatroNome: teatroNome.trim() || activeEvento?.local || "Teatro do Evento",
      cidade: activeEvento?.cidade || "",
      capacidadeTotal,
      imagemPlantaUrl: imagemPlantaUrl.trim(),
      imagemIngressoUrl: imagemIngressoUrl.trim(),
      observacoesGerais: observacoesGerais.trim(),
      setores
    };

    salvarNoStorage(selectedEventoId, dados);

    if (teatroNome.trim()) {
      const catalogoAtual = [...teatrosSalvos];
      const idx = catalogoAtual.findIndex(t => t.nome.toLowerCase() === teatroNome.trim().toLowerCase());
      const novoRegistroTeatro: TeatroCadastrado = {
        id: idx >= 0 ? catalogoAtual[idx].id : `teatro_${Date.now()}`,
        nome: teatroNome.trim(),
        cidade: activeEvento?.cidade || "",
        capacidadeTotal,
        imagemPlantaUrl: imagemPlantaUrl.trim(),
        imagemIngressoUrl: imagemIngressoUrl.trim(),
        setores
      };

      if (idx >= 0) {
        catalogoAtual[idx] = novoRegistroTeatro;
      } else {
        catalogoAtual.push(novoRegistroTeatro);
      }
      setTeatrosSalvos(catalogoAtual);
      localStorage.setItem("axis_catalogo_teatros", JSON.stringify(catalogoAtual));
    }

    toast.success("Mapa e foto do ingresso salvos com sucesso!");
  };

  // Importar Padrão de Teatro já cadastrado
  const handlePuxarPadraoTeatro = (teatroId: string) => {
    const achado = teatrosSalvos.find(t => t.id === teatroId);
    if (!achado) return;

    if (!confirm(`Deseja carregar a estrutura do "${achado.nome}" para este evento?`)) return;

    setTeatroNome(achado.nome);
    setImagemPlantaUrl(achado.imagemPlantaUrl || "");
    if (achado.imagemIngressoUrl) setImagemIngressoUrl(achado.imagemIngressoUrl);
    setSetores(achado.setores);
    toast.success(`Estrutura do "${achado.nome}" aplicada! Clique em "Salvar Alterações".`);
  };

  // Abrir modal de novo setor
  const handleOpenNovoSetor = () => {
    setEditingSetorId(null);
    setSetorNome("");
    setSetorNivel("terreo");
    setSetorCapacidade(100);
    setSetorRegra("par_impar");
    setSetorFileirasInfo("");
    setSetorPorta("Porta Ímpar / Porta Par");
    setSetorObs("");
    setModalSetorOpen(true);
  };

  // Abrir modal de edição de setor
  const handleEditSetor = (s: SetorConfig) => {
    setEditingSetorId(s.id);
    setSetorNome(s.nome);
    setSetorNivel(s.nivel);
    setSetorCapacidade(s.capacidadeTotal);
    setSetorRegra(s.regraNumeracao);
    setSetorFileirasInfo(s.fileirasInfo || "");
    setSetorPorta(s.portaAcessoSugerida || "");
    setSetorObs(s.observacoes || "");
    setModalSetorOpen(true);
  };

  // Salvar setor no form
  const handleSalvarSetor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setorNome.trim()) {
      toast.error("Por favor, preencha o nome do setor.");
      return;
    }

    const novo: SetorConfig = {
      id: editingSetorId || `setor_${Date.now()}`,
      nome: setorNome.trim(),
      nivel: setorNivel,
      capacidadeTotal: Number(setorCapacidade) || 0,
      regraNumeracao: setorRegra,
      fileirasInfo: setorFileirasInfo.trim() || undefined,
      portaAcessoSugerida: setorPorta.trim() || undefined,
      observacoes: setorObs.trim() || undefined
    };

    let novosSetores: SetorConfig[];
    if (editingSetorId) {
      novosSetores = setores.map(s => s.id === editingSetorId ? novo : s);
      toast.success("Setor atualizado!");
    } else {
      novosSetores = [...setores, novo];
      toast.success("Novo setor adicionado!");
    }

    setSetores(novosSetores);
    setModalSetorOpen(false);
  };

  // Remover setor
  const handleRemoverSetor = (id: string) => {
    if (!confirm("Tem certeza que deseja remover este setor?")) return;
    setSetores(setores.filter(s => s.id !== id));
    toast.success("Setor removido.");
  };

  // Upload da Planta
  const handleUploadPlanta = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagemPlantaUrl(reader.result as string);
        toast.success("Imagem da planta carregada!");
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload da Foto Oficial do Ingresso com Editor/Cropper integrado
  const handleUploadFotoIngresso = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setRawImageToCrop(reader.result as string);
        setCropperOpen(true);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  const handleRecortarImagemAtual = () => {
    if (!imagemIngressoUrl) return;
    setRawImageToCrop(imagemIngressoUrl);
    setCropperOpen(true);
  };

  const capacidadeTotalGeral = setores.reduce((acc, s) => acc + (Number(s.capacidadeTotal) || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
          <Ticket className="size-8 text-primary" />
          Mapa de Assentos e Plantas
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Configure a foto oficial do ingresso, planta do teatro e gerencie os setores, capacidades e portas de acesso.
        </p>
      </div>

      {!selectedEventoId ? (
        <div className="mt-6">
          <GridEventos onSelect={handleSelectEvento} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* HEADER DO EVENTO COM SHOW, CIDADE E VOLTAR */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedEventoId("")} 
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold shrink-0"
              >
                &larr; Voltar para Grade
              </Button>

              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge className="bg-indigo-600 text-white font-bold text-xs uppercase">
                    CIDADE: {activeEvento?.cidade || "PRAÇA"}
                  </Badge>
                  <Badge variant="outline" className="text-slate-300 border-white/20">
                    <Building2 className="size-3 mr-1" />
                    {teatroNome || activeEvento?.local || "Teatro"}
                  </Badge>
                  <Badge variant="outline" className="text-slate-300 border-white/20">
                    <Calendar className="size-3 mr-1" />
                    {activeEvento?.data ? new Date(activeEvento.data + "T00:00:00").toLocaleDateString("pt-BR") : "Data a definir"}
                  </Badge>
                </div>
                <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
                  {activeEvento?.espetaculo || "Espetáculo"}
                </h2>
              </div>
            </div>

            {/* Ações do Header */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-56">
                <Select onValueChange={handlePuxarPadraoTeatro}>
                  <SelectTrigger className="h-9 text-xs bg-white/10 border-white/20 text-white font-semibold">
                    <SelectValue placeholder="Puxar Teatro Cadastrado..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teatrosSalvos.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex flex-col text-left">
                          <span className="font-bold">{t.nome}</span>
                          <span className="text-[10px] text-muted-foreground">{t.cidade} • {t.capacidadeTotal} lug.</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleSalvarMapa}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20"
              >
                <Save className="size-4 mr-2" />
                Salvar Alterações
              </Button>
            </div>
          </div>

          {/* DADOS GERAIS DO TEATRO E FOTOS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* COLUNA ESQUERDA: FOTO DO INGRESSO + PLANTA DO TEATRO */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* CARD 1: FOTO OFICIAL DO INGRESSO (COM MEDIDAS RECOMENDADAS) */}
              <Card className="rounded-2xl border-indigo-500/30 bg-card shadow-sm overflow-hidden border-2">
                <CardHeader className="p-4 pb-2 border-b bg-indigo-50/50 dark:bg-indigo-950/20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-black flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                      <Camera className="size-4" />
                      Foto Oficial para o Ingresso (Capa)
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] font-bold border-indigo-400 text-indigo-600 dark:text-indigo-300">
                      1200 x 500 px
                    </Badge>
                  </div>
                  <CardDescription className="text-[11px] text-slate-500">
                    Proporção ideal: <strong>2.4:1</strong> (largura x altura) ou <strong>1200 x 500 px</strong> para encaixar perfeitamente no PDF e no card digital sem cortar.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 space-y-3">
                  {imagemIngressoUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-border group bg-slate-950 h-32 flex items-center justify-center">
                      <img 
                        src={imagemIngressoUrl} 
                        alt="Foto do Ingresso" 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute top-2 right-2 flex items-center gap-1.5">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="h-7 px-2 text-xs font-bold shadow-md bg-white/90 hover:bg-white text-slate-900 border border-black/10"
                          onClick={handleRecortarImagemAtual}
                          title="Ajustar e recortar na proporção exata"
                        >
                          <Crop className="size-3 mr-1 text-indigo-600" /> Ajustar / Cortar
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="h-7 px-2 text-xs font-bold shadow-md"
                          onClick={() => setImagemIngressoUrl("")}
                        >
                          <Trash2 className="size-3 mr-1" /> Remover
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 rounded-xl p-5 text-center bg-indigo-50/30 dark:bg-indigo-950/10">
                      <Camera className="size-8 text-indigo-400 mx-auto mb-1.5 opacity-60" />
                      <p className="text-xs font-bold text-foreground">Nenhuma foto oficial para o ingresso cadastrada.</p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Tamanho ideal: <strong>1200 x 500 px</strong> (JPG ou PNG).
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="block cursor-pointer">
                      <div className="flex items-center justify-center gap-2 h-9 px-3 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm">
                        <Upload className="size-3.5" />
                        Upload da Foto do Ingresso (1200x500px)
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleUploadFotoIngresso}
                      />
                    </label>

                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Ou cole a URL direta da imagem:</Label>
                      <Input 
                        placeholder="https://exemplo.com/banner-ingresso.jpg"
                        value={imagemIngressoUrl}
                        onChange={(e) => setImagemIngressoUrl(e.target.value)}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CARD 2: PLANTA DAS CADEIRAS / FOTO DO TEATRO */}
              <Card className="rounded-2xl border-border bg-card shadow-sm overflow-hidden">
                <CardHeader className="p-4 pb-3 border-b flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-black flex items-center gap-2">
                      <ImageIcon className="size-4 text-primary" />
                      Planta das Cadeiras / Foto Base
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Imagem da sala para conferência visual das poltronas.
                    </CardDescription>
                  </div>
                  {imagemPlantaUrl && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2 text-xs text-primary"
                      onClick={() => setModalImagemOpen(true)}
                    >
                      <Eye className="size-3.5 mr-1" /> Expandir
                    </Button>
                  )}
                </CardHeader>

                <CardContent className="p-4 space-y-3">
                  {imagemPlantaUrl ? (
                    <div 
                      onClick={() => setModalImagemOpen(true)}
                      className="relative rounded-xl overflow-hidden border border-border group cursor-pointer bg-slate-950 flex items-center justify-center max-h-56"
                    >
                      <img 
                        src={imagemPlantaUrl} 
                        alt="Planta do Teatro" 
                        className="w-full object-contain max-h-56 group-hover:scale-105 transition-transform duration-300" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1">
                        <Eye className="size-4" /> Clique para ampliar
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-xl p-5 text-center bg-muted/20">
                      <ImageIcon className="size-8 text-muted-foreground mx-auto mb-1 opacity-50" />
                      <p className="text-xs font-semibold text-muted-foreground">Nenhuma planta das cadeiras anexada.</p>
                    </div>
                  )}

                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2">
                      <label className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-center gap-2 h-8 px-3 text-xs font-bold rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20">
                          <Upload className="size-3.5" />
                          Upload da Planta Baixa
                        </div>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleUploadPlanta}
                        />
                      </label>
                      {imagemPlantaUrl && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2.5 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                          onClick={() => setImagemPlantaUrl("")}
                          title="Remover Imagem"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Informações Gerais do Teatro */}
              <Card className="rounded-2xl border-border bg-card shadow-sm p-4 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Nome do Teatro / Espaço</Label>
                  <Input 
                    value={teatroNome}
                    onChange={(e) => setTeatroNome(e.target.value)}
                    placeholder="Ex: Teatro Barreto Júnior"
                    className="h-9 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Observações / Características da Sala</Label>
                  <Textarea 
                    value={observacoesGerais}
                    onChange={(e) => setObservacoesGerais(e.target.value)}
                    placeholder="Ex: Corredores laterais, fosso de orquestra, visibilidade parcial nas frisas 3 e 4..."
                    className="text-xs resize-none"
                    rows={2}
                  />
                </div>

                <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">Capacidade Total Somada:</span>
                  <span className="text-lg font-black text-primary">{capacidadeTotalGeral} assentos</span>
                </div>
              </Card>
            </div>

            {/* COLUNA DIREITA: SETORES CADASTRADOS NA MÃO */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="rounded-2xl border-border bg-card shadow-sm">
                <CardHeader className="p-4 pb-3 border-b flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-black flex items-center gap-2">
                      <Layers className="size-4 text-primary" />
                      Setores e Classificação dos Assentos
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Cadastre a quantidade, padrão de numeração e portas de cada área.
                    </CardDescription>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={handleOpenNovoSetor}
                    className="h-8 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                  >
                    <Plus className="size-3.5 mr-1" /> Adicionar Setor
                  </Button>
                </CardHeader>

                <CardContent className="p-4 space-y-3">
                  {setores.length === 0 ? (
                    <div className="text-center py-10 border border-dashed rounded-xl">
                      <Layers className="size-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                      <p className="text-xs font-bold text-muted-foreground">Nenhum setor cadastrado para este teatro.</p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleOpenNovoSetor}
                        className="mt-3 text-xs font-bold"
                      >
                        <Plus className="size-3.5 mr-1" /> Criar Primeiro Setor
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {setores.map((s) => (
                        <div 
                          key={s.id}
                          className="p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-sm text-foreground">{s.nome}</span>
                              <Badge variant="outline" className="text-[10px] uppercase font-bold border-primary/30 text-primary">
                                {s.nivel}
                              </Badge>
                              <Badge 
                                variant={s.regraNumeracao === "par_impar" ? "default" : "secondary"}
                                className="text-[10px] font-bold uppercase"
                              >
                                {s.regraNumeracao === "par_impar" ? "Par / Ímpar" : s.regraNumeracao === "sequencial" ? "Sequencial (1, 2, 3...)" : "Livre"}
                              </Badge>
                            </div>

                            {s.fileirasInfo && (
                              <p className="text-xs text-muted-foreground font-medium">
                                <strong>Fileiras:</strong> {s.fileirasInfo}
                              </p>
                            )}

                            {s.portaAcessoSugerida && (
                              <div className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                                <DoorOpen className="size-3" />
                                <span>Entrada sugerida: {s.portaAcessoSugerida}</span>
                              </div>
                            )}

                            {s.observacoes && (
                              <p className="text-[11px] text-muted-foreground/80 italic">
                                Obs: {s.observacoes}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                            <div className="text-right">
                              <span className="block text-[10px] font-bold text-muted-foreground uppercase">Capacidade</span>
                              <span className="text-base font-black text-foreground">{s.capacidadeTotal} lug.</span>
                            </div>

                            <div className="flex items-center gap-1 border-l pl-3 border-border">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-2 text-xs font-semibold"
                                onClick={() => handleEditSetor(s)}
                              >
                                Editar
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                                onClick={() => handleRemoverSetor(s.id)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Guia explicativo */}
              <Card className="rounded-2xl border-border bg-slate-50 dark:bg-slate-900/40 p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <Info className="size-4 text-primary" />
                  Foto Oficial e Emissão de Ingressos:
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Ao cadastrar a foto do ingresso aqui no formato recomendado (<strong>1200 x 500 px</strong>), ela é automaticamente enviada para o topo de todos os bilhetes emitidos deste evento, tanto no visualizador do celular quanto no PDF oficial de impressão.
                </p>
              </Card>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: NOVO / EDITAR SETOR */}
      <Dialog open={modalSetorOpen} onOpenChange={setModalSetorOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Layers className="size-5 text-primary" />
              {editingSetorId ? "Editar Setor do Teatro" : "Cadastrar Novo Setor"}
            </DialogTitle>
            <DialogDescription>
              Configure o nome, capacidade, padrão de numeração e porta sugerida deste setor.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSalvarSetor} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Nome do Setor *</Label>
                <Input 
                  value={setorNome}
                  onChange={(e) => setSetorNome(e.target.value)}
                  placeholder="Ex: Plateia Central, Frisa 01, Balcão..."
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Nível / Categoria</Label>
                <Select value={setorNivel} onValueChange={(val: any) => setSetorNivel(val)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="terreo">Plateia Térrea</SelectItem>
                    <SelectItem value="vip">Setor VIP</SelectItem>
                    <SelectItem value="frisa">Frisa (Lateral)</SelectItem>
                    <SelectItem value="camarote">Camarote Privativo</SelectItem>
                    <SelectItem value="1_andar">Balcão 1º Andar</SelectItem>
                    <SelectItem value="2_andar">Balcão 2º Andar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Capacidade de Assentos *</Label>
                <Input 
                  type="number"
                  min="1"
                  value={setorCapacidade}
                  onChange={(e) => setSetorCapacidade(parseInt(e.target.value, 10) || 0)}
                  placeholder="Qtd total de cadeiras"
                  className="h-9 text-xs font-bold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Regra de Numeração</Label>
                <Select value={setorRegra} onValueChange={(val: any) => setSetorRegra(val)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="par_impar">Par / Ímpar (Clássico)</SelectItem>
                    <SelectItem value="sequencial">1, 2, 3... (Sequencial)</SelectItem>
                    <SelectItem value="livre">Assento Livre / Sem Numeração</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Estrutura das Fileiras (opcional)</Label>
              <Input 
                value={setorFileirasInfo}
                onChange={(e) => setSetorFileirasInfo(e.target.value)}
                placeholder="Ex: Fileiras A a M • 22 cadeiras por fila com corredor"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Porta de Entrada Sugerida</Label>
              <Input 
                value={setorPorta}
                onChange={(e) => setSetorPorta(e.target.value)}
                placeholder="Ex: Porta Ímpar (Esquerda) / Porta Par (Direita)"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Observações Adicionais</Label>
              <Textarea 
                value={setorObs}
                onChange={(e) => setSetorObs(e.target.value)}
                placeholder="Ex: 4 cadeiras PCD nas pontas da fileira D..."
                className="text-xs resize-none"
                rows={2}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setModalSetorOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                {editingSetorId ? "Salvar Alterações" : "Adicionar Setor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: AMPLIAR PLANTA VISUAL */}
      {modalImagemOpen && (
        <Dialog open={modalImagemOpen} onOpenChange={setModalImagemOpen}>
          <DialogContent className="max-w-5xl p-4 bg-slate-950 border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center justify-between">
                <span>Planta do Teatro: {teatroNome || "Visualização Ampliada"}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-auto max-h-[80vh] flex items-center justify-center p-2">
              <img 
                src={imagemPlantaUrl} 
                alt="Planta Ampliada" 
                className="w-auto h-auto max-w-full max-h-[75vh] object-contain rounded-lg" 
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL: EDITOR DE RECORTE DA FOTO DO INGRESSO (2.4:1) */}
      <ImageCropperModal 
        open={cropperOpen}
        onOpenChange={setCropperOpen}
        imageSrc={rawImageToCrop}
        onCropComplete={(croppedBase64) => {
          setImagemIngressoUrl(croppedBase64);
          toast.success("Foto do ingresso recortada e calibrada com sucesso!");
        }}
        aspectRatio={2.4}
        targetWidth={1200}
        targetHeight={500}
      />
    </div>
  );
}
