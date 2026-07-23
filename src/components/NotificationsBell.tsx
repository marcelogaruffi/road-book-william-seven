import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type Notificacao = {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  link: string | null;
  created_at: string;
};

export function NotificationsBell({ profile }: { profile: any }) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile) return;

    fetchNotificacoes();

    const sub = supabase
      .channel('notificacoes-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notificacoes',
          filter: `usuario_id=eq.${profile.id}`
        },
        () => {
          fetchNotificacoes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [profile]);

  async function fetchNotificacoes() {
    if (!profile) return;
    const { data } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('usuario_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (data) {
      setNotificacoes(data);
      setUnreadCount(data.filter(n => !n.lida).length);
    }
  }

  async function markAsRead(id: string) {
    await supabase.from('notificacoes').update({ lida: true }).eq('id', id);
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }

  async function markAllAsRead() {
    const unreadIds = notificacoes.filter(n => !n.lida).map(n => n.id);
    if (unreadIds.length === 0) return;
    
    await supabase.from('notificacoes').update({ lida: true }).in('id', unreadIds);
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
    setUnreadCount(0);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-slate-100 dark:hover:bg-white/10 shrink-0 h-10 w-10">
          <Bell className="size-5 text-slate-600 dark:text-slate-300" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 size-2.5 bg-red-500 rounded-full animate-pulse border-2 border-slate-50 dark:border-slate-900" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0 rounded-xl shadow-xl overflow-hidden border-slate-200 dark:border-white/10" sideOffset={10}>
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="font-bold text-sm">Notificações</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto px-2 py-1 text-[10px] text-primary">
              Marcar lidas
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {notificacoes.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              Nenhuma notificação por enquanto.
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/5">
              {notificacoes.map(notif => (
                <div 
                  key={notif.id} 
                  className={`p-4 transition-colors hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer ${!notif.lida ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                  onClick={() => {
                    if (!notif.lida) markAsRead(notif.id);
                    if (notif.link) window.location.href = notif.link;
                  }}
                >
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h4 className={`text-sm ${!notif.lida ? 'font-bold text-indigo-900 dark:text-indigo-200' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                      {notif.titulo}
                    </h4>
                    {!notif.lida && <span className="size-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-2">
                    {notif.mensagem}
                  </p>
                  <span className="text-[10px] font-medium text-slate-400">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
