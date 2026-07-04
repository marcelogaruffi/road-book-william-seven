import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  rowToRoadbook, progTitle, progHora, getDaySummary,
  type ProgItem
} from "@/lib/roadbook-types";

export const Route = createFileRoute("/motorista-print/$slug")({
  ssr: false,
  loader: async ({ params }) => {
    const { data, error } = await supabase.from("roadbooks").select("*").eq("slug", params.slug).maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return rowToRoadbook(data);
  },
  component: IsolatedPrintPage,
});

function fmtDate(d: string | null | undefined) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function IsolatedPrintPage() {
  const rb = Route.useLoaderData();

  // Print automatically and aggressively when mounted
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 500); // give images a bit of time to load
    return () => clearTimeout(timer);
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
  }, [rb.programacao]);

  return (
    <div style={{ fontFamily: "Arial, Helvetica, sans-serif", color: "black", backgroundColor: "white", padding: "20px" }}>
      <style>{`
        @page { margin: 0; }
        body { 
          margin: 0; 
          padding: 1.5cm; /* Compensa a margem 0 da page */
          background-color: white !important; 
        }
        @media print {
          @page {
            margin: 0;
            size: auto;
          }
          body {
            margin: 0;
            padding: 1.5cm;
          }
          #print-header { display: block; position: fixed; top: 1cm; left: 1.5cm; right: 1.5cm; font-size: 10px; color: #888; border-bottom: 1px solid #ccc; }
          #print-footer { display: block; position: fixed; bottom: 1cm; left: 1.5cm; right: 1.5cm; font-size: 10px; color: #888; border-top: 1px solid #ccc; text-align: center; }
        }
        .motorista-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .motorista-table th, .motorista-table td {
          border-bottom: 1px solid #ccc;
          padding: 10px;
          text-align: left;
          vertical-align: top;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .motorista-table th {
          background-color: #f0f0f0 !important;
          font-weight: bold;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .day-header {
          background-color: #333 !important;
          color: white !important;
          padding: 10px 15px;
          font-weight: bold;
          font-size: 16px;
          margin-top: 30px;
          margin-bottom: 0px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          page-break-after: avoid;
          break-after: avoid;
        }
      `}</style>
      
      {/* HEADER LIMPO E SECO */}
      <div style={{ borderBottom: '2px solid black', paddingBottom: '15px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {rb.espetaculo_logo_url ? (
          <img src={rb.espetaculo_logo_url} alt={rb.espetaculo} style={{ height: '60px', objectFit: 'contain' }} />
        ) : (
          <div style={{ width: '60px' }}></div>
        )}
        
        <div style={{ textAlign: 'center', flex: 1, padding: '0 20px' }}>
          <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#555', textTransform: 'uppercase', letterSpacing: '2px' }}>Roteiro Motorista</p>
          <h1 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: '900', textTransform: 'uppercase' }}>{rb.espetaculo}</h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#333' }}>
            {rb.cidade && <span>{rb.cidade}{rb.estado ? `/${rb.estado}` : ""}</span>}
            {rb.cidade && (rb.data_inicial || rb.data_final) && <span> • </span>}
            {(rb.data_inicial || rb.data_final) && (
              <span>{fmtDate(rb.data_inicial)} {rb.data_final && rb.data_final !== rb.data_inicial && ` a ${fmtDate(rb.data_final)}`}</span>
            )}
          </p>
        </div>
        
        <img src="/logo-seven.png" alt="Seven" style={{ height: '50px', objectFit: 'contain' }} />
      </div>

      {/* CONTEÚDO TABULAR SECO */}
      <div style={{ paddingBottom: '40px' }}>
        {dayGroups.length === 0 ? (
          <p style={{ textAlign: 'center', fontStyle: 'italic', color: '#666' }}>Nenhuma programação cadastrada.</p>
        ) : (
          dayGroups.map((group, idx) => (
            <div key={idx}>
              <div className="day-header">
                {fmtDate(group.data) || "Sem data"} <span style={{ opacity: 0.8, fontSize: '12px', marginLeft: '10px', fontWeight: 'normal' }}>{getDaySummary(group.itens)}</span>
              </div>
              
              <table className="motorista-table">
                <thead>
                  <tr>
                    <th style={{ width: '15%' }}>Horário</th>
                    <th style={{ width: '15%' }}>Tipo</th>
                    <th style={{ width: '70%' }}>Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {group.itens.map((p, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 'bold', fontSize: '16px' }}>{progHora(p)}</td>
                      <td style={{ fontSize: '12px', textTransform: 'uppercase' }}>{p.tipo || "Outro"}</td>
                      <td>
                        <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>{progTitle(p)}</div>
                        {p.local && (
                          <div style={{ fontSize: '14px', color: '#333', marginBottom: '6px' }}>
                            <span style={{ fontWeight: 'bold' }}>Local:</span> {p.local}
                          </div>
                        )}
                        {p.observacao && (
                          <div style={{ fontSize: '13px', color: '#444', backgroundColor: '#f9f9f9', padding: '8px', borderLeft: '3px solid #ccc', whiteSpace: 'pre-wrap' }}>
                            {p.observacao}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>

      {/* FOOTER NO FINAL DO ARQUIVO */}
      <div style={{ textAlign: 'center', fontSize: '10px', color: '#666', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
        <strong style={{ display: 'block', textTransform: 'uppercase', marginBottom: '4px' }}>Gestão de Viagens e Turnês</strong>
        Desenvolvido por Marcelo Garuffi - Contemporânea produção de eventos
      </div>
    </div>
  );
}
