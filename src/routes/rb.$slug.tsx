import { createFileRoute, notFound } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { signRoadbookFiles } from "@/lib/storage.functions";
import {
  MapPin, Phone, Hotel, Theater, CalendarDays, FileText, Globe,
  MessageCircle, Users, BedDouble, CloudSun, Calendar, Sparkles, Camera, X,
  Navigation, Droplets, Plane, Clock, Map as MapIcon, Instagram
} from "lucide-react";
import {
  rowToRoadbook, progTitle, progHora, TIPO_COLORS, TEATRO_FOTO_CATEGORIAS, HOTEL_FOTO_CATEGORIAS,
  normalizeExternalUrl, mapsUrl, getDaySummary,
  type ProgItem, type Documento, type Quarto, type OutroContato, type Foto, type Voo,
} from "@/lib/roadbook-types";
import "leaflet/dist/leaflet.css";

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


function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

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

  // Lightbox & Viewer
  const [lightbox, setLightbox] = useState<any | null>(null);
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightbox(null); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [lightbox]);

  // Operational Map State and Fetching
  interface PlaceDetail {
    name: string;
    address: string;
    lat: number;
    lon: number;
    distance: number;
    type: "pharmacy" | "supermarket" | "hospital";
    assoc: "hotel" | "theater" | "general";
  }

  interface CustomPlaceDetail {
    name: string;
    address: string;
    lat: number;
    lon: number;
    distance: number;
  }

  const [opState, setOpState] = useState<{
    loading: boolean;
    hotelCoords: [number, number] | null;
    teatroCoords: [number, number] | null;
    places: PlaceDetail[];
    customPlaces: CustomPlaceDetail[];
  }>({
    loading: true,
    hotelCoords: null,
    teatroCoords: null,
    places: [],
    customPlaces: [],
  });

  useEffect(() => {
    let cancel = false;
    (async () => {
      const hotelAddr = r.hotel_endereco;
      const teatroAddr = r.teatro_endereco;

      let hCoords: [number, number] | null = null;
      let tCoords: [number, number] | null = null;

      try {
        if (hotelAddr?.trim()) {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(hotelAddr.trim())}&format=json&limit=1`, {
            headers: { "User-Agent": "RoadBookApp/1.0" }
          });
          const data = await res.json();
          if (data && data[0]) hCoords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        }
      } catch {}

      try {
        if (teatroAddr?.trim()) {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(teatroAddr.trim())}&format=json&limit=1`, {
            headers: { "User-Agent": "RoadBookApp/1.0" }
          });
          const data = await res.json();
          if (data && data[0]) tCoords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        }
      } catch {}

      if (cancel) return;

      const foundPlaces: PlaceDetail[] = [];

      const findNearestAmenity = async (q: string, lat: number, lon: number, type: "pharmacy" | "supermarket" | "hospital", assoc: "hotel" | "theater" | "general") => {
        const radii = [3, 5, 10, 15, 20]; // expanding radiuses in km
        for (const radius of radii) {
          try {
            const latDiff = radius / 111.0;
            const cosLat = Math.cos(lat * Math.PI / 180.0);
            const lonDiff = radius / (111.0 * (cosLat !== 0 ? cosLat : 1.0));
            const lonMin = lon - lonDiff;
            const lonMax = lon + lonDiff;
            const latMin = lat - latDiff;
            const latMax = lat + latDiff;

            const viewbox = `${lonMin},${latMax},${lonMax},${latMin}`;
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&lat=${lat}&lon=${lon}&addressdetails=1&viewbox=${viewbox}&bounded=1`;
            
            const res = await fetch(url, { headers: { "User-Agent": "RoadBookApp/1.0" } });
            const data = await res.json();
            
            if (data && Array.isArray(data) && data.length > 0) {
              let bestPlace: any = null;
              let bestDist = Infinity;
              
              for (const item of data) {
                const pLat = parseFloat(item.lat);
                const pLon = parseFloat(item.lon);
                const dist = getHaversineDistance(lat, lon, pLat, pLon);
                if (dist < bestDist && dist <= radius * 1000) {
                  bestDist = dist;
                  bestPlace = {
                    name: item.display_name.split(",")[0] || q,
                    address: item.display_name,
                    lat: pLat,
                    lon: pLon,
                    distance: dist,
                    type,
                    assoc
                  };
                }
              }
              
              if (bestPlace) return bestPlace;
            }
          } catch {}
          await new Promise(resolve => setTimeout(resolve, 150));
        }
        return null;
      };

      if (hCoords) {
        const ph = await findNearestAmenity("farmacia", hCoords[0], hCoords[1], "pharmacy", "hotel");
        if (ph) foundPlaces.push(ph);
        const sh = await findNearestAmenity("supermercado", hCoords[0], hCoords[1], "supermarket", "hotel");
        if (sh) foundPlaces.push(sh);
        const hosp = await findNearestAmenity("hospital", hCoords[0], hCoords[1], "hospital", "general");
        if (hosp) foundPlaces.push(hosp);
      }

      if (tCoords) {
        const pt = await findNearestAmenity("farmacia", tCoords[0], tCoords[1], "pharmacy", "theater");
        if (pt) foundPlaces.push(pt);
        const st = await findNearestAmenity("supermercado", tCoords[0], tCoords[1], "supermarket", "theater");
        if (st) foundPlaces.push(st);
      }

      if (cancel) return;

      // Geocode custom "Outros Locais"
      const customPlaces: CustomPlaceDetail[] = [];
      const outrosLocais = r.automacoes?.outros_locais ?? [];
      for (const loc of outrosLocais) {
        if (loc.endereco?.trim()) {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(loc.endereco.trim())}&format=json&limit=1`, {
              headers: { "User-Agent": "RoadBookApp/1.0" }
            });
            const data = await res.json();
            if (data && data[0]) {
              const locLat = parseFloat(data[0].lat);
              const locLon = parseFloat(data[0].lon);
              const baseCoords = hCoords || tCoords;
              const dist = baseCoords ? getHaversineDistance(baseCoords[0], baseCoords[1], locLat, locLon) : 0;
              customPlaces.push({
                name: loc.nome || "Local",
                address: loc.endereco,
                lat: locLat,
                lon: locLon,
                distance: dist,
              });
            }
          } catch {}
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      }

      if (cancel) return;

      setOpState({
        loading: false,
        hotelCoords: hCoords,
        teatroCoords: tCoords,
        places: foundPlaces,
        customPlaces: customPlaces,
      });
    })();
    return () => { cancel = true; };
  }, [r.hotel_endereco, r.teatro_endereco, r.automacoes?.outros_locais]);

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

        {/* LINHA DO TEMPO DA TURNÊ */}
        {dias.length > 0 && (
          <Section title="Linha do Tempo da Turnê" icon={<Calendar className="size-4" />}>
            <div className="rounded-lg border p-5 bg-card">
              {/* Desktop: Horizontal Timeline */}
              <div className="hidden md:block">
                <div className="relative flex justify-between items-start">
                  {/* Horizontal line */}
                  <div className="absolute top-[37px] left-0 right-0 h-0.5 bg-muted z-0" />
                  
                  {dias.map((d, index) => {
                    const summary = r.automacoes?.timeline_overrides?.[d] || getDaySummary(groups[d]);
                    return (
                      <div key={d} className="relative z-10 flex flex-col items-center text-center flex-1 px-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          {fmtDate(d).substring(0, 5)}
                        </span>
                        <div className="size-6 rounded-full border-2 border-primary bg-card flex items-center justify-center font-bold text-xs text-primary shadow-sm">
                          {index + 1}
                        </div>
                        <span className="text-xs font-medium text-foreground mt-3 max-w-[120px] break-words">
                          {summary}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mobile: Vertical Timeline */}
              <div className="block md:hidden space-y-4 relative before:absolute before:inset-y-0 before:left-3 before:w-0.5 before:bg-muted">
                {dias.map((d, index) => {
                  const summary = r.automacoes?.timeline_overrides?.[d] || getDaySummary(groups[d]);
                  return (
                    <div key={d} className="relative pl-8 flex items-start gap-3">
                      {/* Vertical line circle */}
                      <div className="absolute left-1 top-1.5 size-4 rounded-full border-2 border-primary bg-background flex items-center justify-center" />
                      <div className="flex flex-col">
                        <span className="text-xs font-mono text-muted-foreground font-semibold">
                          {fmtDate(d)}
                        </span>
                        <span className="text-sm font-semibold text-foreground mt-0.5">
                          {summary}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
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

        {/* VOOS */}
        <FlightSection ida={r.voo_ida} volta={r.voo_volta} onOpenImage={setLightbox} />

        {/* OUTROS LOCAIS */}
        {r.automacoes?.outros_locais && r.automacoes.outros_locais.length > 0 && (
          <Section title="Outros Locais" icon={<MapPin className="size-4" />}>
            <div className="rounded-lg border bg-card divide-y">
              {opState.customPlaces.map((p, idx) => (
                <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                  <div>
                    <h4 className="font-semibold text-foreground">{p.name}</h4>
                    <p className="text-muted-foreground text-xs mt-0.5">{p.address}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {p.distance > 0 && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {p.distance < 1000 ? `${Math.round(p.distance)}m` : `${(p.distance / 1000).toFixed(1)}km`} do hotel
                      </span>
                    )}
                    <a
                      href={mapsUrl(p.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1 rounded-md border bg-background hover:bg-accent px-2.5 py-1 text-xs font-medium transition-colors"
                    >
                      <Navigation className="size-3" /> Mapa
                    </a>
                  </div>
                </div>
              ))}
              {/* Fallback for places that couldn't be geocoded or if loading is still in progress */}
              {opState.loading && (
                <div className="p-4 text-xs text-muted-foreground italic animate-pulse">
                  Carregando localizações...
                </div>
              )}
              {!opState.loading && opState.customPlaces.length < r.automacoes.outros_locais.length && (
                r.automacoes.outros_locais
                  .filter(l => !opState.customPlaces.some(cp => cp.address === l.endereco))
                  .map((l, idx) => (
                    <div key={`fallback-${idx}`} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm opacity-80">
                      <div>
                        <h4 className="font-semibold text-foreground">{l.nome}</h4>
                        <p className="text-muted-foreground text-xs mt-0.5">{l.endereco}</p>
                      </div>
                      <a
                        href={mapsUrl(l.endereco)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1 rounded-md border bg-background hover:bg-accent px-2.5 py-1 text-xs font-medium transition-colors shrink-0"
                      >
                        <Navigation className="size-3" /> Mapa
                      </a>
                    </div>
                  ))
              )}
            </div>
          </Section>
        )}

        {/* MAPA OPERACIONAL */}
        <Section title="Mapa Operacional" icon={<MapIcon className="size-4" />}>
          {opState.loading ? (
            <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground bg-card animate-pulse">
              Carregando localizações e estabelecimentos próximos...
            </div>
          ) : (
            <OperationalMap
              hotelNome={r.hotel_nome || "Hotel"}
              teatroNome={r.teatro_nome || "Teatro"}
              hotelCoords={opState.hotelCoords}
              teatroCoords={opState.teatroCoords}
              places={opState.places}
              customPlaces={opState.customPlaces}
            />
          )}
        </Section>

        {/* CONTATOS */}
        {(r.producao_nome || r.producao_whatsapp || r.producao_telefone || r.receptivo_nome || r.receptivo_whatsapp || r.receptivo_telefone || r.outros_contatos.length > 0) && (
          <Section title="Contatos" icon={<Users className="size-4" />}>
            <div className="grid sm:grid-cols-2 gap-3">
              {(r.producao_nome || r.producao_whatsapp || r.producao_telefone) && (
                <ContactCard label="Produção" name={r.producao_nome} telefone={r.producao_telefone} whatsapp={r.producao_whatsapp} />
              )}
              {(r.receptivo_nome || r.receptivo_whatsapp || r.receptivo_telefone) && (
                <ContactCard label="Receptivo" name={r.receptivo_nome} telefone={r.receptivo_telefone} whatsapp={r.receptivo_whatsapp} />
              )}
              {r.outros_contatos.map((c: OutroContato, i) => (
                <ContactCard key={i} label={c.funcao || "Contato"} name={c.nome} telefone={c.telefone} whatsapp={c.whatsapp} />
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
                {fiInstagramUrl && (
                  <a href={fiInstagramUrl} target="_blank" rel="noopener noreferrer" className="text-primary inline-flex items-center gap-1">
                    <Instagram className="size-3.5" />
                    {fiInstagram.startsWith("@") || !/^https?:/i.test(fiInstagram) ? (fiInstagram.startsWith("@") ? fiInstagram : "@" + fiInstagram.replace(/^@/, "")) : "Instagram"}
                  </a>
                )}
              </div>
              {fi.redes && <RedesLinks text={fi.redes} />}
              {fi.programacao_oficial && <ProgramacaoOficial text={fi.programacao_oficial} />}
              {fi.observacoes && <p className="text-muted-foreground whitespace-pre-line">{fi.observacoes}</p>}
            </div>
            <PhotoGallery fotos={r.festival_info?.fotos ?? []} label="Fotos do festival" categorias={["Fachada", "Apresentação", "Divulgação", "Outros"]} onOpen={setLightbox} />
          </Section>
        )}

        {/* DOCUMENTOS */}
        {r.documentos.length > 0 && (
          <Section title="Documentos" icon={<FileText className="size-4" />}>
            <div className="rounded-lg border bg-card divide-y">
              {r.documentos.map((doc: Documento, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setLightbox({ url: doc.url ?? "", nome: doc.nome, tipo: doc.tipo })}
                  className="p-3 flex items-center gap-3 hover:bg-accent transition-colors w-full text-left"
                >
                  <FileText className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate flex-1">{doc.nome}</span>
                  <span className="text-xs text-muted-foreground">{doc.tipo?.split("/")[1] ?? "PDF"}</span>
                </button>
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
            lightbox.tipo?.startsWith("application/pdf") || lightbox.nome?.toLowerCase().endsWith(".pdf") ? (
              <iframe
                src={lightbox.url}
                title={lightbox.nome}
                onClick={(e) => e.stopPropagation()}
                className="w-full h-full max-w-4xl max-h-[85vh] bg-white rounded-md shadow-2xl border-none"
              />
            ) : (
              <img
                src={lightbox.url}
                alt={lightbox.nome}
                onClick={(e) => e.stopPropagation()}
                className="max-w-full max-h-full object-contain rounded shadow-2xl"
              />
            )
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

function ContactCard({ label, name, telefone, whatsapp }: { label: string; name: string | null; telefone?: string | null; whatsapp?: string | null }) {
  const wa = whatsapp ? onlyDigits(whatsapp) : "";
  const tel = telefone ? onlyDigits(telefone) : "";
  return (
    <div className="rounded-lg border p-4 bg-card space-y-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      {name && <div className="font-semibold text-base text-card-foreground">{name}</div>}
      
      {telefone && (
        <div className="text-sm flex items-center gap-2">
          <span className="text-muted-foreground text-xs">Telefone:</span>
          <a href={`tel:${tel}`} className="text-primary hover:underline font-mono">{telefone}</a>
        </div>
      )}
      
      {whatsapp && (
        <div className="text-sm flex items-center gap-2">
          <span className="text-muted-foreground text-xs">WhatsApp:</span>
          <span className="font-mono">{whatsapp}</span>
        </div>
      )}
      
      {wa && (
        <a
          href={`https://wa.me/${wa}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-[#25D366] hover:bg-[#1faa54] text-white text-xs font-semibold px-3 py-2 w-full transition-colors"
        >
          <MessageCircle className="size-3.5" />
          Chamar no WhatsApp
        </a>
      )}
    </div>
  );
}

function hasFlight(v: Voo): boolean {
  return !!(v.aeroporto_origem || v.aeroporto_destino || v.numero || v.localizador || v.data || v.hora || v.portao || v.terminal || (v.passageiros?.length ?? 0) > 0 || (v.cartoes_embarque?.length ?? 0) > 0);
}

function FlightSection({ ida, volta, onOpenImage }: { ida: Voo; volta: Voo; onOpenImage: (item: any) => void }) {
  if (!hasFlight(ida) && !hasFlight(volta)) return null;
  return (
    <Section title="Transporte Aéreo" icon={<Plane className="size-4" />}>
      <div className="space-y-4">
        {hasFlight(ida) && <FlightCard title="Voo de ida" voo={ida} onOpenImage={onOpenImage} />}
        {hasFlight(volta) && <FlightCard title="Voo de volta" voo={volta} onOpenImage={onOpenImage} />}
      </div>
    </Section>
  );
}

function FlightCard({ title, voo, onOpenImage }: { title: string; voo: Voo; onOpenImage: (item: any) => void }) {
  const pax = voo.passageiros ?? [];
  const passes = voo.cartoes_embarque ?? [];
  return (
    <div className="rounded-lg border p-4 bg-card space-y-3">
      <div className="flex items-center gap-2"><Plane className="size-4 text-primary" /><h3 className="font-semibold">{title}</h3></div>
      {(voo.aeroporto_origem || voo.aeroporto_destino) && (
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{voo.aeroporto_origem || "—"}</span>
          <Plane className="size-3.5 text-muted-foreground rotate-45" />
          <span className="font-medium">{voo.aeroporto_destino || "—"}</span>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        {voo.numero && <InfoCell label="Voo" value={voo.numero} />}
        {voo.localizador && <InfoCell label="Localizador" value={voo.localizador} />}
        {voo.data && <InfoCell label="Data" value={fmtDate(voo.data)} />}
        {voo.hora && <InfoCell label="Hora" value={voo.hora} />}
        {voo.terminal && <InfoCell label="Terminal" value={voo.terminal} />}
        {voo.portao && <InfoCell label="Portão" value={voo.portao} />}
      </div>
      {pax.length > 0 && (
        <div className="rounded-md border divide-y">
          <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Users className="size-3" />Passageiros</div>
          {pax.map((p, i) => (
            <div key={i} className="px-3 py-2 grid grid-cols-12 gap-2 text-sm">
              <span className="col-span-7 truncate">{p.nome || "—"}</span>
              <span className="col-span-2 text-muted-foreground text-xs">{p.assento ? `Assento ${p.assento}` : ""}</span>
              <span className="col-span-3 text-muted-foreground text-xs text-right">{p.bagagens ? `${p.bagagens} bag.` : ""}</span>
            </div>
          ))}
        </div>
      )}
      {passes.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Cartões de embarque</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {passes.map((c, i) => {
              const isImg = c.tipo?.startsWith("image/");
              const isPdf = c.tipo?.startsWith("application/pdf") || c.nome.toLowerCase().endsWith(".pdf");
              
              if (isImg && c.url) {
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onOpenImage({ url: c.url, nome: c.nome, tipo: c.tipo })}
                    className="aspect-[3/4] overflow-hidden rounded-md border bg-muted"
                  >
                    <img src={c.url} alt={c.nome} className="w-full h-full object-cover" loading="lazy" />
                  </button>
                );
              }
              
              if (isPdf && c.url) {
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onOpenImage({ url: c.url, nome: c.nome, tipo: c.tipo })}
                    className="flex flex-col items-center justify-center gap-1.5 aspect-[3/4] rounded-md border bg-background p-2 text-center hover:bg-accent"
                  >
                    <FileText className="size-6 text-primary" />
                    <span className="text-[10px] text-muted-foreground truncate w-full">{c.nome}</span>
                    <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">Ver PDF</span>
                  </button>
                );
              }
              
              return (
                <a
                  key={i}
                  href={c.url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-1 aspect-[3/4] rounded-md border bg-background p-2 text-center hover:bg-accent"
                >
                  <FileText className="size-6 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground truncate w-full">{c.nome}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-medium truncate">{value}</div>
    </div>
  );
}

function PhotoGallery({ fotos, label, categorias, onOpen }: { fotos: Foto[]; label: string; categorias: readonly string[]; onOpen: (f: Foto) => void }) {
  if (!fotos || fotos.length === 0) return null;

  const [activeCategory, setActiveCategory] = useState<string>("Todas");

  // Map photos to normalize categories
  const normalizedPhotos = useMemo(() => {
    return fotos.map(f => {
      const isOutros = !categorias.includes(f.categoria) || f.categoria === "Outros";
      const displayCategory = isOutros && f.descricao ? f.descricao.trim() : f.categoria;
      return {
        ...f,
        displayCategory: displayCategory || "Outros"
      };
    });
  }, [fotos, categorias]);

  // Extract unique categories for filter tabs
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    normalizedPhotos.forEach(f => cats.add(f.displayCategory));
    return ["Todas", ...Array.from(cats)].sort();
  }, [normalizedPhotos]);

  // Filter photos based on selection
  const filteredPhotos = useMemo(() => {
    if (activeCategory === "Todas") return normalizedPhotos;
    return normalizedPhotos.filter(f => f.displayCategory === activeCategory);
  }, [normalizedPhotos, activeCategory]);

  return (
    <div className="mt-4 space-y-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <Camera className="size-3.5" />{label}
      </div>
      
      {/* Category filter tabs */}
      {availableCategories.length > 2 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-wrap">
          {availableCategories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs border transition-colors shrink-0 ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground hover:text-foreground border-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Grid gallery */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {filteredPhotos.map((f, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onOpen(f)}
            className="group relative aspect-square overflow-hidden rounded-lg border bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {f.url ? (
              <>
                <img
                  src={f.url}
                  alt={f.nome}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent p-2 text-left opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="text-[10px] text-white font-medium block truncate">
                    {f.displayCategory}
                  </span>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                Sem preview
              </div>
            )}
          </button>
        ))}
      </div>
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
    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 font-medium bg-muted/40 px-3 py-1.5 rounded-md w-fit">
      <div className="flex items-center gap-1">
        <CloudSun className="size-3.5 text-primary" />
        <span className="text-foreground">{isFinite(data.maxC) ? `${data.maxC}°C` : "—"}</span>
        <span className="text-muted-foreground">/ {isFinite(data.minC) ? `${data.minC}°C` : "—"}</span>
      </div>
      <div className="h-3 w-px bg-muted-foreground/30" />
      <div className="flex items-center gap-1">
        <Droplets className="size-3.5 text-blue-500" />
        <span>{data.rainPct}% de chance de chuva</span>
      </div>
      <div className="h-3 w-px bg-muted-foreground/30" />
      <span className="text-[9px] text-muted-foreground/70 uppercase tracking-wide">
        {data.kind === "forecast" ? "Previsão" : "Clima Histórico"}
      </span>
    </div>
  );
}

interface PlaceDetail {
  name: string;
  address: string;
  lat: number;
  lon: number;
  distance: number;
  type: "pharmacy" | "supermarket" | "hospital";
  assoc: "hotel" | "theater" | "general";
}

function OperationalMap({
  hotelNome,
  teatroNome,
  hotelCoords,
  teatroCoords,
  places,
  customPlaces = [],
}: {
  hotelNome: string;
  teatroNome: string;
  hotelCoords: [number, number] | null;
  teatroCoords: [number, number] | null;
  places: PlaceDetail[];
  customPlaces?: CustomPlaceDetail[];
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || (!hotelCoords && !teatroCoords)) return;

    let active = true;

    import("leaflet").then((LModule) => {
      const L = LModule.default || LModule;
      if (!active || !mapRef.current) return;

      // Fix default marker icon URLs
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });

      const center = hotelCoords || teatroCoords || [0, 0];
      
      const map = L.map(mapRef.current, { zoomControl: true }).setView(center, 14);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      const markers = L.featureGroup();

      const createMarkerIcon = (color: string) => {
        return L.divIcon({
          html: `
            <svg class="size-6 drop-shadow-md" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/>
            </svg>
          `,
          className: "custom-leaflet-icon",
          iconSize: [24, 24],
          iconAnchor: [12, 24],
          popupAnchor: [0, -24],
        });
      };

      if (hotelCoords) {
        L.marker(hotelCoords, { icon: createMarkerIcon("#3b82f6") }) // Blue
          .bindPopup(`<b>Hotel:</b> ${hotelNome}`)
          .addTo(markers);
      }

      if (teatroCoords) {
        L.marker(teatroCoords, { icon: createMarkerIcon("#ef4444") }) // Red
          .bindPopup(`<b>Teatro:</b> ${teatroNome}`)
          .addTo(markers);
      }

      places.forEach(p => {
        let color = "#10b981"; // Green for Pharmacy
        if (p.type === "supermarket") color = "#f59e0b"; // Yellow/Orange
        if (p.type === "hospital") color = "#8b5cf6"; // Purple

        L.marker([p.lat, p.lon], { icon: createMarkerIcon(color) })
          .bindPopup(`<b>${p.name}</b><br/>${p.type === "pharmacy" ? "Farmácia" : p.type === "supermarket" ? "Supermercado" : "Hospital"}`)
          .addTo(markers);
      });

      customPlaces.forEach(p => {
        L.marker([p.lat, p.lon], { icon: createMarkerIcon("#d946ef") }) // Fuchsia for custom locations
          .bindPopup(`<b>${p.name}</b><br/>${p.address}`)
          .addTo(markers);
      });

      markers.addTo(map);

      if (markers.getBounds().isValid()) {
        map.fitBounds(markers.getBounds().pad(0.1));
      }
    });

    return () => {
      active = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [hotelCoords, teatroCoords, places, customPlaces]);

  const getDistanceFmt = (d: number) => {
    if (d < 1000) return `${Math.round(d)}m`;
    return `${(d / 1000).toFixed(1)}km`;
  };

  const getWalkingTime = (d: number) => {
    const time = Math.round((d * 1.25) / 80); // 80m/min
    return time <= 1 ? "1 min" : `${time} min`;
  };

  const getCarTime = (d: number) => {
    const time = Math.round((d * 1.25) / 400) + 1; // 400m/min + 1min overhead
    return time <= 1 ? "1 min" : `${time} min`;
  };

  const getTypeLabel = (t: string) => {
    if (t === "pharmacy") return "Farmácia";
    if (t === "supermarket") return "Supermercado / Hortifruti";
    return "Hospital de referência";
  };

  const getAssocLabel = (p: PlaceDetail) => {
    if (p.assoc === "hotel") return "próximo ao hotel";
    if (p.assoc === "theater") return "próximo ao teatro";
    return "";
  };

  if (!hotelCoords && !teatroCoords) {
    return (
      <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground bg-card">
        Localizações operacionais indisponíveis. Cadastre o endereço do Hotel ou Teatro.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div ref={mapRef} className="h-64 w-full rounded-lg border bg-muted shadow-sm z-0 relative" />

      <div className="grid sm:grid-cols-2 gap-3">
        {places.map((p, idx) => (
          <div key={idx} className="rounded-lg border p-4 bg-card flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`size-2.5 rounded-full ${
                  p.type === "pharmacy" ? "bg-[#10b981]" : p.type === "supermarket" ? "bg-[#f59e0b]" : "bg-[#8b5cf6]"
                }`} />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {getTypeLabel(p.type)} {getAssocLabel(p)}
                </span>
              </div>
              <h4 className="font-semibold mt-1 text-sm text-card-foreground line-clamp-1">{p.name}</h4>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.address}</p>
            </div>
            
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>🚶 {getWalkingTime(p.distance)} a pé ({getDistanceFmt(p.distance)})</span>
                <span>🚗 {getCarTime(p.distance)} de carro</span>
              </div>
              <a
                href={mapsUrl(p.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-md border bg-background hover:bg-accent text-xs font-semibold px-2.5 py-1.5 w-full transition-colors"
              >
                <Navigation className="size-3" />
                Abrir no Google Maps
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

