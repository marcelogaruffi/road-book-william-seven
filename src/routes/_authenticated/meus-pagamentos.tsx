import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, CalendarDays, MapPin, CheckCircle2, Clock, FileText, Upload, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Route as AuthedRoute } from "./route";

export const Route = createFileRoute("/_authenticated/meus-pagamentos")({
  head: () => ({ meta: [{ title: "Meus Pagamentos - Seven Produções Artísticas" }] }),
  component: MeusPagamentosPage,
});

function MeusPagamentosPage() {
  const { profile } = AuthedRoute.useRouteContext();
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const loadData = async () => {
    if (!profile) return;
    setLoading(true);

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
      toast.error("Erro ao buscar escalas: " + errEscalas.message);
      setLoading(false);
      return;
    }

    const escalaIds = (escalasData || []).map(e => e.id);
    let caches = [];
    let pgtos = [];

    if (escalaIds.length > 0) {
      const { data: cacheData } = await supabase
        .from('evento_escalas_financeiro')
        .select('*')
        .in('escala_id', escalaIds);
      caches = cacheData || [];

      const { data: pgtoData } = await supabase
        .from('pagamentos')
        .select('*')
        .in('escala_id', escalaIds);
      pgtos = pgtoData || [];
    }

    const merged = (escalasData || []).map(esc => {
      const cacheObj = caches.find(c => c.escala_id === esc.id);
      const pgtoObj = pgtos.find(p => p.escala_id === esc.id);
      
      return {
        ...esc,
        valor_combinado: Number(cacheObj?.cache_valor) || 0,
        status_pagamento: cacheObj?.status_pagamento || 'pendente',
        nota_fiscal_url: cacheObj?.nota_fiscal_url || null,
        recibo_url: cacheObj?.recibo_url || null,
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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, escalaId: string) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(prev => ({ ...prev, [escalaId]: true }));
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${escalaId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('notas_fiscais')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('notas_fiscais')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('evento_escalas_financeiro')
        .upsert({
          escala_id: escalaId,
          nota_fiscal_url: publicUrl
        }, { onConflict: 'escala_id' });

      if (updateError) throw updateError;

      toast.success("Nota Fiscal anexada com sucesso!");
      loadData();
    } catch (error: any) {
      toast.error("Erro ao fazer upload da NF.");
      console.error(error);
    } finally {
      setUploading(prev => ({ ...prev, [escalaId]: false }));
    }
  }

  async function handleDeleteFile(escalaId: string, tipo: 'nota_fiscal_url' | 'recibo_url') {
    if (!confirm(`Tem certeza que deseja excluir este arquivo?`)) return;
    try {
      const { error } = await supabase.from('evento_escalas_financeiro').update({ [tipo]: null }).eq('escala_id', escalaId);
      if (error) throw error;
      
      toast.success(tipo === 'nota_fiscal_url' ? "Nota fiscal removida!" : "Recibo removido!");
      loadData();
    } catch (err) {
      toast.error("Erro ao remover arquivo.");
    }
  }

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
            <Card key={item.id} className="flex flex-col shadow-sm hover:shadow-md transition-shadow border-slate-200/60 dark:border-white/10 overflow-hidden group">
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
              
              <CardContent className="p-0 flex-1 flex flex-col">
                <div className="p-5 flex-1 space-y-4">
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
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 justify-between">
                    <span className="text-sm font-semibold text-slate-500">Nota Fiscal:</span>
                    <div className="flex items-center gap-2">
                      {item.nota_fiscal_url && (
                        <>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-blue-600 border-blue-200" asChild>
                            <a href={item.nota_fiscal_url} target="_blank" rel="noopener noreferrer">
                              <FileText className="size-4" />
                            </a>
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-500 border-red-200 hover:bg-red-50" onClick={() => handleDeleteFile(item.id, 'nota_fiscal_url')}>
                            <Trash2 className="size-4" />
                          </Button>
                        </>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-xs" 
                        onClick={() => fileInputRefs.current[item.id]?.click()}
                        disabled={uploading[item.id]}
                      >
                        {uploading[item.id] ? <Loader2 className="size-3 animate-spin mr-1" /> : <Upload className="size-3 mr-1" />}
                        {item.nota_fiscal_url ? 'Trocar NF' : 'Anexar NF'}
                      </Button>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".pdf"
                        ref={el => fileInputRefs.current[item.id] = el}
                        onChange={(e) => handleFileUpload(e, item.id)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-between">
                    <span className="text-sm font-semibold text-slate-500">Recibo:</span>
                    {item.recibo_url ? (
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" className="h-8 text-xs bg-white text-green-600 border-green-200 hover:bg-green-50" asChild>
                          <a href={item.recibo_url} target="_blank" rel="noopener noreferrer">
                            <FileText className="size-3 mr-1" /> Ver Recibo
                          </a>
                        </Button>
                        {(profile?.role === 'admin' || profile?.role === 'dev') && (
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-500 border-red-200 hover:bg-red-50" onClick={() => handleDeleteFile(item.id, 'recibo_url')}>
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Não anexado</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
