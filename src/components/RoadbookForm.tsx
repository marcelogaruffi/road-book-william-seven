import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Plus, Upload, FileText, ExternalLink } from "lucide-react";
import { makeRoadbookSlug } from "@/lib/slug";
import {
  type RoadbookData, type ProgItem, type Quarto, type OutroContato, type Documento, type Foto, type FotoCategoria,
  PROG_TIPOS, FOTO_CATEGORIAS, roadbookToPayload,
} from "@/lib/roadbook-types";

export type { RoadbookData, ProgItem } from "@/lib/roadbook-types";
export { emptyRoadbook } from "@/lib/roadbook-types";

type TourOpt = { id: string; nome: string };

export function RoadbookForm({ initial }: { initial: RoadbookData }) {
  const navigate = useNavigate();
  const [d, setD] = useState<RoadbookData>(initial);
  const [saving, setSaving] = useState(false);
  const [tours, setTours] = useState<TourOpt[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("tours").select("id,nome").order("nome");
      setTours((data as TourOpt[]) ?? []);
    })();
  }, []);

  function up<K extends keyof RoadbookData>(k: K, v: RoadbookData[K]) {
    setD((s) => ({ ...s, [k]: v }));
  }

  // PROGRAMACAO
  function addProg() {
    setD((s) => ({ ...s, programacao: [...s.programacao, { data: "", hora_inicio: "", hora_fim: "", titulo: "", tipo: "Outro", local: "", observacao: "" }] }));
  }
  function updateProg(i: number, patch: Partial<ProgItem>) {
    setD((s) => ({ ...s, programacao: s.programacao.map((p, idx) => idx === i ? { ...p, ...patch } : p) }));
  }
  function removeProg(i: number) {
    setD((s) => ({ ...s, programacao: s.programacao.filter((_, idx) => idx !== i) }));
  }

  // QUARTOS
  function addQuarto() { setD((s) => ({ ...s, quartos: [...s.quartos, { pessoa: "", numero: "" }] })); }
  function updateQuarto(i: number, patch: Partial<Quarto>) {
    setD((s) => ({ ...s, quartos: s.quartos.map((q, idx) => idx === i ? { ...q, ...patch } : q) }));
  }
  function removeQuarto(i: number) { setD((s) => ({ ...s, quartos: s.quartos.filter((_, idx) => idx !== i) })); }

  // OUTROS CONTATOS
  function addContato() { setD((s) => ({ ...s, outros_contatos: [...s.outros_contatos, { nome: "", funcao: "", whatsapp: "" }] })); }
  function updateContato(i: number, patch: Partial<OutroContato>) {
    setD((s) => ({ ...s, outros_contatos: s.outros_contatos.map((c, idx) => idx === i ? { ...c, ...patch } : c) }));
  }
  function removeContato(i: number) { setD((s) => ({ ...s, outros_contatos: s.outros_contatos.filter((_, idx) => idx !== i) })); }

  // FOTOS (teatro + hotel)
  async function uploadFotos(files: FileList | null, kind: "teatro" | "hotel") {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) throw new Error("Sessão expirada");
      const rbId = d.id ?? "draft";
      const novos: Foto[] = [];
      for (const f of Array.from(files)) {
        if (!f.type.startsWith("image/")) continue;
        const safeName = f.name.replace(/[^\w.\-]+/g, "_");
        const path = `${uid}/${rbId}/${kind}/${Date.now()}-${safeName}`;
        const { error } = await supabase.storage.from("roadbook-docs").upload(path, f, { upsert: false, contentType: f.type });
        if (error) throw error;
        const { data: signed } = await supabase.storage.from("roadbook-docs").createSignedUrl(path, 60 * 60 * 24 * 7);
        novos.push({ path, nome: f.name, categoria: "Outros", descricao: "", url: signed?.signedUrl });
      }
      const key = kind === "teatro" ? "teatro_fotos" : "hotel_fotos";
      setD((s) => ({ ...s, [key]: [...s[key], ...novos] }));
      toast.success(`${novos.length} foto(s) enviada(s)`);
    } catch (err: any) {
      toast.error(err.message ?? "Erro no upload");
    } finally {
      setUploading(false);
    }
  }
  function onUploadFotoTeatro(e: React.ChangeEvent<HTMLInputElement>) {
    uploadFotos(e.target.files, "teatro").finally(() => { e.target.value = ""; });
  }
  function onUploadFotoHotel(e: React.ChangeEvent<HTMLInputElement>) {
    uploadFotos(e.target.files, "hotel").finally(() => { e.target.value = ""; });
  }
  function updateFoto(kind: "teatro" | "hotel", i: number, patch: Partial<Foto>) {
    const key = kind === "teatro" ? "teatro_fotos" : "hotel_fotos";
    setD((s) => ({ ...s, [key]: s[key].map((f, idx) => idx === i ? { ...f, ...patch } : f) }));
  }
  async function removeFoto(kind: "teatro" | "hotel", i: number) {
    const key = kind === "teatro" ? "teatro_fotos" : "hotel_fotos";
    const foto = d[key][i];
    try { if (foto.path) await supabase.storage.from("roadbook-docs").remove([foto.path]); } catch {}
    setD((s) => ({ ...s, [key]: s[key].filter((_, idx) => idx !== i) }));
  }

  // DOCUMENTOS
  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) throw new Error("Sessão expirada");
      const rbId = d.id ?? "draft";
      const novos: Documento[] = [];
      for (const f of Array.from(files)) {
        const safeName = f.name.replace(/[^\w.\-]+/g, "_");
        const path = `${uid}/${rbId}/${Date.now()}-${safeName}`;
        const { error } = await supabase.storage.from("roadbook-docs").upload(path, f, { upsert: false, contentType: f.type });
        if (error) throw error;
        const { data: pub } = supabase.storage.from("roadbook-docs").getPublicUrl(path);
        novos.push({ nome: f.name, path, tipo: f.type || "application/octet-stream", url: pub.publicUrl });
      }
      setD((s) => ({ ...s, documentos: [...s.documentos, ...novos] }));
      toast.success(`${novos.length} arquivo(s) enviado(s)`);
    } catch (err: any) {
      toast.error(err.message ?? "Erro no upload");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }
  async function removeDoc(i: number) {
    const doc = d.documentos[i];
    try {
      if (doc.path) await supabase.storage.from("roadbook-docs").remove([doc.path]);
    } catch {}
    setD((s) => ({ ...s, documentos: s.documentos.filter((_, idx) => idx !== i) }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!d.espetaculo.trim() || !d.cidade.trim()) {
      toast.error("Espetáculo e Cidade são obrigatórios");
      return;
    }
    setSaving(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id;
      if (!userId) throw new Error("Sessão expirada");

      const baseSlug = makeRoadbookSlug(d.espetaculo, d.cidade);
      const payload = roadbookToPayload(d, userId);

      if (d.id) {
        const { error } = await supabase.from("roadbooks").update(payload).eq("id", d.id);
        if (error) throw error;
        toast.success("Salvo!");
      } else {
        let inserted: { id: string; slug: string } | null = null;
        for (let attempt = 0; attempt < 5; attempt++) {
          const trySlug = attempt === 0 ? baseSlug : `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
          const { data: row, error } = await supabase
            .from("roadbooks")
            .insert({ ...payload, slug: trySlug })
            .select("id,slug")
            .single();
          if (!error && row) { inserted = row as any; break; }
          if (error && !`${error.message}`.toLowerCase().includes("duplicate")) throw error;
          if (attempt === 4) throw error ?? new Error("Não foi possível gerar slug");
        }
        toast.success("Criado! Página pública: /rb/" + inserted!.slug);
      }
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="flex flex-wrap h-auto justify-start">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="hotel">Hotel</TabsTrigger>
          <TabsTrigger value="teatro">Teatro</TabsTrigger>
          <TabsTrigger value="contatos">Contatos</TabsTrigger>
          <TabsTrigger value="programacao">Programação</TabsTrigger>
          <TabsTrigger value="festival">Festival</TabsTrigger>
          <TabsTrigger value="docs">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Espetáculo</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <Field label="Espetáculo *"><Input required value={d.espetaculo} onChange={(e) => up("espetaculo", e.target.value)} /></Field>
              <Field label="Festival"><Input value={d.festival} onChange={(e) => up("festival", e.target.value)} /></Field>
              <Field label="Cidade *"><Input required value={d.cidade} onChange={(e) => up("cidade", e.target.value)} /></Field>
              <Field label="Estado"><Input value={d.estado} onChange={(e) => up("estado", e.target.value)} maxLength={2} /></Field>
              <Field label="Data Inicial"><Input type="date" value={d.data_inicial} onChange={(e) => up("data_inicial", e.target.value)} /></Field>
              <Field label="Data Final"><Input type="date" value={d.data_final} onChange={(e) => up("data_final", e.target.value)} /></Field>
              <Field label="Turnê (opcional)">
                <Select value={d.tour_id ?? "none"} onValueChange={(v) => up("tour_id", v === "none" ? null : v)}>
                  <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {tours.map((t) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Resumo executivo">
                  <Textarea rows={4} value={d.resumo_executivo} onChange={(e) => up("resumo_executivo", e.target.value)} placeholder="Visão geral da temporada nesta cidade..." />
                </Field>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hotel" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle>Hotel</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <Field label="Nome"><Input value={d.hotel_nome} onChange={(e) => up("hotel_nome", e.target.value)} /></Field>
              <Field label="Telefone"><Input value={d.hotel_telefone} onChange={(e) => up("hotel_telefone", e.target.value)} /></Field>
              <div className="sm:col-span-2"><Field label="Endereço"><Input value={d.hotel_endereco} onChange={(e) => up("hotel_endereco", e.target.value)} /></Field></div>
              <Field label="Site"><Input value={d.hotel_site} onChange={(e) => up("hotel_site", e.target.value)} placeholder="https://" /></Field>
              <div />
              <Field label="Check-in"><Input type="date" value={d.hotel_checkin} onChange={(e) => up("hotel_checkin", e.target.value)} /></Field>
              <Field label="Check-out"><Input type="date" value={d.hotel_checkout} onChange={(e) => up("hotel_checkout", e.target.value)} /></Field>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Quartos</CardTitle>
              <Button type="button" size="sm" variant="outline" onClick={addQuarto}><Plus className="size-4 mr-1" />Adicionar</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {d.quartos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum quarto.</p>}
              {d.quartos.map((q, i) => (
                <div key={i} className="grid sm:grid-cols-12 gap-2 items-end border rounded-md p-3">
                  <div className="sm:col-span-7"><Label className="text-xs">Pessoa</Label><Input value={q.pessoa} onChange={(e) => updateQuarto(i, { pessoa: e.target.value })} /></div>
                  <div className="sm:col-span-4"><Label className="text-xs">Quarto</Label><Input value={q.numero} onChange={(e) => updateQuarto(i, { numero: e.target.value })} /></div>
                  <div className="sm:col-span-1 flex sm:justify-end"><Button type="button" variant="ghost" size="icon" onClick={() => removeQuarto(i)}><Trash2 className="size-4" /></Button></div>
                </div>
              ))}
            </CardContent>
          </Card>
          <FotosCard
            title="Fotos do hotel"
            uploading={uploading}
            fotos={d.hotel_fotos}
            onUpload={onUploadFotoHotel}
            onUpdate={(i, p) => updateFoto("hotel", i, p)}
            onRemove={(i) => removeFoto("hotel", i)}
          />
        </TabsContent>

        <TabsContent value="teatro" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle>Local Principal (Teatro)</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <Field label="Nome"><Input value={d.teatro_nome} onChange={(e) => up("teatro_nome", e.target.value)} /></Field>
              <Field label="Telefone"><Input value={d.teatro_telefone} onChange={(e) => up("teatro_telefone", e.target.value)} /></Field>
              <div className="sm:col-span-2"><Field label="Endereço"><Input value={d.teatro_endereco} onChange={(e) => up("teatro_endereco", e.target.value)} /></Field></div>
              <Field label="Site"><Input value={d.teatro_site} onChange={(e) => up("teatro_site", e.target.value)} placeholder="https://" /></Field>
              <div />
              <div className="sm:col-span-2"><Field label="Observações"><Textarea rows={3} value={d.teatro_observacoes} onChange={(e) => up("teatro_observacoes", e.target.value)} /></Field></div>
            </CardContent>
          </Card>
          <FotosCard
            title="Fotos do teatro"
            uploading={uploading}
            fotos={d.teatro_fotos}
            onUpload={onUploadFotoTeatro}
            onUpdate={(i, p) => updateFoto("teatro", i, p)}
            onRemove={(i) => removeFoto("teatro", i)}
          />
        </TabsContent>


        <TabsContent value="contatos" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle>Produção e Receptivo</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <Field label="Produção — Nome"><Input value={d.producao_nome} onChange={(e) => up("producao_nome", e.target.value)} /></Field>
              <Field label="Receptivo — Nome"><Input value={d.receptivo_nome} onChange={(e) => up("receptivo_nome", e.target.value)} /></Field>
              <Field label="Produção — WhatsApp"><Input value={d.producao_whatsapp} onChange={(e) => up("producao_whatsapp", e.target.value)} placeholder="55 11 99999-9999" /></Field>
              <Field label="Receptivo — WhatsApp"><Input value={d.receptivo_whatsapp} onChange={(e) => up("receptivo_whatsapp", e.target.value)} placeholder="55 11 99999-9999" /></Field>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Outros contatos</CardTitle>
              <Button type="button" size="sm" variant="outline" onClick={addContato}><Plus className="size-4 mr-1" />Adicionar</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {d.outros_contatos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum.</p>}
              {d.outros_contatos.map((c, i) => (
                <div key={i} className="grid sm:grid-cols-12 gap-2 items-end border rounded-md p-3">
                  <div className="sm:col-span-4"><Label className="text-xs">Nome</Label><Input value={c.nome} onChange={(e) => updateContato(i, { nome: e.target.value })} /></div>
                  <div className="sm:col-span-4"><Label className="text-xs">Função</Label><Input value={c.funcao} onChange={(e) => updateContato(i, { funcao: e.target.value })} /></div>
                  <div className="sm:col-span-3"><Label className="text-xs">WhatsApp</Label><Input value={c.whatsapp} onChange={(e) => updateContato(i, { whatsapp: e.target.value })} placeholder="55 11 99999-9999" /></div>
                  <div className="sm:col-span-1 flex sm:justify-end"><Button type="button" variant="ghost" size="icon" onClick={() => removeContato(i)}><Trash2 className="size-4" /></Button></div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="programacao" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Programação</CardTitle>
              <Button type="button" size="sm" variant="outline" onClick={addProg}><Plus className="size-4 mr-1" />Adicionar</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {d.programacao.length === 0 && <p className="text-sm text-muted-foreground">Nenhum item.</p>}
              {d.programacao.map((p, i) => (
                <div key={i} className="grid sm:grid-cols-12 gap-2 items-start border rounded-md p-3">
                  <div className="sm:col-span-2"><Label className="text-xs">Data</Label><Input type="date" value={p.data} onChange={(e) => updateProg(i, { data: e.target.value })} /></div>
                  <div className="sm:col-span-2"><Label className="text-xs">Início</Label><Input type="time" value={p.hora_inicio || p.hora || ""} onChange={(e) => updateProg(i, { hora_inicio: e.target.value })} /></div>
                  <div className="sm:col-span-2"><Label className="text-xs">Fim</Label><Input type="time" value={p.hora_fim ?? ""} onChange={(e) => updateProg(i, { hora_fim: e.target.value })} /></div>
                  <div className="sm:col-span-3"><Label className="text-xs">Título</Label><Input value={p.titulo || p.atividade || ""} onChange={(e) => updateProg(i, { titulo: e.target.value, atividade: undefined })} /></div>
                  <div className="sm:col-span-2"><Label className="text-xs">Tipo</Label>
                    <Select value={p.tipo ?? "Outro"} onValueChange={(v) => updateProg(i, { tipo: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PROG_TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-1 flex sm:justify-end"><Button type="button" variant="ghost" size="icon" onClick={() => removeProg(i)}><Trash2 className="size-4" /></Button></div>
                  <div className="sm:col-span-6"><Label className="text-xs">Local</Label><Input value={p.local} onChange={(e) => updateProg(i, { local: e.target.value })} /></div>
                  <div className="sm:col-span-6"><Label className="text-xs">Observação</Label><Textarea rows={1} value={p.observacao} onChange={(e) => updateProg(i, { observacao: e.target.value })} /></div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="festival" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Festival e Comunicação (opcional)</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <Field label="Site oficial"><Input value={d.festival_info.site ?? ""} onChange={(e) => up("festival_info", { ...d.festival_info, site: e.target.value })} placeholder="https://" /></Field>
              <Field label="Instagram"><Input value={d.festival_info.instagram ?? ""} onChange={(e) => up("festival_info", { ...d.festival_info, instagram: e.target.value })} placeholder="@perfil" /></Field>
              <div className="sm:col-span-2"><Field label="Outras redes sociais"><Input value={d.festival_info.redes ?? ""} onChange={(e) => up("festival_info", { ...d.festival_info, redes: e.target.value })} /></Field></div>
              <div className="sm:col-span-2"><Field label="Programação oficial (URL ou texto)"><Textarea rows={3} value={d.festival_info.programacao_oficial ?? ""} onChange={(e) => up("festival_info", { ...d.festival_info, programacao_oficial: e.target.value })} /></Field></div>
              <div className="sm:col-span-2"><Field label="Observações"><Textarea rows={3} value={d.festival_info.observacoes ?? ""} onChange={(e) => up("festival_info", { ...d.festival_info, observacoes: e.target.value })} /></Field></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Documentos (PDF, imagens)</CardTitle>
              <label className="inline-flex">
                <input type="file" multiple accept="application/pdf,image/*" className="hidden" onChange={onUpload} disabled={uploading} />
                <span className={"inline-flex items-center gap-2 text-sm border rounded-md px-3 py-1.5 cursor-pointer hover:bg-accent " + (uploading ? "opacity-50" : "")}>
                  <Upload className="size-4" />{uploading ? "Enviando..." : "Enviar arquivos"}
                </span>
              </label>
            </CardHeader>
            <CardContent className="space-y-2">
              {d.documentos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum arquivo. Ex.: planta do teatro, fotos, programação oficial.</p>}
              {d.documentos.map((doc, i) => (
                <div key={i} className="flex items-center gap-3 border rounded-md p-3">
                  <FileText className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate flex-1">{doc.nome}</span>
                  {doc.url && <a href={doc.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground"><ExternalLink className="size-4" /></a>}
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeDoc(i)}><Trash2 className="size-4" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-3 justify-end sticky bottom-4">
        <Button type="button" variant="outline" onClick={() => navigate({ to: "/dashboard" })}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar Road Book"}</Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
