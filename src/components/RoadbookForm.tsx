import { useEffect, useMemo, useState } from "react";
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
import { Trash2, Plus, Upload, FileText, ExternalLink, Plane, Clock } from "lucide-react";
import { makeRoadbookSlug } from "@/lib/slug";
import {
  type RoadbookData, type ProgItem, type Quarto, type OutroContato, type Documento,
  type Foto, type Voo, type Passageiro, type CartaoEmbarque,
  PROG_TIPOS, TEATRO_FOTO_CATEGORIAS, HOTEL_FOTO_CATEGORIAS, roadbookToPayload,
  getDaySummary,
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

  // ============ PROGRAMACAO grouped by day ============
  const dayGroups = useMemo(() => {
    // group programacao by data
    const map = new Map<string, { item: ProgItem, globalIndex: number }[]>();
    d.programacao.forEach((p, i) => {
      const k = p.data || "";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push({ item: p, globalIndex: i });
    });
    // sort: empty last
    const keys = Array.from(map.keys()).sort((a, b) => {
      if (!a) return 1; if (!b) return -1; return a.localeCompare(b);
    });
    return keys.map((k) => ({ data: k, itens: map.get(k)! }));
  }, [d.programacao]);

  function getNextDayDate() {
    const dates = d.programacao.map((p) => p.data).filter(Boolean).sort();
    if (dates.length > 0) {
      try {
        const last = new Date(dates[dates.length - 1] + "T00:00:00");
        last.setDate(last.getDate() + 1);
        const y = last.getFullYear();
        const m = String(last.getMonth() + 1).padStart(2, "0");
        const day = String(last.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      } catch {}
    }
    return d.data_inicial || new Date().toISOString().split("T")[0];
  }

  function sortProgramacao() {
    setD(s => ({
      ...s,
      programacao: [...s.programacao].sort((a, b) => {
        const da = a.data || "9999-99-99";
        const db = b.data || "9999-99-99";
        if (da !== db) return da.localeCompare(db);
        const ha = a.hora_inicio || "99:99";
        const hb = b.hora_inicio || "99:99";
        return ha.localeCompare(hb);
      })
    }));
    toast.success("Horários ordenados!");
  }

  function addDay() {
    const nextDate = getNextDayDate();
    setD((s) => ({
      ...s,
      programacao: [...s.programacao, { data: nextDate, hora_inicio: "", titulo: "", tipo: "Outro", local: "", observacao: "" }],
    }));
  }
  function addEvent(dataKey: string) {
    setD((s) => ({ ...s, programacao: [...s.programacao, { data: dataKey, hora_inicio: "", titulo: "", tipo: "Outro", local: "", observacao: "" }] }));
  }
  function updateDayDate(oldData: string, newData: string) {
    setD((s) => ({
      ...s, programacao: s.programacao.map((p) => p.data === oldData ? { ...p, data: newData } : p),
    }));
  }
  function removeDay(dataKey: string) {
    setD((s) => ({ ...s, programacao: s.programacao.filter((p) => p.data !== dataKey) }));
  }
  function updateProgItem(index: number, patch: Partial<ProgItem>) {
    setD((s) => ({ ...s, programacao: s.programacao.map((p, i) => i === index ? { ...p, ...patch } : p) }));
  }
  function removeProgItem(index: number) {
    setD((s) => ({ ...s, programacao: s.programacao.filter((_, i) => i !== index) }));
  }

  // QUARTOS
  function addQuarto() { setD((s) => ({ ...s, quartos: [...s.quartos, { pessoa: "", numero: "" }] })); }
  function updateQuarto(i: number, patch: Partial<Quarto>) {
    setD((s) => ({ ...s, quartos: s.quartos.map((q, idx) => idx === i ? { ...q, ...patch } : q) }));
  }
  function removeQuarto(i: number) { setD((s) => ({ ...s, quartos: s.quartos.filter((_, idx) => idx !== i) })); }

  // OUTROS CONTATOS
  function addContato() { setD((s) => ({ ...s, outros_contatos: [...s.outros_contatos, { nome: "", funcao: "", whatsapp: "", telefone: "" }] })); }
  function updateContato(i: number, patch: Partial<OutroContato>) {
    setD((s) => ({ ...s, outros_contatos: s.outros_contatos.map((c, idx) => idx === i ? { ...c, ...patch } : c) }));
  }
  function removeContato(i: number) { setD((s) => ({ ...s, outros_contatos: s.outros_contatos.filter((_, idx) => idx !== i) })); }

  // FOTOS (teatro + hotel + festival)
  async function uploadFotos(files: FileList | null, kind: "teatro" | "hotel" | "festival") {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) throw new Error("Sessão expirada");
      const rbId = d.id ?? "draft";
      const novos: Foto[] = [];
      
      let existingCount = 0;
      if (kind === "teatro") existingCount = d.teatro_fotos.length;
      else if (kind === "hotel") existingCount = d.hotel_fotos.length;
      else if (kind === "festival") existingCount = d.festival_info?.fotos?.length ?? 0;

      let idx = existingCount + 1;
      for (const f of Array.from(files)) {
        if (!f.type.startsWith("image/")) continue;
        const ext = f.name.split('.').pop() || 'jpg';
        const sequentialName = `foto-${idx}.${ext}`;
        const path = `${uid}/${rbId}/${kind}/${Date.now()}-${sequentialName}`;
        const { error } = await supabase.storage.from("roadbook-docs").upload(path, f, { upsert: false, contentType: f.type });
        if (error) throw error;
        const { data: signed } = await supabase.storage.from("roadbook-docs").createSignedUrl(path, 315360000); // 10 years
        novos.push({ path, nome: sequentialName, categoria: "Outros", descricao: "", url: signed?.signedUrl });
        idx++;
      }

      if (kind === "festival") {
        const currentFotos = d.festival_info?.fotos ?? [];
        setD((s) => ({
          ...s,
          festival_info: {
            ...s.festival_info,
            fotos: [...currentFotos, ...novos]
          }
        }));
      } else {
        const key = kind === "teatro" ? "teatro_fotos" : "hotel_fotos";
        setD((s) => ({ ...s, [key]: [...s[key], ...novos] }));
      }
      toast.success(`${novos.length} foto(s) enviada(s)`);
    } catch (err: any) {
      toast.error(err.message ?? "Erro no upload");
    } finally {
      setUploading(false);
    }
  }

  function updateFoto(kind: "teatro" | "hotel" | "festival", i: number, patch: Partial<Foto>) {
    if (kind === "festival") {
      const fotos = d.festival_info?.fotos ?? [];
      const updated = fotos.map((f, idx) => idx === i ? { ...f, ...patch } : f);
      setD((s) => ({
        ...s,
        festival_info: { ...s.festival_info, fotos: updated }
      }));
    } else {
      const key = kind === "teatro" ? "teatro_fotos" : "hotel_fotos";
      setD((s) => ({ ...s, [key]: s[key].map((f, idx) => idx === i ? { ...f, ...patch } : f) }));
    }
  }

  async function removeFoto(kind: "teatro" | "hotel" | "festival", i: number) {
    let foto: Foto | undefined;
    if (kind === "festival") {
      foto = d.festival_info?.fotos?.[i];
    } else {
      const key = kind === "teatro" ? "teatro_fotos" : "hotel_fotos";
      foto = d[key][i];
    }
    if (!foto) return;
    try { if (foto.path) await supabase.storage.from("roadbook-docs").remove([foto.path]); } catch {}
    
    if (kind === "festival") {
      const fotos = d.festival_info?.fotos ?? [];
      setD((s) => ({
        ...s,
        festival_info: {
          ...s.festival_info,
          fotos: fotos.filter((_, idx) => idx !== i)
        }
      }));
    } else {
      const key = kind === "teatro" ? "teatro_fotos" : "hotel_fotos";
      setD((s) => ({ ...s, [key]: s[key].filter((_, idx) => idx !== i) }));
    }
  }

  // VOOS
  function updateVoo(side: "voo_ida" | "voo_volta", patch: Partial<Voo>) {
    setD((s) => ({ ...s, [side]: { ...s[side], ...patch } }));
  }
  function addPassageiro(side: "voo_ida" | "voo_volta") {
    setD((s) => ({ ...s, [side]: { ...s[side], passageiros: [...(s[side].passageiros ?? []), { nome: "", assento: "", bagagens: "" }] } }));
  }
  function updatePassageiro(side: "voo_ida" | "voo_volta", i: number, patch: Partial<Passageiro>) {
    setD((s) => ({
      ...s,
      [side]: { ...s[side], passageiros: (s[side].passageiros ?? []).map((p, idx) => idx === i ? { ...p, ...patch } : p) },
    }));
  }
  function removePassageiro(side: "voo_ida" | "voo_volta", i: number) {
    setD((s) => ({
      ...s,
      [side]: { ...s[side], passageiros: (s[side].passageiros ?? []).filter((_, idx) => idx !== i) },
    }));
  }
  async function uploadOutrasFotos(side: "voo_ida" | "voo_volta", files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) throw new Error("Sessão expirada");
      const rbId = d.id ?? "draft";
      const novos: Foto[] = [];
      let idx = (d[side].outras_informacoes_fotos ?? []).length + 1;
      for (const f of Array.from(files)) {
        const ext = f.name.split('.').pop() || '';
        const sequentialName = `outras-fotos-${idx}${ext ? '.' + ext : ''}`;
        const path = `${uid}/${rbId}/voos/${side}/outras/${Date.now()}-${sequentialName}`;
        const { error } = await supabase.storage.from("roadbook-docs").upload(path, f, { upsert: false, contentType: f.type });
        if (error) throw error;
        const { data: signed } = await supabase.storage.from("roadbook-docs").createSignedUrl(path, 315360000); // 10 years
        novos.push({ path, nome: sequentialName, categoria: "Outras", url: signed?.signedUrl });
        idx++;
      }
      setD((s) => ({ ...s, [side]: { ...s[side], outras_informacoes_fotos: [...(s[side].outras_informacoes_fotos ?? []), ...novos] } }));
      toast.success(`${novos.length} foto(s) enviada(s)`);
    } catch (err: any) {
      toast.error(err.message ?? "Erro no upload");
    } finally {
      setUploading(false);
    }
  }
  async function removeOutrasFotos(side: "voo_ida" | "voo_volta", i: number) {
    const doc = d[side].outras_informacoes_fotos?.[i];
    if (!doc) return;
    setD((s) => {
      const newFotos = [...(s[side].outras_informacoes_fotos ?? [])];
      newFotos.splice(i, 1);
      return { ...s, [side]: { ...s[side], outras_informacoes_fotos: newFotos } };
    });
    await supabase.storage.from("roadbook-docs").remove([doc.path]);
  }
  async function uploadBoardingPasses(side: "voo_ida" | "voo_volta", files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) throw new Error("Sessão expirada");
      const rbId = d.id ?? "draft";
      const novos: CartaoEmbarque[] = [];
      let idx = (d[side].cartoes_embarque ?? []).length + 1;
      for (const f of Array.from(files)) {
        const ext = f.name.split('.').pop() || '';
        const sequentialName = `cartao-${idx}${ext ? '.' + ext : ''}`;
        const path = `${uid}/${rbId}/boarding/${side}/${Date.now()}-${sequentialName}`;
        const { error } = await supabase.storage.from("roadbook-docs").upload(path, f, { upsert: false, contentType: f.type });
        if (error) throw error;
        const { data: signed } = await supabase.storage.from("roadbook-docs").createSignedUrl(path, 315360000); // 10 years
        novos.push({ path, nome: sequentialName, tipo: f.type || "application/octet-stream", url: signed?.signedUrl });
        idx++;
      }
      setD((s) => ({ ...s, [side]: { ...s[side], cartoes_embarque: [...(s[side].cartoes_embarque ?? []), ...novos] } }));
      toast.success(`${novos.length} cartão(ões) enviado(s)`);
    } catch (err: any) {
      toast.error(err.message ?? "Erro no upload");
    } finally {
      setUploading(false);
    }
  }
  async function removeBoardingPass(side: "voo_ida" | "voo_volta", i: number) {
    const cart = d[side].cartoes_embarque?.[i];
    if (cart) { try { await supabase.storage.from("roadbook-docs").remove([cart.path]); } catch {} }
    setD((s) => ({
      ...s,
      [side]: { ...s[side], cartoes_embarque: (s[side].cartoes_embarque ?? []).filter((_, idx) => idx !== i) },
    }));
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
      let idx = d.documentos.length + 1;
      for (const f of Array.from(files)) {
        const ext = f.name.split('.').pop() || '';
        const sequentialName = `documento-${idx}${ext ? '.' + ext : ''}`;
        const path = `${uid}/${rbId}/${Date.now()}-${sequentialName}`;
        const { error } = await supabase.storage.from("roadbook-docs").upload(path, f, { upsert: false, contentType: f.type });
        if (error) throw error;
        const { data: signed } = await supabase.storage.from("roadbook-docs").createSignedUrl(path, 315360000); // 10 years
        novos.push({ nome: sequentialName, path, tipo: f.type || "application/octet-stream", url: signed?.signedUrl });
        idx++;
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
    try { if (doc.path) await supabase.storage.from("roadbook-docs").remove([doc.path]); } catch {}
    setD((s) => ({ ...s, documentos: s.documentos.filter((_, idx) => idx !== i) }));
  }

  function updateDoc(i: number, patch: Partial<Documento>) {
    setD((s) => ({ ...s, documentos: s.documentos.map((dc, idx) => idx === i ? { ...dc, ...patch } : dc) }));
  }

  // OUTROS LOCAIS
  function addOutroLocal() {
    const list = d.automacoes?.outros_locais ?? [];
    up("automacoes", {
      ...d.automacoes,
      outros_locais: [...list, { nome: "", endereco: "", telefone: "", site: "", observacoes: "", fotos: [] }]
    });
  }
  function updateOutroLocal(i: number, patch: Partial<OutroLocal>) {
    const list = d.automacoes?.outros_locais ?? [];
    const updated = list.map((item, idx) => idx === i ? { ...item, ...patch } : item);
    up("automacoes", {
      ...d.automacoes,
      outros_locais: updated
    });
  }
  function removeOutroLocal(i: number) {
    const list = d.automacoes?.outros_locais ?? [];
    const updated = list.filter((_, idx) => idx !== i);
    up("automacoes", {
      ...d.automacoes,
      outros_locais: updated
    });
  }

  async function uploadFotosForOutroLocal(localIndex: number, files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) throw new Error("Sessão expirada");
      const rbId = d.id ?? "draft";
      const novos: Foto[] = [];
      
      const list = d.automacoes?.outros_locais ?? [];
      const local = list[localIndex];
      const existingCount = local?.fotos?.length ?? 0;

      let idx = existingCount + 1;
      for (const f of Array.from(files)) {
        if (!f.type.startsWith("image/")) continue;
        const ext = f.name.split('.').pop() || 'jpg';
        const sequentialName = `foto-${idx}.${ext}`;
        const path = `${uid}/${rbId}/outro_local_${localIndex}/${Date.now()}-${sequentialName}`;
        const { error } = await supabase.storage.from("roadbook-docs").upload(path, f, { upsert: false, contentType: f.type });
        if (error) throw error;
        const { data: signed } = await supabase.storage.from("roadbook-docs").createSignedUrl(path, 315360000); // 10 years
        novos.push({ path, nome: sequentialName, categoria: "Outros", descricao: "", url: signed?.signedUrl });
        idx++;
      }

      const updatedLocais = list.map((item, idx) => {
        if (idx === localIndex) {
          return {
            ...item,
            fotos: [...(item.fotos ?? []), ...novos]
          };
        }
        return item;
      });

      up("automacoes", {
        ...d.automacoes,
        outros_locais: updatedLocais
      });
      toast.success(`${novos.length} foto(s) enviada(s)`);
    } catch (err: any) {
      toast.error(err.message ?? "Erro no upload");
    } finally {
      setUploading(false);
    }
  }

  function updateFotoForOutroLocal(localIndex: number, photoIndex: number, patch: Partial<Foto>) {
    const list = d.automacoes?.outros_locais ?? [];
    const updatedLocais = list.map((item, idx) => {
      if (idx === localIndex) {
        const updatedFotos = (item.fotos ?? []).map((f, pIdx) => pIdx === photoIndex ? { ...f, ...patch } : f);
        return {
          ...item,
          fotos: updatedFotos
        };
      }
      return item;
    });
    up("automacoes", {
      ...d.automacoes,
      outros_locais: updatedLocais
    });
  }

  async function removeFotoForOutroLocal(localIndex: number, photoIndex: number) {
    const list = d.automacoes?.outros_locais ?? [];
    const local = list[localIndex];
    const foto = local?.fotos?.[photoIndex];
    if (!foto) return;
    try { if (foto.path) await supabase.storage.from("roadbook-docs").remove([foto.path]); } catch {}

    const updatedLocais = list.map((item, idx) => {
      if (idx === localIndex) {
        return {
          ...item,
          fotos: (item.fotos ?? []).filter((_, pIdx) => pIdx !== photoIndex)
        };
      }
      return item;
    });
    up("automacoes", {
      ...d.automacoes,
      outros_locais: updatedLocais
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!d.espetaculo.trim() || !d.cidade.trim()) {
      toast.error("Espetáculo e Cidade são obrigatórios");
      return;
    }
    setSaving(true);
    console.log("=== INICIO DO FLUXO DE GRAVAÇÃO ===");
    try {
      const { data: userRes, error: authError } = await supabase.auth.getUser();
      console.log("1. Autenticação:", { user: userRes?.user?.id, error: authError });
      const userId = userRes.user?.id;
      if (!userId) throw new Error("Sessão expirada");

      const baseSlug = makeRoadbookSlug(d.espetaculo, d.cidade);
      const payload = roadbookToPayload(d, userId);
      console.log("2. Payload Gerado:", JSON.stringify(payload, null, 2));

      if (d.id) {
        console.log(`3. Executando UPDATE no roadbook ID: ${d.id}`);
        const { data, error, status } = await supabase.from("roadbooks").update(payload).eq("id", d.id).select();
        console.log("4. Resposta Supabase UPDATE:", { status, data, error });
        if (error) throw error;
        toast.success("Salvo!");
      } else {
        console.log("3. Executando INSERT de novo roadbook");
        let inserted: { id: string; slug: string } | null = null;
        for (let attempt = 0; attempt < 5; attempt++) {
          const trySlug = attempt === 0 ? baseSlug : `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
          console.log(`  Tentativa ${attempt + 1} de INSERT com slug: ${trySlug}`);
          const { data: row, error, status } = await supabase
            .from("roadbooks")
            .insert({ ...payload, slug: trySlug })
            .select("id,slug")
            .single();
          
          console.log(`  Resposta INSERT Tentativa ${attempt + 1}:`, { status, row, error });
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
          <TabsTrigger value="outros_locais">Outros Locais</TabsTrigger>
          <TabsTrigger value="contatos">Contatos</TabsTrigger>
          <TabsTrigger value="programacao">Programação</TabsTrigger>
          <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
          <TabsTrigger value="voos">Voos</TabsTrigger>
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
              <Field label="Telefone"><Input value={d.hotel_telefone} onChange={(e) => up("hotel_telefone", e.target.value)} onBlur={(e) => up("hotel_telefone", formatPhone(e.target.value))} /></Field>
              <div className="sm:col-span-2"><Field label="Endereço"><Input value={d.hotel_endereco} onChange={(e) => up("hotel_endereco", e.target.value)} /></Field></div>
              <Field label="Site"><Input value={d.hotel_site} onChange={(e) => up("hotel_site", e.target.value)} placeholder="https://" /></Field>
              <div />
              <Field label="Data Check-in"><Input type="date" value={d.hotel_checkin} onChange={(e) => up("hotel_checkin", e.target.value)} /></Field>
              <Field label="Horário Check-in"><Input type="time" value={d.hotel_checkin_hora} onChange={(e) => up("hotel_checkin_hora", e.target.value)} /></Field>
              <Field label="Data Check-out"><Input type="date" value={d.hotel_checkout} onChange={(e) => up("hotel_checkout", e.target.value)} /></Field>
              <Field label="Horário Check-out"><Input type="time" value={d.hotel_checkout_hora} onChange={(e) => up("hotel_checkout_hora", e.target.value)} /></Field>
              
              <div className="sm:col-span-2 border-t pt-4 mt-2 mb-2"><h4 className="font-semibold text-sm">Informações Adicionais (Wi-Fi e Café)</h4></div>
              <div className="sm:col-span-2"><Field label="Wi-Fi (Rede e Senha)"><Input value={d.hotel_wifi || ""} onChange={(e) => up("hotel_wifi", e.target.value)} placeholder="Ex: Rede: HOTEL_GUEST | Senha: 123" /></Field></div>
              <Field label="Café da Manhã - Início"><Input type="time" value={d.hotel_cafe_inicio || ""} onChange={(e) => up("hotel_cafe_inicio", e.target.value)} /></Field>
              <Field label="Café da Manhã - Fim"><Input type="time" value={d.hotel_cafe_fim || ""} onChange={(e) => up("hotel_cafe_fim", e.target.value)} /></Field>
              <div className="sm:col-span-2"><Field label="Observações do Hotel"><Textarea value={d.hotel_observacoes || ""} onChange={(e) => up("hotel_observacoes", e.target.value)} placeholder="Informações extras sobre o hotel, café, etc..." className="h-20" /></Field></div>
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
            categorias={HOTEL_FOTO_CATEGORIAS as unknown as readonly string[]}
            uploading={uploading}
            fotos={d.hotel_fotos}
            onUpload={(e) => uploadFotos(e.target.files, "hotel").finally(() => { e.target.value = ""; })}
            onUpdate={(i, p) => updateFoto("hotel", i, p)}
            onRemove={(i) => removeFoto("hotel", i)}
          />
        </TabsContent>

        <TabsContent value="teatro" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle>Local Principal (Teatro)</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <Field label="Nome"><Input value={d.teatro_nome} onChange={(e) => up("teatro_nome", e.target.value)} /></Field>
              <Field label="Telefone"><Input value={d.teatro_telefone} onChange={(e) => up("teatro_telefone", e.target.value)} onBlur={(e) => up("teatro_telefone", formatPhone(e.target.value))} /></Field>
              <div className="sm:col-span-2"><Field label="Endereço"><Input value={d.teatro_endereco} onChange={(e) => up("teatro_endereco", e.target.value)} /></Field></div>
              <Field label="Site"><Input value={d.teatro_site} onChange={(e) => up("teatro_site", e.target.value)} placeholder="https://" /></Field>
              <div />
              <div className="sm:col-span-2"><Field label="Observações"><Textarea rows={3} value={d.teatro_observacoes} onChange={(e) => up("teatro_observacoes", e.target.value)} /></Field></div>
            </CardContent>
          </Card>
          <FotosCard
            title="Fotos do teatro"
            categorias={TEATRO_FOTO_CATEGORIAS as unknown as readonly string[]}
            uploading={uploading}
            fotos={d.teatro_fotos}
            onUpload={(e) => uploadFotos(e.target.files, "teatro").finally(() => { e.target.value = ""; })}
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
              <Field label="Produção — E-mail"><Input type="email" value={d.producao_telefone} onChange={(e) => up("producao_telefone", e.target.value)} /></Field>
              <Field label="Receptivo — Telefone"><Input value={d.receptivo_telefone} onChange={(e) => up("receptivo_telefone", e.target.value)} onBlur={(e) => up("receptivo_telefone", formatPhone(e.target.value))} /></Field>
              <Field label="Produção — WhatsApp"><Input value={d.producao_whatsapp} onChange={(e) => up("producao_whatsapp", e.target.value)} onBlur={(e) => up("producao_whatsapp", formatPhone(e.target.value))} placeholder="55 11 99999-9999" /></Field>
              <Field label="Receptivo — WhatsApp"><Input value={d.receptivo_whatsapp} onChange={(e) => up("receptivo_whatsapp", e.target.value)} onBlur={(e) => up("receptivo_whatsapp", formatPhone(e.target.value))} placeholder="55 11 99999-9999" /></Field>
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
                  <div className="sm:col-span-3"><Label className="text-xs">Nome</Label><Input value={c.nome} onChange={(e) => updateContato(i, { nome: e.target.value })} /></div>
                  <div className="sm:col-span-3"><Label className="text-xs">Função</Label><Input value={c.funcao} onChange={(e) => updateContato(i, { funcao: e.target.value })} /></div>
                  <div className="sm:col-span-2"><Label className="text-xs">Telefone</Label><Input value={c.telefone ?? ""} onChange={(e) => updateContato(i, { telefone: e.target.value })} onBlur={(e) => updateContato(i, { telefone: formatPhone(e.target.value) })} /></div>
                  <div className="sm:col-span-3"><Label className="text-xs">WhatsApp</Label><Input value={c.whatsapp} onChange={(e) => updateContato(i, { whatsapp: e.target.value })} onBlur={(e) => updateContato(i, { whatsapp: formatPhone(e.target.value) })} placeholder="55 11 99999-9999" /></div>
                  <div className="sm:col-span-1 flex sm:justify-end"><Button type="button" variant="ghost" size="icon" onClick={() => removeContato(i)}><Trash2 className="size-4" /></Button></div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="programacao" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Programação por dia</CardTitle>
                            <Button type="button" size="sm" onClick={addDay}><Plus className="size-4 mr-1" />Adicionar dia</Button>
              <Button type="button" size="sm" variant="outline" onClick={sortProgramacao}><Clock className="size-4 mr-1" />Ordenar Horários</Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {dayGroups.length === 0 && <p className="text-sm text-muted-foreground">Nenhum dia. Clique em "Adicionar dia" para começar.</p>}
              {dayGroups.map((g) => (
                <div key={g.data || "__empty__"} className="border rounded-lg p-4 space-y-3 bg-card">
                  <div className="flex items-end justify-between gap-3 flex-wrap">
                    <div>
                      <Label className="text-xs">Data do dia</Label>
                      <Input
                        type="date"
                        value={g.data}
                        onChange={(e) => updateDayDate(g.data, e.target.value)}
                        className="w-48"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => addEvent(g.data)}><Plus className="size-4 mr-1" />Adicionar atividade</Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => { if (confirm("Remover este dia e suas atividades?")) removeDay(g.data); }}><Trash2 className="size-4" /></Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {g.itens.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma atividade. Adicione a primeira.</p>}
                    {g.itens.map(({ item: p, globalIndex }) => (
                      <div key={globalIndex} className="grid sm:grid-cols-12 gap-2 items-start border rounded-md p-3 bg-background">
                        <div className="sm:col-span-2"><Label className="text-xs">Início</Label><Input type="time" value={p.hora_inicio || p.hora || ""} onChange={(e) => updateProgItem(globalIndex, { hora_inicio: e.target.value })} /></div>
                        <div className="sm:col-span-2"><Label className="text-xs">Fim</Label><Input type="time" value={p.hora_fim ?? ""} onChange={(e) => updateProgItem(globalIndex, { hora_fim: e.target.value })} /></div>
                        <div className="sm:col-span-4"><Label className="text-xs">Título</Label><Input value={p.titulo || p.atividade || ""} onChange={(e) => updateProgItem(globalIndex, { titulo: e.target.value, atividade: undefined })} /></div>
                        <div className="sm:col-span-3"><Label className="text-xs">Tipo</Label>
                          <Select value={p.tipo ?? "Outro"} onValueChange={(v) => updateProgItem(globalIndex, { tipo: v as any })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {PROG_TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="sm:col-span-1 flex sm:justify-end"><Button type="button" variant="ghost" size="icon" onClick={() => removeProgItem(globalIndex)}><Trash2 className="size-4" /></Button></div>
                        <div className="sm:col-span-6"><Label className="text-xs">Local</Label><Input value={p.local} onChange={(e) => updateProgItem(globalIndex, { local: e.target.value })} /></div>
                        <div className="sm:col-span-6"><Label className="text-xs">Observação</Label><Textarea rows={1} value={p.observacao} onChange={(e) => updateProgItem(globalIndex, { observacao: e.target.value })} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Personalizar Linha do Tempo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Por padrão, o título de cada dia na linha do tempo é gerado automaticamente com base nas atividades (ex: Viagem, Espetáculo). 
                Aqui você pode visualizar o título gerado e, se necessário, definir um nome personalizado para substituir o automático.
              </p>
              {dayGroups.filter(g => g.data).length === 0 && (
                <p className="text-sm text-muted-foreground">Adicione dias com atividades na aba Programação primeiro.</p>
              )}
              {dayGroups.filter(g => g.data).map((g) => {
                const autoSummary = getDaySummary(g.itens.map(x => x.item));
                const override = d.automacoes?.timeline_overrides?.[g.data] ?? "";
                return (
                  <div key={g.data} className="grid sm:grid-cols-12 gap-3 items-center border rounded-md p-4 bg-background">
                    <div className="sm:col-span-3">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data</Label>
                      <div className="font-mono text-sm mt-1">{g.data ? g.data.split("-").reverse().join("/") : "—"}</div>
                    </div>
                    <div className="sm:col-span-3">
                      <Label className="text-xs text-muted-foreground">Título Automático</Label>
                      <div className="text-sm font-medium text-muted-foreground mt-1 italic">{autoSummary}</div>
                    </div>
                    <div className="sm:col-span-6">
                      <Label className="text-xs font-semibold">Título Personalizado (Sobrescrever)</Label>
                      <Input
                        value={override}
                        onChange={(e) => {
                          const overrides = { ...(d.automacoes?.timeline_overrides ?? {}) };
                          if (e.target.value.trim()) {
                            overrides[g.data] = e.target.value;
                          } else {
                            delete overrides[g.data];
                          }
                          up("automacoes", { ...d.automacoes, timeline_overrides: overrides });
                        }}
                        placeholder="Ex: Chegada / Montagem, Folga..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outros_locais" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Outros Locais (Oficinas, Palestras, etc.)</CardTitle>
              <Button type="button" size="sm" variant="outline" onClick={addOutroLocal}>
                <Plus className="size-4 mr-1" />Adicionar local
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Adicione outros locais relevantes da turnê (ex: salas de oficina, locais de debate, etc.). 
                Eles serão listados na página pública e plotados no Mapa Operacional.
              </p>
              {(!d.automacoes?.outros_locais || d.automacoes.outros_locais.length === 0) && (
                <p className="text-sm text-muted-foreground italic">Nenhum local cadastrado.</p>
              )}
              {(d.automacoes?.outros_locais ?? []).map((loc, i) => (
                <div key={i} className="border rounded-md p-4 bg-background space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="text-sm font-semibold text-primary">Local #{i + 1}: {loc.nome || "Novo Local"}</h4>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeOutroLocal(i)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="size-4 mr-1" /> Remover Local
                    </Button>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Nome do Local *">
                      <Input
                        value={loc.nome}
                        onChange={(e) => updateOutroLocal(i, { nome: e.target.value })}
                        placeholder="Ex: Espaço de Oficinas, Sesc..."
                      />
                    </Field>
                    <Field label="Telefone">
                      <Input
                        value={loc.telefone ?? ""}
                        onChange={(e) => updateOutroLocal(i, { telefone: e.target.value })} onBlur={(e) => updateOutroLocal(i, { telefone: formatPhone(e.target.value) })}
                        placeholder="Ex: (51) 3224-1000"
                      />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Endereço Completo *">
                        <Input
                          value={loc.endereco}
                          onChange={(e) => updateOutroLocal(i, { endereco: e.target.value })}
                          placeholder="Ex: Rua das Flores, 123 - Centro, Porto Alegre - RS"
                        />
                      </Field>
                    </div>
                    <Field label="Site">
                      <Input
                        value={loc.site ?? ""}
                        onChange={(e) => updateOutroLocal(i, { site: e.target.value })}
                        placeholder="https://"
                      />
                    </Field>
                    <div />
                    <div className="sm:col-span-2">
                      <Field label="Observações">
                        <Textarea
                          rows={2}
                          value={loc.observacoes ?? ""}
                          onChange={(e) => updateOutroLocal(i, { observacoes: e.target.value })}
                          placeholder="Ex: Acesso pela rampa lateral, camarim amplo..."
                        />
                      </Field>
                    </div>
                  </div>

                  <div className="pt-2">
                    <FotosCard
                      title={`Fotos de ${loc.nome || "este local"}`}
                      categorias={["Fachada", "Palco", "Plateia", "Camarim", "Acesso de carga", "Bilheteria", "Entrada do público", "Área técnica", "Outros"] as unknown as readonly string[]}
                      customCategory={true}
                      uploading={uploading}
                      fotos={loc.fotos ?? []}
                      onUpload={(e) => {
                        uploadFotosForOutroLocal(i, e.target.files).finally(() => { e.target.value = ""; });
                      }}
                      onUpdate={(photoIndex, patch) => updateFotoForOutroLocal(i, photoIndex, patch)}
                      onRemove={(photoIndex) => removeFotoForOutroLocal(i, photoIndex)}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voos" className="mt-4 space-y-4">
          <VooCard
            title="Voo de ida"
            voo={d.voo_ida}
            uploading={uploading}
            onChange={(p) => updateVoo("voo_ida", p)}
            onAddPax={() => addPassageiro("voo_ida")}
            onUpdatePax={(i, p) => updatePassageiro("voo_ida", i, p)}
            onRemovePax={(i) => removePassageiro("voo_ida", i)}
            onUploadPasses={(e) => uploadBoardingPasses("voo_ida", e.target.files).finally(() => { e.target.value = ""; })}
            onRemovePass={(i) => removeBoardingPass("voo_ida", i)}
            onUploadOutrasFotos={(e) => uploadOutrasFotos("voo_ida", e.target.files).finally(() => { e.target.value = ""; })}
            onRemoveOutrasFotos={(i) => removeOutrasFotos("voo_ida", i)}
          />
          <VooCard
            title="Voo de volta"
            voo={d.voo_volta}
            uploading={uploading}
            onChange={(p) => updateVoo("voo_volta", p)}
            onAddPax={() => addPassageiro("voo_volta")}
            onUpdatePax={(i, p) => updatePassageiro("voo_volta", i, p)}
            onRemovePax={(i) => removePassageiro("voo_volta", i)}
            onUploadPasses={(e) => uploadBoardingPasses("voo_volta", e.target.files).finally(() => { e.target.value = ""; })}
            onRemovePass={(i) => removeBoardingPass("voo_volta", i)}
            onUploadOutrasFotos={(e) => uploadOutrasFotos("voo_volta", e.target.files).finally(() => { e.target.value = ""; })}
            onRemoveOutrasFotos={(i) => removeOutrasFotos("voo_volta", i)}
          />
        </TabsContent>

        <TabsContent value="festival" className="mt-4 space-y-4">
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
          <FotosCard
            title="Fotos do festival / local"
            categorias={["Fachada", "Apresentação", "Divulgação", "Outros"] as unknown as readonly string[]}
            uploading={uploading}
            fotos={d.festival_info.fotos ?? []}
            onUpload={(e) => uploadFotos(e.target.files, "festival").finally(() => { e.target.value = ""; })}
            onUpdate={(i, p) => updateFoto("festival", i, p)}
            onRemove={(i) => removeFoto("festival", i)}
          />
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
            <CardContent className="space-y-4">
              {(() => {
                const fotos = d.documentos.map((doc, i) => ({ doc, i })).filter(x => x.doc.tipo?.startsWith("image/"));
                const pdfs = d.documentos.map((doc, i) => ({ doc, i })).filter(x => !x.doc.tipo?.startsWith("image/"));
                return (
                  <div className="space-y-6">
                    {fotos.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-3 border-b pb-1">Galeria de Fotos</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {fotos.map(({ doc, i }) => (
                            <div key={i} className="relative group rounded-md overflow-hidden border aspect-video shadow-sm">
                              <img src={doc.url} alt={doc.nome} className="w-full h-full object-cover" />
                              <button type="button" onClick={() => removeDoc(i)} className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 text-white rounded p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {pdfs.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-3 border-b pb-1">PDFs e Outros Documentos</h4>
                        <div className="space-y-2">
                          {pdfs.map(({ doc, i }) => (
                            <div key={i} className="flex flex-col gap-2 border rounded-md p-3 bg-slate-50/50">
                              <div className="flex items-center gap-3">
                                <FileText className="size-4 text-muted-foreground shrink-0" />
                                <span className="text-sm truncate flex-1 font-medium">{doc.nome}</span>
                                {doc.url && <a href={doc.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground bg-white border rounded p-1.5 shadow-sm"><ExternalLink className="size-4" /></a>}
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeDoc(i)} className="hover:bg-red-100 hover:text-red-600"><Trash2 className="size-4" /></Button>
                              </div>
                              <Input 
                                placeholder="Descreva este documento (Ex: Ingressos do Show, Voucher)" 
                                value={doc.descricao || ""} 
                                onChange={(e) => updateDoc(i, { descricao: e.target.value })}
                                className="h-8 text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {d.documentos.length === 0 && <p className="text-sm text-muted-foreground italic">Nenhum arquivo adicionado.</p>}
                  </div>
                );
              })()}
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

function FotosCard({
  title, categorias, customCategory, uploading, fotos, onUpload, onUpdate, onRemove,
}: {
  title: string;
  categorias: readonly string[];
  customCategory?: boolean;
  uploading: boolean;
  fotos: Foto[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpdate: (i: number, patch: Partial<Foto>) => void;
  onRemove: (i: number) => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>{title}</CardTitle>
        <label className="inline-flex">
          <input type="file" multiple accept="image/*" className="hidden" onChange={onUpload} disabled={uploading} />
          <span className={"inline-flex items-center gap-2 text-sm border rounded-md px-3 py-1.5 cursor-pointer hover:bg-accent " + (uploading ? "opacity-50" : "")}>
            <Upload className="size-4" />{uploading ? "Enviando..." : "Adicionar fotos"}
          </span>
        </label>
      </CardHeader>
      <CardContent className="space-y-3">
        {fotos.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma foto.</p>}
        {fotos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fotos.map((f, i) => (
              <div key={i} className="border rounded-md p-3 space-y-2">
                {f.url && <img src={f.url} alt={f.nome} className="w-full h-40 object-cover rounded" loading="lazy" />}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs truncate flex-1 text-muted-foreground">{f.nome}</span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(i)}><Trash2 className="size-4" /></Button>
                </div>
                <div>
                  <Label className="text-xs">Categoria</Label>
                  {customCategory ? (
                    <Input
                      value={f.categoria || ""}
                      onChange={(e) => onUpdate(i, { categoria: e.target.value })}
                      placeholder="Ex: Palco, Camarim, Oficinas..."
                    />
                  ) : (
                    <Select value={categorias.includes(f.categoria) ? f.categoria : "Outros"} onValueChange={(v) => onUpdate(i, { categoria: v, descricao: v === "Outros" ? (f.descricao ?? "") : "" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {categorias.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                {!customCategory && f.categoria === "Outros" && (
                  <div>
                    <Label className="text-xs">Descrição</Label>
                    <Input value={f.descricao ?? ""} onChange={(e) => onUpdate(i, { descricao: e.target.value })} placeholder="Ex.: Piscina, Restaurante, Hall..." />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </CardContent>
    </Card>
  );
}

function VooCard({
  title, voo, uploading, onChange, onAddPax, onUpdatePax, onRemovePax, onUploadPasses, onRemovePass, onUploadOutrasFotos, onRemoveOutrasFotos,
}: {
  title: string;
  voo: Voo;
  uploading: boolean;
  onChange: (patch: Partial<Voo>) => void;
  onAddPax: () => void;
  onUpdatePax: (i: number, patch: Partial<Passageiro>) => void;
  onRemovePax: (i: number) => void;
  onUploadPasses: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePass: (i: number) => void;
  onUploadOutrasFotos: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveOutrasFotos: (i: number) => void;
}) {
  const pax = voo.passageiros ?? [];
  const passes = voo.cartoes_embarque ?? [];
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Plane className="size-4" />{title}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Aeroporto de partida"><Input value={voo.aeroporto_origem ?? ""} onChange={(e) => onChange({ aeroporto_origem: e.target.value })} placeholder="Ex.: GRU - Guarulhos" /></Field>
          <Field label="Aeroporto de chegada"><Input value={voo.aeroporto_destino ?? ""} onChange={(e) => onChange({ aeroporto_destino: e.target.value })} placeholder="Ex.: REC - Recife" /></Field>
          <Field label="Número do voo"><Input value={voo.numero ?? ""} onChange={(e) => onChange({ numero: e.target.value })} placeholder="Ex.: LA 3041" /></Field>
          <Field label="Localizador / Reserva"><Input value={voo.localizador ?? ""} onChange={(e) => onChange({ localizador: e.target.value })} placeholder="Ex.: ABC123" /></Field>
          <Field label="Data de partida"><Input type="date" value={voo.data ?? ""} onChange={(e) => onChange({ data: e.target.value })} /></Field>
          <Field label="Hora de partida"><Input type="time" value={voo.hora ?? ""} onChange={(e) => onChange({ hora: e.target.value })} /></Field>
          <Field label="Horário de Chegada"><Input type="time" value={voo.horario_chegada ?? ""} onChange={(e) => onChange({ horario_chegada: e.target.value })} /></Field>
          <Field label="Portão de embarque"><Input value={voo.portao ?? ""} onChange={(e) => onChange({ portao: e.target.value })} /></Field>
          <Field label="Terminal"><Input value={voo.terminal ?? ""} onChange={(e) => onChange({ terminal: e.target.value })} /></Field>
        </div>
        <div className="mt-4">
          <Field label="Outras informações (texto)">
            <Textarea value={voo.outras_informacoes ?? ""} onChange={(e) => onChange({ outras_informacoes: e.target.value })} placeholder="Informações adicionais..." />
          </Field>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Passageiros</Label>
            <Button type="button" size="sm" variant="outline" onClick={onAddPax}><Plus className="size-4 mr-1" />Adicionar passageiro</Button>
          </div>
          {pax.length === 0 && <p className="text-sm text-muted-foreground">Nenhum passageiro.</p>}
          <div className="space-y-2">
            {pax.map((p, i) => (
              <div key={i} className="grid sm:grid-cols-12 gap-2 items-end border rounded-md p-3">
                <div className="sm:col-span-6"><Label className="text-xs">Nome</Label><Input value={p.nome} onChange={(e) => onUpdatePax(i, { nome: e.target.value })} /></div>
                <div className="sm:col-span-2"><Label className="text-xs">Assento</Label><Input value={p.assento ?? ""} onChange={(e) => onUpdatePax(i, { assento: e.target.value })} /></div>
                <div className="sm:col-span-3"><Label className="text-xs">Bagagens despachadas</Label><Input value={p.bagagens ?? ""} onChange={(e) => onUpdatePax(i, { bagagens: e.target.value })} placeholder="Ex.: 1" /></div>
                <div className="sm:col-span-1 flex sm:justify-end"><Button type="button" variant="ghost" size="icon" onClick={() => onRemovePax(i)}><Trash2 className="size-4" /></Button></div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Cartões de embarque (PDF ou imagem)</Label>
            <label className="inline-flex">
              <input type="file" multiple accept="application/pdf,image/*" className="hidden" onChange={onUploadPasses} disabled={uploading} />
              <span className={"inline-flex items-center gap-2 text-sm border rounded-md px-3 py-1.5 cursor-pointer hover:bg-accent " + (uploading ? "opacity-50" : "")}>
                <Upload className="size-4" />{uploading ? "Enviando..." : "Enviar"}
              </span>
            </label>
          </div>
          {passes.length === 0 && <p className="text-sm text-muted-foreground">Nenhum cartão.</p>}
          <div className="space-y-2">
            {passes.map((c, i) => (
              <div key={i} className="flex items-center gap-3 border rounded-md p-3">
                {c.tipo?.startsWith("image/") && c.url ? (
                  <img src={c.url} alt={c.nome} className="w-12 h-12 object-cover rounded" />
                ) : (
                  <FileText className="size-5 text-muted-foreground shrink-0" />
                )}
                <span className="text-sm truncate flex-1">{c.nome}</span>
                {c.url && <a href={c.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground"><ExternalLink className="size-4" /></a>}
                <Button type="button" variant="ghost" size="icon" onClick={() => onRemovePass(i)}><Trash2 className="size-4" /></Button>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 mt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <Label>Outras informações (fotos)</Label>
            <label className="inline-flex">
              <input type="file" multiple accept="image/*" className="hidden" onChange={onUploadOutrasFotos} disabled={uploading} />
              <span className={"inline-flex items-center gap-2 text-sm border rounded-md px-3 py-1.5 cursor-pointer hover:bg-accent " + (uploading ? "opacity-50" : "")}>
                <Upload className="size-4" />{uploading ? "Enviando..." : "Enviar Fotos"}
              </span>
            </label>
          </div>
          {(voo.outras_informacoes_fotos?.length ?? 0) === 0 && <p className="text-sm text-muted-foreground">Nenhuma foto adicionada.</p>}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(voo.outras_informacoes_fotos ?? []).map((f, i) => (
              <div key={i} className="relative group rounded overflow-hidden border aspect-video">
                <img src={f.url} alt={f.nome} className="w-full h-full object-cover" />
                <button type="button" onClick={() => onRemoveOutrasFotos(i)} className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
