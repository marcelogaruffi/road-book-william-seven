import { createFileRoute, notFound } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { signRoadbookFiles } from "@/lib/storage.functions";
import {
  MapPin, Phone, Hotel, Theater, CalendarDays, FileText, Globe,
  MessageCircle, Users, BedDouble, CloudSun, Calendar, Sparkles, Camera, X,
  Navigation, Droplets, Plane, Clock,
} from "lucide-react";
import {
  rowToRoadbook, progTitle, progHora, TIPO_COLORS, TEATRO_FOTO_CATEGORIAS, HOTEL_FOTO_CATEGORIAS,
  normalizeExternalUrl, mapsUrl,
  type ProgItem, type Documento, type Quarto, type OutroContato, type Foto, type Voo,
} from "@/lib/roadbook-types";

type GeoPlace = { latitude: number; longitude: number; name: string; admin1?: string };
type GeoState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; place: GeoPlace };
const GeoContext = createContext<GeoState>({ status: "loading" });



export const Route = createFileRoute("/rb/$slug")({
  ssr: false,
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("roadbooks").select("*").eq("slug", params.slug).maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    const rb = rowToRoadbook(data);

    const idaPasses = rb.voo_ida.cartoes_embarque ?? [];
    const voltaPasses = rb.voo_volta.cartoes_embarque ?? [];
    const paths = [
      ...rb.teatro_fotos.map((f) => f.path),
      ...rb.hotel_fotos.map((f) => f.path),
      ...rb.documentos.map((d) => d.path),
      ...idaPasses.map((c) => c.path),
      ...voltaPasses.map((c) => c.path),
    ].filter(Boolean);
    if (paths.length > 0) {
      try {
        const { urls } = await signRoadbookFiles({ data: { paths } });
        rb.teatro_fotos = rb.teatro_fotos.map((f) => ({ ...f, url: urls[f.path] ?? f.url }));
        rb.hotel_fotos = rb.hotel_fotos.map((f) => ({ ...f, url: urls[f.path] ?? f.url }));
        rb.documentos = rb.documentos.map((d) => ({ ...d, url: urls[d.path] ?? d.url }));
        rb.voo_ida.cartoes_embarque = idaPasses.map((c) => ({ ...c, url: urls[c.path] ?? c.url }));
        rb.voo_volta.cartoes_embarque = voltaPasses.map((c) => ({ ...c, url: urls[c.path] ?? c.url }));
      } catch { /* fallback to stored urls */ }
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
  const fiSite = normalizeExternalUrl(fi.site);
  const fiInstagram = (fi.instagram ?? "").trim();
  const fiInstagramUrl = fiInstagram
    ? (/^https?:\/\//i.test(fiInstagram) ? fiInstagram : `https://instagram.com/${fiInstagram.replace(/^@/, "")}`)
    : "";
  const hotelSite = normalizeExternalUrl(r.hotel_site);
  const teatroSite = normalizeExternalUrl(r.teatro_site);
  const hasFestivalInfo = !!(r.festival || fiSite || fiInstagram || fi.redes || fi.programacao_oficial || fi.observacoes);

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

  const geo = useGeocode(r.cidade, r.estado);

  return (
    <GeoContext.Provider value={geo}>
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

        {/* PROGRAMAÇÃO DIÁRIA com clima por dia */}
        {prog.length > 0 && (
          <Section title="Programação diária" icon={<Calendar className="size-4" />}>
            <div className="space-y-6">
              {dias.map((date) => (
                <div key={date}>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">{fmtDate(date)}</h3>
                  <DayWeather date={date} />
                  <div className="rounded-lg border divide-y bg-card mt-2">
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
        {(r.hotel_nome || r.hotel_endereco || r.hotel_telefone || hotelSite || r.hotel_checkin || r.hotel_checkout || r.quartos.length > 0 || r.hotel_fotos.length > 0) && (
          <Section title="Hospedagem" icon={<Hotel className="size-4" />}>
            <div className="rounded-lg border p-4 bg-card space-y-3">
              {r.hotel_nome && <p className="font-semibold">{r.hotel_nome}</p>}
              {r.hotel_endereco && <p className="text-sm text-muted-foreground">{r.hotel_endereco}</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {r.hotel_telefone && <a href={`tel:${onlyDigits(r.hotel_telefone)}`} className="text-primary inline-flex items-center gap-1"><Phone className="size-3.5" />{r.hotel_telefone}</a>}
                {hotelSite && <a href={hotelSite} target="_blank" rel="noopener noreferrer" className="text-primary inline-flex items-center gap-1"><Globe className="size-3.5" />Site</a>}
              </div>
              {(r.hotel_checkin || r.hotel_checkout || r.hotel_checkin_hora || r.hotel_checkout_hora) && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {(r.hotel_checkin || r.hotel_checkin_hora) && (
                    <div className="rounded-md border bg-background px-3 py-2">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Check-in</div>
                      {r.hotel_checkin && <div className="font-medium">{fmtDate(r.hotel_checkin)}</div>}
                      {r.hotel_checkin_hora && <div className="flex items-center gap-1 text-muted-foreground text-xs"><Clock className="size-3" />{r.hotel_checkin_hora}</div>}
                    </div>
                  )}
                  {(r.hotel_checkout || r.hotel_checkout_hora) && (
                    <div className="rounded-md border bg-background px-3 py-2">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Check-out</div>
                      {r.hotel_checkout && <div className="font-medium">{fmtDate(r.hotel_checkout)}</div>}
                      {r.hotel_checkout_hora && <div className="flex items-center gap-1 text-muted-foreground text-xs"><Clock className="size-3" />{r.hotel_checkout_hora}</div>}
                    </div>
                  )}
                </div>
              )}
              {(r.hotel_endereco || r.hotel_nome) && (
                <a
                  href={mapsUrl([r.hotel_nome, r.hotel_endereco, r.cidade, r.estado].filter(Boolean).join(", "))}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-md border bg-background hover:bg-accent text-sm font-medium px-3 py-2 w-full transition-colors"
                >
                  <Navigation className="size-4" />📍 Abrir Hotel no Google Maps
                </a>
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
            <PhotoGallery fotos={r.hotel_fotos} label="Fotos do hotel" categorias={HOTEL_FOTO_CATEGORIAS} onOpen={setLightbox} />
          </Section>
        )}

        {/* LOCAL PRINCIPAL */}
        {(r.teatro_nome || r.teatro_endereco || r.teatro_telefone || teatroSite || r.teatro_observacoes || r.teatro_fotos.length > 0) && (
          <Section title="Local Principal" icon={<Theater className="size-4" />}>
            <div className="rounded-lg border p-4 bg-card space-y-3">
              {r.teatro_nome && <p className="font-semibold">{r.teatro_nome}</p>}
              {r.teatro_endereco && <p className="text-sm text-muted-foreground">{r.teatro_endereco}</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {r.teatro_telefone && <a href={`tel:${onlyDigits(r.teatro_telefone)}`} className="text-primary inline-flex items-center gap-1"><Phone className="size-3.5" />{r.teatro_telefone}</a>}
                {teatroSite && <a href={teatroSite} target="_blank" rel="noopener noreferrer" className="text-primary inline-flex items-center gap-1"><Globe className="size-3.5" />Site</a>}
              </div>
              {r.teatro_observacoes && <p className="text-sm text-muted-foreground whitespace-pre-line">{r.teatro_observacoes}</p>}
              {(r.teatro_endereco || r.teatro_nome) && (
                <a
                  href={mapsUrl([r.teatro_nome, r.teatro_endereco, r.cidade, r.estado].filter(Boolean).join(", "))}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-md border bg-background hover:bg-accent text-sm font-medium px-3 py-2 w-full transition-colors"
                >
                  <Navigation className="size-4" />📍 Abrir Teatro no Google Maps
                </a>
              )}
            </div>
            <PhotoGallery fotos={r.teatro_fotos} label="Fotos do teatro" categorias={TEATRO_FOTO_CATEGORIAS} onOpen={setLightbox} />
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
                {fiSite && <a href={fiSite} target="_blank" rel="noopener noreferrer" className="text-primary inline-flex items-center gap-1"><Globe className="size-3.5" />Site oficial</a>}
                {fiInstagramUrl && <a href={fiInstagramUrl} target="_blank" rel="noopener noreferrer" className="text-primary">{fiInstagram.startsWith("@") || !/^https?:/i.test(fiInstagram) ? (fiInstagram.startsWith("@") ? fiInstagram : "@" + fiInstagram.replace(/^@/, "")) : "Instagram"}</a>}
              </div>
              {fi.redes && <RedesLinks text={fi.redes} />}
              {fi.programacao_oficial && <ProgramacaoOficial text={fi.programacao_oficial} />}
              {fi.observacoes && <p className="text-muted-foreground whitespace-pre-line">{fi.observacoes}</p>}
            </div>
          </Section>
        )}

        {/* DOCUMENTOS */}
        {r.documentos.length > 0 && (
          <Section title="Documentos" icon={<FileText className="size-4" />}>
            <div className="rounded-lg border bg-card divide-y">
              {r.documentos.map((doc: Documento, i) => (
                <a key={i} href={doc.url ?? "#"} target="_blank" rel="noopener noreferrer" className="p-3 flex items-center gap-3 hover:bg-accent transition-colors">
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
    </GeoContext.Provider>
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
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center justify-center gap-2 rounded-md bg-[#25D366] hover:bg-[#1faa54] text-white text-sm font-medium px-3 py-2 w-full transition-colors"
        >
          <MessageCircle className="size-4" />
          Conversar no WhatsApp
        </a>
      )}
    </div>
  );
}

function PhotoGallery({ fotos, label, categorias, onOpen }: { fotos: Foto[]; label: string; categorias: readonly string[]; onOpen: (f: Foto) => void }) {
  if (!fotos || fotos.length === 0) return null;
  const fotoMap = new Map<string, Foto[]>();
  for (const f of fotos) {
    const isOutros = !categorias.includes(f.categoria) || f.categoria === "Outros";
    const key = isOutros
      ? `Outros - ${(f.descricao || "Sem descrição").trim()}`
      : f.categoria;
    if (!fotoMap.has(key)) fotoMap.set(key, []);
    fotoMap.get(key)!.push(f);
  }
  const grupos: { key: string; label: string; fotos: Foto[] }[] = [];
  for (const c of categorias) {
    if (c === "Outros") continue;
    if (fotoMap.has(c)) grupos.push({ key: c, label: c, fotos: fotoMap.get(c)! });
  }
  for (const [k, fs] of fotoMap) {
    if (k.startsWith("Outros - ")) grupos.push({ key: k, label: k.toUpperCase(), fotos: fs });
  }
  return (
    <div className="mt-3 space-y-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Camera className="size-3.5" />{label}</div>
      {grupos.map((g) => (
        <div key={g.key}>
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{g.label}</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {g.fotos.map((f, i) => (
              <button
                key={i} type="button" onClick={() => onOpen(f)}
                className="group relative aspect-square overflow-hidden rounded-lg border bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {f.url ? (
                  <img src={f.url} alt={`${g.label} — ${f.nome}`} loading="lazy" decoding="async"
                    className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">Sem preview</div>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProgramacaoOficial({ text }: { text: string }) {
  const trimmed = text.trim();
  if (/^https?:\/\//i.test(trimmed) && !/\s/.test(trimmed)) {
    return (
      <p className="text-muted-foreground">
        <span className="text-foreground font-medium">Programação oficial: </span>
        <a href={trimmed} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">{trimmed}</a>
      </p>
    );
  }
  return (
    <p className="text-muted-foreground whitespace-pre-line">
      <span className="text-foreground font-medium">Programação oficial: </span>{text}
    </p>
  );
}

function RedesLinks({ text }: { text: string }) {
  // Detect URLs and @handles, render the rest as text
  const parts = text.split(/(\s+)/);
  return (
    <p className="text-muted-foreground">
      {parts.map((p, i) => {
        if (/^https?:\/\//i.test(p)) {
          return <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">{p}</a>;
        }
        if (/^@[\w._]+$/.test(p)) {
          return <a key={i} href={`https://instagram.com/${p.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="text-primary">{p}</a>;
        }
        return <span key={i}>{p}</span>;
      })}
    </p>
  );
}

// ============ Weather (Open-Meteo, free, no key) ============
// Per-day weather:
//  - forecast (±16 days from today) → Open-Meteo forecast API
//  - dates outside that window → historical climate average (last 5 years on
//    same month/day) from Open-Meteo archive API
//
// One geocode per page (shared via context); each day fetches its own data.

function useGeocode(cidade: string, _estado: string): GeoState {
  const [state, setState] = useState<GeoState>({ status: "loading" });
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        if (!cidade?.trim()) { setState({ status: "error", message: "Cidade não cadastrada" }); return; }
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cidade.trim())}&count=5&language=pt&format=json`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("geo http " + res.status);
        const j = await res.json();
        const results: any[] = Array.isArray(j?.results) ? j.results : [];
        if (results.length === 0) throw new Error("Cidade não encontrada");
        const p = results.find((r) => r.country_code === "BR") || results[0];
        if (cancel) return;
        setState({ status: "ok", place: { latitude: p.latitude, longitude: p.longitude, name: p.name, admin1: p.admin1 } });
      } catch (e: any) {
        if (!cancel) setState({ status: "error", message: e?.message || "Geocodificação falhou" });
      }
    })();
    return () => { cancel = true; };
  }, [cidade]);
  return state;
}

type DayData =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; kind: "forecast" | "historical"; maxC: number; minC: number; rainPct: number };

function daysBetween(a: Date, b: Date) {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / 86400000);
}

function DayWeather({ date }: { date: string }) {
  const geo = useContext(GeoContext);
  const [data, setData] = useState<DayData>({ status: "loading" });

  const target = useMemo(() => {
    const [y, m, d] = (date || "").split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(Date.UTC(y, m - 1, d));
  }, [date]);

  useEffect(() => {
    if (geo.status === "loading") { setData({ status: "loading" }); return; }
    if (geo.status === "error") { setData({ status: "error", message: geo.message }); return; }
    if (!target) { setData({ status: "error", message: "Data inválida" }); return; }
    let cancel = false;
    (async () => {
      const { latitude, longitude } = geo.place;
      const today = new Date();
      const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      const diff = daysBetween(todayUTC, target);
      try {
        if (diff >= -1 && diff <= 15) {
          // Forecast
          const iso = date;
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
            `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
            `&timezone=auto&start_date=${iso}&end_date=${iso}`;
          const res = await fetch(url);
          if (!res.ok) throw new Error("forecast http " + res.status);
          const j = await res.json();
          if (cancel) return;
          setData({
            status: "ok", kind: "forecast",
            maxC: Math.round(j?.daily?.temperature_2m_max?.[0] ?? NaN),
            minC: Math.round(j?.daily?.temperature_2m_min?.[0] ?? NaN),
            rainPct: Math.round(j?.daily?.precipitation_probability_max?.[0] ?? 0),
          });
        } else {
          // Historical average: last 5 years, same month/day
          const m = String(target.getUTCMonth() + 1).padStart(2, "0");
          const d = String(target.getUTCDate()).padStart(2, "0");
          const baseYear = todayUTC.getUTCFullYear() - 1;
          const years = [0, 1, 2, 3, 4].map((i) => baseYear - i);
          const results = await Promise.all(years.map(async (yr) => {
            const iso = `${yr}-${m}-${d}`;
            const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}` +
              `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum` +
              `&timezone=auto&start_date=${iso}&end_date=${iso}`;
            const r = await fetch(url);
            if (!r.ok) return null;
            const jj = await r.json();
            return {
              max: jj?.daily?.temperature_2m_max?.[0],
              min: jj?.daily?.temperature_2m_min?.[0],
              precip: jj?.daily?.precipitation_sum?.[0],
            };
          }));
          if (cancel) return;
          const valid = results.filter((x): x is { max: number; min: number; precip: number } =>
            !!x && typeof x.max === "number" && typeof x.min === "number");
          if (valid.length === 0) throw new Error("Sem dados históricos");
          const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
          const maxC = Math.round(avg(valid.map((v) => v.max)));
          const minC = Math.round(avg(valid.map((v) => v.min)));
          // % of past years where it rained > 1mm on that date
          const rainyShare = valid.filter((v) => (v.precip ?? 0) > 1).length / valid.length;
          setData({ status: "ok", kind: "historical", maxC, minC, rainPct: Math.round(rainyShare * 100) });
        }
      } catch (e: any) {
        if (!cancel) setData({ status: "error", message: e?.message || "Clima indisponível" });
      }
    })();
    return () => { cancel = true; };
  }, [date, geo, target]);

  if (data.status === "loading") {
    return <div className="rounded-lg border bg-card p-3 text-xs text-muted-foreground flex items-center gap-2"><CloudSun className="size-3.5" />Carregando clima...</div>;
  }
  if (data.status === "error") {
    return <div className="rounded-lg border bg-card p-3 text-xs text-muted-foreground flex items-center gap-2"><CloudSun className="size-3.5" />Clima indisponível: {data.message}</div>;
  }
  return (
    <div className="rounded-lg border bg-card p-3 flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2 text-sm">
        <CloudSun className="size-4 text-primary" />
        <span className="font-medium">{isFinite(data.maxC) ? `${data.maxC}°` : "—"}</span>
        <span className="text-muted-foreground">/ {isFinite(data.minC) ? `${data.minC}°` : "—"}</span>
      </div>
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Droplets className="size-3.5" />
        {data.kind === "forecast" ? "Chuva" : "Histórico chuva"} <span className="text-foreground font-medium ml-1">{data.rainPct}%</span>
      </div>
      <div className="text-[10px] text-muted-foreground ml-auto">
        {data.kind === "forecast" ? "Previsão" : "Média histórica (5 anos)"} · Open-Meteo
      </div>
    </div>
  );
}

