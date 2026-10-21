import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Save, Loader2, Search, FileText, Upload, CheckCircle2, Clock, Trash2, Bell } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CachesEquipeTab({ roadbookId, eventoId }: { roadbookId?: string; eventoId?: string }) {
  const [equipe, setEquipe] = useState<any[]>([]);
  const [caches, setCaches] = useState<Record<string, string>>({});
  const [diarias, setDiarias] = useState<Record<string, string>>({});
  const [qtdDiarias, setQtdDiarias] = useState<Record<string, number>>({});
  const [transportes, setTransportes] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Record<string, string>>({});
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [recibos, setRecibos] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  
  const [eventoInfo, setEventoInfo] = useState<{ espetaculo?: string; cidade?: string }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    if (!roadbookId && !eventoId) {
      setLoading(false);
      return;
    }
    fetchEquipeCaches();
  }, [roadbookId, eventoId]);

  async function fetchEquipeCaches() {
    setLoading(true);
    let realEventoId = eventoId;

    if (!realEventoId && roadbookId) {
      const { data: rbData } = await supabase.from('roadbooks').select('evento_id, cidade, espetaculo').eq('id', roadbookId).maybeSingle();
      realEventoId = rbData?.evento_id;
      if (rbData) {
        setEventoInfo({ espetaculo: rbData.espetaculo, cidade: rbData.cidade });
      }
      if (!realEventoId && rbData?.cidade && rbData?.espetaculo) {
        const { data: evData } = await supabase.from('eventos').select('id, espetaculo, cidade').eq('cidade', rbData.cidade).eq('espetaculo', rbData.espetaculo).maybeSingle();
        if (evData) {
          realEventoId = evData.id;
          setEventoInfo({ espetaculo: evData.espetaculo, cidade: evData.cidade });
        }
      }
    } else if (realEventoId) {
      const { data: evData } = await supabase.from('eventos').select('id, espetaculo, cidade').eq('id', realEventoId).maybeSingle();
      if (evData) {
        setEventoInfo({ espetaculo: evData.espetaculo, cidade: evData.cidade });
      }
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
    const newDiarias: Record<string, string> = {};
    const newTransportes: Record<string, string> = {};
    const newStatus: Record<string, string> = {};
    const newNotas: Record<string, string> = {};
    const newRecibos: Record<string, string> = {};

    const formattedEquipe = (escalas || []).map((e: any) => {
      const c = cacheData.find((x: any) => x.escala_id === e.id);
      if (c) {
        if (c.cache_valor !== null && c.cache_valor !== undefined) newCaches[e.id] = Number(c.cache_valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        if (c.diaria_valor !== null && c.diaria_valor !== undefined) newDiarias[e.id] = Number(c.diaria_valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        if (c.transporte_valor !== null && c.transporte_valor !== undefined) newTransportes[e.id] = Number(c.transporte_valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
    setDiarias(newDiarias);
    setTransportes(newTransportes);
    setStatus(newStatus);
    setNotas(newNotas);
    setRecibos(newRecibos);
    setLoading(false);
  }

  
  async function cobrarNota(escalaId: string) {
    const membro = equipe.find(e => e.escala_id === escalaId);
    if (!membro) return;
    
    const titulo = `Nota Fiscal Pendente - ${eventoInfo.espetaculo || 'Evento'} ${eventoInfo.cidade ? 'em ' + eventoInfo.cidade : ''}`;
    const mensagem = `Por favor, anexe sua nota fiscal referente à sua atuação.`;
    
    const { error } = await supabase.from('notificacoes').insert({
      usuario_id: membro.usuario_id,
      titulo,
      mensagem,
      tipo: 'financeiro',
      link: '/meus-pagamentos'
    });
            
    if (!error) toast.success(`Cobrança enviada para ${membro.nome}`);
    else toast.error("Erro ao enviar cobrança: " + error.message);
  }

  const handleStatusChange = async (escalaId: string, novoStatus: string) => {
    setStatus(prev => ({...prev, [escalaId]: novoStatus}));
    try {
      const val = caches[escalaId];
      let numVal = val ? parseFloat(val.replace(/\./g, '').replace(',', '.')) : 0;
      if (isNaN(numVal)) numVal = 0;

      const dVal = diarias[escalaId];
      let numDiaria = dVal ? parseFloat(dVal.replace(/\./g, '').replace(',', '.')) : 0;
      if (isNaN(numDiaria)) numDiaria = 0;

      const tVal = transportes[escalaId];
      let numTransporte = tVal ? parseFloat(tVal.replace(/\./g, '').replace(',', '.')) : 0;
      if (isNaN(numTransporte)) numTransporte = 0;
  
      const { error } = await supabase.from('evento_escalas_financeiro').upsert({
        escala_id: escalaId,
        status_pagamento: novoStatus,
        cache_valor: numVal,
        diaria_valor: numDiaria,
        transporte_valor: numTransporte,
        recibo_url: recibos[escalaId] || null
      }, { onConflict: 'escala_id' });
      if (error) throw error;
      toast.success("Status atualizado!");
      
      if (novoStatus === 'pago') {
          const membro = equipe.find(e => e.escala_id === escalaId);
          if (membro && membro.usuario_id) {
            await supabase.from('notificacoes').insert({
              usuario_id: membro.usuario_id,
              titulo: 'Pagamento Realizado! 💰',
              mensagem: `Seu cachê do evento ${eventoInfo.espetaculo || ''} ${eventoInfo.cidade ? 'em '+eventoInfo.cidade : ''} foi pago.`,
              tipo: 'financeiro',
              link: '/meus-pagamentos'
            });
          }
        }
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

      const dVal = diarias[escalaId];
      let numDiaria = dVal ? parseFloat(dVal.replace(/\./g, '').replace(',', '.')) : 0;
      if (isNaN(numDiaria)) numDiaria = 0;

      const tVal = transportes[escalaId];
      let numTransporte = tVal ? parseFloat(tVal.replace(/\./g, '').replace(',', '.')) : 0;
      if (isNaN(numTransporte)) numTransporte = 0;

      const { error } = await supabase.from('evento_escalas_financeiro').upsert({
        escala_id: escalaId,
        cache_valor: numVal,
        diaria_valor: numDiaria,
        transporte_valor: numTransporte,
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

        const dVal = diarias[membro.escala_id];
        let numDiaria = dVal ? parseFloat(dVal.replace(/\./g, '').replace(',', '.')) : 0;
        if (isNaN(numDiaria)) numDiaria = 0;

        const tVal = transportes[membro.escala_id];
        let numTransporte = tVal ? parseFloat(tVal.replace(/\./g, '').replace(',', '.')) : 0;
        if (isNaN(numTransporte)) numTransporte = 0;
        
        financeiroPayload.push({
          escala_id: membro.escala_id,
          cache_valor: numVal,
          diaria_valor: numDiaria,
          transporte_valor: numTransporte,
          status_pagamento: status[membro.escala_id] || 'pendente',
          recibo_url: recibos[membro.escala_id] || null
        });
      }

      if (financeiroPayload.length > 0) {
        const { error } = await supabase.from('evento_escalas_financeiro').upsert(financeiroPayload, { onConflict: 'escala_id' });
        if (error) throw error;
      }

      toast.success("Valores salvos com sucesso!");
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
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white dark:bg-card"
          />
        </div>
        <Button onClick={saveCaches} disabled={saving} className="w-full sm:w-auto font-bold gap-2">
          {saving ? <Loader2 className="animate-spin size-4" /> : <Save className="size-4" />}
          Salvar Alterações
        </Button>
      </div>

      {sortedEquipe.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-card/50 rounded-2xl border border-slate-100 dark:border-white/5">
          <DollarSign className="size-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Nenhum profissional encontrado</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto mt-1">
            Não há profissionais escalados para este evento ou a busca não retornou resultados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedEquipe.map((p) => {
            return (
              <Card key={p.escala_id} className="overflow-hidden border-slate-200 dark:border-white/10 hover:shadow-md transition-shadow flex flex-col justify-between">
                <div className="p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-12 border border-slate-100 dark:border-white/10">
                      <AvatarImage src={p.foto_url} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {p.nome?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <h4 className="font-bold text-slate-800 dark:text-white truncate">{p.nome}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0">
                          {(p.funcao || p.role || 'Membro').replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-500">Cachê:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 font-medium text-xs">R$</span>
                        <CurrencyInput 
                          className="w-28 h-8 text-xs text-right font-bold" 
                          value={caches[p.escala_id] || ''}
                          onChange={val => setCaches({...caches, [p.escala_id]: val})}
                          placeholder="0,00"
                        />
                      </div>
                    </div>

                    {/* Bloco de Diária + Quantidade */}
                    <div className="bg-slate-50/80 dark:bg-white/5 p-2 rounded-xl space-y-2 border border-slate-100 dark:border-white/5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-slate-500">Valor Diária:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 font-medium text-xs">R$</span>
                          <CurrencyInput 
                            className="w-28 h-8 text-xs text-right" 
                            value={diarias[p.escala_id] || ''}
                            onChange={val => setDiarias({...diarias, [p.escala_id]: val})}
                            placeholder="0,00"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-slate-500">Qtd. Diárias:</span>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="1"
                            max="90"
                            value={qtdDiarias[p.escala_id] ?? 1}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              setQtdDiarias({ ...qtdDiarias, [p.escala_id]: isNaN(val) || val < 1 ? 1 : val });
                            }}
                            className="w-16 h-7 text-xs text-center font-bold"
                          />
                          <span className="text-[10px] text-slate-400 font-semibold">dias</span>
                        </div>
                      </div>
                      {(() => {
                        const dValStr = diarias[p.escala_id] || '0,00';
                        const dNum = parseFloat(dValStr.replace(/\./g, '').replace(',', '.')) || 0;
                        const qNum = qtdDiarias[p.escala_id] ?? 1;
                        const tot = dNum * qNum;
                        if (dNum > 0 && qNum > 1) {
                          return (
                            <div className="flex items-center justify-between text-[11px] text-primary font-bold bg-primary/5 px-2 py-0.5 rounded-lg">
                              <span>Total Diárias ({qNum}x):</span>
                              <span>R$ {tot.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-500">Transporte:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 font-medium text-xs">R$</span>
                        <CurrencyInput 
                          className="w-28 h-8 text-xs text-right" 
                          value={transportes[p.escala_id] || ''}
                          onChange={val => setTransportes({...transportes, [p.escala_id]: val})}
                          placeholder="0,00"
                        />
                      </div>
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
                      <div className="flex items-center gap-2"><span className="text-xs text-slate-400 italic">Não anexada</span><Button variant="outline" size="sm" className="h-8 text-xs text-orange-600 border-orange-200 hover:bg-orange-50" onClick={() => cobrarNota(p.escala_id)}><Bell className="size-3 mr-1" /> Cobrar</Button></div>
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
                      <div>
                        <input
                          type="file"
                          className="hidden"
                          ref={el => fileInputRefs.current[p.escala_id] = el}
                          onChange={(e) => handleFileUpload(e, p.escala_id)}
                          accept="image/*,application/pdf"
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-xs"
                          disabled={uploading[p.escala_id]}
                          onClick={() => fileInputRefs.current[p.escala_id]?.click()}
                        >
                          {uploading[p.escala_id] ? (
                            <Loader2 className="animate-spin size-3" />
                          ) : (
                            <Upload className="size-3 mr-1" />
                          )}
                          {recibos[p.escala_id] ? 'Trocar' : 'Anexar'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
