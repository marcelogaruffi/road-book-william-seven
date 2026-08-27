import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { 
  ChevronLeft, ChevronRight, LayoutDashboard, Calendar, Lightbulb, Mic2, Route as RouteIcon, 
  Ticket, Settings, Sun, Moon, LogOut, Wallet, UserPlus, ClipboardList, Banknote,
  LayoutTemplate, Drama, DoorOpen, Video, Music, Bus, Newspaper, Smartphone, ShoppingCart, CheckSquare, PlusCircle, Play
} from "lucide-react";
import { ROLE_BADGE_MAP } from "./cadastros";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Contact2 } from "lucide-react";
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
  const navigate = useNavigate();
  const { user, profile, realProfile, isSimulating } = Route.useRouteContext();
  const [sidebarOpen, setSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [simuladorOpen, setSimuladorOpen] = useState(false);
  const [usersToSimulate, setUsersToSimulate] = useState<Profile[]>([]);
  
  async function loadUsersToSimulate() {
    setSimuladorOpen(true);
    const { data } = await supabase.from('profiles').select('*').order('nome');
    if (data) setUsersToSimulate(data as Profile[]);
  }

  function startSimulation(u: Profile) {
    localStorage.setItem('simulated_profile', JSON.stringify(u));
    window.location.reload();
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
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen bg-slate-50/50 dark:bg-background transition-colors duration-500 overflow-x-hidden">
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
        className={`${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20'} fixed left-0 top-0 h-screen z-40 bg-white/80 dark:bg-card/80 md:dark:bg-card/40 backdrop-blur-xl border-r border-slate-200/60 dark:border-white/10 transition-all duration-300 flex flex-col print:hidden`}
      >
        <div className="flex h-20 items-center justify-between px-4 border-b border-slate-200/60 dark:border-white/10">
          {sidebarOpen ? (
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
          ) : (
            <Avatar className="size-10 mx-auto rounded-xl border border-slate-200 dark:border-white/10 shadow-sm shrink-0">
              <AvatarImage src={fotoUrl || undefined} alt={userName} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-tr from-primary to-purple-500 text-white font-bold rounded-xl text-sm">{getInitials(userName)}</AvatarFallback>
            </Avatar>
          )}
          
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className={`shrink-0 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 ${!sidebarOpen && 'hidden md:flex absolute -right-4 top-6 bg-white dark:bg-card border shadow-sm z-50 h-8 w-8'}`}>
            {sidebarOpen ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-4" />}
          </Button>
        </div>

        
        <div className="flex-1 overflow-y-auto py-6 px-2 space-y-2" onClick={closeMobileMenu}>
          
          {/* HELPERS FOR SIDEBAR */}
          {(() => {
            const SLink = ({ to, icon: Icon, label, show=true }: any) => {
              if (!show) return null;
              return (
                <Link to={to} className={`w-full flex items-center justify-start ${sidebarOpen ? 'px-4' : 'px-0 justify-center'} h-10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 text-sm font-medium rounded-xl transition-colors`} activeProps={{ className: "bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:text-primary-foreground font-semibold" }}>
                  <Icon className={`size-4 ${sidebarOpen ? 'mr-3' : ''}`} />
                  {sidebarOpen && <span>{label}</span>}
                </Link>
              );
            };

            const SGroup = ({ title, icon: Icon, children, show=true }: any) => {
              if (!show) return null;
              if (!sidebarOpen) {
                return (
                  <div className="py-2 border-b border-slate-100 dark:border-white/5 last:border-0 flex flex-col items-center space-y-1">
                    <div className="mb-2 text-slate-300 dark:text-slate-600"><Icon className="size-5" /></div>
                    {children}
                  </div>
                );
              }
              return (
                <details className="group [&_summary::-webkit-details-marker]:hidden" open>
                  <summary className="flex cursor-pointer items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 select-none">
                    <div className="flex items-center gap-2">
                      <Icon className="size-4" /> {title}
                    </div>
                    <ChevronRight className="size-4 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="mt-1 space-y-1 ml-2">
                    {children}
                  </div>
                </details>
              );
            };

            const isProdutor = userRole === 'admin' || userRole === 'dev' || userRole === 'produtor';

            return (
              <>
                <SGroup title="Meu Espaço" icon={Contact2}>
                  <SLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                  <SLink to="/perfil" icon={UserPlus} label="Dados Cadastrais" />
                  <SLink to="/minhas-escalas" icon={Calendar} label="Minhas Escalas" />
                  <SLink to="/meus-pagamentos" icon={Wallet} label="Meus Pagamentos" />
                </SGroup>

                <SGroup title="Produção" icon={ClipboardList}>
                  <SLink to="/eventos" icon={Calendar} label="Eventos e Shows" />
                  <SLink to="/viagens" icon={Bus} label="Guias de Viagem & Malas" />
                  <SLink to="/tour.new" icon={RouteIcon} label="Nova Turnê" show={isProdutor} />
                </SGroup>

                <SGroup title="Equipe" icon={Users}>
                  <SLink to="/contatos" icon={Contact2} label="Contatos da Equipe" />
                  <SLink to="/dados-equipe" icon={Users} label="Dados da Equipe" />
                </SGroup>

                <SGroup title="Artístico" icon={Drama}>
                  <SLink to="/partituras" icon={Music} label="Partituras e Músicas" />
                </SGroup>

                <SGroup title="Bastidores" icon={DoorOpen}>
                  <SLink to="/palco" icon={StageIcon} label="Montagem de Palco" />
                  <SLink to="/figurinos" icon={ClothesRackIcon} label="Figurinos" />
                  <SLink to="/camarins" icon={StarDoorIcon} label="Camarins" />
                </SGroup>

                <SGroup title="Técnica" icon={Settings}>
                  <SLink to="/iluminacao" icon={Lightbulb} label="Iluminação" />
                  <SLink to="/som" icon={Mic2} label="Áudio / Som" />
                  <SLink to="/som-operacao" icon={Play} label="Operação de Som" />
                  <SLink to="/video" icon={Video} label="Vídeo" />
                </SGroup>

                <SGroup title="Comunicação e Mídia" icon={Smartphone}>
                  <SLink to="/imprensa" icon={Newspaper} label="Imprensa" show={isProdutor || userRole === 'assessoria_imprensa'} />
                  <SLink to="/midias" icon={Smartphone} label="Mídias Sociais" show={isProdutor || userRole === 'midias_sociais'} />
                </SGroup>

                <SGroup title="Controles e Gestão" icon={Banknote}>
                  <SLink to="/publico" icon={Users} label="Público" show={isProdutor} />
                  <SLink to="/financeiro" icon={Wallet} label="Financeiro" show={userRole === 'admin' || userRole === 'dev'} />
                  <SLink to="/vendas" icon={ShoppingCart} label="Controle de Vendas" show={isProdutor} />
                  <SLink to="/escalas" icon={Users} label="Painel de Escalas" show={isProdutor} />
                  <SLink to="/checklist" icon={CheckSquare} label="Prancheta Produtor" show={isProdutor} />
                </SGroup>

                <SGroup title="Administração" icon={Settings} show={userRole === 'admin' || userRole === 'dev'}>
                  <SLink to="/espetaculos" icon={Music} label="Cadastro de Shows" />
                  <SLink to="/cadastros" icon={UserPlus} label="Cadastros de Equipe" />
                  <SLink to="/configuracoes" icon={Settings} label="Configurações" />
                </SGroup>
              </>
            );
          })()}
        </div>
        {realProfile?.role === 'dev' && (
            <Button variant="ghost" onClick={loadUsersToSimulate} className={`w-full justify-start ${sidebarOpen ? 'px-4' : 'px-0 justify-center'} h-12 text-slate-500 dark:text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-500/10 font-bold transition-colors`}>
               <Users className={`size-5 ${sidebarOpen ? 'mr-3' : ''}`} />
               {sidebarOpen && <span>Simulador de Acesso</span>}
            </Button>
          )}
        <div className="p-4 border-t border-slate-200/60 dark:border-white/10 space-y-3">
          <Button 
            variant="ghost" 
            onClick={signOut} 
            className={`w-full ${sidebarOpen ? 'justify-start px-4' : 'justify-center px-0'} h-12 rounded-xl text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 dark:hover:text-red-400 font-medium transition-colors`}
          >
             <LogOut className={`size-5 ${sidebarOpen ? 'mr-3' : ''}`} />
             {sidebarOpen && <span>Sair da Conta</span>}
          </Button>

          <Button 
            variant="outline" 
            onClick={toggleTheme} 
            className={`w-full ${sidebarOpen ? 'justify-start px-4' : 'justify-center px-0'} h-12 rounded-xl shadow-sm border-slate-200 dark:border-white/10 transition-all`}
          >
            {theme === "light" ? (
              <>
                <Moon className={`size-5 text-indigo-500 ${sidebarOpen ? 'mr-3' : ''}`} />
                {sidebarOpen && <span className="font-medium text-slate-700">Modo Escuro</span>}
              </>
            ) : (
              <>
                <Sun className={`size-5 text-amber-500 ${sidebarOpen ? 'mr-3' : ''}`} />
                {sidebarOpen && <span className="font-medium text-slate-200">Modo Claro</span>}
              </>
            )}
          </Button>
        </div>
      </aside>

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
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-0 md:ml-64' : 'ml-0 md:ml-20'} p-4 sm:p-6 md:p-8 xl:p-12 w-full max-w-[100vw] overflow-x-hidden print:m-0 print:p-0`}>
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
