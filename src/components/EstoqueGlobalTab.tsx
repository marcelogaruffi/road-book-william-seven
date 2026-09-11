import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Plus, Trash2, Box } from 'lucide-react';
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

export function EstoqueGlobalTab() {
  const [volumes, setVolumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase.from('estoque_global').select('*').limit(1).maybeSingle();
    if (data) {
      setVolumes(data.itens || []);
    }
    setLoading(false);
  }

  const handleAddVolume = () => {
    const nome = prompt("Nome do novo volume (ex: Case de Ferramentas):");
    if (!nome) return;
    setVolumes([...volumes, { id: uuidv4(), nome, cor: '#475569', itens: [] }]);
  };

  const handleDeleteVolume = (volId: string) => {
    if (!confirm("Excluir este volume inteiro do estoque global?")) return;
    setVolumes(volumes.filter(v => v.id !== volId));
  };

  const handleAddItem = (volId: string) => {
    const desc = prompt("Descri\u00e7\u00e3o do item:");
    if (!desc) return;
    setVolumes(volumes.map(v => {
      if (v.id === volId) {
        return { ...v, itens: [...(v.itens || []), { id: uuidv4(), descricao: desc, check: false }] };
      }
      return v;
    }));
  };

  const handleDeleteItem = (volId: string, itemId: string) => {
    setVolumes(volumes.map(v => {
      if (v.id === volId) {
        return { ...v, itens: (v.itens || []).filter((i:any) => i.id !== itemId) };
      }
      return v;
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: existing } = await supabase.from('estoque_global').select('id').limit(1).maybeSingle();
    
    if (existing) {
        const { error } = await supabase.from('estoque_global').update({ itens: volumes }).eq('id', existing.id);
        if (error) toast.error("Erro ao salvar: " + error.message);
        else toast.success("Estoque Global salvo com sucesso!");
    } else {
        const { error } = await supabase.from('estoque_global').insert({ itens: volumes });
        if (error) toast.error("Erro ao salvar: " + error.message);
        else toast.success("Estoque Global salvo com sucesso!");
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Carregando estoque global...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white dark:bg-card p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Box className="size-6 text-primary" /> Estoque Global
          </h2>
          <p className="text-sm text-slate-500 mt-1">Este \u00e9 o invent\u00e1rio mestre (cabos, ferramentas, etc) dispon\u00edvel para ser adicionado nos Guias de Viagem.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-primary text-white rounded-xl gap-2 font-bold px-6 shadow-md hover:shadow-lg transition-all">
          <Save className="size-4" />
          {saving ? 'Salvando...' : 'Salvar Altera\u00e7\u00f5es'}
        </Button>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleAddVolume} variant="outline" className="rounded-xl border-dashed border-2">
          <Plus className="size-4 mr-2" />
          Novo Volume / Case
        </Button>
      </div>

      {volumes.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-card rounded-2xl border border-slate-200 dark:border-white/10 text-slate-500">
          Nenhum volume cadastrado no estoque global.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {volumes.map(vol => (
            <div key={vol.id} className="bg-white dark:bg-card rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center gap-3 bg-slate-50 dark:bg-slate-800/30">
                <input 
                  type="color" 
                  value={vol.cor || '#475569'}
                  onChange={e => setVolumes(volumes.map(v => v.id === vol.id ? {...v, cor: e.target.value} : v))}
                  className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                />
                <Input 
                  value={vol.nome} 
                  onChange={e => setVolumes(volumes.map(v => v.id === vol.id ? {...v, nome: e.target.value} : v))}
                  className="font-bold border-none bg-transparent focus-visible:ring-0 p-0 h-auto text-base"
                />
                <Button variant="ghost" size="icon" onClick={() => handleDeleteVolume(vol.id)} className="ml-auto text-red-500 hover:text-red-600 hover:bg-red-50">
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="p-4 flex-1 space-y-2">
                {(vol.itens || []).map((item: any) => (
                  <div key={item.id} className="flex items-center gap-2 group">
                    <Input 
                      value={item.descricao}
                      onChange={e => setVolumes(volumes.map(v => v.id === vol.id ? {...v, itens: v.itens.map((i:any) => i.id === item.id ? {...i, descricao: e.target.value} : i)} : v))}
                      className="h-8 text-sm bg-slate-50 dark:bg-slate-900 border-none"
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(vol.id, item.id)} className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500">
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                ))}
                <Button onClick={() => handleAddItem(vol.id)} variant="ghost" size="sm" className="w-full mt-2 text-primary border border-dashed border-primary/30">
                  <Plus className="size-3 mr-1" /> Add Item
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
