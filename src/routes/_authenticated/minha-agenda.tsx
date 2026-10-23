import { AccessDenied } from "@/components/AccessDenied";
// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Route as AuthedRoute } from "./route";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Sparkles,
  Users,
  Lock,
  Tag,
  Bus,
  Trash2,
  Filter
} from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/minha-agenda")({
  head: () => ({ meta: [{ title: "Minha Agenda - Áxis - Gestão de Teatros e Shows" }] }),
  component: MinhaAgendaPage,
});

// Paleta Profissional e Elegante com Alto Contraste (Light & Dark)
const TIPO_THEME_MAP: Record<string, {
  bg: string;
  border: string;
  text: string;
  tagBg: string;
  tagText: string;
  accent: string;
}> = {
  espetaculo: {
    bg: "bg-purple-100/90 dark:bg-purple-900/40 hover:bg-purple-200/90 dark:hover:bg-purple-900/60",
    border: "border-l-purple-600 dark:border-l-purple-400",
    text: "text-purple-950 dark:text-purple-100",
    tagBg: "bg-purple-200/90 dark:bg-purple-800/80",
    tagText: "text-purple-900 dark:text-purple-200",
    accent: "#9333ea",
  },
  oficina: {
    bg: "bg-amber-100/90 dark:bg-amber-900/40 hover:bg-amber-200/90 dark:hover:bg-amber-900/60",
    border: "border-l-amber-600 dark:border-l-amber-400",
    text: "text-amber-950 dark:text-amber-100",
    tagBg: "bg-amber-200/90 dark:bg-amber-800/80",
    tagText: "text-amber-900 dark:text-amber-200",
    accent: "#d97706",
  },
  ensaio: {
    bg: "bg-emerald-100/90 dark:bg-emerald-900/40 hover:bg-emerald-200/90 dark:hover:bg-emerald-900/60",
    border: "border-l-emerald-600 dark:border-l-emerald-400",
    text: "text-emerald-950 dark:text-emerald-100",
    tagBg: "bg-emerald-200/90 dark:bg-emerald-800/80",
    tagText: "text-emerald-900 dark:text-emerald-200",
    accent: "#059669",
  },
  reuniao: {
    bg: "bg-indigo-100/90 dark:bg-indigo-900/40 hover:bg-indigo-200/90 dark:hover:bg-indigo-900/60",
    border: "border-l-indigo-600 dark:border-l-indigo-400",
    text: "text-indigo-950 dark:text-indigo-100",
    tagBg: "bg-indigo-200/90 dark:bg-indigo-800/80",
    tagText: "text-indigo-900 dark:text-indigo-200",
    accent: "#4f46e5",
  },
  tarefa: {
    bg: "bg-rose-100/90 dark:bg-rose-900/40 hover:bg-rose-200/90 dark:hover:bg-rose-900/60",
    border: "border-l-rose-600 dark:border-l-rose-400",
    text: "text-rose-950 dark:text-rose-100",
    tagBg: "bg-rose-200/90 dark:bg-rose-800/80",
    tagText: "text-rose-900 dark:text-rose-200",
    accent: "#e11d48",
  },
  anotacao: {
    bg: "bg-yellow-100/90 dark:bg-yellow-900/40 hover:bg-yellow-200/90 dark:hover:bg-yellow-900/60",
    border: "border-l-yellow-600 dark:border-l-yellow-400",
    text: "text-yellow-950 dark:text-yellow-100",
    tagBg: "bg-yellow-200/90 dark:bg-yellow-800/80",
    tagText: "text-yellow-900 dark:text-yellow-200",
    accent: "#ca8a04",
  },
  outro: {
    bg: "bg-slate-200/90 dark:bg-slate-800/60 hover:bg-slate-300/90 dark:hover:bg-slate-800/80",
    border: "border-l-slate-600 dark:border-l-slate-400",
    text: "text-slate-950 dark:text-slate-100",
    tagBg: "bg-slate-300/90 dark:bg-slate-700/80",
    tagText: "text-slate-900 dark:text-slate-200",
    accent: "#475569",
  },
  viagem: {
    bg: "bg-sky-100/90 dark:bg-sky-900/40 hover:bg-sky-200/90 dark:hover:bg-sky-900/60",
    border: "border-l-sky-600 dark:border-l-sky-400",
    text: "text-sky-950 dark:text-sky-100",
    tagBg: "bg-sky-200/90 dark:bg-sky-800/80",
    tagText: "text-sky-900 dark:text-sky-200",
    accent: "#0284c7",
  }
};

export type AgendaItem = {
  id: string;
  source: "escala" | "viagem" | "compromisso" | "anotacao";
  titulo: string;
  subtitulo?: string;
  descricao?: string;
  data: string; // YYYY-MM-DD
  data_fim?: string; // YYYY-MM-DD
  hora?: string;
  local?: string;
  tipo: "espetaculo" | "oficina" | "ensaio" | "reuniao" | "viagem" | "tarefa" | "anotacao";
  cor?: string;
  privada?: boolean;
  funcao?: string;
  statusEscala?: string;
  visibilidade?: string;
  criadoPor?: string;
  raw?: any;
};

function MinhaAgendaPage() {
  // --- SEGURANÇA E CONTROLE DE ACESSO OFICIAL AXIS ---
  const routeCtx = AuthedRoute.useRouteContext ? AuthedRoute.useRouteContext() : null;
  const allowedRolesList = ["dev","produtor","assistente_producao","tour_manager","stage_manager","contra_regra","cenotecnico","iluminador","tecnico_som","tecnico_video","rigger","roadie","camareiro","musico","elenco","motorista","assessoria_imprensa","midias_sociais"];
  const profileRoles = routeCtx?.profile ? [routeCtx.profile.role, ...(Array.isArray(routeCtx.profile.funcoes) ? routeCtx.profile.funcoes : [])] : [];
  const hasAccess = profileRoles.some(r => allowedRolesList.includes(r));
  if (routeCtx?.profile && !hasAccess) {
    return <AccessDenied message="Você não possui permissão para acessar esta área com o seu perfil atual." />;
  }
  // ----------------------------------------------------

  const { profile } = AuthedRoute.useRouteContext();
  const isProdutor = profile?.role === "admin" || profile?.role === "dev" || profile?.role === "produtor";

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  // Listagens agregadas
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [perfis, setPerfis] = useState<any[]>([]);

  // Filtro de tipos
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos");

  // Modais
  const [modalNovoCompromisso, setModalNovoCompromisso] = useState(false);
  const [modalNovaAnotacao, setModalNovaAnotacao] = useState(false);
  const [modalDetalhesItem, setModalDetalhesItem] = useState<AgendaItem | null>(null);
  const [editingItem, setEditingItem] = useState<AgendaItem | null>(null);

  // Form de novo compromisso geral (Produtor)
  const [formTitulo, setFormTitulo] = useState("");
  const [formDescricao, setFormDescricao] = useState("");
  const [formTipo, setFormTipo] = useState<string>("oficina");
  const [formData, setFormData] = useState("");
  const [formHora, setFormHora] = useState("");
  const [formLocal, setFormLocal] = useState("");
  const [formVisibilidade, setFormVisibilidade] = useState<string>("todos");
  const [formDestinatarios, setFormDestinatarios] = useState<string[]>([]);
  const [savingCompromisso, setSavingCompromisso] = useState(false);

  // Form de anotação pessoal (Qualquer usuário)
  const [formNotaTitulo, setFormNotaTitulo] = useState("");
  const [formNotaDescricao, setFormNotaDescricao] = useState("");
  const [formNotaData, setFormNotaData] = useState("");
  const [formNotaHora, setFormNotaHora] = useState("");
  const [savingNota, setSavingNota] = useState(false);

  // Carrega Perfis para o produtor poder selecionar
  useEffect(() => {
    if (isProdutor) {
      supabase
        .from("profiles")
        .select("id, nome, role, email")
        .order("nome")
        .then(({ data }) => {
          if (data) setPerfis(data);
        });
    }
  }, [isProdutor]);

  // Carrega e agrega todas as fontes de eventos
  const carregarTudo = async () => {
    if (!profile?.id) return;
    setLoading(true);

    try {
      const eventosAgregados: AgendaItem[] = [];

      // 1. Viagens / Roadbooks (Filtrando se o usuário está escalado, a menos que seja gestão executiva)
      const isGestorAgenda = ['admin', 'dev', 'produtor', 'assistente_producao', 'tour_manager'].includes(profile?.role || '');
      
      const [{ data: rawViagens }, { data: evtsList }, { data: userEscalas }] = await Promise.all([
        supabase.from("roadbooks").select("id, evento_id, espetaculo, cidade, data_inicial, data_final, programacao"),
        !isGestorAgenda ? supabase.from("eventos").select("id, equipe") : Promise.resolve({ data: [] }),
        !isGestorAgenda ? supabase.from("evento_escalas").select("evento_id, status").eq("usuario_id", profile.id) : Promise.resolve({ data: [] })
      ]);

      let viagensData = rawViagens || [];
      if (!isGestorAgenda) {
        viagensData = viagensData.filter(rb => {
          const eId = (rb as any).evento_id;
          if (!eId) return false;
          
          const isAceita = userEscalas?.some(e => String(e.evento_id) === String(eId) && String(e.status).toLowerCase().includes('aceit'));
          if (isAceita) return true;

          const evt = evtsList?.find(e => String(e.id) === String(eId));
          const isInEquipe = evt?.equipe && Array.isArray(evt.equipe) && evt.equipe.includes(profile.id);
          return isInEquipe;
        });
      }

      if (viagensData) {
        viagensData.forEach((rb) => {
          if (rb.data_inicial) {
            let dIni = rb.data_inicial;
            let dFim = rb.data_final || rb.data_inicial;

            // Se as datas foram inseridas invertidas, ajusta para o intervalo correto
            if (dFim < dIni) {
              const temp = dIni;
              dIni = dFim;
              dFim = temp;
            }

            // A própria Viagem contínua (Faixa azul)
            eventosAgregados.push({
              id: `viagem_${rb.id}`,
              source: "viagem",
              titulo: `Viagem: ${rb.cidade || rb.espetaculo || "Turnê"}`,
              subtitulo: `${rb.espetaculo || "Turnê"} • Deslocamento`,
              descricao: `Destino: ${rb.cidade || "Não informado"} (Período: ${dIni} até ${dFim})`,
              data: dIni,
              data_fim: dFim,
              local: rb.cidade,
              tipo: "viagem",
              cor: "#0284c7", // Azul Sky
              raw: rb,
            });

            // Puxa APENAS as datas dos espetáculos do Roadbook, deduplicando por data/horário
            if (Array.isArray(rb.programacao)) {
              const vistos = new Set();
              rb.programacao.forEach((prog: any, pIdx: number) => {
                const titLower = (prog.titulo || "").trim().toLowerCase();
                // Apenas itens que são espetáculo real (ignora preparação, deslocamento e oficinas)
                const isRealApres =
                  (titLower.startsWith("apresentação") || titLower.startsWith("apresentacao") || titLower.includes("sessão") || titLower.includes("sessao")) &&
                  !titLower.includes("deslocamento") &&
                  !titLower.includes("preparação") &&
                  !titLower.includes("preparacao") &&
                  !titLower.includes("montagem");

                if (isRealApres && prog.data) {
                  const horaLimpa = (prog.hora_inicio || prog.horario || "").slice(0, 5);
                  const chave = `${prog.data}_${horaLimpa}`;
                  
                  // Se já adicionamos essa mesma sessão (ex: 20:00 e 20:00:00), ignora a duplicata
                  if (!vistos.has(chave)) {
                    vistos.add(chave);
                    eventosAgregados.push({
                      id: `rb_apres_${rb.id}_${pIdx}`,
                      source: "escala",
                      titulo: rb.espetaculo || "Espetáculo",
                      subtitulo: "Espetáculo",
                      descricao: `${prog.titulo} • ${prog.local || rb.cidade}`,
                      data: prog.data,
                      hora: horaLimpa || undefined,
                      local: [prog.local, rb.cidade].filter(Boolean).join(" - "),
                      tipo: "espetaculo",
                      cor: "#8b5cf6",
                      raw: { prog, rb },
                    });
                  }
                }
              });
            }
          }
        });
      }

      // 3. Compromissos e Oficinas da Tabela `agenda_compromissos` (100% Postgres)
      const { data: compromissosData, error: errComp } = await supabase
        .from("agenda_compromissos")
        .select("*")
        .order("data_inicio", { ascending: true });

      if (!errComp && compromissosData) {
        compromissosData.forEach((comp) => {
          const isOwner = comp.criado_por === profile.id || comp.usuario_id === profile.id;

          // Se for anotação privada ou 'somente_eu': APENAS o dono pode ver! Ninguém mais.
          if (comp.privada || comp.visibilidade_tipo === "somente_eu") {
            if (!isOwner) return;
          }

          // Se for restrito a pessoas selecionadas:
          if (comp.visibilidade_tipo === "selecionados") {
            const dests = Array.isArray(comp.destinatarios_ids) ? comp.destinatarios_ids : [];
            const isTarget = dests.includes(profile.id);
            if (!isOwner && !isTarget) return;
          }

          const dataIso = comp.data_inicio ? comp.data_inicio.split("T")[0] : "";
          const dataFimIso = comp.data_fim ? comp.data_fim.split("T")[0] : undefined;
          const horaIso = comp.data_inicio && comp.data_inicio.includes("T")
            ? comp.data_inicio.split("T")[1]?.slice(0, 5)
            : undefined;

          eventosAgregados.push({
            id: comp.id,
            source: comp.privada ? "anotacao" : "compromisso",
            titulo: comp.titulo,
            subtitulo: comp.privada ? "Anotação Pessoal" : comp.visibilidade_tipo === "somente_eu" ? "Compromisso Pessoal" : comp.tipo?.toUpperCase(),
            descricao: comp.descricao,
            data: dataIso,
            data_fim: dataFimIso,
            hora: horaIso,
            local: comp.local,
            tipo: comp.tipo || "oficina",
            cor: comp.cor || (comp.privada ? "#eab308" : "#ec4899"),
            privada: comp.privada || comp.visibilidade_tipo === "somente_eu",
            visibilidade: comp.visibilidade_tipo,
            criadoPor: comp.criado_por,
            raw: comp,
          });
        });
      }

      setItems(eventosAgregados);
    } catch (e) {
      console.error("Erro ao carregar agenda:", e);
      toast.error("Não foi possível carregar alguns itens da agenda.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarTudo();
  }, [profile?.id]);

  // Salvando novo compromisso geral (Produtor) no Banco
  const salvarCompromissoProdutor = async () => {
    if (!formTitulo.trim() || !formData) {
      toast.error("Preencha ao menos o título e a data.");
      return;
    }

    setSavingCompromisso(true);
    const dataHoraIso = formHora ? `${formData}T${formHora}:00` : `${formData}T09:00:00`;

    const novoPayload = {
      titulo: formTitulo.trim(),
      descricao: formDescricao.trim(),
      tipo: formTipo,
      data_inicio: dataHoraIso,
      local: formLocal.trim(),
      privada: formVisibilidade === "somente_eu",
      visibilidade_tipo: formVisibilidade,
      destinatarios_ids: formVisibilidade === "selecionados" ? formDestinatarios : [],
      criado_por: profile.id,
      cor: formTipo === "oficina" ? "#f97316" : formTipo === "ensaio" ? "#10b981" : "#ec4899",
    };

    const { error } = await supabase.from("agenda_compromissos").insert([novoPayload]);

    if (error) {
      toast.error("Erro ao salvar no banco: " + error.message);
      setSavingCompromisso(false);
      return;
    }

    toast.success("Compromisso adicionado com sucesso!");
    setSavingCompromisso(false);
    setModalNovoCompromisso(false);
    resetFormCompromisso();
    carregarTudo();
  };

  // Salvando anotação pessoal no Banco
  const salvarAnotacaoPessoal = async () => {
    if (!formNotaTitulo.trim() || !formNotaData) {
      toast.error("Informe um título e uma data para a anotação.");
      return;
    }

    setSavingNota(true);
    const dataHoraIso = formNotaHora ? `${formNotaData}T${formNotaHora}:00` : `${formNotaData}T09:00:00`;

    const novoPayload = {
      titulo: formNotaTitulo.trim(),
      descricao: formNotaDescricao.trim(),
      tipo: "anotacao",
      data_inicio: dataHoraIso,
      privada: true,
      visibilidade_tipo: "privada",
      criado_por: profile.id,
      usuario_id: profile.id,
      cor: "#eab308", // Amarelo de post-it
    };

    const { error } = await supabase.from("agenda_compromissos").insert([novoPayload]);

    if (error) {
      toast.error("Erro ao salvar anotação no banco: " + error.message);
      setSavingNota(false);
      return;
    }

    toast.success("Anotação salva com sucesso!");
    setSavingNota(false);
    setModalNovaAnotacao(false);
    resetFormNota();
    carregarTudo();
  };

  // Abrir modal de edição com os dados pré-preenchidos
  const iniciarEdicao = (item: AgendaItem) => {
    setModalDetalhesItem(null);
    setEditingItem(item);

    if (item.source === "anotacao" || item.privada) {
      setFormNotaTitulo(item.titulo);
      setFormNotaDescricao(item.descricao || "");
      setFormNotaData(item.data);
      setFormNotaHora(item.hora || "");
      setModalNovaAnotacao(true);
    } else {
      setFormTitulo(item.titulo);
      setFormDescricao(item.descricao || "");
      setFormTipo(item.tipo);
      setFormData(item.data);
      setFormHora(item.hora || "");
      setFormLocal(item.local || "");
      setFormVisibilidade(item.visibilidade || "todos");
      setFormDestinatarios(item.raw?.destinatarios_ids || []);
      setModalNovoCompromisso(true);
    }
  };

  // Atualizar compromisso existente
  const atualizarCompromisso = async () => {
    if (!editingItem) return;
    if (!formTitulo.trim() || !formData) {
      toast.error("Preencha ao menos o título e a data.");
      return;
    }

    setSavingCompromisso(true);
    const dataHoraIso = formHora ? `${formData}T${formHora}:00` : `${formData}T09:00:00`;

    const payload = {
      titulo: formTitulo.trim(),
      descricao: formDescricao.trim(),
      tipo: formTipo,
      data_inicio: dataHoraIso,
      local: formLocal.trim(),
      privada: formVisibilidade === "somente_eu",
      visibilidade_tipo: formVisibilidade,
      destinatarios_ids: formVisibilidade === "selecionados" ? formDestinatarios : [],
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("agenda_compromissos").update(payload).eq("id", editingItem.id);

    if (error) {
      toast.error("Erro ao atualizar: " + error.message);
      setSavingCompromisso(false);
      return;
    }

    toast.success("Compromisso atualizado!");
    setSavingCompromisso(false);
    setModalNovoCompromisso(false);
    setEditingItem(null);
    resetFormCompromisso();
    carregarTudo();
  };

  // Atualizar anotação pessoal existente
  const atualizarAnotacao = async () => {
    if (!editingItem) return;
    if (!formNotaTitulo.trim() || !formNotaData) {
      toast.error("Informe título e data.");
      return;
    }

    setSavingNota(true);
    const dataHoraIso = formNotaHora ? `${formNotaData}T${formNotaHora}:00` : `${formNotaData}T09:00:00`;

    const payload = {
      titulo: formNotaTitulo.trim(),
      descricao: formNotaDescricao.trim(),
      data_inicio: dataHoraIso,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("agenda_compromissos").update(payload).eq("id", editingItem.id);

    if (error) {
      toast.error("Erro ao atualizar: " + error.message);
      setSavingNota(false);
      return;
    }

    toast.success("Anotação atualizada!");
    setSavingNota(false);
    setModalNovaAnotacao(false);
    setEditingItem(null);
    resetFormNota();
    carregarTudo();
  };

  // Excluir item do banco
  const excluirItem = async (item: AgendaItem) => {
    if (item.source === "escala" || item.source === "viagem") {
      toast.info("Apresentações e viagens devem ser gerenciadas nos seus módulos de origem.");
      return;
    }

    const isOwner = item.criadoPor === profile?.id || item.raw?.usuario_id === profile?.id;
    if (!isOwner) {
      toast.error("Apenas o autor deste compromisso pode excluí-lo.");
      return;
    }

    const { error } = await supabase.from("agenda_compromissos").delete().eq("id", item.id);
    if (!error) {
      toast.success("Compromisso excluído!");
      setModalDetalhesItem(null);
      carregarTudo();
    } else {
      toast.error("Erro ao excluir: " + error.message);
    }
  };

  const resetFormCompromisso = () => {
    setFormTitulo("");
    setFormDescricao("");
    setFormTipo("oficina");
    setFormData(format(new Date(), "yyyy-MM-dd"));
    setFormHora("");
    setFormLocal("");
    setFormVisibilidade("todos");
    setFormDestinatarios([]);
  };

  const resetFormNota = () => {
    setFormNotaTitulo("");
    setFormNotaDescricao("");
    setFormNotaData(format(new Date(), "yyyy-MM-dd"));
    setFormNotaHora("");
  };

  // Funções de Calendário
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const daysInGrid = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Filtros aplicados
  const itensFiltrados = useMemo(() => {
    if (tipoFiltro === "todos") return items;
    return items.filter((it) => it.tipo === tipoFiltro);
  }, [items, tipoFiltro]);

  // Função para verificar se um item engloba um determinado dia
  const itemOcorreNoDia = (it: AgendaItem, dayStr: string) => {
    if (!it.data_fim || it.data_fim === it.data) {
      return it.data === dayStr;
    }
    return dayStr >= it.data && dayStr <= it.data_fim;
  };

  // Itens do dia selecionado
  const itensDoDiaSelecionado = useMemo(() => {
    const dataStr = format(selectedDate, "yyyy-MM-dd");
    return itensFiltrados.filter((it) => itemOcorreNoDia(it, dataStr));
  }, [itensFiltrados, selectedDate]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent flex items-center gap-2.5">
            <CalendarIcon className="size-8 text-primary" />
            Minha Agenda & Compromissos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Seus espetáculos, viagens contínuas, oficinas e anotações pessoais.
          </p>
        </div>

        {/* BOTÕES DE AÇÃO */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Botão de Anotação */}
          <Button
            onClick={() => {
              setFormNotaData(format(selectedDate, "yyyy-MM-dd"));
              setModalNovaAnotacao(true);
            }}
            className="rounded-xl bg-amber-500 hover:bg-amber-600 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 text-white dark:text-amber-300 font-bold border border-amber-500/30 shadow-sm transition-all"
          >
            <Tag className="size-4 mr-2" />
            + Minha Anotação
          </Button>

          {/* Botão de Oficina / Evento Geral */}
          {isProdutor && (
            <Button
              onClick={() => {
                setFormData(format(selectedDate, "yyyy-MM-dd"));
                setModalNovoCompromisso(true);
              }}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600/30 dark:hover:bg-indigo-600/50 text-white dark:text-indigo-200 font-bold border border-indigo-500/40 shadow-sm transition-all"
            >
              <Plus className="size-4 mr-2" />
              + Novo Evento / Oficina
            </Button>
          )}
        </div>
      </div>

      {/* FILTROS RÁPIDOS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 shrink-0 mr-1">
          <Filter className="size-3.5" /> Filtrar:
        </span>
        {[
          { id: "todos", label: "Tudo" },
          { id: "espetaculo", label: "Espetáculos / Shows", color: "bg-purple-500 text-purple-600 dark:text-purple-300" },
          { id: "viagem", label: "Viagens (Faixas)", color: "bg-sky-500 text-sky-600 dark:text-sky-300" },
          { id: "oficina", label: "Oficinas", color: "bg-amber-500 text-amber-600 dark:text-amber-300" },
          { id: "ensaio", label: "Ensaios", color: "bg-emerald-500 text-emerald-600 dark:text-emerald-300" },
          { id: "anotacao", label: "Minhas Anotações", color: "bg-yellow-500 text-yellow-600 dark:text-yellow-300" },
          { id: "outro", label: "Outros", color: "bg-slate-500 text-slate-600 dark:text-slate-300" },
        ].map((f) => {
          const isSelected = tipoFiltro === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setTipoFiltro(f.id)}
              className={`rounded-full text-xs font-semibold h-7 px-3.5 shrink-0 transition-all flex items-center gap-1.5 border ${
                isSelected
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-transparent shadow-xs"
                  : "bg-white/80 dark:bg-card/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/25"
              }`}
            >
              {f.color && <span className={`size-2 rounded-full shrink-0 ${f.color.split(' ')[0]}`} />}
              {f.label}
            </button>
          );
        })}
      </div>

      {/* GRID PRINCIPAL: CALENDÁRIO + LATERAL DO DIA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* BLOCO DO CALENDÁRIO (8 COLUNAS) */}
        <Card className="lg:col-span-8 shadow-sm rounded-2xl border-slate-200/80 dark:border-white/10 overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/5 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg sm:text-xl font-bold capitalize text-slate-800 dark:text-slate-100">
                {format(currentDate, "MMMM yyyy", { locale: ptBR })}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={goToToday}
                className="text-xs h-7 px-2.5 rounded-lg text-primary font-semibold hover:bg-primary/10"
              >
                Hoje
              </Button>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={prevMonth}
                className="h-8 w-8 rounded-lg"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nextMonth}
                className="h-8 w-8 rounded-lg"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-2 sm:p-4">
            {/* CABEÇALHO DIAS DA SEMANA */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d, i) => (
                <div
                  key={i}
                  className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* DIAS DO MÊS */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {daysInGrid.map((day, idx) => {
                const dayStr = format(day, "yyyy-MM-dd");
                // Separa as viagens (faixas) dos eventos pontuais
                const allDayEvents = itensFiltrados.filter((it) => itemOcorreNoDia(it, dayStr));
                const viagensDoDia = allDayEvents.filter((it) => it.tipo === "viagem");
                const outrosDoDia = allDayEvents.filter((it) => it.tipo !== "viagem");

                // Garante que a viagem SEMPRE apareça em primeiro lugar sem ser engolida
                const dayEventsSorted = [...viagensDoDia, ...outrosDoDia];

                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isDayToday = isToday(day);

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDate(day)}
                    className={`min-h-[100px] sm:min-h-[115px] p-2 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden group/cell ${
                      isSelected
                        ? "border-primary bg-gradient-to-b from-primary/10 via-primary/5 to-transparent ring-2 ring-primary/30 shadow-md shadow-primary/5"
                        : isDayToday
                        ? "border-primary/40 bg-slate-50/80 dark:bg-white/[0.03] shadow-xs"
                        : isCurrentMonth
                        ? "border-slate-200/60 dark:border-white/5 hover:border-slate-400/40 dark:hover:border-white/20 bg-white/70 dark:bg-card/60 hover:shadow-md hover:-translate-y-0.5"
                        : "border-transparent text-slate-300 dark:text-slate-600 bg-slate-50/30 dark:bg-card/10 opacity-40 hover:opacity-75"
                    }`}
                  >
                    {/* Número do Dia & Contador */}
                    <div className="flex items-center justify-between relative z-10 mb-1">
                      <span
                        className={`text-xs font-black size-6 flex items-center justify-center rounded-full transition-transform group-hover/cell:scale-110 ${
                          isDayToday
                            ? "bg-gradient-to-tr from-primary to-indigo-600 text-white shadow-sm shadow-primary/30"
                            : isSelected
                            ? "bg-primary/20 text-primary font-black"
                            : isCurrentMonth
                            ? "text-slate-700 dark:text-slate-200 group-hover/cell:text-primary"
                            : "text-slate-400"
                        }`}
                      >
                        {format(day, "d")}
                      </span>

                      {dayEventsSorted.length > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100/80 dark:bg-white/10 text-slate-600 dark:text-slate-300 backdrop-blur-xs">
                          {dayEventsSorted.length}
                        </span>
                      )}
                    </div>

                    {/* ESTRUTURA FIXA ESTILO GOOGLE CALENDAR */}
                    <div className="flex-1 flex flex-col justify-between mt-1 relative z-10 overflow-hidden">
                      {/* SLOT 1 (SUPERIOR FIXO): Sempre reservado para a faixa de viagem / evento multi-dia */}
                      <div className="h-[22px] mb-1">
                        {viagensDoDia.length > 0 ? (
                          (() => {
                            const v = viagensDoDia[0];
                            const isStart = v.data === dayStr;
                            const isEnd = v.data_fim === dayStr;
                            const dayOfWeek = day.getDay(); // 0 dom, 6 sab
                            const roundedClass =
                              isStart && isEnd
                                ? "rounded-md"
                                : isStart || dayOfWeek === 0
                                ? "rounded-l-md"
                                : isEnd || dayOfWeek === 6
                                ? "rounded-r-md"
                                : "rounded-none";

                            return (
                              <div
                                className={`h-[22px] px-2 text-white truncate font-bold text-[10px] flex items-center gap-1.5 shadow-xs bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-105 transition-all ${roundedClass}`}
                                title={`${v.titulo} (${v.data} até ${v.data_fim})`}
                              >
                                <Bus className="size-3 shrink-0 opacity-95" />
                                <span className="truncate tracking-tight">
                                  {isStart || dayOfWeek === 0 ? v.titulo : "↳ Em Viagem"}
                                </span>
                              </div>
                            );
                          })()
                        ) : (
                          <div className="h-[20px]" />
                        )}
                      </div>

                      {/* SLOT 2 e 3: Eventos pontuais (Apresentações, oficinas, notas) */}
                      <div className="space-y-1 overflow-hidden">
                        {outrosDoDia.slice(0, 2).map((ev) => {
                          const t = TIPO_THEME_MAP[ev.tipo] || TIPO_THEME_MAP.outro;
                          return (
                            <div
                              key={ev.id}
                              className={`text-[10.5px] px-2 py-0.5 rounded-lg border-l-[3px] truncate font-semibold shadow-2xs flex items-center gap-1.5 transition-all ${t.bg} ${t.border} ${t.text}`}
                              title={ev.titulo}
                            >
                              {ev.hora && (
                                <span className={`font-black text-[9px] px-1 py-0.2 rounded shrink-0 ${t.tagBg} ${t.tagText}`}>
                                  {ev.hora}
                                </span>
                              )}
                              <span className="truncate">{ev.titulo}</span>
                            </div>
                          );
                        })}
                        {outrosDoDia.length > 2 && (
                          <div className="text-[9px] text-slate-400 font-semibold px-1">
                            +{outrosDoDia.length - 2} mais
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* BLOCO LATERAL: ITENS DO DIA SELECIONADO (4 COLUNAS) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="shadow-md rounded-2xl border-slate-200/80 dark:border-white/10 overflow-hidden bg-white/80 dark:bg-card/70 backdrop-blur-xl">
            <CardHeader className="p-5 border-b border-slate-100 dark:border-white/5 bg-gradient-to-r from-slate-50/90 to-indigo-50/30 dark:from-card dark:to-card/40">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    Agenda do Dia
                  </span>
                  <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 capitalize mt-0.5">
                    {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </CardTitle>
                </div>
                {isToday(selectedDate) && (
                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                    Hoje
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
              {itensDoDiaSelecionado.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <CalendarIcon className="size-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">Nenhum compromisso marcado para este dia.</p>
                  <p className="text-xs mt-1 text-slate-400">
                    Use os botões acima para incluir uma anotação ou compromisso.
                  </p>
                </div>
              ) : (
                itensDoDiaSelecionado.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setModalDetalhesItem(item)}
                    className="p-4 pl-5 rounded-2xl border border-slate-200/70 dark:border-white/10 hover:border-primary/60 dark:hover:border-primary/60 bg-white dark:bg-slate-900/90 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group relative overflow-hidden"
                  >
                    {(() => {
                      const t = TIPO_THEME_MAP[item.tipo] || TIPO_THEME_MAP.outro;
                      return (
                        <div
                          style={{ backgroundColor: t.accent }}
                          className="absolute left-0 top-0 bottom-0 w-1.5"
                        />
                      );
                    })()}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(() => {
                          const t = TIPO_THEME_MAP[item.tipo] || TIPO_THEME_MAP.outro;
                          return (
                            <span
                              className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${t.tagBg} ${t.tagText}`}
                            >
                              {item.tipo}
                            </span>
                          );
                        })()}
                        {item.privada && (
                          <span className="flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                            <Lock className="size-2.5" /> Pessoal
                          </span>
                        )}
                        {item.data_fim && item.data_fim !== item.data && (
                          <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold bg-sky-50 dark:bg-sky-950/30 px-1 rounded">
                            Período: {format(parseISO(item.data), "dd/MM")} até {format(parseISO(item.data_fim), "dd/MM")}
                          </span>
                        )}
                      </div>

                      {item.hora && (
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                          <Clock className="size-3 text-primary" /> {item.hora}
                        </span>
                      )}
                    </div>

                    {/* TÍTULO PRINCIPAL: NOME DO ESPETÁCULO OU EVENTO */}
                    <h4 className="font-bold text-base text-slate-900 dark:text-white mt-2 group-hover:text-primary transition-colors">
                      {item.titulo}
                    </h4>

                    {/* SUBTÍTULO */}
                    {item.subtitulo && (
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.subtitulo}
                      </p>
                    )}

                    {item.local && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-2">
                        <MapPin className="size-3 shrink-0" />
                        <span className="truncate">{item.local}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ========================================================== */}
      {/* MODAL: NOVO EVENTO / OFICINA (PRODUTOR) */}
      {/* ========================================================== */}
      <Dialog open={modalNovoCompromisso} onOpenChange={(open) => { setModalNovoCompromisso(open); if(!open) setEditingItem(null); }}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="size-5 text-primary" />
              Novo Compromisso / Oficina
            </DialogTitle>
            <DialogDescription>
              Crie uma atividade coletiva para a equipe (oficina, ensaio, reunião ou aviso).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-2 overflow-y-auto flex-1">
            <div>
              <Label className="text-xs font-semibold">Tipo de Atividade</Label>
              <Select value={formTipo} onValueChange={setFormTipo}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oficina">Oficina / Workshop</SelectItem>
                  <SelectItem value="ensaio">Ensaio Técnico / Geral</SelectItem>
                  <SelectItem value="reuniao">Reunião de Produção</SelectItem>
                  <SelectItem value="tarefa">Tarefa / Meta de Produção</SelectItem>
                  <SelectItem value="outro">Outro Compromisso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold">Título *</Label>
              <Input
                placeholder="Ex: Oficina de Iluminação e Foco"
                value={formTitulo}
                onChange={(e) => setFormTitulo(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Data *</Label>
                <Input
                  type="date"
                  value={formData}
                  onChange={(e) => setFormData(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Horário</Label>
                <Input
                  type="time"
                  value={formHora}
                  onChange={(e) => setFormHora(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Local / Sala</Label>
              <Input
                placeholder="Ex: Palco Principal / Sala de Ensaio 2"
                value={formLocal}
                onChange={(e) => setFormLocal(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Descrição / Orientações</Label>
              <Textarea
                placeholder="Orientações aos convocados, material necessário..."
                value={formDescricao}
                onChange={(e) => setFormDescricao(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>

            {/* SELEÇÃO DE DESTINATÁRIOS / VISIBILIDADE */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Users className="size-3.5 text-primary" /> Quem pode ver este evento?
              </Label>
              <Select value={formVisibilidade} onValueChange={setFormVisibilidade}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Toda a Equipe (Público Geral)</SelectItem>
                  <SelectItem value="selecionados">Selecionar Pessoas Específicas</SelectItem>
                  <SelectItem value="somente_eu">Somente Eu (Privado)</SelectItem>
                </SelectContent>
              </Select>

              {formVisibilidade === "selecionados" && (
                <div className="mt-2 max-h-40 overflow-y-auto space-y-1.5 border rounded-xl p-2 bg-slate-50/50 dark:bg-card/50">
                  {perfis.map((p) => {
                    const isChecked = formDestinatarios.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className="flex items-center gap-2 text-xs p-1 rounded hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormDestinatarios([...formDestinatarios, p.id]);
                            } else {
                              setFormDestinatarios(formDestinatarios.filter((id) => id !== p.id));
                            }
                          }}
                          className="rounded text-primary focus:ring-primary"
                        />
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {p.nome || p.email}
                        </span>
                        <span className="text-[10px] text-slate-400 capitalize">({p.role})</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-6 pt-2 shrink-0 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-card/50">
            <Button variant="outline" onClick={() => setModalNovoCompromisso(false)}>
              Cancelar
            </Button>
            <Button onClick={editingItem ? atualizarCompromisso : salvarCompromissoProdutor} disabled={savingCompromisso}>
              {savingCompromisso ? "Salvando..." : editingItem ? "Salvar Alterações" : "Salvar Evento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================== */}
      {/* MODAL: NOVA ANOTAÇÃO PESSOAL (QUALQUER USUÁRIO) */}
      {/* ========================================================== */}
      <Dialog open={modalNovaAnotacao} onOpenChange={(open) => { setModalNovaAnotacao(open); if(!open) setEditingItem(null); }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Tag className="size-5 text-amber-500" />
              Minha Anotação / Lembrete
            </DialogTitle>
            <DialogDescription>
              Esta anotação é pessoal e ficará visível apenas na sua agenda.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold">O que você precisa fazer / lembrar? *</Label>
              <Input
                placeholder="Ex: Inserir mapa de luz e conferir gelatina"
                value={formNotaTitulo}
                onChange={(e) => setFormNotaTitulo(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Data *</Label>
                <Input
                  type="date"
                  value={formNotaData}
                  onChange={(e) => setFormNotaData(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Horário (Opcional)</Label>
                <Input
                  type="time"
                  value={formNotaHora}
                  onChange={(e) => setFormNotaHora(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Detalhes / Anotações</Label>
              <Textarea
                placeholder="Ex: Levar 2 cabos DMX de reserva e conferir o rider com a produtora local..."
                value={formNotaDescricao}
                onChange={(e) => setFormNotaDescricao(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setModalNovaAnotacao(false)}>
              Cancelar
            </Button>
            <Button onClick={editingItem ? atualizarAnotacao : salvarAnotacaoPessoal} disabled={savingNota} className="bg-amber-600 hover:bg-amber-700 text-white">
              {savingNota ? "Salvando..." : editingItem ? "Salvar Alterações" : "Salvar Anotação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================== */}
      {/* MODAL: DETALHES DO ITEM */}
      {/* ========================================================== */}
      {modalDetalhesItem && (
        <Dialog open={!!modalDetalhesItem} onOpenChange={() => setModalDetalhesItem(null)}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant="secondary"
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5"
                >
                  {modalDetalhesItem.tipo}
                </Badge>
                {modalDetalhesItem.privada && (
                  <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-600">
                    Anotação Privada
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-xl font-bold leading-snug">
                {modalDetalhesItem.titulo}
              </DialogTitle>
              {modalDetalhesItem.subtitulo && (
                <p className="text-xs text-slate-500 font-medium">
                  {modalDetalhesItem.subtitulo}
                </p>
              )}
            </DialogHeader>

            <div className="space-y-3 py-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <CalendarIcon className="size-4 text-primary shrink-0" />
                <span>
                  {modalDetalhesItem.data_fim && modalDetalhesItem.data_fim !== modalDetalhesItem.data ? (
                    <>
                      De <strong>{format(parseISO(modalDetalhesItem.data), "dd/MM/yyyy")}</strong> até{" "}
                      <strong>{format(parseISO(modalDetalhesItem.data_fim), "dd/MM/yyyy")}</strong>
                    </>
                  ) : (
                    <>
                      {format(parseISO(modalDetalhesItem.data), "dd 'de' MMMM 'de' yyyy", {
                        locale: ptBR,
                      })}
                      {modalDetalhesItem.hora && (
                        <strong className="text-primary ml-1">às {modalDetalhesItem.hora}</strong>
                      )}
                    </>
                  )}
                </span>
              </div>

              {modalDetalhesItem.local && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <MapPin className="size-4 text-rose-500 shrink-0" />
                  <span>{modalDetalhesItem.local}</span>
                </div>
              )}

              {modalDetalhesItem.descricao && (
                <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                  {modalDetalhesItem.descricao}
                </div>
              )}
            </div>

            <DialogFooter className="flex items-center justify-between sm:justify-between w-full pt-2 border-t border-slate-100 dark:border-white/5">
              {(modalDetalhesItem.source === "compromisso" || modalDetalhesItem.source === "anotacao") && 
               (modalDetalhesItem.criadoPor === profile?.id || modalDetalhesItem.raw?.usuario_id === profile?.id) ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => excluirItem(modalDetalhesItem)}
                    className="rounded-xl h-8 text-xs"
                  >
                    <Trash2 className="size-3.5 mr-1" /> Excluir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => iniciarEdicao(modalDetalhesItem)}
                    className="rounded-xl h-8 text-xs border-primary/30 text-primary hover:bg-primary/5"
                  >
                    Editar
                  </Button>
                </div>
              ) : (
                <div />
              )}
              <Button variant="outline" size="sm" onClick={() => setModalDetalhesItem(null)} className="rounded-xl h-8 text-xs">
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
