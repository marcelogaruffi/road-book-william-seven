import { getErrorMessage } from "@/lib/utils";
// @ts-nocheck
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  ChevronRight, ChevronLeft, Calendar, Users, Briefcase, 
  MapPin, CheckCircle2, DollarSign, FileSignature, Hotel, 
  Plane, Ticket, Sparkles, Plus, Trash2, Save, RotateCcw, 
  Info, Clock, ArrowRight, ShieldCheck, AlertCircle, Building2,
  Copy, Layers, HelpCircle, ImageIcon, Camera
} from "lucide-react";
import { Route as AuthedRoute } from "./route";
import { emptyRoadbook, RoadbookData, roadbookToPayload } from "@/lib/roadbook-types";
import { makeRoadbookSlug } from "@/lib/slug";

export const Route = createFileRoute("/_authenticated/novo-projeto")({
  head: () => ({ meta: [{ title: "Maestro de Produção - Áxis" }] }),
  component: NovoProjetoWizard,
});

// Chave para auto-save local à prova de falhas/queda de energia
const STORAGE_KEY = "axis_novo_projeto_draft_v1";

export type EventoPraça = {
  id: string; // temp id
  cidade: string;
  estado?: string;
  local: string;
  data: string;
  horario: string;
  data_inicio_viagem?: string;
  data_fim_viagem?: string;
  sessões: { data: string; horario: string; local: string }[];
  // Logística específica desta praça
  hotel_nome?: string;
  hotel_checkin?: string;
  hotel_checkout?: string;
  foto_capa_url?: string;
  transporte_tipo?: "van" | "aereo" | "onibus" | "carro" | "outro";
  voo_origem?: string;
  voo_destino?: string;
  voo_data?: string;
  voo_localizador?: string;
  ingressos_gestao?: "axis" | "local";
};

export type MembroEscala = {
  usuario_id: string;
  nome: string;
  role: string;
  funcao: string;
  cache_valor: string; // formatado R$ 0,00
  diaria_valor: string;
  qtd_diarias: number;
  transporte_valor: string;
  tipo_quarto?: "Single" | "Double" | "Twin" | "Triplo";
};

const STEPS = [
  { id: 1, title: "Escopo & Rota", icon: Calendar, description: "Espetáculo e definição da Turnê ou Show Único" },
  { id: 2, title: "Equipe & Valores", icon: Users, description: "Escalação integrada com cachês, diárias e transportes" },
  { id: 3, title: "Logística & Viagem", icon: Hotel, description: "Hospedagem (Room List), Guia de Viagem e fotos de capa" },
  { id: 4, title: "Bilheteria & Técnica", icon: Ticket, description: "Responsabilidade de ingressos e importação de mapas técnicos" },
  { id: 5, title: "Revisão & Lançamento", icon: CheckCircle2, description: "Raio-x do projeto e publicação em todos os módulos" },
];

function NovoProjetoWizard() {
  const { profile } = AuthedRoute.useRouteContext();
  const navigate = useNavigate();
  const userRole = profile?.role || "";
  const isAllowed = ['admin', 'dev', 'produtor'].includes(userRole);

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);

  // DB base resources
  const [templates, setTemplates] = useState<string[]>([]);
  const [templatesFull, setTemplatesFull] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  // STEP 1: Escopo & Rota
  const [tipoProjeto, setTipoProjeto] = useState<"unico" | "turne">("unico");
  const [espetaculo, setEspetaculo] = useState("");
  const [turneNome, setTurneNome] = useState("");
  const [produtoraNome, setProdutoraNome] = useState("");
  const [fotoCapaPadrao, setFotoCapaPadrao] = useState<string | null>(null);
  const [pracas, setPracas] = useState<EventoPraça[]>([
    {
      id: "praca-1",
      cidade: "",
      local: "",
      data: "",
      horario: "",
      sessões: [{ data: "", horario: "", local: "" }],
      ingressos_gestao: "local"
    }
  ]);

  // STEP 2: Equipe & Acordos Financeiros
  const [equipe, setEquipe] = useState<MembroEscala[]>([]);
  const [selectedProfissionalId, setSelectedProfissionalId] = useState("");
  const [selectedFuncao, setSelectedFuncao] = useState("");

  // STEP 3: Logística (Hotel & Traslados)
  const [hotelGeralNome, setHotelGeralNome] = useState("");
  const [transporteGeralTipo, setTransporteGeralTipo] = useState<"van" | "aereo" | "onibus" | "carro" | "outro">("van");
  const [detalhesTransporte, setDetalhesTransporte] = useState("");

  // STEP 4: Ingressos & Técnica
  const [ingressosModoGeral, setIngressosModoGeral] = useState<"axis" | "local">("local");
  const [importarRiders, setImportarRiders] = useState(true);

  // Inicialização e Carregamento de Recursos
  useEffect(() => {
    if (!isAllowed) {
      navigate({ to: "/dashboard", replace: true });
      return;
    }
    loadInitials();
  }, [isAllowed]);

  // Verificação de Auto-save no LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && !hasRestoredDraft) {
        const parsed = JSON.parse(saved);
        if (parsed.espetaculo || (parsed.pracas && parsed.pracas[0]?.cidade)) {
          // Pergunta amigável ou restauração silenciosa
          setTipoProjeto(parsed.tipoProjeto || "unico");
          setEspetaculo(parsed.espetaculo || "");
          setTurneNome(parsed.turneNome || "");
          setProdutoraNome(parsed.produtoraNome || "");
          if (parsed.pracas && parsed.pracas.length > 0) setPracas(parsed.pracas);
          if (parsed.equipe && parsed.equipe.length > 0) setEquipe(parsed.equipe);
          if (parsed.hotelGeralNome) setHotelGeralNome(parsed.hotelGeralNome);
          if (parsed.transporteGeralTipo) setTransporteGeralTipo(parsed.transporteGeralTipo);
          if (parsed.detalhesTransporte) setDetalhesTransporte(parsed.detalhesTransporte);
          if (parsed.fotoCapaPadrao) setFotoCapaPadrao(parsed.fotoCapaPadrao);
          if (parsed.currentStep) setCurrentStep(parsed.currentStep);
          setHasRestoredDraft(true);
          toast.info("Rascunho anterior recuperado automaticamente!");
        }
      }
    } catch (e) {
      console.warn("Erro ao ler rascunho local:", e);
    }
  }, [hasRestoredDraft]);

  // Auto-save no LocalStorage sempre que os estados essenciais mudarem
  useEffect(() => {
    try {
      const draft = {
        tipoProjeto,
        espetaculo,
        turneNome,
        produtoraNome,
        pracas,
        equipe,
        hotelGeralNome,
        transporteGeralTipo,
        detalhesTransporte,
        fotoCapaPadrao,
        currentStep,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch (e) {
      // Ignora estouro de storage
    }
  }, [tipoProjeto, espetaculo, turneNome, produtoraNome, pracas, equipe, hotelGeralNome, transporteGeralTipo, detalhesTransporte, fotoCapaPadrao, currentStep]);

  async function loadInitials() {
    setLoading(true);
    const [tRes, pRes] = await Promise.all([
      supabase.from('templates_espetaculos').select("nome_espetaculo, logo_espetaculo_url, assets_midia").neq('nome_espetaculo', 'ESTOQUE_GLOBAL').order("nome_espetaculo"),
      supabase.from("profiles").select("id, nome, role, funcoes, caches_padrao").order("nome")
    ]);
    if (tRes.data) {
      setTemplatesFull(tRes.data);
      setTemplates(tRes.data.map(t => t.nome_espetaculo));
    }
    if (pRes.data) setProfiles(pRes.data);
    setLoading(false);
  }

  // Quando o usuário escolhe o espetáculo, se não houver foto de capa padrão definida, auto-preenche com o logo ou foto de divulgação do espetáculo
  const handleSelectEspetaculo = (nomeEsp: string) => {
    setEspetaculo(nomeEsp);
    const tpl = templatesFull.find(t => t.nome_espetaculo === nomeEsp);
    if (tpl) {
      const fotosMidia = (tpl.assets_midia as any)?.fotos_divulgacao || [];
      const firstPhoto = fotosMidia[0]?.url || tpl.logo_espetaculo_url || null;
      if (firstPhoto && !fotoCapaPadrao) {
        setFotoCapaPadrao(firstPhoto);
      }
    }
  };

  const clearDraft = () => {
    if (confirm("Deseja realmente limpar todo o rascunho e recomeçar do zero?")) {
      localStorage.removeItem(STORAGE_KEY);
      setTipoProjeto("unico");
      setEspetaculo("");
      setTurneNome("");
      setProdutoraNome("");
      setPracas([{
        id: "praca-1",
        cidade: "",
        local: "",
        data: "",
        horario: "",
        sessões: [{ data: "", horario: "", local: "" }],
        ingressos_gestao: "local"
      }]);
      setEquipe([]);
      setHotelGeralNome("");
      setCurrentStep(1);
      toast.success("Rascunho reiniciado!");
    }
  };

  // Funções de Praça (Itinerário)
  const addPraca = () => {
    const newId = `praca-${Date.now()}`;
    setPracas([
      ...pracas,
      {
        id: newId,
        cidade: "",
        local: pracas[0]?.local || "",
        data: "",
        horario: pracas[0]?.horario || "",
        sessões: [{ data: "", horario: "", local: "" }],
        ingressos_gestao: ingressosModoGeral
      }
    ]);
  };

  const removePraca = (id: string) => {
    if (pracas.length <= 1) {
      toast.warning("O projeto deve ter ao menos uma cidade/apresentação.");
      return;
    }
    setPracas(pracas.filter(p => p.id !== id));
  };

  const updatePraca = (id: string, field: keyof EventoPraça, value: any) => {
    setPracas(pracas.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, [field]: value };
      // Se alterou data ou horário principal, sincroniza com a primeira sessão
      if (field === "data" || field === "horario" || field === "local") {
        if (updated.sessões.length > 0) {
          updated.sessões[0] = {
            ...updated.sessões[0],
            [field]: value
          };
        }
      }
      return updated;
    }));
  };

  const addSessaoPraca = (pracaId: string) => {
    setPracas(pracas.map(p => {
      if (p.id !== pracaId) return p;
      return {
        ...p,
        sessões: [
          ...p.sessões,
          { data: p.data || "", horario: "", local: p.local || "" }
        ]
      };
    }));
  };

  const removeSessaoPraca = (pracaId: string, idx: number) => {
    setPracas(pracas.map(p => {
      if (p.id !== pracaId) return p;
      if (p.sessões.length <= 1) return p;
      const newSess = [...p.sessões];
      newSess.splice(idx, 1);
      return { ...p, sessões: newSess };
    }));
  };

  const updateSessaoPraca = (pracaId: string, idx: number, field: string, value: string) => {
    setPracas(pracas.map(p => {
      if (p.id !== pracaId) return p;
      const newSess = [...p.sessões];
      newSess[idx] = { ...newSess[idx], [field]: value };
      return { ...p, sessões: newSess };
    }));
  };

  // Funções de Equipe
  const handleAddMembro = () => {
    if (!selectedProfissionalId) {
      toast.warning("Selecione um profissional.");
      return;
    }
    const prof = profiles.find(p => p.id === selectedProfissionalId);
    if (!prof) return;

    const funcaoFinal = selectedFuncao || prof.role || "membro";
    const exists = equipe.some(m => m.usuario_id === prof.id && m.funcao === funcaoFinal);
    if (exists) {
      toast.warning("Este profissional já está escalado nesta função.");
      return;
    }

    // Puxa cachê padrão se existir no perfil
    let defaultCache = "0,00";
    if (prof.caches_padrao && typeof prof.caches_padrao === "object") {
      const val = prof.caches_padrao[funcaoFinal];
      if (val) defaultCache = String(val);
    }

    const novoMembro: MembroEscala = {
      usuario_id: prof.id,
      nome: prof.nome,
      role: prof.role || "elenco",
      funcao: funcaoFinal,
      cache_valor: defaultCache,
      diaria_valor: "0,00",
      qtd_diarias: 1,
      transporte_valor: "0,00",
      gerar_contrato: true,
      tipo_quarto: "Single"
    };

    setEquipe([...equipe, novoMembro]);
    setSelectedProfissionalId("");
    setSelectedFuncao("");
    toast.success(`${prof.nome} adicionado(a) à equipe base!`);
  };

  const removeMembro = (usuarioId: string, funcao: string) => {
    setEquipe(equipe.filter(m => !(m.usuario_id === usuarioId && m.funcao === funcao)));
  };

  const updateMembro = (usuarioId: string, funcao: string, field: keyof MembroEscala, value: any) => {
    setEquipe(equipe.map(m => {
      if (m.usuario_id === usuarioId && m.funcao === funcao) {
        return { ...m, [field]: value };
      }
      return m;
    }));
  };

  // Validação simples para avançar etapa 1
  const handleNextStep1 = () => {
    if (!espetaculo) {
      toast.warning("Por favor, selecione o espetáculo.");
      return;
    }
    const invalidPraca = pracas.find(p => !p.cidade || !p.local || !p.data);
    if (invalidPraca) {
      toast.warning("Preencha ao menos Cidade, Local e Data de cada praça/evento.");
      return;
    }
    setCurrentStep(2);
  };

  // LANÇAMENTO FINAL (Publicação Atômica em Todos os Módulos)
  const handlePublishProject = async () => {
    setPublishing(true);
    try {
      const { data: userAuth } = await supabase.auth.getUser();
      const currentUserId = userAuth?.user?.id;

      // 1. Cria Turnê (se turnê)
      let createdTourId: string | null = null;
      if (tipoProjeto === "turne" && turneNome) {
        const slug = turneNome.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();
        const { data: tourRes, error: tourErr } = await supabase.from("tours").insert({
          nome: turneNome,
          slug,
          espetaculo,
          produtora_nome: produtoraNome || null,
          created_by: currentUserId
        }).select("id").single();

        if (tourErr) {
          console.warn("Erro ao criar turnê:", tourErr);
        } else if (tourRes) {
          createdTourId = tourRes.id;
        }
      }

      // 2. Cria Eventos e Apresentações
      const createdEventosMap: { [pracaId: string]: string } = {};

      for (const praca of pracas) {
        const payloadEvento = {
          espetaculo,
          cidade: praca.cidade,
          local: praca.local,
          data: praca.data,
          horario: praca.horario || "20:00",
          data_inicio: praca.data_inicio_viagem || praca.data,
          data_fim: praca.data_fim_viagem || praca.data,
          produtora_nome: produtoraNome || null,
          turne_id: createdTourId,
          equipe: equipe.map(m => m.usuario_id),
          created_by: currentUserId
        };

        const { data: evData, error: evErr } = await supabase.from("eventos").insert(payloadEvento).select("id").single();
        if (evErr) throw new Error("Erro ao criar evento: " + evErr.message);

        const savedEventoId = evData.id;
        createdEventosMap[praca.id] = savedEventoId;

        // Salva apresentações (sessões)
        const sessoesToInsert = praca.sessões
          .filter(s => s.data)
          .map(s => ({
            evento_id: savedEventoId,
            data: s.data,
            horario: s.horario || praca.horario || "20:00",
            local: s.local || praca.local
          }));

        if (sessoesToInsert.length > 0) {
          await supabase.from("evento_apresentacoes").insert(sessoesToInsert);
        }

        // 3. Cria Escalas e Financeiro para cada Evento
        if (equipe.length > 0) {
          for (const membro of equipe) {
            const { data: escalaData, error: escErr } = await supabase.from("evento_escalas").insert({
              evento_id: savedEventoId,
              usuario_id: membro.usuario_id,
              funcao: membro.funcao,
              status: "pendente"
            }).select("id").single();

            if (!escErr && escalaData) {
              const numCache = parseFloat(membro.cache_valor.replace(/\./g, "").replace(",", ".")) || 0;
              const numDiaria = parseFloat(membro.diaria_valor.replace(/\./g, "").replace(",", ".")) || 0;
              const numTransporte = parseFloat(membro.transporte_valor.replace(/\./g, "").replace(",", ".")) || 0;

              // Insere diretamente na tabela oficial de finanças de escala
              await supabase.from("evento_escalas_financeiro").insert({
                escala_id: escalaData.id,
                cache_valor: numCache,
                diaria_valor: numDiaria,
                transporte_valor: numTransporte,
                status_pagamento: "pendente"
              });

              // Notificação no sistema para o profissional escalado
              await supabase.from("notificacoes").insert({
                usuario_id: membro.usuario_id,
                titulo: "Nova Escala! 🎬",
                mensagem: `Você foi escalado(a) como ${membro.funcao.replace(/_/g, " ")} no evento: ${espetaculo}${praca.cidade ? " em " + praca.cidade : ""}.`,
                tipo: "escala",
                link: "/minhas-escalas"
              });
            }
          }
        }

        // 4. Cria Rooming List / Hotelaria se definida
        const hotelEfetivo = praca.hotel_nome?.trim() || hotelGeralNome?.trim() || "";
        if (hotelEfetivo) {
          const roomPayloads = equipe.map((m, idx) => ({
            evento_id: savedEventoId,
            numero_quarto: `${101 + idx}`,
            tipo_quarto: m.tipo_quarto || "Single",
            hospede_1: m.nome,
            observacoes: `Hotel: ${hotelEfetivo}`
          }));
          if (roomPayloads.length > 0) {
            await supabase.from("rooming_list").insert(roomPayloads);
          }
        }

        // 5. Cria Guia de Viagem (Roadbook) oficial pré-populado com foto de capa e hotel
        const baseSlug = makeRoadbookSlug(espetaculo, praca.cidade);
        const capaFinal = praca.foto_capa_url || fotoCapaPadrao || null;

        const roadbookObj: RoadbookData = {
          ...emptyRoadbook,
          evento_id: savedEventoId,
          tour_id: createdTourId,
          espetaculo,
          cidade: praca.cidade,
          teatro_nome: praca.local,
          data_inicial: praca.data_inicio_viagem || praca.data,
          data_final: praca.data_fim_viagem || praca.data,
          hotel_nome: hotelEfetivo,
          hotel_checkin: praca.hotel_checkin || praca.data,
          hotel_checkout: praca.hotel_checkout || praca.data,
          foto_capa_url: capaFinal,
          automacoes: {
            ...(emptyRoadbook.automacoes || {}),
            foto_capa_url: capaFinal,
          },
          slug: baseSlug,
          producao_nome: produtoraNome || "",
          quartos: equipe.map((m, idx) => ({ pessoa: m.nome, numero: `${101 + idx}` })),
          voo_ida: {
            aeroporto_origem: praca.voo_origem || "",
            aeroporto_destino: praca.voo_destino || "",
            data: praca.voo_data || praca.data,
            localizador: praca.voo_localizador || ""
          }
        };

        const roadbookPayload = roadbookToPayload(roadbookObj, currentUserId);
        
        // Tenta primeiro o slug bonito (espetaculo-cidade). Se já existir para outra data/temporada, adiciona a data ou sufixo único
        for (let attempt = 0; attempt < 5; attempt++) {
          const trySlug = attempt === 0 
            ? baseSlug 
            : attempt === 1 && praca.data
            ? `${baseSlug}-${praca.data}`
            : `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

          const { error: rbErr } = await supabase.from("roadbooks").insert({ ...roadbookPayload, slug: trySlug });
          if (!rbErr) {
            break;
          }
          if (rbErr && !`${rbErr.message}`.toLowerCase().includes("duplicate") && !`${rbErr.message}`.toLowerCase().includes("unique")) {
            console.warn("Erro ao criar roadbook:", rbErr);
            break;
          }
        }

        // 6. Importa Mapas Técnicos & Riders do Espetáculo se selecionado
        if (importarRiders && espetaculo) {
          try {
            // Busca o template oficial do espetáculo
            const { data: tpl } = await supabase
              .from("templates_espetaculos")
              .select("rider_som, rider_luz, rider_video")
              .eq("nome_espetaculo", espetaculo)
              .maybeSingle();

            // Pega a primeira apresentação deste evento
            const { data: apRow } = await supabase
              .from("evento_apresentacoes")
              .select("id")
              .eq("evento_id", savedEventoId)
              .limit(1)
              .maybeSingle();

            const apId = apRow?.id || savedEventoId;

            // Insere mapa de som se tiver rider
            if (tpl?.rider_som) {
              await supabase.from("mapas_som").insert({
                evento_id: savedEventoId,
                apresentacao_id: apId,
                user_id: currentUserId,
                cidade: praca.cidade,
                data_apresentacao: praca.data,
                espetaculo,
                json_data: typeof tpl.rider_som === "string" ? JSON.parse(tpl.rider_som) : tpl.rider_som
              });
            }

            // Insere mapa de luz se tiver rider
            if (tpl?.rider_luz) {
              await supabase.from("mapas_luz").insert({
                evento_id: savedEventoId,
                apresentacao_id: apId,
                user_id: currentUserId,
                cidade: praca.cidade,
                data_apresentacao: praca.data,
                espetaculo,
                json_data: typeof tpl.rider_luz === "string" ? JSON.parse(tpl.rider_luz) : tpl.rider_luz
              });
            }

            // Insere mapa de vídeo se tiver rider
            if (tpl?.rider_video) {
              await supabase.from("mapas_video").insert({
                evento_id: savedEventoId,
                apresentacao_id: apId,
                user_id: currentUserId,
                cidade: praca.cidade,
                data_apresentacao: praca.data,
                espetaculo,
                json_data: typeof tpl.rider_video === "string" ? JSON.parse(tpl.rider_video) : tpl.rider_video
              });
            }

            // Copia arquivos padrão de palco (stage plots)
            const { data: arqsPadrao } = await supabase
              .from("arquivos_padrao")
              .select("*")
              .eq("espetaculo_nome", espetaculo);

            if (arqsPadrao && arqsPadrao.length > 0) {
              const arqsToInsert = arqsPadrao.map(a => ({
                evento_id: savedEventoId,
                apresentacao_id: apId,
                nome: a.nome,
                arquivo_url: a.arquivo_url,
                tipo: a.tipo,
                ordem: a.ordem
              }));
              await supabase.from("arquivos_eventos").insert(arqsToInsert);
            }

            // Copia props padrão (adereços e contrarregragem)
            const { data: propsPadrao } = await supabase
              .from("props_padrao")
              .select("*")
              .eq("espetaculo_nome", espetaculo);

            if (propsPadrao && propsPadrao.length > 0) {
              const propsToInsert = propsPadrao.map(p => ({
                evento_id: savedEventoId,
                apresentacao_id: apId,
                item: p.item,
                ato: p.ato,
                cena: p.cena,
                preset_location: p.preset_location,
                descricao: p.descricao,
                personagem: p.personagem,
                termino_uso: p.termino_uso,
                arquivo_url: p.arquivo_url,
                ordem: p.ordem,
                concluido: false
              }));
              await supabase.from("props_eventos").insert(propsToInsert);
            }
          } catch (e) {
            console.warn("Riders/props import info:", e);
          }
        }
      }

      // Limpa rascunho após sucesso
      localStorage.removeItem(STORAGE_KEY);
      toast.success("Projeto criado e distribuído com sucesso por todos os módulos do Áxis!");
      navigate({ to: "/eventos" });
    } catch (err: any) {
      toast.error("Erro ao publicar projeto: " + getErrorMessage(err));
      console.error(err);
    } finally {
      setPublishing(false);
    }
  };

  const progressPercent = Math.round((currentStep / STEPS.length) * 100);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24 pt-4 px-3 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-card p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
              Maestro de Produção
            </span>
            <span className="text-xs text-slate-400 font-semibold">• Auto-save ativado</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight mt-1 flex items-center gap-3">
            <Sparkles className="size-7 text-primary" />
            Maestro de Produção
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Assistente inteligente para criar Apresentações e Turnês. Cadastre uma única vez e alimente Eventos, Escalas, Financeiro, Rooming List e Guias de Viagem sem duplicidade.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={clearDraft} className="text-xs font-bold text-slate-400 hover:text-red-500">
            <RotateCcw className="size-3.5 mr-1.5" /> Recomeçar
          </Button>
          <Button variant="outline" size="sm" asChild className="rounded-xl font-bold">
            <Link to="/eventos">Sair sem salvar</Link>
          </Button>
        </div>
      </div>

      {/* Stepper Navigation Bar (Estilo Espetáculos) */}
      <div className="bg-white dark:bg-card p-4 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {STEPS.map((s) => {
            const isActive = currentStep === s.id;
            const isCompleted = currentStep > s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentStep(s.id)}
                className={`flex items-center gap-2.5 p-2.5 rounded-2xl text-left transition-all ${
                  isActive
                    ? "bg-primary text-white shadow-md shadow-primary/25"
                    : isCompleted
                    ? "bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200 hover:bg-slate-200/60"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                <div className={`size-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isActive ? "bg-white/20 text-white" : isCompleted ? "bg-primary/10 text-primary" : "bg-slate-100 dark:bg-white/10 text-slate-400"
                }`}>
                  <s.icon className="size-4" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-[10px] uppercase font-bold opacity-70">Passo {s.id}</div>
                  <div className="text-xs font-black truncate">{s.title}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300 ease-out" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* ÁREA PRINCIPAL DO WIZARD */}
      <Card className="rounded-[2.5rem] border-slate-200/80 dark:border-white/10 shadow-lg overflow-hidden bg-white dark:bg-card">
        <CardHeader className="bg-slate-50/70 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-primary">
                Etapa {currentStep} de {STEPS.length}
              </div>
              <CardTitle className="text-2xl font-black mt-1">
                {STEPS[currentStep - 1].title}
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                {STEPS[currentStep - 1].description}
              </CardDescription>
            </div>
            <div className="hidden sm:block text-right">
              <span className="text-2xl font-black text-slate-700 dark:text-slate-300">{progressPercent}%</span>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Progresso</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-10 space-y-8">
          {/* ========================================================================= */}
          {/* PASSO 1: ESCOPO & ROTA (Apresentação Única ou Turnê) */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Seletor do Tipo: Único ou Turnê */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  onClick={() => setTipoProjeto("unico")}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                    tipoProjeto === "unico" 
                      ? "border-primary bg-primary/5 shadow-md shadow-primary/10" 
                      : "border-slate-200 dark:border-white/10 hover:border-slate-300"
                  }`}
                >
                  <div className={`p-3 rounded-xl ${tipoProjeto === "unico" ? "bg-primary text-white" : "bg-slate-100 dark:bg-white/5 text-slate-500"}`}>
                    <Calendar className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-slate-800 dark:text-white">Apresentação Única</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Evento pontual em uma única cidade/teatro, com uma ou mais sessões no mesmo local.
                    </p>
                  </div>
                </div>

                <div 
                  onClick={() => setTipoProjeto("turne")}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                    tipoProjeto === "turne" 
                      ? "border-primary bg-primary/5 shadow-md shadow-primary/10" 
                      : "border-slate-200 dark:border-white/10 hover:border-slate-300"
                  }`}
                >
                  <div className={`p-3 rounded-xl ${tipoProjeto === "turne" ? "bg-primary text-white" : "bg-slate-100 dark:bg-white/5 text-slate-500"}`}>
                    <Layers className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-slate-800 dark:text-white">Turnê Completa</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Múltiplas cidades ou datas. Equipe, cachês e hotéis herdados automaticamente com edição por exceção.
                    </p>
                  </div>
                </div>
              </div>

              {/* Dados Gerais do Espetáculo e Produtora */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-4 border-t border-slate-100 dark:border-white/5">
                <div className="space-y-2">
                  <Label className="font-bold text-sm text-slate-700 dark:text-slate-300">Espetáculo Cadastrado *</Label>
                  <select
                    value={espetaculo}
                    onChange={(e) => handleSelectEspetaculo(e.target.value)}
                    className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Selecione o espetáculo...</option>
                    {templates.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {tipoProjeto === "turne" && (
                  <div className="space-y-2">
                    <Label className="font-bold text-sm text-slate-700 dark:text-slate-300">Nome da Turnê</Label>
                    <Input
                      value={turneNome}
                      onChange={(e) => setTurneNome(e.target.value)}
                      placeholder="Ex: Turnê Sul / Sudeste 2026"
                      className="h-12 rounded-xl text-sm font-semibold"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="font-bold text-sm text-slate-700 dark:text-slate-300">Produtora Responsável</Label>
                  <Input
                    value={produtoraNome}
                    onChange={(e) => setProdutoraNome(e.target.value)}
                    placeholder="Ex: Seven Produções"
                    className="h-12 rounded-xl text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Praças / Cidades do Itinerário */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                      <MapPin className="size-5 text-primary" />
                      {tipoProjeto === "turne" ? "Itinerário da Turnê (Cidades e Locais)" : "Local e Sessões"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Adicione as cidades e teatros. Você pode incluir múltiplas sessões em cada praça.
                    </p>
                  </div>
                  {tipoProjeto === "turne" && (
                    <Button onClick={addPraca} variant="outline" size="sm" className="font-bold rounded-xl h-10 gap-1.5 border-primary/30 text-primary hover:bg-primary/5">
                      <Plus className="size-4" /> Adicionar Cidade à Turnê
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {pracas.map((praca, pIdx) => (
                    <div key={praca.id} className="p-5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 space-y-4 relative">
                      {pracas.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removePraca(praca.id)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-red-500 rounded-lg size-8"
                          title="Remover esta cidade"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}

                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-bold bg-primary/10 text-primary border-primary/20">
                          {tipoProjeto === "turne" ? `Praça #${pIdx + 1}` : "Apresentação"}
                        </Badge>
                        <span className="font-bold text-sm text-slate-700 dark:text-slate-300">
                          {praca.cidade ? praca.cidade : "Dados da Apresentação"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-slate-600">Cidade *</Label>
                          <Input
                            value={praca.cidade}
                            onChange={(e) => updatePraca(praca.id, "cidade", e.target.value)}
                            placeholder="Ex: Curitiba"
                            className="h-10 bg-white dark:bg-card rounded-xl text-xs font-semibold"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-slate-600">Local / Teatro Principal *</Label>
                          <Input
                            value={praca.local}
                            onChange={(e) => updatePraca(praca.id, "local", e.target.value)}
                            placeholder="Ex: Teatro Guaíra"
                            className="h-10 bg-white dark:bg-card rounded-xl text-xs font-semibold"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-slate-600">Data Principal *</Label>
                          <Input
                            type="date"
                            value={praca.data}
                            onChange={(e) => updatePraca(praca.id, "data", e.target.value)}
                            className="h-10 bg-white dark:bg-card rounded-xl text-xs px-2.5 min-w-0 w-full"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-slate-600">Horário Principal</Label>
                          <Input
                            type="time"
                            value={praca.horario}
                            onChange={(e) => updatePraca(praca.id, "horario", e.target.value)}
                            className="h-10 bg-white dark:bg-card rounded-xl text-xs px-2.5 min-w-0 w-full"
                          />
                        </div>
                      </div>

                      {/* Sessões Extras desta Praça */}
                      <div className="pt-2 border-t border-slate-200/50 dark:border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500 uppercase">Sessões / Horários nesta Praça</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addSessaoPraca(praca.id)}
                            className="text-xs h-7 text-primary hover:bg-primary/5 font-bold"
                          >
                            <Plus className="size-3 mr-1" /> Adicionar Outra Sessão
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {praca.sessões.map((sessao, sIdx) => (
                            <div key={sIdx} className="flex items-center gap-2 bg-white dark:bg-card p-2 rounded-xl border border-slate-200/60 dark:border-white/5">
                              <span className="text-[10px] font-bold text-slate-400 w-12 text-center">Sessão {sIdx + 1}</span>
                              <Input
                                type="date"
                                value={sessao.data}
                                onChange={(e) => updateSessaoPraca(praca.id, sIdx, "data", e.target.value)}
                                className="h-8 text-xs flex-1"
                              />
                              <Input
                                type="time"
                                value={sessao.horario}
                                onChange={(e) => updateSessaoPraca(praca.id, sIdx, "horario", e.target.value)}
                                className="h-8 text-xs w-28"
                              />
                              <Input
                                value={sessao.local}
                                onChange={(e) => updateSessaoPraca(praca.id, sIdx, "local", e.target.value)}
                                placeholder="Local (se diferente)"
                                className="h-8 text-xs flex-1"
                              />
                              {praca.sessões.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeSessaoPraca(praca.id, sIdx)}
                                  className="size-7 text-slate-400 hover:text-red-500"
                                >
                                  <Trash2 className="size-3" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PASSO 2: EQUIPE & VALORES (Escalação + Cachês + Diárias + Transporte) */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="bg-indigo-50/60 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex items-start gap-3">
                <Info className="size-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-950 dark:text-indigo-200">
                  <span className="font-bold">Princípio do Preenchimento Único:</span> Os membros e valores adicionados aqui compõem a <strong>Equipe Base</strong>. Ao finalizar, eles serão automaticamente cadastrados nas tabelas de <strong>Escalas</strong> e do <strong>Financeiro</strong> de todas as praças da produção, sem retrabalho.
                </div>
              </div>

              {/* Barra de Adicionar Membro */}
              <div className="p-4 bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-3">
                <span className="font-bold text-sm text-slate-800 dark:text-white">Escalar Profissional para a Equipe Base</span>
                <div className="grid grid-cols-1 sm:grid-cols-[1.5fr_1.2fr_auto] gap-3">
                  <select
                    value={selectedProfissionalId}
                    onChange={(e) => {
                      setSelectedProfissionalId(e.target.value);
                      const p = profiles.find(x => x.id === e.target.value);
                      if (p) setSelectedFuncao(p.role || "");
                    }}
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold"
                  >
                    <option value="">Selecione o profissional cadastrado...</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>

                  {/* Dropdown de Funções do Profissional selecionado (igual ao escalas.tsx) */}
                  {(() => {
                    const prof = profiles.find(p => p.id === selectedProfissionalId);
                    const funcoesDisponiveis = prof 
                      ? Array.from(new Set([prof.role, ...(prof.funcoes || [])])).filter(Boolean) 
                      : [];

                    return (
                      <select
                        value={selectedFuncao}
                        onChange={(e) => setSelectedFuncao(e.target.value)}
                        disabled={!selectedProfissionalId}
                        className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold disabled:opacity-50"
                      >
                        <option value="">Selecione a função...</option>
                        {funcoesDisponiveis.map(f => (
                          <option key={f} value={f}>
                            {String(f).replace(/_/g, " ").toUpperCase()}
                          </option>
                        ))}
                      </select>
                    );
                  })()}

                  <Button onClick={handleAddMembro} disabled={!selectedProfissionalId || !selectedFuncao} className="h-11 px-6 rounded-xl font-bold bg-primary text-white">
                    <Plus className="size-4 mr-1.5" /> Escalar Membro
                  </Button>
                </div>
              </div>

              {/* Tabela de Membros Escalados com Valores */}
              {equipe.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-3xl border-slate-200 dark:border-white/10 p-6 space-y-3">
                  <Users className="size-12 mx-auto text-slate-300" />
                  <h4 className="font-bold text-slate-700 dark:text-slate-300">Nenhum profissional escalado ainda</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Adicione os artistas, músicos e técnicos acima. Você poderá definir ou editar os cachês de cada um diretamente nesta tabela.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Membros Escalados ({equipe.length})
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      Valores aplicados por apresentação
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {equipe.map((m) => (
                      <div key={`${m.usuario_id}_${m.funcao}`} className="p-4 rounded-2xl bg-white dark:bg-card border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                            {m.nome.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-800 dark:text-white text-sm">{m.nome}</h4>
                            <span className="text-xs font-semibold text-primary/80 uppercase tracking-wide">
                              {m.funcao.replace(/_/g, " ")}
                            </span>
                          </div>
                        </div>

                        {/* Bloco de Valores Financeiros */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-center">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Cachê (R$)</span>
                            <CurrencyInput
                              value={m.cache_valor}
                              onChange={(val) => updateMembro(m.usuario_id, m.funcao, "cache_valor", val)}
                              className="h-8 text-xs font-bold text-right"
                              placeholder="0,00"
                            />
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Diária (R$)</span>
                            <CurrencyInput
                              value={m.diaria_valor}
                              onChange={(val) => updateMembro(m.usuario_id, m.funcao, "diaria_valor", val)}
                              className="h-8 text-xs text-right"
                              placeholder="0,00"
                            />
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Transporte (R$)</span>
                            <CurrencyInput
                              value={m.transporte_valor}
                              onChange={(val) => updateMembro(m.usuario_id, m.funcao, "transporte_valor", val)}
                              className="h-8 text-xs text-right"
                              placeholder="0,00"
                            />
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeMembro(m.usuario_id, m.funcao)}
                              className="size-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                              title="Remover profissional da escala"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* PASSO 3: LOGÍSTICA & VIAGEM (Room List e Transporte para Roadbook) */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-sky-50/60 dark:bg-sky-950/20 p-4 rounded-2xl border border-sky-100 dark:border-sky-900/30 flex items-start gap-3">
                <Plane className="size-5 text-sky-600 shrink-0 mt-0.5" />
                <div className="text-xs text-sky-950 dark:text-sky-200">
                  <span className="font-bold">Integração Direta com Roadbook e Hospedagem (Rooming List):</span> O hotel e opções de traslado definidos aqui alimentam instantaneamente o <strong>Guia de Viagem (Roadbook)</strong> e a <strong>Hospedagem</strong> oficial, sem você precisar redigitar em outro lugar.
                </div>
              </div>

              {/* Bloco Hotelaria Base */}
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <Hotel className="size-5 text-primary" />
                    Hospedagem Base (Room List)
                  </h3>
                  <Badge variant="outline" className="text-[10px] font-bold">Opcional / Pular se ainda em negociação</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-600">Rede / Nome do Hotel Principal</Label>
                    <Input
                      value={hotelGeralNome}
                      onChange={(e) => setHotelGeralNome(e.target.value)}
                      placeholder="Ex: Ibis Curitiba Centro / Hotel Nacional"
                      className="h-10 text-xs bg-white dark:bg-card"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-600">Tipo de Quarto Padrão</Label>
                    <select
                      className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold"
                      onChange={(e) => {
                        const val: any = e.target.value;
                        setEquipe(equipe.map(m => ({ ...m, tipo_quarto: val })));
                      }}
                    >
                      <option value="Single">Individual (Single) para todos</option>
                      <option value="Double">Casal (Double)</option>
                      <option value="Twin">Duplo Solteiro (Twin)</option>
                    </select>
                  </div>
                </div>

                {/* Pré-visualização da Room List rápida */}
                {equipe.length > 0 && (
                  <div className="pt-3 border-t border-slate-200/50 dark:border-white/5 space-y-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Distribuição de Acomodações da Equipe:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {equipe.map((m) => (
                        <div key={m.usuario_id} className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-card border border-slate-200/70 dark:border-white/5 text-xs">
                          <span className="font-bold truncate max-w-[140px]">{m.nome}</span>
                          <select
                            value={m.tipo_quarto || "Single"}
                            onChange={(e) => updateMembro(m.usuario_id, m.funcao, "tipo_quarto", e.target.value)}
                            className="h-7 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-2"
                          >
                            <option value="Single">Single</option>
                            <option value="Double">Double</option>
                            <option value="Twin">Twin</option>
                            <option value="Triplo">Triplo</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bloco Transporte Base */}
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 space-y-4">
                <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <Plane className="size-5 text-primary" />
                  Logística de Viagem & Traslados
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-600">Modalidade de Transporte</Label>
                    <select
                      value={transporteGeralTipo}
                      onChange={(e) => setTransporteGeralTipo(e.target.value as any)}
                      className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold"
                    >
                      <option value="van">Van Executiva / Micro-ônibus</option>
                      <option value="aereo">Malha Aérea (Voos)</option>
                      <option value="onibus">Ônibus Leito / Turnê</option>
                      <option value="carro">Carros Próprios / Locação</option>
                      <option value="outro">Outro / Logística Mista</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-600">Notas de Traslado / Locadora / Voos</Label>
                    <Input
                      value={detalhesTransporte}
                      onChange={(e) => setDetalhesTransporte(e.target.value)}
                      placeholder="Ex: Van saindo da sede às 14h / Voos Latam"
                      className="h-10 text-xs bg-white dark:bg-card"
                    />
                  </div>
                </div>
              </div>

              {/* Bloco Guia de Viagem & Foto de Capa (Roadbook) */}
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                      <ImageIcon className="size-5 text-primary" />
                      Capa do Guia de Viagem (Roadbook)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Defina a foto de capa que ilustrará o Guia de Viagem e os cards do projeto, evitando telas em branco.
                    </p>
                  </div>
                  {fotoCapaPadrao && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setFotoCapaPadrao(null)}
                      className="text-xs text-red-500 hover:text-red-600 h-7"
                    >
                      <Trash2 className="size-3 mr-1" /> Remover Capa
                    </Button>
                  )}
                </div>

                {/* Grid de Fotos de Divulgação do Espetáculo */}
                {(() => {
                  const tpl = templatesFull.find(t => t.nome_espetaculo === espetaculo);
                  const fotosDivulgacao: any[] = (tpl?.assets_midia as any)?.fotos_divulgacao || [];
                  const logoUrl = tpl?.logo_espetaculo_url;

                  return (
                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {/* Se tem logo do espetáculo, oferece como opção de capa */}
                        {logoUrl && (
                          <div
                            onClick={() => setFotoCapaPadrao(logoUrl)}
                            className={`group relative rounded-2xl overflow-hidden aspect-video border-2 cursor-pointer transition-all flex items-center justify-center bg-white dark:bg-slate-800 p-2 ${
                              fotoCapaPadrao === logoUrl
                                ? "border-primary ring-2 ring-primary/30 shadow-md scale-[1.02]"
                                : "border-slate-200 dark:border-white/10 hover:border-slate-300"
                            }`}
                          >
                            <img src={logoUrl} alt="Logo Oficial" className="w-full h-full object-contain" />
                            {fotoCapaPadrao === logoUrl && (
                              <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1 shadow">
                                <CheckCircle2 className="size-3.5" />
                              </div>
                            )}
                            <span className="absolute bottom-1 left-2 text-[9px] font-bold text-slate-500 bg-white/80 dark:bg-black/60 px-1.5 py-0.5 rounded">
                              Logo Padrão
                            </span>
                          </div>
                        )}

                        {/* Fotos de divulgação do espetáculo */}
                        {fotosDivulgacao.map((foto, fIdx) => {
                          const isSel = fotoCapaPadrao === foto.url;
                          return (
                            <div
                              key={fIdx}
                              onClick={() => setFotoCapaPadrao(foto.url)}
                              className={`group relative rounded-2xl overflow-hidden aspect-video border-2 cursor-pointer transition-all ${
                                isSel
                                  ? "border-primary ring-2 ring-primary/30 shadow-md scale-[1.02]"
                                  : "border-slate-200 dark:border-white/10 hover:border-slate-300"
                              }`}
                            >
                              <img src={foto.url} alt={foto.creditos || `Foto ${fIdx + 1}`} className="w-full h-full object-cover" />
                              {isSel && (
                                <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1 shadow">
                                  <CheckCircle2 className="size-3.5" />
                                </div>
                              )}
                              {foto.creditos && (
                                <span className="absolute bottom-1 left-2 text-[9px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded truncate max-w-[85%]">
                                  📷 {foto.creditos}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PASSO 4: BILHETERIA & TÉCNICA */}
          {/* ========================================================================= */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Bilheteria / Ingressos */}
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <Ticket className="size-5 text-primary" />
                    Gestão de Ingressos & Bilheteria
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div
                    onClick={() => setIngressosModoGeral("local")}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      ingressosModoGeral === "local"
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 dark:border-white/10 hover:border-slate-300"
                    }`}
                  >
                    <Building2 className="size-5 text-slate-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm">Produção Local / Teatro</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        A bilheteria é operada pela casa (Sympla, Ingresse, etc.). O Áxis não valida ingressos nesta praça.
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => setIngressosModoGeral("axis")}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      ingressosModoGeral === "axis"
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 dark:border-white/10 hover:border-slate-300"
                    }`}
                  >
                    <Ticket className="size-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm">Administrado pelo Áxis</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Emissão de ingressos com QR Code, borderô e validação pelo aplicativo do Áxis na portaria.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Importação Técnica Automática */}
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <Briefcase className="size-5 text-primary" />
                    Riders Técnicos e Mapas Padrão
                  </h3>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 border-emerald-200 text-xs font-bold">
                    Automação Instantânea
                  </Badge>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Checkbox
                    id="importar-riders-check"
                    checked={importarRiders}
                    onCheckedChange={(c) => setImportarRiders(!!c)}
                  />
                  <Label htmlFor="importar-riders-check" className="text-sm font-bold cursor-pointer">
                    Copiar automaticamente os Mapas de Som, Luz, Vídeo e Palco configurados para o espetáculo "{espetaculo || "Selecionado"}"
                  </Label>
                </div>
                <p className="text-xs text-slate-500 pl-7">
                  Garante que os técnicos de som e luz já tenham os inputs, patch lists e stage plots prontos no app sem precisar fazer upload novamente.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PASSO 5: REVISÃO & LANÇAMENTO (Raio-X do Projeto) */}
          {/* ========================================================================= */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in zoom-in-95 duration-300">
              <div className="text-center space-y-2 pb-4 border-b border-slate-100 dark:border-white/5">
                <div className="size-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="size-9" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                  Raio-X de Prontidão da Produção
                </h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Revise o resumo antes da distribuição. Ao clicar em "Finalizar e Lançar", o Áxis criará todos os registros nos módulos oficiais.
                </p>
              </div>

              {/* Resumo Visual */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Espetáculo / Obra</span>
                  <p className="font-black text-base truncate">{espetaculo || "Não definido"}</p>
                  <p className="text-xs text-primary font-bold">{tipoProjeto === "turne" ? `Turnê: ${turneNome || "Sem nome"}` : "Apresentação Única"}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Itinerário</span>
                  <p className="font-black text-base">{pracas.length} Cidade(s)</p>
                  <p className="text-xs text-slate-500 truncate">{pracas.map(p => p.cidade).filter(Boolean).join(", ") || "A definir"}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Equipe Escalada</span>
                  <p className="font-black text-base">{equipe.length} Profissional(is)</p>
                  <p className="text-xs text-emerald-600 font-bold">Escala base configurada</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Logística & Riders</span>
                  <p className="font-black text-base">{hotelGeralNome ? "Hotel Definido" : "Hotel Flexível"}</p>
                  <p className="text-xs text-emerald-600 font-bold">{importarRiders ? "Mapas técnicos copiados" : "Sem mapas"}</p>
                </div>
              </div>

              {/* Botão de Finalização Principal */}
              <div className="pt-6 text-center">
                <Button
                  onClick={handlePublishProject}
                  disabled={publishing}
                  className="rounded-2xl h-14 px-10 text-base font-black bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/25 hover:scale-[1.02] transition-transform"
                >
                  {publishing ? "Distribuindo pelos Módulos..." : "Lançar Projeto & Ativar Produção"}
                  <ArrowRight className="size-5 ml-2" />
                </Button>
                <p className="text-xs text-slate-400 mt-2">
                  Tudo continuará 100% editável a qualquer momento nos menus de Eventos, Escalas, Financeiro e Viagens.
                </p>
              </div>
            </div>
          )}
        </CardContent>

        {/* Barra Inferior de Navegação */}
        <div className="p-4 sm:p-6 bg-slate-50/80 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => Math.max(prev - 1, 1))}
            disabled={currentStep === 1 || publishing}
            className="rounded-xl font-bold h-11 px-5"
          >
            <ChevronLeft className="size-4 mr-1.5" /> Voltar
          </Button>

          <div className="flex items-center gap-2">
            {currentStep > 1 && currentStep < 5 && (
              <Button
                variant="ghost"
                onClick={() => setCurrentStep(prev => Math.min(prev + 1, 5))}
                disabled={publishing}
                className="text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Pular esta etapa
              </Button>
            )}

            {currentStep === 1 && (
              <Button onClick={handleNextStep1} className="rounded-xl font-bold h-11 px-7 bg-primary text-white shadow-md">
                Avançar para Equipe <ChevronRight className="size-4 ml-1.5" />
              </Button>
            )}

            {currentStep > 1 && currentStep < 5 && (
              <Button onClick={() => setCurrentStep(prev => Math.min(prev + 1, 5))} className="rounded-xl font-bold h-11 px-7 bg-primary text-white shadow-md">
                Salvar e Avançar <ChevronRight className="size-4 ml-1.5" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
