// @ts-nocheck
import { createFileRoute, Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  FileSignature, 
  Plus, 
  Search, 
  FileText, 
  Trash2, 
  Edit2, 
  Eye, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  Users, 
  Layers, 
  DollarSign, 
  Send, 
  RotateCcw, 
  ShieldCheck, 
  Upload, 
  X, 
  Save, 
  Check, 
  Bell, 
  Calendar, 
  MapPin, 
  FolderArchive, 
  HelpCircle,
  Lock,
  Plane,
  Hotel,
  Utensils,
  Car,
  Wallet,
  CreditCard,
  Receipt,
  Building2,
  Calculator,
  Sliders,
  EyeOff,
  Tag,
  Copy,
  Code
} from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyInput } from "@/components/CurrencyInput";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Route as AuthedRoute } from "./route";
import { AccessDenied } from "@/components/AccessDenied";
import { LogoPicker } from "@/components/LogoPicker";
import { 
  replaceContractVariables, 
  generateVerificationCode, 
  exportContractToPDF, 
  formatCurrencyBR,
  valorPorExtenso,
  MODELOS_PADRAO_AXIS,
  PRESETS_HOSPEDAGEM,
  PRESETS_TRANSPORTE,
  PRESETS_TRASLADOS,
  PRESETS_ALIMENTACAO,
  PRESETS_EQUIPAMENTOS,
  PRESETS_IMAGEM
} from "@/lib/contractGenerator";
import { ReportExportButton } from "@/components/ReportExportButton";
import { exportarContratosExcel, exportarContratosRelatorioPDF } from "@/lib/exportReports";

export const Route = createFileRoute('/_authenticated/contratos')({
  head: () => ({ meta: [{ title: 'Gestão de Contratos - Áxis - Gestão de Teatros e Shows' }] }),
  component: ContratosPage
});

type ContratoEquipe = {
  id: string;
  codigo_autenticacao: string;
  usuario_id: string;
  evento_id: string | null;
  template_id: string | null;
  titulo: string;
  tipo?: string;
  funcao?: string;
  funcao_exercida?: string;
  valor_cache: number;
  condicoes_pagamento?: string;
  conteudo_contrato?: string;
  conteudo_gerado?: string;
  status: "pendente" | "assinado" | "recusado" | "cancelado";
  assinado_em: string | null;
  signatario_nome: string | null;
  signatario_cpf: string | null;
  signatario_email: string | null;
  signatario_ip: string | null;
  signatario_user_agent: string | null;
  hash_documento: string | null;
  motivo_recusa: string | null;
  created_at: string;
  usuario?: {
    id: string;
    nome: string;
    email: string;
    cpf: string;
    telefone: string;
  };
  evento?: {
    id: string;
    espetaculo: string;
    cidade: string;
    local: string;
    data: string;
  };
};

type ContratoTemplate = {
  id: string;
  titulo: string;
  tipo: string;
  descricao?: string;
  conteudo_padrao?: string;
  conteudo_markdown?: string;
  ativo?: boolean;
};

type DocumentoAvulso = {
  id: string;
  titulo: string;
  categoria: string;
  data_vencimento: string | null;
  arquivo_url: string;
  observacoes: string;
  created_at: string;
};

const categoriasAvulsas = [
  "Contratos de Serviço", 
  "Alvarás e Liberações", 
  "Notas Fiscais", 
  "ECAD", 
  "Documentos Pessoais", 
  "Outros"
];

const MAPA_NOMES_FUNCAO: Record<string, string> = {
  produtor: "Produtor",
  assistente_producao: "Assistente de Produção",
  tour_manager: "Tour Manager",
  stage_manager: "Stage Manager",
  contra_regra: "Contra-regra",
  camareiro: "Camareiro",
  iluminador: "Iluminador",
  tecnico_som: "Técnico de Som",
  tecnico_video: "Técnico de Vídeo",
  motorista: "Motorista",
  elenco: "Elenco",
  musico: "Músico",
  roadie: "Roadie",
  cenotecnico: "Cenotécnico",
  rigger: "Rigger",
  admin: "Administrador",
  dev: "Desenvolvedor",
  assessoria_imprensa: "Assessoria de Imprensa",
  midias_sociais: "Mídias Sociais",
};

function formatarNomeFuncao(slugOuTexto?: string): string {
  if (!slugOuTexto) return "Profissional";
  const raw = String(slugOuTexto).trim();
  const lower = raw.toLowerCase();
  if (MAPA_NOMES_FUNCAO[lower]) return MAPA_NOMES_FUNCAO[lower];
  // Capitaliza a primeira letra de cada palavra caso não esteja no mapa
  return raw
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

// Catálogo de Tags Dinâmicas Disponíveis para Modelos de Contratos
const TAGS_DISPONIVEIS_CONTRATO = [
  {
    categoria: "Contratante / Produtora",
    tags: [
      { tag: "{{CONTRATANTE_NOME}}", label: "Razão Social da Produtora", desc: "Nome empresarial oficial (ex: WILLIAM SEVEN PRODUÇÕES ARTÍSTICAS LTDA)" },
      { tag: "{{CONTRATANTE_FANTASIA}}", label: "Nome Fantasia", desc: "Nome fantasia / marca pública (ex: WILLIAM SEVEN PRODUÇÕES)" },
      { tag: "{{CONTRATANTE_DOCUMENTO}}", label: "CNPJ / CPF da Produtora", desc: "Documento oficial formatado" },
      { tag: "{{CONTRATANTE_ENDERECO}}", label: "Endereço da Produtora", desc: "Logradouro, número, bairro" },
      { tag: "{{CONTRATANTE_CIDADE}}", label: "Cidade e UF da Produtora", desc: "Ex: São Paulo/SP" },
      { tag: "{{CONTRATANTE_REPRESENTANTE}}", label: "Representante Legal", desc: "Nome do sócio / diretor que assina pela empresa" },
      { tag: "{{CONTRATANTE_TIPO_PESSOA}}", label: "Tipo de Pessoa Contratante", desc: "Pessoa jurídica de direito privado ou física" },
    ]
  },
  {
    categoria: "Contratado(a) / Profissional",
    tags: [
      { tag: "{{PROFISSIONAL_NOME}}", label: "Nome Completo", desc: "Nome do artista, músico ou técnico" },
      { tag: "{{PROFISSIONAL_DOCUMENTO}}", label: "CPF / CNPJ do Profissional", desc: "Documento de identificação cadastrado" },
      { tag: "{{RG_CONTRATADO}}", label: "RG / Identidade", desc: "Número de RG informado no cadastro" },
      { tag: "{{PROFISSIONAL_ENDERECO}}", label: "Endereço do Profissional", desc: "Cidade e estado de residência" },
      { tag: "{{CIDADE_CONTRATADO}}", label: "Cidade de Residência", desc: "Ex: São Paulo" },
      { tag: "{{ESTADO_CONTRATADO}}", label: "Estado (UF)", desc: "Ex: SP" },
      { tag: "{{TELEFONE_CONTRATADO}}", label: "Telefone / WhatsApp", desc: "Contato telefônico do profissional" },
      { tag: "{{EMAIL_CONTRATADO}}", label: "E-mail do Profissional", desc: "Endereço eletrônico" },
      { tag: "{{CHAVE_PIX_CONTRATADO}}", label: "Chave PIX", desc: "Chave PIX ou dados do profissional" },
      { tag: "{{DADOS_BANCARIOS}}", label: "Dados Bancários Completos", desc: "Banco, Agência, Conta e PIX formatados" },
      { tag: "{{PROFISSIONAL_TIPO_PESSOA}}", label: "Tipo de Pessoa Contratada", desc: "Pessoa física ou jurídica" },
      { tag: "{{PROFISSIONAL_REPRESENTANTE}}", label: "Representante do Contratado", desc: "O próprio ou procurador" },
    ]
  },
  {
    categoria: "Função e Atividade",
    tags: [
      { tag: "{{FUNCAO}}", label: "Função Contratual", desc: "Ex: Ator, Iluminador, Músico, Técnico de Som" },
      { tag: "{{EVENTO_NOME}}", label: "Nome do Espetáculo / Evento", desc: "Título oficial da montagem teatral ou show" },
      { tag: "{{DESCRICAO_SERVICOS}}", label: "Descrição dos Serviços", desc: "Escopo detalhado das atividades artísticas/técnicas" },
    ]
  },
  {
    categoria: "Roteiro, Datas e Itinerário",
    tags: [
      { tag: "{{DATA_INICIO}}", label: "Data de Início", desc: "Primeira data do evento ou da turnê" },
      { tag: "{{DATA_FIM}}", label: "Data de Término", desc: "Última data contratada da turnê" },
      { tag: "{{DATA_EVENTO}}", label: "Data da Apresentação", desc: "Data única ou período formatado" },
      { tag: "{{CIDADE_EVENTO}}", label: "Cidade(s) da Apresentação", desc: "Praça onde ocorrerá o espetáculo" },
      { tag: "{{LOCAL_EVENTO}}", label: "Local / Teatro", desc: "Nome do teatro, casa de show ou espaço cultural" },
      { tag: "{{HORARIO_EVENTO}}", label: "Horário do Espetáculo", desc: "Horário previsto da apresentação" },
      { tag: "{{TOTAL_APRESENTACOES}}", label: "Qtd. Total de Apresentações", desc: "Número total de shows contratados" },
      { tag: "{{TOTAL_DIARIAS}}", label: "Qtd. Total de Diárias", desc: "Quantidade de dias remunerados" },
      { tag: "{{ITINERARIO_TURNE}}", label: "Itinerário Completo da Turnê", desc: "Lista detalhada das cidades, teatros e datas" },
      { tag: "{{ANEXO_I_ROTEIRO}}", label: "Anexo I Completo (Roteiro e Logística)", desc: "Gera o Anexo I oficial completo ao final do contrato" },
    ]
  },
  {
    categoria: "Valores e Condições Financeiras",
    tags: [
      { tag: "{{VALOR_TOTAL_CONTRATADO}}", label: "Valor Total (R$)", desc: "Ex: R$ 5.000,00" },
      { tag: "{{VALOR_GLOBAL_EXTENSO}}", label: "Valor Total por Extenso", desc: "Ex: cinco mil reais" },
      { tag: "{{VALOR_CACHE}}", label: "Valor do Cachê", desc: "Cachê artístico ou técnico isolado" },
      { tag: "{{VALOR_DIARIAS}}", label: "Valor Total das Diárias", desc: "Multiplicação das diárias x valor diário" },
      { tag: "{{VALOR_AJUDA_CUSTO}}", label: "Ajuda de Custo", desc: "Auxílio financeiro para transporte/gasolina" },
      { tag: "{{VALOR_OUTROS}}", label: "Adicionais / Outros", desc: "Valores adicionais acordados" },
      { tag: "{{DISCRIMINACAO_VALORES}}", label: "Discriminação Financeira Completa", desc: "Texto descritivo item por item da remuneração" },
      { tag: "{{CONDICOES_PAGAMENTO}}", label: "Prazos e Regras de Pagamento", desc: "Ex: PIX em até 5 dias úteis" },
      { tag: "{{PAGAMENTO_FORMA}}", label: "Forma de Pagamento", desc: "PIX / Transferência Bancária" },
    ]
  },
  {
    categoria: "Logística e Benefícios",
    tags: [
      { tag: "{{CONDICOES_TRANSPORTE}}", label: "Regras de Transporte / Passagens", desc: "Aéreo, terrestre, ônibus leito, etc." },
      { tag: "{{CONDICOES_HOSPEDAGEM}}", label: "Regras de Hospedagem", desc: "Hotel executivo, quarto duplo, etc." },
      { tag: "{{CONDICOES_ALIMENTACAO}}", label: "Regras de Alimentação", desc: "Catering, refeições diárias ou ajuda" },
      { tag: "{{CONDICOES_CATERING}}", label: "Condições de Catering", desc: "Serviço no teatro e camarins" },
      { tag: "{{CONDICOES_TRASLADOS}}", label: "Regras de Traslados", desc: "Vans da produção aeroporto/hotel/teatro" },
      { tag: "{{CONDICOES_EQUIPAMENTOS}}", label: "Equipamentos e Materiais", desc: "Infraestrutura técnica fornecida" },
      { tag: "{{IMAGEM_FINALIDADE}}", label: "Autorização de Imagem e Voz", desc: "Divulgação do espetáculo e redes sociais" },
      { tag: "{{CONDICOES_ADICIONAIS}}", label: "Condições Gerais Adicionais", desc: "Cláusulas acessórias ajustadas" },
    ]
  },
  {
    categoria: "Cancelamento, Foro e Código",
    tags: [
      { tag: "{{CONTRATO_NUMERO}}", label: "Número do Contrato", desc: "Ex: 0001/2026 ou CTR-2026-0001" },
      { tag: "{{CODIGO_AUTENTICACAO}}", label: "Código de Autenticação", desc: "Ex: CTR-2026-0001" },
      { tag: "{{NUMERO_SEQUENCIAL}}", label: "Número Sequencial Simples", desc: "Ex: 0001" },
      { tag: "{{PRAZO_AVISO_CANCELAMENTO}}", label: "Prazo de Cancelamento", desc: "Ex: 30 (trinta) dias de antecedência" },
      { tag: "{{MULTA_CANCELAMENTO_DESCRICAO}}", label: "Regras / Multa de Cancelamento", desc: "Reembolso e indenizações acordadas" },
      { tag: "{{FORO_CIDADE_UF}}", label: "Foro da Comarca", desc: "Cidade da sede da produtora para foro judicial" },
      { tag: "{{LOCAL_ASSINATURA}}", label: "Cidade de Celebração", desc: "Cidade de assinatura" },
      { tag: "{{DATA_ASSINATURA}}", label: "Data por Extenso", desc: "Ex: 17 de outubro de 2026" },
    ]
  },
  {
    categoria: "Termo Aditivo (Opcional)",
    tags: [
      { tag: "{{ADITIVO_NUMERO}}", label: "Número do Aditivo", desc: "Sequencial do aditivo" },
      { tag: "{{CONTRATO_ORIGINAL_CODIGO}}", label: "Código do Contrato Original", desc: "Ex: CTR-2026-0001" },
      { tag: "{{CONTRATO_DATA_ORIGINAL}}", label: "Data do Contrato Original", desc: "Data em que o original foi emitido" },
      { tag: "{{ADITIVO_OBJETO}}", label: "Objeto do Aditivo", desc: "Motivo e escopo da alteração" },
      { tag: "{{DESCRICAO_ADITIVO}}", label: "Descrição das Alterações", desc: "Texto do termo aditivo" },
      { tag: "{{VALOR_ADICIONAL}}", label: "Valor Adicional Complementar", desc: "Valor acrescido pela aditivação" },
      { tag: "{{ADITIVO_PAGAMENTO}}", label: "Condições de Pagamento do Aditivo", desc: "Forma de pagamento complementar" },
      { tag: "{{ADITIVO_DATA_EFEITO}}", label: "Data de Início dos Efeitos", desc: "Data a partir da qual vigora" },
    ]
  }
];

function ContratosPage() {
  // --- SEGURANÇA E CONTROLE DE ACESSO OFICIAL AXIS ---
  const routeCtx = AuthedRoute.useRouteContext ? AuthedRoute.useRouteContext() : null;
  const allowedRolesList = ["dev","produtor"];
  const profileRoles = routeCtx?.profile ? [routeCtx.profile.role, ...(Array.isArray(routeCtx.profile.funcoes) ? routeCtx.profile.funcoes : [])] : [];
  const hasAccess = profileRoles.some(r => allowedRolesList.includes(r));
  if (routeCtx?.profile && !hasAccess) {
    return <AccessDenied message="Você não possui permissão para acessar esta área com o seu perfil atual." />;
  }
  // ----------------------------------------------------

  const { profile } = AuthedRoute.useRouteContext();
  const isProdutor = profile?.role === 'admin' || profile?.role === 'dev' || profile?.role === 'produtor';

  // State principal
  const [activeTab, setActiveTab] = useState("emitidos");
  const [loading, setLoading] = useState(true);

  // 1. Contratos da Equipe
  const [contratos, setContratos] = useState<ContratoEquipe[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroEspetaculo, setFiltroEspetaculo] = useState("todos");

  // 2. Templates
  const [templates, setTemplates] = useState<ContratoTemplate[]>([]);
  const [editTemplate, setEditTemplate] = useState<Partial<ContratoTemplate> | null>(null);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  // 3. Novo Contrato Individual / Personalizado
  const [novoContratoModalOpen, setNovoContratoModalOpen] = useState(false);
  const [emitindoContrato, setEmitindoContrato] = useState(false);

  // Form de Emissão Personalizada
  const [novoUserId, setNovoUserId] = useState("");
  const [novoEspetaculo, setNovoEspetaculo] = useState("");
  const [isTurne, setIsTurne] = useState(false);
  const [novoEventoId, setNovoEventoId] = useState("");
  const [novoEventoIds, setNovoEventoIds] = useState<string[]>([]);
  const [multiplicarCachePorShows, setMultiplicarCachePorShows] = useState(false);
  const [novoTemplateId, setNovoTemplateId] = useState("");
  const [novoFuncao, setNovoFuncao] = useState("");
  const [novoDataInicioPersonalizada, setNovoDataInicioPersonalizada] = useState("");
  const [novoDataFimPersonalizada, setNovoDataFimPersonalizada] = useState("");
  const [novoQtdApresentacoesPersonalizada, setNovoQtdApresentacoesPersonalizada] = useState<number | "">("");
  
  // Remuneração e Composição Financeira
  const [novoModoRemuneracao, setNovoModoRemuneracao] = useState<"discriminado" | "fechado">("discriminado");
  const [novoCacheStr, setNovoCacheStr] = useState("0,00");
  const [novoQtdDiarias, setNovoQtdDiarias] = useState<number>(1);
  const [novoValorDiariaStr, setNovoValorDiariaStr] = useState("0,00");
  const [novoAjudaCustoStr, setNovoAjudaCustoStr] = useState("0,00");
  const [novoOutrosStr, setNovoOutrosStr] = useState("0,00");
  const [novoValorFechadoStr, setNovoValorFechadoStr] = useState("0,00");

  function parseCurrency(val: any): number {
    if (typeof val === "number") return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const str = String(val).trim();
    if (!str) return 0;
    if (str.includes(",")) {
      const cleaned = str.replace(/\./g, "").replace(",", ".");
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    }
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }

  function toCurrencyStr(num: number): string {
    return (num || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  const novoCache = parseCurrency(novoCacheStr);
  const novoValorDiaria = parseCurrency(novoValorDiariaStr);
  const novoAjudaCusto = parseCurrency(novoAjudaCustoStr);
  const novoOutros = parseCurrency(novoOutrosStr);
  const novoValorFechado = parseCurrency(novoValorFechadoStr);

  // Benefícios / Condições Operacionais
  const [novoBeneficioTransporte, setNovoBeneficioTransporte] = useState(true);
  const [novoTextoTransporte, setNovoTextoTransporte] = useState("Passagens aéreas e/ou transporte terrestre interestadual fornecidos integralmente pela PRODUTORA.");
  
  const [novoBeneficioHospedagem, setNovoBeneficioHospedagem] = useState(true);
  const [novoTextoHospedagem, setNovoTextoHospedagem] = useState("Hospedagem em hotel padrão executivo com café da manhã custeada pela PRODUTORA.");
  
  const [novoBeneficioAlimentacao, setNovoBeneficioAlimentacao] = useState(true);
  const [novoTextoAlimentacao, setNovoTextoAlimentacao] = useState("Alimentação fornecida via catering nos camarins e/ou refeições organizadas pela PRODUTORA.");

  const [novoBeneficioTraslado, setNovoBeneficioTraslado] = useState(true);
  const [novoTextoTraslado, setNovoTextoTraslado] = useState("Traslados locais (aeroporto <-> hotel <-> teatro) organizados pela PRODUTORA.");

  const [novoBeneficioEquipamentos, setNovoBeneficioEquipamentos] = useState(false);
  const [novoTextoEquipamentos, setNovoTextoEquipamentos] = useState("Equipamentos técnicos e infraestrutura fornecidos integralmente pela CONTRATANTE.");

  // Identidade Visual / Contratante (Multi-produtora / White-label)
  const [infoProdutora, setInfoProdutora] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("axis_contrato_produtora");
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return {
      nome: "WILLIAM SEVEN PRODUÇÕES ARTÍSTICAS LTDA",
      nomeFantasia: "WILLIAM SEVEN PRODUÇÕES",
      cnpj: "00.000.000/0001-00",
      endereco: "São Paulo / SP",
      cidade: "São Paulo/SP",
      logoUrl: "/logo-seven.png",
      ocultarMarcaAxis: false,
    };
  });
  const [produtoraModalOpen, setProdutoraModalOpen] = useState(false);

  // Estados e Cidades do Brasil via IBGE para seleção padronizada
  const [ibgeEstados, setIbgeEstados] = useState<{ id: number; sigla: string; nome: string }[]>([]);
  const [ibgeCidades, setIbgeCidades] = useState<{ id: number; nome: string }[]>([]);
  const [produtoraUf, setProdutoraUf] = useState<string>(() => {
    const cid = infoProdutora.cidade || "";
    if (cid.includes("/")) return cid.split("/")[1].trim().toUpperCase();
    return "SP";
  });
  const [produtoraCidadeNome, setProdutoraCidadeNome] = useState<string>(() => {
    const cid = infoProdutora.cidade || "";
    if (cid.includes("/")) return cid.split("/")[0].trim();
    return cid || "São Paulo";
  });
  const [carregandoCidades, setCarregandoCidades] = useState(false);
  const [logoPickerOpen, setLogoPickerOpen] = useState(false);

  // Carregar Estados do IBGE ao abrir modal ou montar
  useEffect(() => {
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setIbgeEstados(data);
      })
      .catch((err) => console.warn("Erro ao buscar estados do IBGE:", err));
  }, []);

  // Carregar Cidades do IBGE sempre que a UF selecionada mudar
  useEffect(() => {
    if (!produtoraUf) return;
    setCarregandoCidades(true);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${produtoraUf}/municipios?orderBy=nome`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setIbgeCidades(data);
      })
      .catch((err) => console.warn("Erro ao buscar cidades do IBGE:", err))
      .finally(() => setCarregandoCidades(false));
  }, [produtoraUf]);

  function salvarInfoProdutora(novaInfo: any) {
    const cidadeFormatada = produtoraCidadeNome && produtoraUf 
      ? `${produtoraCidadeNome}/${produtoraUf}`
      : (novaInfo.cidade || "São Paulo/SP");

    const infoCompleta = {
      ...novaInfo,
      cidade: cidadeFormatada,
      uf: produtoraUf,
      cidadeNome: produtoraCidadeNome,
    };

    setInfoProdutora(infoCompleta);
    if (typeof window !== "undefined") {
      localStorage.setItem("axis_contrato_produtora", JSON.stringify(infoCompleta));
    }
    toast.success("Identidade da contratante salva com sucesso!");
    setProdutoraModalOpen(false);
  }

  // Lista de IDs de modelos padrão excluídos/ocultados pelo produtor
  const [modelosPadraoExcluidos, setModelosPadraoExcluidos] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("axis_modelos_padrao_excluidos");
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Modelos Oficiais + Modelos Customizados
  const todosTemplates = useMemo(() => {
    const customIds = new Set(templates.map((t) => t.id));
    const padroes = MODELOS_PADRAO_AXIS
      .filter((p) => !modelosPadraoExcluidos.includes(p.id))
      .map((p) => ({
        ...p,
        is_padrao: true,
      }));
    return [...templates, ...padroes.filter((p) => !customIds.has(p.id))];
  }, [templates, modelosPadraoExcluidos]);

  // Modal de Termo Aditivo
  const [aditivoModalOpen, setAditivoModalOpen] = useState(false);
  const [contratoParaAditivo, setContratoParaAditivo] = useState<ContratoEquipe | null>(null);
  const [aditivoDescricao, setAditivoDescricao] = useState("Acréscimo de novas apresentações na turnê e complementação de remuneração.");
  const [aditivoValorStr, setAditivoValorStr] = useState("0,00");
  const [aditivoNovosEventoIds, setAditivoNovosEventoIds] = useState<string[]>([]);
  const [aditivoTextoLogistica, setAditivoTextoLogistica] = useState("Mantidas as condições de hospedagem, transporte e alimentação do contrato original.");
  const [gerandoAditivo, setGerandoAditivo] = useState(false);

  // Condições de Pagamento e Cláusulas
  const [novoCondicoesPagamento, setNovoCondicoesPagamento] = useState("Pagamento via PIX/Transferência bancária em até 5 dias úteis após a realização da apresentação.");
  const [novoTextoContratoPersonalizado, setNovoTextoContratoPersonalizado] = useState("");
  const [previewAberto, setPreviewAberto] = useState(false);
  const [salvandoRgInline, setSalvandoRgInline] = useState(false);
  const [novoRgInline, setNovoRgInline] = useState("");

  // Cálculos em tempo real
  const qtdApresentacoesTurne = isTurne ? (novoEventoIds.length || 1) : 1;
  const totalDiariasCalculado = (Number(novoQtdDiarias) || 0) * novoValorDiaria;
  const cacheEfetivoCalculado = (isTurne && multiplicarCachePorShows) ? novoCache * qtdApresentacoesTurne : novoCache;
  const totalCalculado = novoModoRemuneracao === "fechado" 
    ? novoValorFechado 
    : cacheEfetivoCalculado + totalDiariasCalculado + novoAjudaCusto + novoOutros;

  // 4. Gerador em Lote (Com condicionantes completas e filtro de categoria)
  const [eventos, setEventos] = useState<any[]>([]);
  const [espetaculosCadastrados, setEspetaculosCadastrados] = useState<string[]>([]);
  const [selectedEspetaculo, setSelectedEspetaculo] = useState("");
  const [selectedEventoId, setSelectedEventoId] = useState("");
  const [todosUsuarios, setTodosUsuarios] = useState<any[]>([]);
  const [equipeEscalada, setEquipeEscalada] = useState<any[]>([]);
  const [loteSelection, setLoteSelection] = useState<Record<string, boolean>>({});
  const [loteCaches, setLoteCaches] = useState<Record<string, string>>({});
  const [loteDiariasValores, setLoteDiariasValores] = useState<Record<string, string>>({});
  const [loteAjudasCusto, setLoteAjudasCusto] = useState<Record<string, string>>({});
  const [loteOutros, setLoteOutros] = useState<Record<string, string>>({});
  const [loteTemplates, setLoteTemplates] = useState<Record<string, string>>({});
  const [condicoesPadraoLote, setCondicoesPadraoLote] = useState("Pagamento via PIX em até 5 dias úteis após a apresentação.");
  const [loteQtdDiarias, setLoteQtdDiarias] = useState<number>(1);
  const [loteFiltroCategoria, setLoteFiltroCategoria] = useState<"todas" | "artistico" | "tecnico" | "producao">("todas");
  const [loteTemplateGlobal, setLoteTemplateGlobal] = useState("");
  const [loteDataPersonalizada, setLoteDataPersonalizada] = useState("");
  const [loteQtdApresentacoes, setLoteQtdApresentacoes] = useState<number | "">("");

  // Condicionantes Operacionais do Lote (Transporte, Hospedagem, Alimentação, Traslados)
  const [loteBeneficioTransporte, setLoteBeneficioTransporte] = useState(true);
  const [loteTextoTransporte, setLoteTextoTransporte] = useState("Passagens aéreas e/ou transporte terrestre interestadual fornecidos integralmente pela PRODUTORA.");
  const [loteBeneficioHospedagem, setLoteBeneficioHospedagem] = useState(true);
  const [loteTextoHospedagem, setLoteTextoHospedagem] = useState("Hospedagem em hotel padrão executivo com café da manhã custeada pela PRODUTORA.");
  const [loteBeneficioAlimentacao, setLoteBeneficioAlimentacao] = useState(true);
  const [loteTextoAlimentacao, setLoteTextoAlimentacao] = useState("Alimentação fornecida via catering nos camarins e/ou refeições organizadas pela PRODUTORA.");
  const [loteBeneficioTraslado, setLoteBeneficioTraslado] = useState(true);
  const [loteTextoTraslado, setLoteTextoTraslado] = useState("Traslados locais (aeroporto <-> hotel <-> teatro) organizados pela PRODUTORA.");

  const [gerandoLote, setGerandoLote] = useState(false);

  // 5. Modal de Visualização de Contrato Emitido
  const [viewContrato, setViewContrato] = useState<ContratoEquipe | null>(null);

  // 6. Documentos Gerais / Alvarás (Legado)
  const [documentosAvulsos, setDocumentosAvulsos] = useState<DocumentoAvulso[]>([]);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docFormData, setDocFormData] = useState<Partial<DocumentoAvulso>>({});
  const [docUploading, setDocUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [buscaTagTemplate, setBuscaTagTemplate] = useState("");
  const [tagCategoriaAtiva, setTagCategoriaAtiva] = useState("Todas");

  function handleInserirTagNoTemplate(tagString: string) {
    const textarea = templateTextareaRef.current;
    const textoAtual = editTemplate?.conteudo_markdown || editTemplate?.conteudo_padrao || "";

    if (!textarea) {
      // Fallback caso ref não esteja acessível: adiciona ao fim do texto
      const novoTexto = textoAtual ? `${textoAtual}\n${tagString}` : tagString;
      setEditTemplate((prev) => ({
        ...prev,
        conteudo_padrao: novoTexto,
        conteudo_markdown: novoTexto,
      }));
      toast.success(`Tag ${tagString} adicionada!`);
      return;
    }

    const start = textarea.selectionStart ?? textoAtual.length;
    const end = textarea.selectionEnd ?? textoAtual.length;

    const novoTexto = textoAtual.substring(0, start) + tagString + textoAtual.substring(end);

    setEditTemplate((prev) => ({
      ...prev,
      conteudo_padrao: novoTexto,
      conteudo_markdown: novoTexto,
    }));

    // Reposiciona o cursor logo após a tag inserida e devolve o foco
    setTimeout(() => {
      textarea.focus();
      const novoPos = start + tagString.length;
      textarea.setSelectionRange(novoPos, novoPos);
    }, 50);

    toast.success(`Tag inserida: ${tagString}`);
  }

  if (profile && !isProdutor) {
    return <AccessDenied message="A página de Contratos e Documentos é exclusiva para Administradores e Produtores." />;
  }

  useEffect(() => {
    if (isProdutor) {
      loadAllData();

      // Realtime listener
      const channel = supabase
        .channel("contratos_admin_sync")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "contratos_equipe" },
          () => {
            fetchContratos();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isProdutor]);

  async function loadAllData() {
    setLoading(true);
    await Promise.all([
      fetchContratos(),
      fetchTemplates(),
      fetchEventos(),
      fetchDocumentosAvulsos(),
    ]);
    setLoading(false);
  }

  async function fetchContratos() {
    try {
      const { data: rawContratos, error } = await supabase
        .from("contratos_equipe")
        .select("*")
        .order("created_at", { ascending: false });

      if (error && error.code !== "42P01") {
        console.error("Erro ao buscar contratos equipe:", error);
        return;
      }

      if (!rawContratos) {
        setContratos([]);
        return;
      }

      // Enriquecer os contratos com os perfis e eventos
      let usersList = todosUsuarios;
      if (!usersList || usersList.length === 0) {
        const { data: uData } = await supabase.from("profiles").select("*");
        if (uData) {
          usersList = uData;
          setTodosUsuarios(uData);
        }
      }

      let evsList = eventos;
      if (!evsList || evsList.length === 0) {
        const { data: evData } = await supabase.from("eventos").select("id, espetaculo, cidade, local, data");
        if (evData) evsList = evData;
      }

      const contratosFormatados = rawContratos.map((c: any) => {
        const userObj = usersList?.find((u: any) => u.id === c.usuario_id);
        const evObj = evsList?.find((e: any) => e.id === c.evento_id);
        return {
          ...c,
          usuario: userObj || c.usuario || { nome: c.signatario_nome || "Profissional", cpf: c.signatario_cpf },
          evento: evObj || c.evento || (c.itens_inclusos?.turne_itinerario ? {
            cidade: `Turnê (${c.itens_inclusos.qtd_apresentacoes || ""} praças)`,
            local: "Itinerário oficial da turnê",
            espetaculo: c.titulo,
            data: "Conforme cronograma",
          } : undefined),
        };
      });

      setContratos(contratosFormatados);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchTemplates() {
    try {
      const { data, error } = await supabase
        .from("contratos_templates")
        .select("*")
        .order("titulo");

      if (error && error.code !== "42P01") {
        console.error("Erro ao buscar templates:", error);
      } else {
        setTemplates(data || []);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchEventos() {
    try {
      const [evRes, rbRes, tplRes, profRes] = await Promise.all([
        supabase.from("eventos").select("id, espetaculo, cidade, local, data, horario, status").order("data", { ascending: false }),
        supabase.from("roadbooks").select("id, espetaculo, cidade, estado, data_inicial, teatro_nome, evento_id").order("data_inicial", { ascending: true }),
        supabase.from("templates_espetaculos").select("nome_espetaculo"),
        supabase.from("profiles").select("*").order("nome")
      ]);

      if (profRes.data) {
        setTodosUsuarios(profRes.data);
      }

      // Unir eventos de eventos e roadbooks para que nenhuma praça falte
      let allEv: any[] = [];
      const realEventoIds = new Set<string>();
      if (evRes.data && evRes.data.length > 0) {
        evRes.data.forEach((e: any) => realEventoIds.add(e.id));
        allEv = evRes.data.map((e: any) => ({ ...e, is_real_evento: true }));
      }

      if (rbRes.data && rbRes.data.length > 0) {
        rbRes.data.forEach((rb: any) => {
          const match = allEv.find((e) => e.id === rb.evento_id || e.id === rb.id);
          if (!match) {
            allEv.push({
              id: rb.evento_id || rb.id,
              roadbook_id: rb.id,
              is_real_evento: rb.evento_id ? realEventoIds.has(rb.evento_id) : false,
              espetaculo: rb.espetaculo,
              cidade: rb.cidade,
              local: rb.teatro_nome || "A definir",
              data: rb.data_inicial || "",
              horario: "",
              status: "confirmado",
            });
          } else {
            if (!match.local && rb.teatro_nome) match.local = rb.teatro_nome;
            if (!match.roadbook_id) match.roadbook_id = rb.id;
          }
        });
      }

      setEventos(allEv);

      // Lista única de espetáculos cadastrados
      const shows = Array.from(
        new Set(
          [
            ...(tplRes.data || []).map((t: any) => t.nome_espetaculo),
            ...allEv.map((e) => e.espetaculo),
          ].filter(Boolean)
        )
      ).sort();

      setEspetaculosCadastrados(shows);
      if (shows.length > 0) {
        setSelectedEspetaculo((prev) => prev || shows[0]);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchDocumentosAvulsos() {
    try {
      const { data } = await supabase
        .from("contratos")
        .select("*")
        .order("created_at", { ascending: false });
      setDocumentosAvulsos(data || []);
    } catch (e) {
      console.error(e);
    }
  }

  // Quando o produtor seleciona um evento no Gerador em Lote:
  useEffect(() => {
    if (selectedEventoId) {
      carregarEquipeDoEvento(selectedEventoId);
    } else {
      setEquipeEscalada([]);
      setLoteSelection({});
    }
  }, [selectedEventoId]);

  async function carregarEquipeDoEvento(eventoId: string) {
    try {
      // 1. Buscar quem está na escala do evento
      const { data: escalasData, error: escalaErr } = await supabase
        .from("evento_escalas")
        .select(`
          id,
          funcao,
          status,
          usuario:usuario_id(id, nome, email, cpf, telefone, endereco_cidade, endereco_estado, pix_chave, caches_padrao)
        `)
        .eq("evento_id", eventoId);

      if (escalaErr) throw escalaErr;

      const eventoObj = eventos.find((ev) => ev.id === eventoId);
      const espetaculoNome = eventoObj?.espetaculo || "";

      // 2. Preencher valores e seleções padrão
      const initialSelection: Record<string, boolean> = {};
      const initialCaches: Record<string, string> = {};
      const initialDiarias: Record<string, string> = {};
      const initialAjudas: Record<string, string> = {};
      const initialTemplates: Record<string, string> = {};

      // Buscar valores pré-estabelecidos no financeiro para as escalas deste evento
      const escalaIds = (escalasData || []).map((e) => e.id);
      let finMap: Record<string, any> = {};
      if (escalaIds.length > 0) {
        const { data: finData } = await supabase
          .from("evento_escalas_financeiro")
          .select("*")
          .in("escala_id", escalaIds);
        if (finData) {
          finData.forEach((f) => {
            finMap[f.escala_id] = f;
          });
        }
      }

      // Template padrão de acordo com o tipo (usando todosTemplates para incluir modelos padrão Áxis)
      const templateArtistico = todosTemplates.find((t) => t.tipo === "artistico")?.id || todosTemplates[0]?.id || "padrao_artistico";
      const templateTecnico = todosTemplates.find((t) => t.tipo === "tecnico")?.id || todosTemplates[0]?.id || "padrao_tecnico";

      (escalasData || []).forEach((item) => {
        if (!item.usuario) return;
        const uId = item.usuario.id;
        initialSelection[uId] = true;

        const finItem = finMap[item.id];

        // 1. Prioridade para valor cadastrado no financeiro do evento
        let cacheFinalStr = "0,00";
        if (finItem?.cache_valor !== null && finItem?.cache_valor !== undefined && finItem?.cache_valor > 0) {
          cacheFinalStr = toCurrencyStr(Number(finItem.cache_valor));
        } else {
          // Fallback para cachê padrão do espetáculo no perfil
          const cacheMap = item.usuario.caches_padrao || {};
          const cacheValorStr = cacheMap[espetaculoNome] || "";
          const cacheValorNum = parseFloat(String(cacheValorStr).replace(/\D/g, "")) / 100 || 0;
          cacheFinalStr = cacheValorStr || (cacheValorNum ? toCurrencyStr(cacheValorNum) : "0,00");
        }
        initialCaches[uId] = cacheFinalStr;

        if (finItem?.diaria_valor !== null && finItem?.diaria_valor !== undefined && finItem?.diaria_valor > 0) {
          initialDiarias[uId] = toCurrencyStr(Number(finItem.diaria_valor));
        } else {
          initialDiarias[uId] = "0,00";
        }

        if (finItem?.transporte_valor !== null && finItem?.transporte_valor !== undefined && finItem?.transporte_valor > 0) {
          initialAjudas[uId] = toCurrencyStr(Number(finItem.transporte_valor));
        } else {
          initialAjudas[uId] = "0,00";
        }

        // Define se é técnico ou artístico pela função
        const isTecnico = ["iluminador", "tecnico_som", "tecnico_video", "stage_manager", "contra_regra", "roadie", "cenotecnico", "rigger"].includes(item.funcao.toLowerCase());
        initialTemplates[uId] = isTecnico ? templateTecnico : templateArtistico;
      });

      setEquipeEscalada(escalasData || []);
      setLoteSelection(initialSelection);
      setLoteCaches(initialCaches);
      setLoteDiariasValores(initialDiarias);
      setLoteAjudasCusto(initialAjudas);
      setLoteTemplates(initialTemplates);
    } catch (e: any) {
      toast.error("Erro ao carregar equipe da escala: " + e.message);
    }
  }

  function adicionarMembroNaLista(usuario: any, funcaoCustom?: string) {
    if (!usuario) return;
    const uId = usuario.id;
    if (equipeEscalada.some((item) => item.usuario?.id === uId)) {
      toast.info(`${usuario.nome} já está na lista.`);
      return;
    }

    const eventoObj = eventos.find((ev) => ev.id === selectedEventoId);
    const espetaculoNome = eventoObj?.espetaculo || selectedEspetaculo || "";
    const funcao = formatarNomeFuncao(funcaoCustom || usuario.role || "Elenco");

    // Cachê padrão
    const cacheMap = usuario.caches_padrao || {};
    const cacheValorStr = cacheMap[espetaculoNome] || "";
    const cacheValorNum = parseFloat(cacheValorStr.replace(/\D/g, "")) / 100 || 0;

    // Template padrão (usando todosTemplates para garantir templates oficiais)
    const templateArtistico = todosTemplates.find((t) => t.tipo === "artistico")?.id || todosTemplates[0]?.id || "padrao_artistico";
    const templateTecnico = todosTemplates.find((t) => t.tipo === "tecnico")?.id || todosTemplates[0]?.id || "padrao_tecnico";
    const isTecnico = ["iluminador", "tecnico_som", "tecnico_video", "stage_manager", "contra_regra", "roadie", "cenotecnico", "rigger"].includes(String(funcao).toLowerCase());

    const novoItem = {
      id: `manual_${uId}_${Date.now()}`,
      funcao: funcao,
      usuario: usuario,
    };

    setEquipeEscalada((prev) => [...prev, novoItem]);
    setLoteSelection((prev) => ({ ...prev, [uId]: true }));
    setLoteCaches((prev) => ({ ...prev, [uId]: cacheValorStr || (cacheValorNum ? toCurrencyStr(cacheValorNum) : "0,00") }));
    setLoteTemplates((prev) => ({ ...prev, [uId]: isTecnico ? templateTecnico : templateArtistico }));
    toast.success(`${usuario.nome} adicionado à lista!`);
  }

  function carregarTodaEquipeCadastrada() {
    if (!todosUsuarios || todosUsuarios.length === 0) {
      return toast.warning("Nenhum usuário cadastrado encontrado.");
    }
    todosUsuarios.forEach((u) => {
      adicionarMembroNaLista(u);
    });
  }

  // =========================================================================
  // GESTÃO DE NUMERAÇÃO SEQUENCIAL MONOTÔNICA E AUDITÁVEL DOS CONTRATOS
  // =========================================================================
  function getProximoNumeroSequencial(): number {
    const anoAtual = new Date().getFullYear();
    let maxNum = 0;

    contratos.forEach((c) => {
      const n = Number(c.itens_inclusos?.numero_sequencial || (c as any).numero_sequencial);
      if (!isNaN(n) && n > maxNum) maxNum = n;

      if (c.codigo_autenticacao) {
        const m = c.codigo_autenticacao.match(/CTR-\d{4}-(\d+)/);
        if (m && m[1]) {
          const parsed = parseInt(m[1], 10);
          if (!isNaN(parsed) && parsed > maxNum) maxNum = parsed;
        }
      }
    });

    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`axis_max_contrato_seq_${anoAtual}`);
      if (saved) {
        const parsedSaved = parseInt(saved, 10);
        if (!isNaN(parsedSaved) && parsedSaved > maxNum) {
          maxNum = parsedSaved;
        }
      }
    }

    return maxNum + 1;
  }

  function registrarNumeroSequencial(num: number) {
    const anoAtual = new Date().getFullYear();
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`axis_max_contrato_seq_${anoAtual}`);
      const current = saved ? parseInt(saved, 10) : 0;
      if (num > current) {
        localStorage.setItem(`axis_max_contrato_seq_${anoAtual}`, String(num));
      }
    }
  }

  function ajustarSequencialAoExcluir(c: ContratoEquipe) {
    const anoAtual = new Date().getFullYear();
    let cSeq = Number(c.itens_inclusos?.numero_sequencial || (c as any).numero_sequencial);
    if (isNaN(cSeq) && c.codigo_autenticacao) {
      const m = c.codigo_autenticacao.match(/CTR-\d{4}-(\d+)/);
      if (m && m[1]) cSeq = parseInt(m[1], 10);
    }

    if (cSeq > 0 && typeof window !== "undefined") {
      const saved = localStorage.getItem(`axis_max_contrato_seq_${anoAtual}`);
      const currentMax = saved ? parseInt(saved, 10) : 0;
      if (cSeq === currentMax) {
        let novoMax = 0;
        contratos.filter((x) => x.id !== c.id).forEach((other) => {
          let oSeq = Number(other.itens_inclusos?.numero_sequencial || (other as any).numero_sequencial);
          if (isNaN(oSeq) && other.codigo_autenticacao) {
            const om = other.codigo_autenticacao.match(/CTR-\d{4}-(\d+)/);
            if (om && om[1]) oSeq = parseInt(om[1], 10);
          }
          if (oSeq > novoMax) novoMax = oSeq;
        });
        localStorage.setItem(`axis_max_contrato_seq_${anoAtual}`, String(novoMax));
      }
    }
  }

  // =========================================================================
  // HELPER RESILIENTE PARA GRAVAÇÃO DE CONTRATOS NO SUPABASE
  // =========================================================================
  // Garante que se alguma coluna opcional (ex: condicoes_pagamento, valor_diarias)
  // ainda não tiver sido criada no banco ou estiver fora do cache do PostgREST,
  // a gravação do contrato NÃO falhe, removendo automaticamente a coluna ausente.
  async function insertContratoSeguro(initialPayload: any) {
    let payload = { ...initialPayload };

    // Garantir que ambos os campos de texto existam (conteudo_gerado e conteudo_contrato)
    const txtContrato = payload.conteudo_contrato || payload.conteudo_gerado || "";
    if (txtContrato) {
      if (!payload.conteudo_gerado) payload.conteudo_gerado = txtContrato;
      if (!payload.conteudo_contrato) payload.conteudo_contrato = txtContrato;
    }

    // Garantir que template_id seja um UUID válido ou null (evita erro invalid input syntax for type uuid)
    if (payload.template_id) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(payload.template_id));
      if (!isUuid) {
        payload.template_id = null;
      }
    }

    let res = await supabase.from("contratos_equipe").insert(payload);

    for (let attempt = 0; attempt < 8; attempt++) {
      if (!res.error) break;
      const msg = res.error.message || "";

      if (msg.includes("template_id") || msg.includes("type uuid")) {
        console.warn("[contratos_equipe] template_id com erro de UUID. Anulando e retentando...");
        delete payload.template_id;
        res = await supabase.from("contratos_equipe").insert(payload);
        continue;
      }

      const match =
        msg.match(/Could not find the '([^']+)' column/i) ||
        msg.match(/column "([^"]+)" of relation/i) ||
        msg.match(/column "([^"]+)" does not exist/i);

      if (match && match[1] && payload[match[1]] !== undefined) {
        console.warn(`[contratos_equipe] Campo '${match[1]}' ausente no banco/schema cache. Removendo e retentando...`);
        delete payload[match[1]];
        res = await supabase.from("contratos_equipe").insert(payload);
      } else if (msg.includes("conteudo_gerado") && (msg.includes("violates not-null") || msg.includes("null value"))) {
        console.warn("[contratos_equipe] Preenchendo conteudo_gerado...");
        payload.conteudo_gerado = txtContrato;
        res = await supabase.from("contratos_equipe").insert(payload);
      } else if (msg.includes("conteudo_contrato") && payload.conteudo_contrato) {
        console.warn("[contratos_equipe] Migrando conteudo_contrato para conteudo_gerado...");
        payload.conteudo_gerado = payload.conteudo_contrato;
        delete payload.conteudo_contrato;
        res = await supabase.from("contratos_equipe").insert(payload);
      } else if (msg.includes("evento_id") || res.error.code === "23503") {
        console.warn("[contratos_equipe] Removendo FK de evento_id e retentando...");
        payload.evento_id = null;
        res = await supabase.from("contratos_equipe").insert(payload);
      } else {
        break;
      }
    }
    return res;
  }

  // DISPARAR GERAÇÃO DE CONTRATOS EM LOTE
  async function handleGerarContratosLote() {
    const selectedEvento = eventos.find((ev) => ev.id === selectedEventoId);
    if (!selectedEvento) return toast.warning("Selecione um evento válido.");

    const selecionados = equipeEscalada.filter((item) => item.usuario && loteSelection[item.usuario.id]);
    if (selecionados.length === 0) return toast.warning("Por favor, selecione pelo menos um profissional da lista para gerar o contrato.");

    setGerandoLote(true);
    let criados = 0;

    try {
      for (const item of selecionados) {
        const user = item.usuario;
        const uId = user.id;

        // Recuperar template selecionado para este profissional (ou o global, ou o oficial correspondente)
        const templateId = loteTemplates[uId] || loteTemplateGlobal;
        const templateObj = todosTemplates.find((t) => t.id === templateId) || todosTemplates[0];

        if (!templateObj) {
          toast.error(`Modelo de contrato não localizado para ${user.nome}`);
          continue;
        }

        const cacheIndividual = parseCurrency(loteCaches[uId] ?? "0,00");
        const diariaIndividual = parseCurrency(loteDiariasValores[uId] ?? "0,00");
        const ajudaCustoIndividual = parseCurrency(loteAjudasCusto[uId] ?? "0,00");
        const outrosIndividual = parseCurrency(loteOutros[uId] ?? "0,00");

        const qtdShowsLote = (loteQtdApresentacoes !== "" && Number(loteQtdApresentacoes) > 0)
          ? Number(loteQtdApresentacoes)
          : 1;

        const totalDiariasCalc = diariaIndividual * (Number(loteQtdDiarias) || 1);
        const totalCacheCalc = cacheIndividual * qtdShowsLote;
        const totalIndividual = totalCacheCalc + totalDiariasCalc + ajudaCustoIndividual + outrosIndividual;

        if (totalIndividual <= 0) {
          toast.warning(`Valor zerado para ${user.nome}. Informe o cachê ou diárias.`);
          continue;
        }

        const seqNum = getProximoNumeroSequencial() + criados;
        const codAutenticacao = generateVerificationCode(seqNum);
        registrarNumeroSequencial(seqNum);

        // Data formatada do evento (ou personalizada pelo usuário)
        let dataEventoStr = selectedEvento.data || "";
        try {
          if (dataEventoStr) {
            dataEventoStr = format(new Date(dataEventoStr + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR });
          }
        } catch (e) {}

        let dataFinalLote = loteDataPersonalizada ? loteDataPersonalizada : dataEventoStr;
        if (dataFinalLote.includes("-") && dataFinalLote.length === 10) {
          try {
            dataFinalLote = format(new Date(dataFinalLote + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR });
          } catch {}
        }

        // Montagem da discriminação descritiva financeira
        const itensRemun: string[] = [];
        if (cacheIndividual > 0) {
          itensRemun.push(`a) Cachê profissional${qtdShowsLote > 1 ? ` (${qtdShowsLote} apresentações)` : ""}: ${formatCurrencyBR(cacheIndividual)}`);
        }
        if (totalDiariasCalc > 0) itensRemun.push(`b) Diárias (${loteQtdDiarias} diária(s) a ${formatCurrencyBR(diariaIndividual)}): ${formatCurrencyBR(totalDiariasCalc)}`);
        if (ajudaCustoIndividual > 0) itensRemun.push(`c) Ajuda de custo: ${formatCurrencyBR(ajudaCustoIndividual)}`);
        if (outrosIndividual > 0) itensRemun.push(`d) Outros adicionais: ${formatCurrencyBR(outrosIndividual)}`);
        const discriminacaoFinal = `${itensRemun.join("; ")}; Totalizando a importância líquida de ${formatCurrencyBR(totalIndividual)} (${valorPorExtenso(totalIndividual)}).`;

        // Montagem dos benefícios operacionais
        const itensBeneficios: string[] = [];
        if (loteBeneficioTransporte) itensBeneficios.push(`• TRANSPORTE: ${loteTextoTransporte}`);
        if (loteBeneficioHospedagem) itensBeneficios.push(`• HOSPEDAGEM: ${loteTextoHospedagem}`);
        if (loteBeneficioAlimentacao) itensBeneficios.push(`• ALIMENTAÇÃO: ${loteTextoAlimentacao}`);
        if (loteBeneficioTraslado) itensBeneficios.push(`• TRASLADOS: ${loteTextoTraslado}`);
        const textoOperacionalCompleto = itensBeneficios.join("\n");

        const bancoInfo = user.banco_codigo ? `Banco: ${user.banco_codigo} | Agência: ${user.banco_agencia || "N/I"} | Conta: ${user.banco_conta || "N/I"}` : "";
        const pixInfo = user.pix_chave ? `Chave PIX: ${user.pix_chave}` : "";
        const dadosBancariosCompletos = [bancoInfo, pixInfo].filter(Boolean).join(" | ") || "A informar pelo contratado";

        // Substituição das variáveis dinâmicas
        const tplText = templateObj.conteudo_markdown || templateObj.conteudo_padrao || "";
        const conteudoFinal = replaceContractVariables(tplText, {
          codigoAutenticacao: codAutenticacao,
          numeroSequencial: seqNum,
          nomeContratado: user.nome,
          cpfContratado: user.cpf,
          rgContratado: user.rg || "Não informado",
          cidadeContratado: user.endereco_cidade,
          estadoContratado: user.endereco_estado,
          telefoneContratado: user.telefone,
          emailContratado: user.email,
          chavePixContratado: user.pix_chave,
          dadosBancarios: dadosBancariosCompletos,
          funcaoContratado: item.funcao || "Profissional",
          valorCache: cacheIndividual,
          valorDiarias: totalDiariasCalc,
          qtdDiarias: loteQtdDiarias,
          valorAjudaCusto: ajudaCustoIndividual,
          valorOutros: outrosIndividual,
          valorTotal: totalIndividual,
          discriminacaoValores: discriminacaoFinal,
          condicoesTransporte: loteTextoTransporte,
          condicoesTraslados: loteTextoTraslado,
          condicoesHospedagem: loteTextoHospedagem,
          condicoesAlimentacao: loteTextoAlimentacao,
          condicoesOperacionais: textoOperacionalCompleto,
          condicoesPagamento: condicoesPadraoLote,
          qtdApresentacoes: qtdShowsLote,
          nomeEspetaculo: selectedEvento.espetaculo,
          cidadeEvento: selectedEvento.cidade,
          localEvento: `${selectedEvento.local || "Teatro Municipal"}${qtdShowsLote > 1 ? ` (${qtdShowsLote} apresentações)` : ""}`,
          dataEvento: dataFinalLote,
          dataInicial: dataFinalLote,
          dataFinal: dataFinalLote,
          horarioEvento: selectedEvento.horario || "A definir",
          nomeProdutora: infoProdutora.nome,
          nomeFantasiaProdutora: infoProdutora.nomeFantasia || infoProdutora.nome,
          cnpjProdutora: infoProdutora.cnpj,
          enderecoProdutora: infoProdutora.endereco,
          cidadeProdutora: infoProdutora.cidade,
        });

        // Gravar no Supabase
        const isRoadbook = !selectedEvento.horario && !selectedEvento.status;
        const templateIdValido = templateObj.id && !String(templateObj.id).startsWith("padrao_") ? templateObj.id : null;
        const payloadLote: any = {
          codigo_autenticacao: codAutenticacao,
          usuario_id: uId,
          evento_id: isRoadbook ? null : selectedEvento.id,
          template_id: templateIdValido,
          titulo: `${templateObj.titulo} - ${user.nome} (${selectedEvento.cidade})`,
          tipo: templateObj.tipo,
          funcao: item.funcao || "Profissional",
          valor_cache: totalIndividual,
          valor_diarias: totalDiariasCalc,
          valor_ajuda_custo: ajudaCustoIndividual,
          valor_outros: outrosIndividual,
          valor_total: totalIndividual,
          condicoes_pagamento: condicoesPadraoLote,
          conteudo_contrato: conteudoFinal,
          conteudo_gerado: conteudoFinal,
          status: "pendente",
          created_by: profile.id,
          itens_inclusos: {
            numero_sequencial: seqNum,
            transporte: loteBeneficioTransporte,
            texto_transporte: loteTextoTransporte,
            hospedagem: loteBeneficioHospedagem,
            texto_hospedagem: loteTextoHospedagem,
            alimentacao: loteBeneficioAlimentacao,
            texto_alimentacao: loteTextoAlimentacao,
            traslado: loteBeneficioTraslado,
            texto_traslado: loteTextoTraslado,
          },
        };

        const resLote = await insertContratoSeguro(payloadLote);
        if (resLote.error) {
          console.error("Erro ao inserir contrato:", resLote.error);
          toast.error(`Erro ao gerar contrato para ${user.nome}: ${resLote.error.message}`);
          continue;
        }

        // Criar notificação em tempo real para o usuário
        await supabase.from("notificacoes").insert({
          usuario_id: uId,
          tipo: "escala",
          titulo: "Novo Contrato para Assinatura",
          mensagem: `Seu contrato para "${selectedEvento.espetaculo}" em ${selectedEvento.cidade} está pronto para assinatura digital.`,
          link: "/meus-contratos",
        });

        criados++;
      }

      if (criados > 0) {
        toast.success(`${criados} contrato(s) gerado(s) com sucesso!`, {
          description: "Os profissionais receberam uma notificação para assinatura eletrônica imediata.",
        });
      } else {
        toast.warning("Nenhum contrato pôde ser gerado. Verifique se os profissionais selecionados têm valores definidos.");
      }

      setSelectedEventoId("");
      setActiveTab("emitidos");
      fetchContratos();
    } catch (err: any) {
      toast.error("Erro ao gerar contratos: " + err.message);
    } finally {
      setGerandoLote(false);
    }
  }

  // =========================================================================
  // GESTÃO DO CONTRATO PERSONALIZADO (INDIVIDUAL)
  // =========================================================================

  function resetNovoContratoForm() {
    setNovoUserId("");
    const espPdr = espetaculosCadastrados[0] || (eventos[0]?.espetaculo) || "";
    setNovoEspetaculo(espPdr);
    const evs = eventos.filter((e) => e.espetaculo === espPdr);
    setIsTurne(false);
    setNovoEventoId(evs[0]?.id || "");
    setNovoEventoIds(evs.map((e) => e.id));
    setMultiplicarCachePorShows(false);
    setNovoTemplateId(todosTemplates[0]?.id || "");
    setNovoFuncao("");
    setNovoModoRemuneracao("discriminado");
    setNovoCacheStr("0,00");
    setNovoQtdDiarias(1);
    setNovoValorDiariaStr("0,00");
    setNovoAjudaCustoStr("0,00");
    setNovoOutrosStr("0,00");
    setNovoValorFechadoStr("0,00");
    setNovoBeneficioTransporte(true);
    setNovoTextoTransporte("Passagens aéreas e/ou transporte terrestre interestadual fornecidos integralmente pela PRODUTORA.");
    setNovoBeneficioHospedagem(true);
    setNovoTextoHospedagem("Hospedagem em hotel padrão executivo com café da manhã custeada pela PRODUTORA (quarto duplo ou individual conforme escala).");
    setNovoBeneficioAlimentacao(true);
    setNovoTextoAlimentacao("Alimentação fornecida via catering nos camarins e/ou diária de alimentação pela PRODUTORA.");
    setNovoBeneficioTraslado(true);
    setNovoTextoTraslado("Traslados locais (aeroporto <-> hotel <-> teatro) organizados pela PRODUTORA.");
    setNovoCondicoesPagamento("Pagamento via PIX/Transferência bancária em até 5 dias úteis após a realização da apresentação.");
    setNovoTextoContratoPersonalizado("");
    setNovoDataInicioPersonalizada("");
    setNovoDataFimPersonalizada("");
    setNovoQtdApresentacoesPersonalizada("");
    setPreviewAberto(false);
    setNovoRgInline("");
  }

  async function carregarValoresFinanceirosDoUsuario(userId: string, targetEventoId?: string, targetEspetaculo?: string) {
    if (!userId) return;
    const userObj = todosUsuarios.find((u) => u.id === userId);
    if (!userObj) return;

    const rawEvId = targetEventoId || novoEventoId || selectedEventoId || (eventos[0]?.id) || "";
    const esp = targetEspetaculo || novoEspetaculo || selectedEspetaculo || (eventos[0]?.espetaculo) || "";

    let achouNoFinanceiro = false;

    if (rawEvId) {
      try {
        // Obter o objeto do evento correspondente
        const evObj = eventos.find((e) => e.id === rawEvId || e.roadbook_id === rawEvId);
        const candidatoIds: string[] = [rawEvId];
        if (evObj?.roadbook_id) candidatoIds.push(evObj.roadbook_id);
        if (evObj?.id && !candidatoIds.includes(evObj.id)) candidatoIds.push(evObj.id);

        // Se o evObj tiver uma referência a evento_id no roadbook
        if (rawEvId) {
          const { data: rbCheck } = await supabase
            .from("roadbooks")
            .select("evento_id")
            .eq("id", rawEvId)
            .maybeSingle();
          if (rbCheck?.evento_id && !candidatoIds.includes(rbCheck.evento_id)) {
            candidatoIds.push(rbCheck.evento_id);
          }
        }

        // Tentar encontrar na escala por qualquer um dos IDs candidatos
        const { data: escalaData } = await supabase
          .from("evento_escalas")
          .select("id")
          .in("evento_id", candidatoIds)
          .eq("usuario_id", userId)
          .maybeSingle();

        if (escalaData?.id) {
          const { data: finData } = await supabase
            .from("evento_escalas_financeiro")
            .select("*")
            .eq("escala_id", escalaData.id)
            .maybeSingle();

          if (finData) {
            achouNoFinanceiro = true;
            if (finData.cache_valor !== null && finData.cache_valor !== undefined && finData.cache_valor > 0) {
              setNovoCacheStr(toCurrencyStr(Number(finData.cache_valor)));
            }
            if (finData.diaria_valor !== null && finData.diaria_valor !== undefined && finData.diaria_valor > 0) {
              setNovoValorDiariaStr(toCurrencyStr(Number(finData.diaria_valor)));
            }
            if (finData.transporte_valor !== null && finData.transporte_valor !== undefined && finData.transporte_valor > 0) {
              setNovoAjudaCustoStr(toCurrencyStr(Number(finData.transporte_valor)));
            }
          }
        }
      } catch (err) {
        console.warn("Erro ao buscar dados financeiros pré-definidos:", err);
      }
    }

    // Fallback: se não encontrou no financeiro do evento, busca cachê padrão do espetáculo no perfil
    if (!achouNoFinanceiro && esp) {
      if (userObj.caches_padrao && userObj.caches_padrao[esp]) {
        const cacheStr = userObj.caches_padrao[esp];
        const cacheNum = parseFloat(String(cacheStr).replace(/\D/g, "")) / 100 || 0;
        setNovoCacheStr(cacheStr.includes(",") ? cacheStr : toCurrencyStr(cacheNum));
      }
    }
  }

  async function handleSelectNovoUser(userId: string) {
    setNovoUserId(userId);
    const userObj = todosUsuarios.find((u) => u.id === userId);
    if (!userObj) return;

    const funcaoBruta = (userObj.funcoes && userObj.funcoes[0]) || userObj.role || "Elenco";
    const funcaoPdr = formatarNomeFuncao(funcaoBruta);
    setNovoFuncao(funcaoPdr);

    const isTecnico = ["iluminador", "tecnico_som", "tecnico_video", "stage_manager", "contra_regra", "roadie", "cenotecnico", "rigger"].includes(String(funcaoBruta).toLowerCase());
    const isProducao = ["produtor", "assistente_producao", "camareiro", "tour_manager"].includes(String(funcaoBruta).toLowerCase());

    const tplTecnico = todosTemplates.find((t) => t.tipo === "tecnico")?.id;
    const tplProducao = todosTemplates.find((t) => t.tipo === "producao")?.id;
    const tplArtistico = todosTemplates.find((t) => t.tipo === "artistico")?.id;

    if (isTecnico && tplTecnico) setNovoTemplateId(tplTecnico);
    else if (isProducao && tplProducao) setNovoTemplateId(tplProducao);
    else if (tplArtistico) setNovoTemplateId(tplArtistico);
    else if (todosTemplates[0]) setNovoTemplateId(todosTemplates[0].id);

    await carregarValoresFinanceirosDoUsuario(userId);
  }

  function handleSelectNovoEspetaculo(esp: string) {
    setNovoEspetaculo(esp);
    const eventosDoShow = eventos.filter((ev) => ev.espetaculo === esp);
    let chosenEventoId = "";
    if (eventosDoShow.length > 0) {
      chosenEventoId = eventosDoShow[0].id;
      setNovoEventoId(chosenEventoId);
      setNovoEventoIds(eventosDoShow.map((e) => e.id));
    } else {
      setNovoEventoId("");
      setNovoEventoIds([]);
    }

    if (novoUserId) {
      carregarValoresFinanceirosDoUsuario(novoUserId, chosenEventoId, esp);
    }
  }

  function handleSelectNovoEvento(evId: string) {
    setNovoEventoId(evId);
    if (novoUserId) {
      carregarValoresFinanceirosDoUsuario(novoUserId, evId);
    }
  }

  async function handleSalvarRgInline(userId: string) {
    if (!novoRgInline.trim()) return toast.warning("Digite o RG.");
    setSalvandoRgInline(true);
    try {
      const { error } = await supabase.from("profiles").update({ rg: novoRgInline.trim() }).eq("id", userId);
      if (error) {
        toast.error("Erro ao salvar RG: " + error.message);
      } else {
        toast.success("RG salvo com sucesso!");
        setTodosUsuarios((prev) => prev.map((u) => u.id === userId ? { ...u, rg: novoRgInline.trim() } : u));
        setNovoRgInline("");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSalvandoRgInline(false);
    }
  }

  function gerarTextoPrevia(codAuto?: string, seqNumber?: number) {
    const userObj = todosUsuarios.find((u) => u.id === novoUserId);
    const templateObj = todosTemplates.find((t) => t.id === novoTemplateId) || todosTemplates[0];
    if (!templateObj) return "";

    const seqEfetivo = seqNumber || getProximoNumeroSequencial();
    const codigoEfetivo = codAuto || generateVerificationCode(seqEfetivo);

    // Obter eventos selecionados (único ou múltiplos da turnê)
    const evsSelecionados = isTurne
      ? eventos.filter((ev) => novoEventoIds.includes(ev.id)).sort((a, b) => (a.data || "").localeCompare(b.data || ""))
      : eventos.filter((ev) => ev.id === novoEventoId);

    const eventoPrincipal = evsSelecionados[0];
    const isMultiplas = isTurne && evsSelecionados.length > 1;
    const qtdShowsBase = evsSelecionados.length || 1;
    const qtdShows = (novoQtdApresentacoesPersonalizada !== "" && Number(novoQtdApresentacoesPersonalizada) > 0)
      ? Number(novoQtdApresentacoesPersonalizada)
      : qtdShowsBase;

    // Cidades da turnê
    const cidadesArr = Array.from(new Set(evsSelecionados.map((e) => e.cidade).filter(Boolean)));
    const cidadesStr = isMultiplas
      ? `${cidadesArr.join(", ")} (Turnê em ${qtdShows} praças)`
      : (eventoPrincipal?.cidade || "A definir");

    // Locais da turnê
    const locaisStr = isMultiplas
      ? evsSelecionados.map((e, idx) => `${idx + 1}. ${e.cidade}: ${e.local || "Teatro"}`).join("; ")
      : (eventoPrincipal?.local || "Teatro Municipal");

    // Datas da turnê formatadas
    const datasFormatadas = evsSelecionados.map((e) => {
      let dt = e.data || "";
      try {
        if (dt) dt = format(new Date(dt + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR });
      } catch {}
      return dt;
    }).filter(Boolean);

    // Ajuste de datas personalizadas (caso o usuário tenha editado manualmente na tela)
    let dataInicialEfetiva = novoDataInicioPersonalizada ? novoDataInicioPersonalizada : (datasFormatadas[0] || "Conforme cronograma");
    let dataFinalEfetiva = novoDataFimPersonalizada ? novoDataFimPersonalizada : (datasFormatadas[datasFormatadas.length - 1] || datasFormatadas[0] || "Conforme cronograma");

    // Formatar se vier em YYYY-MM-DD
    if (dataInicialEfetiva.includes("-") && dataInicialEfetiva.length === 10) {
      try {
        dataInicialEfetiva = format(new Date(dataInicialEfetiva + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR });
      } catch {}
    }
    if (dataFinalEfetiva.includes("-") && dataFinalEfetiva.length === 10) {
      try {
        dataFinalEfetiva = format(new Date(dataFinalEfetiva + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR });
      } catch {}
    }

    const dataEventoStr = (novoDataInicioPersonalizada || novoDataFimPersonalizada)
      ? (dataInicialEfetiva === dataFinalEfetiva ? dataInicialEfetiva : `${dataInicialEfetiva} a ${dataFinalEfetiva} (${qtdShows} apresentação(ões))`)
      : (isMultiplas
        ? `${datasFormatadas[0] || "A definir"} a ${datasFormatadas[datasFormatadas.length - 1] || "A definir"} (${qtdShows} apresentações)`
        : (datasFormatadas[0] || eventoPrincipal?.data || "Conforme cronograma"));

    // Itinerário detalhado da turnê
    const itinerarioLinhas = evsSelecionados.map((e, idx) => {
      let dt = e.data || "";
      try {
        if (dt) dt = format(new Date(dt + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR });
      } catch {}
      return `  • ${idx + 1}ª Praça: ${dt || "Data a definir"} • ${e.cidade} • Local: ${e.local || "Teatro"}${e.horario ? ` às ${e.horario}` : ""}`;
    }).join("\n");

    const itinerarioCompleto = isMultiplas
      ? `### ANEXO I — ROTEIRO E CRONOGRAMA OFICIAL DA TURNÊ (${qtdShows} APRESENTAÇÕES)\n${itinerarioLinhas}`
      : `### ANEXO I — LOCAL E CRONOGRAMA DA APRESENTAÇÃO\nLocal: ${eventoPrincipal?.local || "Teatro"} em ${eventoPrincipal?.cidade || "Praça"}${qtdShows > 1 ? ` (${qtdShows} apresentações)` : ""}`;

    // Discriminação dos valores
    let discriminacaoTexto = "";
    if (novoModoRemuneracao === "fechado") {
      discriminacaoTexto = isMultiplas
        ? `Remuneração estipulada em regime de valor fechado global para a Turnê (${qtdShows} apresentações) no montante total de ${formatCurrencyBR(totalCalculado)} (${valorPorExtenso(totalCalculado)}), abrangendo a integralidade dos serviços e custos acordados para todas as praças do itinerário.`
        : `Remuneração estipulada em regime de valor fechado global por apresentação no montante de ${formatCurrencyBR(totalCalculado)} (${valorPorExtenso(totalCalculado)}), abrangendo a integralidade dos serviços e custos acordados.`;
    } else {
      const itensRemun: string[] = [];
      if (cacheEfetivoCalculado > 0) {
        if (isMultiplas && multiplicarCachePorShows) {
          itensRemun.push(`a) Cachê profissional (${qtdShows} apresentações a ${formatCurrencyBR(novoCache)}): ${formatCurrencyBR(cacheEfetivoCalculado)}`);
        } else {
          itensRemun.push(`a) Cachê profissional ${isMultiplas ? "(pacote da turnê)" : ""}: ${formatCurrencyBR(cacheEfetivoCalculado)}`);
        }
      }
      if (totalDiariasCalculado > 0) {
        itensRemun.push(`b) Diárias (${novoQtdDiarias} diária(s) a ${formatCurrencyBR(novoValorDiaria)}): ${formatCurrencyBR(totalDiariasCalculado)}`);
      }
      if (novoAjudaCusto > 0) itensRemun.push(`c) Ajuda de custo: ${formatCurrencyBR(novoAjudaCusto)}`);
      if (novoOutros > 0) itensRemun.push(`d) Adicionais/Outros: ${formatCurrencyBR(novoOutros)}`);
      discriminacaoTexto = `${itensRemun.join("; ")}; Totalizando o montante líquido de ${formatCurrencyBR(totalCalculado)} (${valorPorExtenso(totalCalculado)}).`;
    }

    const itensBeneficios: string[] = [];
    if (novoBeneficioTransporte) itensBeneficios.push(`• TRANSPORTE: ${novoTextoTransporte}`);
    if (novoBeneficioHospedagem) itensBeneficios.push(`• HOSPEDAGEM: ${novoTextoHospedagem}`);
    if (novoBeneficioAlimentacao) itensBeneficios.push(`• ALIMENTAÇÃO: ${novoTextoAlimentacao}`);
    if (novoBeneficioTraslado) itensBeneficios.push(`• TRASLADOS: ${novoTextoTraslado}`);
    const textoOperacionalCompleto = itensBeneficios.join("\n");

    const bancoInfo = userObj?.banco_codigo ? `Banco: ${userObj.banco_codigo} | Agência: ${userObj.banco_agencia || "N/I"} | Conta: ${userObj.banco_conta || "N/I"}` : "";
    const pixInfo = userObj?.pix_chave ? `Chave PIX: ${userObj.pix_chave}` : "";
    const dadosBancariosCompletos = [bancoInfo, pixInfo].filter(Boolean).join(" | ") || "A informar pelo contratado";

    const tplBase = novoTextoContratoPersonalizado || templateObj.conteudo_markdown || templateObj.conteudo_padrao || "";
    return replaceContractVariables(tplBase, {
      codigoAutenticacao: codigoEfetivo,
      numeroSequencial: seqEfetivo,
      nomeContratado: userObj?.nome || "___________________________",
      cpfContratado: userObj?.cpf || "___.___.___-__",
      rgContratado: userObj?.rg || "Não informado",
      cidadeContratado: userObj?.endereco_cidade || "São Paulo",
      estadoContratado: userObj?.endereco_estado || "SP",
      telefoneContratado: userObj?.telefone || "Não informado",
      emailContratado: userObj?.email || "Não informado",
      chavePixContratado: userObj?.pix_chave || "A informar",
      dadosBancarios: dadosBancariosCompletos,
      funcaoContratado: novoFuncao || "Profissional",
      modoRemuneracao: novoModoRemuneracao,
      valorCache: cacheEfetivoCalculado,
      valorDiarias: totalDiariasCalculado,
      qtdDiarias: novoQtdDiarias,
      valorAjudaCusto: novoAjudaCusto,
      valorOutros: novoOutros,
      valorTotal: totalCalculado,
      discriminacaoValores: discriminacaoTexto,
      condicoesTransporte: novoTextoTransporte,
      condicoesTraslados: novoTextoTraslado,
      condicoesHospedagem: novoTextoHospedagem,
      condicoesAlimentacao: novoTextoAlimentacao,
      condicoesEquipamentos: novoTextoEquipamentos,
      condicoesOperacionais: textoOperacionalCompleto,
      condicoesPagamento: novoCondicoesPagamento,
      isTurne: isMultiplas,
      qtdApresentacoes: qtdShows,
      itinerarioTurne: itinerarioCompleto,
      nomeEspetaculo: isMultiplas ? `${novoEspetaculo} (Turnê ${qtdShows} Praças)` : (eventoPrincipal?.espetaculo || novoEspetaculo || "Espetáculo"),
      cidadeEvento: cidadesStr,
      localEvento: isMultiplas ? `${locaisStr}\n\n${itinerarioCompleto}` : (eventoPrincipal?.local || "Teatro Municipal"),
      dataEvento: dataEventoStr,
      dataInicial: dataInicialEfetiva,
      dataFinal: dataFinalEfetiva,
      horarioEvento: eventoPrincipal?.horario || "Conforme cronograma",
      nomeProdutora: infoProdutora.nome,
      nomeFantasiaProdutora: infoProdutora.nomeFantasia || infoProdutora.nome,
      cnpjProdutora: infoProdutora.cnpj,
      enderecoProdutora: infoProdutora.endereco,
      cidadeProdutora: infoProdutora.cidade,
    });
  }

  async function handleEmitirContratoIndividual() {
    if (!novoUserId) return toast.warning("Selecione o profissional a ser contratado.");

    const evsSelecionados = isTurne
      ? eventos.filter((ev) => novoEventoIds.includes(ev.id)).sort((a, b) => (a.data || "").localeCompare(b.data || ""))
      : eventos.filter((ev) => ev.id === novoEventoId);

    if (evsSelecionados.length === 0) {
      return toast.warning("Selecione ao menos uma praça / evento.");
    }
    if (!novoTemplateId) return toast.warning("Selecione o modelo de contrato.");
    if (totalCalculado <= 0) return toast.warning("O valor total da contratação deve ser maior que zero.");

    const userObj = todosUsuarios.find((u) => u.id === novoUserId);
    const templateObj = todosTemplates.find((t) => t.id === novoTemplateId);
    const eventoPrincipal = evsSelecionados[0];
    const isMultiplas = isTurne && evsSelecionados.length > 1;
    const qtdShowsBase = evsSelecionados.length;
    const qtdShows = (novoQtdApresentacoesPersonalizada !== "" && Number(novoQtdApresentacoesPersonalizada) > 0)
      ? Number(novoQtdApresentacoesPersonalizada)
      : qtdShowsBase;

    if (!userObj || !templateObj) {
      return toast.error("Dados incompletos para a geração do contrato.");
    }

    setEmitindoContrato(true);
    try {
      const seqNum = getProximoNumeroSequencial();
      const codAutenticacao = generateVerificationCode(seqNum);
      registrarNumeroSequencial(seqNum);

      const conteudoFinal = novoTextoContratoPersonalizado || gerarTextoPrevia(codAutenticacao, seqNum);

      const tituloContrato = isMultiplas
        ? `${templateObj.titulo} - ${userObj.nome} - Turnê ${novoEspetaculo} (${qtdShows} praças)`
        : `${templateObj.titulo} - ${userObj.nome} (${eventoPrincipal?.cidade || "Praça"})`;

      const isRoadbook = eventoPrincipal ? (!eventoPrincipal.horario && !eventoPrincipal.status) : true;
      const eventoIdFinal = isRoadbook ? null : (eventoPrincipal?.id || null);

      const templateIdValido = templateObj.id && !String(templateObj.id).startsWith("padrao_") ? templateObj.id : null;

      const payloadContrato: any = {
        codigo_autenticacao: codAutenticacao,
        usuario_id: novoUserId,
        evento_id: eventoIdFinal,
        template_id: templateIdValido,
        titulo: tituloContrato,
        tipo: templateObj.tipo,
        funcao: novoFuncao || "Profissional",
        valor_cache: totalCalculado,
        condicoes_pagamento: novoCondicoesPagamento,
        conteudo_contrato: conteudoFinal,
        conteudo_gerado: conteudoFinal,
        status: "pendente",
        created_by: profile.id,
      };

      const payloadComExtras = {
        ...payloadContrato,
        valor_diarias: totalDiariasCalculado,
        valor_ajuda_custo: novoAjudaCusto,
        valor_outros: novoOutros,
        valor_total: totalCalculado,
        modo_remuneracao: novoModoRemuneracao,
        itens_inclusos: {
          numero_sequencial: seqNum,
          is_turne: isMultiplas,
          qtd_apresentacoes: qtdShows,
          turne_eventos_ids: evsSelecionados.map((e) => e.id),
          turne_itinerario: evsSelecionados.map((e) => ({
            id: e.id,
            cidade: e.cidade,
            data: e.data,
            local: e.local,
            horario: e.horario,
          })),
          transporte: novoBeneficioTransporte,
          texto_transporte: novoTextoTransporte,
          hospedagem: novoBeneficioHospedagem,
          texto_hospedagem: novoTextoHospedagem,
          alimentacao: novoBeneficioAlimentacao,
          texto_alimentacao: novoTextoAlimentacao,
          traslado: novoBeneficioTraslado,
          texto_traslado: novoTextoTraslado,
        },
      };

      const resIndividual = await insertContratoSeguro(payloadComExtras);
      if (resIndividual.error) {
        console.error("Erro ao emitir contrato:", resIndividual.error);
        toast.error("Erro ao emitir contrato: " + resIndividual.error.message);
        return;
      }

      // Criar notificação para o usuário
      const msgNotif = isMultiplas
        ? `Seu contrato para a TURNÊ "${novoEspetaculo}" (${qtdShows} praças - ${formatCurrencyBR(totalCalculado)}) está pronto para assinatura digital.`
        : `Seu contrato para "${eventoPrincipal?.espetaculo || novoEspetaculo}" em ${eventoPrincipal?.cidade || "Praça"} (${formatCurrencyBR(totalCalculado)}) está pronto para assinatura digital.`;

      await supabase.from("notificacoes").insert({
        usuario_id: novoUserId,
        tipo: "escala",
        titulo: isMultiplas ? "Novo Contrato de Turnê para Assinatura" : "Novo Contrato para Assinatura",
        mensagem: msgNotif,
        link: "/meus-contratos",
      });

      toast.success(isMultiplas ? "Contrato de Turnê emitido com sucesso!" : "Contrato emitido com sucesso!", {
        description: `Código ${codAutenticacao} gerado para ${userObj.nome}. Notificação enviada!`,
      });

      setNovoContratoModalOpen(false);
      resetNovoContratoForm();
      fetchContratos();
    } catch (err: any) {
      console.error(err);
      toast.error("Erro: " + (err.message || String(err)));
    } finally {
      setEmitindoContrato(false);
    }
  }

  function handleAbrirGeradorAditivo(c: ContratoEquipe) {
    setContratoParaAditivo(c);
    setAditivoDescricao("Acréscimo de datas/praças na turnê oficial e ajuste financeiro complementar.");
    setAditivoValorStr("0,00");
    setAditivoNovosEventoIds([]);
    setAditivoTextoLogistica("Mantidas as condições de hospedagem, transporte e alimentação do contrato original para as novas praças.");
    setAditivoModalOpen(true);
  }

  async function handleEmitirAditivo() {
    if (!contratoParaAditivo) return;
    setGerandoAditivo(true);
    try {
      const valorAdicionalNum = parseCurrency(aditivoValorStr);
      const evsNovos = eventos.filter((ev) => aditivoNovosEventoIds.includes(ev.id));
      const itinerarioLinhas = evsNovos.map((e, idx) => {
        let dt = e.data || "";
        try {
          if (dt) dt = format(new Date(dt + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR });
        } catch {}
        return `  • Nova Praça Aditiva: ${dt || "Data a definir"} • ${e.cidade} • Local: ${e.local || "Teatro"}${e.horario ? ` às ${e.horario}` : ""}`;
      }).join("\n");

      const itinerarioFinal = evsNovos.length > 0 
        ? `NOVAS PRAÇAS DA TURNÊ ACRESCIDAS POR ESTE ADITIVO (${evsNovos.length} APRESENTAÇÃO/ÕES):\n${itinerarioLinhas}`
        : "Sem alteração no itinerário de cidades/praças.";

      const seqNum = getProximoNumeroSequencial();
      const codAutenticacao = generateVerificationCode(seqNum);
      registrarNumeroSequencial(seqNum);

      const templateAditivo = todosTemplates.find((t) => t.tipo === "aditivo") || MODELOS_PADRAO_AXIS[3];

      const valorAnterior = Number((contratoParaAditivo as any).valor_total || contratoParaAditivo.valor_cache || 0);
      const novoTotal = valorAnterior + valorAdicionalNum;

      const conteudoFinal = replaceContractVariables(templateAditivo.conteudo_markdown || templateAditivo.conteudo_padrao || "", {
        codigoAutenticacao: codAutenticacao,
        numeroSequencial: seqNum,
        contratoOriginalCodigo: contratoParaAditivo.codigo_autenticacao,
        nomeContratado: contratoParaAditivo.usuario?.nome || "Profissional",
        cpfContratado: contratoParaAditivo.usuario?.cpf || "___.___.___-__",
        rgContratado: (contratoParaAditivo.usuario as any)?.rg || "Não informado",
        funcaoContratado: contratoParaAditivo.funcao || "Profissional",
        nomeEspetaculo: contratoParaAditivo.titulo,
        descricaoAditivo: aditivoDescricao,
        itinerarioTurne: itinerarioFinal,
        valorAdicional: valorAdicionalNum,
        valorTotal: novoTotal,
        condicoesPagamento: "Pagamento da complementação mediante PIX em até 5 dias úteis após a realização das novas apresentações.",
        condicoesTransporte: aditivoTextoLogistica,
        condicoesHospedagem: aditivoTextoLogistica,
        condicoesAlimentacao: aditivoTextoLogistica,
        nomeProdutora: infoProdutora.nome,
        nomeFantasiaProdutora: infoProdutora.nomeFantasia || infoProdutora.nome,
        cnpjProdutora: infoProdutora.cnpj,
        enderecoProdutora: infoProdutora.endereco,
        cidadeProdutora: infoProdutora.cidade,
      });

      const templateIdValido = templateAditivo.id && !String(templateAditivo.id).startsWith("padrao_") ? templateAditivo.id : null;

      const payloadAditivo = {
        codigo_autenticacao: codAutenticacao,
        usuario_id: contratoParaAditivo.usuario_id,
        evento_id: contratoParaAditivo.evento_id,
        template_id: templateIdValido,
        titulo: `Termo Aditivo (${contratoParaAditivo.codigo_autenticacao}) - ${contratoParaAditivo.usuario?.nome || "Profissional"}`,
        tipo: "aditivo",
        funcao: contratoParaAditivo.funcao || "Profissional",
        valor_cache: novoTotal,
        valor_total: novoTotal,
        condicoes_pagamento: "Conforme Termo Aditivo",
        conteudo_contrato: conteudoFinal,
        conteudo_gerado: conteudoFinal,
        status: "pendente",
        created_by: profile.id,
        itens_inclusos: {
          numero_sequencial: seqNum,
          contrato_pai_id: contratoParaAditivo.id,
          codigo_original: contratoParaAditivo.codigo_autenticacao,
        },
      };

      const resAditivo = await insertContratoSeguro(payloadAditivo);
      if (resAditivo.error) throw resAditivo.error;

      // Notificação
      await supabase.from("notificacoes").insert({
        usuario_id: contratoParaAditivo.usuario_id,
        tipo: "escala",
        titulo: "Novo Termo Aditivo de Contrato para Assinatura",
        mensagem: `Um Termo Aditivo vinculado ao seu contrato (${contratoParaAditivo.codigo_autenticacao}) foi emitido e aguarda seu aceite eletrônico.`,
        link: "/meus-contratos",
      });

      toast.success("Termo Aditivo emitido com sucesso!", {
        description: `Código ${codAutenticacao} gerado para ${contratoParaAditivo.usuario?.nome || "o profissional"}.`,
      });

      setAditivoModalOpen(false);
      setContratoParaAditivo(null);
      fetchContratos();
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao emitir aditivo: " + err.message);
    } finally {
      setGerandoAditivo(false);
    }
  }

  // REENVIAR COBRANÇA DE ASSINATURA
  async function handleReenviarNotificacao(contrato: ContratoEquipe) {
    try {
      await supabase.from("notificacoes").insert({
        usuario_id: contrato.usuario_id,
        tipo: "escala",
        titulo: "Lembrete: Contrato Aguardando Assinatura",
        mensagem: `Lembrete: O contrato "${contrato.titulo}" ainda não foi assinado. Clique para assinar.`,
        link: "/meus-contratos",
      });
      toast.success(`Lembrete enviado para ${contrato.usuario?.nome || "o profissional"}!`);
    } catch (e: any) {
      toast.error("Erro ao enviar: " + e.message);
    }
  }

  // EXCLUIR / CANCELAR CONTRATO
  async function handleDeleteContrato(cTarget: ContratoEquipe) {
    if (!cTarget) return;

    const nomeAlvo = cTarget.usuario?.nome || "o profissional";
    const identificador = cTarget.codigo_autenticacao || cTarget.titulo;
    if (!confirm(`Deseja realmente excluir o contrato de ${nomeAlvo} (${identificador})?`)) return;

    try {
      const { error } = await supabase.from("contratos_equipe").delete().eq("id", cTarget.id);
      if (error) {
        // Se houver restrição de integridade ou FK, marca como cancelado
        const { error: updErr } = await supabase.from("contratos_equipe").update({ status: "cancelado" }).eq("id", cTarget.id);
        if (updErr) throw updErr;
        toast.success(`Contrato ${identificador} cancelado com sucesso.`);
      } else {
        ajustarSequencialAoExcluir(cTarget);
        toast.success(`Contrato ${identificador} excluído com sucesso!`);
      }
      fetchContratos();
    } catch (e: any) {
      toast.error("Erro ao excluir contrato: " + e.message);
    }
  }

  // SALVAR / CRIAR TEMPLATE
  async function handleSaveTemplate() {
    const tplText = editTemplate?.conteudo_markdown || editTemplate?.conteudo_padrao || "";
    if (!editTemplate?.titulo || !tplText) {
      return toast.warning("Título e conteúdo são obrigatórios.");
    }

    try {
      const payload: any = {
        titulo: editTemplate.titulo,
        tipo: editTemplate.tipo || "artistico",
        descricao: editTemplate.descricao || "",
        conteudo_padrao: tplText,
        conteudo_markdown: tplText,
      };

      if (editTemplate.id) {
        await supabase.from("contratos_templates").update(payload).eq("id", editTemplate.id);
        toast.success("Modelo atualizado com sucesso!");
      } else {
        await supabase.from("contratos_templates").insert(payload);
        toast.success("Novo modelo criado com sucesso!");
      }

      setTemplateModalOpen(false);
      fetchTemplates();
    } catch (e: any) {
      toast.error("Erro ao salvar modelo: " + e.message);
    }
  }

  // EXCLUIR MODELO / TEMPLATE DE CONTRATO
  async function handleDeleteTemplate(tpl: any) {
    if (!tpl) return;
    if (!confirm(`Deseja realmente excluir o modelo "${tpl.titulo}"? Esta ação removerá o modelo da lista.`)) return;

    try {
      if (tpl.is_padrao || String(tpl.id).startsWith("padrao_")) {
        // Modelo nativo padrão: adiciona à lista de excluídos locais
        const novoExcluidos = Array.from(new Set([...modelosPadraoExcluidos, tpl.id]));
        setModelosPadraoExcluidos(novoExcluidos);
        if (typeof window !== "undefined") {
          localStorage.setItem("axis_modelos_padrao_excluidos", JSON.stringify(novoExcluidos));
        }
        toast.success(`Modelo padrão "${tpl.titulo}" removido da sua lista.`);
      } else {
        // Modelo personalizado salvo no Supabase
        const { error } = await supabase.from("contratos_templates").delete().eq("id", tpl.id);
        if (error) throw error;
        toast.success(`Modelo "${tpl.titulo}" excluído com sucesso!`);
        fetchTemplates();
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao excluir modelo: " + e.message);
    }
  }

  // RESTAURAR MODELOS PADRÃO (se algum foi excluído)
  function handleRestaurarModelosPadrao() {
    setModelosPadraoExcluidos([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("axis_modelos_padrao_excluidos");
    }
    toast.success("Todos os modelos padrão do Áxis foram restaurados!");
  }

  // DOCUMENTOS GERAIS (ALVARÁS / ECAD)
  async function handleSaveDocAvulso(e: React.FormEvent) {
    e.preventDefault();
    if (!docFormData.titulo) return toast.error("O título é obrigatório");

    setDocUploading(true);
    let arquivo_url = docFormData.arquivo_url || "";

    try {
      const file = fileInputRef.current?.files?.[0];
      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `contratos/${fileName}`;
        const { error: uploadError } = await supabase.storage.from("midias_eventos").upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from("midias_eventos").getPublicUrl(filePath);
        arquivo_url = publicUrl;
      } else if (!docFormData.id && !arquivo_url) {
        toast.error("Você precisa anexar um arquivo.");
        setDocUploading(false);
        return;
      }

      const { error } = await supabase.from("contratos").upsert({
        id: docFormData.id || undefined,
        titulo: docFormData.titulo,
        categoria: docFormData.categoria || "Outros",
        data_vencimento: docFormData.data_vencimento || null,
        observacoes: docFormData.observacoes || "",
        arquivo_url,
      });

      if (error) throw error;
      toast.success("Documento salvo com sucesso!");
      setDocModalOpen(false);
      fetchDocumentosAvulsos();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setDocUploading(false);
    }
  }

  async function handleDeleteDocAvulso(id: string) {
    if (!confirm("Excluir este documento?")) return;
    const { error } = await supabase.from("contratos").delete().eq("id", id);
    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success("Excluído!");
      fetchDocumentosAvulsos();
    }
  }

  // FILTROS
  const espetaculosList = useMemo(() => {
    const set = new Set<string>();
    contratos.forEach((c) => {
      if (c.evento?.espetaculo) set.add(c.evento.espetaculo);
    });
    return Array.from(set);
  }, [contratos]);

  const contratosFiltrados = useMemo(() => {
    return contratos.filter((c) => {
      const matchBusca =
        (c.titulo || "").toLowerCase().includes(busca.toLowerCase()) ||
        (c.usuario?.nome || "").toLowerCase().includes(busca.toLowerCase()) ||
        (c.usuario?.cpf || "").includes(busca) ||
        (c.codigo_autenticacao || "").toLowerCase().includes(busca.toLowerCase()) ||
        (c.funcao || "").toLowerCase().includes(busca.toLowerCase());

      const matchStatus = filtroStatus === "todos" || c.status === filtroStatus;
      const matchEspetaculo = filtroEspetaculo === "todos" || c.evento?.espetaculo === filtroEspetaculo;

      return matchBusca && matchStatus && matchEspetaculo;
    });
  }, [contratos, busca, filtroStatus, filtroEspetaculo]);

  // KPIs
  const totalAssinados = contratos.filter((c) => c.status === "assinado").length;
  const totalPendentes = contratos.filter((c) => c.status === "pendente");
  const totalCaches = contratos.reduce((acc, c) => acc + (Number(c.valor_cache) || 0), 0);
  const percentualConclusao = contratos.length > 0 ? Math.round((totalAssinados / contratos.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <FileSignature className="size-8 text-primary" />
            Central de Contratos
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Geração automatizada de contratos de elenco e equipe, com trilha de auditoria e assinatura eletrônica com validade jurídica (MP 2.200-2/2001 e Lei 14.063/2020).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setProdutoraModalOpen(true)}
            variant="outline"
            className="rounded-2xl gap-2 font-bold text-xs shadow-sm px-4 py-2 h-10 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Building2 className="size-4 text-primary" />
            Identidade da Produtora
          </Button>
          <Button
            onClick={() => {
              resetNovoContratoForm();
              setNovoContratoModalOpen(true);
            }}
            className="rounded-2xl gap-2 font-bold bg-primary hover:bg-primary/90 text-white shadow-md text-sm px-5 py-2.5"
            size="lg"
          >
            <Plus className="size-5" />
            Novo Contrato Personalizado
          </Button>
        </div>
      </div>

      {/* CARDS DE ESTATÍSTICAS (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Contratos</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{contratos.length}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">{percentualConclusao}% assinado(s)</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 rounded-2xl">
              <FileText className="size-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assinados Digitalmente</p>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{totalAssinados}</h3>
              <p className="text-[11px] text-emerald-600/80 font-medium mt-0.5">Com hash de integridade</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-2xl">
              <ShieldCheck className="size-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aguardando Aceite</p>
              <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{totalPendentes.length}</h3>
              <p className="text-[11px] text-amber-600/80 font-medium mt-0.5">Pendentes de assinatura</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 rounded-2xl">
              <Clock className="size-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ABAS DO SISTEMA */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
          <TabsTrigger value="emitidos" className="rounded-xl font-bold text-xs gap-2 py-2">
            <FileSignature className="size-4" />
            Contratos Emitidos ({contratos.length})
          </TabsTrigger>
          <TabsTrigger value="gerador" className="rounded-xl font-bold text-xs gap-2 py-2">
            <Sparkles className="size-4" />
            Gerador em Lote
          </TabsTrigger>
          <TabsTrigger value="templates" className="rounded-xl font-bold text-xs gap-2 py-2">
            <Layers className="size-4" />
            Modelos de Contrato ({todosTemplates.length})
          </TabsTrigger>
        </TabsList>

        {/* =========================================================================
            ABA 1: CONTRATOS EMITIDOS (Acompanhamento e Gestão)
        ========================================================================= */}
        <TabsContent value="emitidos" className="space-y-4">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="size-4 absolute left-3 top-3 text-slate-400" />
                  <Input
                    placeholder="Buscar por nome, CPF, código ou função..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-9 h-10 rounded-xl"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger className="w-40 h-10 rounded-xl">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Status</SelectItem>
                      <SelectItem value="pendente">Pendentes</SelectItem>
                      <SelectItem value="assinado">Assinados</SelectItem>
                      <SelectItem value="recusado">Recusados</SelectItem>
                      <SelectItem value="cancelado">Cancelados</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filtroEspetaculo} onValueChange={setFiltroEspetaculo}>
                    <SelectTrigger className="w-48 h-10 rounded-xl">
                      <SelectValue placeholder="Espetáculo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Espetáculos</SelectItem>
                      {espetaculosList.map((esp) => (
                        <SelectItem key={esp} value={esp}>{esp}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center">
                    <ReportExportButton
                      onExportPdf={() => exportarContratosRelatorioPDF(contratosFiltrados, filtroEspetaculo !== "todos" ? filtroEspetaculo : undefined)}
                      onExportExcel={() => exportarContratosExcel(contratosFiltrados, filtroEspetaculo !== "todos" ? filtroEspetaculo : undefined)}
                    />
                  </div>
                  <Button
                    onClick={() => {
                      resetNovoContratoForm();
                      setNovoContratoModalOpen(true);
                    }}
                    className="h-10 rounded-xl gap-2 font-bold bg-primary text-white shadow-sm"
                  >
                    <Plus className="size-4" /> Novo Contrato Personalizado
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {contratosFiltrados.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <FileText className="size-12 mx-auto mb-3 opacity-40 text-primary" />
                  <p className="font-bold text-slate-700 dark:text-slate-200 text-base">Nenhum contrato cadastrado ou encontrado</p>
                  <p className="text-xs text-slate-400 mt-1 mb-5">Emita contratos com discriminação de cachê, diárias e benefícios ou use o gerador em lote.</p>
                  <Button
                    onClick={() => {
                      resetNovoContratoForm();
                      setNovoContratoModalOpen(true);
                    }}
                    className="gap-2 rounded-xl bg-primary text-white font-bold px-6 shadow-md"
                  >
                    <Plus className="size-4" /> Emitir Primeiro Contrato Personalizado
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-3">Profissional</th>
                        <th className="py-3 px-3">Espetáculo & Praça</th>
                        <th className="py-3 px-3">Função</th>
                        <th className="py-3 px-3">Remuneração Total</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {contratosFiltrados.map((c) => {
                        const isAssinado = c.status === "assinado";
                        const isPendente = c.status === "pendente";
                        const isCancelado = c.status === "cancelado";
                        const isRecusado = c.status === "recusado";

                        return (
                          <tr key={c.id} className={`hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors ${isCancelado ? "opacity-60 bg-slate-50/30 dark:bg-slate-900/30" : ""}`}>
                            <td className="py-3 px-3">
                              <p className={`font-bold text-sm ${isCancelado ? "line-through text-slate-500" : "text-slate-900 dark:text-white"}`}>
                                {c.usuario?.nome || c.signatario_nome || "Nome não identificado"}
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono">
                                CPF: {c.usuario?.cpf || "Não cadastrado"} {c.usuario?.rg ? `• RG: ${c.usuario.rg}` : ""} • {c.codigo_autenticacao}
                              </p>
                            </td>

                            <td className="py-3 px-3">
                              {c.evento ? (
                                <>
                                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                                    {c.evento.espetaculo}
                                  </p>
                                  <p className="text-[11px] text-slate-400">
                                    {c.evento.cidade} • {c.evento.data}
                                  </p>
                                </>
                              ) : (
                                <span className="text-slate-400">Geral / Turnê</span>
                              )}
                            </td>

                            <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                              {c.funcao}
                            </td>

                            <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                              {formatCurrencyBR((c as any).valor_total || c.valor_cache)}
                            </td>

                            <td className="py-3 px-3">
                              <Badge
                                variant="outline"
                                className={
                                  isAssinado
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300"
                                    : isPendente
                                    ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300"
                                    : isCancelado
                                    ? "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-900/50 dark:text-slate-400"
                                    : "bg-rose-50 text-rose-700 border-rose-300"
                                }
                              >
                                {isAssinado ? (
                                  <>
                                    <CheckCircle2 className="size-3 mr-1 text-emerald-600" /> Assinado
                                  </>
                                ) : isPendente ? (
                                  <>
                                    <Clock className="size-3 mr-1 text-amber-600" /> Pendente
                                  </>
                                ) : isCancelado ? (
                                  <>
                                    <XCircle className="size-3 mr-1 text-slate-500" /> Cancelado
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="size-3 mr-1 text-rose-600" /> Recusado
                                  </>
                                )}
                              </Badge>
                              {isAssinado && c.assinado_em && (
                                <p className="text-[10px] text-slate-400 mt-1">
                                  {format(new Date(c.assinado_em), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                                </p>
                              )}
                            </td>

                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setViewContrato(c)}
                                  title="Visualizar Contrato Completo"
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="size-4 text-slate-600 dark:text-slate-300" />
                                </Button>

                                {!isCancelado && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAbrirGeradorAditivo(c)}
                                    title="Emitir Termo Aditivo a este contrato"
                                    className="h-8 px-2 text-xs gap-1 rounded-lg text-primary hover:text-primary border-primary/30 hover:bg-primary/5 font-semibold"
                                  >
                                    <Plus className="size-3.5" /> Aditivo
                                  </Button>
                                )}

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => exportContractToPDF(c.titulo, c.conteudo_gerado || c.conteudo_contrato || "", {
                                    codigoAutenticacao: c.codigo_autenticacao,
                                    status: c.status,
                                    assinadoEm: c.assinado_em,
                                    signatarioNome: c.signatario_nome,
                                    signatarioCpf: c.signatario_cpf,
                                    signatarioEmail: c.signatario_email,
                                    signatarioIp: c.signatario_ip,
                                    signatarioUserAgent: c.signatario_user_agent,
                                    hashDocumento: c.hash_documento
                                  }, infoProdutora)}
                                  title="Baixar em PDF"
                                  className="h-8 w-8 p-0 rounded-lg"
                                >
                                  <Download className="size-4 text-slate-600 dark:text-slate-300" />
                                </Button>

                                {isPendente && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleReenviarNotificacao(c)}
                                    title="Reenviar Notificação de Cobrança"
                                    className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700"
                                  >
                                    <Bell className="size-4" />
                                  </Button>
                                )}

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteContrato(c)}
                                  title={isCancelado ? "Excluir Registro" : "Excluir ou Cancelar Contrato"}
                                  className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700"
                                >
                                  <Trash2 className="size-4" />
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
        </TabsContent>

        {/* =========================================================================
            ABA 2: GERADOR AUTOMÁTICO EM LOTE
        ========================================================================= */}
        <TabsContent value="gerador" className="space-y-6">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="size-5 text-primary" />
                Gerador de Contratos em Lote da Escala
              </CardTitle>
              <CardDescription>
                Selecione o espetáculo e a praça para gerar os contratos de todo o elenco e técnicos escalados com 1 clique.
              </CardDescription>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3">
                {/* 1. Menu Dropdown de Espetáculo */}
                <div>
                  <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">1. Selecione o Espetáculo:</Label>
                  <Select
                    value={selectedEspetaculo}
                    onValueChange={(val) => {
                      setSelectedEspetaculo(val);
                      setSelectedEventoId("");
                    }}
                  >
                    <SelectTrigger className="mt-1 h-10 rounded-xl bg-white dark:bg-slate-800">
                      <SelectValue placeholder="Selecione o espetáculo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {espetaculosCadastrados.map((esp) => (
                        <SelectItem key={esp} value={esp}>
                          🎭 {esp}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 2. Menu Dropdown de Praça / Apresentação */}
                <div>
                  <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">2. Selecione a Praça / Evento:</Label>
                  <Select
                    value={selectedEventoId}
                    onValueChange={setSelectedEventoId}
                    disabled={!selectedEspetaculo}
                  >
                    <SelectTrigger className="mt-1 h-10 rounded-xl bg-white dark:bg-slate-800">
                      <SelectValue placeholder={selectedEspetaculo ? "Selecione a praça..." : "Escolha o espetáculo primeiro"} />
                    </SelectTrigger>
                    <SelectContent>
                      {eventos
                        .filter((ev) => !selectedEspetaculo || (ev.espetaculo || "").trim().toLowerCase() === selectedEspetaculo.trim().toLowerCase())
                        .map((ev) => (
                          <SelectItem key={ev.id} value={ev.id}>
                            📍 {ev.cidade} • {ev.data || "Sem data"} {ev.local ? `(${ev.local})` : ""}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 3. Modelo Padrão Global do Lote */}
                <div>
                  <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">3. Modelo Padrão da Categoria:</Label>
                  <Select
                    value={loteTemplateGlobal}
                    onValueChange={(val) => {
                      setLoteTemplateGlobal(val);
                      // Aplica a todos os selecionados
                      const next = { ...loteTemplates };
                      equipeEscalada.forEach((item) => {
                        if (item.usuario) next[item.usuario.id] = val;
                      });
                      setLoteTemplates(next);
                    }}
                  >
                    <SelectTrigger className="mt-1 h-10 rounded-xl bg-white dark:bg-slate-800">
                      <SelectValue placeholder="Aplicar a todos..." />
                    </SelectTrigger>
                    <SelectContent>
                      {todosTemplates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.titulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 4. Condições de Pagamento */}
                <div>
                  <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">4. Regras de Pagamento:</Label>
                  <Input
                    value={condicoesPadraoLote}
                    onChange={(e) => setCondicoesPadraoLote(e.target.value)}
                    placeholder="Ex: Pagamento via PIX até 5 dias úteis..."
                    className="mt-1 h-10 rounded-xl bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* SEÇÃO DE CONDICIONANTES OPERACIONAIS EM LOTE (BENEFÍCIOS E LOGÍSTICA) */}
              <div className="mt-4 pt-4 border-t space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Plane className="size-4 text-primary" /> Condicionantes Operacionais e Benefícios da Equipe
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-500 font-semibold">Data Contratual:</span>
                      <Input
                        type="text"
                        placeholder="DD/MM/AAAA ou da Praça"
                        value={loteDataPersonalizada}
                        onChange={(e) => setLoteDataPersonalizada(e.target.value)}
                        className="h-8 w-40 text-xs rounded-lg bg-white dark:bg-slate-800"
                        title="Se vazio, usa a data cadastrada na praça"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-500 font-semibold">Qtd. Apresentações:</span>
                      <Input
                        type="number"
                        min="1"
                        placeholder="1"
                        value={loteQtdApresentacoes}
                        onChange={(e) => setLoteQtdApresentacoes(e.target.value === "" ? "" : parseInt(e.target.value) || 1)}
                        className="h-8 w-16 text-xs text-center rounded-lg bg-white dark:bg-slate-800"
                        title="Caso na mesma praça ocorram 2 apresentações (ex: 2 shows), digite 2"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-500 font-semibold">Qtd. de Diárias:</span>
                      <Input
                        type="number"
                        min="1"
                        value={loteQtdDiarias}
                        onChange={(e) => setLoteQtdDiarias(parseInt(e.target.value) || 1)}
                        className="h-8 w-16 text-xs text-center rounded-lg bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Transporte */}
                  <div className={`p-3 rounded-xl border text-xs transition-all ${loteBeneficioTransporte ? "bg-white dark:bg-slate-900 border-primary/40 shadow-xs" : "bg-slate-50 dark:bg-slate-900/30 opacity-60"}`}>
                    <label className="flex items-center gap-2 cursor-pointer font-bold mb-1.5">
                      <Checkbox checked={loteBeneficioTransporte} onCheckedChange={(c) => setLoteBeneficioTransporte(Boolean(c))} />
                      <span className="flex items-center gap-1"><Plane className="size-3.5 text-primary" /> Transporte</span>
                    </label>
                    {loteBeneficioTransporte && (
                      <Input
                        value={loteTextoTransporte}
                        onChange={(e) => setLoteTextoTransporte(e.target.value)}
                        placeholder="Regras de transporte..."
                        className="h-8 text-[11px] rounded-lg mt-1"
                      />
                    )}
                  </div>

                  {/* Hospedagem */}
                  <div className={`p-3 rounded-xl border text-xs transition-all ${loteBeneficioHospedagem ? "bg-white dark:bg-slate-900 border-primary/40 shadow-xs" : "bg-slate-50 dark:bg-slate-900/30 opacity-60"}`}>
                    <label className="flex items-center gap-2 cursor-pointer font-bold mb-1.5">
                      <Checkbox checked={loteBeneficioHospedagem} onCheckedChange={(c) => setLoteBeneficioHospedagem(Boolean(c))} />
                      <span className="flex items-center gap-1"><Hotel className="size-3.5 text-primary" /> Hospedagem</span>
                    </label>
                    {loteBeneficioHospedagem && (
                      <Input
                        value={loteTextoHospedagem}
                        onChange={(e) => setLoteTextoHospedagem(e.target.value)}
                        placeholder="Regras de hotel..."
                        className="h-8 text-[11px] rounded-lg mt-1"
                      />
                    )}
                  </div>

                  {/* Alimentação */}
                  <div className={`p-3 rounded-xl border text-xs transition-all ${loteBeneficioAlimentacao ? "bg-white dark:bg-slate-900 border-primary/40 shadow-xs" : "bg-slate-50 dark:bg-slate-900/30 opacity-60"}`}>
                    <label className="flex items-center gap-2 cursor-pointer font-bold mb-1.5">
                      <Checkbox checked={loteBeneficioAlimentacao} onCheckedChange={(c) => setLoteBeneficioAlimentacao(Boolean(c))} />
                      <span className="flex items-center gap-1"><Utensils className="size-3.5 text-primary" /> Alimentação</span>
                    </label>
                    {loteBeneficioAlimentacao && (
                      <Input
                        value={loteTextoAlimentacao}
                        onChange={(e) => setLoteTextoAlimentacao(e.target.value)}
                        placeholder="Regras de catering..."
                        className="h-8 text-[11px] rounded-lg mt-1"
                      />
                    )}
                  </div>

                  {/* Traslados */}
                  <div className={`p-3 rounded-xl border text-xs transition-all ${loteBeneficioTraslado ? "bg-white dark:bg-slate-900 border-primary/40 shadow-xs" : "bg-slate-50 dark:bg-slate-900/30 opacity-60"}`}>
                    <label className="flex items-center gap-2 cursor-pointer font-bold mb-1.5">
                      <Checkbox checked={loteBeneficioTraslado} onCheckedChange={(c) => setLoteBeneficioTraslado(Boolean(c))} />
                      <span className="flex items-center gap-1"><Car className="size-3.5 text-primary" /> Traslados</span>
                    </label>
                    {loteBeneficioTraslado && (
                      <Input
                        value={loteTextoTraslado}
                        onChange={(e) => setLoteTextoTraslado(e.target.value)}
                        placeholder="Regras de vans/traslado..."
                        className="h-8 text-[11px] rounded-lg mt-1"
                      />
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              {!selectedEventoId ? (
                <div className="text-center py-12 text-slate-400">
                  <Calendar className="size-10 mx-auto mb-2 opacity-30 text-primary" />
                  <p className="font-semibold text-sm">Selecione o espetáculo e a praça acima para carregar a equipe</p>
                </div>
              ) : equipeEscalada.length === 0 ? (
                <div className="text-center py-10 px-4 max-w-lg mx-auto bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 space-y-4">
                  <Users className="size-10 mx-auto text-primary opacity-60" />
                  <div>
                    <p className="font-bold text-slate-700 dark:text-slate-200">
                      Nenhum profissional vinculado na escala deste evento ainda
                    </p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Você pode carregar toda a equipe cadastrada no sistema ou escolher membros individualmente abaixo para gerar os contratos:
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <Button
                      onClick={carregarTodaEquipeCadastrada}
                      className="rounded-xl font-bold gap-2 text-xs h-9 shadow-sm w-full sm:w-auto"
                    >
                      <Users className="size-4" /> Carregar Equipe do Sistema ({todosUsuarios.length})
                    </Button>

                    <Select onValueChange={(uId) => {
                      const u = todosUsuarios.find(x => x.id === uId);
                      if (u) adicionarMembroNaLista(u);
                    }}>
                      <SelectTrigger className="w-full sm:w-56 h-9 rounded-xl text-xs bg-white dark:bg-slate-800">
                        <SelectValue placeholder="+ Escolher Integrante..." />
                      </SelectTrigger>
                      <SelectContent>
                        {todosUsuarios.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.nome} ({u.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* BARRA DE FILTROS POR CATEGORIA (ELENCO, TÉCNICO, PRODUÇÃO) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 mr-1">Filtrar Categoria:</span>
                      {[
                        { id: "todas", label: "Todos os Membros" },
                        { id: "artistico", label: "🎭 Elenco / Artistas" },
                        { id: "tecnico", label: "⚡ Equipe Técnica" },
                        { id: "producao", label: "📋 Produção / Backstage" }
                      ].map((cat) => (
                        <Button
                          key={cat.id}
                          size="sm"
                          variant={loteFiltroCategoria === cat.id ? "default" : "outline"}
                          onClick={() => {
                            setLoteFiltroCategoria(cat.id as any);
                            // Seleciona automaticamente os membros pertencentes à categoria escolhida
                            const next = { ...loteSelection };
                            equipeEscalada.forEach((item) => {
                              if (!item.usuario) return;
                              const funcLower = String(item.funcao || item.usuario.role || "").toLowerCase();
                              const isTec = ["iluminador", "tecnico_som", "tecnico_video", "stage_manager", "contra_regra", "roadie", "cenotecnico", "rigger"].some(r => funcLower.includes(r));
                              const isProd = ["produtor", "producao", "camareiro", "motorista", "assistente"].some(r => funcLower.includes(r));
                              const isArt = !isTec && !isProd;

                              if (cat.id === "todas") {
                                next[item.usuario.id] = true;
                              } else if (cat.id === "tecnico") {
                                next[item.usuario.id] = isTec;
                              } else if (cat.id === "producao") {
                                next[item.usuario.id] = isProd;
                              } else if (cat.id === "artistico") {
                                next[item.usuario.id] = isArt;
                              }
                            });
                            setLoteSelection(next);
                          }}
                          className="text-xs h-7 rounded-lg"
                        >
                          {cat.label}
                        </Button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <Select onValueChange={(uId) => {
                        const u = todosUsuarios.find(x => x.id === uId);
                        if (u) adicionarMembroNaLista(u);
                      }}>
                        <SelectTrigger className="w-56 h-8 rounded-lg text-xs bg-white dark:bg-slate-800">
                          <SelectValue placeholder="+ Adicionar outro integrante..." />
                        </SelectTrigger>
                        <SelectContent>
                          {todosUsuarios
                            .filter(u => !equipeEscalada.some(item => item.usuario?.id === u.id))
                            .map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.nome} ({u.role})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* LISTA DE INTEGRANTES COM CAMPOS DETALHADOS DE CACHÊ, DIÁRIAS E MODELO */}
                  <div className="border rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-white/5 bg-white dark:bg-slate-900">
                    {equipeEscalada
                      .filter((item) => {
                        if (!item.usuario) return false;
                        if (loteFiltroCategoria === "todas") return true;
                        const funcLower = String(item.funcao || item.usuario.role || "").toLowerCase();
                        const isTec = ["iluminador", "tecnico_som", "tecnico_video", "stage_manager", "contra_regra", "roadie", "cenotecnico", "rigger"].some(r => funcLower.includes(r));
                        const isProd = ["produtor", "producao", "camareiro", "motorista", "assistente"].some(r => funcLower.includes(r));
                        const isArt = !isTec && !isProd;

                        if (loteFiltroCategoria === "tecnico") return isTec;
                        if (loteFiltroCategoria === "producao") return isProd;
                        if (loteFiltroCategoria === "artistico") return isArt;
                        return true;
                      })
                      .map((item) => {
                        if (!item.usuario) return null;
                        const u = item.usuario;
                        const isSelected = !!loteSelection[u.id];

                        const cacheNum = parseCurrency(loteCaches[u.id] ?? "0,00");
                        const diariaNum = parseCurrency(loteDiariasValores[u.id] ?? "0,00");
                        const ajudaNum = parseCurrency(loteAjudasCusto[u.id] ?? "0,00");
                        const qtdApres = (loteQtdApresentacoes !== "" && Number(loteQtdApresentacoes) > 0)
                          ? Number(loteQtdApresentacoes)
                          : 1;
                        const totalCalculadoLinha = (cacheNum * qtdApres) + (diariaNum * loteQtdDiarias) + ajudaNum;

                        return (
                          <div
                            key={item.id}
                            className={`p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4 transition-colors ${
                              isSelected ? "bg-primary/[0.02]" : "opacity-60 bg-slate-50/50"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-[220px]">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) =>
                                  setLoteSelection((prev) => ({ ...prev, [u.id]: !!checked }))
                                }
                              />
                              <div>
                                <p className="font-bold text-sm text-slate-800 dark:text-white">{u.nome}</p>
                                <p className="text-xs text-slate-400">
                                  Função: <span className="text-slate-700 dark:text-slate-300 font-medium">{item.funcao}</span> • CPF: {u.cpf || "Não cadastrado"}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                              {/* Seleção do Modelo de Contrato */}
                              <div className="w-52">
                                <Label className="text-[10px] text-slate-400 font-bold block mb-1">Modelo de Contrato:</Label>
                                <Select
                                  value={loteTemplates[u.id] || loteTemplateGlobal || ""}
                                  onValueChange={(val) =>
                                    setLoteTemplates((prev) => ({ ...prev, [u.id]: val }))
                                  }
                                >
                                  <SelectTrigger className="h-9 text-xs rounded-xl bg-white dark:bg-slate-800">
                                    <SelectValue placeholder="Modelo de Contrato" />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-60">
                                    {todosTemplates.map((t) => (
                                      <SelectItem key={t.id} value={t.id} className="text-xs">
                                        {t.titulo}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Valor do Cachê */}
                              <div className="w-32">
                                <Label className="text-[10px] text-slate-400 font-bold block mb-1">Cachê (R$):</Label>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-slate-400 font-bold">R$</span>
                                  <CurrencyInput
                                    value={String(loteCaches[u.id] ?? "0,00")}
                                    onChange={(val) =>
                                      setLoteCaches((prev) => ({ ...prev, [u.id]: val }))
                                    }
                                    placeholder="0,00"
                                    className="h-9 text-xs font-bold rounded-xl"
                                  />
                                </div>
                              </div>

                              {/* Valor da Diária */}
                              <div className="w-32">
                                <Label className="text-[10px] text-slate-400 font-bold block mb-1">Diária ({loteQtdDiarias}x):</Label>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-slate-400 font-bold">R$</span>
                                  <CurrencyInput
                                    value={String(loteDiariasValores[u.id] ?? "0,00")}
                                    onChange={(val) =>
                                      setLoteDiariasValores((prev) => ({ ...prev, [u.id]: val }))
                                    }
                                    placeholder="0,00"
                                    className="h-9 text-xs rounded-xl"
                                  />
                                </div>
                              </div>

                              {/* Ajuda de Custo / Transporte */}
                              <div className="w-32">
                                <Label className="text-[10px] text-slate-400 font-bold block mb-1">Ajuda de Custo:</Label>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-slate-400 font-bold">R$</span>
                                  <CurrencyInput
                                    value={String(loteAjudasCusto[u.id] ?? "0,00")}
                                    onChange={(val) =>
                                      setLoteAjudasCusto((prev) => ({ ...prev, [u.id]: val }))
                                    }
                                    placeholder="0,00"
                                    className="h-9 text-xs rounded-xl"
                                  />
                                </div>
                              </div>

                              {/* Total Calculado */}
                              <div className="text-right min-w-[100px] pl-2 border-l">
                                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total:</span>
                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                  {formatCurrencyBR(totalCalculadoLinha)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  <div className="pt-4 flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      Serão gerados contratos individuais completos com auditoria e notificações para todos os membros assinalados.
                    </p>
                    <Button
                      size="lg"
                      disabled={gerandoLote}
                      onClick={handleGerarContratosLote}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 rounded-xl shadow-md h-12 px-6"
                    >
                      {gerandoLote ? (
                        <>
                          <Clock className="size-5 animate-spin" /> Gerando e Disparando...
                        </>
                      ) : (
                        <>
                          <Send className="size-5" /> Gerar e Disparar Contratos Selecionados
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* =========================================================================
            ABA 3: MODELOS DE CONTRATOS (Templates)
        ========================================================================= */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Modelos Cadastrados</h3>
              <p className="text-xs text-slate-500">Edite as cláusulas, crie novos ou exclua modelos indesejados. Use variáveis dinâmicas como {"{{NOME_CONTRATADO}}"}, {"{{VALOR_CACHE}}"}.</p>
            </div>
            <div className="flex items-center gap-2">
              {modelosPadraoExcluidos.length > 0 && (
                <Button
                  onClick={handleRestaurarModelosPadrao}
                  size="sm"
                  variant="outline"
                  className="gap-1.5 rounded-xl text-xs text-slate-600 dark:text-slate-300 border-dashed"
                  title="Restaurar os modelos padrão originais do Áxis"
                >
                  <RotateCcw className="size-3.5" /> Restaurar Padrões ({modelosPadraoExcluidos.length})
                </Button>
              )}
              <Button
                onClick={() => {
                  setEditTemplate({ titulo: "", tipo: "artistico", descricao: "", conteudo_padrao: "", conteudo_markdown: "" });
                  setTemplateModalOpen(true);
                }}
                size="sm"
                className="gap-2 rounded-xl"
              >
                <Plus className="size-4" /> Novo Modelo
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todosTemplates.map((tpl) => (
              <Card key={tpl.id} className="border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-primary/40 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="capitalize text-[10px]">
                      {tpl.tipo}
                    </Badge>
                    <div className="flex items-center gap-1.5">
                      {tpl.is_padrao ? (
                        <Badge className="bg-primary/10 hover:bg-primary/15 text-primary border-primary/20 text-[10px] font-semibold">
                          Padrão Áxis
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] font-semibold">
                          Meu Modelo Customizado
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTemplate(tpl)}
                        title="Excluir este modelo"
                        className="h-6 w-6 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-base font-bold mt-2 leading-snug">{tpl.titulo}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2 mt-1">{tpl.descricao}</CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="border-t border-slate-100 dark:border-white/5 pt-3 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {(tpl.conteudo_markdown || tpl.conteudo_padrao || "").length} caracteres
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditTemplate(tpl);
                          setTemplateModalOpen(true);
                        }}
                        className="gap-1.5 text-xs rounded-lg font-medium"
                      >
                        <Edit2 className="size-3.5" /> Ver / Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTemplate(tpl)}
                        title="Excluir este modelo"
                        className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* MODAL DE VISUALIZAÇÃO DE CONTRATO EMITIDO */}
      <Dialog open={!!viewContrato} onOpenChange={(open) => !open && setViewContrato(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-xs font-mono text-primary font-bold">
              <ShieldCheck className="size-4" /> {viewContrato?.codigo_autenticacao}
            </div>
            <DialogTitle className="text-xl font-black text-slate-800 dark:text-white">
              {viewContrato?.titulo}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Contratado: {viewContrato?.usuario?.nome} • Cachê: {formatCurrencyBR(viewContrato?.valor_cache || 0)}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            {(viewContrato?.conteudo_gerado || viewContrato?.conteudo_contrato || "").split("\n").map((para, i) => {
              const trimmed = para.trim();
              if (!trimmed) return <div key={i} className="h-2" />;
              const isH1 = trimmed.startsWith("# ");
              const isH2 = trimmed.startsWith("## ");
              const isH3 = trimmed.startsWith("### ") || trimmed.startsWith("#### ");
              const isHeading =
                isH1 ||
                isH2 ||
                isH3 ||
                trimmed.startsWith("CLÁUSULA") ||
                trimmed.startsWith("CONTRATO") ||
                trimmed.startsWith("TERMO") ||
                trimmed.startsWith("CONTRATANTE:") ||
                trimmed.startsWith("CONTRATADO(A):") ||
                trimmed.startsWith("ITINERÁRIO");

              const cleanText = trimmed
                .replace(/^#{1,6}\s*/, "")
                .replace(/\*\*(.*?)\*\*/g, "$1");

              return (
                <p 
                  key={i} 
                  className={
                    isH1
                      ? "font-bold text-slate-900 dark:text-white text-base pt-2 text-center"
                      : isHeading
                      ? "font-bold text-slate-900 dark:text-white text-sm pt-2"
                      : "text-justify"
                  }
                >
                  {cleanText}
                </p>
              );
            })}

            {viewContrato?.status === "assinado" && (
              <div className="mt-6 p-4 rounded-xl border border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-sm">
                  <ShieldCheck className="size-4 text-emerald-600" />
                  Certificado de Autenticidade Digital
                </p>
                <p>Assinado por: <strong>{viewContrato.signatario_nome}</strong> (CPF: {viewContrato.signatario_cpf})</p>
                <p>Data e Hora: <strong>{viewContrato.assinado_em && format(new Date(viewContrato.assinado_em), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</strong></p>
                <p>Endereço IP: {viewContrato.signatario_ip}</p>
                <p className="font-mono text-[10px] text-slate-500 pt-1">Hash SHA-256: {viewContrato.hash_documento}</p>
              </div>
            )}
          </div>

          <DialogFooter className="p-4 border-t bg-slate-50 dark:bg-slate-900 flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportContractToPDF(viewContrato!.titulo, viewContrato!.conteudo_gerado || viewContrato!.conteudo_contrato || "", {
                codigoAutenticacao: viewContrato!.codigo_autenticacao,
                status: viewContrato!.status,
                assinadoEm: viewContrato!.assinado_em,
                signatarioNome: viewContrato!.signatario_nome,
                signatarioCpf: viewContrato!.signatario_cpf,
                signatarioEmail: viewContrato!.signatario_email,
                signatarioIp: viewContrato!.signatario_ip,
                signatarioUserAgent: viewContrato!.signatario_user_agent,
                hashDocumento: viewContrato!.hash_documento
              }, infoProdutora)}
              className="gap-2 text-xs"
            >
              <Download className="size-4" /> Baixar PDF Oficial
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setViewContrato(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL DE EMISSÃO DE CONTRATO PERSONALIZADO (INDIVIDUAL)
      ========================================================================= */}
      <Dialog open={novoContratoModalOpen} onOpenChange={setNovoContratoModalOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b bg-slate-50/80 dark:bg-slate-900/80">
            <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
              <FileSignature className="size-4" /> Contrato Individual de Equipe & Elenco
            </div>
            <DialogTitle className="text-xl font-black text-slate-800 dark:text-white">
              Emissão de Contrato Personalizado
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Configure os valores detalhados (cachê, diárias, ajuda de custo), benefícios operacionais inclusos e dados bancários para geração do documento com validade jurídica.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* ETAPA 1: SELEÇÃO DE PROFISSIONAL E SHOW */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b text-sm font-bold text-slate-800 dark:text-white">
                <Users className="size-4 text-primary" />
                1. Contratado, Espetáculo e Praça
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Profissional */}
                <div>
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Profissional a Contratar *</Label>
                  <Select value={novoUserId} onValueChange={handleSelectNovoUser}>
                    <SelectTrigger className="mt-1 h-11 rounded-xl">
                      <SelectValue placeholder="Selecione o membro da equipe..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {todosUsuarios.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          <span className="font-semibold">{u.nome}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Função Contratual */}
                <div>
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Função / Atuação no Show *</Label>
                  {(() => {
                    const userObj = todosUsuarios.find((u) => u.id === novoUserId);
                    const funcoesDisponiveis = userObj
                      ? Array.from(new Set([userObj.role, ...(userObj.funcoes || [])])).filter(Boolean)
                      : [];

                    return (
                      <Select 
                        value={novoFuncao} 
                        onValueChange={(val) => setNovoFuncao(val)}
                        disabled={!novoUserId}
                      >
                        <SelectTrigger className="mt-1 h-11 rounded-xl disabled:opacity-50">
                          <SelectValue placeholder={novoUserId ? "Selecione a função..." : "Selecione o profissional primeiro"} />
                        </SelectTrigger>
                        <SelectContent>
                          {funcoesDisponiveis.map((f) => (
                            <SelectItem key={f} value={formatarNomeFuncao(f)}>
                              {formatarNomeFuncao(f).toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  })()}
                </div>

                {/* Espetáculo */}
                <div>
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Espetáculo / Turnê *</Label>
                  <Select value={novoEspetaculo} onValueChange={handleSelectNovoEspetaculo}>
                    <SelectTrigger className="mt-1 h-11 rounded-xl">
                      <SelectValue placeholder="Selecione o espetáculo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {espetaculosCadastrados.map((esp) => (
                        <SelectItem key={esp} value={esp}>{esp}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Praça Única vs Turnê */}
                <div className="md:col-span-2 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-0.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Escopo da Contratação *
                    </Label>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setIsTurne(false)}
                        className={`px-3 py-1 rounded-lg transition-all ${
                          !isTurne
                            ? "bg-white dark:bg-slate-700 text-primary shadow-sm font-bold"
                            : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        Apresentação Única (1 Praça)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsTurne(true);
                          if (novoEventoIds.length === 0 && novoEspetaculo) {
                            const evs = eventos.filter((e) => e.espetaculo === novoEspetaculo);
                            setNovoEventoIds(evs.map((e) => e.id));
                          }
                        }}
                        className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                          isTurne
                            ? "bg-white dark:bg-slate-700 text-primary shadow-sm font-bold"
                            : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <Plane className="size-3.5" />
                        Turnê / Temporada (Múltiplas Praças)
                      </button>
                    </div>
                  </div>

                  {!isTurne ? (
                    <div>
                      <Select value={novoEventoId} onValueChange={handleSelectNovoEvento}>
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="Selecione a cidade/praça do evento..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                          {eventos
                            .filter((ev) => !novoEspetaculo || ev.espetaculo === novoEspetaculo)
                            .map((ev) => (
                              <SelectItem key={ev.id} value={ev.id}>
                                <span className="font-semibold">{ev.cidade}</span>
                                <span className="text-slate-400 text-xs ml-2">
                                  ({ev.local || "Teatro"}) • {ev.data || "Data a definir"}
                                </span>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Contrato específico para uma única praça/apresentação.
                      </span>
                    </div>
                  ) : (
                    <div className="border border-slate-200 dark:border-white/10 rounded-2xl p-3.5 bg-slate-50/70 dark:bg-slate-900/40 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="text-xs bg-primary text-white font-bold">
                            {novoEventoIds.length} praça(s) selecionada(s)
                          </Badge>
                          <span className="text-xs text-slate-500">
                            Marque os eventos que farão parte deste contrato de turnê:
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs rounded-lg"
                            onClick={() => {
                              const evs = eventos.filter((e) => !novoEspetaculo || e.espetaculo === novoEspetaculo);
                              setNovoEventoIds(evs.map((e) => e.id));
                            }}
                          >
                            Selecionar Todas
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs rounded-lg text-slate-500"
                            onClick={() => setNovoEventoIds([])}
                          >
                            Desmarcar
                          </Button>
                        </div>
                      </div>

                      {/* Lista de eventos com checkboxes */}
                      <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                        {eventos
                          .filter((ev) => !novoEspetaculo || ev.espetaculo === novoEspetaculo)
                          .map((ev) => {
                            const isChecked = novoEventoIds.includes(ev.id);
                            return (
                              <label
                                key={ev.id}
                                className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                                  isChecked
                                    ? "bg-white dark:bg-slate-800 border-primary/50 shadow-sm"
                                    : "bg-slate-100/50 dark:bg-slate-900/20 border-transparent opacity-75 hover:opacity-100"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setNovoEventoIds((prev) => [...prev, ev.id]);
                                      } else {
                                        setNovoEventoIds((prev) => prev.filter((id) => id !== ev.id));
                                      }
                                    }}
                                  />
                                  <div>
                                    <span className="font-bold text-sm text-slate-800 dark:text-white block">
                                      {ev.cidade}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                      {ev.local || "Teatro Municipal"}
                                      {ev.horario ? ` • ${ev.horario}` : ""}
                                    </span>
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-xs font-mono">
                                  {ev.data ? format(new Date(ev.data + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR }) : "Data a definir"}
                                </Badge>
                              </label>
                            );
                          })}
                      </div>

                      {/* Multiplicador de Cachê na Turnê */}
                      {novoModoRemuneracao === "discriminado" && novoEventoIds.length > 1 && (
                        <div className="pt-2 border-t border-slate-200 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <Checkbox
                              checked={multiplicarCachePorShows}
                              onCheckedChange={(c) => setMultiplicarCachePorShows(Boolean(c))}
                            />
                            <span>Multiplicar cachê pelo número de praças ({novoEventoIds.length}x)</span>
                          </label>
                          <span className="text-[11px] text-slate-500 italic">
                            {multiplicarCachePorShows
                              ? `Total cachê: ${novoEventoIds.length} x ${formatCurrencyBR(novoCache)} = ${formatCurrencyBR(novoCache * novoEventoIds.length)}`
                              : `Cachê único fixado para toda a turnê: ${formatCurrencyBR(novoCache)}`}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Ajuste manual de Datas e Apresentações do Contrato */}
                <div className="md:col-span-2 p-3.5 rounded-xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-primary" />
                      Datas e Quantidade de Apresentações
                    </Label>
                    <span className="text-[10px] text-slate-400">
                      Preenchido automaticamente pela praça, mas você pode editar se necessário
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-[11px] text-slate-500 font-medium block mb-1">Data Início / Apresentação:</span>
                      <Input
                        type="text"
                        placeholder="Ex: 20/11/2026"
                        value={novoDataInicioPersonalizada}
                        onChange={(e) => setNovoDataInicioPersonalizada(e.target.value)}
                        className="h-9 text-xs rounded-xl bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 font-medium block mb-1">Data Fim (se turnê/período):</span>
                      <Input
                        type="text"
                        placeholder="Ex: 21/11/2026"
                        value={novoDataFimPersonalizada}
                        onChange={(e) => setNovoDataFimPersonalizada(e.target.value)}
                        className="h-9 text-xs rounded-xl bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 font-medium block mb-1">Qtd. Apresentações:</span>
                      <Input
                        type="number"
                        min="1"
                        placeholder={isTurne && novoEventoIds.length > 0 ? String(novoEventoIds.length) : "1"}
                        value={novoQtdApresentacoesPersonalizada}
                        onChange={(e) => setNovoQtdApresentacoesPersonalizada(e.target.value === "" ? "" : parseInt(e.target.value) || 1)}
                        className="h-9 text-xs text-center rounded-xl bg-white dark:bg-slate-800"
                        title="Caso na mesma praça ocorram 2 apresentações (ex: 2 shows), digite 2"
                      />
                    </div>
                  </div>
                </div>

                {/* Modelo de Contrato */}
                <div className="md:col-span-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Modelo Jurídico Base *</Label>
                  <Select value={novoTemplateId} onValueChange={setNovoTemplateId}>
                    <SelectTrigger className="mt-1 h-11 rounded-xl">
                      <SelectValue placeholder="Selecione o modelo de contrato..." />
                    </SelectTrigger>
                    <SelectContent>
                      {todosTemplates.map((tpl) => (
                        <SelectItem key={tpl.id} value={tpl.id}>
                          <span className="font-semibold">{tpl.titulo}</span>
                          <span className="text-slate-400 text-xs ml-2">({tpl.tipo})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* CARD DE DETALHES DO PROFISSIONAL (CPF, RG, DADOS BANCÁRIOS E PIX) */}
              {novoUserId && (() => {
                const selUser = todosUsuarios.find((u) => u.id === novoUserId);
                if (!selUser) return null;
                const hasRg = Boolean(selUser.rg);
                const hasBank = Boolean(selUser.banco_codigo && selUser.banco_conta);
                const hasPix = Boolean(selUser.pix_chave);

                return (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-white/5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{selUser.nome}</span>
                        <Badge variant="outline" className="text-[10px]">{selUser.role}</Badge>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {selUser.endereco_cidade ? `${selUser.endereco_cidade} - ${selUser.endereco_estado || ""}` : "Endereço não cadastrado"}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-white/5">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Documentos Pessoais</span>
                        <div className="font-mono text-slate-700 dark:text-slate-300 mt-0.5">
                          CPF: {selUser.cpf || "Não informado"}
                        </div>
                        <div className="font-mono mt-0.5 flex items-center gap-1.5">
                          RG: {selUser.rg ? selUser.rg : (
                            <span className="text-rose-500 font-semibold text-[11px] flex items-center gap-1">
                              <AlertCircle className="size-3" /> Ausente
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-white/5">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Dados Bancários</span>
                        <div className="text-slate-700 dark:text-slate-300 mt-0.5 truncate">
                          {hasBank ? `Banco ${selUser.banco_codigo} | Ag. ${selUser.banco_agencia} | Cc ${selUser.banco_conta}` : "Não informados no perfil"}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {hasBank ? "Conta pronta para depósito" : "Sujeito a solicitação"}
                        </div>
                      </div>

                      <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-white/5">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Chave PIX</span>
                        <div className="text-slate-700 dark:text-slate-300 mt-0.5 truncate font-mono">
                          {hasPix ? selUser.pix_chave : (selUser.cpf || "Não cadastrada")}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {hasPix ? `Tipo: ${selUser.pix_tipo || "padrão"}` : "Usará CPF como fallback"}
                        </div>
                      </div>
                    </div>

                    {/* Alerta / Adicionar RG rápido caso esteja faltando */}
                    {!hasRg && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
                          <AlertCircle className="size-4 shrink-0 text-amber-600" />
                          <span>Este profissional ainda não possui <strong>RG</strong> cadastrado. Digite para salvar no perfil:</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Digite o RG..."
                            value={novoRgInline}
                            onChange={(e) => setNovoRgInline(e.target.value)}
                            className="h-8 text-xs w-36 rounded-lg bg-white dark:bg-slate-900"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSalvarRgInline(selUser.id)}
                            disabled={salvandoRgInline}
                            className="h-8 text-xs rounded-lg px-3 bg-amber-600 hover:bg-amber-700 text-white"
                          >
                            {salvandoRgInline ? "Salvando..." : "Salvar RG"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* ETAPA 2: COMPOSIÇÃO FINANCEIRA E REMUNERAÇÃO */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
                  <Calculator className="size-4 text-primary" />
                  2. Composição Financeira e Remuneração
                </div>

                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setNovoModoRemuneracao("discriminado")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      novoModoRemuneracao === "discriminado"
                        ? "bg-white dark:bg-slate-700 text-primary shadow-sm font-bold"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Valores Discriminados
                  </button>
                  <button
                    type="button"
                    onClick={() => setNovoModoRemuneracao("fechado")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      novoModoRemuneracao === "fechado"
                        ? "bg-white dark:bg-slate-700 text-primary shadow-sm font-bold"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Valor Fechado Global
                  </button>
                </div>
              </div>

              {novoModoRemuneracao === "discriminado" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Cachê */}
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Cachê (Apresentação)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold z-10">R$</span>
                        <CurrencyInput
                          value={novoCacheStr}
                          onChange={setNovoCacheStr}
                          placeholder="0,00"
                          className="pl-9 h-10 rounded-xl"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400">Cachê artístico/técnico</span>
                    </div>

                    {/* Diárias (Qtd x Valor) */}
                    <div className="space-y-1 sm:col-span-2 lg:col-span-2">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Diárias de Viagem</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Input
                            type="number"
                            min="0"
                            value={novoQtdDiarias}
                            onChange={(e) => setNovoQtdDiarias(parseInt(e.target.value) || 0)}
                            placeholder="Qtd dias"
                            className="h-10 rounded-xl"
                          />
                          <span className="text-[10px] text-slate-400">Qtd de diárias</span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold z-10">R$</span>
                          <CurrencyInput
                            value={novoValorDiariaStr}
                            onChange={setNovoValorDiariaStr}
                            placeholder="0,00"
                            className="pl-9 h-10 rounded-xl"
                          />
                          <span className="text-[10px] text-slate-400">Total: {formatCurrencyBR(totalDiariasCalculado)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Ajuda de Custo */}
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Ajuda de Custo</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold z-10">R$</span>
                        <CurrencyInput
                          value={novoAjudaCustoStr}
                          onChange={setNovoAjudaCustoStr}
                          placeholder="0,00"
                          className="pl-9 h-10 rounded-xl"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400">Combustível/transporte</span>
                    </div>
                  </div>

                  {/* Campo de adicionais/outros */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Outros Valores / Adicionais</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold z-10">R$</span>
                        <CurrencyInput
                          value={novoOutrosStr}
                          onChange={setNovoOutrosStr}
                          placeholder="0,00"
                          className="pl-9 h-10 rounded-xl"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400">Ensaio extra, montagem adicional, etc.</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-white/5 space-y-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Valor Fechado Global por Apresentação (Pacote Integral)
                  </Label>
                  <div className="relative max-w-sm">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold z-10">R$</span>
                    <CurrencyInput
                      value={novoValorFechadoStr}
                      onChange={setNovoValorFechadoStr}
                      placeholder="0,00"
                      className="pl-9 h-11 text-base font-bold rounded-xl"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Nesta modalidade, todas as despesas e serviços do profissional estão consolidadas num valor único contratual por apresentação.
                  </p>
                </div>
              )}

              {/* CARD DE TOTAL FINAL CALCULADO */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                    Valor Total da Contratação (A Pagar)
                  </span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                    {formatCurrencyBR(totalCalculado)}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 italic">
                    ({valorPorExtenso(totalCalculado)})
                  </span>
                </div>

                <div className="text-right sm:max-w-xs text-xs text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/70 p-2.5 rounded-xl border border-blue-100 dark:border-white/5">
                  <span className="font-bold block text-[11px] text-blue-700 dark:text-blue-300">Resumo da Cláusula 3ª:</span>
                  {novoModoRemuneracao === "fechado" ? (
                    <span>Valor fechado global abrangendo a totalidade dos serviços.</span>
                  ) : (
                    <span>Cachê {formatCurrencyBR(novoCache)} + Diárias {formatCurrencyBR(totalDiariasCalculado)} + Ajuda {formatCurrencyBR(novoAjudaCusto)}</span>
                  )}
                </div>
              </div>
            </div>

            {/* ETAPA 3: BENEFÍCIOS E CONDIÇÕES OPERACIONAIS DA PRODUÇÃO */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 border-b">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
                  <Sliders className="size-4 text-primary" />
                  3. Benefícios e Condições Inclusas pela Produção
                </div>
                <span className="text-[11px] text-slate-400">
                  Selecione os modelos padrão abaixo ou personalize o texto livremente
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Transporte */}
                <div className={`p-4 rounded-2xl border transition-all ${novoBeneficioTransporte ? "bg-white dark:bg-slate-900 border-primary/40 shadow-sm" : "bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-white/5 opacity-60"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={novoBeneficioTransporte}
                        onCheckedChange={(c) => setNovoBeneficioTransporte(Boolean(c))}
                      />
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <Plane className="size-3.5 text-primary" /> Transporte / Passagens Inclusas
                      </span>
                    </label>
                    <Badge variant={novoBeneficioTransporte ? "default" : "outline"} className="text-[10px]">
                      {novoBeneficioTransporte ? "Incluso" : "Não incluso"}
                    </Badge>
                  </div>

                  {novoBeneficioTransporte && (
                    <div className="space-y-2 mt-2">
                      <Select
                        onValueChange={(val) => {
                          setNovoTextoTransporte(val);
                          if (val.includes("Não aplicável")) setNovoBeneficioTransporte(false);
                        }}
                      >
                        <SelectTrigger className="h-8 text-[11px] rounded-lg bg-slate-50 dark:bg-slate-800">
                          <SelectValue placeholder="⚡ Predefinir transporte..." />
                        </SelectTrigger>
                        <SelectContent>
                          {PRESETS_TRANSPORTE.map((opt, i) => (
                            <SelectItem key={i} value={opt.valor} className="text-xs">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Textarea
                        rows={2}
                        value={novoTextoTransporte}
                        onChange={(e) => setNovoTextoTransporte(e.target.value)}
                        className="text-xs rounded-xl resize-none"
                      />
                    </div>
                  )}
                </div>

                {/* Hospedagem */}
                <div className={`p-4 rounded-2xl border transition-all ${novoBeneficioHospedagem ? "bg-white dark:bg-slate-900 border-primary/40 shadow-sm" : "bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-white/5 opacity-60"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={novoBeneficioHospedagem}
                        onCheckedChange={(c) => setNovoBeneficioHospedagem(Boolean(c))}
                      />
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <Hotel className="size-3.5 text-primary" /> Hospedagem Inclusa
                      </span>
                    </label>
                    <Badge variant={novoBeneficioHospedagem ? "default" : "outline"} className="text-[10px]">
                      {novoBeneficioHospedagem ? "Inclusa" : "Não inclusa"}
                    </Badge>
                  </div>

                  {novoBeneficioHospedagem && (
                    <div className="space-y-2 mt-2">
                      <Select
                        onValueChange={(val) => {
                          setNovoTextoHospedagem(val);
                          if (val.includes("Não aplicável")) setNovoBeneficioHospedagem(false);
                        }}
                      >
                        <SelectTrigger className="h-8 text-[11px] rounded-lg bg-slate-50 dark:bg-slate-800">
                          <SelectValue placeholder="⚡ Predefinir hospedagem..." />
                        </SelectTrigger>
                        <SelectContent>
                          {PRESETS_HOSPEDAGEM.map((opt, i) => (
                            <SelectItem key={i} value={opt.valor} className="text-xs">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Textarea
                        rows={2}
                        value={novoTextoHospedagem}
                        onChange={(e) => setNovoTextoHospedagem(e.target.value)}
                        className="text-xs rounded-xl resize-none"
                      />
                    </div>
                  )}
                </div>

                {/* Alimentação */}
                <div className={`p-4 rounded-2xl border transition-all ${novoBeneficioAlimentacao ? "bg-white dark:bg-slate-900 border-primary/40 shadow-sm" : "bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-white/5 opacity-60"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={novoBeneficioAlimentacao}
                        onCheckedChange={(c) => setNovoBeneficioAlimentacao(Boolean(c))}
                      />
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <Utensils className="size-3.5 text-primary" /> Alimentação & Catering
                      </span>
                    </label>
                    <Badge variant={novoBeneficioAlimentacao ? "default" : "outline"} className="text-[10px]">
                      {novoBeneficioAlimentacao ? "Inclusa" : "Não inclusa"}
                    </Badge>
                  </div>

                  {novoBeneficioAlimentacao && (
                    <div className="space-y-2 mt-2">
                      <Select
                        onValueChange={(val) => {
                          setNovoTextoAlimentacao(val);
                          if (val.includes("Não aplicável")) setNovoBeneficioAlimentacao(false);
                        }}
                      >
                        <SelectTrigger className="h-8 text-[11px] rounded-lg bg-slate-50 dark:bg-slate-800">
                          <SelectValue placeholder="⚡ Predefinir alimentação..." />
                        </SelectTrigger>
                        <SelectContent>
                          {PRESETS_ALIMENTACAO.map((opt, i) => (
                            <SelectItem key={i} value={opt.valor} className="text-xs">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Textarea
                        rows={2}
                        value={novoTextoAlimentacao}
                        onChange={(e) => setNovoTextoAlimentacao(e.target.value)}
                        className="text-xs rounded-xl resize-none"
                      />
                    </div>
                  )}
                </div>

                {/* Traslados */}
                <div className={`p-4 rounded-2xl border transition-all ${novoBeneficioTraslado ? "bg-white dark:bg-slate-900 border-primary/40 shadow-sm" : "bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-white/5 opacity-60"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={novoBeneficioTraslado}
                        onCheckedChange={(c) => setNovoBeneficioTraslado(Boolean(c))}
                      />
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <Car className="size-3.5 text-primary" /> Traslados Locais
                      </span>
                    </label>
                    <Badge variant={novoBeneficioTraslado ? "default" : "outline"} className="text-[10px]">
                      {novoBeneficioTraslado ? "Inclusos" : "Não inclusos"}
                    </Badge>
                  </div>

                  {novoBeneficioTraslado && (
                    <div className="space-y-2 mt-2">
                      <Select
                        onValueChange={(val) => {
                          setNovoTextoTraslado(val);
                          if (val.includes("Não aplicável")) setNovoBeneficioTraslado(false);
                        }}
                      >
                        <SelectTrigger className="h-8 text-[11px] rounded-lg bg-slate-50 dark:bg-slate-800">
                          <SelectValue placeholder="⚡ Predefinir traslados..." />
                        </SelectTrigger>
                        <SelectContent>
                          {PRESETS_TRASLADOS.map((opt, i) => (
                            <SelectItem key={i} value={opt.valor} className="text-xs">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Textarea
                        rows={2}
                        value={novoTextoTraslado}
                        onChange={(e) => setNovoTextoTraslado(e.target.value)}
                        className="text-xs rounded-xl resize-none"
                      />
                    </div>
                  )}
                </div>

                {/* Equipamentos & Infraestrutura */}
                <div className={`sm:col-span-2 p-4 rounded-2xl border transition-all ${novoBeneficioEquipamentos ? "bg-white dark:bg-slate-900 border-primary/40 shadow-sm" : "bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-white/5 opacity-75"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={novoBeneficioEquipamentos}
                        onCheckedChange={(c) => setNovoBeneficioEquipamentos(Boolean(c))}
                      />
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <Layers className="size-3.5 text-primary" /> Equipamentos, Instrumentos e Materiais
                      </span>
                    </label>
                    <Badge variant={novoBeneficioEquipamentos ? "default" : "outline"} className="text-[10px]">
                      {novoBeneficioEquipamentos ? "Definido" : "Padrão"}
                    </Badge>
                  </div>

                  {novoBeneficioEquipamentos && (
                    <div className="space-y-2 mt-2">
                      <Select
                        onValueChange={(val) => setNovoTextoEquipamentos(val)}
                      >
                        <SelectTrigger className="h-8 text-[11px] rounded-lg bg-slate-50 dark:bg-slate-800">
                          <SelectValue placeholder="⚡ Predefinir responsabilidade sobre equipamentos..." />
                        </SelectTrigger>
                        <SelectContent>
                          {PRESETS_EQUIPAMENTOS.map((opt, i) => (
                            <SelectItem key={i} value={opt.valor} className="text-xs">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Textarea
                        rows={2}
                        value={novoTextoEquipamentos}
                        onChange={(e) => setNovoTextoEquipamentos(e.target.value)}
                        className="text-xs rounded-xl resize-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ETAPA 4: CONDIÇÕES DE PAGAMENTO */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 pb-1 border-b text-sm font-bold text-slate-800 dark:text-white">
                <CreditCard className="size-4 text-primary" />
                4. Prazo e Condições de Pagamento
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Prazos e Regras de Liquidação *</Label>
                <Input
                  value={novoCondicoesPagamento}
                  onChange={(e) => setNovoCondicoesPagamento(e.target.value)}
                  placeholder="Ex: Transferência bancária ou PIX em até 5 dias úteis após a apresentação"
                  className="mt-1 h-11 rounded-xl"
                />
              </div>
            </div>

            {/* ETAPA 5: PRÉ-VISUALIZAÇÃO / AJUSTE FINO */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between pb-1 border-b">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
                  <FileText className="size-4 text-primary" />
                  5. Minuta Jurídica e Pré-visualização
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewAberto(!previewAberto)}
                  className="h-8 text-xs gap-1.5 rounded-lg"
                >
                  {previewAberto ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  {previewAberto ? "Ocultar Texto da Minuta" : "Ver / Editar Minuta Completa"}
                </Button>
              </div>

              {previewAberto && (
                <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5">
                  <p className="text-xs text-slate-500">
                    Você pode ler a minuta com as variáveis já preenchidas ou realizar pequenos ajustes no texto antes de emitir:
                  </p>
                  <Textarea
                    rows={12}
                    value={novoTextoContratoPersonalizado || gerarTextoPrevia()}
                    onChange={(e) => setNovoTextoContratoPersonalizado(e.target.value)}
                    className="font-mono text-xs rounded-xl bg-white dark:bg-slate-950"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-4 border-t bg-slate-50/80 dark:bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              {novoUserId ? `Emitindo para ${(todosUsuarios.find(u => u.id === novoUserId)?.nome) || "contratado"}` : "Selecione o profissional acima"}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNovoContratoModalOpen(false)}
                className="w-full sm:w-auto text-xs"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEmitirContratoIndividual}
                disabled={emitindoContrato || !novoUserId || !novoEventoId || totalCalculado <= 0}
                className="w-full sm:w-auto gap-2 bg-primary font-bold text-xs rounded-xl shadow-md px-6 py-2"
              >
                {emitindoContrato ? (
                  <>Emitindo...</>
                ) : (
                  <>
                    <Send className="size-4" />
                    Emitir e Enviar para Assinatura ({formatCurrencyBR(totalCalculado)})
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE EDIÇÃO DE TEMPLATE COM PAINEL LATERAL DE TAGS DINÂMICAS */}
      <Dialog open={templateModalOpen} onOpenChange={setTemplateModalOpen}>
        <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col p-6 overflow-hidden">
          <DialogHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <FileSignature className="size-5 text-primary" />
                  {editTemplate?.id ? "Editar Modelo de Contrato" : "Novo Modelo de Contrato"}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Escreva ou cole seu contrato. Clique nas <strong>tags dinâmicas</strong> no painel à direita para inseri-las automaticamente no ponto do texto onde você estiver digitando.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 py-3 flex-1 overflow-hidden">
            {/* COLUNA ESQUERDA: CAMPOS E TEXTO DO CONTRATO (7 COLUNAS) */}
            <div className="lg:col-span-7 flex flex-col gap-3 overflow-y-auto pr-1">
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Título do Modelo *</Label>
                <Input
                  value={editTemplate?.titulo || ""}
                  onChange={(e) => setEditTemplate((prev) => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Ex: Contrato de Prestação de Serviços Artísticos"
                  className="mt-1 h-10 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tipo de Contrato</Label>
                  <Select
                    value={editTemplate?.tipo || "artistico"}
                    onValueChange={(val) => setEditTemplate((prev) => ({ ...prev, tipo: val }))}
                  >
                    <SelectTrigger className="mt-1 h-10 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="artistico">Artístico (Elenco / Músicos)</SelectItem>
                      <SelectItem value="tecnico">Técnico & Operacional</SelectItem>
                      <SelectItem value="producao">Produção & Backstage</SelectItem>
                      <SelectItem value="anexo">Anexo I (Roteiro e Logística)</SelectItem>
                      <SelectItem value="aditivo">Termo Aditivo</SelectItem>
                      <SelectItem value="outro">Outro / Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Descrição Breve</Label>
                  <Input
                    value={editTemplate?.descricao || ""}
                    onChange={(e) => setEditTemplate((prev) => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Ex: Para atores e cantores da turnê"
                    className="mt-1 h-10 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-[300px]">
                <div className="flex items-center justify-between pb-1">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Cláusulas e Conteúdo Integral do Contrato *
                  </Label>
                  <span className="text-[11px] text-slate-400">
                    Posicione o cursor onde deseja inserir uma tag
                  </span>
                </div>
                <Textarea
                  ref={templateTextareaRef}
                  value={editTemplate?.conteudo_markdown || editTemplate?.conteudo_padrao || ""}
                  onChange={(e) => setEditTemplate((prev) => ({ ...prev, conteudo_padrao: e.target.value, conteudo_markdown: e.target.value }))}
                  placeholder="Cole aqui o texto do seu contrato. Exemplo: Eu, {{CONTRATANTE_NOME}}, contrato {{PROFISSIONAL_NOME}} para a função de {{FUNCAO}}..."
                  className="flex-1 font-mono text-xs rounded-xl resize-none p-3.5 leading-relaxed bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800"
                />
              </div>
            </div>

            {/* COLUNA DIREITA: PAINEL DE TAGS DINÂMICAS CLICÁVEIS (5 COLUNAS) */}
            <div className="lg:col-span-5 flex flex-col overflow-hidden bg-slate-50/70 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/10 p-3.5">
              <div className="pb-2.5 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                    <Tag className="size-3.5 text-primary" />
                    Tags Dinâmicas (Clique para Inserir)
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono bg-primary/10 text-primary border-primary/20">
                    1-Clique
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Clique sobre qualquer item abaixo e o código correto da tag será colocado exatamente onde seu cursor estiver digitando:
                </p>

                {/* Campo de Busca Rápida de Tags */}
                <div className="relative mt-2">
                  <Search className="size-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <Input
                    value={buscaTagTemplate}
                    onChange={(e) => setBuscaTagTemplate(e.target.value)}
                    placeholder="Filtrar tag (ex: CPF, Cachê, Cidade)..."
                    className="h-8 pl-8 text-xs rounded-lg bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                  />
                  {buscaTagTemplate && (
                    <button
                      type="button"
                      onClick={() => setBuscaTagTemplate("")}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

                {/* Filtro por Categoria */}
                <div className="flex items-center gap-1 mt-2 overflow-x-auto pb-1 text-[11px] no-scrollbar">
                  {["Todas", "Contratante", "Profissional", "Roteiro", "Valores", "Logística"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setTagCategoriaAtiva(cat)}
                      className={`px-2 py-0.5 rounded-md font-semibold transition-all shrink-0 ${
                        tagCategoriaAtiva === cat
                          ? "bg-primary text-white"
                          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista Scrollável de Tags Disponíveis */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pt-3 pr-1">
                {TAGS_DISPONIVEIS_CONTRATO
                  .filter((cat) => {
                    if (tagCategoriaAtiva === "Todas") return true;
                    return cat.categoria.toLowerCase().includes(tagCategoriaAtiva.toLowerCase());
                  })
                  .map((catGroup, idx) => {
                    const tagsFiltradas = catGroup.tags.filter((t) => {
                      if (!buscaTagTemplate) return true;
                      const q = buscaTagTemplate.toLowerCase();
                      return (
                        t.label.toLowerCase().includes(q) ||
                        t.tag.toLowerCase().includes(q) ||
                        t.desc.toLowerCase().includes(q)
                      );
                    });

                    if (tagsFiltradas.length === 0) return null;

                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                          {catGroup.categoria}
                        </div>
                        <div className="grid grid-cols-1 gap-1.5">
                          {tagsFiltradas.map((item, tIdx) => (
                            <button
                              key={tIdx}
                              type="button"
                              onClick={() => handleInserirTagNoTemplate(item.tag)}
                              className="group w-full text-left p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/5 hover:border-primary/50 dark:hover:border-primary/50 hover:bg-primary/[0.03] dark:hover:bg-primary/[0.05] transition-all flex items-start justify-between gap-2 shadow-xs"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">
                                    {item.label}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                  {item.desc}
                                </p>
                              </div>
                              <code className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-primary group-hover:text-white px-1.5 py-0.5 rounded transition-all shrink-0">
                                {item.tag}
                              </code>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t flex items-center justify-between gap-2">
            <div>
              {editTemplate?.id && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    handleDeleteTemplate(editTemplate);
                    setTemplateModalOpen(false);
                  }}
                  className="gap-1.5 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <Trash2 className="size-4" /> Excluir Modelo
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setTemplateModalOpen(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSaveTemplate} className="gap-2 bg-primary font-bold shadow-md">
                <Save className="size-4" /> Salvar Modelo
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE DOCUMENTO AVULSO (ALVARÁ / NOTA) */}
      <Dialog open={docModalOpen} onOpenChange={setDocModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Anexar Documento da Praça</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Faça upload de alvarás de bombeiros, ECAD, notas fiscais ou termos avulsos.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveDocAvulso} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-bold">Título do Documento:</Label>
              <Input
                value={docFormData.titulo || ""}
                onChange={(e) => setDocFormData((p) => ({ ...p, titulo: e.target.value }))}
                placeholder="Ex: Alvará de Funcionamento - Teatro Municipal SP"
                className="mt-1 h-10 rounded-xl"
              />
            </div>

            <div>
              <Label className="text-xs font-bold">Categoria:</Label>
              <Select
                value={docFormData.categoria || "Alvarás e Liberações"}
                onValueChange={(val) => setDocFormData((p) => ({ ...p, categoria: val }))}
              >
                <SelectTrigger className="mt-1 h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoriasAvulsas.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-bold">Arquivo (PDF ou Imagem):</Label>
              <Input
                type="file"
                ref={fileInputRef}
                accept=".pdf,.png,.jpg,.jpeg"
                className="mt-1 h-10 rounded-xl file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary"
              />
            </div>

            <div>
              <Label className="text-xs font-bold">Observações Adicionais:</Label>
              <Input
                value={docFormData.observacoes || ""}
                onChange={(e) => setDocFormData((p) => ({ ...p, observacoes: e.target.value }))}
                placeholder="Ex: Válido até 31/12/2026..."
                className="mt-1 h-10 rounded-xl"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setDocModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={docUploading} className="gap-2 bg-primary">
                {docUploading ? "Enviando..." : "Salvar Documento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL DE IDENTIDADE DA PRODUTORA / CONTRATANTE */}
      <Dialog open={produtoraModalOpen} onOpenChange={setProdutoraModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Building2 className="size-5 text-primary" /> Identidade da Empresa / Produtora Contratante
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Personalize o cabeçalho oficial que constará em todos os PDFs e minutas contratuais gerados pelo Áxis.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Razão Social (Nome Oficial):</Label>
                <Input
                  value={infoProdutora.nome || ""}
                  onChange={(e) => setInfoProdutora((prev: any) => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: WILLIAM SEVEN PRODUÇÕES ARTÍSTICAS LTDA"
                  className="mt-1 h-10 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Nome Fantasia (Marca Oficial):</Label>
                <Input
                  value={infoProdutora.nomeFantasia || ""}
                  onChange={(e) => setInfoProdutora((prev: any) => ({ ...prev, nomeFantasia: e.target.value }))}
                  placeholder="Ex: WILLIAM SEVEN PRODUÇÕES"
                  className="mt-1 h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-bold">CNPJ ou CPF:</Label>
                <Input
                  value={infoProdutora.cnpj || ""}
                  onChange={(e) => setInfoProdutora((prev: any) => ({ ...prev, cnpj: e.target.value }))}
                  placeholder="00.000.000/0001-00"
                  className="mt-1 h-10 rounded-xl"
                />
              </div>

              <div>
                <Label className="text-xs font-bold">Estado (UF da Sede):</Label>
                <Select
                  value={produtoraUf}
                  onValueChange={(uf) => {
                    setProdutoraUf(uf);
                    setProdutoraCidadeNome(""); // Reseta a cidade para nova escolha
                  }}
                >
                  <SelectTrigger className="mt-1 h-10 rounded-xl">
                    <SelectValue placeholder="Selecione o Estado" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {ibgeEstados.map((est) => (
                      <SelectItem key={est.id} value={est.sigla}>
                        {est.nome} ({est.sigla})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-bold">Município / Cidade:</Label>
                {ibgeCidades.length > 0 ? (
                  <Select
                    value={produtoraCidadeNome}
                    onValueChange={(cid) => setProdutoraCidadeNome(cid)}
                  >
                    <SelectTrigger className="mt-1 h-10 rounded-xl">
                      <SelectValue placeholder={carregandoCidades ? "Carregando..." : "Selecione a Cidade"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {ibgeCidades.map((c) => (
                        <SelectItem key={c.id} value={c.nome}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={produtoraCidadeNome}
                    onChange={(e) => setProdutoraCidadeNome(e.target.value)}
                    placeholder="Ex: São Carlos"
                    className="mt-1 h-10 rounded-xl"
                  />
                )}
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold">Endereço Completo / Sede:</Label>
              <Input
                value={infoProdutora.endereco || ""}
                onChange={(e) => setInfoProdutora((prev: any) => ({ ...prev, endereco: e.target.value }))}
                placeholder="Ex: Av. Trabalhador São-Carlense, 400, Centro"
                className="mt-1 h-10 rounded-xl"
              />
            </div>

            <div>
              <Label className="text-xs font-bold">Logotipo da Produtora / Empresa:</Label>
              <div className="flex items-center gap-2 mt-1">
                {infoProdutora.logoUrl ? (
                  <div className="h-12 w-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden p-1.5 shadow-sm">
                    <img src={infoProdutora.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                  </div>
                ) : (
                  <div className="h-12 w-16 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 text-[10px] font-bold">
                    Sem logo
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLogoPickerOpen(true)}
                  className="rounded-xl h-10 gap-2 text-xs font-bold border-slate-300 dark:border-slate-700"
                >
                  <Search className="size-4 text-primary" />
                  Escolher dos Logos já Cadastrados
                </Button>

                {infoProdutora.logoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setInfoProdutora((prev: any) => ({ ...prev, logoUrl: null }))}
                    className="h-10 px-2.5 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl"
                  >
                    Remover
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Escolha qualquer imagem de logotipo enviada anteriormente no sistema (espetáculos, tours, eventos) ou faça upload de uma nova pelo seletor.
              </p>
            </div>

            <div className="pt-2 border-t">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Checkbox
                  checked={infoProdutora.ocultarMarcaAxis || false}
                  onCheckedChange={(c) => setInfoProdutora((prev: any) => ({ ...prev, ocultarMarcaAxis: Boolean(c) }))}
                />
                <span>Ocultar assinatura "Documento gerado pelo Áxis" no rodapé do PDF (White-label)</span>
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setProdutoraModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={() => salvarInfoProdutora(infoProdutora)}
              className="gap-2 bg-primary font-bold text-xs"
            >
              <Save className="size-4" /> Salvar Identidade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SELETOR DE LOGOS DO SISTEMA */}
      <LogoPicker
        open={logoPickerOpen}
        onOpenChange={setLogoPickerOpen}
        onSelect={(url) => {
          setInfoProdutora((prev: any) => ({ ...prev, logoUrl: url }));
          setLogoPickerOpen(false);
          toast.success("Logotipo selecionado!");
        }}
      />

      {/* MODAL DE EMISSÃO DE TERMO ADITIVO */}
      <Dialog open={aditivoModalOpen} onOpenChange={setAditivoModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b bg-slate-50/80 dark:bg-slate-900/80">
            <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
              <FileSignature className="size-4" /> Aditivo Contratual
            </div>
            <DialogTitle className="text-xl font-black text-slate-800 dark:text-white">
              Emissão de Termo Aditivo Contratual
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {contratoParaAditivo && (
                <>Vinculado ao contrato original <strong>{contratoParaAditivo.codigo_autenticacao}</strong> • Contratado(a): <strong>{contratoParaAditivo.usuario?.nome}</strong> ({contratoParaAditivo.funcao})</>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-xl text-xs text-blue-800 dark:text-blue-300">
              O Termo Aditivo preserva a validade jurídica e o hash do contrato original, gerando uma nova via aditiva vinculada para acréscimo de praças, datas ou remuneração complementar.
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Objeto e Motivo do Aditivo *</Label>
              <Textarea
                rows={2}
                value={aditivoDescricao}
                onChange={(e) => setAditivoDescricao(e.target.value)}
                placeholder="Ex: Acréscimo de apresentações da turnê no Rio de Janeiro e complementação de remuneração..."
                className="mt-1 text-xs rounded-xl resize-none"
              />
            </div>

            {/* Novas Praças da Turnê */}
            <div>
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Selecione as Novas Praças/Apresentações a Acrescentar:
              </Label>
              <div className="mt-1.5 max-h-48 overflow-y-auto border border-slate-200 dark:border-white/10 rounded-xl divide-y bg-slate-50/50 dark:bg-slate-900/50">
                {eventos.map((ev) => {
                  const isChecked = aditivoNovosEventoIds.includes(ev.id);
                  return (
                    <label
                      key={ev.id}
                      className="p-3 flex items-center justify-between hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setAditivoNovosEventoIds((prev) => [...prev, ev.id]);
                            } else {
                              setAditivoNovosEventoIds((prev) => prev.filter((id) => id !== ev.id));
                            }
                          }}
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-white">
                            {ev.cidade} • {ev.espetaculo}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {ev.local || "Teatro"} {ev.horario ? `• ${ev.horario}` : ""}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {ev.data ? format(new Date(ev.data + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR }) : "A definir"}
                      </Badge>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Remuneração Adicional e Total Consolidado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border">
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Valor Adicional da Complementação (R$):</Label>
                <CurrencyInput
                  value={aditivoValorStr}
                  onChange={setAditivoValorStr}
                  placeholder="0,00"
                  className="mt-1 h-10 rounded-xl font-bold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-400">Total Consolidado com o Aditivo:</Label>
                <div className="mt-1 h-10 px-3 flex items-center justify-between rounded-xl bg-slate-100 dark:bg-slate-800 border font-mono">
                  <span className="text-xs text-slate-500">Anterior: {formatCurrencyBR(Number((contratoParaAditivo as any)?.valor_total || contratoParaAditivo?.valor_cache || 0))}</span>
                  <span className="text-sm font-black text-slate-800 dark:text-white">
                    Novo: {formatCurrencyBR(Number((contratoParaAditivo as any)?.valor_total || contratoParaAditivo?.valor_cache || 0) + parseCurrency(aditivoValorStr))}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Condições Logísticas e Operacionais do Aditivo:</Label>
              <Textarea
                rows={2}
                value={aditivoTextoLogistica}
                onChange={(e) => setAditivoTextoLogistica(e.target.value)}
                placeholder="Ex: Mantidas as mesmas condições de transporte, hospedagem e alimentação..."
                className="mt-1 text-xs rounded-xl resize-none"
              />
            </div>
          </div>

          <DialogFooter className="p-4 border-t bg-slate-50 dark:bg-slate-900 flex justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={() => setAditivoModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleEmitirAditivo}
              disabled={gerandoAditivo}
              className="gap-2 bg-primary font-bold text-xs px-5 shadow-sm"
            >
              {gerandoAditivo ? "Emitindo..." : <><Send className="size-4" /> Emitir Termo Aditivo</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
