// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GridEventos } from "@/components/GridEventos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { VisualIngressoCard } from "@/components/VisualIngressoCard";
import { exportarIngressoPDF, exportarLoteIngressosFolhaA4, type DadosIngresso } from "@/lib/ticketGenerator";
import { exportarIngressosExcel, exportarIngressosRelatorioPDF } from "@/lib/exportReports";
import { ReportExportButton } from "@/components/ReportExportButton";
import { maskCPF, maskPhone, isValidCPF, isValidEmail } from "@/lib/utils";
import { toast } from "sonner";
import { 
  Ticket, 
  MapPin, 
  Plus, 
  Eye, 
  Download, 
  Trash2, 
  CheckCircle2, 
  Search, 
  Filter, 
  User, 
  Smartphone, 
  Mail, 
  Calendar,
  Building2,
  Clock,
  QrCode,
  ArrowLeft,
  Printer,
  Layers,
  Send,
  X,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/ingressos/emissao")({
  head: () => ({ meta: [{ title: "Emissão de Ingressos - Áxis - Gestão de Teatros e Shows" }] }),
  component: EmissaoIngressosPage,
});

export type IngressoItem = DadosIngresso & {
  id: string;
  eventoId: string;
  telefone?: string;
  email?: string;
  dataEmissao: string;
  status: "emitido" | "utilizado" | "cancelado";
};

type ItemAssentoLote = {
  id: string;
  setor: string;
  fileira: string;
  assento: string;
  tipoIngresso?: string; // Modalidade individual deste assento ("INTEIRA", "MEIA-ENTRADA", etc.)
};

function EmissaoIngressosPage() {
  const [selectedShow, setSelectedShow] = useState<any>(null);
  const [showBannerUrl, setShowBannerUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [ingressos, setIngressos] = useState<IngressoItem[]>([]);
  const [modalNovoOpen, setModalNovoOpen] = useState(false);
  const [modalVisualizar, setModalVisualizar] = useState<IngressoItem | null>(null);
  const [filtroBusca, setFiltroBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");

  // Form de Emissão
  const [tipoIngressoPadrao, setTipoIngressoPadrao] = useState<string>("INTEIRA");
  const [titularNome, setTitularNome] = useState<string>("");
  const [titularCpf, setTitularCpf] = useState<string>("");
  const [telefone, setTelefone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [horarioShow, setHorarioShow] = useState<string>("20:00");
  const [teatroPersonalizado, setTeatroPersonalizado] = useState<string>("");

  // Controle de campo visitado (onBlur) para exibir erro em tempo real
  const [touchedCpf, setTouchedCpf] = useState<boolean>(false);
  const [touchedTelefone, setTouchedTelefone] = useState<boolean>(false);
  const [touchedEmail, setTouchedEmail] = useState<boolean>(false);
  const [touchedNome, setTouchedNome] = useState<boolean>(false);

  // Lista de assentos selecionados para o titular (cada assento com seu tipo individual)
  const [listaAssentosLote, setListaAssentosLote] = useState<ItemAssentoLote[]>([
    { id: "1", setor: "Plateia Central (Térreo)", fileira: "A", assento: "1", tipoIngresso: "INTEIRA" }
  ]);

  // Setores disponíveis (carregados da planta/mapa do evento)
  const [setoresDisponiveis, setSetoresDisponiveis] = useState<string[]>([
    "Plateia Central (Térreo)",
    "Plateia Alta",
    "Frisas Laterais",
    "Balcão Nobre",
    "Camarotes Superiores",
    "Área VIP"
  ]);

  // Restaurar evento selecionado do localStorage para não voltar à grade ao dar F5
  useEffect(() => {
    const salvoEv = localStorage.getItem("axis_ultimo_evento_ingressos");
    if (salvoEv && !selectedShow) {
      try {
        const ev = JSON.parse(salvoEv);
        if (ev && ev.id) {
          handleSelectEvento(ev.id, ev.roadbookId, ev);
        }
      } catch (e) {}
    }
  }, []);

  // Handler ao clicar em Acessar no GridEventos
  const handleSelectEvento = async (eventoId: string, rbId?: any, fullEvento?: any) => {
    setLoading(true);
    try {
      let ev = fullEvento;
      if (!ev) {
        const { data } = await supabase.from("eventos").select("*").eq("id", eventoId).single();
        ev = data;
      }
      setSelectedShow(ev);
      if (ev) {
        localStorage.setItem("axis_ultimo_evento_ingressos", JSON.stringify(ev));
      }

      // 1. Tentar pegar a Foto Oficial do Ingresso configurada no Mapa de Assentos
      const mapaSalvo = localStorage.getItem(`axis_mapa_evento_${eventoId}`);
      let banner = "";
      if (mapaSalvo) {
        try {
          const obj = JSON.parse(mapaSalvo);
          if (obj.imagemIngressoUrl) banner = obj.imagemIngressoUrl;
        } catch (e) {
          console.error(e);
        }
      }

      // 2. Fallbacks de imagem caso não tenha configurado no mapa
      if (!banner && ev?.espetaculo) {
        const { data: tmpl } = await supabase
          .from("templates_espetaculos")
          .select("logo_espetaculo_url")
          .eq("nome_espetaculo", ev.espetaculo)
          .maybeSingle();
        if (tmpl?.logo_espetaculo_url) banner = tmpl.logo_espetaculo_url;
      }
      if (!banner && ev?.id) {
        const { data: rb } = await supabase
          .from("roadbooks")
          .select("automacoes")
          .eq("evento_id", ev.id)
          .maybeSingle();
        if (rb?.automacoes?.foto_capa_url) banner = rb.automacoes.foto_capa_url;
      }
      setShowBannerUrl(banner || "");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao selecionar evento.");
    } finally {
      setLoading(false);
    }
  };

  // Carregar ingressos e setores do evento selecionado
  useEffect(() => {
    if (!selectedShow) return;

    const mapaSalvo = localStorage.getItem(`axis_mapa_evento_${selectedShow.id}`);
    let teatroNomeResolvido = selectedShow.local?.trim() || "";

    if (mapaSalvo) {
      try {
        const obj = JSON.parse(mapaSalvo);
        if (obj.teatroNome && obj.teatroNome.trim()) {
          teatroNomeResolvido = obj.teatroNome.trim();
        }
        if (obj.imagemIngressoUrl) {
          setShowBannerUrl(obj.imagemIngressoUrl);
        }
        if (obj.setores && obj.setores.length > 0) {
          const nomes = obj.setores.map((s: any) => s.nome || s.identificador || s);
          setSetoresDisponiveis(nomes);
          if (listaAssentosLote.length > 0) {
            setListaAssentosLote(prev => prev.map(item => ({ ...item, setor: nomes[0] })));
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    setTeatroPersonalizado(teatroNomeResolvido || "Teatro Municipal");

    if (selectedShow.horario) {
      setHorarioShow(selectedShow.horario);
    }

    const storageKey = `ingressos_evento_${selectedShow.id}`;
    const salvos = localStorage.getItem(storageKey);
    let ingressosIniciais: IngressoItem[] = [];
    if (salvos) {
      try {
        ingressosIniciais = JSON.parse(salvos);
        setIngressos(ingressosIniciais);
      } catch (e) {
        console.error(e);
      }
    }

    // Carregar em nuvem do Supabase sem apagar ingressos locais se a base retornar vazio
    async function carregarDoSupabase() {
      try {
        const { data, error } = await supabase
          .from("ingressos_evento")
          .select("*")
          .eq("evento_id", selectedShow.id);

        if (!error && data && data.length > 0) {
          const mapeados: IngressoItem[] = data.map((d: any) => ({
            id: d.id,
            eventoId: d.evento_id,
            codigoIngresso: d.codigo_ingresso,
            espetaculo: d.espetaculo,
            cidade: d.cidade,
            teatro: d.teatro,
            data: d.data_show,
            horario: d.horario_show,
            setor: d.setor,
            fileira: d.fileira,
            assento: d.assento,
            portaAcesso: d.porta_acesso,
            tipoIngresso: d.tipo_ingresso,
            titularNome: d.titular_nome,
            titularCpf: d.titular_cpf || undefined,
            telefone: d.telefone || undefined,
            email: d.email || undefined,
            dataEmissao: d.data_emissao,
            status: d.status || "emitido",
            produtoraNome: d.produtora_nome || "WILLIAM SEVEN PRODUÇÕES",
            bannerShowUrl: d.banner_show_url || undefined
          }));
          
          // Unir com locais garantindo unicidade por código
          setIngressos(prev => {
            const map = new Map<string, IngressoItem>();
            prev.forEach(i => map.set(i.codigoIngresso, i));
            mapeados.forEach(i => map.set(i.codigoIngresso, i));
            const uniao = Array.from(map.values());
            localStorage.setItem(storageKey, JSON.stringify(uniao));
            return uniao;
          });
        }
      } catch (err) {
        console.warn("Supabase ingressos_evento fallback to local:", err);
      }
    }
    carregarDoSupabase();
  }, [selectedShow]);

  // Manipular assentos do lote
  const handleAdicionarAssentoAoLote = () => {
    const ultimo = listaAssentosLote[listaAssentosLote.length - 1];
    const proxNum = ultimo ? String(parseInt(ultimo.assento, 10) + 1 || "") : "1";
    setListaAssentosLote([
      ...listaAssentosLote,
      {
        id: String(Date.now() + Math.random()),
        setor: ultimo?.setor || setoresDisponiveis[0] || "Plateia Central (Térreo)",
        fileira: ultimo?.fileira || "A",
        assento: proxNum,
        tipoIngresso: ultimo?.tipoIngresso || tipoIngressoPadrao || "INTEIRA"
      }
    ]);
  };

  const handleRemoverAssentoDoLote = (id: string) => {
    if (listaAssentosLote.length <= 1) return;
    setListaAssentosLote(listaAssentosLote.filter(item => item.id !== id));
  };

  const handleAtualizarAssentoDoLote = (id: string, campo: keyof ItemAssentoLote, valor: string) => {
    setListaAssentosLote(
      listaAssentosLote.map(item => item.id === id ? { ...item, [campo]: valor } : item)
    );
  };

  // Formatação com Máscaras padrão
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitularCpf(maskCPF(e.target.value));
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelefone(maskPhone(e.target.value, telefone));
  };

  // Criar novos ingressos com validação de duplicidade
  const handleEmitirIngresso = async (e: React.FormEvent) => {
    e.preventDefault();
    // 1. Validação obrigatória de Titular, CPF, Telefone e E-mail
    if (!titularNome.trim()) {
      toast.error("Por favor, preencha o nome completo do titular.");
      return;
    }

    if (!titularCpf.trim()) {
      toast.error("O preenchimento do CPF é obrigatório para emissão de ingressos nominais.");
      return;
    }

    if (!isValidCPF(titularCpf)) {
      toast.error("CPF inválido! Por favor, informe um CPF autêntico.");
      return;
    }

    if (!telefone.trim() || telefone.replace(/\D/g, "").length < 10) {
      toast.error("Por favor, informe um telefone/WhatsApp válido com DDD.");
      return;
    }

    if (!email.trim() || !isValidEmail(email)) {
      toast.error("Por favor, informe um endereço de e-mail válido (ex: seu.nome@email.com).");
      return;
    }

    // 2. Validar se todos os assentos foram preenchidos
    for (let i = 0; i < listaAssentosLote.length; i++) {
      const item = listaAssentosLote[i];
      if (!item.fileira.trim() || !item.assento.trim()) {
        toast.error(`Por favor, preencha a fileira e o assento da linha #${i + 1}.`);
        return;
      }
    }

    // 3. Validar se não colocou assentos duplicados dentro do próprio formulário
    const duplicadosNoForm = new Set<string>();
    for (const item of listaAssentosLote) {
      const chave = `${item.setor.trim().toLowerCase()}_${item.fileira.trim().toUpperCase()}_${item.assento.trim()}`;
      if (duplicadosNoForm.has(chave)) {
        toast.error(`Você adicionou o mesmo assento duas vezes no formulário: Fila ${item.fileira.toUpperCase()} - Assento ${item.assento}.`);
        return;
      }
      duplicadosNoForm.add(chave);
    }

    // 4. 🚨 BLOQUEIO DE DUPLICIDADE: Checar contra os assentos já emitidos no evento
    const assentosJaOcupados: string[] = [];
    for (const item of listaAssentosLote) {
      const existe = ingressos.find(
        cadastrado => 
          cadastrado.status !== "cancelado" &&
          cadastrado.setor.trim().toLowerCase() === item.setor.trim().toLowerCase() &&
          cadastrado.fileira.trim().toUpperCase() === item.fileira.trim().toUpperCase() &&
          String(cadastrado.assento).trim() === String(item.assento).trim()
      );
      if (existe) {
        assentosJaOcupados.push(`Fila ${item.fileira.toUpperCase()} - Assento ${item.assento} (Setor: ${item.setor})`);
      }
    }

    if (assentosJaOcupados.length > 0) {
      toast.error(
        `Irregularidade! Assento já emitido e ocupado: ${assentosJaOcupados.join("; ")}`,
        { duration: 7000 }
      );
      return;
    }
    
    const dataFmt = selectedShow.data ? new Date(selectedShow.data + "T00:00:00").toLocaleDateString("pt-BR") : "Data a definir";
    const teatroFinal = teatroPersonalizado || selectedShow.local || "Teatro Municipal";

    // Gerar ID numérico/identificador do show de até 4 dígitos (ex: últimos 4 dígitos do ID ou hash do espetáculo)
    const obterIdShowCurto = (): string => {
      if (selectedShow.id) {
        // Se for UUID ou string, pegar os primeiros 4 caracteres alfanuméricos ou números
        const nums = selectedShow.id.replace(/\D/g, "");
        if (nums.length >= 4) return nums.slice(-4);
        const limpo = selectedShow.id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
        if (limpo.length >= 4) return limpo.slice(0, 4);
      }
      return "7777";
    };

    const showIdCurto = obterIdShowCurto();

    // Função para gerar código criptográfico pseudo-aleatório de alta entropia (16 caracteres alfanuméricos em 4 blocos de 4)
    // Padrão solicitado: TKT-[ID_SHOW]-[4CHARS]-[4CHARS]-[4CHARS]-[4CHARS] (ex: TKT-8921-9Q7X-M4W1-J3P9-8F2K)
    const gerarCodigoSeguro = (): string => {
      const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // sem caracteres ambíguos (0, O, 1, I)
      let blocosAleatorios = "";
      for (let b = 0; b < 4; b++) {
        let bloco = "";
        for (let c = 0; c < 4; c++) {
          const randIdx = Math.floor(Math.random() * chars.length);
          bloco += chars[randIdx];
        }
        blocosAleatorios += (b === 0 ? "" : "-") + bloco;
      }
      return `TKT-${showIdCurto}-${blocosAleatorios}`;
    };

    const novosIngressos: IngressoItem[] = [];

    for (const item of listaAssentosLote) {
      let novoCodigo = gerarCodigoSeguro();
      // Garantir unicidade contra lista atual
      while (ingressos.some(i => i.codigoIngresso === novoCodigo) || novosIngressos.some(i => i.codigoIngresso === novoCodigo)) {
        novoCodigo = gerarCodigoSeguro();
      }

      const numAss = parseInt(item.assento, 10);
      const porta = !isNaN(numAss) && numAss % 2 !== 0 
        ? "Porta Ímpar (Esquerda)" 
        : "Porta Par (Direita)";

      const tipoFinal = item.tipoIngresso || tipoIngressoPadrao || "INTEIRA";

      novosIngressos.push({
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
        eventoId: selectedShow.id,
        codigoIngresso: novoCodigo,
        espetaculo: selectedShow.espetaculo || "Espetáculo",
        cidade: selectedShow.cidade || "Cidade do Evento",
        teatro: teatroFinal,
        data: dataFmt,
        horario: horarioShow || "20:00",
        setor: item.setor.trim(),
        fileira: item.fileira.trim().toUpperCase(),
        assento: item.assento.trim(),
        portaAcesso: porta,
        tipoIngresso: tipoFinal,
        titularNome: titularNome.trim(),
        titularCpf: titularCpf.trim(),
        telefone: telefone.trim(),
        email: email.trim(),
        dataEmissao: new Date().toLocaleDateString("pt-BR"),
        status: "emitido",
        produtoraNome: "WILLIAM SEVEN PRODUÇÕES",
        bannerShowUrl: showBannerUrl || undefined
      });
    }

    const atualizados = [...novosIngressos, ...ingressos];
    setIngressos(atualizados);
    localStorage.setItem(`ingressos_evento_${selectedShow.id}`, JSON.stringify(atualizados));

    // Fechar imediatamente a tela de emissão e dar feedback ao usuário sem travamentos
    setModalNovoOpen(false);

    if (novosIngressos.length === 1) {
      toast.success(`Ingresso gerado com sucesso! (${novosIngressos[0].codigoIngresso})`, { duration: 5000 });
    } else {
      toast.success(`${novosIngressos.length} ingressos gerados com sucesso para ${titularNome}!`, { duration: 5000 });
    }
    
    // Resetar form e estados de validação
    setTitularNome("");
    setTitularCpf("");
    setTelefone("");
    setEmail("");
    setTouchedNome(false);
    setTouchedCpf(false);
    setTouchedTelefone(false);
    setTouchedEmail(false);
    setListaAssentosLote([
      { id: "1", setor: setoresDisponiveis[0] || "Plateia Central (Térreo)", fileira: "A", assento: "1" }
    ]);

    // Salvar em nuvem no Supabase em segundo plano
    try {
      const payloadSupabase = novosIngressos.map(item => ({
        evento_id: selectedShow.id,
        codigo_ingresso: item.codigoIngresso,
        espetaculo: item.espetaculo,
        cidade: item.cidade,
        teatro: item.teatro,
        data_show: item.data,
        horario_show: item.horario,
        setor: item.setor,
        fileira: item.fileira,
        assento: item.assento,
        porta_acesso: item.portaAcesso,
        tipo_ingresso: item.tipoIngresso,
        titular_nome: item.titularNome,
        titular_cpf: item.titularCpf,
        telefone: item.telefone,
        email: item.email,
        data_emissao: item.dataEmissao,
        status: item.status,
        produtora_nome: item.produtoraNome,
        banner_show_url: item.bannerShowUrl
      }));
      supabase.from("ingressos_evento").insert(payloadSupabase).then(({ error: errInsert }) => {
        if (errInsert) {
          console.error("Erro ao sincronizar com Supabase:", errInsert);
          toast.error(`Atenção: O ingresso foi salvo no navegador, mas o banco Supabase recusou (${errInsert.message}). Verifique o script RLS no painel do Supabase.`, { duration: 10000 });
        } else {
          console.log("Ingressos sincronizados com o Supabase com sucesso!");
        }
      });
    } catch (e: any) {
      console.warn("Erro ao sincronizar com Supabase:", e);
    }
  };

  // Excluir ingresso
  const handleExcluirIngresso = (id: string) => {
    if (!confirm("Tem certeza que deseja cancelar e liberar este assento?")) return;
    const atualizados = ingressos.filter(i => i.id !== id);
    setIngressos(atualizados);
    localStorage.setItem(`ingressos_evento_${selectedShow.id}`, JSON.stringify(atualizados));

    try {
      supabase.from("ingressos_evento").delete().eq("id", id).then(() => {});
    } catch (e) {}
    toast.success("Ingresso cancelado e assento liberado!");
    if (modalVisualizar?.id === id) setModalVisualizar(null);
  };

  // Filtrar
  const ingressosFiltrados = ingressos.filter(i => {
    const matchBusca = 
      i.titularNome.toLowerCase().includes(filtroBusca.toLowerCase()) ||
      i.codigoIngresso.toLowerCase().includes(filtroBusca.toLowerCase()) ||
      i.setor.toLowerCase().includes(filtroBusca.toLowerCase()) ||
      i.assento.toLowerCase().includes(filtroBusca.toLowerCase()) ||
      (i.titularCpf && i.titularCpf.includes(filtroBusca));
    
    const matchTipo = filtroTipo === "todos" || i.tipoIngresso === filtroTipo;
    return matchBusca && matchTipo;
  });

  // Agrupamento por Titular/CPF para visualização múltipla e exportação no mesmo PDF
  const gruposIngressos = (() => {
    const map = new Map<string, IngressoItem[]>();
    for (const item of ingressosFiltrados) {
      const chave = item.titularCpf ? item.titularCpf.trim() : item.titularNome.trim().toLowerCase();
      if (!map.has(chave)) {
        map.set(chave, []);
      }
      map.get(chave)!.push(item);
    }
    return Array.from(map.values());
  })();

  // Estado para navegação tipo Carousel / Swipe no Visualizador
  const [listaVisualizacaoGrupo, setListaVisualizacaoGrupo] = useState<IngressoItem[]>([]);
  const [indiceVisualizacao, setIndiceVisualizacao] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleAbrirVisualizador = (item: IngressoItem) => {
    const chave = item.titularCpf ? item.titularCpf.trim() : item.titularNome.trim().toLowerCase();
    const grupo = ingressos.filter(i => {
      const c = i.titularCpf ? i.titularCpf.trim() : i.titularNome.trim().toLowerCase();
      return c === chave;
    }).map(i => ({
      ...i,
      bannerShowUrl: i.bannerShowUrl || showBannerUrl || undefined
    }));
    const listaCompleta = grupo.length > 0 ? grupo : [{
      ...item,
      bannerShowUrl: item.bannerShowUrl || showBannerUrl || undefined
    }];
    setListaVisualizacaoGrupo(listaCompleta);
    const idx = listaCompleta.findIndex(i => i.id === item.id);
    setIndiceVisualizacao(idx >= 0 ? idx : 0);
    setModalVisualizar(listaCompleta[idx >= 0 ? idx : 0]);
  };

  const handleAvancarIngresso = () => {
    if (listaVisualizacaoGrupo.length <= 1) return;
    const prox = (indiceVisualizacao + 1) % listaVisualizacaoGrupo.length;
    setIndiceVisualizacao(prox);
    setModalVisualizar(listaVisualizacaoGrupo[prox]);
  };

  const handleVoltarIngresso = () => {
    if (listaVisualizacaoGrupo.length <= 1) return;
    const ant = (indiceVisualizacao - 1 + listaVisualizacaoGrupo.length) % listaVisualizacaoGrupo.length;
    setIndiceVisualizacao(ant);
    setModalVisualizar(listaVisualizacaoGrupo[ant]);
  };

  // Keyboard navigation para ArrowLeft e ArrowRight
  useEffect(() => {
    if (!modalVisualizar) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleAvancarIngresso();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleVoltarIngresso();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalVisualizar, indiceVisualizacao, listaVisualizacaoGrupo]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.changedTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX;
    if (diffX > 50) {
      handleVoltarIngresso();
    } else if (diffX < -50) {
      handleAvancarIngresso();
    }
    setTouchStartX(null);
  };

  const handleExportarGrupoPDF = (grupo: IngressoItem[]) => {
    const listaComBanner = grupo.map(item => ({
      ...item,
      bannerShowUrl: item.bannerShowUrl || showBannerUrl || undefined
    }));
    if (listaComBanner.length === 1) {
      exportarIngressoPDF(listaComBanner[0]);
    } else {
      exportarLoteIngressosFolhaA4(listaComBanner, listaComBanner[0].titularNome);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
          <Ticket className="size-8 text-primary" />
          Emissão de Ingressos Digitais
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Emita bilhetes com validação rigorosa de assentos, exportação individual ou em folha A4 e envio por WhatsApp.
        </p>
      </div>

      {/* Se NENHUM evento selecionado: Mostra Grade de Eventos */}
      {!selectedShow ? (
        <div className="mt-6">
          <GridEventos onSelect={handleSelectEvento} />
        </div>
      ) : (
        /* Quando SELECIONOU um evento: Mostra Painel Completo de Ingressos */
        <div className="space-y-6">
          {/* Header Banner com Cidade, Espetáculo e Botão Voltar */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setSelectedShow(null);
                  localStorage.removeItem("axis_ultimo_evento_ingressos");
                }} 
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold shrink-0"
              >
                <ArrowLeft className="size-4 mr-1.5" /> Voltar para Grade
              </Button>

              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge className="bg-indigo-600 text-white font-bold text-xs uppercase">
                    CIDADE: {selectedShow.cidade?.toUpperCase() || "PRAÇA"}
                  </Badge>
                  <Badge variant="outline" className="text-slate-300 border-white/20">
                    <Building2 className="size-3 mr-1" />
                    {teatroPersonalizado || selectedShow.local || "Teatro"}
                  </Badge>
                  <Badge variant="outline" className="text-slate-300 border-white/20">
                    <Calendar className="size-3 mr-1" />
                    {selectedShow.data ? new Date(selectedShow.data + "T00:00:00").toLocaleDateString("pt-BR") : "Data não informada"}
                  </Badge>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                  {selectedShow.espetaculo || "Gestão de Ingressos"}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button 
                onClick={() => setModalNovoOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/20"
              >
                <Plus className="size-4 mr-2" />
                Emitir Ingressos
              </Button>
            </div>
          </div>

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-border bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Total Emitidos</p>
                  <p className="text-2xl font-black text-foreground mt-1">{ingressos.length}</p>
                </div>
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Ticket className="size-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Cortesias VIP</p>
                  <p className="text-2xl font-black text-amber-500 mt-1">
                    {ingressos.filter(i => i.tipoIngresso === "CORTESIA VIP").length}
                  </p>
                </div>
                <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <CheckCircle2 className="size-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Convites Especiais</p>
                  <p className="text-2xl font-black text-indigo-500 mt-1">
                    {ingressos.filter(i => i.tipoIngresso === "CONVITE ESPECIAL").length}
                  </p>
                </div>
                <div className="size-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <QrCode className="size-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Ingressos Comerciais</p>
                  <p className="text-2xl font-black text-emerald-500 mt-1">
                    {ingressos.filter(i => i.tipoIngresso === "INTEIRA" || i.tipoIngresso === "MEIA-ENTRADA").length}
                  </p>
                </div>
                <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Building2 className="size-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros e Busca */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Ticket className="size-5 text-primary" />
                    Lista de Ingressos Cadastrados
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <ReportExportButton 
                      onExportPdf={() => exportarIngressosRelatorioPDF(ingressosFiltrados, selectedShow?.espetaculo, selectedShow?.cidade, teatroPersonalizado)} 
                      onExportExcel={() => exportarIngressosExcel(ingressosFiltrados, selectedShow?.espetaculo, selectedShow?.cidade)} 
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-64">
                    <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input 
                      placeholder="Buscar por nome, código..." 
                      className="pl-9 h-9 text-xs"
                      value={filtroBusca}
                      onChange={(e) => setFiltroBusca(e.target.value)}
                    />
                  </div>
                  <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                    <SelectTrigger className="w-44 h-9 text-xs">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Tipos</SelectItem>
                      <SelectItem value="CORTESIA VIP">Cortesia VIP</SelectItem>
                      <SelectItem value="CONVITE ESPECIAL">Convite Especial</SelectItem>
                      <SelectItem value="IMPRENSA">Imprensa</SelectItem>
                      <SelectItem value="INTEIRA">Inteira</SelectItem>
                      <SelectItem value="MEIA-ENTRADA">Meia-Entrada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {gruposIngressos.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-xl">
                  <Ticket className="size-10 text-muted-foreground mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-semibold text-muted-foreground">Nenhum ingresso emitido ainda para este evento.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4 font-bold"
                    onClick={() => setModalNovoOpen(true)}
                  >
                    <Plus className="size-4 mr-1" /> Emitir Primeiro Ingresso
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-muted/70 text-muted-foreground uppercase font-bold text-[11px] border-b">
                      <tr>
                        <th className="py-3 px-4 w-[28%]">Titular / Convidado</th>
                        <th className="py-3 px-4 w-[12%] text-center">Qtd.</th>
                        <th className="py-3 px-4 w-[22%]">Códigos Emitidos</th>
                        <th className="py-3 px-4 w-[12%]">Tipo</th>
                        <th className="py-3 px-4 w-[26%]">Assentos e Setores</th>
                        <th className="py-3 px-4 text-right w-[160px] whitespace-nowrap">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-medium">
                      {gruposIngressos.map((grupo) => {
                        const primeiro = grupo[0];
                        const isMulti = grupo.length > 1;

                        // Agrupar assentos por Setor e Fila de forma compacta e horizontal
                        const assentosPorSetorEFila = (() => {
                          const mapa = new Map<string, string[]>();
                          grupo.forEach(g => {
                            const chave = `${g.setor} • Fila ${g.fileira}`;
                            if (!mapa.has(chave)) mapa.set(chave, []);
                            mapa.get(chave)!.push(g.assento);
                          });
                          return Array.from(mapa.entries());
                        })();

                        return (
                          <tr key={primeiro.id} className="hover:bg-muted/30 transition-colors align-top">
                            {/* Titular */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-foreground text-sm tracking-tight">
                                  {primeiro.titularNome}
                                </span>
                                {isMulti && (
                                  <Badge className="bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-[10px] font-bold py-0 h-4">
                                    Grupo ({grupo.length})
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
                                {primeiro.titularCpf && (
                                  <span className="font-mono">CPF: {primeiro.titularCpf}</span>
                                )}
                                {primeiro.telefone && (
                                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                    <Smartphone className="size-3" />
                                    {primeiro.telefone}
                                  </span>
                                )}
                                <span className="text-[10px] opacity-75">Emissão: {primeiro.dataEmissao}</span>
                              </div>
                            </td>

                            {/* Quantidade */}
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-black font-mono bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm">
                                {grupo.length}
                              </span>
                            </td>

                            {/* Códigos em Tags Horizontais Compactas */}
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1.5 items-center">
                                {grupo.map(g => (
                                  <span 
                                    key={g.id} 
                                    onClick={() => handleAbrirVisualizador(g)}
                                    title="Clique para abrir este bilhete"
                                    className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted border border-border cursor-pointer hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all whitespace-nowrap shadow-2xs"
                                  >
                                    {g.codigoIngresso}
                                  </span>
                                ))}
                              </div>
                            </td>

                            {/* Tipo de Ingresso */}
                            <td className="py-3 px-4">
                              <Badge 
                                variant={primeiro.tipoIngresso.includes("VIP") ? "default" : "secondary"}
                                className="text-[10px] font-black uppercase tracking-wider py-0.5 whitespace-nowrap"
                              >
                                {primeiro.tipoIngresso}
                              </Badge>
                            </td>

                            {/* Assentos Consolidados Horizontalmente */}
                            <td className="py-3 px-4">
                              <div className="space-y-1">
                                {assentosPorSetorEFila.map(([setorFila, assentos], idx) => (
                                  <div key={idx} className="text-xs text-foreground bg-muted/20 p-1.5 rounded-lg border border-border/50">
                                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                                      {setorFila}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground mt-0.5">
                                      Poltronas:{" "}
                                      <strong className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                                        [{assentos.join(", ")}]
                                      </strong>
                                      <span className="text-[10px] text-muted-foreground/80 ml-1.5">
                                        ({primeiro.portaAcesso || "Geral"})
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>

                            {/* Ações */}
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {isMulti ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-bold border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50/50"
                                    onClick={() => handleAbrirVisualizador(primeiro)}
                                    title="Ver todos os ingressos deste titular com navegação por setas"
                                  >
                                    <Eye className="size-3.5 mr-1" />
                                    Ver todos os ingressos ({grupo.length})
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2.5 text-xs font-bold"
                                    onClick={() => handleAbrirVisualizador(primeiro)}
                                    title="Visualizar Ingresso Digital"
                                  >
                                    <Eye className="size-3.5 mr-1 text-slate-600" />
                                    Ver Ingresso
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-2.5 text-xs text-slate-700 dark:text-slate-200 hover:text-primary font-bold border-border hover:bg-muted/50"
                                  onClick={() => handleExportarGrupoPDF(grupo)}
                                  title={isMulti ? "Baixar todos em folha única A4" : "Baixar PDF do Bilhete"}
                                >
                                  <Download className="size-3.5 mr-1" />
                                  PDF
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                                  onClick={() => {
                                    if (isMulti) {
                                      if (confirm(`Deseja cancelar TODOS os ${grupo.length} ingressos de ${primeiro.titularNome}?`)) {
                                        const ids = new Set(grupo.map(g => g.id));
                                        const atualizados = ingressos.filter(i => !ids.has(i.id));
                                        setIngressos(atualizados);
                                        localStorage.setItem(`ingressos_evento_${selectedShow.id}`, JSON.stringify(atualizados));
                                        try {
                                          supabase.from("ingressos_evento").delete().in("id", Array.from(ids)).then(() => {});
                                        } catch (e) {}
                                        toast.success(`${grupo.length} ingressos cancelados e assentos liberados!`);
                                      }
                                    } else {
                                      handleExcluirIngresso(primeiro.id);
                                    }
                                  }}
                                  title="Cancelar e Liberar Assento(s)"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Emissão de Ingressos (Com múltiplos assentos individuais para o mesmo titular) */}
      <Dialog open={modalNovoOpen} onOpenChange={setModalNovoOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Ticket className="size-5 text-primary" />
              Emitir Ingressos / Cortesias
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do titular e adicione quantos assentos desejar (juntos ou em locais diferentes).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            
            {/* Bloco 1: Dados do Titular e Tipo */}
            <div className="bg-muted/30 p-3.5 rounded-2xl border border-border space-y-3">
              <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider block">
                1. Dados do Titular do Ingresso
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Nome Completo do Titular *</Label>
                  <Input 
                    value={titularNome} 
                    onChange={(e) => setTitularNome(e.target.value)}
                    onBlur={() => setTouchedNome(true)}
                    placeholder="Nome completo do convidado ou comprador" 
                    className={`h-9 text-xs font-semibold ${touchedNome && !titularNome.trim() ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                  />
                  {touchedNome && !titularNome.trim() && (
                    <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 mt-0.5">
                      ⚠️ O nome completo é obrigatório.
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">CPF Oficial * (Obrigatório e Validado)</Label>
                  <Input 
                    value={titularCpf} 
                    onChange={handleCpfChange}
                    onBlur={() => setTouchedCpf(true)}
                    placeholder="000.000.000-00" 
                    className={`h-9 text-xs font-mono font-bold ${
                      touchedCpf && (!titularCpf.trim() || !isValidCPF(titularCpf)) 
                        ? "border-rose-500 focus-visible:ring-rose-500 text-rose-600" 
                        : ""
                    }`}
                    maxLength={14}
                  />
                  {touchedCpf && !titularCpf.trim() && (
                    <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 mt-0.5">
                      ⚠️ O CPF é obrigatório.
                    </span>
                  )}
                  {touchedCpf && titularCpf.trim() && !isValidCPF(titularCpf) && (
                    <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 mt-0.5">
                      ❌ CPF inválido! Verifique os números informados.
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">WhatsApp com DDD * (Obrigatório)</Label>
                  <Input 
                    value={telefone} 
                    onChange={handleTelefoneChange}
                    onBlur={() => setTouchedTelefone(true)}
                    placeholder="(00) 00000-0000" 
                    className={`h-9 text-xs font-mono ${
                      touchedTelefone && (!telefone.trim() || telefone.replace(/\D/g, "").length < 10)
                        ? "border-rose-500 focus-visible:ring-rose-500 text-rose-600"
                        : ""
                    }`}
                    maxLength={15}
                  />
                  {touchedTelefone && (!telefone.trim() || telefone.replace(/\D/g, "").length < 10) && (
                    <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 mt-0.5">
                      ⚠️ Informe um WhatsApp com DDD válido (ex: (11) 98888-8888).
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">E-mail * (Obrigatório)</Label>
                  <Input 
                    type="email"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouchedEmail(true)}
                    placeholder="exemplo@email.com" 
                    className={`h-9 text-xs ${
                      touchedEmail && (!email.trim() || !isValidEmail(email))
                        ? "border-rose-500 focus-visible:ring-rose-500 text-rose-600"
                        : ""
                    }`}
                  />
                  {touchedEmail && (!email.trim() || !isValidEmail(email)) && (
                    <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 mt-0.5">
                      ⚠️ Informe um e-mail válido (ex: nome@dominio.com).
                    </span>
                  )}
                </div>
              </div>

              {/* Ajuste de Teatro e Horário */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Teatro / Espaço</Label>
                  <Input 
                    value={teatroPersonalizado} 
                    onChange={(e) => setTeatroPersonalizado(e.target.value)}
                    placeholder="Nome do Teatro" 
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Horário da Sessão</Label>
                  <Input 
                    value={horarioShow} 
                    onChange={(e) => setHorarioShow(e.target.value)}
                    placeholder="20:00" 
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 2: Assentos e Modalidade Individual (Cada assento escolhe se é Inteira, Meia, VIP, etc.) */}
            <div className="bg-muted/30 p-3.5 rounded-2xl border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider block">
                    2. Assentos e Modalidade Individual ({listaAssentosLote.length})
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Escolha a modalidade de cada assento individualmente (ex: um Inteira e outro Meia-Entrada).
                  </span>
                </div>

                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAdicionarAssentoAoLote}
                  className="h-8 px-3 text-xs font-bold text-primary border-primary/30 hover:bg-primary/10"
                >
                  <Plus className="size-3.5 mr-1" /> + Adicionar Outro Assento
                </Button>
              </div>

              <div className="space-y-2">
                {listaAssentosLote.map((itemAss, index) => (
                  <div 
                    key={itemAss.id}
                    className="p-2.5 rounded-xl border border-border bg-card flex flex-col md:flex-row md:items-center gap-2.5 shadow-sm"
                  >
                    <span className="text-xs font-bold text-muted-foreground px-1 shrink-0">
                      #{index + 1}
                    </span>

                    {/* Setor */}
                    <div className="flex-1 min-w-[140px]">
                      <Select 
                        value={itemAss.setor} 
                        onValueChange={(val) => handleAtualizarAssentoDoLote(itemAss.id, "setor", val)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Setor" />
                        </SelectTrigger>
                        <SelectContent>
                          {setoresDisponiveis.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Fileira */}
                    <div className="w-16">
                      <Input 
                        value={itemAss.fileira} 
                        onChange={(e) => handleAtualizarAssentoDoLote(itemAss.id, "fileira", e.target.value.toUpperCase())}
                        placeholder="Fila"
                        className="h-8 text-xs uppercase text-center font-bold"
                      />
                    </div>

                    {/* Assento */}
                    <div className="w-20">
                      <Input 
                        value={itemAss.assento} 
                        onChange={(e) => handleAtualizarAssentoDoLote(itemAss.id, "assento", e.target.value)}
                        placeholder="Nº Cadeira"
                        className="h-8 text-xs font-bold text-center font-mono text-primary"
                      />
                    </div>

                    {/* Tipo / Modalidade Individual do Ingresso */}
                    <div className="w-36">
                      <Select 
                        value={itemAss.tipoIngresso || "INTEIRA"} 
                        onValueChange={(val) => handleAtualizarAssentoDoLote(itemAss.id, "tipoIngresso", val)}
                      >
                        <SelectTrigger className="h-8 text-xs font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INTEIRA">Inteira</SelectItem>
                          <SelectItem value="MEIA-ENTRADA">Meia-Entrada</SelectItem>
                          <SelectItem value="CORTESIA VIP">Cortesia VIP</SelectItem>
                          <SelectItem value="CONVITE ESPECIAL">Convite Especial</SelectItem>
                          <SelectItem value="IMPRENSA">Imprensa & Mídia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Botão Remover Linha (se houver mais de 1) */}
                    {listaAssentosLote.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 shrink-0"
                        onClick={() => handleRemoverAssentoDoLote(itemAss.id)}
                        title="Remover este assento"
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setModalNovoOpen(false)}>
                Cancelar
              </Button>
              <Button 
                type="button" 
                onClick={handleEmitirIngresso}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                <Plus className="size-4 mr-2" />
                {listaAssentosLote.length > 1 
                  ? `Gerar ${listaAssentosLote.length} Ingressos na Mesma Folha A4` 
                  : "Gerar Ingresso"
                }
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização do Bilhete Digital com Grandes Setas Laterais Flutuantes, Teclado e Swipe */}
      {modalVisualizar && (
        <Dialog open={!!modalVisualizar} onOpenChange={() => setModalVisualizar(null)}>
          <DialogContent 
            className="max-w-lg p-4 sm:p-6 bg-transparent border-none shadow-none focus:outline-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="relative space-y-4">
              {/* Botão Flutuante Esquerdo (Seta Grande Anterior) */}
              {listaVisualizacaoGrupo.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVoltarIngresso();
                  }}
                  className="absolute -left-4 sm:-left-12 top-1/2 -translate-y-1/2 z-50 size-11 rounded-full bg-slate-900/90 hover:bg-indigo-600 text-white flex items-center justify-center shadow-2xl border-2 border-white/20 transition-all cursor-pointer hover:scale-110 active:scale-95"
                  title="Ingresso Anterior (Seta Esquerda)"
                >
                  <ChevronLeft className="size-6" />
                </button>
              )}

              {/* Botão Flutuante Direito (Seta Grande Próximo) */}
              {listaVisualizacaoGrupo.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAvancarIngresso();
                  }}
                  className="absolute -right-4 sm:-right-12 top-1/2 -translate-y-1/2 z-50 size-11 rounded-full bg-slate-900/90 hover:bg-indigo-600 text-white flex items-center justify-center shadow-2xl border-2 border-white/20 transition-all cursor-pointer hover:scale-110 active:scale-95"
                  title="Próximo Ingresso (Seta Direita)"
                >
                  <ChevronRight className="size-6" />
                </button>
              )}

              {/* Barra Superior do Carousel */}
              {listaVisualizacaoGrupo.length > 1 && (
                <div className="flex items-center justify-between bg-slate-900/90 backdrop-blur-md text-white px-4 py-2 rounded-xl border border-white/10 shadow-lg">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleVoltarIngresso} 
                    className="h-7 px-2 text-white hover:bg-white/20 font-bold"
                  >
                    <ChevronLeft className="size-4 mr-1" /> Anterior
                  </Button>
                  <span className="text-xs font-mono font-bold text-indigo-300">
                    Ingresso {indiceVisualizacao + 1} de {listaVisualizacaoGrupo.length}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleAvancarIngresso} 
                    className="h-7 px-2 text-white hover:bg-white/20 font-bold"
                  >
                    Próximo <ChevronRight className="size-4 ml-1" />
                  </Button>
                </div>
              )}

              <VisualIngressoCard 
                dados={modalVisualizar}
                onDownload={() => {
                  const atual = {
                    ...modalVisualizar,
                    bannerShowUrl: modalVisualizar.bannerShowUrl || showBannerUrl || undefined
                  };
                  exportarIngressoPDF(atual);
                }}
              />

              {listaVisualizacaoGrupo.length > 1 && (
                <p className="text-[11px] text-center text-slate-300 drop-shadow-sm font-medium">
                  💡 Clique nas setas grandes laterais, use o teclado (← / →) ou deslize a tela.
                </p>
              )}

              <div className="flex items-center justify-center gap-3 pt-1 flex-wrap">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => setModalVisualizar(null)}
                >
                  Fechar
                </Button>

                {listaVisualizacaoGrupo.length > 1 && (
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md"
                    size="sm" 
                    onClick={() => {
                      const listaComBanner = listaVisualizacaoGrupo.map(item => ({
                        ...item,
                        bannerShowUrl: item.bannerShowUrl || showBannerUrl || undefined
                      }));
                      exportarLoteIngressosFolhaA4(listaComBanner, modalVisualizar.titularNome);
                    }}
                  >
                    <Download className="size-4 mr-1.5" /> Baixar Todos em Folha A4 ({listaVisualizacaoGrupo.length})
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
