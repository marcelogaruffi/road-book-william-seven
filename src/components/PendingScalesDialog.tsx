import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, MapPin } from "lucide-react";

type Pendente = {
  id: string;
  evento: {
    id: string;
    espetaculo: string;
    cidade: string;
    data: string;
    data_inicio: string | null;
    data_fim: string | null;
  }
};

export function PendingScalesDialog({ profile }: { profile: any }) {
  const [pendentes, setPendentes] = useState<Pendente[]>([]);
  const [current, setCurrent] = useState<Pendente | null>(null);

  useEffect(() => {
    if (!profile) return;

    fetchPendentes();

    const sub = supabase
      .channel('evento-escalas-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'evento_escalas',
          filter: `usuario_id=eq.${profile.id}`
        },
        () => {
          fetchPendentes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [profile]);

  async function fetchPendentes() {
    if (!profile) return;
    const { data } = await supabase
      .from('evento_escalas')
      .select('id, evento:evento_id(id, espetaculo, cidade, data, data_inicio, data_fim)')
      .eq('usuario_id', profile.id)
      .eq('status', 'pendente');
      
    if (data && data.length > 0) {
      setPendentes(data as any[]);
      setCurrent(data[0] as any);
    } else {
      setPendentes([]);
      setCurrent(null);
    }
  }

  async function handleResponse(status: 'aceita' | 'recusada') {
    if (!current || !profile) return;

    // Update status
    const { error } = await supabase
      .from('evento_escalas')
      .update({ status })
      .eq('id', current.id);

    if (error) {
      toast.error('Erro ao responder escala.');
      return;
    }

    toast.success(status === 'aceita' ? 'Escala aceita!' : 'Escala recusada.');

    // Notify admins
    const notificacoes = [];
    const { data: admins } = await supabase.from('profiles').select('id').in('role', ['admin', 'dev', 'produtor']);
    if (admins) {
      for (const admin of admins) {
        notificacoes.push({
          usuario_id: admin.id,
          tipo: 'resposta',
          titulo: `Escala ${status === 'aceita' ? 'Aceita' : 'Recusada'}`,
          mensagem: `${profile.nome} ${status === 'aceita' ? 'aceitou' : 'recusou'} a escala para ${current.evento.espetaculo} em ${current.evento.cidade}.`,
          link: '/escalas'
        });
      }
      await supabase.from('notificacoes').insert(notificacoes);
    }

    // Move to next pending
    const remaining = pendentes.filter(p => p.id !== current.id);
    setPendentes(remaining);
    if (remaining.length > 0) {
      setCurrent(remaining[0]);
    } else {
      setCurrent(null);
    }
    
    // Refresh page if accepted to show new events
    if (status === 'aceita') {
      window.location.reload();
    }
  }

  if (!current) return null;

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-xl">Nova Escala de Trabalho</DialogTitle>
          <DialogDescription>
            Você foi escalado para um novo evento. Por favor, confirme sua disponibilidade.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 my-4 space-y-3">
          <div className="font-bold text-lg text-primary">{current.evento.espetaculo}</div>
          
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <MapPin className="size-4" />
            <span>{current.evento.cidade}</span>
          </div>

          <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
            <CalendarDays className="size-4 mt-0.5" />
            <div className="flex flex-col text-sm">
              {current.evento.data_inicio && (
                <span><strong>Ida:</strong> {format(new Date(current.evento.data_inicio + 'T12:00:00Z'), "dd 'de' MMMM", { locale: ptBR })}</span>
              )}
              <span><strong>Apresentação:</strong> {format(new Date(current.evento.data + 'T12:00:00Z'), "dd 'de' MMMM", { locale: ptBR })}</span>
              {current.evento.data_fim && (
                <span><strong>Volta:</strong> {format(new Date(current.evento.data_fim + 'T12:00:00Z'), "dd 'de' MMMM", { locale: ptBR })}</span>
              )}
            </div>
          </div>
        </div>
        <DialogFooter className="flex gap-2 sm:justify-between w-full">
          <Button variant="destructive" className="w-full sm:w-1/2" onClick={() => handleResponse('recusada')}>
            Recusar
          </Button>
          <Button variant="default" className="w-full sm:w-1/2" onClick={() => handleResponse('aceita')}>
            Aceitar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
