import { createFileRoute, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  MapPin, Phone, Hotel, Theater, CalendarDays, FileText, Globe,
  MessageCircle, Users, BedDouble, CloudSun, Calendar, Sparkles,
} from "lucide-react";
import {
  rowToRoadbook, progTitle, progHora, TIPO_COLORS,
  type ProgItem, type Documento, type Quarto, type OutroContato,
} from "@/lib/roadbook-types";

export const Route = createFileRoute("/rb/$slug")({
  ssr: false,
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("roadbooks").select("*").eq("slug", params.slug).maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return rowToRoadbook(data);
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

function fmtDate(d: string | null | undefined) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}
function onlyDigits(s: string) { return s.replace(/\D/g, ""); }

function PublicPage() {
  const r = Route.useLoaderData();
  const prog: ProgItem[] = (r.programacao ?? []).slice().sort((a, b) => (a.data + (a.hora_inicio || a.hora || "")).localeCompare(b.data + (b.hora_inicio || b.hora || "")));
  const groups: Record<string, ProgItem[]> = prog.reduce((acc: Record<string, ProgItem[]>, p) => {
    const k = p.data || "—"; (acc[k] ||= []).push(p); return acc;
  }, {});
  const dias = Object.keys(groups);

  const fi = r.festival_info ?? {};
  const hasFestivalInfo = !!(r.festival || fi.site || fi.instagram || fi.redes || fi.programacao_oficial || fi.observacoes);

  return (
    <div className="min-h-screen bg-background">
      {/* CAPA */}
      <header className="border-b bg-gradient-to-b from-card to-background">
        <div className="max-w-3xl mx-auto px-5 py-10">
          {r.festival && <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">{r.festival}</p>}
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight">{r.espetaculo}</h1>
          <p className="mt-3 text-muted-foreground flex items-center gap-1.5"><MapPin className="size-4" />{r.cidade}{r.estado ? `/${r.estado}` : ""}</p>
          {(r.data_inicial || r.data_final) && (
            <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              {fmtDate(r.data_inicial)}{r.data_final && r.data_final !== r.data_inicial ? ` — ${fmtDate(r.data_final)}` : ""}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-8 space-y-10">
        {/* RESUMO */}
        {r.resumo_executivo && (
          <Section title="Resumo executivo" icon={<Sparkles className="size-4" />}>
            <p className="whitespace-pre-line text-sm leading-relaxed">{r.resumo_executivo}</p>
          </Section>
        )}

        {/* CLIMA (placeholder) */}
        <Section title="Clima" icon={<CloudSun className="size-4" />}>
          <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
            Previsão automática em breve.
          </div>
        </Section>

        {/* CRONOGRAMA */}
        {dias.length > 0 && (
          <Section title="Cronograma" icon={<Calendar className="size-4" />}>
            <div className="rounded-lg border bg-card divide-y">
              {dias.map((d) => (
                <div key={d} className="p-3 flex items-center justify-between gap-3">
                  <span className="font-medium text-sm">{fmtDate(d)}</span>
                  <span className="text-xs text-muted-foreground">{groups[d].length} item{groups[d].length === 1 ? "" : "s"}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* PROGRAMAÇÃO DIÁRIA */}
        {prog.length > 0 && (
          <Section title="Programação diária">
            <div className="space-y-5">
              {dias.map((date) => (
                <div key={date}>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">{fmtDate(date)}</h3>
                  <div className="rounded-lg border divide-y bg-card">
                    {groups[date].map((p, i) => (
                      <div key={i} className="p-3 flex gap-3">
                        <div className="text-xs font-mono tabular-nums shrink-0 w-20 text-primary pt-0.5">{progHora(p)}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2 flex-wrap">
                            <span className="font-medium">{progTitle(p)}</span>
                            {p.tipo && (
                              <span className={`text-[10px] uppercase tracking-wider border rounded px-1.5 py-0.5 ${TIPO_COLORS[p.tipo] ?? TIPO_COLORS["Outro"]}`}>{p.tipo}</span>
                            )}
                          </div>
                          {p.local && <div className="text-sm text-muted-foreground mt-0.5">{p.local}</div>}
                          {p.observacao && <div className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{p.observacao}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* HOSPEDAGEM */}
        {(r.hotel_nome || r.hotel_endereco || r.hotel_telefone || r.hotel_site || r.hotel_checkin || r.hotel_checkout || r.quartos.length > 0) && (
          <Section title="Hospedagem" icon={<Hotel className="size-4" />}>
            <div className="rounded-lg border p-4 bg-card space-y-2">
              {r.hotel_nome && <p className="font-semibold">{r.hotel_nome}</p>}
              {r.hotel_endereco && <p className="text-sm text-muted-foreground">{r.hotel_endereco}</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {r.hotel_telefone && <a href={`tel:${onlyDigits(r.hotel_telefone)}`} className="text-primary inline-flex items-center gap-1"><Phone className="size-3.5" />{r.hotel_telefone}</a>}
                {r.hotel_site && <a href={r.hotel_site} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1"><Globe className="size-3.5" />Site</a>}
              </div>
              {(r.hotel_checkin || r.hotel_checkout) && (
                <p className="text-sm text-muted-foreground">
                  {r.hotel_checkin && <>Check-in: <span className="text-foreground">{fmtDate(r.hotel_checkin)}</span></>}
                  {r.hotel_checkin && r.hotel_checkout && " · "}
                  {r.hotel_checkout && <>Check-out: <span className="text-foreground">{fmtDate(r.hotel_checkout)}</span></>}
                </p>
              )}
            </div>
            {r.quartos.length > 0 && (
              <div className="mt-3 rounded-lg border bg-card divide-y">
                <div className="px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><BedDouble className="size-3.5" />Quartos</div>
                {r.quartos.map((q: Quarto, i) => (
                  <div key={i} className="px-4 py-2 flex items-center justify-between text-sm">
                    <span>{q.pessoa || "—"}</span>
                    <span className="font-mono text-muted-foreground">{q.numero}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* LOCAL PRINCIPAL */}
        {(r.teatro_nome || r.teatro_endereco || r.teatro_telefone || r.teatro_site || r.teatro_observacoes) && (
          <Section title="Local Principal" icon={<Theater className="size-4" />}>
            <div className="rounded-lg border p-4 bg-card space-y-2">
              {r.teatro_nome && <p className="font-semibold">{r.teatro_nome}</p>}
              {r.teatro_endereco && <p className="text-sm text-muted-foreground">{r.teatro_endereco}</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {r.teatro_telefone && <a href={`tel:${onlyDigits(r.teatro_telefone)}`} className="text-primary inline-flex items-center gap-1"><Phone className="size-3.5" />{r.teatro_telefone}</a>}
                {r.teatro_site && <a href={r.teatro_site} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1"><Globe className="size-3.5" />Site</a>}
              </div>
              {r.teatro_observacoes && <p className="text-sm text-muted-foreground whitespace-pre-line">{r.teatro_observacoes}</p>}
            </div>
          </Section>
        )}

        {/* CONTATOS */}
        {(r.producao_nome || r.producao_telefone || r.producao_whatsapp || r.receptivo_nome || r.receptivo_telefone || r.receptivo_whatsapp || r.outros_contatos.length > 0) && (
          <Section title="Contatos" icon={<Users className="size-4" />}>
            <div className="grid sm:grid-cols-2 gap-3">
              {(r.producao_nome || r.producao_telefone || r.producao_whatsapp) && (
                <ContactCard label="Produção" name={r.producao_nome} phone={r.producao_telefone} whatsapp={r.producao_whatsapp} />
              )}
              {(r.receptivo_nome || r.receptivo_telefone || r.receptivo_whatsapp) && (
                <ContactCard label="Receptivo" name={r.receptivo_nome} phone={r.receptivo_telefone} whatsapp={r.receptivo_whatsapp} />
              )}
              {r.outros_contatos.map((c: OutroContato, i) => (
                <ContactCard key={i} label={c.funcao || "Contato"} name={c.nome} phone={c.telefone} whatsapp={c.whatsapp} />
              ))}
            </div>
          </Section>
        )}

        {/* FESTIVAL */}
        {hasFestivalInfo && (
          <Section title="Festival e Comunicação">
            <div className="rounded-lg border p-4 bg-card space-y-2 text-sm">
              {r.festival && <p className="font-semibold">{r.festival}</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {fi.site && <a href={fi.site} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1"><Globe className="size-3.5" />Site oficial</a>}
                {fi.instagram && <a href={`https://instagram.com/${fi.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="text-primary">{fi.instagram}</a>}
              </div>
              {fi.redes && <p className="text-muted-foreground">{fi.redes}</p>}
              {fi.programacao_oficial && <p className="text-muted-foreground whitespace-pre-line"><span className="text-foreground font-medium">Programação oficial: </span>{fi.programacao_oficial}</p>}
              {fi.observacoes && <p className="text-muted-foreground whitespace-pre-line">{fi.observacoes}</p>}
            </div>
          </Section>
        )}

        {/* DOCUMENTOS */}
        {r.documentos.length > 0 && (
          <Section title="Documentos" icon={<FileText className="size-4" />}>
            <div className="rounded-lg border bg-card divide-y">
              {r.documentos.map((doc: Documento, i) => (
                <a key={i} href={doc.url ?? "#"} target="_blank" rel="noreferrer" className="p-3 flex items-center gap-3 hover:bg-accent transition-colors">
                  <FileText className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate flex-1">{doc.nome}</span>
                  <span className="text-xs text-muted-foreground">{doc.tipo?.split("/")[1] ?? ""}</span>
                </a>
              ))}
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

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">{icon}{title}</h2>
      {children}
    </section>
  );
}

function ContactCard({ label, name, phone, whatsapp }: { label: string; name: string | null; phone: string | null; whatsapp?: string | null }) {
  return (
    <div className="rounded-lg border p-4 bg-card">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      {name && <div className="font-medium mt-1">{name}</div>}
      <div className="mt-2 flex flex-col gap-1 text-sm">
        {phone && (
          <a href={`tel:${onlyDigits(phone)}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
            <Phone className="size-3.5" />{phone}
          </a>
        )}
        {whatsapp && (
          <a href={`https://wa.me/${onlyDigits(whatsapp)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline">
            <MessageCircle className="size-3.5" />{whatsapp}
          </a>
        )}
      </div>
    </div>
  );
}
