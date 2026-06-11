import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { makeTourSlug } from "@/lib/slug";

export const Route = createFileRoute("/_authenticated/tour/new")({
  head: () => ({ meta: [{ title: "Nova Turnê" }] }),
  component: NewTour,
});

function NewTour() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [espetaculo, setEspetaculo] = useState("");
  const [producao, setProducao] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return toast.error("Informe o nome");
    setBusy(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) throw new Error("Sessão expirada");
      const base = makeTourSlug(nome);
      let inserted: any = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        const trySlug = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
        const { data: row, error } = await supabase.from("tours")
          .insert({ user_id: uid, nome, espetaculo: espetaculo || null, producao: producao || null, slug: trySlug })
          .select("id").single();
        if (!error && row) { inserted = row; break; }
        if (error && !`${error.message}`.toLowerCase().includes("duplicate")) throw error;
        if (attempt === 4) throw error;
      }
      toast.success("Turnê criada");
      navigate({ to: "/tour/$id", params: { id: inserted.id } });
    } catch (err: any) {
      toast.error(err.message ?? "Erro");
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-semibold tracking-tight">Nova Turnê</h1>
      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader><CardTitle>Dados da turnê</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Nome *</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} required /></div>
            <div><Label>Espetáculo</Label><Input value={espetaculo} onChange={(e) => setEspetaculo(e.target.value)} /></div>
            <div><Label>Produção</Label><Input value={producao} onChange={(e) => setProducao(e.target.value)} /></div>
          </CardContent>
        </Card>
        <div className="flex gap-3 justify-end mt-6">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/dashboard" })}>Cancelar</Button>
          <Button type="submit" disabled={busy}>{busy ? "Criando..." : "Criar turnê"}</Button>
        </div>
      </form>
    </div>
  );
}
