import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, Save, Lightbulb, Mic2 } from "lucide-react";
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
};

export default function TemplateRidersTab({ role, context = 'ambos' }: { role?: string, context?: 'som' | 'luz' | 'ambos' }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // States for new/editing template
  const [editNome, setEditNome] = useState("");
  const [somList, setSomList] = useState<Equipamento[]>([]);
  const [luzList, setLuzList] = useState<Equipamento[]>([]);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    setLoading(true);
    const { data, error } = await supabase.from('templates_espetaculos').select('*');
    if (error) {
      toast.error("Erro ao carregar templates");
    } else {
      setTemplates(data || []);
    }
    setLoading(false);
  }

  function handleEdit(t: Template) {
    setEditNome(t.nome_espetaculo);
    setSomList(t.rider_som?.equipamentos_lista || []);
    setLuzList(t.rider_luz?.equipamentos_lista || []);
  }

  function clearForm() {
    setEditNome("");
    setSomList([]);
    setLuzList([]);
  }

  async function saveTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!editNome.trim()) {
      toast.error("Informe o nome do espetáculo");
      return;
    }
    setSaving(true);
    
    const payload = {
      nome_espetaculo: editNome.trim(),
      rider_som: { equipamentos_lista: somList },
      rider_luz: { equipamentos_lista: luzList },
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('templates_espetaculos').upsert(payload);
    
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Rider Padrão salvo com sucesso!");
      clearForm();
      loadTemplates();
    }
  }

  async function deleteTemplate(nome: string) {
    if (!confirm(`Remover rider padrão do espetáculo "${nome}"?`)) return;
    const { error } = await supabase.from('templates_espetaculos').delete().eq('nome_espetaculo', nome);
    if (error) toast.error("Erro ao excluir");
    else {
      toast.success("Rider removido");
      loadTemplates();
    }
  }

  function addRow(setList: any, list: Equipamento[]) {
    setList([...list, { id: crypto.randomUUID(), qtd: '1', nome: '', detalhes: '' }]);
  }

  function updateRow(setList: any, list: Equipamento[], id: string, field: string, value: string) {
    setList(list.map(e => e.id === id ? { ...e, [field]: value } : e));
  }

  function removeRow(setList: any, list: Equipamento[], id: string) {
    setList(list.filter(e => e.id !== id));
  }

  function renderListBuilder(list: Equipamento[], setList: any, icon: any, title: string, color: string) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className={`text-lg font-bold flex items-center gap-2 ${color}`}>
            {icon} {title}
          </Label>
          <Button type="button" onClick={() => addRow(setList, list)} size="sm" variant="outline">
            <Plus className="size-4 mr-2" /> Adicionar
          </Button>
        </div>
        
        {list.length === 0 ? (
          <div className="text-center p-4 border-2 border-dashed rounded-xl text-slate-500">
            Nenhum equipamento listado.
          </div>
        ) : (
          <div className="space-y-2">
            {list.map(eq => (
              <div key={eq.id} className="flex gap-2 items-center bg-slate-50 dark:bg-white/5 p-2 rounded-lg border border-slate-100 dark:border-white/10">
                <Input value={eq.qtd} onChange={e => updateRow(setList, list, eq.id, 'qtd', e.target.value)} placeholder="Qtd" className="w-16 text-center h-9" />
                <Input value={eq.nome} onChange={e => updateRow(setList, list, eq.id, 'nome', e.target.value)} placeholder="Equipamento" className="flex-1 h-9" />
                <Input value={eq.detalhes} onChange={e => updateRow(setList, list, eq.id, 'detalhes', e.target.value)} placeholder="Detalhes" className="flex-1 h-9" />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(setList, list, eq.id)} className="h-9 w-9 text-red-500 hover:bg-red-50">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (loading) return <div className="p-8 text-center">Carregando modelos...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
      <div className="lg:col-span-1 space-y-6">
        <Card className="border-0 shadow-lg dark:bg-card rounded-2xl">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-xl font-bold">Riders Cadastrados</h3>
            {templates.length === 0 ? (
              <p className="text-slate-500">Nenhum rider padrão cadastrado.</p>
            ) : (
              <div className="space-y-2">
                {templates.map(t => (
                  <div key={t.nome_espetaculo} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10">
                    <span className="font-bold truncate">{t.nome_espetaculo}</span>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(t)}>Editar</Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteTemplate(t.nome_espetaculo)} className="text-red-500">Excluir</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card className="border-0 shadow-lg dark:bg-card rounded-2xl">
          <CardContent className="p-6">
            <form onSubmit={saveTemplate} className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Editar Rider do Espetáculo</h3>
                {editNome && <Button type="button" variant="ghost" onClick={clearForm}>Cancelar Edição</Button>}
              </div>

              {!editNome ? (
                <div className="text-center py-10 border-2 border-dashed rounded-xl bg-slate-50 dark:bg-card/50 text-slate-500">
                  <p>Selecione um espetáculo na lista ao lado para editar os equipamentos.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 p-4 bg-primary/5 rounded-xl border border-primary/20">
                    <Label className="text-primary font-bold">Espetáculo Selecionado</Label>
                    <div className="text-2xl font-black text-slate-800 dark:text-white">{editNome}</div>
                  </div>
                  <Accordion type="multiple" className="space-y-4">
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
              </Accordion>
              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={saving} className="h-12 px-8 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg hover:shadow-xl">
                  <Save className="size-5 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar Equipamentos'}
                </Button>
              </div>
              </>
            )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
