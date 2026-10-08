import { getErrorMessage } from "@/lib/utils";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, Save, Lightbulb, Mic2, Clapperboard, Video } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

type Equipamento = {
  id: string;
  qtd: string;
  nome: string;
  detalhes: string;
};

type Template = {
  nome_espetaculo: string;
  rider_som: { equipamentos_lista: Equipamento[] };
  rider_luz: { equipamentos_lista: Equipamento[] };
  rider_video: { equipamentos_lista: Equipamento[] };
};

export default function TemplateRidersTab({ role, context = 'ambos', espetaculoNome }: { role?: string, context?: 'som' | 'luz' | 'video' | 'ambos', espetaculoNome?: string }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // States for new/editing template
  const [editNome, setEditNome] = useState("");
  const [somList, setSomList] = useState<Equipamento[]>([]);
  const [luzList, setLuzList] = useState<Equipamento[]>([]);
  const [videoList, setVideoList] = useState<Equipamento[]>([]);
  const [rawTemplate, setRawTemplate] = useState<Template | null>(null);

  useEffect(() => {
    if (espetaculoNome) {
      async function fetchTemplate() {
        setLoading(true);
        const { data } = await supabase.from('templates_espetaculos').select('*').neq('nome_espetaculo', 'ESTOQUE_GLOBAL').eq('nome_espetaculo', espetaculoNome).single();
        if (data) {
          handleEdit(data as any);
        } else {
          handleEdit({ nome_espetaculo: espetaculoNome } as any);
        }
        setLoading(false);
      }
      fetchTemplate();
    } else {
      loadTemplates();
    }
  }, [espetaculoNome]);

  async function loadTemplates() {
    setLoading(true);
    const { data, error } = await supabase.from('templates_espetaculos').select('*').neq('nome_espetaculo', 'ESTOQUE_GLOBAL').order('nome_espetaculo');
    if (!error && data) {
      setTemplates(data as Template[]);
    }
    setLoading(false);
  }

  function handleEdit(t: Template) {
    setEditNome(t.nome_espetaculo);
    
    let pSom = t.rider_som as any;
    if (typeof pSom === 'string') { try { pSom = JSON.parse(pSom); } catch(e) { pSom = {}; } }
    let pLuz = t.rider_luz as any;
    if (typeof pLuz === 'string') { try { pLuz = JSON.parse(pLuz); } catch(e) { pLuz = {}; } }
    let pVideo = t.rider_video as any;
    if (typeof pVideo === 'string') { try { pVideo = JSON.parse(pVideo); } catch(e) { pVideo = {}; } }
    
    setRawTemplate({ ...t, rider_som: pSom, rider_luz: pLuz, rider_video: pVideo });
    setSomList(pSom?.equipamentos_lista || []);
    setLuzList(pLuz?.equipamentos_lista || []);
    setVideoList(pVideo?.equipamentos_lista || []);
  }

  function clearForm() {
    setEditNome("");
    setRawTemplate(null);
    setSomList([]);
    setLuzList([]);
    setVideoList([]);
  }

  async function saveTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!editNome.trim()) {
      toast.error("Informe o nome do espetáculo");
      return;
    }
    setSaving(true);
    
    const objToSave = {
      nome_espetaculo: editNome,
      rider_som: { ...(rawTemplate?.rider_som || {}), equipamentos_lista: somList },
      rider_luz: { ...(rawTemplate?.rider_luz || {}), equipamentos_lista: luzList },
      rider_video: { ...(rawTemplate?.rider_video || {}), equipamentos_lista: videoList },
    };

    try {
      const { error } = await supabase.from('templates_espetaculos').upsert(objToSave, { onConflict: 'nome_espetaculo' });
      if (error) throw error;
      toast.success("Riders salvos no modelo");
      loadTemplates();
      if (!espetaculoNome) clearForm();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  const addEquipamento = (listSetter: any, currentList: Equipamento[]) => {
    listSetter([...currentList, { id: Math.random().toString(36).substring(2, 9), qtd: "1", nome: "", detalhes: "" }]);
  };
  const removeEquipamento = (listSetter: any, currentList: Equipamento[], id: string) => {
    listSetter(currentList.filter(e => e.id !== id));
  };
  const updateEquipamento = (listSetter: any, currentList: Equipamento[], id: string, field: keyof Equipamento, value: string) => {
    listSetter(currentList.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const renderListBuilder = (list: Equipamento[], setter: any, icon: React.ReactNode, title: string, colorClass: string) => (
    <div className="space-y-4">
      {list.length === 0 ? (
        <div className={`text-center py-6 text-slate-400 border border-dashed rounded-xl dark:border-white/10 ${colorClass}`}>
          Nenhum equipamento na lista padrão.
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((eq, i) => (
            <div key={eq.id} className="flex flex-col sm:flex-row gap-2 bg-white dark:bg-card p-3 rounded-lg border border-slate-100 dark:border-white/10 shadow-sm relative group">
              <div className="absolute -left-3 -top-3 bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-xs w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {i + 1}
              </div>
              <Input className="w-full sm:w-20" placeholder="Qtd" value={eq.qtd} onChange={e => updateEquipamento(setter, list, eq.id, "qtd", e.target.value)} />
              <Input className="flex-1" placeholder="Equipamento" value={eq.nome} onChange={e => updateEquipamento(setter, list, eq.id, "nome", e.target.value)} />
              <Input className="flex-1" placeholder="Detalhes / Posicionamento" value={eq.detalhes} onChange={e => updateEquipamento(setter, list, eq.id, "detalhes", e.target.value)} />
              <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50 self-end sm:self-auto shrink-0" onClick={() => removeEquipamento(setter, list, eq.id)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <Button type="button" variant="outline" size="sm" onClick={() => addEquipamento(setter, list)} className="w-full border-dashed">
        <Plus className="size-4 mr-2" /> Adicionar Item
      </Button>
    </div>
  );

  if (loading) {
    return <div className="text-center p-8 text-slate-500">Carregando modelos...</div>;
  }

  return (
    <div className={espetaculoNome ? "" : "grid grid-cols-1 lg:grid-cols-3 gap-6"}>
      {!espetaculoNome && (
        <Card className="col-span-1 shadow-sm border-0 bg-slate-50/50 dark:bg-card">
          <CardContent className="p-4 space-y-2 max-h-[600px] overflow-y-auto mt-4">
            {templates.map(t => (
              <Button key={t.nome_espetaculo} variant="ghost" className={`w-full justify-start h-auto py-3 ${editNome === t.nome_espetaculo ? 'bg-primary/10 text-primary font-bold' : ''}`} onClick={() => handleEdit(t)}>
                <Lightbulb className="size-4 mr-2 opacity-50" />
                {t.nome_espetaculo}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className={`shadow-xl border-0 overflow-hidden rounded-3xl ${espetaculoNome ? "col-span-1" : "col-span-1 lg:col-span-2"}`}>
        {editNome ? (
          <form onSubmit={saveTemplate}>
            <CardContent className="p-0">
              <div className="bg-slate-100 dark:bg-slate-900/50 p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1">Editando Riders</div>
                  <div className="text-2xl font-black text-slate-800 dark:text-white">{editNome}</div>
                </div>
              </div>
              <div className="p-6">
                <Accordion type="multiple" className="space-y-4" defaultValue={['som', 'luz', 'video']}>
                  {(context === 'ambos' || context === 'som') && (!role || role === 'admin' || role === 'dev' || role === 'produtor' || role === 'tecnico_som') && (
                    <AccordionItem value="som" className="border border-slate-200 dark:border-white/10 rounded-xl px-4 bg-slate-50/50 dark:bg-black/20">
                      <AccordionTrigger className="text-lg font-bold">Equipamentos de Som</AccordionTrigger>
                      <AccordionContent className="pt-2 pb-6">
                        {renderListBuilder(somList, setSomList, <Mic2 className="size-5" />, "Som", "text-blue-500")}
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {(context === 'ambos' || context === 'luz') && (!role || role === 'admin' || role === 'dev' || role === 'produtor' || role === 'iluminador') && (
                    <AccordionItem value="luz" className="border border-slate-200 dark:border-white/10 rounded-xl px-4 bg-slate-50/50 dark:bg-black/20">
                      <AccordionTrigger className="text-lg font-bold">Equipamentos de Luz</AccordionTrigger>
                      <AccordionContent className="pt-2 pb-6">
                        {renderListBuilder(luzList, setLuzList, <Lightbulb className="size-5" />, "Iluminação", "text-amber-500")}
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {(context === 'ambos' || context === 'video') && (!role || role === 'admin' || role === 'dev' || role === 'produtor' || role === 'tecnico_video') && (
                    <AccordionItem value="video" className="border border-slate-200 dark:border-white/10 rounded-xl px-4 bg-slate-50/50 dark:bg-black/20">
                      <AccordionTrigger className="text-lg font-bold">Equipamentos de Vídeo</AccordionTrigger>
                      <AccordionContent className="pt-2 pb-6">
                        {renderListBuilder(videoList, setVideoList, <Video className="size-5" />, "Vídeo", "text-purple-500")}
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
                <div className="mt-8 flex justify-end gap-3">
                  {!espetaculoNome && <Button type="button" variant="outline" onClick={clearForm}>Cancelar</Button>}
                  <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 px-8 rounded-full shadow-lg hover:shadow-xl transition-all">
                    {saving ? "Salvando..." : <><Save className="size-5 mr-2" /> Salvar Alterações</>}
                  </Button>
                </div>
              </div>
            </CardContent>
          </form>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <Lightbulb className="size-16 mx-auto mb-4 opacity-20" />
            <p>Selecione um espetáculo na lista ao lado para editar os riders padrão.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
