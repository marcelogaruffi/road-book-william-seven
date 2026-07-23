// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, CalendarDays, User, Trash2, Lock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Route as AuthedRoute } from "./route";

export const Route = createFileRoute("/_authenticated/escalas")({
  head: () => ({ meta: [{ title: "Gestão de Escalas - Seven Produções Artísticas" }] }),
  component: EscalasPage,
});

function EscalasPage() {
  const { profile } = AuthedRoute.useRouteContext();
  const [escalas, setEscalas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const allowedRoles = ['admin', 'dev', 'produtor'];
  if (profile && !allowedRoles.includes(profile.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <Lock className="size-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300">Acesso Restrito</h2>
        <p className="text-slate-500 mt-2">Esta página é exclusiva para Administradores e Produtores.</p>
      </div>
    );
  }

  const loadData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('evento_escalas')
      .select(`
        id,
        status,
        created_at,
        evento:evento_id(id, espetaculo, cidade, data),
        funcao,
        usuario:usuario_id(id, nome, role)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Erro ao buscar escalas: " + getErrorMessage(error));
    } else {
      setEscalas(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover esta escala?")) return;
    
    const esc = escalas.find(e => e.id === id);
    if (!esc) return;
    
    const { error } = await supabase.from('evento_escalas').delete().eq('id', id);
    if (error) {
      toast.error("Erro ao deletar: " + getErrorMessage(error));
    } else {
      // Auto-remove from eventos.equipe
      if (esc.evento?.id && esc.usuario?.id) {
        const { data: evData } = await supabase.from('eventos').select('equipe').eq('id', esc.evento.id).single();
        if (evData && evData.equipe) {
          const novaEquipe = evData.equipe.filter((u: string) => u !== esc.usuario.id);
          await supabase.from('eventos').update({ equipe: novaEquipe }).eq('id', esc.evento.id);
        }
      }
      
      toast.success("Escala deletada com sucesso.");
      loadData();
    }
  };

  const filtered = escalas.filter(esc => {
    const term = searchTerm.toLowerCase();
    const eventName = (esc.evento?.espetaculo || '').toLowerCase();
    const city = (esc.evento?.cidade || '').toLowerCase();
    const userName = (esc.usuario?.nome || '').toLowerCase();
    return eventName.includes(term) || city.includes(term) || userName.includes(term) || esc.status.includes(term);
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Gestão de Escalas
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Acompanhe em tempo real quem aceitou, recusou ou ainda não respondeu aos eventos.
          </p>
        </div>
      </div>

      <Card className="shadow-lg border-slate-200/60 dark:border-white/10 rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/5 pb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input 
              placeholder="Buscar por nome, evento ou status..." 
              className="pl-9 bg-white dark:bg-black"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-b dark:border-white/10">
                <tr>
                  <th className="px-6 py-4 font-bold">Profissional</th>
                  <th className="px-6 py-4 font-bold">Evento & Local</th>
                  <th className="px-6 py-4 font-bold">Data</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Carregando escalas...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Nenhuma escala encontrada.</td>
                  </tr>
                ) : (
                  filtered.map(esc => {
                    const statusColor = esc.status === 'aceita' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400' :
                                        esc.status === 'recusada' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400' :
                                        esc.status === 'pendente' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                        'bg-slate-100 text-slate-700 border-slate-200';
                    const statusLabel = esc.status === 'aceita' ? 'Aceita' :
                                        esc.status === 'recusada' ? 'Recusada' :
                                        esc.status === 'pendente' ? 'Pendente' :
                                        'Desconhecido';

                    return (
                      <tr key={esc.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                              <User className="size-4 text-slate-500" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">{esc.usuario?.nome || 'Usuário Deletado'}</div>
                              <div className="text-[10px] uppercase font-semibold text-slate-400">{(esc.funcao || esc.usuario?.role || 'N/A').replace('_', ' ')}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-700 dark:text-slate-300">{esc.evento?.espetaculo}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="size-3" /> {esc.evento?.cidade}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                            <CalendarDays className="size-4 opacity-70" />
                            {esc.evento?.data ? format(new Date(esc.evento.data + 'T12:00:00Z'), "dd MMM, yyyy", { locale: ptBR }) : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={`border font-semibold ${statusColor}`}>
                            {statusLabel}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(esc.id)}
                            className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Deletar Escala"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
