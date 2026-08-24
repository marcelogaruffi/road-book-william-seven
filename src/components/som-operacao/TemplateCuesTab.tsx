import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Trash2, Save, Music, ListMusic, Play, ListOrdered, ChevronUp, ChevronDown } from 'lucide-react';
import { CoxiaPlayer } from '@/components/som-operacao/CoxiaPlayer';

type Cue = {
  id: string;
  faixa: string;
  nome_faixa: string;
  cena: string;
  duracao: string;
  deixa_prep: string;
  deixa_go: string;
};

type Template = {
  nome_espetaculo: string;
  rider_som: any;
};

export default function TemplateCuesTab() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit state
  const [editNome, setEditNome] = useState("");
  const [rawTemplate, setRawTemplate] = useState<Template | null>(null);
  const [cuesList, setCuesList] = useState<Cue[]>([]);
  const [saving, setSaving] = useState(false);
  const [operationMode, setOperationMode] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const getErrorMessage = (error: any) => {
    return error?.message || "Erro desconhecido";
  };

  async function loadTemplates() {
    setLoading(true);
    const { data, error } = await supabase.from('templates_espetaculos').select('*').order('nome_espetaculo');
    if (!error && data) {
      setTemplates(data);
    }
    setLoading(false);
  }

  function handleEdit(t: Template) {
    setEditNome(t.nome_espetaculo);
    setRawTemplate(t);
    setCuesList(t.rider_som?.cues_lista || []);
  }

  function clearForm() {
    setEditNome("");
    setRawTemplate(null);
    setCuesList([]);
  }

  async function saveTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!editNome.trim()) {
      toast.error("Informe o nome do espetáculo");
      return;
    }
    setSaving(true);
    
    // Merge existing rider_som data to preserve equipamentos_lista
    const currentRiderSom = rawTemplate?.rider_som || {};
    
    const payload = {
      nome_espetaculo: editNome.trim(),
      rider_som: { ...currentRiderSom, cues_lista: cuesList },
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('templates_espetaculos').upsert(payload);
    
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + getErrorMessage(error));
    } else {
      toast.success("Cues Padrão salvas com sucesso!");
      // reload the specific template to maintain state fresh
      loadTemplates();
    }
  }

  function addRow() {
    setCuesList([...cuesList, { id: crypto.randomUUID(), faixa: '', nome_faixa: '', duracao: '', cena: '', deixa_prep: '', deixa_go: '' }]);
  }

  function updateRow(id: string, field: keyof Cue, value: string) {
    setCuesList(cuesList.map(e => e.id === id ? { ...e, [field]: value } : e));
  }

  function removeRow(id: string) {
    setCuesList(cuesList.filter(e => e.id !== id));
  }

  function moveRow(index: number, direction: 'up' | 'down') {
    const newList = [...cuesList];
    if (direction === 'up' && index > 0) {
      [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
      setCuesList(newList);
    } else if (direction === 'down' && index < newList.length - 1) {
      [newList[index + 1], newList[index]] = [newList[index], newList[index + 1]];
      setCuesList(newList);
    }
  }

  function renumberTracks() {
    setCuesList(cuesList.map((cue, idx) => ({
      ...cue,
      faixa: String(idx + 1).padStart(2, '0')
    })));
    toast.success('Faixas renumeradas!');
  }

  const formatDurationMask = (value: string) => {
    let numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    numbers = parseInt(numbers, 10).toString(); // Remove zeros à esquerda
    if (numbers === 'NaN') return '';
    
    const padded = numbers.padStart(3, '0');
    if (padded.length <= 4) {
      return `${padded.slice(0, -2)}:${padded.slice(-2)}`;
    }
    return `${padded.slice(0, -4)}:${padded.slice(-4, -2)}:${padded.slice(-2)}`;
  };

  if (loading) return <div className="p-8 text-center">Carregando espetáculos...</div>;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mt-6">
      <div className="xl:col-span-1 space-y-6">
        <Card className="border-0 shadow-lg dark:bg-card rounded-2xl">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-xl font-bold">Espetáculos</h3>
            {templates.length === 0 ? (
              <p className="text-slate-500">Nenhum espetáculo cadastrado.</p>
            ) : (
              <div className="space-y-2">
                {templates.map(t => (
                  <div key={t.nome_espetaculo} className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer ${editNome === t.nome_espetaculo ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700' : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10'}`} onClick={() => handleEdit(t)}>
                    <span className="font-bold truncate">{t.nome_espetaculo}</span>
                    <Button variant="ghost" size="sm" className="hidden lg:flex shrink-0">Selecionar</Button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-4 text-center">
              Para cadastrar novos espetáculos, adicione na aba de Equipamentos Padrão.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="xl:col-span-3">
        <Card className="border-0 shadow-lg dark:bg-card/80 overflow-hidden rounded-3xl">
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3 opacity-90">
              <ListMusic className="size-6" />
              <h2 className="text-xl font-bold">Lista de Cues Padrão</h2>
            </div>
            {editNome && (
              <div className="flex flex-wrap gap-2 md:gap-3">
                <Button 
                  onClick={() => setOperationMode(true)} 
                  className="bg-slate-900 hover:bg-black text-white border-0 shadow-lg shadow-black/20"
                >
                  <Play className="size-4 mr-2" /> Testar Operação
                </Button>
                <Button onClick={renumberTracks} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <ListOrdered className="size-4 mr-2" /> Renumerar
                </Button>
                <Button onClick={addRow} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <Plus className="size-4 mr-2" /> Adicionar
                </Button>
                <Button onClick={saveTemplate} disabled={saving} className="bg-amber-100 hover:bg-white text-amber-900 border-0">
                  <Save className="size-4 mr-2" /> {saving ? 'Salvando...' : 'Salvar Lista'}
                </Button>
              </div>
            )}
          </div>

          <CardContent className="p-6 md:p-8 space-y-6">
            {!editNome ? (
              <div className="text-center py-10 border-2 border-dashed rounded-xl bg-slate-50 dark:bg-card/50 text-slate-500">
                <Music className="size-12 mx-auto mb-4 opacity-50" />
                <p>Selecione um espetáculo na lista ao lado para editar as cues (deixas).</p>
              </div>
            ) : cuesList.length === 0 ? (
              <div className="text-center p-12 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-slate-500">
                <Music className="size-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Sua lista está vazia.</p>
                <Button onClick={addRow} className="mt-4" variant="outline">Criar Primeira Deixa</Button>
              </div>
            ) : (
              <div className="space-y-6">
                {operationMode && (
                  <CoxiaPlayer 
                    cues={cuesList} 
                    espetaculo={editNome} 
                    onClose={() => setOperationMode(false)} 
                  />
                )}
                
                <div className="space-y-2 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-900/30">
                  <Label className="text-amber-700 dark:text-amber-500 font-bold">Editando Padrão do Espetáculo:</Label>
                  <div className="text-2xl font-black text-slate-800 dark:text-white">{editNome}</div>
                </div>

                {cuesList.map((cue: Cue, idx: number) => (
                  <div key={cue.id} className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 shadow-sm relative">
                    <div className="absolute -left-3 -top-3 size-8 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                      {idx + 1}
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-4 items-start">
                      <div className="flex flex-col gap-1 items-center justify-center pt-5">
                          <Button variant="ghost" size="icon" onClick={() => moveRow(idx, 'up')} disabled={idx === 0} className="h-6 w-6 text-slate-400 hover:text-amber-600">
                            <ChevronUp className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => moveRow(idx, 'down')} disabled={idx === cuesList.length - 1} className="h-6 w-6 text-slate-400 hover:text-amber-600">
                            <ChevronDown className="size-4" />
                          </Button>
                      </div>
                      <div className="w-full md:w-24">
                        <Label className="text-xs font-bold text-slate-500 mb-1 block">FAIXA N°</Label>
                        <Input value={cue.faixa} onChange={e => updateRow(cue.id, 'faixa', e.target.value)} className="font-bold text-center bg-white dark:bg-black/50" placeholder="Ex: 01" />
                      </div>
                      <div className="flex-1 w-full">
                        <Label className="text-xs font-bold text-slate-500 mb-1 block">NOME DA FAIXA</Label>
                        <Input value={cue.nome_faixa} onChange={e => updateRow(cue.id, 'nome_faixa', e.target.value)} className="font-bold bg-white dark:bg-black/50" placeholder="Título da música ou efeito" />
                      </div>
                      <div className="w-full md:w-32">
                        <Label className="text-xs font-bold text-slate-500 mb-1 block">CENA</Label>
                        <Input value={cue.cena} onChange={e => updateRow(cue.id, 'cena', e.target.value)} className="bg-white dark:bg-black/50" placeholder="Ato 1" />
                      </div>
                      <div className="w-full md:w-28">
                        <Label className="text-xs font-bold text-slate-500 mb-1 block">DURAÇÃO</Label>
                        <Input value={cue.duracao} onChange={e => updateRow(cue.id, 'duracao', formatDurationMask(e.target.value))} className="text-center bg-white dark:bg-black/50" placeholder="00:00" />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeRow(cue.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 md:mt-6">
                        <Trash2 className="size-5" />
                      </Button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
                      <div className="flex-1">
                        <Label className="text-xs font-bold text-amber-600 dark:text-amber-500 mb-1 block">DEIXA DE PREPARAÇÃO (STANDBY)</Label>
                        <Textarea 
                          value={cue.deixa_prep} 
                          onChange={e => updateRow(cue.id, 'deixa_prep', e.target.value)} 
                          className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 min-h-[60px] resize-y" 
                          placeholder="O que acontece antes para você se preparar..." 
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs font-bold text-emerald-600 dark:text-emerald-500 mb-1 block">DEIXA DE AÇÃO (GO)</Label>
                        <Textarea 
                          value={cue.deixa_go} 
                          onChange={e => updateRow(cue.id, 'deixa_go', e.target.value)} 
                          className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 min-h-[60px] resize-y font-medium" 
                          placeholder="Sinal exato para disparar a faixa..." 
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="pt-6 flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={addRow} 
                    variant="outline" 
                    className="flex-1 h-14 border-dashed border-2 border-slate-300 dark:border-white/20 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:border-amber-300 dark:hover:border-amber-700 font-bold"
                  >
                    <Plus className="size-5 mr-2" /> Adicionar Nova Deixa (Cue)
                  </Button>
                  <Button 
                    onClick={saveTemplate} 
                    disabled={saving} 
                    className="flex-1 h-14 bg-amber-100 hover:bg-amber-200 text-amber-900 border-0 font-bold shadow-sm"
                  >
                    <Save className="size-5 mr-2" /> {saving ? 'Salvando...' : 'Salvar Lista'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
