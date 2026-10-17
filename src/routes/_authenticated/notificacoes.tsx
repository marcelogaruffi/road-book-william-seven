import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, BellOff, Check, CheckCircle2, ChevronRight, Clock, Info, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Route as AuthedRoute } from "./route";

export const Route = createFileRoute("/_authenticated/notificacoes")({
  head: () => ({ meta: [{ title: "Central de Notificações - Áxis" }] }),
  component: NotificacoesPage,
});

type Notificacao = {
  id: string;
  titulo: string;
  mensagem: string;
  link: string | null;
  lida: boolean;
  tipo: string | null;
  created_at: string;
};

function NotificacoesPage() {
  const { profile } = AuthedRoute.useRouteContext();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      loadNotificacoes();

      const channel = supabase
        .channel(`central_notificacoes_${profile.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notificacoes',
            filter: `usuario_id=eq.${profile.id}`
          },
          () => {
            loadNotificacoes();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile]);

  async function loadNotificacoes() {
    setLoading(true);
    const { data, error } = await supabase
      .from("notificacoes")
      .select("*")
      .eq("usuario_id", profile.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setNotificacoes(data as Notificacao[]);
    }
    setLoading(false);
  }

  async function markAsRead(id: string) {
    const { error } = await supabase.from("notificacoes").update({ lida: true }).eq("id", id);
    if (!error) {
      setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
    }
  }

  async function markAllAsRead() {
    const ids = notificacoes.filter(n => !n.lida).map(n => n.id);
    if (ids.length === 0) return;
    
    const { error } = await supabase.from("notificacoes").update({ lida: true }).in("id", ids);
    if (!error) {
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
      toast.success("Todas as notificações marcadas como lidas");
    }
  }

  async function deleteNotificacao(id: string) {
    const { error } = await supabase.from("notificacoes").delete().eq("id", id);
    if (!error) {
      setNotificacoes(prev => prev.filter(n => n.id !== id));
      toast.success("Notificação apagada");
    }
  }

  async function clearAll() {
    if (!confirm("Tem certeza que deseja apagar TODAS as notificações?")) return;
    const { error } = await supabase.from("notificacoes").delete().eq("usuario_id", profile.id);
    if (!error) {
      setNotificacoes([]);
      toast.success("Todas as notificações apagadas");
    }
  }

  const unreadCount = notificacoes.filter(n => !n.lida).length;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 pt-6 mb-16 md:mb-0 space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <div className="relative">
              <Bell className="size-8 text-primary" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] font-bold text-white items-center justify-center">
                    {unreadCount}
                  </span>
                </span>
              )}
            </div>
            Central de Notificações
          </h1>
          <p className="text-slate-500 mt-1">Acompanhe seus alertas, pagamentos e atualizações do sistema.</p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead} className="gap-2">
              <CheckCircle2 className="size-4 text-emerald-500" />
              Marcar tudo como lido
            </Button>
          )}
          {notificacoes.length > 0 && (
            <Button variant="ghost" onClick={clearAll} className="gap-2 text-red-500 hover:text-red-600 hover:bg-red-50">
              <Trash2 className="size-4" />
              Limpar Tudo
            </Button>
          )}
        </div>
      </div>

      <Card className="border-0 shadow-xl overflow-hidden rounded-3xl dark:bg-card/80">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              Buscando notificações...
            </div>
          ) : notificacoes.length === 0 ? (
            <div className="p-16 text-center text-slate-500 flex flex-col items-center">
              <BellOff className="size-16 mb-4 text-slate-300 dark:text-slate-700" />
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Tudo limpo por aqui!</h3>
              <p>Você não tem nenhuma notificação no momento.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {notificacoes.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-4 md:p-6 transition-colors hover:bg-slate-50 dark:hover:bg-white/5 flex gap-4 ${notif.lida ? 'opacity-70' : 'bg-primary/5'}`}
                >
                  <div className="shrink-0 mt-1">
                    {!notif.lida ? (
                      <div className="h-2.5 w-2.5 bg-red-500 rounded-full mt-1.5 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse" />
                    ) : (
                      <Check className="size-5 text-slate-300" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {notif.tipo && (
                        <Badge variant="outline" className={`text-xs ${notif.tipo === 'financeiro' ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : 'border-blue-200 text-blue-600 bg-blue-50'}`}>
                          {notif.tipo.toUpperCase()}
                        </Badge>
                      )}
                      <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                        <Clock className="size-3" />
                        {format(new Date(notif.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    
                    <h4 className={`text-base md:text-lg mb-1 ${!notif.lida ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                      {notif.titulo}
                    </h4>
                    
                    <p className={`text-sm md:text-base text-slate-600 dark:text-slate-400 ${notif.link ? 'mb-3' : ''}`}>
                      {notif.mensagem}
                    </p>
                    
                    {notif.link && (
                      <Link 
                        to={notif.link}
                        onClick={() => markAsRead(notif.id)}
                        className="inline-flex items-center text-sm font-bold text-primary hover:text-primary/80 transition-colors"
                      >
                        Acessar detalhes <ChevronRight className="size-4 ml-1" />
                      </Link>
                    )}
                  </div>

                  <div className="shrink-0 flex flex-col items-end justify-between">
                    <Button variant="ghost" size="icon" onClick={() => deleteNotificacao(notif.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full">
                      <Trash2 className="size-4" />
                    </Button>
                    {!notif.lida && !notif.link && (
                      <Button variant="ghost" size="sm" onClick={() => markAsRead(notif.id)} className="text-xs text-slate-500 h-8 mt-4">
                        Marcar lida
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
