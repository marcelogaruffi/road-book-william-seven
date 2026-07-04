import { createFileRoute, notFound } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { signRoadbookFiles } from "@/lib/storage.functions";
import {
  MapPin, Phone, Hotel, Theater, CalendarDays, FileText, Globe,
  MessageCircle, Users, BedDouble, CloudSun, Calendar, Sparkles, Camera, X,
  Navigation, Droplets, Plane, Clock, Map as MapIcon, Instagram, Printer, Moon, Sun
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
    const { data, error } = await supabase.from("roadbooks").select("*").eq("slug", params.slug).maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    const rb = rowToRoadbook(data);

    // If bucket is public, we can just use getPublicUrl
    const getUrl = (path: string) => {
      if (!path) return "";
      return supabase.storage.from("roadbook-docs").getPublicUrl(path).data.publicUrl;
    };

    rb.teatro_fotos = rb.teatro_fotos.map((f) => ({ ...f, url: f.url || getUrl(f.path) }));
    rb.hotel_fotos = rb.hotel_fotos.map((f) => ({ ...f, url: f.url || getUrl(f.path) }));
    rb.documentos = rb.documentos.map((d) => ({ ...d, url: d.url || getUrl(d.path) }));
    rb.voo_ida.cartoes_embarque = (rb.voo_ida.cartoes_embarque ?? []).map((c) => ({ ...c, url: c.url || getUrl(c.path) }));
    rb.voo_volta.cartoes_embarque = (rb.voo_volta.cartoes_embarque ?? []).map((c) => ({ ...c, url: c.url || getUrl(c.path) }));

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
  errorComponent: ({ error }: { error: any }) => (
    <div className="min-h-screen flex items-center justify-center p-8 text-center">
      <div>
        <p className="text-muted-foreground font-semibold">Erro ao carregar.</p>
        <p className="text-xs text-red-500 mt-2 font-mono">{error?.message || String(error)}</p>
      </div>
    </div>
  ),
  component: PublicPage,
});

function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = localStorage.getItem("rb-theme");
    if (saved === "dark" || (!saved && document.documentElement.classList.contains("dark"))) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggle = () => {
    if (theme === "light") {
      document.documentElement.classList.add("dark");
      setTheme("dark");
      localStorage.setItem("rb-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      setTheme("light");
      localStorage.setItem("rb-theme", "light");
    }
  };

  return (
    <button 
      onClick={toggle}
      className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-primary transition-all no-print"
    >
      {theme === "light" ? (
        <><Moon className="size-4" /> Modo Escuro</>
      ) : (
        <><Sun className="size-4" /> Modo Claro</>
      )}
    </button>
  );
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(day));
  const dow = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][dateObj.getDay()];
  return `${day}/${m}/${y} (${dow})`;
}
function onlyDigits(s: string) { return s.replace(/\D/g, ""); }

function AppleNumber({ number, className = "size-8" }: { number?: number | string; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Stem */}
      <path d="M50 25 C48 15, 55 5, 60 5 C57 12, 53 18, 50 25" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
      {/* Leaf */}
      <path d="M50 18 C58 12, 70 12, 72 15 C70 23, 58 23, 50 18" fill="#15803d" />
      {/* Apple Body */}
      <path 
        d="M50 27 
           C40 25, 20 28, 15 48 
           C10 65, 25 88, 50 92 
           C75 88, 90 65, 85 48 
           C80 28, 60 25, 50 27 Z" 
        fill="#dc2626" 
      />
      {/* Number text overlay */}
      {number !== undefined && number !== "" && (
        <text 
          x="50" 
          y="62" 
          textAnchor="middle" 
          fill="#ffffff" 
          fontSize="26" 
          fontWeight="bold" 
          fontFamily="sans-serif"
        >
          {number}
        </text>
      )}
    </svg>
  );
}


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

function getDistanceFmt(d: number) {
  if (d < 1000) return `${Math.round(d)}m`;
  return `${(d / 1000).toFixed(1)}km`;
}

function getWalkingTime(d: number) {
  const time = Math.round((d * 1.3) / 80) + 1; // 80m/min (approx 4.8km/h)
  return time <= 1 ? "1 min" : `${time} min`;
}

function getCarTime(d: number) {
  const time = Math.round((d * 1.5) / 300) + 2; // 300m/min + 2min overhead (approx 18km/h)
  return time <= 1 ? "1 min" : `${time} min`;
}

export function PublicRoadbookView({ r, isFirst = true, isConcatenated = false }: { r: ReturnType<typeof rowToRoadbook>; isFirst?: boolean; isConcatenated?: boolean }) {
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
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
  const [lightbox, setLightbox] = useState<{ item: any; allItems?: any[]; index?: number } | null>(null);
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => { 
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight" && lightbox.allItems && lightbox.allItems.length > 1) {
         setLightbox(prev => {
            if (!prev || !prev.allItems) return prev;
            const nextIdx = (prev.index! + 1) % prev.allItems.length;
            return { item: prev.allItems[nextIdx], allItems: prev.allItems, index: nextIdx };
         });
      }
      if (e.key === "ArrowLeft" && lightbox.allItems && lightbox.allItems.length > 1) {
         setLightbox(prev => {
            if (!prev || !prev.allItems) return prev;
            const prevIdx = (prev.index! - 1 + prev.allItems.length) % prev.allItems.length;
            return { item: prev.allItems[prevIdx], allItems: prev.allItems, index: prevIdx };
         });
      }
    };
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
    type: "pharmacy" | "supermarket" | "hospital" | "restaurant" | "shopping";
    assoc: "hotel" | "theater" | "general" | string;
  }

  interface CustomPlaceDetail {
    name: string;
    address: string;
    lat: number;
    lon: number;
    distance: number;
    categoria?: string;
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

  const hotelTeatroDist = useMemo(() => {
    if (!opState.hotelCoords || !opState.teatroCoords) return null;
    return getHaversineDistance(opState.hotelCoords[0], opState.hotelCoords[1], opState.teatroCoords[0], opState.teatroCoords[1]);
  }, [opState.hotelCoords, opState.teatroCoords]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const hotelAddr = r.hotel_endereco;
      const teatroAddr = r.teatro_endereco;

      const getGeocodeQuery = (addr: string) => {
        const query = addr.trim();
        const city = r.cidade?.trim() || "";
        const state = r.estado?.trim() || "";
        const suffix = `${city}${state ? `, ${state}` : ""}`.trim();
        if (!suffix) return query;
        if (query.toLowerCase().includes(city.toLowerCase())) return query;
        return `${query}, ${suffix}`;
      };

      let hCoords: [number, number] | null = null;
      let tCoords: [number, number] | null = null;

      try {
        if (hotelAddr?.trim()) {
          const q = getGeocodeQuery(hotelAddr);
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`, {
            headers: { "User-Agent": "RoadBookApp/1.0" }
          });
          const data = await res.json();
          if (data && data[0]) hCoords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        }
      } catch {}

      try {
        if (teatroAddr?.trim()) {
          const q = getGeocodeQuery(teatroAddr);
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`, {
            headers: { "User-Agent": "RoadBookApp/1.0" }
          });
          const data = await res.json();
          if (data && data[0]) tCoords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        }
      } catch {}

      if (cancel) return;

      const foundPlaces: PlaceDetail[] = [];

      const findNearestAmenities = async (
        q: string,
        lat: number,
        lon: number,
        type: "pharmacy" | "supermarket" | "hospital",
        assoc: "hotel" | "theater" | "general",
        limit: number = 2
      ) => {
        const radii = [3, 5, 10, 15, 20]; // expanding radiuses in km
        for (const radius of radii) {
          try {
            const latDiff = radius / 111.0;
            const cosLat = Math.cos((lat * Math.PI) / 180.0);
            const lonDiff = radius / (111.0 * (cosLat !== 0 ? cosLat : 1.0));
            const lonMin = lon - lonDiff;
            const lonMax = lon + lonDiff;
            const latMin = lat - latDiff;
            const latMax = lat + latDiff;

            const viewbox = `${lonMin},${latMax},${lonMax},${latMin}`;
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=10&lat=${lat}&lon=${lon}&addressdetails=1&viewbox=${viewbox}&bounded=1`;

            const res = await fetch(url, { headers: { "User-Agent": "RoadBookApp/1.0" } });
            const data = await res.json();

            if (data && Array.isArray(data) && data.length > 0) {
              const items: PlaceDetail[] = [];
              for (const item of data) {
                const pLat = parseFloat(item.lat);
                const pLon = parseFloat(item.lon);
                const dist = getHaversineDistance(lat, lon, pLat, pLon);
                if (dist <= radius * 1000) {
                  items.push({
                    name: item.display_name.split(",")[0] || q,
                    address: item.display_name,
                    lat: pLat,
                    lon: pLon,
                    distance: dist,
                    type,
                    assoc,
                  });
                }
              }
              items.sort((a, b) => a.distance - b.distance);
              if (items.length > 0) {
                return items.slice(0, limit);
              }
            }
          } catch {}
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
        return [];
      };

      if (hCoords) {
        const phs = await findNearestAmenities("farmacia", hCoords[0], hCoords[1], "pharmacy", "hotel", 2);
        foundPlaces.push(...phs);
        const shs = await findNearestAmenities("supermercado", hCoords[0], hCoords[1], "supermarket", "hotel", 2);
        foundPlaces.push(...shs);
        const hosp = await findNearestAmenities("hospital", hCoords[0], hCoords[1], "hospital", "general", 1);
        foundPlaces.push(...hosp);
      }

      if (tCoords) {
        const pts = await findNearestAmenities("farmacia", tCoords[0], tCoords[1], "pharmacy", "theater", 2);
        foundPlaces.push(...pts);
        const sts = await findNearestAmenities("supermercado", tCoords[0], tCoords[1], "supermarket", "theater", 2);
        foundPlaces.push(...sts);
      }

      if (cancel) return;

      // Geocode custom "Outros Locais"
      const customPlaces: CustomPlaceDetail[] = [];
      const outrosLocais = r.automacoes?.outros_locais ?? [];
      for (const loc of outrosLocais) {
        if (loc.endereco?.trim()) {
          try {
            const q = getGeocodeQuery(loc.endereco);
            const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`, {
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
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      if (cancel) return;

      // Query nearest pharmacy and supermarket for each custom location
      for (let i = 0; i < customPlaces.length; i++) {
        const cp = customPlaces[i];
        const pLocs = await findNearestAmenities("farmacia", cp.lat, cp.lon, "pharmacy", `custom_${i}` as any, 2);
        foundPlaces.push(...pLocs);
        const sLocs = await findNearestAmenities("supermercado", cp.lat, cp.lon, "supermarket", `custom_${i}` as any, 2);
        foundPlaces.push(...sLocs);
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
    return () => {
      cancel = true;
    };
  }, [r.hotel_endereco, r.teatro_endereco, r.automacoes?.outros_locais]);

  const geo = useGeocode(r.cidade, r.estado);

  return (
    <GeoContext.Provider value={geo}>
    <div className="min-h-screen bg-slate-50 dark:bg-background flex flex-col transition-colors duration-500 overflow-hidden relative">
      <ThemeToggle />
      {/* Background Decorativo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 no-print">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 dark:bg-primary/10 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/20 dark:bg-purple-500/10 blur-[100px]"></div>
      </div>

      {/* CAPA */}
      {isFirst && (
        <header className="pt-16 pb-12 relative z-10 px-5 text-center no-print">
          <div className="w-full max-w-3xl mx-auto space-y-4">
            {/* Logo Bar */}
            <div className="flex justify-center items-center gap-6 mb-8 pb-8 border-b border-slate-200 dark:border-white/10">
              <img src="/logo-seven.png" alt="Seven Produções" className="h-12 w-auto object-contain dark:brightness-200" />
              {r.espetaculo_logo_url && (
                <>
                  <div className="w-px h-10 bg-slate-300 dark:bg-white/20"></div>
                  <img src={r.espetaculo_logo_url} alt={`${r.espetaculo} Logo`} className="h-12 w-auto object-contain dark:brightness-200" />
                </>
              )}
            </div>
            
            {r.festival && (
              <p className="text-xs uppercase tracking-[0.25em] text-primary font-bold flex items-center justify-center gap-1.5">
                {r.festival}
              </p>
            )}
            
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-800 dark:text-white bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
              {r.espetaculo}
            </h1>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mt-6">
              <p className="text-lg font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <MapPin className="size-5 text-slate-400" />{r.cidade}{r.estado ? ` / ${r.estado}` : ""}
              </p>
              {(r.data_inicial || r.data_final) && (
                <p className="text-sm font-bold text-slate-400 flex items-center gap-2 bg-white/50 dark:bg-white/5 px-4 py-2 rounded-xl backdrop-blur-sm border border-slate-200/60 dark:border-white/10">
                  <CalendarDays className="size-4" />
                  {fmtDate(r.data_inicial)}{r.data_final && r.data_final !== r.data_inicial ? ` — ${fmtDate(r.data_final)}` : ""}
                </p>
              )}
            </div>

            <div className="pt-6">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-xl bg-primary dark:bg-primary text-primary-foreground hover:bg-primary/90 dark:hover:bg-primary/80 text-sm font-bold px-6 py-3 shadow-lg dark:shadow-none transition-all hover:-translate-y-0.5"
              >
                <Printer className="size-4.5" />
                Gerar PDF (Salvar ou Imprimir)
              </button>
            </div>
          </div>
        </header>
      )}

      {!isFirst && (
        <div className="w-full max-w-3xl mx-auto px-5 pt-8 pb-6 no-print border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-card/40 backdrop-blur-xl relative z-10 mb-6 rounded-b-[2rem] shadow-sm overflow-hidden">
          <h2 className="text-2xl font-black tracking-tight text-primary flex items-center gap-2 justify-center">
            <MapPin className="size-6" />
            {r.cidade}{r.estado ? ` / ${r.estado}` : ""}
          </h2>
          {(r.data_inicial || r.data_final) && (
            <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              {fmtDate(r.data_inicial)}{r.data_final && r.data_final !== r.data_inicial ? ` — ${fmtDate(r.data_final)}` : ""}
            </p>
          )}
        </div>
      )}

      <main className="w-full max-w-3xl mx-auto px-4 sm:px-5 py-8 space-y-10 no-print overflow-x-hidden">
        {/* RESUMO */}
        {r.resumo_executivo && (
          <Section title="Resumo executivo" icon={<Sparkles className="size-4" />}>
            <p className="whitespace-pre-line text-sm leading-relaxed">{r.resumo_executivo}</p>
          </Section>
        )}

        {/* LINHA DO TEMPO DA TURNÊ */}
        {dias.length > 0 && (
          <Section title="Linha do Tempo da Turnê" icon={<Calendar className="size-4" />}>
            <div className="rounded-lg border p-4 sm:p-5 bg-card overflow-hidden break-words">
              {/* Desktop: Horizontal Timeline */}
              <div className="hidden md:block">
                <div className="relative flex justify-between items-start">
                  {/* Horizontal line */}
                  <div className="absolute top-[48px] left-0 right-0 h-0.5 bg-muted z-0" />
                  
                  {dias.map((d, index) => {
                    const summary = r.automacoes?.timeline_overrides?.[d] || getDaySummary(groups[d]);
                    return (
                      <div key={d} className="relative z-10 flex flex-col items-center text-center flex-1 px-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          {fmtDate(d).substring(0, 5)}
                        </span>
                        <AppleNumber number={index + 1} className="size-12 shrink-0 z-10" />
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
                    <div key={d} className="relative pl-10 flex items-start gap-3 min-h-[36px]">
                      {/* Vertical line apple icon */}
                      <AppleNumber number={index + 1} className="absolute -left-1 top-0.5 size-8 shrink-0 z-10" />
                      <div className="flex flex-col pt-0.5">
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
                      <div key={i} className="p-3 flex gap-3 items-start">
                        <div className="flex flex-col gap-1 shrink-0 w-20 text-primary pt-0.5">
                          <span className="text-xs font-mono tabular-nums font-bold">{progHora(p)}</span>
                          <HourWeather date={date} time={progHora(p)} />
                        </div>
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
        {(r.hotel_nome || r.hotel_endereco || r.hotel_telefone || hotelSite || r.hotel_checkin || r.hotel_checkout || r.quartos.length > 0 || r.hotel_fotos.length > 0 || r.hotel_wifi || r.hotel_cafe_inicio || r.hotel_cafe_fim || r.hotel_observacoes) && (
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
              {(r.hotel_cafe_inicio || r.hotel_cafe_fim || r.hotel_wifi || r.hotel_observacoes) && (
                <div className="pt-2 mt-2 border-t space-y-2 text-slate-800">
                  {(r.hotel_cafe_inicio || r.hotel_cafe_fim) && (
                    <div className="flex items-center gap-2 text-sm text-slate-800">
                      <span className="font-bold">Café da manhã:</span>
                      <span className="font-medium">{r.hotel_cafe_inicio} {r.hotel_cafe_fim && `às ${r.hotel_cafe_fim}`}</span>
                    </div>
                  )}
                  {r.hotel_wifi && (
                    <div className="flex flex-col text-sm text-slate-800">
                      <span className="font-bold">Wi-Fi:</span>
                      <span className="whitespace-pre-wrap font-medium">{r.hotel_wifi}</span>
                    </div>
                  )}
                  {r.hotel_observacoes && (
                    <div className="flex flex-col text-sm text-slate-800">
                      <span className="font-bold">Observações:</span>
                      <span className="whitespace-pre-wrap font-medium">{r.hotel_observacoes}</span>
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
            <PhotoGallery fotos={r.hotel_fotos} label="Fotos do hotel" categorias={HOTEL_FOTO_CATEGORIAS} onOpen={(f, all, i) => setLightbox({ item: f, allItems: all, index: i })} />
          </Section>
        )}

        {/* LOCAL PRINCIPAL */}
        {(r.teatro_nome || r.teatro_endereco || r.teatro_telefone || teatroSite || r.teatro_observacoes || r.teatro_fotos.length > 0) && (
          <Section title="Teatro" icon={<Theater className="size-4" />}>
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
            <PhotoGallery fotos={r.teatro_fotos} label="Fotos do teatro" categorias={TEATRO_FOTO_CATEGORIAS} onOpen={(f, all, i) => setLightbox({ item: f, allItems: all, index: i })} />
          </Section>
        )}

        {/* OUTROS LOCAIS */}
        {r.automacoes?.outros_locais && r.automacoes.outros_locais.length > 0 && (
          <Section title="Outros Locais" icon={<MapPin className="size-4" />}>
            <div className="space-y-4">
              {r.automacoes.outros_locais.map((l, idx) => {
                const geocoded = opState.customPlaces.find(cp => cp.address === l.endereco);
                const distanceVal = geocoded?.distance ?? 0;
                const siteUrl = normalizeExternalUrl(l.site);

                return (
                  <div key={idx} className="rounded-lg border p-4 bg-card space-y-3">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <h4 className="font-semibold text-base">{l.nome || `Local #${idx + 1}`}</h4>
                        {l.endereco && <p className="text-sm text-muted-foreground mt-0.5">{l.endereco}</p>}
                      </div>
                      {distanceVal > 0 && (
                        <span className="rounded-full bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 shrink-0">
                          📍 {distanceVal < 1000 ? `${Math.round(distanceVal)}m` : `${(distanceVal / 1000).toFixed(1)}km`} do hotel
                        </span>
                      )}
                    </div>

                    {(l.telefone || siteUrl) && (
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                        {l.telefone && (
                          <a href={`tel:${onlyDigits(l.telefone)}`} className="text-primary inline-flex items-center gap-1">
                            <Phone className="size-3.5" />{l.telefone}
                          </a>
                        )}
                        {siteUrl && (
                          <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="text-primary inline-flex items-center gap-1">
                            <Globe className="size-3.5" />Site
                          </a>
                        )}
                      </div>
                    )}

                    {l.observacoes && (
                      <p className="text-sm text-muted-foreground whitespace-pre-line border-t pt-2 mt-2">
                        {l.observacoes}
                      </p>
                    )}

                    {l.endereco && (
                      <div className="pt-2">
                        <a
                          href={mapsUrl([l.nome, l.endereco].filter(Boolean).join(", "))}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-md border bg-background hover:bg-accent text-xs font-semibold px-3 py-2 w-full transition-colors"
                        >
                          <Navigation className="size-3.5" />📍 Abrir no Google Maps
                        </a>
                      </div>
                    )}

                    {l.fotos && l.fotos.length > 0 && (
                      <div className="border-t pt-3 mt-3">
                        <PhotoGallery
                          fotos={l.fotos}
                          label={`Fotos de ${l.nome || "Local"}`}
                          categorias={TEATRO_FOTO_CATEGORIAS}
                          onOpen={(f, all, i) => setLightbox({ item: f, allItems: all, index: i })}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* VOOS */}
        <FlightSection ida={r.voo_ida} volta={r.voo_volta} onOpenImage={(f, all, i) => setLightbox({ item: f, allItems: all, index: i })} />

        {/* MAPA OPERACIONAL */}
        <Section title="Mapa Operacional" icon={<MapIcon className="size-4" />}>
          {opState.loading ? (
            <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground bg-card animate-pulse">
              Carregando localizações e estabelecimentos próximos...
            </div>
          ) : (
            <div className="space-y-4">
              {hotelTeatroDist !== null && (
                <div className="rounded-md bg-muted/50 p-3 text-sm flex items-center justify-between">
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="size-4 text-primary" />
                    Distância Hotel ➡️ Teatro
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground font-medium">
                    <span>🚗 {getCarTime(hotelTeatroDist)} ({getDistanceFmt(hotelTeatroDist)})</span>
                    <span>🚶 {getWalkingTime(hotelTeatroDist)}</span>
                  </div>
                </div>
              )}
              <OperationalMap
                hotelNome={r.hotel_nome || "Hotel"}
                teatroNome={r.teatro_nome || "Teatro"}
                hotelCoords={opState.hotelCoords}
                teatroCoords={opState.teatroCoords}
                places={opState.places}
                customPlaces={opState.customPlaces}
                outrosLocais={r.automacoes?.outros_locais || []}
              />
            </div>
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
            <PhotoGallery fotos={r.festival_info?.fotos ?? []} label="Fotos do festival" categorias={["Fachada", "Apresentação", "Divulgação", "Outros"]} onOpen={(f, all, i) => setLightbox({ item: f, allItems: all, index: i })} />
          </Section>
        )}

        {/* DOCUMENTOS */}
        {r.documentos.length > 0 && (() => {
          const fotos = r.documentos.filter(d => d.tipo?.startsWith("image/")).map(d => ({ ...d, categoria: "Documento" }));
          const pdfs = r.documentos.filter(d => !d.tipo?.startsWith("image/"));
          return (
            <div className="space-y-6">
              {fotos.length > 0 && (
                <Section title="Galeria de Documentos" icon={<Image className="size-4" />}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {fotos.map((f: any, i) => (
                      <button key={i} type="button" onClick={() => setLightbox({ item: f, allItems: fotos, index: i })} className="relative aspect-square rounded-lg overflow-hidden border hover:opacity-90 transition-opacity">
                        <img src={f.url} alt={f.nome} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </Section>
              )}
              {pdfs.length > 0 && (
                <Section title="Documentos Técnicos (PDFs e outros)" icon={<FileText className="size-4" />}>
                  <div className="rounded-lg border p-4 sm:p-5 bg-card overflow-hidden divide-y">
                    {pdfs.map((doc: Documento, i) => (
                      <a
                        key={i}
                        href={doc.url ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 flex items-center gap-3 hover:bg-accent transition-colors w-full text-left block"
                      >
                        <FileText className="size-4 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate flex-1 flex flex-col sm:flex-row sm:items-center sm:gap-2">
                          {doc.descricao ? (
                            <>
                              <span className="font-medium">{doc.descricao}</span>
                              <span className="text-muted-foreground text-xs hidden sm:inline">({doc.nome})</span>
                            </>
                          ) : (
                            <span>{doc.nome}</span>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">{doc.tipo?.split("/")[1]?.toUpperCase() ?? "PDF"}</span>
                      </a>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          );
        })()}

        <footer className="pt-8 pb-12 text-center text-xs text-muted-foreground">
          Road Book · William Seven<br />
          Desenvolvido por Marcelo Garuffi - Contemporânea produção de eventos
        </footer>
      </main>

      {/* PRINT-ONLY WORD DOCUMENT DESIGN */}
      <table className="hidden print:table w-full text-slate-900 bg-white antialiased max-w-[21cm] mx-auto" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
        {isFirst && (
        <thead className="table-header-group">
          <tr>
            <td className="px-12 pt-8 pb-4 border-b-0 bg-white">
              <PrintHeader title={r.espetaculo} logoUrl={r.espetaculo_logo_url} />
            </td>
          </tr>
        </thead>
        )}
        <tfoot className="table-footer-group">
          <tr>
            <td className="px-12 pb-8 bg-white">
              <PrintFooter />
            </td>
          </tr>
        </tfoot>
        <tbody className="table-row-group">
          <tr>
            <td className="px-12 pb-12 bg-white">
        
        {/* PAGE 1: DIARY SCHEDULE */}
        <div className="mb-12 break-inside-auto">
          <div>
            

            {/* Document Title & QR Code aligned */}
            <div className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-xl shadow-sm mb-6">
              <div className="text-left font-sans">
                <h2 className="text-xl font-black tracking-widest uppercase text-slate-800">Programação Diária — {r.cidade}</h2>
                {r.festival && <p className="text-xs uppercase tracking-widest text-[#991b1b] font-bold mt-1">{r.festival}</p>}
                {(r.data_inicial || r.data_final) && (
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    📅 {fmtDate(r.data_inicial)}{r.data_final && r.data_final !== r.data_inicial ? ` — ${fmtDate(r.data_final)}` : ""}
                  </p>
                )}
              </div>
              {isFirst && (
              <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100 shrink-0">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(currentUrl)}`}
                  alt="QR Code"
                  className="size-12 object-contain border p-0.5 bg-white rounded shadow-sm"
                />
                <div className="text-left font-sans text-[8px] max-w-[180px] leading-normal text-slate-700">
                  <div className="font-extrabold text-[#991b1b] uppercase tracking-wider text-[7.5px] mb-0.5">Programação atualizada em tempo real no link:</div>
                  <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold text-slate-500 hover:text-slate-700 break-all block">{currentUrl}</a>
                </div>
              </div>
            )}
            </div>

            {/* Weather Row */}
            <div className="border-t border-slate-200/60 pt-4 mb-6">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans mb-3">Previsão do Tempo na Turnê ({r.cidade}{r.estado ? `/${r.estado}` : ""})</h4>
              <div className="flex gap-2">
                {dias.map(d => (
                  <PrintWeatherForecastCard key={d} date={d} />
                ))}
              </div>
            </div>

            {/* Programacao List */}
            <div className="space-y-4 mt-6">
              {dias.map((date) => (
                <div key={date} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm break-inside-auto">
                  <h3 className="text-sm font-bold border-b pb-1.5 mb-2.5 uppercase tracking-wide flex items-center justify-between text-slate-800">
                    <span>{fmtDate(date)} {r.automacoes?.timeline_overrides?.[date] && `— ${r.automacoes.timeline_overrides[date]}`}</span>
                    <PrintDayWeather date={date} />
                  </h3>
                  <div className="space-y-2">
                    {groups[date].map((p, i) => (
                      <div key={i} className="flex gap-4 text-xs py-0.5 items-center">
                        <div className="flex flex-col gap-0.5 w-24 shrink-0">
                          <span className="font-mono font-bold text-[#991b1b]">{progHora(p)}</span>
                          <HourWeather date={date} time={progHora(p)} />
                        </div>
                        <div className="flex-1">
                          <span className="font-bold text-slate-900">{progTitle(p)}</span>
                          {p.local && <span className="text-slate-500 ml-1.5 font-medium">({p.local})</span>}
                          {p.observacao && <p className="text-[10px] text-slate-400 italic mt-0.5">{p.observacao}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            
          </div>
        </div>

        {/* PAGE 2: AIR TRAVEL & HOTEL */}
        <div className="mb-12 break-inside-auto">
          <div>
            

            {/* Flights info */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b pb-1">✈️ Transporte Aéreo</h2>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Flight Ida */}
                {(r.voo_ida.numero || r.voo_ida.aeroporto_origem) && (
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
                    <div className="pl-2 space-y-1 text-xs">
                      <div className="font-bold text-blue-600 uppercase tracking-wide text-[10px]">Voo de Ida</div>
                      <div className="text-slate-800 font-semibold"><span className="text-slate-400 font-normal">Voo:</span> {r.voo_ida.numero} | <span className="text-slate-400 font-normal">Loc:</span> {r.voo_ida.localizador}</div>
                      <div><span className="text-slate-400">Data:</span> {fmtDate(r.voo_ida.data)} às {r.voo_ida.hora}</div>
                      <div><span className="text-slate-400">Origem:</span> {r.voo_ida.aeroporto_origem}</div>
                      <div><span className="text-slate-400">Destino:</span> {r.voo_ida.aeroporto_destino}</div>
                      {r.voo_ida.terminal && <div><span className="text-slate-400">Terminal:</span> {r.voo_ida.terminal} {r.voo_ida.portao && `| Portão: ${r.voo_ida.portao}`}</div>}
                    </div>
                  </div>
                )}

                {/* Flight Volta */}
                {(r.voo_volta.numero || r.voo_volta.aeroporto_origem) && (
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
                    <div className="pl-2 space-y-1 text-xs">
                      <div className="font-bold text-emerald-600 uppercase tracking-wide text-[10px]">Voo de Volta</div>
                      <div className="text-slate-800 font-semibold"><span className="text-slate-400 font-normal">Voo:</span> {r.voo_volta.numero} | <span className="text-slate-400 font-normal">Loc:</span> {r.voo_volta.localizador}</div>
                      <div><span className="text-slate-400">Data:</span> {fmtDate(r.voo_volta.data)} às {r.voo_volta.hora}</div>
                      <div><span className="text-slate-400">Origem:</span> {r.voo_volta.aeroporto_origem}</div>
                      <div><span className="text-slate-400">Destino:</span> {r.voo_volta.aeroporto_destino}</div>
                      {r.voo_volta.terminal && <div><span className="text-slate-400">Terminal:</span> {r.voo_volta.terminal} {r.voo_volta.portao && `| Portão: ${r.voo_volta.portao}`}</div>}
                    </div>
                  </div>
                )}
                  {/* Boarding Passes (Cartões de Embarque) */}
                  {((r.voo_ida.cartoes_embarque?.length ?? 0) > 0 || (r.voo_volta.cartoes_embarque?.length ?? 0) > 0) && (
                    <div className="border-t pt-3 mt-3 col-span-2 space-y-4">
                      {(r.voo_ida.cartoes_embarque?.length ?? 0) > 0 && (
                        <div>
                          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 font-sans">🎫 Cartões de Embarque — Ida</h3>
                          <div className="grid grid-cols-2 gap-4">
                            {r.voo_ida.cartoes_embarque!.map((c, cIdx) => (
                              <div key={cIdx} className="bg-slate-50 border border-slate-200/60 rounded-xl p-2 shadow-sm flex flex-col items-center break-inside-auto">
                                {c.url ? (
                                  <img src={c.url} alt={c.nome || "Cartão de Embarque"} className="max-h-48 object-contain rounded-lg w-full" />
                                ) : (
                                  <div className="h-24 w-full bg-slate-200 rounded-lg flex items-center justify-center text-[10px] text-slate-400">Cartão de Embarque</div>
                                )}
                                <span className="text-[9px] font-bold text-slate-600 mt-1">{c.nome || "Bilhete"}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {(r.voo_volta.cartoes_embarque?.length ?? 0) > 0 && (
                        <div>
                          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 font-sans">🎫 Cartões de Embarque — Volta</h3>
                          <div className="grid grid-cols-2 gap-4">
                            {r.voo_volta.cartoes_embarque!.map((c, cIdx) => (
                              <div key={cIdx} className="bg-slate-50 border border-slate-200/60 rounded-xl p-2 shadow-sm flex flex-col items-center break-inside-auto">
                                {c.url ? (
                                  <img src={c.url} alt={c.nome || "Cartão de Embarque"} className="max-h-48 object-contain rounded-lg w-full" />
                                ) : (
                                  <div className="h-24 w-full bg-slate-200 rounded-lg flex items-center justify-center text-[10px] text-slate-400">Cartão de Embarque</div>
                                )}
                                <span className="text-[9px] font-bold text-slate-600 mt-1">{c.nome || "Bilhete"}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

              </div>
            </div>

            {/* Hotel info */}
            <div className="space-y-4 mt-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b pb-1">🏨 Hospedagem (Hotel)</h2>
              
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#991b1b]" />
                <div className="pl-2 space-y-3">
                  {r.hotel_nome && (
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="col-span-2"><span className="font-bold text-slate-800 text-sm">{r.hotel_nome}</span></div>
                      {r.hotel_endereco && <div className="col-span-2"><span className="font-semibold text-slate-400">Endereço:</span> <span className="text-slate-700">{r.hotel_endereco}</span></div>}
                      {r.hotel_telefone && <div><span className="font-semibold text-slate-400">E-mail:</span> <span className="text-slate-700">{r.hotel_telefone}</span></div>}
                      {r.hotel_site && <div><span className="font-semibold text-slate-400">Site:</span> <span className="text-slate-700">{r.hotel_site}</span></div>}
                      {r.hotel_checkin && <div><span className="font-semibold text-slate-400">Check-in:</span> <span className="text-slate-700">{fmtDate(r.hotel_checkin)} {r.hotel_checkin_hora && `às ${r.hotel_checkin_hora}`}</span></div>}
                      {r.hotel_checkout && <div><span className="font-semibold text-slate-400">Check-out:</span> <span className="text-slate-700">{fmtDate(r.hotel_checkout)} {r.hotel_checkout_hora && `às ${r.hotel_checkout_hora}`}</span></div>}
                    </div>
                  )}

                  {/* Rooming List Table */}
                  {r.quartos && r.quartos.length > 0 && (
                    <div className="border-t pt-3">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 font-sans">Divisão de Quartos</h3>
                      <table className="w-full text-xs font-sans border-collapse">
                        <thead>
                          <tr className="border-b text-slate-400 font-bold uppercase text-[9px] text-left">
                            <th className="pb-1.5 font-semibold">Integrante</th>
                            <th className="pb-1.5 font-semibold text-right">Quarto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {r.quartos.map((q, idx) => (
                            <tr key={idx} className="border-b last:border-0 border-slate-100 hover:bg-slate-50">
                              <td className="py-1.5 text-slate-700 font-medium">{q.pessoa || "—"}</td>
                              <td className="py-1.5 text-slate-900 font-bold text-right font-mono">{q.numero}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Hotel-Teatro Commute */}
                  {hotelTeatroDist !== null && (
                    <div className="border-t pt-3 text-xs font-sans">
                      <div className="font-bold text-slate-800">Deslocamento Hotel ➡️ Teatro</div>
                      <div className="text-slate-600 mt-1 flex items-center gap-2 flex-wrap">
                        <span>🚗 {getCarTime(hotelTeatroDist)} de carro ({getDistanceFmt(hotelTeatroDist)})</span>
                        <span className="text-slate-300">|</span>
                        <span>🚶 {getWalkingTime(hotelTeatroDist)} a pé</span>
                      </div>
                    </div>
                  )}

                  
                </div>
              </div>
            </div>

            {/* Teatro Photos Grid */}
            {r.teatro_fotos && r.teatro_fotos.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-bold border-b pb-1.5 mb-4 uppercase tracking-wide text-slate-500">📸 Fotos do Teatro</h3>
                <div className="grid grid-cols-2 gap-4">
                  {r.teatro_fotos.map((f, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-xl p-2 bg-white flex flex-col items-center shadow-sm break-inside-auto">
                      {f.url ? (
                        <img src={f.url} alt={f.nome} className="h-40 w-full object-cover rounded-lg" />
                      ) : (
                        <div className="h-40 w-full bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-400">Sem imagem</div>
                      )}
                      <div className="w-full mt-2 px-1 flex items-center justify-between text-[10px]">
                        <span className="font-bold text-slate-800 uppercase tracking-wider">Foto {idx + 1}</span>
                        {f.descricao && <span className="text-slate-400 italic font-medium">{f.descricao}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Page Footer */}
          
        </div>

        {/* PAGE 4: OTHER LOCATIONS */}
        {r.automacoes?.outros_locais && r.automacoes.outros_locais.length > 0 && (
          <div className="mb-12 break-inside-auto">
            <div>
              

              {/* Outros Locais Details */}
              <div className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b pb-1">📍 Outros Locais da Turnê</h2>
                
                <div className="space-y-6">
                  {r.automacoes.outros_locais.map((ol, idx) => {
                    const geocoded = opState.customPlaces.find(cp => cp.address === ol.endereco);
                    const distanceVal = geocoded?.distance ?? 0;

                    return (
                      <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden break-inside-auto space-y-3">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-fuchsia-500" />
                        
                        <div className="pl-2 flex justify-between items-start gap-4">
                          <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">{ol.nome}</h3>
                          {distanceVal > 0 && (
                            <span className="text-[10px] bg-fuchsia-50 text-fuchsia-700 px-2 py-0.5 rounded-full font-bold font-sans">
                              📍 {distanceVal < 1000 ? `${Math.round(distanceVal)}m` : `${(distanceVal / 1000).toFixed(1)}km`} do hotel
                            </span>
                          )}
                        </div>
                        
                        <div className="pl-2 text-xs space-y-1.5">
                          {ol.endereco && <div><span className="font-semibold text-slate-400">Endereço:</span> <span className="text-slate-700">{ol.endereco}</span></div>}
                          <div className="grid grid-cols-2 gap-4">
                            {ol.telefone && <div><span className="font-semibold text-slate-400">E-mail:</span> <span className="text-slate-700">{ol.telefone}</span></div>}
                            {ol.site && <div><span className="font-semibold text-slate-400">Site:</span> <span className="text-slate-700">{ol.site}</span></div>}
                          </div>
                          {ol.observacoes && <div className="border-t pt-2 mt-2"><span className="font-semibold text-slate-400 block mb-0.5">Observações:</span> <p className="text-slate-600 italic leading-relaxed">{ol.observacoes}</p></div>}
                        </div>

                        {/* Location Photos */}
                        {ol.fotos && ol.fotos.length > 0 && (
                          <div className="grid grid-cols-2 gap-4 mt-3 pl-2">
                            {ol.fotos.map((f, fIdx) => (
                              <div key={fIdx} className="border border-slate-100 rounded-lg p-1.5 bg-slate-50 flex flex-col items-center">
                                {f.url ? (
                                  <img src={f.url} alt={f.nome} className="h-28 w-full object-cover rounded-md" />
                                ) : (
                                  <div className="h-28 w-full bg-slate-200 rounded-md flex items-center justify-center text-xs text-slate-400">Sem imagem</div>
                                )}
                                <div className="w-full mt-1.5 px-0.5 flex justify-between items-center text-[9px]">
                                  <span className="font-bold text-slate-700 uppercase tracking-wide">{f.categoria || "Geral"}</span>
                                  {f.descricao && <span className="text-slate-400 italic">{f.descricao}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Apoio places (Farmácia, Hospital, Mercado) */}
                {opState.places.length > 0 && (
                  <div className="space-y-4 mt-6">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b pb-1">📍 Locais de Apoio</h2>
                    <div className="grid grid-cols-2 gap-4">
                      {opState.places.map((p, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm break-inside-auto relative overflow-hidden">
                          <div className={`absolute top-0 left-0 w-1.5 h-full ${p.type === "pharmacy" ? "bg-[#10b981]" : p.type === "supermarket" ? "bg-[#f59e0b]" : p.type === "restaurant" ? "bg-rose-500" : p.type === "shopping" ? "bg-sky-500" : "bg-[#8b5cf6]"}`} />
                          <div className="pl-1.5">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                                {p.type === "pharmacy" ? "Farmácia" : p.type === "supermarket" ? "Mercado" : p.type === "restaurant" ? "Restaurante" : p.type === "shopping" ? "Shopping" : "Hospital"} {p.assoc === "hotel" ? "(Perto do Hotel)" : p.assoc === "theater" ? "(Perto do Teatro)" : ""}
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-800 text-xs mb-0.5">{p.name}</h4>
                            <p className="text-[10px] text-slate-500">{p.address}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Page Footer */}
            
          </div>
        )}

        {/* PAGE 5: ADDITIONAL DETAILS (Contacts, Festival info, Documents) */}
        {(r.producao_nome || r.producao_whatsapp || r.producao_telefone || r.receptivo_nome || r.receptivo_whatsapp || r.receptivo_telefone || r.outros_contatos.length > 0 || hasFestivalInfo || r.documentos.length > 0) && (
          <div className="mb-12 break-inside-auto">
            <div>
              

              <div className="space-y-6">
                {/* Contatos Section */}
                {(r.producao_nome || r.receptivo_nome || r.outros_contatos.length > 0) && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b pb-1">👥 Contatos da Turnê</h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {(r.producao_nome || r.producao_telefone || r.producao_whatsapp) && (
                        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-slate-800" />
                          <div className="pl-1.5 space-y-0.5">
                            <div className="font-bold text-[10px] uppercase text-slate-400">Produção</div>
                            <div className="font-bold text-slate-800">{r.producao_nome || "—"}</div>
                            {r.producao_telefone && <div>E-mail: <span className="text-slate-600">{r.producao_telefone}</span></div>}
                            {r.producao_whatsapp && <div>WhatsApp: <a href={`https://wa.me/${onlyDigits(r.producao_whatsapp)}`} target="_blank" className="text-slate-600 underline">{r.producao_whatsapp}</a></div>}
                          </div>
                        </div>
                      )}

                      {(r.receptivo_nome || r.receptivo_telefone || r.receptivo_whatsapp) && (
                        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-slate-800" />
                          <div className="pl-1.5 space-y-0.5">
                            <div className="font-bold text-[10px] uppercase text-slate-400">Receptivo Local</div>
                            <div className="font-bold text-slate-800">{r.receptivo_nome || "—"}</div>
                            {r.receptivo_telefone && <div>E-mail: <span className="text-slate-600">{r.receptivo_telefone}</span></div>}
                            {r.receptivo_whatsapp && <div>WhatsApp: <a href={`https://wa.me/${onlyDigits(r.receptivo_whatsapp)}`} target="_blank" className="text-slate-600 underline">{r.receptivo_whatsapp}</a></div>}
                          </div>
                        </div>
                      )}

                      {r.outros_contatos.map((c, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-slate-800" />
                          <div className="pl-1.5 space-y-0.5">
                            <div className="font-bold text-[10px] uppercase text-slate-400">{c.funcao || "Contato"}</div>
                            <div className="font-bold text-slate-800">{c.nome || "—"}</div>
                            {c.telefone && <div>E-mail: <span className="text-slate-600">{c.telefone}</span></div>}
                            {c.whatsapp && <div>WhatsApp: <a href={`https://wa.me/${onlyDigits(c.whatsapp)}`} target="_blank" className="text-slate-600 underline">{c.whatsapp}</a></div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Festival / Comunicação Section */}
                {hasFestivalInfo && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b pb-1">🎪 Festival e Comunicação</h3>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-xs space-y-2">
                      {r.festival && <div className="font-bold text-slate-800 text-sm">{r.festival}</div>}
                      <div className="grid grid-cols-2 gap-2 text-slate-700">
                        {fiSite && <div><span className="font-semibold text-slate-400">Site:</span> {fiSite}</div>}
                        {fiInstagram && <div><span className="font-semibold text-slate-400">Instagram:</span> {fiInstagram}</div>}
                        {fi.redes && <div className="col-span-2"><span className="font-semibold text-slate-400">Outras Redes:</span> {fi.redes}</div>}
                        {fi.programacao_oficial && <div className="col-span-2"><span className="font-semibold text-slate-400">Programação Oficial:</span> {fi.programacao_oficial}</div>}
                        {fi.observacoes && <div className="col-span-2 border-t pt-2 mt-1 italic text-slate-500">Observações: {fi.observacoes}</div>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Documentos Section */}
                {r.documentos && r.documentos.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b pb-1">📁 Documentos Técnicos</h3>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-xs">
                      <p className="text-slate-400 mb-2 italic">Acesse a versão online do Road Book para abrir e baixar estes arquivos:</p>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                        {r.documentos.map((doc, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-slate-700 border-b border-slate-50 pb-1">
                            <span className="text-slate-400 font-bold shrink-0">·</span>
                            <span className="truncate font-medium">{doc.nome}</span>
                            <span className="text-[10px] text-slate-400 uppercase">({doc.tipo?.split("/")[1] || "PDF"})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Page Footer */}
            
          </div>
        )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* LIGHTBOX */}
      {lightbox && lightbox.item && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in group/lb"
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
            aria-label="Fechar"
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10 z-10"
          >
            <X className="size-5" />
          </button>
          
          {lightbox.allItems && lightbox.allItems.length > 1 && (
             <>
                <button 
                  type="button" 
                  onClick={(e) => {
                     e.stopPropagation();
                     setLightbox(prev => {
                        if (!prev || !prev.allItems) return prev;
                        const prevIdx = (prev.index! - 1 + prev.allItems.length) % prev.allItems.length;
                        return { item: prev.allItems[prevIdx], allItems: prev.allItems, index: prevIdx };
                     });
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/50 hover:text-white hover:bg-black/50 rounded-full transition-all z-10 md:opacity-0 md:group-hover/lb:opacity-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <button 
                  type="button" 
                  onClick={(e) => {
                     e.stopPropagation();
                     setLightbox(prev => {
                        if (!prev || !prev.allItems) return prev;
                        const nextIdx = (prev.index! + 1) % prev.allItems.length;
                        return { item: prev.allItems[nextIdx], allItems: prev.allItems, index: nextIdx };
                     });
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/50 hover:text-white hover:bg-black/50 rounded-full transition-all z-10 md:opacity-0 md:group-hover/lb:opacity-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
             </>
          )}

          {lightbox.item.url && (
            lightbox.item.tipo?.startsWith("application/pdf") || lightbox.item.nome?.toLowerCase().endsWith(".pdf") ? (
              <iframe
                src={lightbox.item.url}
                title={lightbox.item.nome}
                onClick={(e) => e.stopPropagation()}
                className="w-full h-full max-w-4xl max-h-[85vh] bg-white rounded-md shadow-2xl border-none"
              />
            ) : (
              <img
                src={lightbox.item.url}
                alt={lightbox.item.nome}
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
    <div className="rounded-lg border p-4 bg-card space-y-2 overflow-hidden break-words">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      {name && <div className="font-semibold text-base text-card-foreground">{name}</div>}
      
      {telefone && (
        <div className="text-sm flex items-center gap-2">
          <span className="text-muted-foreground text-xs">E-mail:</span>
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

function FlightSection({ ida, volta, onOpenImage }: { ida: Voo; volta: Voo; onOpenImage: (item: any, all: any[], index: number) => void }) {
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

function FlightCard({ title, voo, onOpenImage }: { title: string; voo: Voo; onOpenImage: (item: any, all: any[], index: number) => void }) {
  const pax = voo.passageiros ?? [];
  const passes = voo.cartoes_embarque ?? [];
  return (
    <div className="rounded-lg border p-4 bg-card space-y-3 overflow-hidden break-words">
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
        {voo.hora && <InfoCell label="Hora de Partida" value={voo.hora} />}
        {voo.horario_chegada && <InfoCell label="Horário de Chegada" value={voo.horario_chegada} />}
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
                    onClick={() => onOpenImage({ url: c.url, nome: c.nome, tipo: c.tipo }, passes, i)}
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
                    onClick={() => onOpenImage({ url: c.url, nome: c.nome, tipo: c.tipo }, passes, i)}
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
      {voo.outras_informacoes && (
        <div className="text-sm mt-3 pt-3 border-t">
          <div className="font-semibold mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Outras informações</div>
          <div className="whitespace-pre-wrap">{voo.outras_informacoes}</div>
        </div>
      )}
      {(voo.outras_informacoes_fotos?.length ?? 0) > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Outras informações (fotos)</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {voo.outras_informacoes_fotos!.map((f, idx_f) => (
                <button 
                  key={idx_f} 
                  type="button" 
                  onClick={() => onOpenImage(f, voo.outras_informacoes_fotos || [], idx_f)} 
                  className="block relative aspect-video rounded overflow-hidden border bg-muted hover:opacity-90 transition-opacity"
                >
                  <img src={f.url} alt={f.nome} className="w-full h-full object-cover" />
                </button>
              ))}
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

function PhotoGallery({ fotos, label, categorias, onOpen }: { fotos: Foto[]; label: string; categorias: readonly string[]; onOpen: (f: Foto, all: any[], index: number) => void }) {
  if (!fotos || fotos.length === 0) return null;

  const [activeCategory, setActiveCategory] = useState<string>("Todas");

  // Map photos to normalize categories
  const normalizedPhotos = useMemo(() => {
    return fotos.map((f, i) => {
      const isOutros = !categorias.includes(f.categoria) || f.categoria === "Outros";
      return {
        ...f,
        displayCategory: `Foto ${i + 1}`
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
            onClick={() => onOpen(f, filteredPhotos, i)}
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
function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    if (isDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [isDark]);
  return (
    <button onClick={() => setIsDark(!isDark)} className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform">
      {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}
function PrintHeader({ title, isFirstPage = false, logoUrl }: { title: string; isFirstPage?: boolean; logoUrl?: string }) {
  if (isFirstPage) {
    return (
      <div className="flex flex-col items-center justify-center border-b pb-6 mb-8 pt-4 gap-4">
        {logoUrl ? (
          <div className="flex items-center justify-center gap-6">
            <img src="/logo-seven.png" alt="Seven Produções" className="h-16 w-auto object-contain" />
            <div className="w-px h-12 bg-slate-300"></div>
            <img src={logoUrl} alt="Logo do Espetáculo" className="h-16 w-auto object-contain" />
          </div>
        ) : (
          <img src="/logo-seven.png" alt="Seven Produções" className="h-16 w-auto object-contain" />
        )}
        <div className="text-center font-sans mt-2">
          <span className="block text-[10px] font-extrabold uppercase tracking-[0.25em] text-slate-400">Guia de Turnê</span>
          <span className="block text-2xl font-black uppercase tracking-wide text-slate-800 leading-tight">{title}</span>
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-between items-center border-b pb-4 mb-6">
      <img src="/logo-seven.png" alt="Seven Produções" className="h-12 w-auto object-contain" />
      <div className={`text-right font-sans ${logoUrl ? '' : 'flex-1'} ml-4`}>
        <span className="block text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">Guia de Turnê</span>
        <span className="block text-base font-black uppercase tracking-wide text-slate-700">{title}</span>
      </div>
      {logoUrl && (
        <div className="ml-6 border-l border-slate-200 pl-6">
          <img src={logoUrl} alt="Logo" className="h-12 w-auto object-contain" />
        </div>
      )}
    </div>
  );
}

function PrintFooter() {
  return (
    <div className="flex justify-between items-center text-[9px] text-slate-400 border-t border-slate-200/60 pt-3 mt-6">
      <div className="flex flex-col gap-0.5">
        <strong className="font-sans font-bold tracking-widest uppercase text-slate-500">Gestão de Viagens e Turnês</strong>
        <span className="font-sans font-medium text-slate-400">Desenvolvido por Marcelo Garuffi - Contemporânea produção de eventos</span>
      </div>
      <div className="flex items-center justify-center relative size-7 shrink-0 bg-slate-200 rounded-full">
        <span className="relative z-10 text-[10px] font-bold text-slate-600 leading-none print-page-number"></span>
      </div>
    </div>
  );
}

function cleanCityName(s: string): string {
  if (!s) return "";
  return s.replace(/aeroporto\s+de/i, "")
          .replace(/aeroporto/i, "")
          .replace(/internacional/i, "")
          .replace(/\([A-Z]{3}\)/g, "")
          .split("-")[0]
          .split(",")[0]
          .trim();
}

function PrintWeatherSummaryCard({ city, date }: { city: string; date: string }) {
  const [weather, setWeather] = useState<{ max: number; min: number; rain: number; wind: number } | null>(null);

  useEffect(() => {
    if (!city || !date) return;
    let cancel = false;
    (async () => {
      try {
        const cleaned = cleanCityName(city);
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleaned)}&count=1&language=pt&format=json`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();
        const p = geoData?.results?.[0];
        if (!p) return;

        const { latitude, longitude } = p;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=auto&start_date=${date}&end_date=${date}`;
        const res = await fetch(url);
        const j = await res.json();
        if (cancel) return;

        setWeather({
          max: Math.round(j?.daily?.temperature_2m_max?.[0] ?? 0),
          min: Math.round(j?.daily?.temperature_2m_min?.[0] ?? 0),
          rain: Math.round(j?.daily?.precipitation_probability_max?.[0] ?? 0),
          wind: Math.round(j?.daily?.wind_speed_10m_max?.[0] ?? 0),
        });
      } catch {}
    })();
    return () => { cancel = true; };
  }, [city, date]);

  if (!weather) return null;

  return (
    <div className="border border-gray-300 p-4 rounded bg-white text-xs w-48 font-sans shadow-sm leading-normal">
      <div className="font-bold border-b border-gray-200 pb-1 mb-2 text-sm text-gray-800">{cleanCityName(city)}</div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-2xl font-bold text-gray-900">{weather.max}°C</span>
        <span className="text-sm text-gray-500 font-semibold">{weather.min}°C</span>
      </div>
      <div className="text-gray-600 space-y-1 font-medium">
        <div>🌧️ Chuva: {weather.rain}%</div>
        <div>💨 Vento: {weather.wind} km/h</div>
      </div>
    </div>
  );
}

function PrintDayWeather({ date }: { date: string }) {
  const geo = useContext(GeoContext);
  const [weatherText, setWeatherText] = useState<string>("...");

  useEffect(() => {
    if (geo.status !== "ok" || !date) return;
    let cancel = false;
    (async () => {
      try {
        const { latitude, longitude } = geo.place;
        const [y, m, d] = date.split("-").map(Number);
        const target = new Date(Date.UTC(y, m - 1, d));
        const today = new Date();
        const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
        const diff = daysBetween(todayUTC, target);

        if (diff >= -1 && diff <= 15) {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&start_date=${date}&end_date=${date}`;
          const res = await fetch(url);
          const j = await res.json();
          if (cancel) return;
          const max = Math.round(j?.daily?.temperature_2m_max?.[0] ?? 0);
          const min = Math.round(j?.daily?.temperature_2m_min?.[0] ?? 0);
          const rain = Math.round(j?.daily?.precipitation_probability_max?.[0] ?? 0);
          setWeatherText(`${max}°C / ${min}°C · ${rain}% chuva`);
        } else {
          const mm = String(target.getUTCMonth() + 1).padStart(2, "0");
          const dd = String(target.getUTCDate()).padStart(2, "0");
          const baseYear = todayUTC.getUTCFullYear() - 1;
          const years = [0, 1, 2, 3, 4].map(y => baseYear - y);
          const results = await Promise.all(years.map(async (yr) => {
            const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&start_date=${yr}-${mm}-${dd}&end_date=${yr}-${mm}-${dd}`;
            const r = await fetch(url);
            if (!r.ok) return null;
            const jj = await r.json();
            return { max: jj?.daily?.temperature_2m_max?.[0], min: jj?.daily?.temperature_2m_min?.[0], precip: jj?.daily?.precipitation_sum?.[0] };
          }));
          if (cancel) return;
          const valid = results.filter((x): x is any => !!x);
          if (valid.length > 0) {
            const max = Math.round(valid.reduce((acc, v) => acc + v.max, 0) / valid.length);
            const min = Math.round(valid.reduce((acc, v) => acc + v.min, 0) / valid.length);
            const rainShare = valid.filter(v => v.precip > 1).length / valid.length;
            setWeatherText(`Clima Histórico: ${max}°C / ${min}°C · ${Math.round(rainShare * 100)}% chuva`);
          } else {
            setWeatherText("");
          }
        }
      } catch {
        setWeatherText("");
      }
    })();
    return () => { cancel = true; };
  }, [date, geo]);

  if (!weatherText || weatherText === "...") return null;
  return <span className="text-xs text-muted-foreground ml-3 font-normal font-sans">({weatherText})</span>;
}

// ============ Hourly Weather Cache & Component ============
const hourlyWeatherCache: { [date: string]: Promise<{ temp: number[]; code: number[] }> } = {};

function fetchHourlyWeather(latitude: number, longitude: number, date: string): Promise<{ temp: number[]; code: number[] }> {
  if (hourlyWeatherCache[date]) return hourlyWeatherCache[date];

  const promise = (async () => {
    const [y, m, d] = date.split("-").map(Number);
    const target = new Date(Date.UTC(y, m - 1, d));
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const diff = daysBetween(todayUTC, target);

    if (diff >= -1 && diff <= 15) {
      // Forecast
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
        `&hourly=temperature_2m,weathercode` +
        `&timezone=auto&start_date=${date}&end_date=${date}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("http forecast hourly " + res.status);
      const j = await res.json();
      const temp = j?.hourly?.temperature_2m ?? [];
      const code = j?.hourly?.weathercode ?? [];
      return { temp, code };
    } else {
      // Historical average: last 5 years, same month/day
      const mm = String(target.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(target.getUTCDate()).padStart(2, "0");
      const baseYear = todayUTC.getUTCFullYear() - 1;
      const years = [0, 1, 2, 3, 4].map((i) => baseYear - i);

      const results = await Promise.all(years.map(async (yr) => {
        const iso = `${yr}-${mm}-${dd}`;
        const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}` +
          `&hourly=temperature_2m,weathercode` +
          `&timezone=auto&start_date=${iso}&end_date=${iso}`;
        const r = await fetch(url);
        if (!r.ok) return null;
        const jj = await r.json();
        return {
          temp: jj?.hourly?.temperature_2m ?? [],
          code: jj?.hourly?.weathercode ?? [],
        };
      }));

      const temp: number[] = Array(24).fill(0);
      const code: number[] = Array(24).fill(0);

      for (let hour = 0; hour < 24; hour++) {
        const tempsForHour = results
          .map(r => r?.temp?.[hour])
          .filter(t => typeof t === "number") as number[];
        const codesForHour = results
          .map(r => r?.code?.[hour])
          .filter(c => typeof c === "number") as number[];

        if (tempsForHour.length > 0) {
          temp[hour] = Math.round(tempsForHour.reduce((a, b) => a + b, 0) / tempsForHour.length);
        } else {
          temp[hour] = NaN;
        }

        if (codesForHour.length > 0) {
          code[hour] = codesForHour[0];
        } else {
          code[hour] = 0;
        }
      }

      return { temp, code };
    }
  })();

  hourlyWeatherCache[date] = promise;
  return promise;
}

function getWeatherEmoji(code: number) {
  if (code === 0) return "☀️"; // Clear
  if (code === 1 || code === 2) return "⛅"; // Partly cloudy
  if (code === 3) return "☁️"; // Overcast
  if (code === 45 || code === 48) return "🌫️"; // Fog
  if (code === 51 || code === 53 || code === 55) return "🌦️"; // Drizzle
  if (code === 61 || code === 63 || code === 65) return "🌧️"; // Rain
  if (code === 71 || code === 73 || code === 75) return "❄️"; // Snow
  if (code === 80 || code === 81 || code === 82) return "🌧️"; // Rain showers
  if (code === 95 || code === 96 || code === 99) return "⛈️"; // Thunderstorm
  return "☀️";
}

function HourWeather({ date, time }: { date: string; time: string }) {
  const geo = useContext(GeoContext);
  const [data, setData] = useState<{ temp: number; code: number } | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "ok">("loading");

  useEffect(() => {
    if (geo.status === "loading") { setStatus("loading"); return; }
    if (geo.status === "error") { setStatus("error"); return; }
    if (!time) { setStatus("error"); return; }

    let cancel = false;
    (async () => {
      try {
        const { latitude, longitude } = geo.place;
        const res = await fetchHourlyWeather(latitude, longitude, date);
        if (cancel) return;

        const hourMatch = time.match(/^(\d{1,2})/);
        const hour = hourMatch ? parseInt(hourMatch[1], 10) : 12;

        const tempVal = res.temp[hour];
        const codeVal = res.code[hour];

        if (typeof tempVal === "number" && !isNaN(tempVal)) {
          setData({ temp: tempVal, code: codeVal ?? 0 });
          setStatus("ok");
        } else {
          setStatus("error");
        }
      } catch {
        if (!cancel) setStatus("error");
      }
    })();

    return () => { cancel = true; };
  }, [date, time, geo]);

  if (status === "loading") return <span className="text-[10px] text-muted-foreground/50">...</span>;
  if (status === "error" || !data) return null;

  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/80 font-sans font-medium bg-muted/40 px-1.5 py-0.5 rounded shadow-sm shrink-0 border border-muted-foreground/10">
      <span>{getWeatherEmoji(data.code)}</span>
      <span>{data.temp}°C</span>
    </span>
  );
}

function getDayOfWeekAbbrev(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayNames = ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."];
  return dayNames[date.getUTCDay()];
}

function PrintWeatherForecastCard({ date }: { date: string }) {
  const geo = useContext(GeoContext);
  const [data, setData] = useState<DayData>({ status: "loading" });

  const target = useMemo(() => {
    const [y, m, d] = (date || "").split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(Date.UTC(y, m - 1, d));
  }, [date]);

  useEffect(() => {
    if (geo.status !== "ok" || !target) return;
    let cancel = false;
    (async () => {
      const { latitude, longitude } = geo.place;
      const today = new Date();
      const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      const diff = daysBetween(todayUTC, target);
      try {
        if (diff >= -1 && diff <= 15) {
          const iso = date;
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&start_date=${iso}&end_date=${iso}`;
          const res = await fetch(url);
          if (!res.ok) throw new Error();
          const j = await res.json();
          if (cancel) return;
          setData({
            status: "ok", kind: "forecast",
            maxC: Math.round(j?.daily?.temperature_2m_max?.[0] ?? NaN),
            minC: Math.round(j?.daily?.temperature_2m_min?.[0] ?? NaN),
            rainPct: j?.daily?.weathercode?.[0] ?? 0,
          });
        } else {
          const mStr = String(target.getUTCMonth() + 1).padStart(2, "0");
          const dStr = String(target.getUTCDate()).padStart(2, "0");
          const baseYear = todayUTC.getUTCFullYear() - 1;
          const years = [0, 1, 2, 3, 4].map((i) => baseYear - i);
          const results = await Promise.all(years.map(async (yr) => {
            const iso = `${yr}-${mStr}-${dStr}`;
            const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&start_date=${iso}&end_date=${iso}`;
            const r = await fetch(url);
            if (!r.ok) return null;
            const jj = await r.json();
            return {
              max: jj?.daily?.temperature_2m_max?.[0],
              min: jj?.daily?.temperature_2m_min?.[0],
              code: jj?.daily?.weathercode?.[0],
            };
          }));
          if (cancel) return;
          const valid = results.filter((x): x is { max: number; min: number; code: number } =>
            !!x && typeof x.max === "number" && typeof x.min === "number");
          if (valid.length === 0) throw new Error();
          const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
          const maxC = Math.round(avg(valid.map((v) => v.max)));
          const minC = Math.round(avg(valid.map((v) => v.min)));
          const code = valid[0]?.code ?? 0;
          setData({ status: "ok", kind: "historical", maxC, minC, rainPct: code });
        }
      } catch {
        if (!cancel) setData({ status: "error", message: "Erro" });
      }
    })();
    return () => { cancel = true; };
  }, [date, geo, target]);

  if (data.status === "loading") {
    return (
      <div className="flex-1 min-w-[50px] border border-slate-200/60 rounded-lg p-2 bg-slate-50/50 flex flex-col items-center justify-center text-[9px] text-slate-400 font-sans">
        <span>{getDayOfWeekAbbrev(date)}</span>
        <span className="animate-pulse">...</span>
      </div>
    );
  }
  if (data.status === "error") return null;

  return (
    <div className="flex-1 min-w-[50px] border border-slate-200 rounded-lg p-2 bg-white flex flex-col items-center justify-center font-sans shadow-sm text-center">
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">{getDayOfWeekAbbrev(date)}</span>
      <span className="text-xl mb-1">{getWeatherEmoji(data.rainPct)}</span>
      <span className="text-[10px] font-black text-slate-700 tracking-tighter">
        {isFinite(data.maxC) ? `${data.maxC}°` : "—"} {isFinite(data.minC) ? `${data.minC}°` : "—"}
      </span>
    </div>
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
  type: "pharmacy" | "supermarket" | "hospital" | "restaurant" | "shopping";
  assoc: "hotel" | "theater" | "general" | string;
}

function OperationalMap({
  hotelNome,
  teatroNome,
  hotelCoords,
  teatroCoords,
  places,
  customPlaces = [],
  outrosLocais = [],
}: {
  hotelNome: string;
  teatroNome: string;
  hotelCoords: [number, number] | null;
  teatroCoords: [number, number] | null;
  places: PlaceDetail[];
  customPlaces?: CustomPlaceDetail[];
  outrosLocais?: any[];
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

      const hotelSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 100%; height: 100%;"><path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9" /><circle cx="9" cy="11" r="2" /></svg>`;
      const theaterSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 100%; height: 100%;"><path d="M3 14c0 2 2 3.5 4.5 3.5s4.5-1.5 4.5-3.5V6c0-2-2-3.5-4.5-3.5S3 4 3 6v8z" fill="currentColor" fill-opacity="0.1"/><path d="M5.5 8h.01M8.5 8h.01" stroke-width="2.5" /><path d="M6 12c.5 1 2.5 1 3 0" /><path d="M12 17.5c0 2 2 3.5 4.5 3.5s4.5-1.5 4.5-3.5V9.5c0-2-2-3.5-4.5-3.5s-4.5 1.5-4.5 3.5v8z" fill="#ffffff" stroke="currentColor"/><path d="M14 11.5h.01M18 11.5h.01" stroke-width="2.5" /><path d="M15 16.5c.5-1 2.5-1 3 0" /></svg>`;
      const pharmacySvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 100%; height: 100%;"><path d="M6 18V9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v9" /><path d="M9 3h6v4H9V3z" /><path d="M12 10v4M10 12h4" /><rect x="13" y="15" width="6" height="3" rx="1.5" transform="rotate(30 13 15)" /></svg>`;
      const supermarketSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 100%; height: 100%;"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>`;
      const hospitalSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 100%; height: 100%;"><path d="M3 21h18" /><path d="M5 21V9a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v12" /><path d="M9 21v-4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4" /><path d="M12 10v4M10 12h4" stroke-width="2.5" /></svg>`;
      const notebookSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 100%; height: 100%;"><rect x="3" y="3" width="18" height="11" rx="2" /><path d="M7 14l-3 6M17 14l3 6M10 20h4" /><path d="M7 7h10M7 10h5" /></svg>`;
      const brainSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 100%; height: 100%;"><path d="M9 22H8a4 4 0 0 1-4-4V12a8 8 0 0 1 15.66-2.31 4 4 0 0 1 1.6 6.31 4 4 0 0 1-3.26 6z" /><path d="M9.5 9.5a2 2 0 1 1 3 0c.5.5.5 1.5 0 2M8.5 7a3 3 0 0 1 6 0" /></svg>`;
      const exchangeSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 100%; height: 100%;"><circle cx="7" cy="8" r="3" /><circle cx="17" cy="8" r="3" /><path d="M10 5a5 5 0 0 1 4 0" /><path d="M13 3l2 2-2 2" /><path d="M14 11a5 5 0 0 1-4 0" /><path d="M11 13l-2-2 2-2" /><path d="M4 17a3 3 0 0 0 6 0M14 17a3 3 0 0 0 6 0" /></svg>`;
      const defaultSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>`;

      const createMarkerIcon = (color: string, type: string) => {
        let iconSvg = defaultSvg;
        if (type === "hotel") iconSvg = hotelSvg;
        else if (type === "theater") iconSvg = theaterSvg;
        else if (type === "pharmacy") iconSvg = pharmacySvg;
        else if (type === "supermarket") iconSvg = supermarketSvg;
        else if (type === "hospital") iconSvg = hospitalSvg;
        else if (type === "oficina") iconSvg = notebookSvg;
        else if (type === "pensamento") iconSvg = brainSvg;
        else if (type === "intercambio") iconSvg = exchangeSvg;

        return L.divIcon({
          html: `
            <div style="position: relative; width: 36px; height: 42px;">
              <svg width="36" height="42" viewBox="0 0 36 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.35));">
                <path d="M18 0C8.06 0 0 8.06 0 18C0 29.25 18 42 18 42C18 42 36 29.25 36 18C36 8.06 27.94 0 18 0Z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/>
                <circle cx="18" cy="18" r="13" fill="#ffffff" fill-opacity="0.95"/>
              </svg>
              <div style="position: absolute; top: 8px; left: 8px; color: ${color}; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">
                ${iconSvg}
              </div>
            </div>
          `,
          className: "custom-leaflet-icon",
          iconSize: [36, 42],
          iconAnchor: [18, 42],
          popupAnchor: [0, -42],
        });
      };

      // Prepare all markers to place
      type MarkerItem = {
        lat: number;
        lon: number;
        color: string;
        type: string;
        popupHtml: string;
      };

      const markersToRender: MarkerItem[] = [];

      if (hotelCoords) {
        markersToRender.push({
          lat: hotelCoords[0],
          lon: hotelCoords[1],
          color: "#3b82f6", // Blue
          type: "hotel",
          popupHtml: `<b>Hotel:</b> ${hotelNome}`,
        });
      }

      if (teatroCoords) {
        markersToRender.push({
          lat: teatroCoords[0],
          lon: teatroCoords[1],
          color: "#ef4444", // Red
          type: "theater",
          popupHtml: `<b>Teatro:</b> ${teatroNome}`,
        });
      }

      places.forEach(p => {
        let color = "#10b981";
        if (p.type === "supermarket") color = "#f59e0b";
        if (p.type === "hospital") color = "#8b5cf6";
        if (p.type === "restaurant") color = "#f43f5e";
        if (p.type === "shopping") color = "#0ea5e9";

        markersToRender.push({
          lat: p.lat,
          lon: p.lon,
          color,
          type: p.type,
          popupHtml: `<b>${p.name}</b><br/>${p.type === "pharmacy" ? "Farmácia" : p.type === "supermarket" ? "Supermercado" : p.type === "restaurant" ? "Restaurante" : p.type === "shopping" ? "Shopping" : "Hospital"}`,
        });
      });

      const getCustomIconType = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes("oficina")) return "oficina";
        if (n.includes("pensamento")) return "pensamento";
        if (n.includes("intercâmbio") || n.includes("intercambio")) return "intercambio";
        return "default";
      };

      customPlaces.forEach(p => {
        markersToRender.push({
          lat: p.lat,
          lon: p.lon,
          color: "#d946ef", // Fuchsia for custom locations
          type: getCustomIconType(p.name),
          popupHtml: `<b>${p.name}</b><br/>${p.address}`,
        });
      });

      // Group and shift overlapping markers
      const coordGroups: { [key: string]: MarkerItem[] } = {};
      markersToRender.forEach(m => {
        const key = `${m.lat.toFixed(6)},${m.lon.toFixed(6)}`;
        if (!coordGroups[key]) coordGroups[key] = [];
        coordGroups[key].push(m);
      });

      Object.values(coordGroups).forEach(group => {
        if (group.length === 1) return;
        const N = group.length;
        const radius = 0.00015; // Offset distance in degrees (approx 15m)
        group.forEach((m, idx) => {
          const angle = (2 * Math.PI * idx) / N;
          m.lat = m.lat + Math.cos(angle) * radius;
          m.lon = m.lon + Math.sin(angle) * radius;
        });
      });

      // Render all markers
      markersToRender.forEach(m => {
        L.marker([m.lat, m.lon], { icon: createMarkerIcon(m.color, m.type) })
          .bindPopup(m.popupHtml)
          .addTo(markers);
      });

      markers.addTo(map);

      if (markers.getBounds().isValid()) {
        map.fitBounds(markers.getBounds().pad(0.1));
      }

      setTimeout(() => {
        if (active && mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 200);
    });

    return () => {
      active = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [hotelCoords, teatroCoords, places, customPlaces]);


  const getTypeLabel = (t: string) => {
    if (t === "pharmacy") return "Farmácia";
    if (t === "supermarket") return "Supermercado / Hortifruti";
    if (t === "restaurant") return "Restaurante";
    if (t === "shopping") return "Shopping Center";
    return "Hospital de referência";
  };

  const getAssocLabel = (p: PlaceDetail) => {
    if (p.assoc === "hotel") return "próximo ao hotel";
    if (p.assoc === "theater") return "próximo ao teatro";
    if (typeof p.assoc === "string" && p.assoc.startsWith("custom_")) {
      const idx = parseInt(p.assoc.split("_")[1]);
      const name = outrosLocais?.[idx]?.nome || "local";
      return `próximo a: ${name}`;
    }
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
                  p.type === "pharmacy" ? "bg-[#10b981]" : p.type === "supermarket" ? "bg-[#f59e0b]" : p.type === "restaurant" ? "bg-rose-500" : p.type === "shopping" ? "bg-sky-500" : "bg-[#8b5cf6]"
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


function PublicPage() {
  const r = Route.useLoaderData() as ReturnType<typeof rowToRoadbook>;
  return <PublicRoadbookView r={r} />;
}
