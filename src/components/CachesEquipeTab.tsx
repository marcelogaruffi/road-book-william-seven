import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Save, Loader2, Search, FileText, Upload, CheckCircle2, Clock, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CachesEquipeTab({ roadbookId }: { roadbookId?: string }) {
  const [equipe, setEquipe] = useState<any[]>([]);
  const [caches, setCaches] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Record<string, string>>({});
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [recibos, setRecibos] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    if (!roadbookId) {
      setLoading(false);
      return;
    }
    fetchEquipeCaches();
  }, [roadbookId]);

  async function fetchEquipeCaches() {
    setLoading(true);
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

    const { data: escalas, error: errEscalas } = await supabase
      .from("evento_escalas")
      .select(`id, usuario_id, funcao, profiles!inner(id, nome, foto_url, role)`)
      .eq("evento_id", realEventoId);

    if (errEscalas) {
      toast.error("Erro ao buscar equipe");
      setLoading(false);
      return;
    }

    const escalaIds = (escalas || []).map((e: any) => e.id);
    let cacheData: any[] = [];
    if (escalaIds.length > 0) {
      const { data, error: errCache } = await supabase
        .from("evento_escalas_financeiro")
        .select("*")
        .in("escala_id", escalaIds);
      
      if (!errCache && data) {
        cacheData = data;
      }
    }

    const newCaches: Record<string, string> = {};
    const newStatus: Record<string, string> = {};
    const newNotas: Record<string, string> = {};
    const newRecibos: Record<string, string> = {};

    const formattedEquipe = (escalas || []).map((e: any) => {
      const c = cacheData.find((x: any) => x.escala_id === e.id);
      if (c) {
        if (c.cache_valor !== null) newCaches[e.id] = Number(c.cache_valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        if (c.status_pagamento) newStatus[e.id] = c.status_pagamento;
        if (c.nota_fiscal_url) newNotas[e.id] = c.nota_fiscal_url;
        if (c.recibo_url) newRecibos[e.id] = c.recibo_url;
      } else {
        newStatus[e.id] = 'pendente';
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
    setStatus(newStatus);
    setNotas(newNotas);
    setRecibos(newRecibos);
    setLoading(false);
  }

  const handleStatusChange = async (escalaId: string, novoStatus: string) => {
    setStatus(prev => ({...prev, [escalaId]: novoStatus}));
    try {
      const val = caches[escalaId];
      let numVal = val ? parseFloat(val.replace(/\./g, '').replace(',', '.')) : 0;
      if (isNaN(numVal)) numVal = 0;
  
      const { error } = await supabase.from('evento_escalas_financeiro').upsert({
        escala_id: escalaId,
        status_pagamento: novoStatus,
        cache_valor: numVal,
        recibo_url: recibos[escalaId] || null
      }, { onConflict: 'escala_id' });
      if (error) throw error;
      toast.success("Status atualizado!");
    } catch (err: any) {
      toast.error("Erro ao atualizar status");
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, escalaId: string) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(prev => ({ ...prev, [escalaId]: true }));
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${escalaId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('recibos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('recibos')
        .getPublicUrl(filePath);

      setRecibos(prev => ({ ...prev, [escalaId]: publicUrl }));

      // Auto save
      const val = caches[escalaId];
      let numVal = val ? parseFloat(val.replace(/\./g, '').replace(',', '.')) : 0;
      if (isNaN(numVal)) numVal = 0;
      const { error } = await supabase.from('evento_escalas_financeiro').upsert({
        escala_id: escalaId,
        cache_valor: numVal,
        status_pagamento: status[escalaId] || 'pendente',
        recibo_url: publicUrl
      }, { onConflict: 'escala_id' });
      
      if (error) throw error;
      toast.success("Recibo anexado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao fazer upload do recibo.");
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
      
      if (tipo === 'nota_fiscal_url') {
        setNotas(prev => ({...prev, [escalaId]: ''}));
        toast.success("Nota fiscal removida!");
      } else {
        setRecibos(prev => ({...prev, [escalaId]: ''}));
        toast.success("Recibo removido!");
      }
    } catch (err) {
      toast.error("Erro ao remover arquivo.");
    }
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
          cache_valor: numVal,
          status_pagamento: status[membro.escala_id] || 'pendente',
          recibo_url: recibos[membro.escala_id] || null
        });
      }

      if (financeiroPayload.length > 0) {
        const { error } = await supabase.from('evento_escalas_financeiro').upsert(financeiroPayload, { onConflict: 'escala_id' });
        if (error) throw error;
      }

      toast.success("Cachês salvos com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  const filteredEquipe = equipe.filter(p => p.nome?.toLowerCase().includes(search.toLowerCase()));
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {sortedEquipe.map(p => (
            <Card key={p.escala_id} className="flex flex-col shadow-sm border-0 bg-white dark:bg-card/40 dark:backdrop-blur-md dark:border dark:border-white/10 rounded-2xl overflow-hidden">
              <div className="p-4 flex flex-col gap-4 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10 border-2 border-slate-100 dark:border-white/10">
                    <AvatarImage src={p.foto_url || undefined} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">{p.nome ? p.nome[0].toUpperCase() : 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{p.nome}</p>
                    {p.funcao && (
                      <Badge variant="secondary" className="mt-0.5 text-[10px] bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300 px-1.5 py-0 border-none capitalize">
                        {p.funcao.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-500">Cachê:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 font-bold text-sm">R$</span>
                    <CurrencyInput 
                      className="w-28 h-9 font-bold text-right" 
                      value={caches[p.escala_id] || ''}
                      onChange={val => setCaches({...caches, [p.escala_id]: val})}
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50/50 dark:bg-white/5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-500">Status:</span>
                  <Select
                    value={status[p.escala_id] || 'pendente'}
                    onValueChange={(val) => handleStatusChange(p.escala_id, val)}
                  >
                    <SelectTrigger className="w-32 h-8 text-xs font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">
                        <div className="flex items-center gap-2 text-amber-600"><Clock className="size-3"/> Pendente</div>
                      </SelectItem>
                      <SelectItem value="pago">
                        <div className="flex items-center gap-2 text-emerald-600"><CheckCircle2 className="size-3"/> Pago</div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 justify-between">
                  <span className="text-sm font-semibold text-slate-500">Nota Fiscal:</span>
                  {notas[p.escala_id] ? (
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" className="h-8 text-xs bg-white text-blue-600 border-blue-200 hover:bg-blue-50" asChild>
                        <a href={notas[p.escala_id]} target="_blank" rel="noopener noreferrer">
                          <FileText className="size-3 mr-1" /> Ver NF
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-500 border-red-200 hover:bg-red-50" onClick={() => handleDeleteFile(p.escala_id, 'nota_fiscal_url')}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Não anexada</span>
                  )}
                </div>

                <div className="flex items-center gap-2 justify-between">
                  <span className="text-sm font-semibold text-slate-500">Recibo:</span>
                  <div className="flex items-center gap-2">
                    {recibos[p.escala_id] && (
                      <>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-green-600 border-green-200 hover:bg-green-50" asChild>
                          <a href={recibos[p.escala_id]} target="_blank" rel="noopener noreferrer">
                            <FileText className="size-4" />
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-500 border-red-200 hover:bg-red-50" onClick={() => handleDeleteFile(p.escala_id, 'recibo_url')}>
                          <Trash2 className="size-4" />
                        </Button>
                      </>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 text-xs" 
                      onClick={() => fileInputRefs.current[p.escala_id]?.click()}
                      disabled={uploading[p.escala_id]}
                    >
                      {uploading[p.escala_id] ? <Loader2 className="size-3 animate-spin mr-1" /> : <Upload className="size-3 mr-1" />}
                      {recibos[p.escala_id] ? 'Trocar' : 'Anexar'}
                    </Button>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".pdf"
                      ref={el => fileInputRefs.current[p.escala_id] = el}
                      onChange={(e) => handleFileUpload(e, p.escala_id)}
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
