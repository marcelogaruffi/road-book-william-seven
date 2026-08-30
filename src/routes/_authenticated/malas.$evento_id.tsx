import { createFileRoute, Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Check, ChevronLeft, Luggage, Save, ShieldAlert, FileWarning } from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';
import type { MalaVolume, MalaItem } from '@/components/MalasTemplateTab';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

export const Route = createFileRoute('/_authenticated/malas/$evento_id')({
  component: MalasEventoOperacao,
});

function MalasEventoOperacao() {
  const { evento_id } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [evento, setEvento] = useState<any>(null);
  const [roadbook, setRoadbook] = useState<any>(null);
  const [volumes, setVolumes] = useState<(MalaVolume & { itens: (MalaItem & { checked?: boolean })[] })[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [evento_id]);

  async function loadData() {
    setLoading(true);
    // 1. Fetch evento
    const { data: evData } = await supabase.from('eventos').select('*').eq('id', evento_id).single();
    if (evData) setEvento(evData);

    // 2. Fetch roadbook associated with evento
    const { data: rbData } = await supabase.from('roadbooks').select('*').eq('evento_id', evento_id).maybeSingle();
    
    if (rbData) {
      setRoadbook(rbData);
      const autos = rbData.automacoes || {};
      
      if (autos.operacao_malas && autos.operacao_malas.length > 0) {
        setVolumes(autos.operacao_malas);
      } else if (evData) {
        // Fallback to template if not started
        const { data: tData } = await supabase.from('templates_espetaculos').select('assets_midia').eq('nome_espetaculo', evData.espetaculo).maybeSingle();
        if (tData && tData.assets_midia?.malas_padrao) {
          // Initialize checklist
          const padrao = (tData.assets_midia.malas_padrao || []).map((v: any) => ({
            ...v,
            itens: (v.itens || []).map((i: any) => ({ ...i, checked: false }))
          }));
          setVolumes(padrao);
        }
      }
    }
    
    setLoading(false);
  }

  async function saveChecklist() {
    if (!roadbook) return;
    setSaving(true);
    
    const autos = roadbook.automacoes || {};
    const payload = {
      ...autos,
      operacao_malas: volumes
    };

    const { error } = await supabase.from('roadbooks').update({ automacoes: payload }).eq('id', roadbook.id);
    
    setSaving(false);
    if (error) {
      toast.error('Erro ao salvar: ' + getErrorMessage(error));
    } else {
      toast.success('Checklist salvo com sucesso!');
    }
  }

  function toggleItem(volId: string, itemId: string, checked: boolean) {
    setVolumes(volumes.map(v => {
      if (v.id === volId) {
        return {
          ...v,
          itens: (v.itens || []).map(i => i.id === itemId ? { ...i, checked } : i)
        };
      }
      return v;
    }));

    if (checked) {
      setTimeout(() => {
        const checkboxes = Array.from(document.querySelectorAll('[data-malas-checkbox="true"]')) as HTMLElement[];
        const currentIndex = checkboxes.findIndex(cb => cb.getAttribute('data-item-id') === itemId);
        if (currentIndex >= 0 && currentIndex < checkboxes.length - 1) {
          checkboxes[currentIndex + 1].focus();
        }
      }, 50);
    }
  }

  if (loading) return <div className="p-12 text-center">Carregando checklist de malas...</div>;

  if (!roadbook) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <Button variant="ghost" asChild className="mb-4 text-slate-500 hover:text-slate-800 dark:hover:text-white">
          <Link to="/malas"><ChevronLeft className="size-4 mr-2" /> Voltar para Painel</Link>
        </Button>
        <Card className="border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/10 shadow-lg rounded-2xl">
          <CardContent className="p-12 text-center space-y-4">
            <FileWarning className="size-16 mx-auto text-red-400" />
            <h2 className="text-2xl font-black text-red-600 dark:text-red-400">Guia de Viagem não encontrado</h2>
            <p className="text-slate-600 dark:text-slate-300">
              Para iniciar a operação de Malas deste evento ({evento?.espetaculo}), é necessário criar um <strong>Guia de Viagem</strong> para ele primeiro.
            </p>
            <div className="pt-4">
              <Button asChild className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-12 px-6">
                <Link to="/roadbook/new">Criar Guia de Viagem</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allChecked = volumes.length > 0 && volumes.every(v => (v.itens || []).length > 0 && (v.itens || []).every(i => i.checked));
  const totalItems = volumes.reduce((acc, v) => acc + (v.itens || []).length, 0);
  const checkedItems = volumes.reduce((acc, v) => acc + (v.itens || []).filter(i => i.checked).length, 0);
  const progress = totalItems === 0 ? 0 : Math.round((checkedItems / totalItems) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" asChild className="text-slate-500 hover:text-slate-800 dark:hover:text-white">
          <Link to="/malas"><ChevronLeft className="size-4 mr-2" /> Voltar</Link>
        </Button>
        <Button onClick={saveChecklist} disabled={saving} className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 rounded-xl font-bold h-11 px-6 shadow-md">
          <Save className="size-4 mr-2" /> {saving ? 'Salvando...' : 'Salvar Checklist'}
        </Button>
      </div>

      <div className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-800 dark:to-slate-900 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
        <Luggage className="absolute -right-10 -bottom-10 size-64 text-white/5 rotate-12" />
        <div className="relative z-10 space-y-2">
          <Badge className="bg-white/20 text-white hover:bg-white/30 border-none mb-2">
            {evento?.cidade} • {evento?.data ? new Date(evento.data + 'T12:00:00').toLocaleDateString('pt-BR') : ''}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            Operação de Malas
          </h1>
          <p className="text-slate-300 font-medium text-lg">
            {evento?.espetaculo}
          </p>
        </div>
      </div>

      {volumes.length === 0 ? (
        <Card className="border-0 shadow-md rounded-2xl bg-white dark:bg-card">
          <CardContent className="p-12 text-center text-slate-500 space-y-4">
            <Luggage className="size-16 mx-auto opacity-20" />
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">Nenhuma mala configurada</h3>
            <p>O espetáculo <strong>{evento?.espetaculo}</strong> não possui malas padrão cadastradas.</p>
            <Button asChild variant="outline" className="mt-4 rounded-xl">
              <Link to="/malas">Configurar Malas Padrão</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4 bg-white dark:bg-card p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5">
            <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="font-bold text-slate-600 dark:text-slate-300">{progress}%</span>
          </div>

          {allChecked && (
            <div className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 p-4 rounded-2xl flex items-center font-bold">
              <Check className="size-5 mr-3" /> Todas as malas e itens foram conferidos com sucesso!
            </div>
          )}

          <div className="grid gap-6">
            {volumes.map(vol => {
              const itens = vol.itens || [];
              const volProgress = itens.length > 0 
                ? Math.round((itens.filter(i => i.checked).length / itens.length) * 100)
                : 0;
              const isVolComplete = volProgress === 100;

              return (
                <Card key={vol.id} className={`border-0 shadow-md rounded-2xl transition-colors ${isVolComplete ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30' : 'bg-white dark:bg-card'}`}>
                  <CardHeader className="border-b border-slate-100 dark:border-white/5 pb-4 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        {isVolComplete ? <Check className="text-emerald-500 size-5" /> : <Luggage className="text-slate-400 size-5" />}
                        {vol.nome}
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className={isVolComplete ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' : ''}>
                      {itens.filter(i => i.checked).length} / {itens.length} itens
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                      {itens.map(item => (
                        <label key={item.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                          <Checkbox 
                            checked={item.checked} 
                            onCheckedChange={(c) => toggleItem(vol.id, item.id, !!c)}
                            data-item-id={item.id}
                            data-malas-checkbox="true"
                            className="size-6 rounded-md border-2 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                          />
                          <div className={`flex-1 font-medium text-lg transition-colors flex items-center gap-3 ${item.checked ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                            {item.foto_url && (
                              <a href={item.foto_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="shrink-0 group-hover:scale-110 transition-transform">
                                <img src={item.foto_url} alt={item.nome} className="h-10 w-10 rounded-md object-cover border border-slate-200 dark:border-white/10" />
                              </a>
                            )}
                            {item.nome}
                          </div>
                          <div className={`px-3 py-1 rounded-lg font-bold text-sm bg-slate-100 dark:bg-slate-800 ${item.checked ? 'opacity-50' : 'text-slate-600 dark:text-slate-300'}`}>
                            {item.quantidade}x
                          </div>
                        </label>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
