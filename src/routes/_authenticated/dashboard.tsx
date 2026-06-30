import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { Card } from "@/components/ui/card";
import { Plus, ExternalLink, Pencil, Trash2, Copy, Route as RouteIcon } from "lucide-react";
import { toast } from "sonner";
import { DuplicateRoadbookDialog } from "@/components/DuplicateRoadbookDialog";

type Roadbook = {
  id: string;
  slug: string;
  espetaculo: string;
  cidade: string;
  estado: string | null;
  festival: string | null;
  data_inicial: string | null;
  data_final: string | null;
  tour_id: string | null;
};

type Tour = { id: string; slug: string; nome: string; espetaculo: string | null };

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Road Book William Seven" }] }),
  component: Dashboard,
});

function Dashboard() {
  const [items, setItems] = useState<Roadbook[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [dup, setDup] = useState<Roadbook | null>(null);

  async function load() {
    setLoading(true);
    const [{ data: rb, error: e1 }, { data: tr, error: e2 }] = await Promise.all([
      supabase.from("roadbooks").select("id,slug,espetaculo,cidade,estado,festival,data_inicial,data_final,tour_id").order("data_inicial", { ascending: true }),
      supabase.from("tours").select("id,slug,nome,espetaculo").order("created_at", { ascending: false }),
    ]);
    if (e1) toast.error(e1.message);
    if (e2) toast.error(e2.message);
    setItems((rb as Roadbook[]) ?? []);
    setTours((tr as Tour[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function onDelete(id: string) {
    if (!confirm("Excluir este Road Book?")) return;
    const { error } = await supabase.from("roadbooks").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Excluído"); load(); }
  }

  async function onDeleteTour(id: string) {
    if (!confirm("Excluir esta turnê? Os Road Books vinculados serão mantidos.")) return;
    const { error } = await supabase.from("tours").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Excluída"); load(); }
  }

  return (
    <div className="space-y-10">
      {/* TURNÊS */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Turnês</h2>
            <p className="text-muted-foreground text-sm mt-1">Agrupe road books por cidade.</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/tour/new"><Plus className="size-4 mr-2" />Nova turnê</Link>
          </Button>
        </div>
        {tours.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">Nenhuma turnê.</Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tours.map((t) => {
              const count = items.filter((r) => r.tour_id === t.id).length;
              return (
                <Card key={t.id} className="p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2"><RouteIcon className="size-4 text-muted-foreground shrink-0" /><h3 className="font-semibold truncate">{t.nome}</h3></div>
                      {t.espetaculo && <p className="text-sm text-muted-foreground truncate">{t.espetaculo}</p>}
                      <p className="text-xs text-muted-foreground mt-1">{count} cidade{count === 1 ? "" : "s"} · /turne/{t.slug}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" asChild><a href={`/turne/${t.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /></a></Button>
                      <Button variant="ghost" size="icon" asChild><Link to="/tour/$id" params={{ id: t.id }}><Pencil className="size-4" /></Link></Button>
                      <Button variant="ghost" size="icon" onClick={() => onDeleteTour(t.id)}><Trash2 className="size-4" /></Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ROAD BOOKS */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Road Books</h2>
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
            <Button asChild className="mt-4"><Link to="/roadbook/new"><Plus className="size-4 mr-2" />Criar o primeiro</Link></Button>
          </Card>
        ) : (
          <div className="grid gap-3">
            {items.map((r) => (
              <Card key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <h3 className="font-semibold text-lg truncate">{r.espetaculo}</h3>
                    <span className="text-sm text-muted-foreground">{r.cidade}{r.estado ? `/${r.estado}` : ""}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {r.festival ? `${r.festival} · ` : ""}
                    {r.data_inicial ?? ""}{r.data_final ? ` → ${r.data_final}` : ""}
                    {" · "}/rb/{r.slug}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0 flex-wrap">
                  <Button variant="outline" size="sm" asChild title="Ver"><a href={`/rb/${r.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /></a></Button>
                  <Button variant="outline" size="sm" asChild title="Gerar PDF Oficial"><a href={`/print/${r.slug}`} target="_blank" rel="noreferrer"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-printer"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg></a></Button>
                  <Button variant="outline" size="sm" asChild title="Roteiro Motoristas"><a href={`/print-motorista/${r.slug}`} target="_blank" rel="noreferrer"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-car"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg></a></Button>
                  <Button variant="outline" size="sm" asChild title="Editar"><Link to="/roadbook/$id" params={{ id: r.id }}><Pencil className="size-4" /></Link></Button>
                  <Button variant="outline" size="sm" onClick={() => setDup(r)} title="Duplicar"><Copy className="size-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" title="Excluir"><Trash2 className="size-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Road Book</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o road book <strong>{r.espetaculo}</strong>? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(r.id)} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {dup && (
        <DuplicateRoadbookDialog
          open={!!dup}
          onOpenChange={(v) => !v && setDup(null)}
          sourceId={dup.id}
          defaultEspetaculo={dup.espetaculo}
          defaultCidade={dup.cidade}
          onDone={load}
        />
      )}
    </div>
  );
}
