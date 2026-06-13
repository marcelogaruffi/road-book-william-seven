import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { signRoadbookFiles } from "@/lib/storage.functions";
import {
  MapPin, Phone, Hotel, Theater, CalendarDays, FileText, Globe,
  MessageCircle, Users, BedDouble, CloudSun, Calendar, Sparkles, Camera, X,
} from "lucide-react";
import {
  rowToRoadbook, progTitle, progHora, TIPO_COLORS, FOTO_CATEGORIAS,
  type ProgItem, type Documento, type Quarto, type OutroContato, type Foto,
} from "@/lib/roadbook-types";

export const Route = createFileRoute("/rb/$slug")({
  ssr: false,
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("roadbooks").select("*").eq("slug", params.slug).maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    const rb = rowToRoadbook(data);

    // Signed URLs for private bucket files (fotos + documentos)
    const paths = [
      ...rb.teatro_fotos.map((f) => f.path),
      ...rb.documentos.map((d) => d.path),
    ].filter(Boolean);
    if (paths.length > 0) {
      try {
        const { urls } = await signRoadbookFiles({ data: { paths } });
        rb.teatro_fotos = rb.teatro_fotos.map((f) => ({ ...f, url: urls[f.path] ?? f.url }));
        rb.documentos = rb.documentos.map((d) => ({ ...d, url: urls[d.path] ?? d.url }));
      } catch { /* ignore — falls back to stored urls */ }
    }
    return rb;
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
  const r = Route.useLoaderData() as ReturnType<typeof rowToRoadbook>;
  const prog: ProgItem[] = (r.programacao ?? []).slice().sort((a, b) => (a.data + (a.hora_inicio || a.hora || "")).localeCompare(b.data + (b.hora_inicio || b.hora || "")));
  const groups: Record<string, ProgItem[]> = prog.reduce((acc: Record<string, ProgItem[]>, p) => {
    const k = p.data || "—"; (acc[k] ||= []).push(p); return acc;
  }, {});
  const dias = Object.keys(groups);

  const fi = r.festival_info ?? {};
  const hasFestivalInfo = !!(r.festival || fi.site || fi.instagram || fi.redes || fi.programacao_oficial || fi.observacoes);

  // Lightbox
  const [lightbox, setLightbox] = useState<Foto | null>(null);
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightbox(null); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [lightbox]);

  // Agrupar fotos por categoria (ou "Outros - descrição")
  const fotosGrupos: { key: string; label: string; fotos: Foto[] }[] = [];
  const fotoMap = new Map<string, Foto[]>();
  for (const f of r.teatro_fotos ?? []) {
    const key = f.categoria === "Outros"
      ? `Outros - ${(f.descricao || "Sem descrição").trim()}`
      : f.categoria;
    if (!fotoMap.has(key)) fotoMap.set(key, []);
    fotoMap.get(key)!.push(f);
  }
  // ordem: categorias fixas primeiro, depois "Outros - *"
  for (const c of FOTO_CATEGORIAS) {
    if (c === "Outros") continue;
    if (fotoMap.has(c)) fotosGrupos.push({ key: c, label: c, fotos: fotoMap.get(c)! });
  }
  for (const [k, fs] of fotoMap) {
    if (k.startsWith("Outros - ")) fotosGrupos.push({ key: k, label: k.toUpperCase(), fotos: fs });
  }

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

        {/* FOTOS DO TEATRO */}
        {fotosGrupos.length > 0 && (
          <Section title="Fotos do teatro" icon={<Camera className="size-4" />}>
            <div className="space-y-6">
              {fotosGrupos.map((g) => (
                <div key={g.key}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{g.label}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {g.fotos.map((f, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setLightbox(f)}
                        className="group relative aspect-square overflow-hidden rounded-lg border bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {f.url ? (
                          <img
                            src={f.url}
                            alt={`${g.label} — ${f.nome}`}
                            loading="lazy"
                            decoding="async"
                            className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">Sem preview</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* CONTATOS */}
        {(r.producao_nome || r.producao_whatsapp || r.receptivo_nome || r.receptivo_whatsapp || r.outros_contatos.length > 0) && (
          <Section title="Contatos" icon={<Users className="size-4" />}>
            <div className="grid sm:grid-cols-2 gap-3">
              {(r.producao_nome || r.producao_whatsapp) && (
                <ContactCard label="Produção" name={r.producao_nome} whatsapp={r.producao_whatsapp} />
              )}
              {(r.receptivo_nome || r.receptivo_whatsapp) && (
                <ContactCard label="Receptivo" name={r.receptivo_nome} whatsapp={r.receptivo_whatsapp} />
              )}
              {r.outros_contatos.map((c: OutroContato, i) => (
                <ContactCard key={i} label={c.funcao || "Contato"} name={c.nome} whatsapp={c.whatsapp} />
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

      {/* LIGHTBOX */}
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
            aria-label="Fechar"
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10"
          >
            <X className="size-5" />
          </button>
          {lightbox.url && (
            <img
              src={lightbox.url}
              alt={lightbox.nome}
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-full object-contain rounded shadow-2xl"
            />
          )}
        </div>
      )}
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

function ContactCard({ label, name, whatsapp }: { label: string; name: string | null; whatsapp?: string | null }) {
  const wa = whatsapp ? onlyDigits(whatsapp) : "";
  return (
    <div className="rounded-lg border p-4 bg-card">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      {name && <div className="font-medium mt-1">{name}</div>}
      {wa && (
        <a
          href={`https://wa.me/${wa}`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center justify-center gap-2 rounded-md bg-[#25D366] hover:bg-[#1faa54] text-white text-sm font-medium px-3 py-2 w-full transition-colors"
        >
          <MessageCircle className="size-4" />
          Conversar no WhatsApp
        </a>
      )}
    </div>
  );
}
