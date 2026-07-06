import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Edit, Trash2, Plus, Users, Save, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from "sonner";

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
  const [role, setRole] = useState<string | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [profissionais, setProfissionais] = useState<Profile[]>([]);
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
  const [equipe, setEquipe] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: authData } = await supabase.auth.getUser();
    if (authData.user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', authData.user.id).single();
      if (profile) setRole(profile.role);
    }

    const [evRes, trRes, profRes] = await Promise.all([
      supabase.from('eventos').select('*').order('data', { ascending: true }),
      supabase.from('tours').select('id, nome').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, nome, role').in('role', ['admin', 'produtor', 'motorista', 'tecnico_som', 'iluminador', 'artista'])
    ]);

    if (evRes.data) setEventos(evRes.data);
    if (trRes.data) setTours(trRes.data);
    if (profRes.data) setProfissionais(profRes.data);
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
    setEquipe([]);
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
    setEquipe(ev.equipe || []);
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este evento?')) return;
    const { error } = await supabase.from('eventos').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Evento excluído.');
      loadData();
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
    if (editingId) {
      const res = await supabase.from('eventos').update(payload).eq('id', editingId);
      error = res.error;
    } else {
      const { data: userData } = await supabase.auth.getUser();
      const res = await supabase.from('eventos').insert({ ...payload, created_by: userData.user?.id });
      error = res.error;
    }

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Evento salvo com sucesso.');
      setOpenDialog(false);
      loadData();
    }
  };

  const toggleEquipe = (id: string) => {
    setEquipe(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const getTourName = (id: string | null) => tours.find(t => t.id === id)?.nome || 'Sem turnê vinculada';
  const fmtDate = (d: string) => d ? new Date(d + 'T12:00:00Z').toLocaleDateString('pt-BR') : '';

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
      ) : eventos.length === 0 ? (
        <Card className="p-16 text-center border-dashed border-2 bg-transparent rounded-[2rem]">
          <p className="text-slate-500 font-medium mb-6">Nenhum evento cadastrado ainda.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {eventos.map(ev => (
            <Card key={ev.id} className="p-5 flex flex-col md:flex-row md:items-center gap-5 justify-between group rounded-[1.5rem]">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-bold">
                    <Calendar className="size-3 mr-1" /> {fmtDate(ev.data)} às {ev.horario.substring(0,5)}
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
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleOpenEdit(ev)} className="rounded-xl">
                    <Edit className="size-4 text-slate-500" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleDelete(ev.id)} className="rounded-xl hover:bg-red-50 hover:text-red-500">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              )}
            </Card>
          ))}
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
              <Label className="font-bold text-slate-700 dark:text-slate-300">Nome do Evento / Espetáculo *</Label>
              <Input value={espetaculo} onChange={e => setEspetaculo(e.target.value)} className="h-12 rounded-xl" />
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
              <div className="flex flex-col gap-6 mt-4">
                {[
                  { key: 'produtor', label: 'Produtores / Admins', roles: ['admin', 'produtor'] },
                  { key: 'artista', label: 'Artistas', roles: ['artista'] },
                  { key: 'iluminador', label: 'Iluminadores', roles: ['iluminador'] },
                  { key: 'tecnico_som', label: 'Técnicos de Som', roles: ['tecnico_som'] },
                  { key: 'motorista', label: 'Motoristas', roles: ['motorista'] },
                ].map(group => {
                  const groupProfs = profissionais.filter(p => group.roles.includes(p.role));
                  if (groupProfs.length === 0) return null;
                  return (
                    <div key={group.key} className="space-y-2 border-b pb-4 last:border-0 last:pb-0">
                      <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider">{group.label}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {groupProfs.map(p => {
                           const isSelected = equipe.includes(p.id);
                           return (
                             <div 
                                key={p.id} 
                                onClick={() => toggleEquipe(p.id)}
                                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20'}`}
                             >
                               <div>
                                 <p className="font-bold text-slate-800 dark:text-white text-sm">{p.nome}</p>
                                 <p className="text-xs text-slate-500 uppercase font-semibold mt-0.5">{p.role}</p>
                               </div>
                               <div className={`size-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-primary border-primary text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                                  {isSelected && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="size-3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                               </div>
                             </div>
                           );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setOpenDialog(false)} className="rounded-xl h-12 px-6 font-bold">Cancelar</Button>
            <Button onClick={handleSave} className="rounded-xl h-12 px-8 font-bold shadow-md"><Save className="size-4 mr-2"/> Salvar Evento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
