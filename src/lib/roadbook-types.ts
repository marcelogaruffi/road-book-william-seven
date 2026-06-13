export type ProgItem = {
  data: string;
  hora_inicio: string;
  hora_fim?: string;
  // legacy fallback
  hora?: string;
  titulo?: string;
  atividade?: string;
  tipo?: ProgTipo;
  local: string;
  observacao: string;
};

export const PROG_TIPOS = [
  "Viagem",
  "Oficina",
  "Espetáculo",
  "Montagem",
  "Desmontagem",
  "Entrevista",
  "Alimentação",
  "Livre",
  "Outro",
] as const;
export type ProgTipo = (typeof PROG_TIPOS)[number];

export const TIPO_COLORS: Record<string, string> = {
  Viagem: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  Oficina: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
  Espetáculo: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  Montagem: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  Desmontagem: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
  Entrevista: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
  Alimentação: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  Livre: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
  Outro: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/30",
};

export type Quarto = { pessoa: string; numero: string };
export type OutroContato = { nome: string; funcao: string; whatsapp: string; telefone?: string };
export type FestivalInfo = {
  site?: string;
  instagram?: string;
  redes?: string;
  programacao_oficial?: string;
  observacoes?: string;
};
export type Documento = { nome: string; path: string; tipo: string; url?: string };

export const FOTO_CATEGORIAS = [
  "Fachada",
  "Palco",
  "Plateia",
  "Camarim",
  "Acesso de carga",
  "Bilheteria",
  "Entrada do público",
  "Área técnica",
  "Outros",
] as const;
export type FotoCategoria = (typeof FOTO_CATEGORIAS)[number];

export type Foto = {
  path: string;
  nome: string;
  categoria: FotoCategoria;
  descricao?: string; // usado quando categoria === "Outros"
  url?: string;
};

export type RoadbookData = {
  id?: string;
  slug?: string;
  tour_id?: string | null;
  espetaculo: string;
  cidade: string;
  estado: string;
  festival: string;
  data_inicial: string;
  data_final: string;
  resumo_executivo: string;
  hotel_nome: string;
  hotel_endereco: string;
  hotel_telefone: string;
  hotel_site: string;
  hotel_checkin: string;
  hotel_checkout: string;
  teatro_nome: string;
  teatro_endereco: string;
  teatro_telefone: string;
  teatro_site: string;
  teatro_observacoes: string;
  producao_nome: string;
  producao_telefone: string;
  producao_whatsapp: string;
  receptivo_nome: string;
  receptivo_telefone: string;
  receptivo_whatsapp: string;
  programacao: ProgItem[];
  quartos: Quarto[];
  outros_contatos: OutroContato[];
  festival_info: FestivalInfo;
  documentos: Documento[];
  teatro_fotos: Foto[];
};

export const emptyRoadbook: RoadbookData = {
  tour_id: null,
  espetaculo: "", cidade: "", estado: "", festival: "",
  data_inicial: "", data_final: "",
  resumo_executivo: "",
  hotel_nome: "", hotel_endereco: "", hotel_telefone: "", hotel_site: "",
  hotel_checkin: "", hotel_checkout: "",
  teatro_nome: "", teatro_endereco: "", teatro_telefone: "", teatro_site: "",
  teatro_observacoes: "",
  producao_nome: "", producao_telefone: "", producao_whatsapp: "",
  receptivo_nome: "", receptivo_telefone: "", receptivo_whatsapp: "",
  programacao: [],
  quartos: [],
  outros_contatos: [],
  festival_info: {},
  documentos: [],
  teatro_fotos: [],
};

export function rowToRoadbook(row: any): RoadbookData {
  return {
    ...emptyRoadbook,
    id: row.id,
    slug: row.slug,
    tour_id: row.tour_id ?? null,
    espetaculo: row.espetaculo ?? "",
    cidade: row.cidade ?? "",
    estado: row.estado ?? "",
    festival: row.festival ?? "",
    data_inicial: row.data_inicial ?? "",
    data_final: row.data_final ?? "",
    resumo_executivo: row.resumo_executivo ?? "",
    hotel_nome: row.hotel_nome ?? "",
    hotel_endereco: row.hotel_endereco ?? "",
    hotel_telefone: row.hotel_telefone ?? "",
    hotel_site: row.hotel_site ?? "",
    hotel_checkin: row.hotel_checkin ?? "",
    hotel_checkout: row.hotel_checkout ?? "",
    teatro_nome: row.teatro_nome ?? "",
    teatro_endereco: row.teatro_endereco ?? "",
    teatro_telefone: row.teatro_telefone ?? "",
    teatro_site: row.teatro_site ?? "",
    teatro_observacoes: row.teatro_observacoes ?? "",
    producao_nome: row.producao_nome ?? "",
    producao_telefone: row.producao_telefone ?? "",
    producao_whatsapp: row.producao_whatsapp ?? "",
    receptivo_nome: row.receptivo_nome ?? "",
    receptivo_telefone: row.receptivo_telefone ?? "",
    receptivo_whatsapp: row.receptivo_whatsapp ?? "",
    programacao: (Array.isArray(row.programacao) ? row.programacao : []) as ProgItem[],
    quartos: (Array.isArray(row.quartos) ? row.quartos : []) as Quarto[],
    outros_contatos: (Array.isArray(row.outros_contatos) ? row.outros_contatos : []) as OutroContato[],
    festival_info: (row.festival_info && typeof row.festival_info === "object" ? row.festival_info : {}) as FestivalInfo,
    documentos: (Array.isArray(row.documentos) ? row.documentos : []) as Documento[],
    teatro_fotos: (Array.isArray(row.teatro_fotos) ? row.teatro_fotos : []) as Foto[],
  };
}

export function roadbookToPayload(d: RoadbookData, userId: string) {
  return {
    user_id: userId,
    tour_id: d.tour_id || null,
    espetaculo: d.espetaculo,
    cidade: d.cidade,
    estado: d.estado || null,
    festival: d.festival || null,
    data_inicial: d.data_inicial || null,
    data_final: d.data_final || null,
    resumo_executivo: d.resumo_executivo || null,
    hotel_nome: d.hotel_nome || null,
    hotel_endereco: d.hotel_endereco || null,
    hotel_telefone: d.hotel_telefone || null,
    hotel_site: d.hotel_site || null,
    hotel_checkin: d.hotel_checkin || null,
    hotel_checkout: d.hotel_checkout || null,
    teatro_nome: d.teatro_nome || null,
    teatro_endereco: d.teatro_endereco || null,
    teatro_telefone: d.teatro_telefone || null,
    teatro_site: d.teatro_site || null,
    teatro_observacoes: d.teatro_observacoes || null,
    producao_nome: d.producao_nome || null,
    producao_telefone: d.producao_telefone || null,
    producao_whatsapp: d.producao_whatsapp || null,
    receptivo_nome: d.receptivo_nome || null,
    receptivo_telefone: d.receptivo_telefone || null,
    receptivo_whatsapp: d.receptivo_whatsapp || null,
    programacao: d.programacao as any,
    quartos: d.quartos as any,
    outros_contatos: d.outros_contatos as any,
    festival_info: d.festival_info as any,
    documentos: d.documentos as any,
    teatro_fotos: d.teatro_fotos as any,
  };
}

export function progTitle(p: ProgItem): string {
  return p.titulo || p.atividade || "—";
}
export function progHora(p: ProgItem): string {
  const ini = p.hora_inicio || p.hora || "";
  if (p.hora_fim) return `${ini}–${p.hora_fim}`;
  return ini || "—";
}
