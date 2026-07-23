import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, CalendarDays, MapPin, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Route as AuthedRoute } from "./route";

export const Route = createFileRoute("/_authenticated/meus-pagamentos")({
  head: () => ({ meta: [{ title: "Meus Pagamentos - Seven Produções Artísticas" }] }),
  component: MeusPagamentosPage,
});

function MeusPagamentosPage() {
  const { profile } = AuthedRoute.useRouteContext();
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!profile) return;
    setLoading(true);

    // 1. Fetch escalas do usuário que foram aceitas
    const { data: escalasData, error: errEscalas } = await supabase
      .from('evento_escalas')
      .select(`
        id,
        evento:evento_id(id, espetaculo, cidade, data)
      `)
      .eq('usuario_id', profile.id)
      .eq('status', 'aceita')
      .order('created_at', { ascending: false });

    if (errEscalas) {
      toast.error("Erro ao buscar escalas: " + getErrorMessage(errEscalas));
      setLoading(false);
      return;
    }

    const escalaIds = (escalasData || []).map(e => e.id);
    let caches = [];
    let pgtos = [];

    if (escalaIds.length > 0) {
      // 2. Fetch valores combinados (Cachês)
      const { data: cacheData } = await supabase
        .from('evento_escalas_financeiro')
        .select('*')
        .in('escala_id', escalaIds);
      caches = cacheData || [];

      // 3. Fetch pagamentos efetuados (Baixas)
      const { data: pgtoData } = await supabase
        .from('pagamentos')
        .select('*')
        .in('escala_id', escalaIds);
      pgtos = pgtoData || [];
    }

    // 4. Merge tudo
    const merged = (escalasData || []).map(esc => {
      const cacheObj = caches.find(c => c.escala_id === esc.id);
      const pgtoObj = pgtos.find(p => p.escala_id === esc.id);
      
      return {
        ...esc,
        valor_combinado: Number(cacheObj?.cache_valor) || 0,
        status_pagamento: cacheObj?.status_pagamento || 'pendente',
        valor_pago: Number(pgtoObj?.valor) || 0,
        data_pagamento: pgtoObj?.data_pagamento || null
      };
    });

    setPagamentos(merged);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [profile]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
          <Wallet className="size-8 text-primary" />
          Meus Pagamentos
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Acompanhe os cachês combinados e pagamentos efetuados dos eventos em que você participou.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-500">Carregando pagamentos...</div>
        ) : pagamentos.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white dark:bg-card/50 rounded-2xl border border-slate-200 dark:border-white/10">
            Você ainda não possui cachês ou pagamentos registrados.
          </div>
        ) : (
          pagamentos.map(item => (
            <Card key={item.id} className="shadow-sm hover:shadow-md transition-shadow border-slate-200/60 dark:border-white/10 overflow-hidden group">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 pb-4 border-b border-slate-100 dark:border-white/5 relative">
                <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                  {item.evento?.espetaculo || 'Evento'}
                </CardTitle>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2 font-medium">
                  <MapPin className="size-3.5" /> {item.evento?.cidade || 'Cidade não definida'}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 font-medium">
                  <CalendarDays className="size-3.5" /> {item.evento?.data ? format(new Date(item.evento.data + 'T12:00:00Z'), "dd 'de' MMMM", { locale: ptBR }) : 'Data Indefinida'}
                </div>
              </CardHeader>
              
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-sm font-medium text-slate-500">Cachê do Evento:</span>
                  <span className="text-base font-bold text-slate-800 dark:text-slate-200">
                    R$ {item.valor_combinado.toFixed(2)}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Status:</span>
                    {item.status_pagamento === 'pago' ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <CheckCircle2 className="size-3 mr-1" /> Pago
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
                        <Clock className="size-3 mr-1" /> Pendente
                      </Badge>
                    )}
                  </div>
                  
                  {item.status_pagamento === 'pago' && (
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 mt-2 border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">Valor Pago:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">R$ {item.valor_pago.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Data da Baixa:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {item.data_pagamento ? format(new Date(item.data_pagamento), "dd/MM/yyyy HH:mm") : '-'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
