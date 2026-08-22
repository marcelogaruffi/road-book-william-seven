// @ts-nocheck
import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from "@/components/CurrencyInput";

import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Edit, Trash2, Plus, Users, Save, X, ClipboardList, Lightbulb, Mic2, MessageSquareText, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from "sonner";
import { Route as AuthedRoute } from "./route";
import RiderViewModal from "@/components/RiderViewModal";

export const Route = createFileRoute('/_authenticated/eventos')({
  component: EventosComponent,
});

type Evento = {
  id: string;
  cidade: string;
  turne_id: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  data: string;
  horario: string;
  local: string;
  espetaculo: string;
  equipe: string[];
};

type Profile = {
  id: string;
  nome: string;
  role: string;
};

type Tour = {
  id: string;
  nome: string;
};

function EventosComponent() {
  const { profile, isSimulating } = AuthedRoute.useRouteContext();
  const role = profile?.role || null;
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [profissionais, setProfissionais] = useState<Profile[]>([]);
  const [templatesEspetaculos, setTemplatesEspetaculos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form states
  const [cidade, setCidade] = useState('');
  const [turneId, setTurneId] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [dataApres, setDataApres] = useState('');
  const [horario, setHorario] = useState('');
  const [local, setLocal] = useState('');
  const [espetaculo, setEspetaculo] = useState('');
  const [escalasAtuais, setEscalasAtuais] = useState<{usuario_id: string, funcao: string}[]>([]);
  const [escalasOriginais, setEscalasOriginais] = useState<{usuario_id: string, funcao: string}[]>([]);
  // Compute derived state for easy lookup
  const equipe = Array.from(new Set(escalasAtuais.map(e => e.usuario_id)));
  const [caches, setCaches] = useState<Record<string, string>>({});
  const [showCachesDialog, setShowCachêêesDialog] = useState(false);
  const [searchEquipe, setSearchEquipe] = useState('');
  const [permitirSms, setPermitirSms] = useState(false);

  // SMS Dialog states
  const [showSmsDialog, setShowSmsDialog] = useState(false);
  const [smsMembersToNotify, setSmsMembersToNotify] = useState<string[]>([]);
  const [smsMessage, setSmsMessage] = useState('');
  const [sendingSms, setSendingSms] = useState(false);

  // Rider dialog states
  const [openRiderDialog, setOpenRiderDialog] = useState(false);
  const [loadingRider, setLoadingRider] = useState(false);
  const [currentRiderSom, setCurrentRiderSom] = useState<any>(null);
  const [currentRiderLuz, setCurrentRiderLuz] = useState<any>(null);
  const [currentEventName, setCurrentEventName] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [escalas, setEscalas] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [evRes, trRes, profRes, tempRes, confRes, escRes] = await Promise.all([
      supabase.from('eventos').select('*').order('data', { ascending: true }),
      supabase.from('tours').select('id, nome').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, nome, role, funcoes, caches_padrao').in('role', ['admin', 'dev', 'produtor', 'motorista', 'tecnico_som', 'iluminador', 'elenco', 'stage_manager', 'contra_regra', 'assistente_producao', 'camareiro', 'musico', 'tour_manager', 'roadie', 'cenotecnico', 'tecnico_video']),
      supabase.from('templates_espetaculos').select('nome_espetaculo'),
      supabase.from('configuracoes_sistema').select('permitir_sms_escala').eq('id', 1).maybeSingle(),
      supabase.from('evento_escalas').select('*')
    ]);

    if (evRes.data) {
      let finalEv = evRes.data;
      if (isSimulating && profile && !['admin', 'dev', 'produtor'].includes(profile.role)) {
        finalEv = finalEv.filter(e => ((e.equipe as string[]) || []).includes(profile.id));
      }
      setEventos(finalEv as any);
    }
    if (trRes.data) setTours(trRes.data);
    if (profRes.data) setProfissionais(profRes.data);
    if (tempRes.data) setTemplatesEspetaculos(tempRes.data.map(t => t.nome_espetaculo));
    if (confRes?.data) setPermitirSms(confRes.data.permitir_sms_escala);
    if (escRes?.data) setEscalas(escRes.data);
    setLoading(false);
  };

  const canEdit = ['dev', 'admin', 'produtor'].includes(role || '');

  const handleOpenNew = () => {
    setEditingId(null);
    setCidade('');
    setTurneId('');
    setDataInicio('');
    setDataFim('');
    setDataApres('');
    setHorario('');
    setLocal('');
    setEspetaculo('');
    setEscalasAtuais([]);
    setEscalasOriginais([]);
    
    setSearchEquipe('');
    setShowDropdown(false);
    setOpenDialog(true);
  };

  const handleOpenEdit = async (ev: Evento) => {
    setEditingId(ev.id);
    setCidade(ev.cidade);
    setTurneId(ev.turne_id || '');
    setDataInicio(ev.data_inicio || '');
    setDataFim(ev.data_fim || '');
    setDataApres(ev.data);
    setHorario(ev.horario);
    setLocal(ev.local);
    setEspetaculo(ev.espetaculo);
    setShowDropdown(false);
    
    setCaches({});
    
    let novasEscalas: {usuario_id: string, funcao: string}[] = [];
    if (['admin', 'dev', 'produtor'].includes(role || '')) {
       const { data: escData } = await supabase.from('evento_escalas').select('id, usuario_id, funcao').eq('evento_id', ev.id);
       if (escData && escData.length > 0) {
         const { data: cacheData } = await supabase.from('evento_escalas_financeiro').select('escala_id, cache_valor').in('escala_id', escData.map(e => e.id));
         const cMap: any = {};
         escData.forEach(e => {
           if (e.funcao) {
             novasEscalas.push({ usuario_id: e.usuario_id, funcao: e.funcao });
             const c = cacheData?.find(x => x.escala_id === e.id);
             if (c && c.cache_valor > 0) {
               cMap[`${e.usuario_id}_${e.funcao}`] = c.cache_valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
             }
           }
         });
         setCaches(cMap);
       } else if (ev.equipe && ev.equipe.length > 0) {
         // Fallback for old events without scales
         novasEscalas = ev.equipe.map(uid => {
           const p = profissionais.find(pr => pr.id === uid);
           return { usuario_id: uid, funcao: p?.role || 'user' };
         });
       }
    } else {
       if (ev.equipe && ev.equipe.length > 0) {
         novasEscalas = ev.equipe.map(uid => ({ usuario_id: uid, funcao: 'user' }));
       }
    }
    setEscalasAtuais(novasEscalas);
    setEscalasOriginais([...novasEscalas]);
    
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este evento?')) return;
    const { error } = await supabase.from('eventos').delete().eq('id', id);
    if (error) {
      toast.error(getErrorMessage(error));
    } else {
      toast.success('Evento excluído.');
      loadData();
    }
  };

  const handleCreateEspetaculo = async () => {
    const novo = window.prompt("Qual o nome do novo Espetáculo?");
    if (!novo || !novo.trim()) return;
    const cleanName = novo.trim();
    if (templatesEspetaculos.includes(cleanName)) {
      toast.warning("Este espetáculo já existe.");
      setEspetaculo(cleanName);
      return;
    }
    const { error } = await supabase.from('templates_espetaculos').insert({ nome_espetaculo: cleanName });
    if (error) {
      toast.error("Erro ao criar espetáculo: " + getErrorMessage(error));
    } else {
      toast.success("Espetáculo cadastrado!");
      setTemplatesEspetaculos(prev => [...prev, cleanName].sort());
      setEspetaculo(cleanName);
    }
  };

  const handleSave = async () => {
    if (!cidade || !dataApres || !horario || !local || !espetaculo) {
      toast.warning('Preencha os campos obrigatórios.');
      return;
    }

    const payload = {
      cidade,
      turne_id: turneId || null,
      data_inicio: dataInicio || null,
      data_fim: dataFim || null,
      data: dataApres,
      horario,
      local,
      espetaculo,
      equipe
    };

    let error;
    let savedEventId = editingId;
    if (editingId) {
      const res = await supabase.from('eventos').update(payload).eq('id', editingId);
      error = res.error;
    } else {
      const { data: userData } = await supabase.auth.getUser();
      const res = await supabase.from('eventos').insert({ ...payload, created_by: userData.user?.id }).select('id').single();
      error = res.error;
      if (res.data) savedEventId = res.data.id;
    }

    if (error) {
      toast.error(getErrorMessage(error));
    } else {
      toast.success('Evento salvo com sucesso.');
      setOpenDialog(false);
      loadData();
      
      // Delete removed scales
      const removedEscalas = escalasOriginais.filter(eo => !escalasAtuais.some(ea => ea.usuario_id === eo.usuario_id && ea.funcao === eo.funcao));
      if (removedEscalas.length > 0 && savedEventId) {
        for (const re of removedEscalas) {
           await supabase.from('evento_escalas').delete().match({ evento_id: savedEventId, usuario_id: re.usuario_id, funcao: re.funcao });
        }
      }

      // Find explicitly added scales
      const novasEscalas = escalasAtuais.filter(ea => !escalasOriginais.some(eo => eo.usuario_id === ea.usuario_id && eo.funcao === ea.funcao));
      
      if (novasEscalas.length > 0 && savedEventId) {
        const escalasToInsert = novasEscalas.map(ne => ({
          evento_id: savedEventId,
          usuario_id: ne.usuario_id,
          status: 'pendente',
          funcao: ne.funcao
        }));
        await supabase.from('evento_escalas').insert(escalasToInsert);
        
        // Group notifications by user so they receive only one
        const userNotifs: Record<string, { funcoes: string[], totalCache: number }> = {};
        for (const ne of novasEscalas) {
           if (!userNotifs[ne.usuario_id]) userNotifs[ne.usuario_id] = { funcoes: [], totalCache: 0 };
           userNotifs[ne.usuario_id].funcoes.push(ne.funcao.replace('_', ' '));
           const valStr = caches[`${ne.usuario_id}_${ne.funcao}`] || '0';
           const val = parseFloat(valStr.replace(/\./g, '').replace(',', '.')) || 0;
           userNotifs[ne.usuario_id].totalCache += val;
        }

        const notificacoes = Object.keys(userNotifs).map(uid => {
          const n = userNotifs[uid];
          const funcStr = n.funcoes.join(' e ');
          const cacheStr = n.totalCache > 0 ? ` totalizando R$ ${n.totalCache.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : '';
          return {
            usuario_id: uid,
            tipo: 'escala',
            titulo: 'Nova Escala de Trabalho',
            mensagem: `Você foi escalado(a) como ${funcStr} para ${espetaculo} em ${cidade}${cacheStr}! Data: ${new Date(dataApres + 'T12:00:00Z').toLocaleDateString('pt-BR')}. Acesse para responder.`,
            link: '/'
          };
        });
        await supabase.from('notificacoes').insert(notificacoes);

        if (permitirSms) {
          const smsUids = Object.keys(userNotifs);
          if (smsUids.length > 0) {
            setSmsMembersToNotify(smsUids);
            setSmsMessage(`Olá! Você foi escalado(a) para o espetáculo ${espetaculo} em ${cidade}. Acesse o painel de gestão do William Seven para mais detalhes sobre cachê e datas!`);
            setShowSmsDialog(true);
          }
        }
      }

      // Update Financials for ALL current scales (since cache might have changed)
      if (['admin', 'dev', 'produtor'].includes(role || '') && savedEventId) {
        const { data: escData } = await supabase.from('evento_escalas').select('id, usuario_id, funcao').eq('evento_id', savedEventId);
        if (escData) {
          const financeiroUpserts = escData.map(esc => {
            const valStr = caches[`${esc.usuario_id}_${esc.funcao}`] || '0';
            const val = parseFloat(valStr.replace(/\./g, '').replace(',', '.')) || 0;
            return {
              escala_id: esc.id,
              cache_valor: val
            };
          });
          if (financeiroUpserts.length > 0) {
            await supabase.from('evento_escalas_financeiro').upsert(financeiroUpserts);
          }
        }
      }
    }
  };

  const handleSendSms = async (members: string[], customMessage: string) => {
    setSendingSms(true);
    const { data, error } = await supabase.rpc('send_sms_notification', {
      profile_ids: members,
      sms_body: customMessage
    });
    setSendingSms(false);
    
    if (error) {
      toast.error("Erro ao enviar SMS: " + getErrorMessage(error));
    } else {
      const result: any = data;
      if (result.success > 0) {
        toast.success(`SMS enviado com sucesso para ${result.success} pessoa(s).`);
      }
      if (result.failed_no_phone > 0) {
        toast.warning(`${result.failed_no_phone} pessoa(s) não tinham telefone cadastrado.`);
      }
      if (result.failed_api > 0) {
        if (result.last_api_error) {
          toast.error(`Falha no Twilio: ${result.last_api_error}`);
          console.error("Twilio Error:", result.last_api_error);
        } else {
          toast.error(`Falha ao enviar para ${result.failed_api} pessoa(s) (Verifique o saldo do Twilio ou os números autorizados no modo Trial).`);
        }
      }
      setShowSmsDialog(false);
    }
  };

  const notifyAll = (ev: Evento) => {
    if (!ev.equipe || ev.equipe.length === 0) {
      toast.warning('Este evento não possui equipe escalada.');
      return;
    }
    setSmsMembersToNotify(ev.equipe);
    setSmsMessage(`Lembrete: O espetáculo ${ev.espetaculo} em ${ev.cidade} será dia ${new Date(ev.data + 'T12:00:00Z').toLocaleDateString('pt-BR')}.`);
    setShowSmsDialog(true);
  };

  const handleViewRider = async (ev: Evento) => {
    setCurrentEventName(`${ev.espetaculo} em ${ev.cidade}`);
    setOpenRiderDialog(true);
    setLoadingRider(true);
    setCurrentRiderSom(null);
    setCurrentRiderLuz(null);

    const [resSom, resLuz] = await Promise.all([
      supabase.from('mapas_som').select('*').eq('evento_id', ev.id).maybeSingle(),
      supabase.from('mapas_luz').select('*').eq('evento_id', ev.id).maybeSingle()
    ]);

    if (resSom.data) setCurrentRiderSom(resSom.data);
    if (resLuz.data) setCurrentRiderLuz(resLuz.data);
    
    setLoadingRider(false);
  };

  const toggleEquipe = (id: string, funcao: string) => {
    setEscalasAtuais(prev => {
      const exists = prev.some(e => e.usuario_id === id && e.funcao === funcao);
      if (exists) {
        // Remove scale
        setCaches(c => { const nc = { ...c }; delete nc[`${id}_${funcao}`]; return nc; });
        return prev.filter(e => !(e.usuario_id === id && e.funcao === funcao));
      } else {
        // Add scale
        const prof = profissionais.find(p => p.id === id);
        if (prof && prof.caches_padrao) {
          const baseCaches = typeof prof.caches_padrao === 'object' && prof.caches_padrao !== null ? prof.caches_padrao : {};
          const cacheVal = baseCaches[funcao] ? baseCaches[funcao] : null;
          if (cacheVal) {
            setCaches(c => ({ ...c, [`${id}_${funcao}`]: cacheVal }));
          }
        }
        return [...prev, { usuario_id: id, funcao }];
      }
    });
  };

  const getTourName = (id: string | null) => tours.find(t => t.id === id)?.nome || 'Sem turnê vinculada';
  const fmtDate = (d: string) => d ? new Date(d + 'T12:00:00Z').toLocaleDateString('pt-BR') : '';

  const hoje = new Date().toISOString().split('T')[0];
  const proximos = eventos.filter(e => (e.data_fim || e.data) >= hoje);
  const realizados = eventos.filter(e => (e.data_fim || e.data) < hoje).reverse();

  const renderEventoCard = (ev: Evento) => (
    <Card key={ev.id} className="p-5 flex flex-col md:flex-row md:items-center gap-5 justify-between group rounded-[1.5rem]">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-bold">
            <Calendar className="size-3 mr-1" /> {fmtDate(ev.data)} às {ev.horario?.substring(0,5)}
          </Badge>
          {ev.turne_id && (
            <Badge variant="outline" className="text-slate-500">
              Turnê: {getTourName(ev.turne_id)}
            </Badge>
          )}
        </div>
        <h3 className="font-black text-xl text-slate-800 dark:text-white mb-1">{ev.espetaculo}</h3>
        <div className="flex items-center text-sm font-semibold text-slate-500 gap-4">
          <span className="flex items-center"><MapPin className="size-4 mr-1"/> {ev.cidade} - {ev.local}</span>
          <span className="flex items-center"><Users className="size-4 mr-1"/> {ev.equipe?.length || 0} membros na equipe</span>
        </div>
      </div>

      {canEdit && (
        <div className="flex flex-wrap gap-2 justify-end w-full md:w-auto">
          {permitirSms && (
            <Button variant="outline" size="sm" onClick={() => notifyAll(ev)} className="rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50" title="Notificar Equipe via SMS">
              <Mic2 className="size-4 mr-1" /> Avisar escala via SMS
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => handleViewRider(ev)} className="rounded-xl border-slate-200" title="Ver Riders de Palco">
            <Lightbulb className="size-4 mr-1" /> Riders
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(ev)} className="rounded-xl text-slate-400 hover:text-primary hover:bg-primary/10">
            <Edit className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(ev.id)} className="rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
            <Trash2 className="size-4" />
          </Button>
        </div>
      )}
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Eventos</h1>
          <p className="text-slate-500 mt-2">
            Gestão de Eventos e Espetáculos
          </p>
        </div>
        {canEdit && (
          <Button onClick={handleOpenNew} className="rounded-xl px-6 h-12 shadow-md">
            <Plus className="mr-2 size-5" /> Adicionar Evento
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
      ) : proximos.length === 0 && realizados.length === 0 ? (
        <Card className="p-16 text-center border-dashed border-2 bg-transparent rounded-[2rem]">
          <p className="text-slate-500 font-medium mb-6">Nenhum evento cadastrado ainda.</p>
        </Card>
      ) : (
        <div className="space-y-12">
          {proximos.length > 0 ? (
            <div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-6">Próximos Eventos</h3>
              <div className="grid gap-4">
                {proximos.map(renderEventoCard)}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 bg-white dark:bg-card/50 rounded-3xl border border-slate-100 dark:border-white/5">
              <p className="text-slate-500 font-medium">Nenhum evento futuro encontrado.</p>
            </div>
          )}
          
          {realizados.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-6 opacity-70">
                <h3 className="text-xl font-bold tracking-tight text-slate-500 dark:text-slate-400">Eventos Realizados</h3>
                <div className="h-px flex-1 bg-slate-200 dark:bg-white/10"></div>
              </div>
              <div className="grid gap-4 opacity-90">
                {realizados.map(renderEventoCard)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* DIALOG FORM */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">{editingId ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-4">
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label className="font-bold text-slate-700 dark:text-slate-300">Nome do Evento / Espetáculo *</Label>
                <Button type="button" variant="ghost" size="sm" onClick={handleCreateEspetaculo} className="h-8 text-primary font-bold">
                  <Plus className="size-4 mr-1" /> Novo Espetáculo
                </Button>
              </div>
              <select 
                value={espetaculo} 
                onChange={e => setEspetaculo(e.target.value)}
                className="flex h-12 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Selecione um espetáculo...</option>
                {templatesEspetaculos.map(esp => (
                  <option key={esp} value={esp}>{esp}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Vincular à Turnê (Opcional)</Label>
              <select 
                value={turneId} 
                onChange={e => setTurneId(e.target.value)}
                className="flex h-12 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Nenhuma turnê</option>
                {tours.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Cidade *</Label>
              <Input value={cidade} onChange={e => setCidade(e.target.value)} className="h-12 rounded-xl" />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Local da Apresentação *</Label>
              <Input value={local} onChange={e => setLocal(e.target.value)} className="h-12 rounded-xl" />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Data da Apresentação *</Label>
              <Input type="date" value={dataApres} onChange={e => setDataApres(e.target.value)} className="h-12 rounded-xl" />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Horário *</Label>
              <Input type="time" value={horario} onChange={e => setHorario(e.target.value)} className="h-12 rounded-xl" />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Data de Início da Viagem</Label>
              <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="h-12 rounded-xl" />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Data de Fim da Viagem</Label>
              <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="h-12 rounded-xl" />
            </div>

            {/* EQUIPE MULTISELECT */}
            <div className="space-y-3 md:col-span-2 pt-2 border-t mt-2">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Equipe Escalada</Label>
              <p className="text-sm text-slate-500 -mt-2">Selecione os profissionais que terão acesso aos road books desta viagem.</p>
              
              <div className="relative">
                <div 
                  className="flex min-h-12 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer hover:border-slate-400 transition-colors"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <span className="text-slate-500">Adicionar profissionais...</span>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className={`opacity-50 transition-transform ${showDropdown ? 'rotate-180' : ''}`}><path d="M4.93179 5.43179C4.75605 5.60753 4.75605 5.89245 4.93179 6.06819L7.43179 8.56819C7.60753 8.74393 7.89245 8.74393 8.06819 8.56819L10.5682 6.06819C10.7439 5.89245 10.7439 5.60753 10.5682 5.43179C10.3924 5.25605 10.1075 5.25605 9.93179 5.43179L7.5 7.86358L5.06819 5.43179C4.89245 5.25605 4.60753 5.25605 4.43179 5.43179Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                </div>
                
                {showDropdown && (
                  <>
                  <div className="fixed inset-0 z-[60]" onClick={() => setShowDropdown(false)}></div>
                  <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 border rounded-xl shadow-xl z-[70] p-3 max-h-72 overflow-y-auto flex flex-col gap-3">
                    <Input 
                      placeholder="Buscar profissional..." 
                      value={searchEquipe}
                      onChange={(e) => setSearchEquipe(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10"
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                    <div className="flex flex-col gap-4">
                      {[
                        { key: 'admin', label: 'Administradores', roles: ['admin'] },
                        { key: 'produtor', label: 'Produtores', roles: ['produtor'] },
                        { key: 'elenco', label: 'Elenco', roles: ['elenco'] },
                        { key: 'musico', label: 'Músicos', roles: ['musico'] },
                        { key: 'stage_manager', label: 'Stage Managers', roles: ['stage_manager'] },
                        { key: 'contra_regra', label: 'Contra-regras', roles: ['contra_regra'] },
                        { key: 'assistente_producao', label: 'Assistentes de Produção', roles: ['assistente_producao'] },
                        { key: 'camareiro', label: 'Camareiros', roles: ['camareiro'] },
                        { key: 'tour_manager', label: 'Tour Managers', roles: ['tour_manager'] },
                        { key: 'iluminador', label: 'Iluminadores', roles: ['iluminador'] },
                        { key: 'tecnico_som', label: 'Técnicos de Som', roles: ['tecnico_som'] },
                        { key: 'tecnico_video', label: 'Técnicos de Vídeo', roles: ['tecnico_video'] },
                        { key: 'roadie', label: 'Roadies', roles: ['roadie'] },
                        { key: 'cenotecnico', label: 'Cenotécnicos', roles: ['cenotecnico'] },
                        { key: 'motorista', label: 'Motoristas', roles: ['motorista'] },
                      ].map(group => {
                        const groupProfs = profissionais
                          .filter(p => {
                             const matchesRole = group.roles.includes(p.role) || (p.funcoes && p.funcoes.some((f: string) => group.roles.includes(f)));
                             const isAlreadyInThisFunction = escalasAtuais.some(e => e.usuario_id === p.id && e.funcao === group.roles[0]);
                             return matchesRole && !isAlreadyInThisFunction;
                          })
                          .filter(p => !searchEquipe || (p.nome || '').toLowerCase().includes(searchEquipe.toLowerCase()))
                          .sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
                          
                        if (groupProfs.length === 0) return null;
                        return (
                          <div key={group.key} className="space-y-2">
                            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">{group.label}</h4>
                            <div className="flex flex-col gap-1">
                              {groupProfs.map(p => (
                                 <div 
                                    key={p.id} 
                                    onClick={() => { toggleEquipe(p.id, group.roles[0]); setSearchEquipe(''); setShowDropdown(false); }}
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors group"
                                 >
                                   <span className="font-semibold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                                     {p.nome}
                                     <div className="flex gap-1">
                                        {(p.funcoes && p.funcoes.length > 0 ? p.funcoes : [p.role]).map((f: string, i: number) => (
                                          <Badge key={i} variant="outline" className="text-[9px] uppercase px-1 py-0 h-4 border-slate-300">
                                            {f.replace('_', ' ')}
                                          </Badge>
                                        ))}
                                     </div>
                                   </span>
                                   <Plus className="size-4 text-slate-400 group-hover:text-primary transition-colors" />
                                 </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      {profissionais.filter(p => !equipe.includes(p.id)).length === 0 && (
                        <div className="text-center p-4 text-slate-500 text-sm font-medium">Todos os profissionais já foram adicionados.</div>
                      )}
                    </div>
                  </div>
                  </>
                )}
              </div>

              {/* Exibição dos selecionados */}
              {escalasAtuais.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-dashed">
                  {[...escalasAtuais]
                    .sort((a, b) => {
                       const pa = profissionais.find(x => x.id === a.usuario_id);
                       const pb = profissionais.find(x => x.id === b.usuario_id);
                       return (pa?.nome || '').localeCompare(pb?.nome || '');
                    })
                    .map(esc => {
                      const p = profissionais.find(x => x.id === esc.usuario_id);
                      if (!p) return null;
                      const cacheKey = `${esc.usuario_id}_${esc.funcao}`;
                      const escala = escalas.find(e => e.evento_id === editingId && e.usuario_id === esc.usuario_id && e.funcao === esc.funcao);
                      const statusColor = escala?.status === 'aceita' ? 'bg-green-100 text-green-700 border-green-200' :
                                          escala?.status === 'recusada' ? 'bg-red-100 text-red-700 border-red-200' :
                                          escala?.status === 'pendente' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                          'bg-slate-100 text-slate-700 border-slate-200';
                      const statusLabel = escala?.status === 'aceita' ? 'Aceita' :
                                          escala?.status === 'recusada' ? 'Recusada' :
                                          escala?.status === 'pendente' ? 'Pendente' :
                                          'Pendente';

                      return (
                        <div key={cacheKey} className="flex items-center justify-between p-3 rounded-xl border border-primary/20 bg-white dark:bg-card shadow-sm">
                          <div>
                            <p className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                              {p.nome}
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${statusColor}`}>
                                {statusLabel}
                              </Badge>
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md uppercase font-bold">
                                Escalado como: {esc.funcao.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                          
                          <button 
                             onClick={() => toggleEquipe(esc.usuario_id, esc.funcao)}
                             className="size-8 rounded-full flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 text-slate-400 transition-colors"
                          >
                             <X className="size-4" />
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setShowCachêêesDialog(true)} className="rounded-xl h-12 px-6 font-bold mr-auto bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-200">
              💰 Cachês da Equipe
            </Button>
            <Button variant="outline" onClick={() => setOpenDialog(false)} className="rounded-xl h-12 px-6 font-bold">Cancelar</Button>
            <Button onClick={handleSave} className="rounded-xl h-12 px-8 font-bold shadow-md"><Save className="size-4 mr-2"/> Salvar Evento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* MODAL DE CACHÊS */}
      <Dialog open={showCachesDialog} onOpenChange={setShowCachêêesDialog}>
        <DialogContent className="rounded-[2rem] p-6 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Cachês da Equipe ({equipe.length})</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            {[...escalasAtuais]
              .sort((a, b) => {
                 const pa = profissionais.find(x => x.id === a.usuario_id);
                 const pb = profissionais.find(x => x.id === b.usuario_id);
                 return (pa?.nome || '').localeCompare(pb?.nome || '');
              })
              .map(esc => {
                const p = profissionais.find(x => x.id === esc.usuario_id);
                if (!p) return null;
                const cacheKey = `${esc.usuario_id}_${esc.funcao}`;
                return (
                  <div key={cacheKey} className="flex items-center justify-between p-3 border rounded-xl bg-slate-50 dark:bg-slate-900/50">
                    <div>
                      <p className="font-bold text-sm">{p.nome}</p>
                      <p className="text-xs text-slate-500 uppercase font-semibold">
                        {esc.funcao.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-400">R$</span>
                      <CurrencyInput 
                        className="w-28 h-9 font-bold text-right bg-white dark:bg-slate-900"
                        value={caches[cacheKey] || ''}
                        onChange={(val) => setCaches({...caches, [cacheKey]: val})}
                      />
                    </div>
                  </div>
                );
              })}
              {escalasAtuais.length === 0 && <p className="text-slate-500 text-center text-sm py-4">Nenhum profissional selecionado.</p>}
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={() => setShowCachêêesDialog(false)} className="w-full h-12 rounded-xl font-bold">Concluído</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RiderViewModal 
        open={openRiderDialog}
        onClose={setOpenRiderDialog}
        loading={loadingRider}
        eventName={currentEventName}
        somData={currentRiderSom}
        luzData={currentRiderLuz}
      />

      <Dialog open={showSmsDialog} onOpenChange={setShowSmsDialog}>
        <DialogContent className="max-w-md w-[95vw] rounded-[2rem] p-0 overflow-hidden border-0 shadow-2xl bg-white dark:bg-slate-900">
          <div className="bg-indigo-600 dark:bg-indigo-900 p-6 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black flex items-center gap-3">
                <MessageSquareText className="size-6" /> Notificar Equipe
              </DialogTitle>
              <DialogDescription className="text-indigo-100 font-medium">
                Deseja enviar um SMS para avisar {smsMembersToNotify.length} pessoa(s) sobre a escala?
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-700 font-bold">Mensagem do SMS</Label>
              <Textarea 
                value={smsMessage} 
                onChange={(e) => setSmsMessage(e.target.value)} 
                className="min-h-[100px] resize-none bg-slate-50 text-base"
              />
              <p className="text-xs text-slate-500 text-right">{smsMessage.length} caracteres</p>
            </div>
          </div>
          
          <DialogFooter className="p-6 pt-0 gap-2">
            <Button variant="outline" onClick={() => setShowSmsDialog(false)} className="rounded-xl h-12 px-6 font-bold">Pular</Button>
            <Button onClick={() => handleSendSms(smsMembersToNotify, smsMessage)} disabled={sendingSms} className="rounded-xl h-12 px-8 font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
              {sendingSms ? <Loader2 className="size-5 animate-spin mr-2" /> : <Mic2 className="size-5 mr-2"/>} Enviar SMS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
