import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ExternalLink, Pencil, Plus } from "lucide-react";

type Tour = { id: string; slug: string; nome: string; espetaculo: string | null; producao: string | null };
type Roadbook = { id: string; slug: string; espetaculo: string; cidade: string; estado: string | null; data_inicial: string | null; data_final: string | null };

export const Route = createFileRoute("/_authenticated/tour/$id")({
  head: () => ({ meta: [{ title: "Turnê" }] }),
  component: EditTour,
});

function EditTour() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [tour, setTour] = useState<Tour | null>(null);
  const [cities, setCities] = useState<Roadbook[]>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    const [{ data: t }, { data: c }] = await Promise.all([
      supabase.from("tours").select("id,slug,nome,espetaculo,producao").eq("id", id).maybeSingle(),
      supabase.from("roadbooks").select("id,slug,espetaculo,cidade,estado,data_inicial,data_final").eq("tour_id", id).order("data_inicial", { ascending: true, nullsFirst: false }),
    ]);
    if (!t) { toast.error("Turnê não encontrada"); return; }
    setTour(t as Tour);
    setCities((c as Roadbook[]) ?? []);
  }
  useEffect(() => { load(); }, [id]);

  async function save() {
    if (!tour) return;
    setBusy(true);
    const { error } = await supabase.from("tours").update({
      nome: tour.nome, espetaculo: tour.espetaculo, producao: tour.producao,
    }).eq("id", tour.id);
    setBusy(false);
    if (error) toast.error(error.message); else toast.success("Salvo");
  }

  if (!tour) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-3xl font-semibold tracking-tight">Turnê</h1>
        <Button variant="outline" asChild><a href={`/turne/${tour.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="size-4 mr-2" />Página pública</a></Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Dados</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Nome</Label><Input value={tour.nome} onChange={(e) => setTour({ ...tour, nome: e.target.value })} /></div>
          <div><Label>Espetáculo</Label><Input value={tour.espetaculo ?? ""} onChange={(e) => setTour({ ...tour, espetaculo: e.target.value })} /></div>
          <div><Label>Produção</Label><Input value={tour.producao ?? ""} onChange={(e) => setTour({ ...tour, producao: e.target.value })} /></div>
          <div className="flex justify-end"><Button onClick={save} disabled={busy}>{busy ? "Salvando..." : "Salvar"}</Button></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Cidades</CardTitle>
          <Button size="sm" onClick={() => navigate({ to: "/roadbook/new" })}><Plus className="size-4 mr-1" />Adicionar cidade</Button>
        </CardHeader>
        <CardContent>
          {cities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma cidade. Crie um novo Road Book e selecione esta turnê no campo "Turnê".</p>
          ) : (
            <div className="divide-y">
              {cities.map((c) => (
                <div key={c.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{c.cidade}{c.estado ? `/${c.estado}` : ""}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.espetaculo} · {c.data_inicial ?? "?"}{c.data_final ? ` → ${c.data_final}` : ""}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" asChild><a href={`/rb/${c.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /></a></Button>
                    <Button variant="ghost" size="icon" asChild><Link to="/roadbook/$id" params={{ id: c.id }}><Pencil className="size-4" /></Link></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
