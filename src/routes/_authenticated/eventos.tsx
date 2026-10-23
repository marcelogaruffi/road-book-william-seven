import { AccessDenied } from "@/components/AccessDenied";
import { getErrorMessage } from "@/lib/utils";
// @ts-nocheck
import { createFileRoute, Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Edit, Trash2, Plus, Users, Save, X, ClipboardList, Lightbulb, Mic2, MessageSquareText, Loader2, Megaphone, DollarSign, ArrowRight } from 'lucide-react';
import { LogoPicker } from '@/components/LogoPicker';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
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
  produtora_nome?: string | null;
  produtora_logo_url?: string | null;
  apresentacoes?: any[];
};

type Tour = {
  id: string;
  nome: string;
};

function EventosComponent() {
  // --- SEGURANÇA E CONTROLE DE ACESSO OFICIAL AXIS ---
  const routeCtx = AuthedRoute.useRouteContext ? AuthedRoute.useRouteContext() : null;
  const allowedRolesList = ["dev","produtor","assistente_producao","tour_manager"];
  const profileRoles = routeCtx?.profile ? [routeCtx.profile.role, ...(Array.isArray(routeCtx.profile.funcoes) ? routeCtx.profile.funcoes : [])] : [];
  const hasAccess = profileRoles.some(r => allowedRolesList.includes(r));
  if (routeCtx?.profile && !hasAccess) {
    return <AccessDenied message="Você não possui permissão para acessar esta área com o seu perfil atual." />;
  }
  // ----------------------------------------------------

  const { profile, isSimulating } = AuthedRoute.useRouteContext();
  const role = profile?.role || null;
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [templatesEspetaculos, setTemplatesEspetaculos] = useState<string[]>([]);
  const [logosEspetaculos, setLogosEspetaculos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [openDialog, setOpenDialog] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [logoPickerOpen, setLogoPickerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form states
  const [cidade, setCidade] = useState('');
  const [turneId, setTurneId] = useState('');
  const [produtoraNome, setProdutoraNome] = useState('');
  const [produtoraLogoUrl, setProdutoraLogoUrl] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [dataApres, setDataApres] = useState('');
  const [horario, setHorario] = useState('');
  const [local, setLocal] = useState('');
  const [espetaculo, setEspetaculo] = useState('');
  const [apresentacoesList, setApresentacoesList] = useState<any[]>([{ data: "", horario: "", local: "" }]);

  // Rider dialog states
  const [openRiderDialog, setOpenRiderDialog] = useState(false);
  const [loadingRider, setLoadingRider] = useState(false);
  const [currentRiderSom, setCurrentRiderSom] = useState<any>(null);
  const [currentRiderLuz, setCurrentRiderLuz] = useState<any>(null);
  const [currentEventName, setCurrentEventName] = useState('');

  useEffect(() => {
    if (turneId && turneId !== 'none') {
      const t = tours.find(x => x.id === turneId);
      if (t) {
        if (t.produtora_nome) setProdutoraNome(t.produtora_nome);
        if (t.logo_producao) setProdutoraLogoUrl(t.logo_producao);
      }
    }
  }, [turneId, tours]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [evRes, trRes, tempRes, aprRes] = await Promise.all([
      supabase.from('eventos').select('*').order('data', { ascending: true }),
      supabase.from('tours').select('id, nome').order('created_at', { ascending: false }),
      supabase.from('templates_espetaculos').select('nome_espetaculo, logo_espetaculo_url').neq('nome_espetaculo', 'ESTOQUE_GLOBAL'),
      supabase.from('evento_apresentacoes').select('*')
    ]);

    if (evRes.data) {
      let finalEv = evRes.data;
      const allAps = aprRes?.data || [];
      finalEv = finalEv.map(e => ({ 
        ...e, 
        apresentacoes: allAps.filter(a => a.evento_id === e.id).sort((a,b) => {
          const tA = new Date((a.data||'2000-01-01') + 'T' + (a.horario||'00:00'));
          const tB = new Date((b.data||'2000-01-01') + 'T' + (b.horario||'00:00'));
          return tA.getTime() - tB.getTime();
        }) 
      }));
      if (isSimulating && profile && !['admin', 'dev', 'produtor'].includes(profile.role)) {
        finalEv = finalEv.filter(e => ((e.equipe as string[]) || []).includes(profile.id));
      }
      setEventos(finalEv as any);
    }
    if (trRes.data) setTours(trRes.data);
    if (tempRes.data) {
      setTemplatesEspetaculos(tempRes.data.map(t => t.nome_espetaculo));
      const logos: Record<string, string> = {};
      tempRes.data.forEach(t => {
        if (t.logo_espetaculo_url) logos[t.nome_espetaculo] = t.logo_espetaculo_url;
      });
      setLogosEspetaculos(logos);
    }
    setLoading(false);
  };

  const canEdit = ['dev', 'admin', 'produtor'].includes(role || '');

  const handleOpenNew = () => {
    setViewMode(false);
    setEditingId(null);
    setCidade('');
    setTurneId('');
    setProdutoraNome('');
    setProdutoraLogoUrl('');
    setDataInicio('');
    setDataFim('');
    setDataApres('');
    setHorario('');
    setLocal('');
    setEspetaculo('');
    setApresentacoesList([{ data: '', horario: '', local: '' }]);
    setOpenDialog(true);
  };

  const handleOpenEdit = (ev: Evento) => {
    setEditingId(ev.id);
    setCidade(ev.cidade);
    setTurneId(ev.turne_id || '');
    setDataInicio(ev.data_inicio || '');
    setDataFim(ev.data_fim || '');
    setDataApres(ev.data);
    setHorario(ev.horario);
    setLocal(ev.local);
    setEspetaculo(ev.espetaculo);
    setProdutoraNome(ev.produtora_nome || '');
    setProdutoraLogoUrl(ev.produtora_logo_url || '');
    setApresentacoesList(ev.apresentacoes && ev.apresentacoes.length > 0 ? ev.apresentacoes : [{ data: ev.data || '', horario: ev.horario || '', local: ev.local || '' }]);
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
    // Sort apresentacoes
    if (apresentacoesList.length > 0) {
      apresentacoesList.sort((a,b) => {
        const tA = new Date((a.data||'2000-01-01') + 'T' + (a.horario||'00:00'));
        const tB = new Date((b.data||'2000-01-01') + 'T' + (b.horario||'00:00'));
        return tA.getTime() - tB.getTime();
      });
    }
    
    const finalData = apresentacoesList.length > 0 ? apresentacoesList[0].data : dataApres;
    const finalHorario = apresentacoesList.length > 0 ? apresentacoesList[0].horario : horario;
    const finalLocal = apresentacoesList.length > 0 ? apresentacoesList[0].local : local;

    if (!cidade || !finalData || !finalHorario || !finalLocal || !espetaculo) {
      toast.warning('Preencha todos os campos obrigatórios.');
      return;
    }

    const payload: any = {
      cidade,
      produtora_nome: produtoraNome || null,
      produtora_logo_url: produtoraLogoUrl || null,
      turne_id: turneId || null,
      data_inicio: dataInicio || null,
      data_fim: dataFim || null,
      data: finalData,
      horario: finalHorario,
      local: finalLocal,
      espetaculo
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
      // Save Apresentacoes
      if (savedEventId) {
        const { data: currentAps } = await supabase.from('evento_apresentacoes').select('id').eq('evento_id', savedEventId);
        const currentIds = (currentAps || []).map((a:any) => a.id);
        const keepIds = apresentacoesList.map(a => a.id).filter(Boolean);
        const toDelete = currentIds.filter((id:any) => !keepIds.includes(id));
        
        if (toDelete.length > 0) {
          await supabase.from('evento_apresentacoes').delete().in('id', toDelete);
        }

        const toUpsert = apresentacoesList.map((a) => ({
          id: a.id || undefined,
          evento_id: savedEventId,
          data: a.data,
          horario: a.horario,
          local: a.local
        }));
        
        if (toUpsert.length > 0) {
          const { error: upsertErr } = await supabase.from('evento_apresentacoes').upsert(toUpsert.map(u => ({...u, id: u.id || crypto.randomUUID()})));
          if (upsertErr) { 
            toast.error('Erro no BD (Apresentacoes): ' + upsertErr.message); 
            console.error(upsertErr); 
            return; 
          }
        }
      }

      toast.success('Evento salvo com sucesso.');
      setOpenDialog(false);
      loadData();
    }
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

  const getTourName = (id: string | null) => tours.find(t => t.id === id)?.nome || 'Sem turnê vinculada';
  const fmtDate = (d: string) => d ? new Date(d + 'T12:00:00Z').toLocaleDateString('pt-BR') : '';

  const hoje = new Date().toISOString().split('T')[0];
  const proximos = eventos.filter(e => (e.data_fim || e.data) >= hoje);
  const realizados = eventos.filter(e => (e.data_fim || e.data) < hoje).reverse();

  const renderEventoCard = (ev: Evento) => {
    let monthStr = '';
    let dayStr = '';
    if (ev.data) {
      const dt = new Date(ev.data + 'T12:00:00Z');
      monthStr = dt.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      dayStr = dt.toLocaleDateString('pt-BR', { day: '2-digit' });
    }

    const logoUrl = logosEspetaculos[ev.espetaculo];

    return (
      <Card key={ev.id} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col cursor-pointer">
        
        {/* Banner with overlapping Date Square */}
        <div className="h-40 bg-indigo-50 dark:bg-slate-800 flex items-center justify-center relative overflow-hidden" onClick={() => { setViewMode(true); handleOpenEdit(ev); }}>
          
          {logoUrl ? (
            <img src={logoUrl} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" alt="Logo" />
          ) : (
            <span className="text-indigo-800 dark:text-indigo-400 font-black text-2xl opacity-40 group-hover:scale-110 transition-transform">
              {ev.espetaculo?.toUpperCase() || 'EVENTO'}
            </span>
          )}

          {/* Quadrado da Data Flutuante */}
          <div className="absolute -bottom-4 right-4 bg-white dark:bg-slate-900 shadow-lg rounded-xl flex flex-col items-center justify-center w-14 h-16 border border-slate-100 dark:border-slate-800 z-10 group-hover:-translate-y-1 transition-transform">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">{monthStr}</span>
            <span className="text-xl font-black text-slate-800 dark:text-slate-100 leading-none">{dayStr}</span>
          </div>
        </div>

        <div className="p-4 pt-5 flex flex-col flex-1">
          <div onClick={() => { setViewMode(true); handleOpenEdit(ev); }} className="flex-1">
            <h4 className="text-xl font-black text-[var(--foreground)] truncate pr-16" title={ev.espetaculo}>{ev.espetaculo}</h4>
            <p className="text-sm text-[var(--muted-foreground)] font-medium mt-1 truncate" title={ev.cidade + (ev.local ? ' - ' + ev.local : '')}>
              📍 {ev.cidade} {ev.local ? ` - ${ev.local}` : ''}
            </p>
            
            <div className="flex flex-col gap-1 mt-2">
              {ev.apresentacoes && ev.apresentacoes.length > 0 ? (
                ev.apresentacoes.map((ap, i) => (
                  <p key={i} className="text-xs text-[var(--muted-foreground)] font-medium flex items-center gap-1.5">
                    <Calendar className="size-3.5" /> {fmtDate(ap.data)} {ap.horario ? 'às ' + ap.horario.substring(0,5) : ''}
                  </p>
                ))
              ) : (
                <p className="text-xs text-[var(--muted-foreground)] font-medium flex items-center gap-1.5">
                  <Calendar className="size-3.5" /> {fmtDate(ev.data)} {ev.horario ? 'às ' + ev.horario.substring(0,5) : ''}
                </p>
              )}
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-[var(--border)] flex justify-between items-center flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md flex items-center gap-1">
                <Users className="size-3" /> {ev.equipe?.length || 0}
              </span>
              {ev.turne_id && (
                <Link 
                  to="/tour/$id" 
                  params={{ id: ev.turne_id }}
                  className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 px-2 py-1 rounded-md truncate max-w-[140px] transition-colors"
                  title={`Ver turnê: ${getTourName(ev.turne_id)}`}
                >
                  {getTourName(ev.turne_id)}
                </Link>
              )}
            </div>
            
            {canEdit && (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => { setViewMode(false); handleOpenEdit(ev); }} className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg" title="Editar">
                  <Edit className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(ev.id)} className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Excluir">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Eventos e Apresentações</h1>
          <p className="text-slate-500 mt-2">
            Cadastre datas, locais e sessões dos seus eventos e espetáculos.
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
        <Card className="p-16 text-center border-dashed border-2 border-slate-200 dark:border-white/10 bg-transparent rounded-[2rem] space-y-4">
          <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
            <Calendar className="size-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Nenhum evento cadastrado ainda</h3>
            <p className="text-slate-500 max-w-md mx-auto mt-1 text-sm">
              Cadastre seu primeiro evento para gerenciar apresentações, locais e datas.
            </p>
          </div>
          {canEdit && (
            <Button onClick={handleOpenNew} className="rounded-xl px-6 h-11 font-bold shadow-md">
              <Plus className="mr-2 size-4" /> Cadastrar Primeiro Evento
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-12">
          {proximos.length > 0 ? (
            <div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-6">Próximos Eventos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 opacity-90">
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
            <div className="flex items-center justify-between pr-4">
              <DialogTitle className="text-2xl font-black">
                {viewMode ? 'Informações do Evento' : (editingId ? 'Editar Evento' : 'Novo Evento')}
              </DialogTitle>
              {viewMode && canEdit && (
                <Button variant="outline" size="sm" onClick={() => setViewMode(false)} className="rounded-lg font-bold h-8 px-3 text-indigo-600 border-indigo-200 hover:bg-indigo-50 shadow-sm mt-1">
                  <Edit className="size-3.5 mr-1" /> Editar
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-4">
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label className="font-bold text-slate-700 dark:text-slate-300">Nome do Evento / Espetáculo *</Label>
                <Button type="button" variant="ghost" size="sm" onClick={handleCreateEspetaculo} className="h-8 text-primary font-bold">
                  <Plus className="size-4 mr-1" /> Novo Espetáculo
                </Button>
              </div>
              <select disabled={viewMode} 
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

            <div className="space-y-2 md:col-span-1">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Produtora</Label>
              <Input disabled={viewMode} value={produtoraNome} onChange={e => setProdutoraNome(e.target.value)} placeholder="Nome da Produtora" className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Logo da Produtora</Label>
              <div className="flex items-center gap-2">
                {produtoraLogoUrl && <img src={produtoraLogoUrl} alt="Logo" className="h-10 object-contain rounded-md border p-1 bg-white" />}
                <button type="button" disabled={viewMode} onClick={() => setLogoPickerOpen(true)} className="inline-flex items-center gap-2 text-sm border rounded-md px-3 py-2 cursor-pointer hover:bg-accent h-12 w-full justify-center">
                  <Plus className="size-4" /> Anexar Logo
                </button>
                <LogoPicker
                  open={logoPickerOpen}
                  onOpenChange={setLogoPickerOpen}
                  onSelect={setProdutoraLogoUrl}
                  uploadPath="produtoras"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Vincular à Turnê (Opcional)</Label>
              <select disabled={viewMode} 
                value={turneId} 
                onChange={e => setTurneId(e.target.value)}
                className="flex h-12 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Nenhuma turnê vinculada</option>
                {tours.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
              <p className="text-xs text-slate-500">Agrupe este evento em uma turnê para integrá-lo à logística e roteiro de viagens.</p>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Cidade *</Label>
              <Input disabled={viewMode} value={cidade} onChange={e => setCidade(e.target.value)} className="h-12 rounded-xl" />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Local Principal *</Label>
              <Input disabled={viewMode} value={local} onChange={e => setLocal(e.target.value)} placeholder="Teatro, Arena ou Centro de Convenções" className="h-12 rounded-xl" />
            </div>

            <div className="md:col-span-2 pt-4 border-t border-slate-100 dark:border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="font-bold text-slate-700 dark:text-slate-300">Apresentações (Sessões) *</Label>
                {!viewMode && (
                  <Button variant="outline" size="sm" onClick={() => setApresentacoesList([...apresentacoesList, { data: '', horario: '', local: local }])} className="h-8 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100">
                    <Plus className="size-3 mr-1" /> Adicionar Apresentação
                  </Button>
                )}
              </div>
              
              {apresentacoesList.length === 0 && (
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 text-sm">
                  Clique no botão acima para adicionar datas e locais.
                </div>
              )}

              <div className="space-y-3">
                {apresentacoesList.map((ap, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 relative">
                    <div className="flex-[0.8] space-y-1">
                      <Label className="text-[10px] uppercase text-slate-500 font-bold">Data *</Label>
                      <Input type="date" disabled={viewMode} value={ap.data} onChange={e => { const nl = [...apresentacoesList]; nl[idx].data = e.target.value; setApresentacoesList(nl); if (idx === 0) setDataApres(e.target.value); }} className="h-10 bg-white dark:bg-slate-900" />
                    </div>
                    <div className="flex-[0.6] space-y-1">
                      <Label className="text-[10px] uppercase text-slate-500 font-bold">Horário *</Label>
                      <Input type="time" disabled={viewMode} value={ap.horario} onChange={e => { const nl = [...apresentacoesList]; nl[idx].horario = e.target.value; setApresentacoesList(nl); if (idx === 0) setHorario(e.target.value); }} className="h-10 bg-white dark:bg-slate-900" />
                    </div>
                    <div className="flex-[1.5] space-y-1">
                      <Label className="text-[10px] uppercase text-slate-500 font-bold">Local *</Label>
                      <Input disabled={viewMode} value={ap.local} onChange={e => { const nl = [...apresentacoesList]; nl[idx].local = e.target.value; setApresentacoesList(nl); if (idx === 0) setLocal(e.target.value); }} className="h-10 bg-white dark:bg-slate-900" />
                    </div>
                    {!viewMode && apresentacoesList.length > 1 && (
                      <div className="pt-5 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => { const nl = [...apresentacoesList]; nl.splice(idx, 1); setApresentacoesList(nl); }} className="h-10 w-10 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Data de Início da Viagem</Label>
              <Input disabled={viewMode} type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="h-12 rounded-xl" />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Data de Fim da Viagem</Label>
              <Input disabled={viewMode} type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="h-12 rounded-xl" />
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            {viewMode ? (
              <Button onClick={() => setOpenDialog(false)} className="rounded-xl h-12 px-8 font-bold shadow-md bg-indigo-600 hover:bg-indigo-700 text-white">
                Fechar
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setOpenDialog(false)} className="rounded-xl h-12 px-6 font-bold">
                  Cancelar
                </Button>
                <Button onClick={handleSave} className="rounded-xl h-12 px-8 font-bold shadow-md">
                  <Save className="size-4 mr-2"/> Salvar Evento
                </Button>
              </>
            )}
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
    </div>
  );
}
