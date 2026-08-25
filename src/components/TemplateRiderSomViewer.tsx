import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { LinkIcon, Mic2 } from "lucide-react";

export default function TemplateRiderSomViewer({ role }: { role?: string }) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>("");

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    setLoading(true);
    const { data, error } = await supabase.from('templates_espetaculos').select('*').order('nome_espetaculo');
    if (!error && data) {
      setTemplates(data);
    }
    setLoading(false);
  }

  const selectedTemplate = templates.find(t => t.nome_espetaculo === selectedTemplateName);

  const somData = (() => {
    if (!selectedTemplate) return null;
    try {
      return selectedTemplate.rider_som ? JSON.parse(selectedTemplate.rider_som) : {};
    } catch {
      return { notas_gerais: selectedTemplate.rider_som || '' };
    }
  })();

  const anexos = selectedTemplate?.assets_midia?.anexos_som || [];

  if (loading) return <div className="p-8 text-center text-slate-500">Carregando shows cadastrados...</div>;

  return (
    <div className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="border-0 shadow-lg dark:bg-card rounded-2xl overflow-hidden">
        <CardContent className="p-6 md:p-8 space-y-8">
          <div className="space-y-3">
            <Label className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Mic2 className="size-5 text-emerald-500" />
              Selecione um Show (Riders Cadastrados)
            </Label>
            <Select value={selectedTemplateName} onValueChange={setSelectedTemplateName}>
              <SelectTrigger className="w-full md:w-96 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <SelectValue placeholder="Escolha um show cadastrado..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map(t => (
                  <SelectItem key={t.nome_espetaculo} value={t.nome_espetaculo}>
                    {t.nome_espetaculo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {somData && (
            <div className="space-y-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              {/* Lista de Equipamentos */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                  Lista de Equipamentos (Padrão)
                </h4>
                {(somData.equipamentos_lista || []).length === 0 ? (
                  <div className="text-slate-500 text-sm">Nenhum equipamento listado.</div>
                ) : (
                  <div className="grid gap-2">
                    {(somData.equipamentos_lista || []).map((eq: any, idx: number) => (
                      <div key={eq.id} className="flex flex-col sm:flex-row gap-3 p-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl items-start sm:items-center">
                        <div className="w-8 shrink-0 flex items-center justify-center font-bold text-slate-400">
                          #{idx + 1}
                        </div>
                        <div className="w-full sm:w-20 font-bold text-center">
                          {eq.qtd}
                        </div>
                        <div className="w-full sm:flex-1 font-semibold text-slate-800 dark:text-slate-200">
                          {eq.nome || '-'}
                        </div>
                        <div className="w-full sm:flex-1 text-slate-500 text-sm">
                          {eq.detalhes || '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Input List */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                  Input List (Tabela)
                </h4>
                {(somData.input_list_tabela || []).length === 0 ? (
                  <div className="text-slate-500 text-sm">Nenhum canal na Input List.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold text-xs">
                        <tr>
                          <th className="px-4 py-3 rounded-l-lg">Canal</th>
                          <th className="px-4 py-3">Equipamento/Fonte</th>
                          <th className="px-4 py-3 rounded-r-lg">Observações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {(somData.input_list_tabela || []).map((eq: any) => (
                          <tr key={eq.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                            <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                              {eq.canal || '-'}
                            </td>
                            <td className="px-4 py-3 text-slate-800 dark:text-slate-200 font-medium">
                              {eq.equipamento || '-'}
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {eq.obs || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Notas e Monitoração */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 dark:text-white">Descritivo / Notas Gerais</h4>
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap min-h-[100px]">
                    {somData.notas_gerais || 'Nenhuma nota geral.'}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 dark:text-white">Monitoração / Vias</h4>
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap min-h-[100px]">
                    {somData.monitoracao || 'Nenhuma informação de monitoração.'}
                  </div>
                </div>
              </div>

              {/* Anexos */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                  Arquivos do Rider (PDFs ou Imagens)
                </h4>
                {anexos.length === 0 ? (
                  <div className="text-slate-500 text-sm">Nenhum arquivo anexado.</div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {anexos.map((url: string, index: number) => (
                      <a 
                        key={index} 
                        href={url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors font-bold text-sm truncate"
                      >
                        <LinkIcon className="size-4 shrink-0" /> 
                        Ver Arquivo {index + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
