import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Save, Loader2, Search } from "lucide-react";

export function CachesEquipeTab({ roadbookId }: { roadbookId?: string }) {
  const [equipe, setEquipe] = useState<any[]>([]);
  const [caches, setCaches] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!roadbookId) {
      setLoading(false);
      return;
    }
    fetchEquipeCaches();
  }, [roadbookId]);

  async function fetchEquipeCaches() {
    setLoading(true);
    // 1. Resolve roadbook to get evento_id
    const { data: rbData } = await supabase.from('roadbooks').select('evento_id, cidade, espetaculo').eq('id', roadbookId).maybeSingle();
    let realEventoId = rbData?.evento_id;
    if (!realEventoId && rbData?.cidade && rbData?.espetaculo) {
      const { data: evData } = await supabase.from('eventos').select('id').eq('cidade', rbData.cidade).eq('espetaculo', rbData.espetaculo).maybeSingle();
      if (evData) realEventoId = evData.id;
    }

    if (!realEventoId) {
      setLoading(false);
      return;
    }

    // 2. Fetch escalas for this event
    const { data: escalas, error: errEscalas } = await supabase
      .from("evento_escalas")
      .select(`id, usuario_id, funcao, profiles!inner(id, nome, foto_url, role)`)
      .eq("evento_id", realEventoId);

    if (errEscalas) {
      toast.error("Erro ao buscar equipe: " + getErrorMessage(errEscalas));
      setLoading(false);
      return;
    }

    // 2. Fetch caches for these escalas
    const escalaIds = (escalas || []).map((e: any) => e.id);
    let cacheData: any[] = [];
    if (escalaIds.length > 0) {
      const { data, error: errCache } = await supabase
        .from("evento_escalas_financeiro")
        .select("escala_id, cache_valor")
        .in("escala_id", escalaIds);
      
      if (!errCache && data) {
        cacheData = data;
      }
    }

    // Combine data
    const newCaches: Record<string, string> = {};
    const formattedEquipe = (escalas || []).map((e: any) => {
      const cacheRecord = cacheData.find((c: any) => c.escala_id === e.id);
      if (cacheRecord && cacheRecord.cache_valor !== null) {
        newCaches[e.id] = Number(cacheRecord.cache_valor).toFixed(2);
      }
      return {
        escala_id: e.id,
        usuario_id: e.usuario_id,
        funcao: e.funcao,
        ...e.profiles
      };
    });

    setEquipe(formattedEquipe);
    setCaches(newCaches);
    setLoading(false);
  }

  async function saveCaches() {
    
    setSaving(true);
    try {
      const financeiroPayload = [];
      for (const membro of equipe) {
        const val = caches[membro.escala_id];
        let numVal = val ? parseFloat(val.replace(/\./g, '').replace(',', '.')) : 0;
        if (isNaN(numVal)) numVal = 0;
        
        financeiroPayload.push({
          escala_id: membro.escala_id,
          cache_valor: numVal
        });
      }

      if (financeiroPayload.length > 0) {
        const { error } = await supabase.from('evento_escalas_financeiro').upsert(financeiroPayload, { onConflict: 'escala_id' });
        if (error) throw error;
      }

      toast.success("Cachês salvos com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao salvar cachês: " + getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const filteredEquipe = equipe.filter(p => p.nome?.toLowerCase().includes(search.toLowerCase()));
  // Sort by name for consistent display
  const sortedEquipe = [...filteredEquipe].sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin size-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
        <div className="flex-1 w-full max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input 
            placeholder="Buscar membro..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10 bg-white dark:bg-slate-900 border-0 shadow-sm"
          />
        </div>
        
        <Button onClick={saveCaches} disabled={saving} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold h-10 px-6 rounded-xl shadow-md flex items-center gap-2">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Salvar Cachês
        </Button>
      </div>

      {equipe.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 bg-transparent rounded-[2rem]">
          <DollarSign className="size-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Nenhum profissional escalado</h3>
          <p className="text-slate-500 dark:text-slate-400">Escale a equipe no evento primeiro para definir os cachês.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedEquipe.map(p => (
            <Card key={p.escala_id} className="p-4 flex items-center justify-between shadow-sm border-0 bg-white dark:bg-card/40 dark:backdrop-blur-md dark:border dark:border-white/10 rounded-2xl">
              <div className="flex items-center gap-3 overflow-hidden">
                <Avatar className="size-10 border-2 border-slate-100 dark:border-white/10">
                  <AvatarImage src={p.foto_url || undefined} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">{p.nome ? p.nome[0].toUpperCase() : 'U'}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{p.nome}</p>
                  {p.funcao && (
                    <Badge variant="secondary" className="mt-0.5 text-[10px] bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300 px-1.5 py-0 border-none capitalize">
                      {p.funcao.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1 pl-3 shrink-0">
                <span className="text-slate-400 font-bold text-sm">R$</span>
                <CurrencyInput 
                  className="w-28 h-9 font-bold text-right" 
                  value={caches[p.escala_id] || ''}
                  onChange={val => setCaches({...caches, [p.escala_id]: val})}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
