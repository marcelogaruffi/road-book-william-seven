import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { makeRoadbookSlug } from "@/lib/slug";

export function DuplicateRoadbookDialog({
  open, onOpenChange, sourceId, defaultEspetaculo, defaultCidade, onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sourceId: string;
  defaultEspetaculo: string;
  defaultCidade: string;
  onDone?: () => void;
}) {
  const navigate = useNavigate();
  const [espetaculo, setEspetaculo] = useState(`${defaultEspetaculo} (cópia)`);
  const [cidade, setCidade] = useState(defaultCidade);
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [busy, setBusy] = useState(false);

  async function onConfirm() {
    if (!espetaculo.trim() || !cidade.trim()) {
      toast.error("Informe espetáculo e cidade");
      return;
    }
    setBusy(true);
    try {
      const { data: src, error: e1 } = await supabase.from("roadbooks").select("*").eq("id", sourceId).maybeSingle();
      if (e1 || !src) throw e1 ?? new Error("Original não encontrado");
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) throw new Error("Sessão expirada");

      const { id, slug, created_at, updated_at, ...rest } = src as any;
      const base = makeRoadbookSlug(espetaculo, cidade);

      let inserted: any = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        const trySlug = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
        const { data: row, error } = await supabase
          .from("roadbooks")
          .insert({
            ...rest,
            user_id: uid,
            espetaculo, cidade,
            data_inicial: dataInicial || null,
            data_final: dataFinal || null,
            slug: trySlug,
          })
          .select("id")
          .single();
        if (!error && row) { inserted = row; break; }
        if (error && !`${error.message}`.toLowerCase().includes("duplicate")) throw error;
        if (attempt === 4) throw error;
      }
      toast.success("Road Book duplicado");
      onOpenChange(false);
      onDone?.();
      navigate({ to: "/roadbook/$id", params: { id: inserted.id } });
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao duplicar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplicar Road Book</DialogTitle>
          <DialogDescription>Uma cópia completa será criada com novos dados básicos.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label>Novo espetáculo *</Label><Input value={espetaculo} onChange={(e) => setEspetaculo(e.target.value)} /></div>
          <div><Label>Nova cidade *</Label><Input value={cidade} onChange={(e) => setCidade(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Data inicial</Label><Input type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} /></div>
            <div><Label>Data final</Label><Input type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button>
          <Button onClick={onConfirm} disabled={busy}>{busy ? "Duplicando..." : "Duplicar e editar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
