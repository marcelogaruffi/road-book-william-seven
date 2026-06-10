import { createFileRoute, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Phone, Hotel, Theater, CalendarDays } from "lucide-react";

type ProgItem = { data: string; hora: string; atividade: string; local: string; observacao: string };

type Row = {
  espetaculo: string; cidade: string; estado: string | null; festival: string | null;
  data_inicial: string | null; data_final: string | null;
  hotel_nome: string | null; hotel_endereco: string | null;
  teatro_nome: string | null; teatro_endereco: string | null;
  producao_nome: string | null; producao_telefone: string | null;
  receptivo_nome: string | null; receptivo_telefone: string | null;
  programacao: ProgItem[] | null;
};

export const Route = createFileRoute("/rb/$slug")({
  ssr: false,
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("roadbooks")
      .select("espetaculo,cidade,estado,festival,data_inicial,data_final,hotel_nome,hotel_endereco,teatro_nome,teatro_endereco,producao_nome,producao_telefone,receptivo_nome,receptivo_telefone,programacao")
      .eq("slug", params.slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return data as Row;
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.espetaculo} — ${loaderData.cidade}` : "Road Book";
    return { meta: [
      { title }, { name: "description", content: `Road Book ${title}` },
      { property: "og:title", content: title },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
    ] };
  },
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-8 text-center">
      <div><h1 className="text-2xl font-semibold">Road Book não encontrado</h1></div>
    </div>
  ),
  errorComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-8 text-center">
      <p className="text-muted-foreground">Erro ao carregar.</p>
    </div>
  ),
  component: PublicPage,
});

function fmtDate(d: string | null) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function PublicPage() {
  const r = Route.useLoaderData();
  const prog = (r.programacao ?? []).slice().sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));

  // Group by date
  const groups = prog.reduce<Record<string, ProgItem[]>>((acc, p) => {
    const k = p.data || "—";
    (acc[k] ||= []).push(p);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-3xl mx-auto px-5 py-8">
          {r.festival && <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">{r.festival}</p>}
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">{r.espetaculo}</h1>
          <p className="mt-2 text-muted-foreground flex items-center gap-1.5"><MapPin className="size-4" />{r.cidade}{r.estado ? `/${r.estado}` : ""}</p>
          {(r.data_inicial || r.data_final) && (
            <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              {fmtDate(r.data_inicial)}{r.data_final && r.data_final !== r.data_inicial ? ` — ${fmtDate(r.data_final)}` : ""}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-8 space-y-8">
        {prog.length > 0 && (
          <Section title="Programação">
            <div className="space-y-5">
              {Object.entries(groups).map(([date, items]) => (
                <div key={date}>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">{fmtDate(date)}</h3>
                  <div className="rounded-lg border divide-y">
                    {items.map((p, i) => (
                      <div key={i} className="p-3 flex gap-3">
                        <div className="text-sm font-mono tabular-nums shrink-0 w-14 text-primary">{p.hora || "—"}</div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">{p.atividade || "—"}</div>
                          {p.local && <div className="text-sm text-muted-foreground">{p.local}</div>}
                          {p.observacao && <div className="text-xs text-muted-foreground mt-1">{p.observacao}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          {(r.hotel_nome || r.hotel_endereco) && (
            <InfoCard icon={<Hotel className="size-4" />} title="Hotel" lines={[r.hotel_nome, r.hotel_endereco]} />
          )}
          {(r.teatro_nome || r.teatro_endereco) && (
            <InfoCard icon={<Theater className="size-4" />} title="Teatro" lines={[r.teatro_nome, r.teatro_endereco]} />
          )}
        </div>

        {(r.producao_nome || r.producao_telefone || r.receptivo_nome || r.receptivo_telefone) && (
          <Section title="Contatos">
            <div className="grid sm:grid-cols-2 gap-3">
              {(r.producao_nome || r.producao_telefone) && (
                <ContactCard label="Produção" name={r.producao_nome} phone={r.producao_telefone} />
              )}
              {(r.receptivo_nome || r.receptivo_telefone) && (
                <ContactCard label="Receptivo" name={r.receptivo_nome} phone={r.receptivo_telefone} />
              )}
            </div>
          </Section>
        )}

        <footer className="pt-8 pb-12 text-center text-xs text-muted-foreground">
          Road Book · William Seven
        </footer>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      {children}
    </section>
  );
}

function InfoCard({ icon, title, lines }: { icon: React.ReactNode; title: string; lines: (string | null)[] }) {
  return (
    <div className="rounded-lg border p-4 bg-card">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2">{icon}{title}</div>
      {lines.filter(Boolean).map((l, i) => <p key={i} className={i === 0 ? "font-medium" : "text-sm text-muted-foreground"}>{l}</p>)}
    </div>
  );
}

function ContactCard({ label, name, phone }: { label: string; name: string | null; phone: string | null }) {
  return (
    <div className="rounded-lg border p-4 bg-card">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      {name && <div className="font-medium mt-1">{name}</div>}
      {phone && (
        <a href={`tel:${phone.replace(/\D/g, "")}`} className="mt-1 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          <Phone className="size-3.5" />{phone}
        </a>
      )}
    </div>
  );
}
