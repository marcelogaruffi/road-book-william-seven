import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { 
  ChevronLeft, ChevronRight, LayoutDashboard, Route as RouteIcon, 
  Ticket, Settings, Sun, Moon, LogOut, Wallet 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Profile = {
  id: string;
  nome: string;
  foto_url: string | null;
  role: "admin" | "user";
};

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) throw redirect({ to: "/auth" });
    
    // Buscar perfil do usuário
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    return { 
      user: authData.user,
      profile: profile as Profile | null
    };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const navigate = useNavigate();
  const { user, profile } = Route.useRouteContext();
  const [sidebarOpen, setSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  const [theme, setTheme] = useState<"light" | "dark">("light");

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
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  const userName = profile?.nome || user.user_metadata?.full_name || "Usuário";
  const userRole = profile?.role || "user";
  const fotoUrl = profile?.foto_url;

  return (
    <div className="flex min-h-screen bg-slate-50/50 dark:bg-background transition-colors duration-500 overflow-x-hidden">
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
                  {userRole === 'dev' ? 'Desenvolvedor' : 
                   userRole === 'admin' ? 'Master Admin' : 
                   userRole === 'produtor' ? 'Produtor' : 
                   userRole === 'iluminador' ? 'Iluminador' : 
                   userRole === 'motorista' ? 'Motorista' : 'Usuário'}
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

        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
          <Button asChild variant="ghost" className={`w-full justify-start ${sidebarOpen ? 'px-4' : 'px-0 justify-center'} h-12 bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:text-primary-foreground font-semibold rounded-xl`}>
             <Link to="/dashboard">
               <LayoutDashboard className={`size-5 ${sidebarOpen ? 'mr-3' : ''}`} />
               {sidebarOpen && <span>Dashboard</span>}
             </Link>
          </Button>
          <Button asChild variant="ghost" className={`w-full justify-start ${sidebarOpen ? 'px-4' : 'px-0 justify-center'} h-12 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 font-medium rounded-xl transition-colors`}>
             <Link to="/dashboard" hash="turnes">
               <RouteIcon className={`size-5 ${sidebarOpen ? 'mr-3' : ''}`} />
               {sidebarOpen && <span>Turnês</span>}
             </Link>
          </Button>
          <Button asChild variant="ghost" className={`w-full justify-start ${sidebarOpen ? 'px-4' : 'px-0 justify-center'} h-12 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 font-medium rounded-xl transition-colors`}>
             <Link to="/dashboard" hash="roadbooks">
               <Ticket className={`size-5 ${sidebarOpen ? 'mr-3' : ''}`} />
               {sidebarOpen && <span>Road Books</span>}
             </Link>
          </Button>
          <Button asChild variant="ghost" className={`w-full justify-start ${sidebarOpen ? 'px-4' : 'px-0 justify-center'} h-12 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 font-medium rounded-xl transition-colors`}>
             <Link to="/publico">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`size-5 ${sidebarOpen ? 'mr-3' : ''}`}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
               {sidebarOpen && <span>Público</span>}
             </Link>
          </Button>
            {(userRole === 'admin' || userRole === 'dev') && (
              <Button asChild variant="ghost" className={`w-full justify-start ${sidebarOpen ? 'px-4' : 'px-0 justify-center'} h-12 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 font-medium rounded-xl transition-colors`}>
                 <Link to="/financeiro">
                   <Wallet className={`size-5 ${sidebarOpen ? 'mr-3' : ''}`} />
                   {sidebarOpen && <span>Financeiro</span>}
                 </Link>
              </Button>
            )}

          
          {(userRole === 'admin' || userRole === 'dev') && (
            <Button asChild variant="ghost" className={`w-full justify-start ${sidebarOpen ? 'px-4' : 'px-0 justify-center'} h-12 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 font-medium rounded-xl transition-colors`}>
               <Link to="/users">
                 <Settings className={`size-5 ${sidebarOpen ? 'mr-3' : ''}`} />
                 {sidebarOpen && <span>Equipe</span>}
               </Link>
            </Button>
          )}
        </div>

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
    </div>
  );
}
