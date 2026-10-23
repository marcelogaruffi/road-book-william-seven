import { AccessDenied } from "@/components/AccessDenied";
// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Search, 
  MapPin, 
  CalendarDays, 
  User, 
  Trash2, 
  Lock, 
  Check, 
  Bell, 
  Plus, 
  MessageSquareText, 
  Loader2, 
  Sparkles, 
  AlertTriangle,
  Send,
  Users
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Route as AuthedRoute } from "./route";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_authenticated/escalas")({
  head: () => ({ meta: [{ title: "Gestão de Escalas - Áxis - Gestão de Teatros e Shows" }] }),
  component: EscalasPage,
});

function EscalasPage() {
  // --- SEGURANÇA E CONTROLE DE ACESSO OFICIAL AXIS ---
  const routeCtx = AuthedRoute.useRouteContext ? AuthedRoute.useRouteContext() : null;
  const allowedRolesList = ["dev","produtor"];
  const profileRoles = routeCtx?.profile ? [routeCtx.profile.role, ...(Array.isArray(routeCtx.profile.funcoes) ? routeCtx.profile.funcoes : [])] : [];
  const hasAccess = profileRoles.some(r => allowedRolesList.includes(r));
  if (routeCtx?.profile && !hasAccess) {
    return <AccessDenied message="Você não possui permissão para acessar esta área com o seu perfil atual." />;
  }
  // ----------------------------------------------------

  const { profile } = AuthedRoute.useRouteContext();
  const [activeTab, setActiveTab] = useState<string>("evento");
  const [escalas, setEscalas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Todos os eventos e profissionais
  const [todosEventos, setTodosEventos] = useState<any[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [permitirSmsSistema, setPermitirSmsSistema] = useState(false);

  // Aba: Escalação por Evento
  const [selectedEventoId, setSelectedEventoId] = useState<string>("");
  const [eventoSearch, setEventoSearch] = useState("");
  const [novoProfId, setNovoProfId] = useState("");
  const [novaFuncao, setNovaFuncao] = useState("");
  const [savingEscalaEvento, setSavingEscalaEvento] = useState(false);

  // SMS Modal
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [smsRecipients, setSmsRecipients] = useState<string[]>([]);
  const [smsMessage, setSmsMessage] = useState("");
  const [sendingSms, setSendingSms] = useState(false);

  // Aba: Escalação em Lote
  const [eventosFuturos, setEventosFuturos] = useState<any[]>([]);
  const [selectedProf, setSelectedProf] = useState<string>("");
  const [selectedFuncao, setSelectedFuncao] = useState<string>("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [savingLote, setSavingLote] = useState(false);

  const allowedRoles = ['admin', 'dev', 'produtor'];
  if (profile && !allowedRoles.includes(profile.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <Lock className="size-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300">Acesso Restrito</h2>
        <p className="text-slate-500 mt-2">Esta página é exclusiva para Administradores e Produtores.</p>
      </div>
    );
  }

  const loadData = async () => {
    setLoading(true);
    const [escRes, evRes, profRes, confRes] = await Promise.all([
      supabase
        .from('evento_escalas')
        .select(`
          id,
          status,
          created_at,
          evento_id,
          evento:evento_id(id, espetaculo, cidade, data, local, equipe),
          funcao,
          usuario_id,
          usuario:usuario_id(id, nome, role, telefone)
        `),
      supabase
        .from('eventos')
        .select('id, espetaculo, cidade, data, local, equipe')
        .order('data', { ascending: false }),
      supabase
        .from('profiles')
        .select('id, nome, role, funcoes, telefone')
        .in('role', ['admin', 'dev', 'produtor', 'motorista', 'tecnico_som', 'iluminador', 'elenco', 'stage_manager', 'contra_regra', 'assistente_producao', 'camareiro', 'musico', 'tour_manager', 'roadie', 'cenotecnico', 'tecnico_video', 'rigger'])
        .order('nome'),
      supabase
        .from('configuracoes_sistema')
        .select('permitir_sms_escala')
        .eq('id', 1)
        .maybeSingle()
    ]);

    if (escRes.error) {
      toast.error("Erro ao buscar escalas: " + escRes.error.message);
    } else {
      const sorted = (escRes.data || []).sort((a: any, b: any) => {
        const da = a.evento?.data ? new Date(a.evento.data).getTime() : 0;
        const db = b.evento?.data ? new Date(b.evento.data).getTime() : 0;
        return db - da; // Mais recente primeiro
      });
      setEscalas(sorted);
    }

    if (evRes.data) {
      setTodosEventos(evRes.data);
      // Auto selecionar primeiro evento caso nenhum esteja selecionado
      if (!selectedEventoId && evRes.data.length > 0) {
        setSelectedEventoId(evRes.data[0].id);
      }
    }

    if (profRes.data) {
      setProfissionais(profRes.data);
    }

    if (confRes.data) {
      setPermitirSmsSistema(!!confRes.data.permitir_sms_escala);
    }

    setLoading(false);
  };
  
  const loadLoteData = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data: eData } = await supabase
      .from('eventos')
      .select('id, espetaculo, cidade, data, equipe')
      .gte('data', today)
      .order('data', { ascending: true });
    if (eData) setEventosFuturos(eData);
  };

  useEffect(() => {
    loadData();
    loadLoteData();
  }, []);

  const handleCobrar = async (id: string, profNome: string, userId: string, espetaculo: string) => {
    const { error } = await supabase.from('notificacoes').insert({
      usuario_id: userId,
      titulo: 'Escala Pendente! 🎬',
      mensagem: `Você tem uma nova escala pendente para confirmar no evento: ${espetaculo}`,
      tipo: 'escala',
      link: '/minhas-escalas'
    });
    if (!error) toast.success(`Cobrança enviada para ${profNome}`);
    else toast.error("Erro ao notificar");
  };

  /**
   * Exclusão segura de escala com validação rígida de vínculos:
   * 1. Bloqueia se houver qualquer registro em `evento_escalas_financeiro` (não apaga registros financeiros).
   * 2. Bloqueia se houver contrato emitido em `contratos` para aquele evento + profissional.
   * 3. Atualiza `eventos.equipe` sem duplicar IDs e mantendo o profissional se ele tiver outra escala ativa/válida no evento.
   */
  const handleDelete = async (id: string) => {
    const esc = escalas.find(e => e.id === id);
    if (!esc) return;

    // 1. Verificação rígida de vínculos contratuais na tabela real contratos_equipe
    if (esc.evento_id && esc.usuario_id) {
      const { data: contratosExistentes, error: conErr } = await supabase
        .from('contratos_equipe')
        .select('id, titulo, status')
        .eq('evento_id', esc.evento_id)
        .eq('usuario_id', esc.usuario_id)
        .limit(1);

      if (conErr) {
        toast.error("Erro ao verificar contratos vinculados: " + conErr.message);
        return;
      }

      if (contratosExistentes && contratosExistentes.length > 0) {
        const c = contratosExistentes[0];
        // Qualquer contrato que não esteja formalmente cancelado bloqueia a exclusão
        if (c.status !== 'cancelado') {
          toast.error(`Exclusão bloqueada: Existe contrato (${c.status || 'ativo'}) registrado para ${esc.usuario?.nome || 'este profissional'} neste evento. Trate o contrato no módulo Contratos.`);
          return;
        }
      }
    }

    // 2. Consulta detalhada de registros financeiros associados
    const { data: finRecords, error: finErr } = await supabase
      .from('evento_escalas_financeiro')
      .select('escala_id, cache_valor, diaria_valor, transporte_valor, status_pagamento, nota_fiscal_url, recibo_url')
      .eq('escala_id', id);

    if (finErr) {
      toast.error("Erro ao verificar integridade financeira: " + finErr.message);
      return;
    }

    const hasFinRecord = finRecords && finRecords.length > 0;
    let podeRemoverFinVazio = false;
    let finVazioBackup = null;

    if (hasFinRecord) {
      const fin = finRecords[0];
      const cacheVal = fin.cache_valor !== null && fin.cache_valor !== undefined ? Number(fin.cache_valor) : 0;
      const diariaVal = fin.diaria_valor !== null && fin.diaria_valor !== undefined ? Number(fin.diaria_valor) : 0;
      const transpVal = fin.transporte_valor !== null && fin.transporte_valor !== undefined ? Number(fin.transporte_valor) : 0;

      // Valores exatamente zero ou nulo (qualquer valor negativo ou positivo bloqueia)
      const isValoresZerados = cacheVal === 0 && diariaVal === 0 && transpVal === 0;

      // Status deve ser nulo ou o padrão inicial não processado ('pendente')
      const isStatusInicial = !fin.status_pagamento || fin.status_pagamento === 'pendente';

      // Sem comprovantes anexados
      const semDocumentos = !fin.nota_fiscal_url && !fin.recibo_url;

      const isRegistroVazio = isValoresZerados && isStatusInicial && semDocumentos;

      // Apenas escalas RECUSADAS com registro comprovadamente vazio podem ter a linha financeira vazia descartada
      if (esc.status === 'recusada' && isRegistroVazio) {
        podeRemoverFinVazio = true;
        finVazioBackup = fin;
      } else {
        // Bloqueio rigoroso explicando o motivo
        if (esc.status !== 'recusada') {
          toast.error("Exclusão bloqueada: Esta escala possui registros no Financeiro do Evento. Para escalas ativas ou pendentes, as informações devem ser gerenciadas no módulo Financeiro.");
        } else if (!isValoresZerados) {
          toast.error("Exclusão bloqueada: Esta escala recusada possui valores financeiros registrados (cachê, diárias ou transporte).");
        } else if (!isStatusInicial) {
          toast.error(`Exclusão bloqueada: O registro financeiro desta escala possui status '${fin.status_pagamento}'.`);
        } else {
          toast.error("Exclusão bloqueada: Esta escala recusada possui documentos ou comprovantes anexados no financeiro.");
        }
        return;
      }
    }

    // Mensagem transparente de confirmação
    const confirmMsg = esc.status === 'recusada' && podeRemoverFinVazio
      ? `Excluir esta escala recusada? O registro financeiro automático de R$ 0,00 também será removido. Esta ação não poderá ser desfeita.`
      : esc.status === 'recusada'
      ? `Confirmar exclusão da escala recusada de ${esc.usuario?.nome || 'profissional'} como ${(esc.funcao || '').replace(/_/g, ' ')}?`
      : `Tem certeza que deseja remover a escala de ${esc.usuario?.nome || 'profissional'} como ${(esc.funcao || '').replace(/_/g, ' ')}?`;

    if (!confirm(confirmMsg)) return;

    // Se houver registro financeiro vazio de escala recusada, remove preliminarmente
    if (podeRemoverFinVazio) {
      const { error: delFinErr } = await supabase.from('evento_escalas_financeiro').delete().eq('escala_id', id);
      if (delFinErr) {
        toast.error("Erro ao remover registro financeiro preliminar: " + delFinErr.message);
        return;
      }
    }

    const { error: delEscErr } = await supabase.from('evento_escalas').delete().eq('id', id);
    if (delEscErr) {
      // Rollback de segurança: se a remoção da escala falhar, restaura o registro financeiro vazio
      if (podeRemoverFinVazio && finVazioBackup) {
        await supabase.from('evento_escalas_financeiro').insert(finVazioBackup);
      }
      toast.error("Erro ao deletar escala: " + delEscErr.message);
      return;
    } else {
      // 3. Atualizar eventos.equipe sem retirar o profissional se ele tiver outra escala válida no evento
      if (esc.evento_id && esc.usuario_id) {
        const { data: outrasEscalas } = await supabase
          .from('evento_escalas')
          .select('id')
          .eq('evento_id', esc.evento_id)
          .eq('usuario_id', esc.usuario_id);

        const temOutraEscala = outrasEscalas && outrasEscalas.length > 0;

        if (!temOutraEscala) {
          const { data: evData } = await supabase.from('eventos').select('equipe').eq('id', esc.evento_id).single();
          if (evData && Array.isArray(evData.equipe)) {
            const novaEquipe = evData.equipe.filter((u: string) => u !== esc.usuario_id);
            await supabase.from('eventos').update({ equipe: novaEquipe }).eq('id', esc.evento_id);
          }
        }
      }

      toast.success("Escala removida com sucesso.");
      loadData();
    }
  };

  const handleAccept = async (id: string) => {
    if (!confirm("Confirmar a presença manualmente nesta escala?")) return;
    
    const { error } = await supabase.from('evento_escalas').update({ status: 'aceita' }).eq('id', id);
    if (error) {
      toast.error("Erro ao aceitar: " + error.message);
    } else {
      toast.success("Escala aceita manualmente!");
      loadData();
    }
  };

  const handleAcceptAll = async () => {
    const pendentes = escalas.filter(e => e.status === 'pendente');
    if (pendentes.length === 0) {
      toast.info("Não há escalas pendentes.");
      return;
    }
    if (!confirm(`Tem certeza que deseja aceitar manualmente todas as ${pendentes.length} escalas pendentes?`)) return;
    
    const ids = pendentes.map(e => e.id);
    const { error } = await supabase.from('evento_escalas').update({ status: 'aceita' }).in('id', ids);
    if (error) {
      toast.error("Erro ao aceitar em lote: " + error.message);
    } else {
      toast.success(`${pendentes.length} escalas aceitas com sucesso!`);
      loadData();
    }
  };

  // --- ESCALAÇÃO POR EVENTO ---
  const selectedEvento = todosEventos.find(e => e.id === selectedEventoId);
  const escalasDoEvento = escalas.filter(e => e.evento_id === selectedEventoId);

  const handleAddEscalaEvento = async () => {
    if (!selectedEventoId || !novoProfId || !novaFuncao) {
      toast.warning("Selecione o profissional e a função a exercer.");
      return;
    }

    const prof = profissionais.find(p => p.id === novoProfId);
    if (!prof || !selectedEvento) return;

    // 1. Verificação de duplicidade exata: evento + profissional + função
    const { data: escalaExistente } = await supabase
      .from('evento_escalas')
      .select('id, status')
      .eq('evento_id', selectedEventoId)
      .eq('usuario_id', novoProfId)
      .eq('funcao', novaFuncao)
      .maybeSingle();

    if (escalaExistente) {
      if (escalaExistente.status === 'recusada') {
        toast.error("Este profissional já possui uma escala RECUSADA para esta função neste evento. Históricos de recusa são preservados e não são sobrescritos.");
      } else {
        toast.warning(`Este profissional já está escalado como "${novaFuncao.replace(/_/g, ' ')}" neste evento (status: ${escalaExistente.status}).`);
      }
      return;
    }

    setSavingEscalaEvento(true);

    // Inserção da nova escala com status pendente
    const { error: insErr } = await supabase.from('evento_escalas').insert({
      evento_id: selectedEventoId,
      usuario_id: novoProfId,
      funcao: novaFuncao,
      status: 'pendente'
    });

    if (insErr) {
      toast.error("Erro ao criar escala: " + insErr.message);
      setSavingEscalaEvento(false);
      return;
    }

    // Notificação interna automática para o profissional
    await supabase.from('notificacoes').insert({
      usuario_id: novoProfId,
      titulo: 'Nova Escala! 🎬',
      mensagem: `Você foi escalado(a) como ${novaFuncao.replace(/_/g, ' ')} no evento: ${selectedEvento.espetaculo}${selectedEvento.cidade ? ' em ' + selectedEvento.cidade : ''}.`,
      tipo: 'escala',
      link: '/minhas-escalas'
    });

    // Atualização de eventos.equipe sem duplicar IDs
    const equipeAtual = Array.isArray(selectedEvento.equipe) ? selectedEvento.equipe : [];
    if (!equipeAtual.includes(novoProfId)) {
      await supabase.from('eventos').update({ equipe: [...equipeAtual, novoProfId] }).eq('id', selectedEventoId);
    }

    toast.success(`${prof.nome} escalado(a) como ${novaFuncao.replace(/_/g, ' ')} com sucesso!`);
    setNovoProfId("");
    setNovaFuncao("");
    setSavingEscalaEvento(false);
    loadData();
  };

  // --- MODAL DE SMS DE CONVOCAÇÃO ---
  const handleOpenSmsModal = () => {
    if (!permitirSmsSistema) {
      toast.error("O envio de SMS de escala está desativado nas Configurações do Sistema.");
      return;
    }
    if (!selectedEvento) {
      toast.warning("Selecione um evento primeiro.");
      return;
    }
    if (escalasDoEvento.length === 0) {
      toast.warning("Este evento não possui profissionais escalados.");
      return;
    }

    // Filtrar apenas profissionais únicos escalados no evento
    const profIds = Array.from(new Set(escalasDoEvento.map(e => e.usuario_id)));
    setSmsRecipients(profIds);

    const dataFmt = selectedEvento.data && !isNaN(new Date(selectedEvento.data + 'T12:00:00Z').getTime())
      ? format(new Date(selectedEvento.data + 'T12:00:00Z'), "dd/MM/yyyy")
      : "";

    setSmsMessage(`Áxis: Você foi convocado(a) para a equipe de "${selectedEvento.espetaculo}" em ${selectedEvento.cidade || 'local informado'}${dataFmt ? ` dia ${dataFmt}` : ''}. Acesse o Áxis para confirmar sua presença.`);
    setSmsModalOpen(true);
  };

  const handleToggleSmsRecipient = (uid: string) => {
    setSmsRecipients(prev => prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid]);
  };

  const handleSendSmsExplicit = async () => {
    if (sendingSms) return; // Bloqueio estrito contra disparos múltiplos
    if (smsRecipients.length === 0) {
      toast.warning("Selecione ao menos um destinatário para o SMS.");
      return;
    }
    if (!smsMessage.trim()) {
      toast.warning("A mensagem de SMS não pode estar vazia.");
      return;
    }

    setSendingSms(true);
    const { data, error } = await supabase.rpc('send_sms_notification', {
      profile_ids: smsRecipients,
      sms_body: smsMessage.trim()
    });
    setSendingSms(false);

    if (error) {
      toast.error("Erro ao processar envio de SMS: " + error.message);
    } else {
      const result: any = data;
      // Reportar claramente aceitação pela API vs erros
      if (result.success > 0) {
        toast.success(`Solicitação de SMS aceita pelo serviço para ${result.success} profissional(is). A operadora transmitirá aos aparelhos.`);
      }
      if (result.failed_no_phone > 0) {
        toast.warning(`${result.failed_no_phone} profissional(is) não possuíam telefone celular cadastrado.`);
      }
      if (result.failed_api > 0) {
        if (result.last_api_error) {
          toast.error(`Falha no serviço de SMS: ${result.last_api_error}`);
        } else {
          toast.error(`Falha ao despachar para ${result.failed_api} destinatário(s). Verifique créditos e saldo.`);
        }
      }
      setSmsModalOpen(false);
    }
  };

  // --- ABA: ESCALAÇÃO EM LOTE ---
  const handleProfChange = (e: any) => {
    const val = e.target.value;
    setSelectedProf(val);
    if (val && profissionais.length > 0) {
      const p = profissionais.find(x => x.id === val);
      if (p) setSelectedFuncao(p.role || '');
    }
  };

  const handleToggleEvent = (evId: string) => {
    setSelectedEvents(prev => prev.includes(evId) ? prev.filter(id => id !== evId) : [...prev, evId]);
  };
  
  const handleToggleAll = () => {
    if (selectedEvents.length === eventosFuturos.length) {
      setSelectedEvents([]);
    } else {
      setSelectedEvents(eventosFuturos.map(e => e.id));
    }
  };

  const handleSaveLote = async () => {
    if (!selectedProf || !selectedFuncao || selectedEvents.length === 0) {
      toast.warning("Selecione um profissional, a função e ao menos um evento.");
      return;
    }
    
    setSavingLote(true);
    let count = 0;
    
    for (const evId of selectedEvents) {
      const ev = eventosFuturos.find(e => e.id === evId);
      if (!ev) continue;
      
      // Respeita a combinação evento + profissional + função
      const { data: escData } = await supabase
        .from('evento_escalas')
        .select('id, status')
        .eq('evento_id', evId)
        .eq('usuario_id', selectedProf)
        .eq('funcao', selectedFuncao)
        .maybeSingle();

      if (!escData) {
        await supabase.from('evento_escalas').insert({
          evento_id: evId,
          usuario_id: selectedProf,
          funcao: selectedFuncao,
          status: 'pendente'
        });
        
        await supabase.from('notificacoes').insert({
          usuario_id: selectedProf,
          titulo: 'Nova Escala! 🎬',
          mensagem: `Você foi escalado(a) como ${selectedFuncao.replace(/_/g, ' ')} no evento: ${ev.espetaculo}${ev.cidade ? ' em ' + ev.cidade : ''}.`,
          tipo: 'escala',
          link: '/minhas-escalas'
        });
        
        const equipe = ev.equipe || [];
        if (!equipe.includes(selectedProf)) {
          await supabase.from('eventos').update({ equipe: [...equipe, selectedProf] }).eq('id', evId);
        }
        count++;
      }
    }
    
    toast.success(count + " escala(s) criadas com sucesso.");
    setSavingLote(false);
    setSelectedProf("");
    setSelectedFuncao("");
    setSelectedEvents([]);
    loadData();
    loadLoteData();
  };

  const filtered = escalas.filter(esc => {
    const term = searchTerm.toLowerCase();
    const eventName = (esc.evento?.espetaculo || '').toLowerCase();
    const city = (esc.evento?.cidade || '').toLowerCase();
    const userName = (esc.usuario?.nome || '').toLowerCase();
    return eventName.includes(term) || city.includes(term) || userName.includes(term) || esc.status.includes(term);
  });
  
  const selectedProfObj = profissionais.find(p => p.id === selectedProf);
  const availableFuncoes = selectedProfObj 
    ? Array.from(new Set([selectedProfObj.role, ...(selectedProfObj.funcoes || [])])).filter(Boolean).sort()
    : [];

  const novoProfObj = profissionais.find(p => p.id === novoProfId);
  const availableFuncoesNovoProf = novoProfObj
    ? Array.from(new Set([novoProfObj.role, ...(novoProfObj.funcoes || [])])).filter(Boolean).sort()
    : [];

  const eventosFiltradosLista = todosEventos.filter(ev => {
    const term = eventoSearch.toLowerCase();
    return (ev.espetaculo || '').toLowerCase().includes(term) || (ev.cidade || '').toLowerCase().includes(term);
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Gestão de Escalas
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Escale profissionais por evento, envie convocações por SMS ou realize escalações em lote para produções futuras.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-xl mb-6 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
          <TabsTrigger value="evento" className="rounded-lg font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
            Escalação por Evento
          </TabsTrigger>
          <TabsTrigger value="lote" className="rounded-lg font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
            Escalação em Lote
          </TabsTrigger>
          <TabsTrigger value="historico" className="rounded-lg font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
            Todas as Escalas ({escalas.length})
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: ESCALAÇÃO POR EVENTO */}
        <TabsContent value="evento" className="m-0 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna 1: Seletor de Eventos */}
            <Card className="shadow-md border-slate-200/60 dark:border-white/10 rounded-2xl overflow-hidden flex flex-col h-[680px]">
              <CardHeader className="bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/5 pb-3">
                <CardTitle className="text-base font-bold flex items-center justify-between">
                  <span>Selecionar Evento</span>
                  <Badge variant="outline" className="text-xs bg-white dark:bg-slate-800">
                    {todosEventos.length} evento(s)
                  </Badge>
                </CardTitle>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                  <Input 
                    placeholder="Filtrar eventos..."
                    value={eventoSearch}
                    onChange={e => setEventoSearch(e.target.value)}
                    className="h-9 pl-8 text-xs bg-white dark:bg-slate-900 rounded-xl"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-3 flex-1 overflow-y-auto space-y-2">
                {eventosFiltradosLista.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">Nenhum evento encontrado.</div>
                ) : (
                  eventosFiltradosLista.map(ev => {
                    const isSelected = ev.id === selectedEventoId;
                    const dataFormatada = ev.data && !isNaN(new Date(ev.data + 'T12:00:00Z').getTime())
                      ? format(new Date(ev.data + 'T12:00:00Z'), "dd/MM/yyyy")
                      : "-";
                    const totalEscalados = escalas.filter(e => e.evento_id === ev.id).length;

                    return (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEventoId(ev.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-400 dark:bg-indigo-950/40 dark:border-indigo-600 shadow-sm'
                            : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {ev.espetaculo}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate">
                          <MapPin className="size-3 shrink-0" /> {ev.cidade || 'Cidade não informada'}
                        </div>
                        <div className="flex items-center justify-between text-xs mt-2 pt-1.5 border-t border-slate-100 dark:border-white/5">
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                            <CalendarDays className="size-3" /> {dataFormatada}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {totalEscalados} escalado(s)
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Coluna 2 e 3: Gestão da Equipe do Evento Selecionado */}
            <div className="lg:col-span-2 space-y-6">
              {selectedEvento ? (
                <>
                  {/* Cabeçalho do Evento com Ação Explícita de SMS */}
                  <Card className="shadow-md border-slate-200/60 dark:border-white/10 rounded-2xl overflow-hidden bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 text-xs mb-2">
                            Evento Selecionado
                          </Badge>
                          <h2 className="text-2xl font-black">{selectedEvento.espetaculo}</h2>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-indigo-200 mt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="size-4" /> {selectedEvento.cidade}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <CalendarDays className="size-4" />
                              {selectedEvento.data && !isNaN(new Date(selectedEvento.data + 'T12:00:00Z').getTime())
                                ? format(new Date(selectedEvento.data + 'T12:00:00Z'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                                : '-'}
                            </span>
                          </div>
                        </div>

                        {/* Botão de SMS Condicionado às Permissões e Configurações */}
                        {permitirSmsSistema && (
                          <Button
                            onClick={handleOpenSmsModal}
                            disabled={escalasDoEvento.length === 0}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-11 px-5 shadow-lg border border-indigo-400/30 shrink-0"
                          >
                            <MessageSquareText className="size-4 mr-2" />
                            Notificar Equipe por SMS
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Adicionar Novo Profissional ao Evento */}
                  <Card className="shadow-md border-slate-200/60 dark:border-white/10 rounded-2xl">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/5 py-4">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Plus className="size-4 text-indigo-600" /> Adicionar Profissional à Escala
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                        <div className="sm:col-span-2 space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Profissional</Label>
                          <select
                            value={novoProfId}
                            onChange={e => {
                              const val = e.target.value;
                              setNovoProfId(val);
                              const p = profissionais.find(x => x.id === val);
                              if (p) setNovaFuncao(p.role || '');
                            }}
                            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm h-11"
                          >
                            <option value="">Selecione o profissional...</option>
                            {profissionais.map(p => (
                              <option key={p.id} value={p.id}>{p.nome}</option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-2 space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Função no Evento</Label>
                          <select
                            value={novaFuncao}
                            onChange={e => setNovaFuncao(e.target.value)}
                            disabled={!novoProfId}
                            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm h-11 disabled:opacity-50"
                          >
                            <option value="">Selecione a função...</option>
                            {availableFuncoesNovoProf.map(f => (
                              <option key={f} value={f}>
                                {f.replace(/_/g, ' ').toUpperCase()}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-1">
                          <Button
                            onClick={handleAddEscalaEvento}
                            disabled={savingEscalaEvento || !novoProfId || !novaFuncao}
                            className="w-full h-11 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                          >
                            {savingEscalaEvento ? <Loader2 className="size-4 animate-spin" /> : "Escalar"}
                          </Button>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2">
                        * O mesmo profissional pode ser escalado para mais de uma função neste evento (ex: Músico e Técnico). Históricos recusados são preservados.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Listagem de Escalas do Evento */}
                  <Card className="shadow-md border-slate-200/60 dark:border-white/10 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/5 py-4 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-bold">
                          Profissionais Escalados ({escalasDoEvento.length})
                        </CardTitle>
                        <CardDescription>
                          Acompanhe o status de confirmação e gerencie a equipe deste espetáculo.
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {escalasDoEvento.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                          Nenhum profissional escalado para este evento ainda.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 dark:divide-white/5">
                          {escalasDoEvento.map(esc => {
                            const statusColor = esc.status === 'aceita' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400' :
                                                esc.status === 'recusada' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400' :
                                                esc.status === 'pendente' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                'bg-slate-100 text-slate-700 border-slate-200';
                            const statusLabel = esc.status === 'aceita' ? 'Aceita' :
                                                esc.status === 'recusada' ? 'Recusada' :
                                                esc.status === 'pendente' ? 'Pendente' :
                                                'Desconhecido';

                            return (
                              <div key={esc.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                    <User className="size-5 text-slate-500" />
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                      {esc.usuario?.nome || 'Usuário Deletado'}
                                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${statusColor}`}>
                                        {statusLabel}
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-slate-500 mt-0.5">
                                      Função: <span className="font-semibold text-slate-700 dark:text-slate-300">{(esc.funcao || '').replace(/_/g, ' ').toUpperCase()}</span>
                                      {esc.usuario?.telefone && (
                                        <span className="ml-2 text-slate-400">Tel: {esc.usuario.telefone}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {esc.status === 'pendente' && (
                                    <>
                                      <Button 
                                        size="sm" 
                                        onClick={() => handleAccept(esc.id)}
                                        className="h-8 px-3 text-xs font-bold bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-sm"
                                        title="Confirmar Presença Manualmente"
                                      >
                                        <Check className="size-3.5 mr-1" /> Aceitar
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => handleCobrar(esc.id, esc.usuario?.nome || 'Profissional', esc.usuario?.id || '', selectedEvento.espetaculo)}
                                        className="h-8 text-xs font-bold text-orange-600 border-orange-200 hover:bg-orange-50 rounded-lg px-3"
                                      >
                                        <Bell className="size-3.5 mr-1" /> Notificar
                                      </Button>
                                    </>
                                  )}
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleDelete(esc.id)}
                                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 size-8"
                                    title="Remover Escala"
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="p-12 text-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-slate-500">Selecione um evento à esquerda para gerenciar sua equipe.</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ABA 2: ESCALAÇÃO EM LOTE (PRESERVADA INTEGRALMENTE) */}
        <TabsContent value="lote" className="m-0">
          <Card className="shadow-lg border-slate-200/60 dark:border-white/10 rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/5 pb-4">
              <CardTitle>Escalação em Lote</CardTitle>
              <CardDescription>Selecione um profissional e atribua-o rapidamente a vários eventos futuros de uma vez.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Profissional</label>
                  <select 
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background h-12"
                    value={selectedProf}
                    onChange={handleProfChange}
                  >
                    <option value="">Selecione o membro da equipe...</option>
                    {profissionais.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Função</label>
                  <select 
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background h-12"
                    value={selectedFuncao}
                    onChange={e => setSelectedFuncao(e.target.value)}
                  >
                    <option value="">Selecione a função...</option>
                    {availableFuncoes.map(f => (
                      <option key={f as string} value={f as string}>{(f as string).replace('_', ' ').toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Eventos Futuros ({eventosFuturos.length})</label>
                  <Button variant="ghost" size="sm" onClick={handleToggleAll} className="text-indigo-600 dark:text-indigo-400">
                    {selectedEvents.length === eventosFuturos.length ? "Desmarcar Todos" : "Selecionar Todos"}
                  </Button>
                </div>
                
                {eventosFuturos.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-500">
                    Não há eventos futuros cadastrados no sistema.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-2">
                    {eventosFuturos.map(ev => {
                      const isSelected = selectedEvents.includes(ev.id);
                      return (
                        <div 
                          key={ev.id} 
                          onClick={() => handleToggleEvent(ev.id)}
                          className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-200'}`}
                        >
                          <Checkbox checked={isSelected} className="mt-1" />
                          <div className="flex-1 min-w-0 pointer-events-none">
                            <div className="font-bold text-sm text-slate-800 dark:text-white truncate">{ev.espetaculo}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate">
                              <MapPin className="size-3 shrink-0" /> {ev.cidade}
                            </div>
                            <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1 mt-1">
                              <CalendarDays className="size-3 shrink-0" />
                              {ev.data && !isNaN(new Date(ev.data + 'T12:00:00Z').getTime()) ? format(new Date(ev.data + 'T12:00:00Z'), "dd/MM/yyyy") : '-'}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleSaveLote} 
                  disabled={savingLote || !selectedProf || !selectedFuncao || selectedEvents.length === 0}
                  className="h-12 px-8 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                >
                  {savingLote ? "Salvando..." : "Salvar Escalação em Lote"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 3: TODAS AS ESCALAS (HISTÓRICO GERAL COM PROTEÇÃO) */}
        <TabsContent value="historico" className="m-0">
          <Card className="shadow-lg border-slate-200/60 dark:border-white/10 rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/5 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input 
                  placeholder="Buscar por nome, evento ou status..." 
                  className="pl-9 bg-white dark:bg-black"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              {escalas.some(e => e.status === 'pendente') && (
                <Button onClick={handleAcceptAll} className="bg-green-500 hover:bg-green-600 text-white font-bold shrink-0">
                  <Check className="size-4 mr-2" /> Aceitar Todas as Pendentes
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-b dark:border-white/10">
                    <tr>
                      <th className="px-6 py-4 font-bold">Profissional</th>
                      <th className="px-6 py-4 font-bold">Evento & Local</th>
                      <th className="px-6 py-4 font-bold">Data</th>
                      <th className="px-6 py-4 font-bold">Status</th>
                      <th className="px-6 py-4 font-bold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Carregando escalas...</td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Nenhuma escala encontrada.</td>
                      </tr>
                    ) : (
                      filtered.map(esc => {
                        const statusColor = esc.status === 'aceita' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400' :
                                            esc.status === 'recusada' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400' :
                                            esc.status === 'pendente' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                            'bg-slate-100 text-slate-700 border-slate-200';
                        const statusLabel = esc.status === 'aceita' ? 'Aceita' :
                                            esc.status === 'recusada' ? 'Recusada' :
                                            esc.status === 'pendente' ? 'Pendente' :
                                            'Desconhecido';

                        return (
                          <tr key={esc.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                  <User className="size-4 text-slate-500" />
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white">{esc.usuario?.nome || 'Usuário Deletado'}</div>
                                  <div className="text-[10px] uppercase font-semibold text-slate-400">{(esc.funcao || esc.usuario?.role || 'N/A').replace('_', ' ')}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-semibold text-slate-700 dark:text-slate-300">{esc.evento?.espetaculo}</div>
                              <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="size-3" /> {esc.evento?.cidade}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                                <CalendarDays className="size-4 opacity-70" />
                                {esc.evento?.data && !isNaN(new Date(esc.evento.data + 'T12:00:00Z').getTime()) ? format(new Date(esc.evento.data + 'T12:00:00Z'), "dd MMM, yyyy", { locale: ptBR }) : '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`border font-semibold ${statusColor}`}>
                                  {statusLabel}
                                </Badge>
                                {esc.status === 'pendente' && (
                                  <div className="flex gap-1">
                                    <Button 
                                      size="sm" 
                                      onClick={() => handleAccept(esc.id)}
                                      className="h-6 px-2 text-[10px] uppercase font-bold bg-green-500 hover:bg-green-600 text-white rounded-md shadow-sm"
                                      title="Dar Aceite Manualmente"
                                    >
                                      <Check className="size-3 mr-1" /> Aceitar
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-6 text-[10px] uppercase font-bold text-orange-600 border-orange-200 hover:bg-orange-50 px-2 py-0" 
                                      onClick={() => handleCobrar(esc.id, esc.usuario?.nome || 'Profissional', esc.usuario?.id || '', esc.evento?.espetaculo || 'Evento')}
                                    >
                                      <Bell className="size-3 mr-1" /> Cobrar
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDelete(esc.id)}
                                className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                title="Deletar Escala (com proteção financeira e contratual)"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL DE ENVIO EXPLÍCITO DE SMS COM SELEÇÃO DE DESTINATÁRIOS */}
      <Dialog open={smsModalOpen} onOpenChange={setSmsModalOpen}>
        <DialogContent className="max-w-lg w-[95vw] rounded-3xl p-0 overflow-hidden border-0 shadow-2xl bg-white dark:bg-slate-900">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-black flex items-center gap-2">
                <MessageSquareText className="size-5" /> Enviar Convocação por SMS
              </DialogTitle>
              <DialogDescription className="text-indigo-100 text-xs font-medium mt-1">
                Aviso explícito para a equipe do evento "{selectedEvento?.espetaculo}".
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Destinatários ({smsRecipients.length} de {Array.from(new Set(escalasDoEvento.map(e => e.usuario_id))).length} selecionados)</span>
                <button
                  type="button"
                  onClick={() => {
                    const allUids = Array.from(new Set(escalasDoEvento.map(e => e.usuario_id)));
                    setSmsRecipients(smsRecipients.length === allUids.length ? [] : allUids);
                  }}
                  className="text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:underline"
                >
                  {smsRecipients.length === Array.from(new Set(escalasDoEvento.map(e => e.usuario_id))).length ? "Desmarcar Todos" : "Selecionar Todos"}
                </button>
              </Label>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-2 divide-y divide-slate-100 dark:divide-white/5 max-h-48 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50">
                {Array.from(new Set(escalasDoEvento.map(e => e.usuario_id))).map(uid => {
                  const p = profissionais.find(x => x.id === uid);
                  const isChecked = smsRecipients.includes(uid);
                  const hasPhone = !!p?.telefone;

                  return (
                    <div
                      key={uid}
                      onClick={() => handleToggleSmsRecipient(uid)}
                      className="p-2 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Checkbox checked={isChecked} />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{p?.nome || 'Profissional'}</div>
                          <div className="text-[11px] text-slate-400">
                            {hasPhone ? `Tel: ${p?.telefone}` : <span className="text-amber-500 font-semibold">Sem telefone cadastrado</span>}
                          </div>
                        </div>
                      </div>
                      {!hasPhone && (
                        <Badge variant="outline" className="text-[9px] border-amber-300 text-amber-600 bg-amber-50">
                          Não receberá
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Mensagem do SMS</Label>
              <Textarea 
                value={smsMessage}
                onChange={e => setSmsMessage(e.target.value)}
                className="min-h-[90px] text-xs resize-none bg-slate-50 dark:bg-slate-900 rounded-xl"
                placeholder="Escreva a mensagem que será enviada aos profissionais..."
              />
              <div className="flex justify-between items-center text-[11px] text-slate-400">
                <span>Limite padrão SMS: ~160 caracteres (mensagens maiores são segmentadas).</span>
                <span className="font-semibold">{smsMessage.length} caracteres</span>
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-white/5 gap-2">
            <Button
              variant="outline"
              onClick={() => setSmsModalOpen(false)}
              disabled={sendingSms}
              className="rounded-xl h-11 px-5 font-bold text-xs"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendSmsExplicit}
              disabled={sendingSms || smsRecipients.length === 0}
              className="rounded-xl h-11 px-6 font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
            >
              {sendingSms ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" /> Enviando...
                </>
              ) : (
                <>
                  <Send className="size-4 mr-1.5" /> Disparar SMS
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
