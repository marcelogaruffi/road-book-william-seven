// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, CalendarDays, DollarSign, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Route as AuthedRoute } from "./route";

export const Route = createFileRoute("/_authenticated/minhas-escalas")({
  head: () => ({ meta: [{ title: "Minhas Escalas - Seven Produções Artísticas" }] }),
  component: MinhasEscalasPage,
});

function MinhasEscalasPage() {
  const { profile } = AuthedRoute.useRouteContext();
  const [escalas, setEscalas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!profile) return;
    setLoading(true);

    const { data: escalasData, error: errEscalas } = await supabase
      .from('evento_escalas')
      .select(`
        id,
        status,
        created_at,
        funcao,
        evento:evento_id(id, espetaculo, cidade, data, data_inicio, data_fim)
      `)
      .eq('usuario_id', profile.id)
      .order('created_at', { ascending: false });

    if (errEscalas) {
      toast.error("Erro ao buscar escalas");
      setLoading(false);
      return;
    }

    const escalaIds = (escalasData || []).map(e => e.id);
    let caches = [];
    if (escalaIds.length > 0) {
      const { data: cacheData } = await supabase
        .from('evento_escalas_financeiro')
        .select('escala_id, cache_valor')
        .in('escala_id', escalaIds);
      caches = cacheData || [];
    }

    const merged = (escalasData || []).map(esc => {
      const c = caches.find(x => x.escala_id === esc.id);
      return { ...esc, cache_valor: c ? c.cache_valor : 0 };
    });

    setEscalas(merged);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [profile]);

  const handleResponse = async (id: string, status: 'aceita' | 'recusada') => {
    const { error } = await supabase.from('evento_escalas').update({ status }).eq('id', id);
    if (error) {
      toast.error("Erro ao responder");
    } else {
      toast.success(status === 'aceita' ? "Escala Aceita!" : "Escala Recusada.");
      loadData();
      
      const esc = escalas.find(e => e.id === id);
      const { data: admins } = await supabase.from('profiles').select('id').in('role', ['admin', 'dev', 'produtor']);
      if (admins && esc) {
        const notificacoes = admins.map(admin => ({
          usuario_id: admin.id,
          tipo: 'resposta',
          titulo: `Escala ${status === 'aceita' ? 'Aceita' : 'Recusada'}`,
          mensagem: `${profile.nome} ${status === 'aceita' ? 'aceitou' : 'recusou'} a escala para ${esc.evento.espetaculo} em ${esc.evento.cidade}.`,
          link: '/escalas'
        }));
        await supabase.from('notificacoes').insert(notificacoes);
      }
    }
  };

  const hojeStr = new Date().toISOString().split('T')[0];
  const futuras = escalas.filter(esc => (esc.evento.data_fim || esc.evento.data) >= hojeStr);
  const anteriores = escalas.filter(esc => (esc.evento.data_fim || esc.evento.data) < hojeStr);

  const renderCard = (esc: any) => {
    const isPendente = esc.status === 'pendente';
    const isAceita = esc.status === 'aceita';
    const cache = Number(esc.cache_valor) || 0;
    const statusColor = isAceita ? 'bg-green-100 text-green-700' :
                        esc.status === 'recusada' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700';
                        
    return (
      <Card key={esc.id} className={`shadow-sm border-2 overflow-hidden flex flex-col ${isPendente ? 'border-yellow-400' : 'border-slate-100'}`}>
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
          <div className="flex justify-between items-start gap-2">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800 leading-tight">
                {esc.evento.espetaculo}
              </CardTitle>
              {esc.funcao && (
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md uppercase font-bold mt-1 inline-block">
                  {esc.funcao.replace('_', ' ')}
                </span>
              )}
            </div>
            <Badge variant="secondary" className={`${statusColor} shrink-0`}>
              {isAceita ? <CheckCircle2 className="size-3 mr-1" /> : esc.status === 'recusada' ? <XCircle className="size-3 mr-1" /> : <Clock className="size-3 mr-1" />}
              <span className="capitalize">{esc.status}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-3 flex-1">
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <MapPin className="size-4 shrink-0 text-primary/70" />
            <span>{esc.evento.cidade}</span>
          </div>
          <div className="flex items-start gap-2 text-slate-600 text-sm">
            <CalendarDays className="size-4 shrink-0 mt-0.5 text-primary/70" />
            <div className="flex flex-col gap-0.5">
              {esc.evento.data_inicio && <span><span className="font-semibold">Ida:</span> {format(new Date(esc.evento.data_inicio + 'T12:00:00Z'), "dd/MM/yyyy")}</span>}
              <span><span className="font-semibold">Apresentação:</span> {format(new Date(esc.evento.data + 'T12:00:00Z'), "dd/MM/yyyy")}</span>
              {esc.evento.data_fim && <span><span className="font-semibold">Volta:</span> {format(new Date(esc.evento.data_fim + 'T12:00:00Z'), "dd/MM/yyyy")}</span>}
            </div>
          </div>
          {cache > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cachê</span>
              <span className="text-lg font-extrabold text-green-600">R$ {cache.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
        </CardContent>
        {isPendente && (
          <CardFooter className="p-4 bg-yellow-50/50 gap-3 border-t border-yellow-100">
            <Button variant="outline" className="w-1/2 border-red-200 text-red-600" onClick={() => handleResponse(esc.id, 'recusada')}>Recusar</Button>
            <Button className="w-1/2 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleResponse(esc.id, 'aceita')}>Aceitar</Button>
          </CardFooter>
        )}
      </Card>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Minhas Escalas</h1>
        <p className="text-slate-500 mt-1">Acompanhe todos os eventos para os quais você foi designado.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Carregando suas escalas...</div>
      ) : escalas.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <CalendarDays className="size-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-bold text-slate-700">Nenhuma escala encontrada</h3>
        </div>
      ) : (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="size-2 rounded-full bg-green-500"></span> Escalas Futuras ({futuras.length})
            </h2>
            {futuras.length === 0 ? <p className="text-sm text-slate-500 bg-slate-50 p-4 rounded-xl">Não há escalas futuras.</p> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{futuras.map(renderCard)}</div>}
          </div>
          <div className="pt-6 border-t border-slate-200">
            <h2 className="text-xl font-bold text-slate-600 mb-4 flex items-center gap-2">
              <span className="size-2 rounded-full bg-slate-400"></span> Escalas Anteriores ({anteriores.length})
            </h2>
            {anteriores.length === 0 ? <p className="text-sm text-slate-500 bg-slate-50 p-4 rounded-xl">Nenhum evento anterior.</p> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">{anteriores.map(renderCard)}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
