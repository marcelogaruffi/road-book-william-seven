import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Roadbook = {
  id: string;
  slug: string;
  espetaculo: string;
  cidade: string;
  estado: string | null;
  festival: string | null;
  data_inicial: string | null;
  data_final: string | null;
};

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Road Book William Seven" }] }),
  component: Dashboard,
});

function Dashboard() {
  const [items, setItems] = useState<Roadbook[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("roadbooks")
      .select("id,slug,espetaculo,cidade,estado,festival,data_inicial,data_final")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setItems((data as Roadbook[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function onDelete(id: string) {
    if (!confirm("Excluir este Road Book?")) return;
    const { error } = await supabase.from("roadbooks").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Excluído");
      load();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Road Books</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie e publique road books.</p>
        </div>
        <Button asChild>
          <Link to="/roadbook/new"><Plus className="size-4 mr-2" />Novo Road Book</Link>
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : items.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-muted-foreground">Nenhum road book cadastrado.</p>
          <Button asChild className="mt-4">
            <Link to="/roadbook/new"><Plus className="size-4 mr-2" />Criar o primeiro</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3">
          {items.map((r) => (
            <Card key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div className="min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h3 className="font-semibold text-lg truncate">{r.espetaculo}</h3>
                  <span className="text-sm text-muted-foreground">
                    {r.cidade}{r.estado ? `/${r.estado}` : ""}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {r.festival ? `${r.festival} · ` : ""}
                  {r.data_inicial ?? ""}{r.data_final ? ` → ${r.data_final}` : ""}
                  {" · "}/rb/{r.slug}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" asChild>
                  <a href={`/rb/${r.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /></a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/roadbook/$id" params={{ id: r.id }}><Pencil className="size-4" /></Link>
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDelete(r.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
