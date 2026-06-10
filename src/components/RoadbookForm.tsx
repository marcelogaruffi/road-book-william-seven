import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { makeRoadbookSlug } from "@/lib/slug";

export type ProgItem = {
  data: string;
  hora: string;
  atividade: string;
  local: string;
  observacao: string;
};

export type RoadbookData = {
  id?: string;
  slug?: string;
  espetaculo: string;
  cidade: string;
  estado: string;
  festival: string;
  data_inicial: string;
  data_final: string;
  hotel_nome: string;
  hotel_endereco: string;
  teatro_nome: string;
  teatro_endereco: string;
  producao_nome: string;
  producao_telefone: string;
  receptivo_nome: string;
  receptivo_telefone: string;
  programacao: ProgItem[];
};

export const emptyRoadbook: RoadbookData = {
  espetaculo: "", cidade: "", estado: "", festival: "",
  data_inicial: "", data_final: "",
  hotel_nome: "", hotel_endereco: "",
  teatro_nome: "", teatro_endereco: "",
  producao_nome: "", producao_telefone: "",
  receptivo_nome: "", receptivo_telefone: "",
  programacao: [],
};

export function RoadbookForm({ initial }: { initial: RoadbookData }) {
  const navigate = useNavigate();
  const [d, setD] = useState<RoadbookData>(initial);
  const [saving, setSaving] = useState(false);

  function up<K extends keyof RoadbookData>(k: K, v: RoadbookData[K]) {
    setD((s) => ({ ...s, [k]: v }));
  }

  function addProg() {
    setD((s) => ({ ...s, programacao: [...s.programacao, { data: "", hora: "", atividade: "", local: "", observacao: "" }] }));
  }
  function updateProg(i: number, k: keyof ProgItem, v: string) {
    setD((s) => ({ ...s, programacao: s.programacao.map((p, idx) => idx === i ? { ...p, [k]: v } : p) }));
  }
  function removeProg(i: number) {
    setD((s) => ({ ...s, programacao: s.programacao.filter((_, idx) => idx !== i) }));
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
      let slug = d.slug ?? baseSlug;

      const payload = {
        user_id: userId,
        espetaculo: d.espetaculo,
        cidade: d.cidade,
        estado: d.estado || null,
        festival: d.festival || null,
        data_inicial: d.data_inicial || null,
        data_final: d.data_final || null,
        hotel_nome: d.hotel_nome || null,
        hotel_endereco: d.hotel_endereco || null,
        teatro_nome: d.teatro_nome || null,
        teatro_endereco: d.teatro_endereco || null,
        producao_nome: d.producao_nome || null,
        producao_telefone: d.producao_telefone || null,
        receptivo_nome: d.receptivo_nome || null,
        receptivo_telefone: d.receptivo_telefone || null,
        programacao: d.programacao,
      };

      if (d.id) {
        const { error } = await supabase.from("roadbooks").update(payload).eq("id", d.id);
        if (error) throw error;
      } else {
        // Try slug, retry with suffix if conflict
        for (let attempt = 0; attempt < 5; attempt++) {
          const trySlug = attempt === 0 ? baseSlug : `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
          const { error } = await supabase.from("roadbooks").insert({ ...payload, slug: trySlug });
          if (!error) { slug = trySlug; break; }
          if (!error || !`${error.message}`.toLowerCase().includes("duplicate")) {
            if (attempt === 4) throw error;
            if (!`${error.message}`.toLowerCase().includes("duplicate")) throw error;
          }
        }
      }
      toast.success("Salvo! Página pública: /rb/" + slug);
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Espetáculo</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <Field label="Espetáculo *"><Input required value={d.espetaculo} onChange={(e) => up("espetaculo", e.target.value)} /></Field>
          <Field label="Festival"><Input value={d.festival} onChange={(e) => up("festival", e.target.value)} /></Field>
          <Field label="Cidade *"><Input required value={d.cidade} onChange={(e) => up("cidade", e.target.value)} /></Field>
          <Field label="Estado"><Input value={d.estado} onChange={(e) => up("estado", e.target.value)} maxLength={2} /></Field>
          <Field label="Data Inicial"><Input type="date" value={d.data_inicial} onChange={(e) => up("data_inicial", e.target.value)} /></Field>
          <Field label="Data Final"><Input type="date" value={d.data_final} onChange={(e) => up("data_final", e.target.value)} /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Hotel</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <Field label="Nome"><Input value={d.hotel_nome} onChange={(e) => up("hotel_nome", e.target.value)} /></Field>
          <Field label="Endereço"><Input value={d.hotel_endereco} onChange={(e) => up("hotel_endereco", e.target.value)} /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Teatro</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <Field label="Nome"><Input value={d.teatro_nome} onChange={(e) => up("teatro_nome", e.target.value)} /></Field>
          <Field label="Endereço"><Input value={d.teatro_endereco} onChange={(e) => up("teatro_endereco", e.target.value)} /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Contatos</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <Field label="Produção"><Input value={d.producao_nome} onChange={(e) => up("producao_nome", e.target.value)} /></Field>
          <Field label="Telefone produção"><Input value={d.producao_telefone} onChange={(e) => up("producao_telefone", e.target.value)} /></Field>
          <Field label="Receptivo"><Input value={d.receptivo_nome} onChange={(e) => up("receptivo_nome", e.target.value)} /></Field>
          <Field label="Telefone receptivo"><Input value={d.receptivo_telefone} onChange={(e) => up("receptivo_telefone", e.target.value)} /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Programação</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={addProg}><Plus className="size-4 mr-1" />Adicionar</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {d.programacao.length === 0 && <p className="text-sm text-muted-foreground">Nenhum item.</p>}
          {d.programacao.map((p, i) => (
            <div key={i} className="grid sm:grid-cols-12 gap-2 items-start border rounded-md p-3">
              <div className="sm:col-span-2"><Label className="text-xs">Data</Label><Input type="date" value={p.data} onChange={(e) => updateProg(i, "data", e.target.value)} /></div>
              <div className="sm:col-span-2"><Label className="text-xs">Hora</Label><Input type="time" value={p.hora} onChange={(e) => updateProg(i, "hora", e.target.value)} /></div>
              <div className="sm:col-span-3"><Label className="text-xs">Atividade</Label><Input value={p.atividade} onChange={(e) => updateProg(i, "atividade", e.target.value)} /></div>
              <div className="sm:col-span-2"><Label className="text-xs">Local</Label><Input value={p.local} onChange={(e) => updateProg(i, "local", e.target.value)} /></div>
              <div className="sm:col-span-2"><Label className="text-xs">Observação</Label><Textarea rows={1} value={p.observacao} onChange={(e) => updateProg(i, "observacao", e.target.value)} /></div>
              <div className="sm:col-span-1 flex sm:justify-end"><Button type="button" variant="ghost" size="icon" onClick={() => removeProg(i)}><Trash2 className="size-4" /></Button></div>
            </div>
          ))}
        </CardContent>
      </Card>

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
