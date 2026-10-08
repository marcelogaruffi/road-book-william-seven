import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";
import { Upload, FileText, Trash2, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


interface NotasBoletosTabProps {
  roadbookId: string;
}

const formatCurrency = (val: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

export function NotasBoletosTab({ roadbookId }: NotasBoletosTabProps) {
  const [loading, setLoading] = useState(false);
  const [equipeNotas, setEquipeNotas] = useState<any[]>([]);
  const [eventNotas, setEventNotas] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  // Novo boleto/nota
  const [novoNome, setNovoNome] = useState("");
  const [novoValor, setNovoValor] = useState("");
  const [novoArquivo, setNovoArquivo] = useState<File | null>(null);

  useEffect(() => {
    if (roadbookId) fetchData();
  }, [roadbookId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch evento_id for this roadbook
      const { data: rbData } = await supabase.from('roadbooks').select('evento_id, cidade, espetaculo').eq('id', roadbookId).maybeSingle();
      if (!rbData) return;
      
      let realEventoId = rbData.evento_id;
      if (!realEventoId && rbData.cidade && rbData.espetaculo) {
          const { data: evData } = await supabase.from('eventos').select('id').eq('cidade', rbData.cidade).eq('espetaculo', rbData.espetaculo).maybeSingle();
          if (evData) realEventoId = evData.id;
      }

      if (realEventoId) {
          // 2. Fetch Escalas
          const { data: escData } = await supabase.from('evento_escalas').select('id, funcao, profiles!inner(nome)').eq('evento_id', realEventoId);
          if (escData && escData.length > 0) {
              const escIds = escData.map(e => e.id);
              // 3. Fetch NFs da equipe
              const { data: finData } = await supabase.from('evento_escalas_financeiro')
                  .select('escala_id, cache_valor, nota_fiscal_url')
                  .in('escala_id', escIds)
                  .not('nota_fiscal_url', 'is', null);
              
              if (finData) {
                  const combinados = finData.map(f => {
                      const esc = escData.find(e => e.id === f.escala_id);
                      return {
                          ...f,
                          nome: esc?.profiles?.nome || 'Desconhecido',
                          funcao: esc?.funcao || ''
                      };
                  });
                  setEquipeNotas(combinados);
              }
          }
      }

      // 4. Fetch NFs/Boletos do evento (Despesas com nota_fiscal_url)
      const { data: despData } = await supabase.from('financas_despesas')
          .select('*')
          .eq('roadbook_id', roadbookId)
          .not('nota_fiscal_url', 'is', null)
          .order('created_at', { ascending: false });
      
      if (despData) setEventNotas(despData);

    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar notas.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNota = async () => {
    if (!novoNome || !novoValor || !novoArquivo) {
      toast.error("Preencha o nome, valor e selecione um arquivo.");
      return;
    }
    
    setUploading(true);
    try {
      const fileExt = novoArquivo.name.split('.').pop();
      const filePath = `boletos/${roadbookId}/${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('notas_fiscais').upload(filePath, novoArquivo);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('notas_fiscais').getPublicUrl(filePath);

      const novaDespesa = {
        roadbook_id: roadbookId,
        descricao: novoNome,
        valor: parseInt(novoValor.replace(/\D/g, "") || "0", 10) / 100,
        tipo: 'boleto_nota',
        status: 'pendente',
        nota_fiscal_url: publicUrl
      };

      const { error: dbError } = await supabase.from('financas_despesas').insert(novaDespesa);
      if (dbError) throw dbError;

      toast.success("Boleto/Nota adicionado com sucesso!");
      setNovoNome("");
      setNovoValor("");
      setNovoArquivo(null);
      fetchData();
    } catch (e) {
      toast.error("Erro ao fazer upload: " + getErrorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const removeDespesa = async (id: string) => {
    if (!confirm("Remover esta nota/boleto? (A despesa será excluída do financeiro)")) return;
    try {
      const { error } = await supabase.from("financas_despesas").delete().eq("id", id);
      if (error) throw error;
      toast.success("Removido com sucesso.");
      fetchData();
    } catch (e) {
      toast.error("Erro ao remover: " + getErrorMessage(e));
    }
  };

  if (loading) return <div className="p-4 text-center text-slate-500">Carregando notas e boletos...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Upload novo boleto */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="size-5 text-primary" />
            Adicionar Novo Boleto ou Nota
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2 md:col-span-1">
              <Label>Nome do Item / Descrição</Label>
              <Input placeholder="Ex: Aluguel de Som" value={novoNome} onChange={e => setNovoNome(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label>Valor (R$)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">R$</span>
                <CurrencyInput className="pl-9" placeholder="0,00" value={novoValor} onChange={setNovoValor} />
              </div>
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label>Arquivo (PDF, Imagem)</Label>
              <Input type="file" onChange={e => setNovoArquivo(e.target.files?.[0] || null)} />
            </div>
            <div className="md:col-span-1">
              <Button className="w-full" onClick={handleAddNota} disabled={uploading}>
                {uploading ? "Enviando..." : "Adicionar"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista Boletos do Evento */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <FileText className="size-5 text-blue-500" />
            Boletos e Notas Gerais do Evento
          </CardTitle>
        </CardHeader>
        <CardContent>
          {eventNotas.length === 0 ? (
            <p className="text-sm text-slate-500 italic">Nenhum boleto ou nota adicionado ao evento.</p>
          ) : (
            <div className="rounded-md border border-slate-200 dark:border-slate-800">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-medium">
                  <tr>
                    <th className="px-4 py-3">Descrição</th>
                    <th className="px-4 py-3">Valor</th>
                    <th className="px-4 py-3 text-center">Arquivo</th>
                    <th className="px-4 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {eventNotas.map(nota => (
                    <tr key={nota.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{nota.descricao}</td>
                      <td className="px-4 py-3">{formatCurrency(nota.valor)}</td>
                      <td className="px-4 py-3 text-center">
                        <a href={nota.nota_fiscal_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline bg-primary/10 px-3 py-1 rounded-full text-xs">
                          <Download className="size-3" /> Ver Arquivo
                        </a>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon" className="text-red-500 h-8 w-8" onClick={() => removeDespesa(nota.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista Notas da Equipe */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <FileText className="size-5 text-emerald-500" />
            Notas Fiscais da Equipe (Cachês)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {equipeNotas.length === 0 ? (
            <p className="text-sm text-slate-500 italic">Nenhum membro da equipe enviou nota fiscal para este evento ainda.</p>
          ) : (
            <div className="rounded-md border border-slate-200 dark:border-slate-800">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-medium">
                  <tr>
                    <th className="px-4 py-3">Profissional</th>
                    <th className="px-4 py-3">Função</th>
                    <th className="px-4 py-3">Valor do Cachê</th>
                    <th className="px-4 py-3 text-center">Nota Fiscal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {equipeNotas.map(nota => (
                    <tr key={nota.escala_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{nota.nome}</td>
                      <td className="px-4 py-3 text-slate-500">{nota.funcao}</td>
                      <td className="px-4 py-3">{formatCurrency(nota.cache_valor)}</td>
                      <td className="px-4 py-3 text-center">
                        <a href={nota.nota_fiscal_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline bg-emerald-500/10 px-3 py-1 rounded-full text-xs">
                          <Download className="size-3" /> Ver Nota
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
