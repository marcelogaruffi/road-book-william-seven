import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { signRoadbookFiles } from "@/lib/storage.functions";
import {
  MapPin, Phone, Hotel, Theater, CalendarDays, FileText, Globe,
  MessageCircle, Users, BedDouble, CloudSun, Calendar, Sparkles, Camera, X,
  Navigation, Droplets,
} from "lucide-react";
import {
  rowToRoadbook, progTitle, progHora, TIPO_COLORS, FOTO_CATEGORIAS,
  normalizeExternalUrl, mapsUrl,
  type ProgItem, type Documento, type Quarto, type OutroContato, type Foto,
} from "@/lib/roadbook-types";

type GeoPlace = { latitude: number; longitude: number; name: string; admin1?: string };
type GeoState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; place: GeoPlace };
const GeoContext = (await import("react")).createContext<GeoState>({ status: "loading" });


export const Route = createFileRoute("/rb/$slug")({
  ssr: false,
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("roadbooks").select("*").eq("slug", params.slug).maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    const rb = rowToRoadbook(data);

    const paths = [
      ...rb.teatro_fotos.map((f) => f.path),
      ...rb.hotel_fotos.map((f) => f.path),
      ...rb.documentos.map((d) => d.path),
    ].filter(Boolean);
    if (paths.length > 0) {
      try {
        const { urls } = await signRoadbookFiles({ data: { paths } });
        rb.teatro_fotos = rb.teatro_fotos.map((f) => ({ ...f, url: urls[f.path] ?? f.url }));
        rb.hotel_fotos = rb.hotel_fotos.map((f) => ({ ...f, url: urls[f.path] ?? f.url }));
        rb.documentos = rb.documentos.map((d) => ({ ...d, url: urls[d.path] ?? d.url }));
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

        {/* CLIMA */}
        <Section title="Clima" icon={<CloudSun className="size-4" />}>
          <Weather cidade={r.cidade} estado={r.estado} dataInicial={r.data_inicial} dataFinal={r.data_final} />
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
        {(r.hotel_nome || r.hotel_endereco || r.hotel_telefone || hotelSite || r.hotel_checkin || r.hotel_checkout || r.quartos.length > 0 || r.hotel_fotos.length > 0) && (
          <Section title="Hospedagem" icon={<Hotel className="size-4" />}>
            <div className="rounded-lg border p-4 bg-card space-y-3">
              {r.hotel_nome && <p className="font-semibold">{r.hotel_nome}</p>}
              {r.hotel_endereco && <p className="text-sm text-muted-foreground">{r.hotel_endereco}</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {r.hotel_telefone && <a href={`tel:${onlyDigits(r.hotel_telefone)}`} className="text-primary inline-flex items-center gap-1"><Phone className="size-3.5" />{r.hotel_telefone}</a>}
                {hotelSite && <a href={hotelSite} target="_blank" rel="noopener noreferrer" className="text-primary inline-flex items-center gap-1"><Globe className="size-3.5" />Site</a>}
              </div>
              {(r.hotel_checkin || r.hotel_checkout) && (
                <p className="text-sm text-muted-foreground">
                  {r.hotel_checkin && <>Check-in: <span className="text-foreground">{fmtDate(r.hotel_checkin)}</span></>}
                  {r.hotel_checkin && r.hotel_checkout && " · "}
                  {r.hotel_checkout && <>Check-out: <span className="text-foreground">{fmtDate(r.hotel_checkout)}</span></>}
                </p>
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
            <PhotoGallery fotos={r.hotel_fotos} label="Fotos do hotel" onOpen={setLightbox} />
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
            <PhotoGallery fotos={r.teatro_fotos} label="Fotos do teatro" onOpen={setLightbox} />
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

function PhotoGallery({ fotos, label, onOpen }: { fotos: Foto[]; label: string; onOpen: (f: Foto) => void }) {
  if (!fotos || fotos.length === 0) return null;
  const fotoMap = new Map<string, Foto[]>();
  for (const f of fotos) {
    const key = f.categoria === "Outros"
      ? `Outros - ${(f.descricao || "Sem descrição").trim()}`
      : f.categoria;
    if (!fotoMap.has(key)) fotoMap.set(key, []);
    fotoMap.get(key)!.push(f);
  }
  const grupos: { key: string; label: string; fotos: Foto[] }[] = [];
  for (const c of FOTO_CATEGORIAS) {
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
type WeatherState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; tempC: number; maxC: number; minC: number; rainPct: number; locationName: string };

function Weather({ cidade, estado, dataInicial, dataFinal }: { cidade: string; estado: string; dataInicial?: string; dataFinal?: string }) {
  const [state, setState] = useState<WeatherState>({ status: "loading" });

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        if (!cidade?.trim()) { setState({ status: "error", message: "Cidade não cadastrada" }); return; }
        // Geocoding: search by city name only (state suffix often breaks matching)
        const query = encodeURIComponent(cidade.trim());
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5&language=pt&format=json`;
        console.log("[Weather] geocoding:", geoUrl);
        const geoRes = await fetch(geoUrl);
        if (!geoRes.ok) throw new Error("geo http " + geoRes.status);
        const geo = await geoRes.json();
        console.log("[Weather] geocoding result:", geo);
        const results: any[] = Array.isArray(geo?.results) ? geo.results : [];
        if (results.length === 0) throw new Error("Cidade não encontrada");
        // Prefer Brazilian match; fallback to first
        const place =
          results.find((r) => r.country_code === "BR") ||
          results[0];
        const { latitude, longitude, name, admin1 } = place;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
          `&current=temperature_2m` +
          `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
          `&timezone=auto&forecast_days=1`;
        console.log("[Weather] forecast:", url);
        const wRes = await fetch(url);
        if (!wRes.ok) throw new Error("weather http " + wRes.status);
        const w = await wRes.json();
        console.log("[Weather] forecast result:", w);
        if (cancel) return;
        const tempC = Math.round(w?.current?.temperature_2m ?? NaN);
        const maxC = Math.round(w?.daily?.temperature_2m_max?.[0] ?? NaN);
        const minC = Math.round(w?.daily?.temperature_2m_min?.[0] ?? NaN);
        const rainPct = Math.round(w?.daily?.precipitation_probability_max?.[0] ?? 0);
        setState({ status: "ok", tempC, maxC, minC, rainPct, locationName: `${name}${admin1 ? ", " + admin1 : ""}` });
      } catch (e: any) {
        console.error("[Weather] error:", e);
        if (!cancel) setState({ status: "error", message: e?.message || "Não foi possível carregar o clima" });
      }
    })();
    return () => { cancel = true; };
  }, [cidade, estado, dataInicial, dataFinal]);


  if (state.status === "loading") {
    return <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">Carregando clima...</div>;
  }
  if (state.status === "error") {
    return <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">Clima indisponível: {state.message}</div>;
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{state.locationName}</div>
          <div className="text-4xl font-semibold mt-1">{isFinite(state.tempC) ? `${state.tempC}°C` : "—"}</div>
        </div>
        <div className="text-sm text-muted-foreground space-y-1 text-right">
          <div>Máx <span className="text-foreground font-medium">{isFinite(state.maxC) ? `${state.maxC}°` : "—"}</span></div>
          <div>Mín <span className="text-foreground font-medium">{isFinite(state.minC) ? `${state.minC}°` : "—"}</span></div>
          <div className="inline-flex items-center gap-1"><Droplets className="size-3.5" /> Chuva <span className="text-foreground font-medium">{state.rainPct}%</span></div>
        </div>
      </div>
      <div className="text-[10px] text-muted-foreground mt-3">Fonte: Open-Meteo</div>
    </div>
  );
}
