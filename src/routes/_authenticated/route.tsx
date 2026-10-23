import { Info, HelpCircle, FileSignature, ChevronLeft, ClipboardList, Drama, DoorOpen, Banknote, ShoppingCart, LogOut, Sun, Moon, ChevronRight, Menu, ChevronDown, Plus, Layers, Ticket, QrCode, ShieldCheck, Bell, Sparkles, Hotel } from "lucide-react";
import { createFileRoute, Outlet, redirect, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useState, useEffect, Children, isValidElement } from "react";
import { LayoutDashboard, UserPlus, Calendar, Wallet, Route as RouteIcon, Bus, Contact, FileAudio, Music, Play, Lightbulb, Mic2, Newspaper, Settings, Settings2, CheckSquare, Smartphone, Video, File } from "lucide-react";
import { ROLE_BADGE_MAP } from "./cadastros";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Users, Printer, Contact2, Luggage, Image as ImageIcon, Megaphone, Coffee } from "lucide-react";
import { StageIcon, ClothesRackIcon, StarDoorIcon } from "@/components/CustomIcons";

type Profile = {
  id: string;
  nome: string;
  foto_url: string | null;
  role: "dev" | "admin" | "produtor" | "iluminador" | "tecnico_som" | "motorista" | "stage_manager" | "contra_regra" | "assistente_producao" | "camareiro" | "elenco" | "musico" | "tour_manager" | "roadie" | "cenotecnico" | "tecnico_video" | "assessoria_imprensa" | "midias_sociais" | "rigger";
};

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) throw redirect({ to: "/auth" });
    
    let profile = null;
    let isSimulating = false;

    // Buscar perfil do usuário
    const { data: realProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    // Verificação de SMS Global
    const { data: configData } = await supabase
      .from('configuracoes_sistema')
      .select('exigir_sms_cadastro')
      .eq('id', 1)
      .single();

    if (configData?.exigir_sms_cadastro && realProfile?.role !== 'admin' && realProfile?.role !== 'dev') {
      if (!authData.user.phone_confirmed_at) {
        throw redirect({ to: '/verify-phone' });
      }
    }

    profile = realProfile;

    if (realProfile?.role === 'dev') {
      const stored = localStorage.getItem('simulated_profile');
      if (stored) {
        try {
          profile = JSON.parse(stored);
          isSimulating = true;
        } catch(e) {}
      }
    }

    return { 
      user: authData.user,
      realProfile: realProfile as Profile | null,
      profile: profile as Profile | null,
      isSimulating
    };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, realProfile, isSimulating } = Route.useRouteContext();
  const [sidebarOpen, setSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [simuladorOpen, setSimuladorOpen] = useState(false);
  const [usersToSimulate, setUsersToSimulate] = useState<Profile[]>([]);
  const [notificacoesUnread, setNotificacoesUnread] = useState<any[]>([]);

  useEffect(() => {
    if (profile?.id) {
      const fetchNotificacoes = async () => {
        const { data } = await supabase
          .from("notificacoes")
          .select("id, titulo, mensagem, link, lida, created_at")
          .eq("usuario_id", profile.id)
          .eq("lida", false)
          .order("created_at", { ascending: false })
          .limit(5);
        if (data) setNotificacoesUnread(data);
      };

      fetchNotificacoes();

      const channel = supabase
        .channel(`sidebar_notificacoes_${profile.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notificacoes",
            filter: `usuario_id=eq.${profile.id}`
          },
          () => {
            fetchNotificacoes();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile?.id]);
  
  async function loadUsersToSimulate() {
    setSimuladorOpen(true);
    const { data } = await supabase.from('profiles').select('*').order('nome');
    if (data) setUsersToSimulate(data as Profile[]);
  }

  function startSimulation(u: Profile) {
    localStorage.setItem('simulated_profile', JSON.stringify(u));
    window.location.href = '/dashboard';
  }

  useEffect(() => {
    if (document.documentElement.classList.contains("dark")) {
      setTheme("dark");
    }
  }, []);

  const toggleTheme = () => {
    if (theme === "light") {
      document.documentElement.classList.add("dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      setTheme("light");
    }
  };

  async function signOut() {
    localStorage.removeItem("simulated_profile");
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  const userName = profile?.nome || user.user_metadata?.full_name || "Usuário";
  const userRole = profile?.role || "user";
  const userFuncoes: string[] = Array.isArray(profile?.funcoes) ? profile.funcoes : [];
  // Helper: returns true if user has this role as primary OR as extra function
  const hasRole = (role: string) => userRole === role || userFuncoes.includes(role);
  // Close sidebar on mobile after clicking a nav item
  const closeMobileMenu = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };
  const fotoUrl = profile?.foto_url;

  const clearSimulation = () => {
    localStorage.removeItem("simulated_profile");
    window.location.href = '/dashboard';
  };

  return (
    <div className="flex min-h-screen bg-slate-50/50 dark:bg-background transition-colors duration-500">
      {isSimulating && (
        <div className="fixed top-0 left-0 w-full z-50 bg-red-600 text-white p-2 px-4 flex items-center justify-between shadow-md">
          <div className="font-bold flex items-center gap-2">
            <span className="animate-pulse">⚠️</span>
            MODO SIMULADOR ATIVO: Você está visualizando o sistema como {userName} ({userRole})
          </div>
          <Button variant="outline" size="sm" onClick={clearSimulation} className="text-black bg-white hover:bg-slate-100 font-bold border-none h-8">
            Encerrar Simulação
          </Button>
        </div>
      )}
      {/* OVERLAY MOBILE */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR RETRÁTIL */}
      <aside 
        id="tour-sidebar-navigation"
        className={`${sidebarOpen ? 'translate-x-0 w-[14.25rem]' : '-translate-x-full md:translate-x-0 md:w-20'} fixed left-0 top-0 h-screen z-40 bg-white/80 dark:bg-card/80 md:dark:bg-card/40 backdrop-blur-xl border-r border-slate-200/60 dark:border-white/10 transition-all duration-300 flex flex-col print:hidden`}
      >
        <div className="flex h-16 items-center justify-between px-3 border-b border-slate-200/60 dark:border-white/10">
          {sidebarOpen ? (
            <div className="flex items-center justify-between w-full pr-2">
              <div className="flex items-center gap-3 overflow-hidden">
                <Avatar className="size-9 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm shrink-0">
                  <AvatarImage src={fotoUrl || undefined} alt={userName} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-tr from-primary to-purple-500 text-white font-bold rounded-xl text-sm">{getInitials(userName)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent truncate leading-tight">
                    {userName}
                  </span>
                  <span className="text-xs font-semibold text-primary/80 uppercase tracking-wider leading-tight">
                    {ROLE_BADGE_MAP[userRole as keyof typeof ROLE_BADGE_MAP]?.label || userRole.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* SININHO DE NOTIFICAÇÕES */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative shrink-0 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 h-9 w-9" title="Notificações">
                    <Bell className="size-5 text-slate-500 dark:text-slate-400" />
                    {notificacoesUnread.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0 rounded-2xl shadow-2xl border-slate-200 dark:border-white/10 overflow-hidden" sideOffset={8}>
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 flex items-center justify-between border-b border-slate-100 dark:border-white/5">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Notificações</span>
                    {notificacoesUnread.length > 0 && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">{notificacoesUnread.length} novas</Badge>
                    )}
                  </div>
                  <div className="max-h-[280px] overflow-y-auto">
                    {notificacoesUnread.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-xs flex flex-col items-center">
                        <Bell className="size-6 mb-2 text-slate-300 opacity-50" />
                        Nenhuma notificação nova.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {notificacoesUnread.map(n => (
                          <Link key={n.id} to={n.link || "/notificacoes"} className="block p-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{n.titulo}</p>
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{n.mensagem}</p>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                  <Link to="/notificacoes" className="block p-2 text-center text-xs font-bold text-primary hover:bg-slate-50 dark:hover:bg-white/5 border-t border-slate-100 dark:border-white/5">
                    Abrir Central Completa
                  </Link>
                </PopoverContent>
              </Popover>
            </div>
          ) : (
            <Avatar className="size-10 mx-auto rounded-xl border border-slate-200 dark:border-white/10 shadow-sm shrink-0">
              <AvatarImage src={fotoUrl || undefined} alt={userName} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-tr from-primary to-purple-500 text-white font-bold rounded-xl text-sm">{getInitials(userName)}</AvatarFallback>
            </Avatar>
          )}
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="hidden md:flex absolute -right-3.5 top-6 bg-white dark:bg-card border border-slate-200 dark:border-white/10 shadow-sm z-50 h-7 w-7 rounded-full items-center justify-center p-0 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors"
          >
            {sidebarOpen ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
          </Button>
        </div>

        <TooltipProvider delayDuration={50}>
          <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-1.5" onClick={closeMobileMenu}>
          
          {/* HELPERS FOR SIDEBAR */}
          {(() => {
            const SLink = ({ to, icon: Icon, label, show=true }: any) => {
              if (!show) return null;
              const isActive = location.pathname.startsWith(to);
              return (
                <Link 
                  to={to} 
                  ref={el => { if (isActive && el && sidebarOpen) { setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100); } }}
                  className="w-full flex items-center justify-start px-3 h-9 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/10 text-xs font-semibold rounded-xl transition-all group/item" 
                  activeProps={{ className: "bg-primary/10 text-primary font-bold dark:bg-primary/20 dark:text-white shadow-2xs" }}
                >
                  <Icon className="mr-2.5 size-4 shrink-0 text-slate-400 group-hover/item:text-primary transition-colors" />
                  <span className="truncate">{label}</span>
                </Link>
              );
            };

            const SGroup = ({ title, icon: Icon, children, show=true }: any) => {
              if (!show) return null;

              // Avalia se pelo menos um item filho é visível para a função atual
              const hasVisibleChild = (nodes: any): boolean => {
                return Children.toArray(nodes).some((c: any) => {
                  if (!c) return false;
                  if (c.props?.show === false) return false;
                  // Se for um container wrapper (como div id="tour-profile-menu"), avalia recursivamente seus filhos
                  if (c.props?.children && typeof c.props.children !== "string") {
                    return hasVisibleChild(c.props.children);
                  }
                  return true;
                });
              };

              if (!hasVisibleChild(children)) {
                return null;
              }

              // MENU RETRAÍDO: Ícones limpos com destaque azul royal e legenda no hover
              if (!sidebarOpen) {
                return (
                  <div className="py-1.5 border-b border-slate-100/60 dark:border-white/5 last:border-0 flex flex-col items-center space-y-1 w-full">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button 
                          type="button"
                          onClick={() => setSidebarOpen(true)}
                          className="size-10 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all shadow-2xs hover:scale-105 cursor-pointer"
                        >
                          <Icon className="size-5 shrink-0" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold text-xs shadow-xl px-3 py-1.5 rounded-lg">
                        {title}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                );
              }

              // MENU EXPANDIDO NORMAL
              return (
                <details className="group [&_summary::-webkit-details-marker]:hidden" open>
                  <summary className="flex cursor-pointer items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 select-none">
                    <div className="flex items-center gap-2">
                      <Icon className="size-4" /> {title}
                    </div>
                    <ChevronRight className="size-4 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="mt-0.5 space-y-0.5 ml-1">
                    {children}
                  </div>
                </details>
              );
            };

                        // Helpers de Acesso:
            // Administrador (admin): Focado estritamente em ajustes e Painel de Controle do sistema.
            // Desenvolvedor (dev): Acesso amplo de manutenção.
            // Produtor (produtor): Gestor executivo completo das turnês, eventos e finanças.
            const isDev = userRole === 'dev';
            const isAdmin = userRole === 'admin' || isDev;
            const isProdutor = isDev || userRole === 'produtor';
            const isProdutorOuAss = isProdutor || userRole === 'assistente_producao';
            const isCoordLogistica = isProdutorOuAss || userRole === 'tour_manager';

            // Permissões específicas por setor:
            const canVerMalas = isCoordLogistica || userRole === 'cenotecnico' || userRole === 'roadie';
            const canVerEventos = isCoordLogistica;
            const canVerCamarinsEFigurinos = isProdutorOuAss || userRole === 'contra_regra' || userRole === 'stage_manager' || userRole === 'camareiro';
            const canVerMontagemPalco = isProdutorOuAss || userRole === 'musico' || userRole === 'tecnico_som' || userRole === 'iluminador' || userRole === 'tecnico_video' || userRole === 'cenotecnico' || userRole === 'roadie' || userRole === 'contra_regra' || userRole === 'stage_manager' || userRole === 'rigger';
            const canVerCatering = isProdutorOuAss || userRole === 'stage_manager' || userRole === 'camareiro';

            const canVerMusicas = isProdutor || userRole === 'musico' || userRole === 'stage_manager';
            const canVerPartituras = isProdutor || userRole === 'musico' || userRole === 'stage_manager' || userRole === 'rigger' || userRole === 'camareiro' || userRole === 'motorista' || userRole === 'assessoria_imprensa' || userRole === 'midias_sociais';
            const canVerLuz = isProdutor || userRole === 'iluminador' || userRole === 'stage_manager';
            const canVerSom = isProdutor || userRole === 'tecnico_som' || userRole === 'stage_manager';
            const canVerVideo = isProdutor || userRole === 'tecnico_video' || userRole === 'stage_manager';

            const canVerContatos = isCoordLogistica || userRole === 'stage_manager';
            const canVerDadosEquipe = isCoordLogistica;

            // Pranchetas de Checklist por setor (Produtor só vê na Produção Executiva)
            const canPranchetaTecnica = !isProdutor && (userRole === 'tecnico_som' || userRole === 'iluminador' || userRole === 'tecnico_video' || userRole === 'stage_manager');
            const canPranchetaBackstage = !isProdutor && (userRole === 'camareiro' || userRole === 'cenotecnico' || userRole === 'contra_regra' || userRole === 'stage_manager');
            const canPranchetaProdutor = isProdutor;

            return (
              <>
                {/* 1. Meu Espaço */}
                <SGroup title="Meu Espaço" icon={Contact2} show={userRole !== "admin"}>
                  <SLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                  <SLink to="/minha-agenda" icon={Calendar} label="Minha Agenda" />
                  <div id="tour-profile-menu"><SLink to="/perfil" icon={UserPlus} label="Dados Cadastrais" /></div>
                  <SLink to="/minhas-escalas" icon={Calendar} label="Minhas Escalas" />
                  <SLink to="/meus-pagamentos" icon={Wallet} label="Meus Pagamentos" />
                  <SLink to="/notificacoes" icon={Bell} label="Notificações" />
                </SGroup>

                {/* 2. Viagens e Logística */}
                <SGroup title="Viagens e Logística" icon={Bus} show={userRole !== "admin"}>
                  <SLink to="/viagens" icon={Bus} label="Guias de Viagem" />
                  <SLink to="/tour" icon={RouteIcon} label="Turnês" />
                  <SLink to="/malas" icon={Luggage} label="Malas e Cases" show={canVerMalas} />
                  <SLink to="/hospedagem" icon={Hotel} label="Hospedagem" show={isProdutorOuAss} />
                </SGroup>

                {/* 3. Produção Executiva */}
                <SGroup title="Produção Executiva" icon={ClipboardList}>
                  <SLink to="/novo-projeto" icon={Sparkles} label="Maestro de Produção" show={isProdutor} />
                  <SLink to="/eventos" icon={Calendar} label="Eventos e Apresentações" show={canVerEventos} />
                  <SLink to="/checklist" icon={CheckSquare} label="Prancheta Produtor" show={canPranchetaProdutor} />
                  <SLink to="/espetaculos" icon={Music} label="Catálogo de Espetáculos" show={isProdutor} />
                  <SLink to="/padroes" icon={Layers} label="Padrões de Espetáculo" show={isProdutor} />
                  <SLink to="/financeiro" icon={Wallet} label="Financeiro" show={isProdutor} />
                  <SLink to="/vendas" icon={ShoppingCart} label="Controle de Vendas" show={isProdutor} />
                  <SLink to="/publico" icon={Users} label="Público" show={isProdutorOuAss} />
                  <SLink to="/emissao-relatorios" icon={Printer} label="Emissão de Relatórios" show={isProdutor} />
                  <SLink to="/fornecedores" icon={Contact2} label="Diretório de Fornecedores" show={isProdutorOuAss} />
                  <SLink to="/contratos" icon={FileSignature} label="Gestão de Contratos" show={isProdutor} />
                </SGroup>

                {/* 4. Backstage */}
                <SGroup title="Backstage" icon={DoorOpen}>
                  <SLink to="/camarins" icon={StarDoorIcon} label="Camarins" show={canVerCamarinsEFigurinos} />
                  <SLink to="/palco" icon={StageIcon} label="Montagem de Palco" show={canVerMontagemPalco} />
                  <SLink to="/catering" icon={Coffee} label="Catering" show={canVerCatering} />
                  <SLink to="/figurinos" icon={ClothesRackIcon} label="Figurinos" show={canVerCamarinsEFigurinos} />
                  <SLink to="/checklist" icon={CheckSquare} label="Prancheta de Backstage" show={canPranchetaBackstage} />
                </SGroup>

                {/* 5. Técnica e Artístico */}
                <SGroup title="Técnica e Artístico" icon={Drama}>
                  <SLink to="/musicas" icon={FileAudio} label="Músicas" show={canVerMusicas} />
                  <SLink to="/partituras" icon={Music} label="Partituras" show={canVerPartituras} />
                  <SLink to="/iluminacao" icon={Lightbulb} label="Iluminação" show={canVerLuz} />
                  <SLink to="/som" icon={Mic2} label="Áudio / Som" show={canVerSom} />
                  <SLink to="/som-operacao" icon={Play} label="Operação de Som" show={canVerSom} />
                  <SLink to="/video" icon={Video} label="Vídeo" show={canVerVideo} />
                  <SLink to="/checklist" icon={CheckSquare} label="Prancheta Técnica" show={canPranchetaTecnica} />
                </SGroup>

                {/* 6. Equipe e RH */}
                <SGroup title="Equipe e RH" icon={Users}>
                  <SLink to="/escalas" icon={Users} label="Painel de Escalas" show={isProdutor} />
                  <SLink to="/contatos" icon={Contact2} label="Contatos da Equipe" show={canVerContatos} />
                  <SLink to="/dados-equipe" icon={Users} label="Dados da Equipe" show={canVerDadosEquipe} />
                  <SLink to="/cadastros" icon={UserPlus} label="Cadastros de Equipe" show={isAdmin || isProdutor} />
                </SGroup>

                {/* 7. Comunicação e Mídia */}
                <SGroup title="Comunicação e Mídia" icon={Smartphone}>
                  <SLink to="/imprensa" icon={Newspaper} label="Imprensa" show={isProdutor || userRole === 'assessoria_imprensa'} />
                  <SLink to="/fotos" icon={ImageIcon} label="Fotos" show={isProdutor || userRole === 'midias_sociais'} />
                  <SLink to="/midias" icon={Smartphone} label="Mídias Sociais" show={isProdutor || userRole === 'midias_sociais'} />
                  <SLink to="/divulgacoes" icon={Megaphone} label="Divulgações Redes Sociais" show={isProdutor || userRole === 'midias_sociais'} />
                </SGroup>

                {/* 8. Gestão de Ingressos */}
                <SGroup title="Gestão de Ingressos" icon={Ticket}>
                  <SLink to="/ingressos/mapa" icon={Ticket} label="Mapa de Assentos" show={isProdutorOuAss} />
                  <SLink to="/ingressos/emissao" icon={QrCode} label="Emissão de Ingressos" show={isProdutor} />
                  <SLink to="/ingressos/validacao" icon={ShieldCheck} label="Validação / Portaria" show={isProdutorOuAss} />
                </SGroup>

                {/* 9. Painel de Controle */}
                <SGroup title="Painel de Controle" icon={Settings2}>
                  <SLink to="/configuracoes" icon={Settings} label="Configurações" show={isAdmin || isProdutor} />
                  <SLink to="/ajuda" icon={HelpCircle} label="Central de Ajuda" />
                  <SLink to="/sobre" icon={Info} label="Sobre o Sistema" />
                </SGroup>
              </>
            );

          })()}
        </div>
        {/* BOTÃO DO SIMULADOR (DEV) */}
        {realProfile?.role === 'dev' && (
          <div className="px-2 pb-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  type="button"
                  onClick={loadUsersToSimulate} 
                  className={`w-full flex items-center ${sidebarOpen ? 'justify-start px-3' : 'justify-center px-0'} h-9 rounded-xl text-slate-500 dark:text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-500/10 dark:hover:text-sky-400 font-bold transition-all`}
                >
                  <Users className={`size-4.5 ${sidebarOpen ? 'mr-2.5' : ''}`} />
                  {sidebarOpen && <span className="text-xs">Simulador de Acesso</span>}
                </button>
              </TooltipTrigger>
              {!sidebarOpen && (
                <TooltipContent side="right" className="bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold text-xs shadow-xl px-3 py-1.5 rounded-lg">
                  Simulador de Acesso
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        )}

        {/* RODAPÉ: SAIR E MODO ESCURO/CLARO */}
        <div className="p-2 border-t border-slate-200/60 dark:border-white/10 space-y-1">
        
          {/* SAIR DA CONTA (LOGOFF) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                type="button"
                onClick={signOut} 
                className={`w-full flex items-center ${sidebarOpen ? 'justify-start px-3' : 'justify-center px-0'} h-9 rounded-xl text-slate-500 dark:text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-500/10 dark:hover:text-sky-400 font-medium transition-all`}
              >
                <LogOut className={`size-4.5 ${sidebarOpen ? 'mr-2.5' : ''}`} />
                {sidebarOpen && <span className="text-xs">Sair da Conta</span>}
              </button>
            </TooltipTrigger>
            {!sidebarOpen && (
              <TooltipContent side="right" className="bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold text-xs shadow-xl px-3 py-1.5 rounded-lg">
                Sair da Conta
              </TooltipContent>
            )}
          </Tooltip>

          {/* MODO ESCURO / CLARO */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                type="button"
                onClick={toggleTheme} 
                className={`w-full flex items-center ${sidebarOpen ? 'justify-start px-3' : 'justify-center px-0'} h-9 rounded-xl border border-slate-200/80 dark:border-white/10 hover:border-sky-500 hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-500/10 dark:hover:text-sky-400 text-slate-600 dark:text-slate-300 transition-all`}
              >
                {theme === "light" ? (
                  <>
                    <Moon className={`size-4.5 text-indigo-500 ${sidebarOpen ? 'mr-2.5' : ''}`} />
                    {sidebarOpen && <span className="text-xs font-semibold text-slate-700">Modo Escuro</span>}
                  </>
                ) : (
                  <>
                    <Sun className={`size-4.5 text-amber-500 ${sidebarOpen ? 'mr-2.5' : ''}`} />
                    {sidebarOpen && <span className="text-xs font-semibold text-slate-200">Modo Claro</span>}
                  </>
                )}
              </button>
            </TooltipTrigger>
            {!sidebarOpen && (
              <TooltipContent side="right" className="bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold text-xs shadow-xl px-3 py-1.5 rounded-lg">
                {theme === "light" ? "Mudar para Modo Escuro" : "Mudar para Modo Claro"}
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </TooltipProvider></aside>

      {/* MOBILE TOGGLE (quando fechado) */}
      {!sidebarOpen && (
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setSidebarOpen(true)} 
          className="md:hidden fixed left-0 top-6 z-40 rounded-r-xl rounded-l-none border-l-0 shadow-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-md h-10 w-8"
        >
          <ChevronRight className="size-5" />
        </Button>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-0 md:ml-[14.25rem]' : 'ml-0 md:ml-20'} p-4 sm:p-6 md:p-8 xl:p-12 w-full max-w-[100vw] print:m-0 print:p-0`}>
        <Outlet />
      </main>
      {/* SIMULADOR DIALOG */}
      <Dialog open={simuladorOpen} onOpenChange={setSimuladorOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Simular Acesso</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {usersToSimulate.map(u => (
              <div key={u.id} onClick={() => startSimulation(u)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer border">
                <Avatar className="size-8">
                  <AvatarImage src={u.foto_url || undefined} />
                  <AvatarFallback>{u.nome ? u.nome[0] : 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-bold text-sm">{u.nome}</span>
                  <span className="text-xs text-slate-500">{u.role}</span>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
