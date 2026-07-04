import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMemo, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, CalendarDays, Clock, Users, Hotel, Moon, Sun } from "lucide-react";
import {
  rowToRoadbook, progTitle, progHora, TIPO_COLORS, getDaySummary,
  type ProgItem, type OutroContato
} from "@/lib/roadbook-types";

export const Route = createFileRoute("/_authenticated/versao-motorista/$slug")({
  ssr: false,
  loader: async ({ params }) => {
    const { data, error } = await supabase.from("roadbooks").select("*").eq("slug", params.slug).maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return rowToRoadbook(data);
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `Roteiro Motorista: ${loaderData.espetaculo} — ${loaderData.cidade}` : "Roteiro Motorista";
    return { meta: [
      { title }, { name: "description", content: title },
      { property: "og:title", content: title },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
    ] };
  },
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-8 text-center">
      <div><h1 className="text-2xl font-semibold">Road Book não encontrado</h1></div>
    </div>
  ),
  component: DriverPrintPage,
});


function AppleNumber({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 25 C48 15, 55 5, 60 5 C57 12, 53 18, 50 25" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 18 C58 12, 70 12, 72 15 C70 23, 58 23, 50 18" fill="#15803d" />
      <path d="M50 27 C40 25, 20 28, 15 48 C10 65, 25 88, 50 92 C75 88, 90 65, 85 48 C80 28, 60 25, 50 27 Z" fill="#dc2626" />
    </svg>
  );
}


function fmtDate(d: string | null | undefined) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function DriverPrintPage() {
  const rb = Route.useLoaderData();

  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    let wasDark = false;
    const handleBeforePrint = () => {
      setIsPrinting(true);
      wasDark = document.documentElement.classList.contains("dark");
      if (wasDark) document.documentElement.classList.remove("dark");
    };
    const handleAfterPrint = () => {
      setIsPrinting(false);
      if (wasDark) document.documentElement.classList.add("dark");
    };

    const mediaQueryList = window.matchMedia('print');
    const handleMediaQueryChange = (mql: MediaQueryListEvent) => {
      if (mql.matches) {
        handleBeforePrint();
      } else {
        handleAfterPrint();
      }
    };

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);
    mediaQueryList.addEventListener("change", handleMediaQueryChange);
    
    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
      mediaQueryList.removeEventListener("change", handleMediaQueryChange);
    };
  }, []);

  const dayGroups = useMemo(() => {
    const map = new Map<string, ProgItem[]>();
    rb.programacao.forEach((p) => {
      const k = p.data || "";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(p);
    });
    const keys = Array.from(map.keys()).sort((a, b) => {
      if (!a) return 1; if (!b) return -1; return a.localeCompare(b);
    });
    return keys.map((k) => ({ data: k, itens: map.get(k)!.sort((a,b) => (a.hora_inicio||"").localeCompare(b.hora_inicio||"")) }));
  }, [rb.programacao]);  return (
    <div style={{ padding: 40, background: "#fff", color: "#000" }}>
      <h1>Teste de Impressão</h1>
      <p>Se o retângulo cinza continuar aparecendo, o problema NÃO está nesta página.</p>
    </div>
  );
}
