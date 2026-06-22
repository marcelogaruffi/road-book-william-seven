export type ProgItem = {
  data: string;
  hora_inicio: string;
  hora_fim?: string;
  hora?: string; // legacy
  titulo?: string;
  atividade?: string; // legacy
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
  fotos?: Foto[];
};
export type Documento = { nome: string; path: string; tipo: string; url?: string };

// Categories shared (theatre) — keep export name for backwards compat
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
export type FotoCategoria = string;

export const TEATRO_FOTO_CATEGORIAS = FOTO_CATEGORIAS;

export const HOTEL_FOTO_CATEGORIAS = [
  "Fachada",
  "Recepção",
  "Café da manhã",
  "Quarto",
  "Banheiro",
  "Hall / Lobby",
  "Área de lazer",
  "Academia",
  "Piscina",
  "Restaurante",
  "Comodidades",
  "Estacionamento",
  "Outros",
] as const;

export type Foto = {
  path: string;
  nome: string;
  categoria: string;
  descricao?: string;
  url?: string;
};

export type Passageiro = { nome: string; assento?: string; bagagens?: string };
export type CartaoEmbarque = { path: string; nome: string; tipo: string; url?: string };
export type Voo = {
  aeroporto_origem?: string;
  aeroporto_destino?: string;
  numero?: string;
  localizador?: string;
  data?: string;
  hora?: string;
  portao?: string;
  terminal?: string;
  passageiros?: Passageiro[];
  cartoes_embarque?: CartaoEmbarque[];
};
export const emptyVoo: Voo = { passageiros: [], cartoes_embarque: [] };

export type Automacoes = {
  timeline_overrides?: Record<string, string>;
  outros_locais?: { nome: string; endereco: string }[];
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
  hotel_checkin_hora: string;
  hotel_checkout_hora: string;
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
  hotel_fotos: Foto[];
  voo_ida: Voo;
  voo_volta: Voo;
  automacoes: Automacoes;
};

export const emptyRoadbook: RoadbookData = {
  tour_id: null,
  espetaculo: "", cidade: "", estado: "", festival: "",
  data_inicial: "", data_final: "",
  resumo_executivo: "",
  hotel_nome: "", hotel_endereco: "", hotel_telefone: "", hotel_site: "",
  hotel_checkin: "", hotel_checkout: "",
  hotel_checkin_hora: "", hotel_checkout_hora: "",
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
  hotel_fotos: [],
  voo_ida: { ...emptyVoo },
  voo_volta: { ...emptyVoo },
  automacoes: {},
};

export function rowToRoadbook(row: any): RoadbookData {
  const voo = (v: any): Voo => ({
    ...emptyVoo,
    ...(v && typeof v === "object" ? v : {}),
    passageiros: Array.isArray(v?.passageiros) ? v.passageiros : [],
    cartoes_embarque: Array.isArray(v?.cartoes_embarque) ? v.cartoes_embarque : [],
  });
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
    hotel_checkin_hora: row.hotel_checkin_hora ?? "",
    hotel_checkout_hora: row.hotel_checkout_hora ?? "",
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
    hotel_fotos: (Array.isArray(row.hotel_fotos) ? row.hotel_fotos : []) as Foto[],
    voo_ida: voo(row.voo_ida),
    voo_volta: voo(row.voo_volta),
    automacoes: (row.automacoes && typeof row.automacoes === "object" ? row.automacoes : {}) as Automacoes,
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
    hotel_checkin_hora: d.hotel_checkin_hora || null,
    hotel_checkout_hora: d.hotel_checkout_hora || null,
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
    hotel_fotos: d.hotel_fotos as any,
    voo_ida: d.voo_ida as any,
    voo_volta: d.voo_volta as any,
    automacoes: d.automacoes as any,
  };
}

export function normalizeExternalUrl(u: string | null | undefined): string {
  if (!u) return "";
  const s = u.trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (/^\/\//.test(s)) return "https:" + s;
  return "https://" + s.replace(/^\/+/, "");
}

export function mapsUrl(address: string | null | undefined): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((address ?? "").trim())}`;
}

export function progTitle(p: ProgItem): string {
  return p.titulo || p.atividade || "—";
}
export function progHora(p: ProgItem): string {
  const ini = p.hora_inicio || p.hora || "";
  if (p.hora_fim) return `${ini}–${p.hora_fim}`;
  return ini || "—";
}

export function getDaySummary(items: ProgItem[]): string {
  if (!items || items.length === 0) return "Livre";
  
  const types = items.map(i => i.tipo);
  if (types.includes("Espetáculo")) return "Espetáculo";
  if (types.includes("Oficina")) return "Oficina";
  if (types.includes("Montagem")) return "Montagem";
  if (types.includes("Viagem")) return "Viagem";
  if (types.includes("Entrevista")) return "Entrevista";
  if (types.includes("Desmontagem")) return "Desmontagem";
  
  const titles = items.map(p => p.titulo || p.atividade || "").filter(Boolean);
  if (titles.length > 0) {
    return titles.slice(0, 2).join(" / ");
  }
  
  return "Programação";
}

