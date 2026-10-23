import { ProductTour } from "@/components/ProductTour";
import { HelpCircle } from "lucide-react";
// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Route as AuthedRoute } from "./route";
import { Card } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ROLE_BADGE_MAP } from "./cadastros";
import { 
  Plus, ExternalLink, Pencil, Trash2, Copy, Calendar, MapPin, 
  MoreVertical, BookOpen, MapPinned, Bus, ChevronRight, AlertCircle, Wrench, Settings2, ShieldAlert,
  ClipboardList, Route as RouteIcon, Banknote, Contact2, Music, Shirt, Volume2, Lightbulb, Projector, FileText, Drama, LayoutTemplate, DoorOpen, Video, Mic2, Sun, Sparkles,
  Wallet, CheckSquare, Settings, Play, Coffee, Luggage, Image as ImageIcon, Smartphone, Newspaper, Printer, ShoppingCart, UserPlus, SlidersHorizontal, Check
} from "lucide-react";
import { toast } from "sonner";
import { DuplicateRoadbookDialog } from "@/components/DuplicateRoadbookDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { StageIcon, ClothesRackIcon, StarDoorIcon } from "@/components/CustomIcons";

type Roadbook = {
  id: string;
  slug: string;
  espetaculo: string;
  cidade: string;
  estado: string | null;
  festival: string | null;
  data_inicial: string | null;
  data_final: string | null;
  tour_id: string | null;
  programacao?: any[];
};

type Tour = { id: string; slug: string; nome: string; espetaculo: string | null };

interface ShortcutItem {
  id: string;
  title: string;
  to: string;
  icon: any;
  colorClass: string;
  roles?: string[];
}

const ALL_SHORTCUTS: ShortcutItem[] = [
  { id: 'minhas-escalas', title: 'Minhas Escalas', to: '/minhas-escalas', icon: ClipboardList, colorClass: 'bg-primary/10 text-primary' },
  { id: 'meus-contratos', title: 'Meus Contratos', to: '/meus-contratos', icon: FileText, colorClass: 'bg-indigo-600/10 text-indigo-600' },
  { id: 'viagens', title: 'Minhas Viagens', to: '/viagens', icon: Bus, colorClass: 'bg-emerald-500/10 text-emerald-600' },
  { id: 'meus-pagamentos', title: 'Meus Pagamentos', to: '/meus-pagamentos', icon: Wallet, colorClass: 'bg-green-500/10 text-green-600' },
  { id: 'eventos', title: 'Eventos e Apresentações', to: '/eventos', icon: Calendar, colorClass: 'bg-sky-500/10 text-sky-600', roles: ['dev', 'produtor', 'assistente_producao', 'tour_manager'] },
  { id: 'escalas', title: 'Gestão de Escalas', to: '/escalas', icon: CheckSquare, colorClass: 'bg-indigo-500/10 text-indigo-600', roles: ['dev', 'produtor'] },
  { id: 'contratos', title: 'Gestão de Contratos', to: '/contratos', icon: FileText, colorClass: 'bg-teal-600/10 text-teal-600', roles: ['dev', 'produtor'] },
  { id: 'financeiro', title: 'Financeiro', to: '/financeiro', icon: Banknote, colorClass: 'bg-emerald-500/10 text-emerald-600', roles: ['dev', 'produtor'] },
  { id: 'som', title: 'Design de Som', to: '/som', icon: Mic2, colorClass: 'bg-blue-500/10 text-blue-600', roles: ['dev', 'produtor', 'tecnico_som', 'stage_manager'] },
  { id: 'som-operacao', title: 'Operação de Som', to: '/som-operacao', icon: Volume2, colorClass: 'bg-cyan-500/10 text-cyan-600', roles: ['dev', 'produtor', 'tecnico_som', 'stage_manager'] },
  { id: 'iluminacao', title: 'Iluminação', to: '/iluminacao', icon: Lightbulb, colorClass: 'bg-amber-500/10 text-amber-600', roles: ['dev', 'produtor', 'iluminador', 'stage_manager'] },
  { id: 'video', title: 'Vídeo e Mídia', to: '/video', icon: Video, colorClass: 'bg-purple-500/10 text-purple-600', roles: ['dev', 'produtor', 'tecnico_video', 'stage_manager'] },
  { id: 'palco', title: 'Montagem de Palco', to: '/palco', icon: StageIcon, colorClass: 'bg-slate-500/10 text-slate-600', roles: ['dev', 'produtor', 'assistente_producao', 'musico', 'tecnico_som', 'iluminador', 'tecnico_video', 'cenotecnico', 'roadie', 'contra_regra', 'stage_manager', 'rigger'] },
  { id: 'partituras', title: 'Partituras', to: '/partituras', icon: Music, colorClass: 'bg-fuchsia-500/10 text-fuchsia-600', roles: ['dev', 'produtor', 'musico', 'stage_manager'] },
  { id: 'musicas', title: 'Músicas e Áudios', to: '/musicas', icon: Play, colorClass: 'bg-violet-500/10 text-violet-600', roles: ['dev', 'produtor', 'musico', 'stage_manager'] },
  { id: 'figurinos', title: 'Figurinos', to: '/figurinos', icon: ClothesRackIcon, colorClass: 'bg-pink-500/10 text-pink-600', roles: ['dev', 'produtor', 'assistente_producao', 'contra_regra', 'stage_manager', 'camareiro'] },
  { id: 'meus-figurinos', title: 'Meus Figurinos', to: '/meus-figurinos', icon: ClothesRackIcon, colorClass: 'bg-rose-500/10 text-rose-600', roles: ['dev', 'produtor', 'assistente_producao', 'contra_regra', 'stage_manager', 'camareiro'] },
  { id: 'camarins', title: 'Camarins', to: '/camarins', icon: StarDoorIcon, colorClass: 'bg-pink-500/10 text-pink-600', roles: ['dev', 'produtor', 'assistente_producao', 'contra_regra', 'stage_manager', 'camareiro'] },
  { id: 'catering', title: 'Catering', to: '/catering', icon: Coffee, colorClass: 'bg-orange-500/10 text-orange-600', roles: ['dev', 'produtor', 'assistente_producao', 'stage_manager', 'camareiro'] },
  { id: 'malas', title: 'Malas e Bagagens', to: '/malas', icon: Luggage, colorClass: 'bg-teal-500/10 text-teal-600', roles: ['dev', 'produtor', 'assistente_producao', 'tour_manager', 'cenotecnico', 'roadie'] },
  { id: 'fotos', title: 'Fotos e Arquivos', to: '/fotos', icon: ImageIcon, colorClass: 'bg-blue-600/10 text-blue-700', roles: ['dev', 'produtor', 'midias_sociais', 'assessoria_imprensa'] },
  { id: 'midias', title: 'Mídias Sociais', to: '/midias', icon: Smartphone, colorClass: 'bg-indigo-600/10 text-indigo-700', roles: ['dev', 'produtor', 'midias_sociais'] },
  { id: 'imprensa', title: 'Assessoria de Imprensa', to: '/imprensa', icon: Newspaper, colorClass: 'bg-yellow-500/10 text-yellow-700', roles: ['dev', 'produtor', 'assessoria_imprensa'] },
  { id: 'relatorios', title: 'Relatórios', to: '/emissao-relatorios', icon: Printer, colorClass: 'bg-slate-600/10 text-slate-700', roles: ['dev', 'produtor'] },
  { id: 'fornecedores', title: 'Fornecedores', to: '/fornecedores', icon: ShoppingCart, colorClass: 'bg-amber-600/10 text-amber-700', roles: ['dev', 'produtor', 'assistente_producao'] },
  { id: 'contatos', title: 'Contatos', to: '/contatos', icon: Contact2, colorClass: 'bg-red-500/10 text-red-600', roles: ['dev', 'produtor', 'assistente_producao', 'tour_manager', 'stage_manager'] },
  { id: 'espetaculos', title: 'Catálogo de Espetáculos', to: '/espetaculos', icon: Drama, colorClass: 'bg-purple-600/10 text-purple-700', roles: ['dev', 'produtor'] },
  { id: 'padroes', title: 'Padrões Espetáculo', to: '/padroes', icon: Settings, colorClass: 'bg-slate-600/10 text-slate-700', roles: ['dev', 'produtor'] },
  { id: 'cadastros', title: 'Usuários e Equipe', to: '/cadastros', icon: UserPlus, colorClass: 'bg-blue-700/10 text-blue-800', roles: ['dev', 'admin', 'produtor'] },
];

function getShortcutsForSingleRole(role: string): string[] {
  if (['dev', 'produtor'].includes(role)) {
    return ['eventos', 'escalas', 'contratos', 'minhas-escalas', 'viagens', 'meus-pagamentos', 'financeiro', 'relatorios'];
  }
  if (role === 'admin') {
    return ['cadastros', 'minhas-escalas', 'viagens', 'meus-pagamentos'];
  }
  if (role === 'assistente_producao') {
    return ['eventos', 'fornecedores', 'camarins', 'minhas-escalas', 'viagens', 'meus-pagamentos'];
  }
  if (role === 'tour_manager') {
    return ['eventos', 'contatos', 'malas', 'minhas-escalas', 'viagens', 'meus-pagamentos'];
  }
  if (role === 'stage_manager') {
    return ['palco', 'camarins', 'contatos', 'som', 'iluminacao', 'minhas-escalas', 'viagens', 'meus-pagamentos'];
  }
  if (role === 'contra_regra') {
    return ['palco', 'camarins', 'figurinos', 'minhas-escalas', 'viagens', 'meus-pagamentos'];
  }
  if (role === 'tecnico_som') {
    return ['som', 'som-operacao', 'palco', 'minhas-escalas', 'viagens', 'meus-pagamentos'];
  }
  if (role === 'iluminador') {
    return ['iluminacao', 'palco', 'minhas-escalas', 'viagens', 'meus-pagamentos'];
  }
  if (role === 'tecnico_video') {
    return ['video', 'palco', 'minhas-escalas', 'viagens', 'meus-pagamentos'];
  }
  if (['cenotecnico', 'roadie'].includes(role)) {
    return ['palco', 'malas', 'minhas-escalas', 'viagens', 'meus-pagamentos'];
  }
  if (role === 'rigger') {
    return ['palco', 'minhas-escalas', 'viagens', 'meus-pagamentos'];
  }
  if (role === 'camareiro') {
    return ['camarins', 'figurinos', 'catering', 'minhas-escalas', 'viagens', 'meus-pagamentos'];
  }
  if (role === 'musico') {
    return ['partituras', 'musicas', 'palco', 'minhas-escalas', 'viagens', 'meus-pagamentos'];
  }
  if (role === 'elenco') {
    return ['minhas-escalas', 'viagens', 'meus-pagamentos', 'meus-contratos'];
  }
  if (role === 'motorista') {
    return ['viagens', 'minhas-escalas', 'meus-pagamentos'];
  }
  if (role === 'assessoria_imprensa') {
    return ['imprensa', 'fotos', 'minhas-escalas', 'viagens', 'meus-pagamentos'];
  }
  if (role === 'midias_sociais') {
    return ['midias', 'fotos', 'minhas-escalas', 'viagens', 'meus-pagamentos'];
  }
  return ['minhas-escalas', 'meus-contratos', 'viagens', 'meus-pagamentos'];
}

function getDefaultShortcuts(role: string, funcoes: string[] = []): string[] {
  const allRoles = Array.from(new Set([role, ...funcoes].filter(Boolean)));
  if (allRoles.length === 0) return getShortcutsForSingleRole(role);
  
  const merged: string[] = [];
  for (const r of allRoles) {
    const list = getShortcutsForSingleRole(r);
    for (const item of list) {
      if (!merged.includes(item)) {
        merged.push(item);
      }
    }
  }
  return merged.slice(0, 10);
}

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard - Áxis - Gestão de Teatros e Shows" }] }),
  component: Dashboard,
});

function Dashboard() {
  const [items, setItems] = useState<Roadbook[]>([]);
  
  const fmtDate = (d?: string | null) => {
    if (!d) return "";
    const [y, m, day] = d.split('-');
    if (day) return `${day}/${m}/${y}`;
    return d;
  };

  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTutorial, setIsTutorial] = useState(false);

  useEffect(() => {
    // Check if first access
    const completed = localStorage.getItem("axis_tutorial_completed");
    if (!completed) {
      setIsTutorial(true);
    }

    const handleStartTour = () => {
      setIsTutorial(true);
    };

    window.addEventListener("start-axis-tutorial", handleStartTour);
    return () => window.removeEventListener("start-axis-tutorial", handleStartTour);
  }, []);
  const { profile, isSimulating } = AuthedRoute.useRouteContext();
  const [dup, setDup] = useState<Roadbook | null>(null);
  const [escalasPendentes, setEscalasPendentes] = useState<number>(0);
  const [bdaysToday, setBdaysToday] = useState<{nome: string, role: string}[]>([]);

  const storageKey = `dashboard_quick_access_${profile?.id || 'guest'}`;
  const [selectedShortcutIds, setSelectedShortcutIds] = useState<string[]>([]);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [tempSelected, setTempSelected] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSelectedShortcutIds(parsed.slice(0, 10));
            return;
          }
        } catch (e) {}
      }
      const userFuncoes = Array.isArray(profile?.funcoes) ? profile.funcoes : [];
      setSelectedShortcutIds(getDefaultShortcuts(profile?.role || '', userFuncoes));
    }
  }, [profile?.id, profile?.role, profile?.funcoes]);

  const handleOpenCustomize = () => {
    setTempSelected([...selectedShortcutIds]);
    setIsCustomizeOpen(true);
  };

  const toggleShortcut = (id: string) => {
    setTempSelected(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        if (prev.length >= 10) {
          toast.warning("Você pode selecionar no máximo 10 atalhos.");
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  const handleSaveShortcuts = () => {
    if (tempSelected.length === 0) {
      toast.warning("Selecione ao menos 1 atalho.");
      return;
    }
    setSelectedShortcutIds(tempSelected);
    localStorage.setItem(storageKey, JSON.stringify(tempSelected));
    toast.success("Acesso Rápido atualizado com sucesso!");
    setIsCustomizeOpen(false);
  };

  const handleResetDefault = () => {
    const userFuncoes = Array.isArray(profile?.funcoes) ? profile.funcoes : [];
    const def = getDefaultShortcuts(profile?.role || '', userFuncoes);
    setTempSelected(def);
  };

  const allowedShortcuts = ALL_SHORTCUTS.filter(item => {
    if (!item.roles || item.roles.length === 0) return true;
    if (!profile) return false;
    if (profile.role === 'dev' || profile.role === 'admin') return true;
    const userFuncoes = Array.isArray(profile.funcoes) ? profile.funcoes : [];
    return item.roles.includes(profile.role) || item.roles.some(r => userFuncoes.includes(r));
  });

  const displayShortcuts = selectedShortcutIds
    .map(id => allowedShortcuts.find(item => item.id === id))
    .filter(Boolean) as ShortcutItem[];

  async function load() {
    setLoading(true);
    const [{ data: rb, error: e1 }, { data: tr, error: e2 }, { data: evts }, { data: esc }] = await Promise.all([
      supabase.from("roadbooks").select("id,slug,espetaculo,cidade,estado,festival,data_inicial,data_final,tour_id,evento_id,programacao").order("data_inicial", { ascending: true }),
      supabase.from("tours").select("id,slug,nome,espetaculo").order("created_at", { ascending: false }),
      (profile && !['admin', 'dev', 'produtor'].includes(profile.role)) || isSimulating ? supabase.from("eventos").select("id, equipe") : Promise.resolve({ data: [] }),
      profile ? supabase.from("evento_escalas").select("evento_id, status").eq("usuario_id", profile.id) : Promise.resolve({ data: [] })
    ]);
    
    let roadbooksFinal = rb as Roadbook[] || [];
    if (profile && !['admin', 'dev', 'produtor'].includes(profile.role)) {
       roadbooksFinal = roadbooksFinal.filter(r => {
         const eId = (r as any).evento_id;
         if (!eId) return false;
         
         const isAceita = esc?.some(e => String(e.evento_id) === String(eId) && String(e.status).toLowerCase().includes('aceit'));
         if (isAceita) return true;

         const evt = evts?.find(e => String(e.id) === String(eId));
         const isInEquipe = evt?.equipe && Array.isArray(evt.equipe) && evt.equipe.includes(profile.id);
         return isInEquipe;
       });
    }

    if (e1) toast.error(e1.message);
    if (e2) toast.error(e2.message);
    setItems(roadbooksFinal);
    setTours((tr as Tour[]) ?? []);
    setEscalasPendentes(esc ? esc.filter(e => e.status === 'pendente').length : 0);
    
    if (profile && ['admin', 'dev', 'produtor', 'assistente_producao'].includes(profile.role)) {
      const { data: profs } = await supabase.from('profiles').select('nome, role, data_nascimento').not('data_nascimento', 'is', null);
      if (profs) {
        const today = new Date();
        const m = today.getMonth() + 1;
        const d = today.getDate();
        const todayBdays = profs.filter(p => {
          if (!p.data_nascimento) return false;
          const [by, bm, bd] = p.data_nascimento.split('-');
          return parseInt(bm) === m && parseInt(bd) === d;
        });
        setBdaysToday(todayBdays);
      }
    }
    
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const [deleteRbId, setDeleteRbId] = useState<string | null>(null);
  
  async function onDelete(id: string) {
    const { error } = await supabase.from("roadbooks").delete().eq("id", id);
    if (error) toast.error("Não foi possível excluir o Guia de Viagem: " + getErrorMessage(error)); else { toast.success("Guia de Viagem removido com sucesso!"); load(); }
    setDeleteRbId(null);
  }

  const [deleteTourId, setDeleteTourId] = useState<string | null>(null);

  async function onDeleteTour(id: string) {
    const { error } = await supabase.from("tours").delete().eq("id", id);
    if (error) toast.error("Não foi possível excluir a Turnê: " + getErrorMessage(error)); else { toast.success("Turnê removida com sucesso!"); load(); }
    setDeleteTourId(null);
  }

  const getGradient = (index: number) => {
    const gradients = [
      "from-blue-500/20 to-cyan-500/20",
      "from-purple-500/20 to-pink-500/20",
      "from-orange-500/20 to-amber-500/20",
      "from-emerald-500/20 to-teal-500/20",
      "from-rose-500/20 to-red-500/20"
    ];
    return gradients[index % gradients.length];
  };
  
  const getIconColor = (index: number) => {
    const colors = [
      "text-blue-500 bg-blue-500/10",
      "text-purple-500 bg-purple-500/10",
      "text-orange-500 bg-orange-500/10",
      "text-emerald-500 bg-emerald-500/10",
      "text-rose-500 bg-rose-500/10"
    ];
    return colors[index % colors.length];
  };

  const safeTime = (t?: string, fallback = "00:00") => {
    if (!t || typeof t !== 'string') return fallback;
    const parts = t.trim().split(':');
    if (parts.length < 2) return fallback;
    return parts[0].padStart(2, '0') + ':' + parts[1].padStart(2, '0');
  };

  const getRoadbookStartDateTime = (rb: Roadbook): Date => {
    if (rb.programacao && Array.isArray(rb.programacao) && rb.programacao.length > 0) {
      const progs = [...rb.programacao].sort((a, b) => new Date(`${a.data}T${safeTime(a.hora_inicio || a.hora, "00:00")}:00-03:00`).getTime() - new Date(`${b.data}T${safeTime(b.hora_inicio || b.hora, "00:00")}:00-03:00`).getTime());
      const firstProg = progs[0];
      return new Date(`${firstProg.data}T${safeTime(firstProg.hora_inicio || firstProg.hora, "00:00")}:00-03:00`);
    }
    return new Date(`${rb.data_inicial || "2000-01-01"}T00:00:00-03:00`);
  };

  const getRoadbookEndDateTime = (rb: Roadbook): Date => {
    if (rb.programacao && Array.isArray(rb.programacao) && rb.programacao.length > 0) {
      const progs = [...rb.programacao].sort((a, b) => new Date(`${a.data}T${safeTime(a.hora_inicio || a.hora, "00:00")}:00-03:00`).getTime() - new Date(`${b.data}T${safeTime(b.hora_inicio || b.hora, "00:00")}:00-03:00`).getTime());
      const lastProg = progs[progs.length - 1];
      return new Date(`${lastProg.data}T${safeTime(lastProg.hora_fim || lastProg.hora_inicio || lastProg.hora, "23:59")}:00-03:00`);
    }
    return new Date(`${rb.data_final || rb.data_inicial || "2000-01-01"}T23:59:59-03:00`);
  };

  const now = new Date();
  
  const eventosAtuais = items.filter(r => getRoadbookStartDateTime(r) <= now && getRoadbookEndDateTime(r) >= now).sort((a, b) => getRoadbookStartDateTime(a).getTime() - getRoadbookStartDateTime(b).getTime());
  const futuros = items.filter(r => getRoadbookStartDateTime(r) > now).sort((a, b) => getRoadbookStartDateTime(a).getTime() - getRoadbookStartDateTime(b).getTime());

  // Cidade Atual: apenas se houver viagem ocorrendo exatamente hoje/agora
  const currentCity = eventosAtuais.length > 0 ? eventosAtuais[0].cidade : "Nenhuma viagem em andamento";
  // Próxima Cidade: a primeira viagem futura
  const nextCity = futuros.length > 0 ? futuros[0].cidade : "Sem viagem programada";

  // Próximas viagens para exibição nos cards do dashboard
  const upcomingRoadbooks = items.filter(r => getRoadbookEndDateTime(r) >= now).sort((a, b) => getRoadbookStartDateTime(a).getTime() - getRoadbookStartDateTime(b).getTime());
  
  const hoje = now.toISOString().split('T')[0];
  const realizados = items.filter(r => getRoadbookEndDateTime(r).getTime() < now.getTime()).sort((a, b) => getRoadbookStartDateTime(b).getTime() - getRoadbookStartDateTime(a).getTime());

  // Smart Panel Logic
  const roleName = profile?.role ? ROLE_BADGE_MAP[profile.role]?.label || profile.role : 'Membro da Equipe';
  const firstName = profile?.nome ? profile.nome.split(' ')[0] : 'Time Seven';
  
  const getSmartMessage = () => {
    if (escalasPendentes > 0) {
      return { 
        title: `Olá, ${firstName}!`, 
        sub: `Você tem ${displayEscalasPendentes} convite(s) pendente(s) de escala. Confirme sua presença para garantir a logística.`, 
        icon: AlertCircle, 
        color: 'from-amber-500 to-orange-600', 
        link: '/minhas-escalas', 
        btnText: 'Ver Escalas' 
      };
    }

    if (bdaysToday.length > 0) {
      return { 
        title: `Dia de Festa, ${firstName}! 🎉`, 
        sub: `Hoje é o aniversário de: ${bdaysToday.map(b => b.nome).join(', ')}. Não deixe de parabenizar nossa equipe!`, 
        icon: Calendar, 
        color: 'from-fuchsia-500 to-pink-600', 
        link: '/dados-equipe', 
        btnText: 'Ver Equipe' 
      };
    }
    
    if (upcomingRoadbooks.length > 0) {
      const nextEvent = upcomingRoadbooks[0];
      const daysUntil = Math.ceil((getRoadbookStartDateTime(nextEvent).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (isNaN(daysUntil)) {
        return { 
          title: `Tudo no esquema, ${firstName}.`, 
          sub: `Nosso próximo compromisso será em ${nextEvent.cidade}, em breve. Aproveite o tempo para organizar os detalhes!`, 
          icon: MapPin, 
          color: 'from-slate-800 to-slate-900 dark:from-slate-900 dark:to-slate-950', 
          link: profile?.role === 'motorista' ? `/versao-motorista/${nextEvent.slug}` : `/rb/${nextEvent.slug}`, 
          btnText: 'Ver Detalhes do Roteiro' 
        };
      }
      
      if (daysUntil < 0) {
        return { 
          title: `Ação! ${firstName} 🔥`, 
          sub: `Temos um evento rolando neste momento em ${nextEvent.cidade}. Acesse o roteiro para acompanhar os detalhes!`, 
          icon: StageIcon, 
          color: 'from-red-500 to-rose-600', 
          link: profile?.role === 'motorista' ? `/versao-motorista/${nextEvent.slug}` : `/rb/${nextEvent.slug}`, 
          btnText: 'Abrir Roteiro' 
        };
      }

      if (daysUntil === 0) {
        return { 
          title: `É Hoje, ${firstName}! 🌟`, 
          sub: `O espetáculo em ${nextEvent.cidade} acontece hoje. Acesse o roteiro para todos os detalhes do dia!`, 
          icon: StageIcon, 
          color: 'from-emerald-500 to-teal-600', 
          link: profile?.role === 'motorista' ? `/versao-motorista/${nextEvent.slug}` : `/rb/${nextEvent.slug}`, 
          btnText: 'Abrir Roteiro' 
        };
      }
      
      if (daysUntil <= 3) {
        return { 
          title: `Falta pouco, ${firstName}!`, 
          sub: `Estamos a ${daysUntil} ${daysUntil === 1 ? 'dia' : 'dias'} do evento em ${nextEvent.cidade}. Já arrumou as malas?`, 
          icon: Bus, 
          color: 'from-indigo-500 to-violet-600', 
          link: profile?.role === 'motorista' ? `/versao-motorista/${nextEvent.slug}` : `/rb/${nextEvent.slug}`, 
          btnText: 'Ver Roteiro' 
        };
      }
      
      return { 
        title: `Tudo no esquema, ${firstName}.`, 
        sub: `Nosso próximo compromisso será em ${nextEvent.cidade}, daqui a ${daysUntil} dias. Aproveite o tempo para organizar os detalhes!`, 
        icon: MapPin, 
        color: 'from-slate-800 to-slate-900 dark:from-slate-900 dark:to-slate-950', 
        link: profile?.role === 'motorista' ? `/versao-motorista/${nextEvent.slug}` : `/rb/${nextEvent.slug}`, 
        btnText: 'Ver Detalhes do Roteiro' 
      };
    }
    
    return { 
      title: `Boas-vindas, ${firstName}!`, 
      sub: `Nenhum evento futuro programado. Aproveite o descanso e recarregue as energias! ⚡`, 
      icon: Sun, 
      color: 'from-sky-400 to-blue-600', 
      link: '/eventos', 
      btnText: 'Ver Calendário' 
    };
  };

  
  // DADOS DE DEMONSTRAÇÃO (MODO TUTORIAL SEGURO E ISOLADO)
  const mockUpcomingRoadbooks: Roadbook[] = [
    {
      id: "demo-rb-1",
      slug: "turne-demo-sao-paulo",
      espetaculo: "O Grande Mistério • Turnê Nacional",
      cidade: "São Paulo",
      estado: "SP",
      data_inicial: new Date().toISOString().split("T")[0],
      data_final: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
      teatro_nome: "Teatro Santander",
      hotel_nome: "Hotel Grand Mercure",
      programacao: [],
      quartos: [],
      outros_contatos: [],
      documentos: [],
      voos: [],
      teatro_fotos: [],
      hotel_fotos: [],
    } as any,
  ];

  const displayUpcoming = isTutorial ? mockUpcomingRoadbooks : upcomingRoadbooks;
  const displayCurrentCity = isTutorial ? "São Paulo" : currentCity;
  const displayNextCity = isTutorial ? "Rio de Janeiro" : nextCity;
  const displayFuturosCount = isTutorial ? 3 : futuros.length;
  const displayEscalasPendentes = isTutorial ? 1 : escalasPendentes;

  const smartMsg = getSmartMessage();

  const renderRoadbookCard = (r: Roadbook, index: number) => (
    <Card key={r.id} className="p-5 flex flex-col md:flex-row md:items-center gap-5 justify-between group border-0 shadow-[0_2px_15px_rgb(0,0,0,0.02)] dark:shadow-[0_2px_15px_rgb(0,0,0,0.3)] bg-white dark:bg-card/60 dark:backdrop-blur-md dark:border dark:border-white/5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-300 rounded-[1.5rem] relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-100 dark:bg-white/5 group-hover:bg-primary transition-colors duration-300"></div>
      
      <div className="min-w-0 flex-1 pl-3">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-200 dark:bg-sky-500/20 dark:text-sky-300 dark:hover:bg-sky-500/30 border-none font-bold rounded-lg px-3 py-0.5">
            <Calendar className="size-3 mr-1.5 inline-block -mt-0.5" />
            {fmtDate(r.data_inicial)}
          </Badge>
          {r.festival && (
            <Badge variant="secondary" className="bg-fuchsia-100 text-fuchsia-700 hover:bg-fuchsia-200 dark:bg-fuchsia-500/20 dark:text-fuchsia-300 dark:hover:bg-fuchsia-500/30 border-none font-bold rounded-lg px-3 py-0.5">
              {r.festival}
            </Badge>
          )}
        </div>
        <h3 className="font-black text-xl text-slate-800 dark:text-white truncate mb-1.5">{r.espetaculo}</h3>
        <div className="flex items-center text-sm font-semibold text-slate-500 dark:text-slate-400 gap-1.5">
          <MapPin className="size-4" />
          <span>{r.cidade}{r.estado ? ` - ${r.estado}` : ""}</span>
        </div>
      </div>
      
      {/* Responsive Actions */}
      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0 md:pr-2 items-center border-t border-slate-100 dark:border-white/5 md:border-0 pt-4 md:pt-0 mt-2 md:mt-0">
        <Button variant="outline" className="rounded-xl h-11 w-full sm:w-auto bg-slate-50 shadow-sm hover:bg-primary hover:text-white hover:border-primary border-slate-200 dark:bg-white/5 dark:border-white/10 dark:text-slate-300 dark:hover:bg-primary dark:hover:text-white transition-colors font-bold" asChild>
          {profile?.role === 'motorista' ? (<a href={`/versao-motorista/${r.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="size-4 mr-2" /> Ver Roteiro</a>) : (<a href={`/rb/${r.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="size-4 mr-2" /> Ver Roteiro</a>)}
        </Button>
        
        {['dev', 'produtor', 'assistente_producao'].includes(profile?.role || '') && (
        <div className="grid grid-cols-4 sm:flex gap-2 w-full sm:w-auto sm:border-l sm:border-slate-200 dark:sm:border-white/10 sm:pl-3 sm:ml-1">
          <Button variant="outline" className="rounded-xl h-11 w-full sm:w-11 px-0 bg-slate-50 shadow-sm hover:bg-slate-200 border-slate-200 text-slate-500 dark:bg-white/5 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white transition-colors" asChild title="Versão para motorista">
            <a href={`/versao-motorista/${r.slug}`} target="_blank" rel="noreferrer">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
            </a>
          </Button>
          <Button variant="outline" className="rounded-xl h-11 w-full sm:w-11 px-0 bg-slate-50 shadow-sm hover:bg-slate-200 border-slate-200 text-slate-500 dark:bg-white/5 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white transition-colors" asChild title="Editar">
            <Link to="/roadbook/$id" params={{ id: r.id }}><Pencil className="size-4.5" /></Link>
          </Button>
          <Button variant="outline" className="rounded-xl h-11 w-full sm:w-11 px-0 bg-slate-50 shadow-sm hover:bg-slate-200 border-slate-200 text-slate-500 dark:bg-white/5 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white transition-colors" onClick={() => setDup(r)} title="Duplicar">
            <Copy className="size-4.5" />
          </Button>
          <Button variant="outline" onClick={() => setDeleteRbId(r.id)} className="rounded-xl h-11 w-full sm:w-11 px-0 bg-red-50/50 shadow-sm hover:bg-red-100 border-red-200 text-red-500 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/20 transition-colors" title="Excluir">
            <Trash2 className="size-4.5" />
          </Button>
        </div>
        )}
      </div>
    </Card>
  );


  return (
    <div className="max-w-7xl mx-auto space-y-12">
      
      {/* HEADER E STATS */}
      <section id="tour-welcome-banner" className="space-y-8">
        {isTutorial && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 flex items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-amber-500 text-white font-bold text-xs">MODO DEMO</span>
              <p className="text-xs sm:text-sm font-semibold">Tour Inicial Guiado: conheça a plataforma com uma visão prática e realista.</p>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                localStorage.setItem("axis_tutorial_completed", "true");
                setIsTutorial(false);
              }}
              className="text-xs font-bold rounded-xl shrink-0"
            >
              Pular / Fechar Tutorial ✕
            </Button>
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400">Sistema Online</Badge>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("axis_tutorial_completed");
                  setIsTutorial(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 transition-colors shadow-2xs"
                title="Iniciar Tutorial Guiado"
              >
                <Sparkles className="size-3.5" />
                Guia Rápido / Tutorial
              </button>
            </div>
            <h1 className="text-4xl xl:text-5xl font-black tracking-tight leading-snug pb-2 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
              Visão Geral
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base mt-2 font-medium">Acompanhe suas atividades e acesse rapidamente as principais ferramentas.</p>
          </div>
        </div>

        {/* ALERTA DE ESCALAS PENDENTES */}
        {/* ALERTA DE ANIVERSÁRIOS */}

        {/* SMART PANEL */}
        <div className={`relative overflow-hidden rounded-[2rem] p-6 sm:p-8 text-white shadow-xl bg-gradient-to-br ${smartMsg.color} animate-in fade-in slide-in-from-bottom-4 duration-700 group`}>
          <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-700">
            <smartMsg.icon className="size-48" />
          </div>
          
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md px-3 py-1 text-xs uppercase tracking-widest font-bold">
                  {roleName}
                </Badge>
                {bdaysToday.length > 0 && escalasPendentes === 0 && (
                   <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md px-3 py-1 font-bold">
                     🎂 Aniversário Hoje!
                   </Badge>
                )}
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 drop-shadow-sm">{smartMsg.title}</h2>
              <p className="text-white/90 text-lg font-medium max-w-xl mb-6">{smartMsg.sub}</p>
              
              <div className="flex flex-wrap gap-4 mt-2">
                <Button asChild className="bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-bold px-6 shadow-lg shadow-black/10">
                  <Link to={smartMsg.link}>{smartMsg.btnText}</Link>
                </Button>
                {escalasPendentes > 0 && bdaysToday.length > 0 && (
                  <Button asChild variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl font-bold px-6 backdrop-blur-sm">
                    <Link to="/dados-equipe">Tem aniversário na equipe! 🎉</Link>
                  </Button>
                )}
              </div>
            </div>
            
            {/* QUICK STATS WIDGET */}
            <div className="hidden lg:flex flex-col gap-4 shrink-0 bg-black/10 backdrop-blur-md p-5 rounded-[1.5rem] border border-white/10 shadow-inner">
              <div className="text-xs font-bold text-white/70 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                <Sparkles className="size-3.5" /> 
                Seu Resumo Dinâmico
              </div>
              <div className="flex gap-6 divide-x divide-white/10">
                <div>
                  <div className="text-3xl font-black tabular-nums">{displayFuturosCount}</div>
                  <div className="text-xs text-white/70 font-bold mt-1 uppercase tracking-wide">Eventos Futuros</div>
                </div>
                <div className="pl-6">
                  <div className="text-3xl font-black tabular-nums">{escalasPendentes}</div>
                  <div className="text-xs text-white/70 font-bold mt-1 uppercase tracking-wide">Escalas Pendentes</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

        <div id="tour-city-status" className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="relative overflow-hidden p-6 xl:p-8 border-0 shadow-[0_4px_25px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl dark:border dark:border-white/10 transition-all hover:-translate-y-1.5 hover:shadow-[0_12px_35px_rgb(0,0,0,0.06)] rounded-3xl group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
            <div className="flex items-center gap-5 relative z-10">
              <div className="p-4 bg-emerald-100/50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 rounded-2xl shadow-sm ring-1 ring-emerald-200/50 dark:ring-emerald-800">
                <MapPin className="size-7" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1 truncate">
                  {displayCurrentCity}
                </h3>
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Cidade Atual</p>
              </div>
            </div>
          </Card>
          
          <Card className="relative overflow-hidden p-6 xl:p-8 border-0 shadow-[0_4px_25px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white dark:bg-white/[0.03] dark:backdrop-blur-xl dark:border dark:border-white/10 transition-all hover:-translate-y-1.5 hover:shadow-[0_12px_35px_rgb(0,0,0,0.06)] rounded-3xl group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400/10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
            <div className="flex items-center gap-5 relative z-10">
              <div className="p-4 bg-orange-100/50 dark:bg-orange-900/40 text-orange-600 dark:text-orange-300 rounded-2xl shadow-sm ring-1 ring-orange-200/50 dark:ring-orange-800">
                <Calendar className="size-7" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1 truncate">
                  {displayNextCity}
                </h3>
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Próxima Cidade</p>
              </div>
            </div>
          </Card>
        </div>

        {/* AÇÕES PRINCIPAIS (PRODUÇÃO E GESTÃO) */}
        {['dev', 'produtor'].includes(profile?.role || '') && (
          <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-primary/20 rounded-full blur-2xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-400 flex items-center gap-1.5 mb-1">
                  <Sparkles className="size-3.5" /> Gestão Operacional
                </span>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">Ações Principais</h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">Crie turnês, lance eventos e acompanhe a programação.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild className="rounded-xl h-11 px-5 font-bold bg-primary hover:bg-primary/90 text-white shadow-md">
                  <Link to="/tour/new">
                    <Plus className="size-4 mr-2" /> Criar Turnê
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-xl h-11 px-5 font-bold bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md">
                  <Link to="/novo-projeto">
                    <Calendar className="size-4 mr-2 text-indigo-400" /> Cadastrar Evento
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="rounded-xl h-11 px-4 font-bold text-slate-200 hover:text-white hover:bg-white/10">
                  <Link to="/eventos">
                    Consultar Eventos <ChevronRight className="size-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* GRADES DE ACESSO RÁPIDO (MENUS) */}
        <section className="space-y-6 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">Acesso Rápido</h2>
              <Badge variant="outline" className="text-xs px-2.5 py-0.5 font-bold rounded-lg border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300">
                {displayShortcuts.length} de 10
              </Badge>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenCustomize}
              className="gap-2 rounded-xl text-xs font-bold border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 self-start sm:self-auto h-9 px-4 shadow-sm"
            >
              <SlidersHorizontal className="size-3.5 text-primary" />
              Editar Atalhos
            </Button>
          </div>
          
          {displayShortcuts.length === 0 ? (
            <Card className="p-8 text-center border-dashed border-2 border-slate-200 dark:border-white/10 bg-transparent rounded-2xl">
              <p className="text-sm text-slate-500 mb-3">Nenhum atalho selecionado para o Acesso Rápido.</p>
              <Button size="sm" onClick={handleOpenCustomize} className="rounded-xl font-bold">
                <Plus className="size-4 mr-1.5" /> Escolher Atalhos
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {displayShortcuts.map(item => {
                const IconComponent = item.icon;
                return (
                  <Link 
                    key={item.id} 
                    to={item.to} 
                    className="bg-white dark:bg-card/40 border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/40 dark:hover:border-primary/40 transition-all group flex flex-col items-center text-center gap-3 relative"
                  >
                    <div className={`p-4 rounded-2xl transition-all ${item.colorClass} group-hover:scale-110 shadow-sm`}>
                      <IconComponent className="size-6" />
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-200 text-sm line-clamp-2 leading-snug min-h-[2.25rem] flex items-center justify-center">{item.title}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* DIALOG DE PERSONALIZAÇÃO */}
          <Dialog open={isCustomizeOpen} onOpenChange={setIsCustomizeOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
              <DialogHeader>
                <div className="flex items-center justify-between pr-4">
                  <DialogTitle className="text-xl font-black text-slate-800 dark:text-white">
                    Personalizar Acesso Rápido
                  </DialogTitle>
                  <Badge 
                    variant={tempSelected.length === 10 ? "destructive" : "secondary"}
                    className="text-xs px-2.5 py-1 font-bold rounded-lg"
                  >
                    {tempSelected.length} de 10 selecionados
                  </Badge>
                </div>
                <DialogDescription className="text-slate-500 text-sm mt-1">
                  Selecione até 10 atalhos favoritos para exibir no seu painel principal.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4 max-h-[50vh] overflow-y-auto pr-1">
                {allowedShortcuts.map(item => {
                  const isChecked = tempSelected.includes(item.id);
                  const isMaxReached = tempSelected.length >= 10 && !isChecked;
                  const IconComponent = item.icon;

                  return (
                    <div
                      key={item.id}
                      onClick={() => !isMaxReached && toggleShortcut(item.id)}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isChecked 
                          ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-sm' 
                          : isMaxReached
                            ? 'opacity-40 border-slate-200 dark:border-white/5 cursor-not-allowed bg-slate-50 dark:bg-white/5'
                            : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-white dark:bg-card'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2.5 rounded-xl ${item.colorClass} shrink-0`}>
                          <IconComponent className="size-4" />
                        </div>
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">
                          {item.title}
                        </span>
                      </div>

                      <div className={`size-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                        isChecked 
                          ? 'bg-primary border-primary text-white shadow-sm' 
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                      }`}>
                        {isChecked && <Check className="size-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <DialogFooter className="flex flex-col sm:flex-row sm:justify-between items-center gap-3 pt-4 border-t border-slate-100 dark:border-white/10">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResetDefault}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  Restaurar Padrão
                </Button>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCustomizeOpen(false)}
                    className="flex-1 sm:flex-none rounded-xl font-bold"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveShortcuts}
                    className="flex-1 sm:flex-none rounded-xl font-bold shadow-md"
                  >
                    Salvar Atalhos ({tempSelected.length})
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>

      {/* EVENTO ATUAL (Somente os 2 primeiros roadbooks) */}
      <section id="tour-guias-viagem" className="space-y-6 pt-4">
        <div className="flex items-center gap-3 px-2">
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">Próximos Eventos</h2>
          <div className="h-px flex-1 bg-slate-200 dark:bg-white/10 ml-4"></div>
        </div>
        
        {displayUpcoming.length === 0 ? (
          <Card className="p-16 text-center border-dashed border-2 border-slate-200 dark:border-white/10 bg-transparent rounded-[2rem]">
            <p className="text-slate-500 dark:text-slate-400 font-medium">Você não possui eventos futuros programados.</p>
          </Card>
        ) : (
          <div className="grid gap-5">
            {displayUpcoming.slice(0, 2).map(renderRoadbookCard)}
          </div>
        )}
      </section>

      <ProductTour active={isTutorial} onFinish={() => {
        localStorage.setItem("axis_tutorial_completed", "true");
        setIsTutorial(false);
      }} />
    </div>
  );
}

