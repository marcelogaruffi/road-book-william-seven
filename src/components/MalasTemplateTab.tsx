import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Luggage, Save, Image as ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export type MalaItem = {
  id: string;
  nome: string;
  quantidade: number | string;
  foto_url?: string;
  foto_path?: string;
};

export type MalaVolume = {
  id: string;
  nome: string;
  itens: MalaItem[];
};

export function MalasTemplateTab() {
  const [templates, setTemplates] = useState<{nome_espetaculo: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [editNome, setEditNome] = useState("");
  const [rawTemplate, setRawTemplate] = useState<any>(null);
  
  const [volumes, setVolumes] = useState<MalaVolume[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function handleUploadItemFoto(volumeId: string, itemId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(itemId);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id || 'public';
      const path = `malas/${uid}/${Date.now()}-${f.name}`;
      
      const { error } = await supabase.storage.from("roadbook-docs").upload(path, f, { upsert: false, contentType: f.type });
      if (error) throw error;
      
      const { data: publicData } = supabase.storage.from("roadbook-docs").getPublicUrl(path);
      
      setVolumes(prev => prev.map(v => {
        if (v.id === volumeId) {
          return {
            ...v,
            itens: v.itens.map(i => {
              if (i.id === itemId) {
                if (i.foto_path) {
                  supabase.storage.from("roadbook-docs").remove([i.foto_path]).catch(() => {});
                }
                return { ...i, foto_url: publicData.publicUrl, foto_path: path };
              }
              return i;
            })
          };
        }
        return v;
      }));
      toast.success("Foto anexada!");
    } catch (err: any) {
      toast.error(getErrorMessage(err) || "Erro no upload");
    } finally {
      setUploading(null);
      e.target.value = "";
    }
  }

  async function loadTemplates() {
    setLoading(true);
    const { data } = await supabase.from('templates_espetaculos').select('nome_espetaculo').order('nome_espetaculo');
    if (data) setTemplates(data);
    setLoading(false);
  }

  async function handleEdit(t: {nome_espetaculo: string}) {
    setEditNome(t.nome_espetaculo);
    const { data, error } = await supabase.from('templates_espetaculos').select('*').eq('nome_espetaculo', t.nome_espetaculo).single();
    if (data) {
      setRawTemplate(data);
      const parsedVolumes = data.assets_midia?.malas_padrao || [];
      setVolumes(parsedVolumes);
    }
  }

  function clearForm() {
    setEditNome("");
    setRawTemplate(null);
    setVolumes([]);
  }

  async function saveTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!editNome.trim()) {
      toast.error("Informe o nome do espetáculo");
      return;
    }
    setSaving(true);
    
    const currentAssets = rawTemplate?.assets_midia || {};
    const payload = {
      nome_espetaculo: editNome.trim(),
      assets_midia: { ...currentAssets, malas_padrao: volumes },
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('templates_espetaculos').upsert(payload);
    
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + getErrorMessage(error));
    } else {
      toast.success("Mala Padrão salva com sucesso!");
      clearForm();
      loadTemplates();
    }
  }

  function addVolume() {
    setVolumes([...volumes, { id: Math.random().toString(36).substring(2, 9), nome: '', itens: [] }]);
  }

  function updateVolume(id: string, nome: string) {
    setVolumes(volumes.map(v => v.id === id ? { ...v, nome } : v));
  }

  function removeVolume(id: string) {
    if (!confirm("Tem certeza que deseja remover este volume e todos os seus itens?")) return;
    setVolumes(volumes.filter(v => v.id !== id));
  }

  function addItem(volumeId: string) {
    setVolumes(volumes.map(v => {
      if (v.id === volumeId) {
        return { ...v, itens: [...v.itens, { id: Math.random().toString(36).substring(2, 9), nome: '', quantidade: 1 }] };
      }
      return v;
    }));
  }

  function updateItem(volumeId: string, itemId: string, field: string, value: any) {
    setVolumes(volumes.map(v => {
      if (v.id === volumeId) {
        return {
          ...v,
          itens: v.itens.map(i => i.id === itemId ? { ...i, [field]: value } : i)
        };
      }
      return v;
    }));
  }

  function removeItem(volumeId: string, itemId: string) {
    setVolumes(volumes.map(v => {
      if (v.id === volumeId) {
        return { ...v, itens: v.itens.filter(i => i.id !== itemId) };
      }
      return v;
    }));
  }

  if (loading) return <div className="p-8 text-center">Carregando modelos...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
      <div className="lg:col-span-1 space-y-6">
        <Card className="border-0 shadow-lg dark:bg-card rounded-2xl">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-xl font-bold">Riders Cadastrados</h3>
            {templates.length === 0 ? (
              <p className="text-slate-500">Nenhum espetáculo cadastrado.</p>
            ) : (
              <div className="space-y-2">
                {templates.map(t => (
                  <div key={t.nome_espetaculo} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10">
                    <span className="font-bold truncate">{t.nome_espetaculo}</span>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(t)}>Editar Malas</Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card className="border-0 shadow-lg dark:bg-card rounded-2xl">
          <CardContent className="p-6">
            <form onSubmit={saveTemplate} className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Volumes e Itens Padrão</h3>
                {editNome && <Button type="button" variant="ghost" onClick={clearForm}>Cancelar Edição</Button>}
              </div>

              {!editNome ? (
                <div className="text-center py-10 border-2 border-dashed rounded-xl bg-slate-50 dark:bg-card/50 text-slate-500">
                  <p>Selecione um espetáculo na lista ao lado para editar suas malas.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 p-4 bg-primary/5 rounded-xl border border-primary/20">
                    <Label className="text-primary font-bold">Espetáculo Selecionado</Label>
                    <div className="text-2xl font-black text-slate-800 dark:text-white">{editNome}</div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="button" onClick={addVolume} variant="outline" className="rounded-xl border-dashed">
                      <Plus className="size-4 mr-2" /> Novo Volume/Mala
                    </Button>
                  </div>

                  {volumes.length === 0 ? (
                    <div className="text-center p-8 border-2 border-dashed rounded-xl text-slate-500">
                      Nenhum volume configurado. Clique em "Novo Volume" acima.
                    </div>
                  ) : (
                    <Accordion type="multiple" defaultValue={volumes.map(v => v.id)} className="space-y-4">
                      {volumes.map(vol => (
                        <AccordionItem key={vol.id} value={vol.id} className="border border-slate-200 dark:border-white/10 rounded-xl px-4 bg-slate-50/50 dark:bg-black/20">
                          <div className="flex items-center w-full justify-between pr-4 pt-2">
                            <Input 
                              value={vol.nome}
                              onChange={(e) => updateVolume(vol.id, e.target.value)}
                              placeholder="Nome do Volume (Ex: Mala Figurino 1, Case de Áudio)"
                              className="font-bold text-lg border-none bg-transparent shadow-none focus-visible:ring-0 max-w-sm"
                            />
                            <div className="flex items-center gap-2">
                              <Button type="button" variant="ghost" size="icon" onClick={() => removeVolume(vol.id)} className="text-red-500 hover:bg-red-50">
                                <Trash2 className="size-4" />
                              </Button>
                              <AccordionTrigger className="p-2" />
                            </div>
                          </div>
                          
                          <AccordionContent className="pt-2 pb-6 px-2">
                            <div className="space-y-2">
                              {vol.itens.map(item => (
                                <div key={item.id} className="flex items-center gap-2">
                                  <Input 
                                    type="number"
                                    min="1"
                                    value={item.quantidade}
                                    onChange={(e) => updateItem(vol.id, item.id, 'quantidade', e.target.value)}
                                    className="w-20 text-center h-9"
                                    title="Quantidade"
                                  />
                                  <div className="flex flex-1 items-center gap-2">
                                    {item.foto_url && (
                                      <a href={item.foto_url} target="_blank" rel="noreferrer" className="shrink-0">
                                        <img src={item.foto_url} alt={item.nome} className="h-9 w-9 rounded-md object-cover border border-slate-200 dark:border-white/10 hover:opacity-80 transition-opacity" />
                                      </a>
                                    )}
                                    <Input 
                                      value={item.nome}
                                      onChange={(e) => updateItem(vol.id, item.id, 'nome', e.target.value)}
                                      placeholder="Nome do item (ex: Cabo XLR, Camisa Branca)"
                                      className="flex-1 h-9"
                                    />
                                  </div>
                                  
                                  <label className="cursor-pointer shrink-0">
                                    <input type="file" accept="image/*" className="hidden" tabIndex={-1} onChange={(e) => handleUploadItemFoto(vol.id, item.id, e)} disabled={uploading === item.id} />
                                    <Button type="button" variant="ghost" size="icon" asChild tabIndex={-1} className={`h-9 w-9 text-slate-500 hover:text-primary ${uploading === item.id ? 'opacity-50' : ''}`}>
                                      <span tabIndex={-1}>
                                        {uploading === item.id ? <Loader2 className="size-4 animate-spin" /> : <ImageIcon className="size-4" />}
                                      </span>
                                    </Button>
                                  </label>

                                  <Button type="button" variant="ghost" size="icon" tabIndex={-1} onClick={() => removeItem(vol.id, item.id)} className="shrink-0 h-9 w-9 text-red-500 hover:bg-red-50">
                                    <Trash2 className="size-4" />
                                  </Button>
                                </div>
                              ))}
                              
                              <Button type="button" onClick={() => addItem(vol.id)} size="sm" variant="ghost" className="mt-2 text-slate-500">
                                <Plus className="size-4 mr-2" /> Adicionar Item
                              </Button>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}

                  <div className="pt-4 flex justify-end">
                    <Button type="submit" disabled={saving} className="h-12 px-8 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg hover:shadow-xl">
                      <Save className="size-5 mr-2" />
                      {saving ? 'Salvando...' : 'Salvar Malas Padrão'}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
