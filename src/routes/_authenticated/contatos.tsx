import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ShieldAlert, Search, Phone, User as UserIcon, MapPin, Briefcase, FileText, Download, Mail } from "lucide-react";
import { RoadbookData } from "@/lib/roadbook-types";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

type ContactRow = {
  id: string; // just a unique key
  nome: string;
  telefone: string;
  email: string;
  cidades: Set<string>;
  funcao: string;
};

export const Route = createFileRoute("/_authenticated/contatos")({
  head: () => ({ meta: [{ title: "Contatos Gerais - Seven Produções Artísticas" }] }),
  component: ContatosPage,
});

function ContatosPage() {
  const { profile } = Route.useRouteContext();
  const [roadbooks, setRoadbooks] = useState<RoadbookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase.from("roadbooks").select("*").order("data_inicial", { ascending: false });
    if (data) {
      setRoadbooks(data as RoadbookData[]);
    }
    setLoading(false);
  }

  const allContacts = useMemo(() => {
    const map = new Map<string, ContactRow>();
    
    // Função auxiliar para padronizar o nome/telefone e gerar a chave única
    const getUniqueKey = (nome: string, telefone: string, email: string) => {
      return `${nome.trim().toLowerCase()}|${telefone.trim().replace(/\D/g, '')}|${email.trim().toLowerCase()}`;
    };

    const pushContact = (nome: string, telefone: string, email: string, funcao: string, cidade: string) => {
      const cleanPhone = telefone?.trim() || "";
      const cleanEmail = email?.trim() || "";
      const cleanName = nome?.trim() || "";
      
      // Só insere se tiver telefone com mais de 3 caracteres ou um email válido
      if ((cleanPhone && cleanPhone.length > 3) || (cleanEmail && cleanEmail.includes("@"))) {
        const key = getUniqueKey(cleanName, cleanPhone, cleanEmail);
        
        if (map.has(key)) {
          const existing = map.get(key)!;
          existing.cidades.add(cidade);
        } else {
          map.set(key, {
            id: `contato-${Math.random()}`,
            nome: cleanName || "Sem Nome",
            telefone: cleanPhone,
            email: cleanEmail,
            funcao,
            cidades: new Set([cidade])
          });
        }
      }
    };

    roadbooks.forEach(rb => {
      const cidade = rb.cidade || "Cidade não informada";

      // 1. Produção Local
      // producao_telefone na verdade guarda o E-mail! producao_whatsapp guarda o telefone
      pushContact(rb.producao_nome, rb.producao_whatsapp, rb.producao_telefone, "Produção Local", cidade);

      // 2. Produtor de Hospitalidade (Anjo)
      // Aqui receptivo_telefone e whatsapp são ambos números, juntamos o que tiver
      pushContact(rb.receptivo_nome, rb.receptivo_whatsapp || rb.receptivo_telefone, "", "Produtor de Hospitalidade (Anjo)", cidade);

      // 3. Outros Contatos
      if (Array.isArray(rb.outros_contatos)) {
        rb.outros_contatos.forEach(oc => {
          pushContact(oc.nome, oc.whatsapp || oc.telefone, "", oc.funcao || "Contato Adicional", cidade);
        });
      }

      // 4. Outros Locais (Restaurantes, etc)
      if (rb.automacoes && Array.isArray(rb.automacoes.outros_locais)) {
        rb.automacoes.outros_locais.forEach(loc => {
          pushContact(loc.nome, loc.telefone, "", "Outro Local", cidade);
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [roadbooks]);

  const filteredContacts = useMemo(() => {
    if (!searchTerm) return allContacts;
    const lower = searchTerm.toLowerCase();
    return allContacts.filter(c => 
      c.nome.toLowerCase().includes(lower) || 
      c.funcao.toLowerCase().includes(lower) || 
      Array.from(c.cidades).join(" ").toLowerCase().includes(lower) ||
      c.telefone.toLowerCase().includes(lower) ||
      c.email.toLowerCase().includes(lower)
    );
  }, [allContacts, searchTerm]);

  // Função para abrir o WhatsApp
  const openWhatsApp = (telefone: string) => {
    if (!telefone) return;
    let raw = telefone.replace(/\D/g, '');
    if (raw.length === 10 || raw.length === 11) {
      raw = `55${raw}`;
    }
    window.open(`https://api.whatsapp.com/send?phone=${raw}`, '_blank');
  };

  // Exportação em PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Lista de Contatos - Seven Produções Artísticas", 14, 20);
    
    const tableData = filteredContacts.map(c => [
      c.nome,
      c.funcao,
      c.telefone || c.email,
      Array.from(c.cidades).join(", ")
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['Nome', 'Função', 'Contato', 'Cidades']],
      body: tableData,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [79, 70, 229] }
    });
    
    doc.save("contatos_seven.pdf");
  };

  // Exportação em Excel
  const exportExcel = () => {
    const worksheetData = filteredContacts.map(c => ({
      Nome: c.nome,
      "Função": c.funcao,
      Telefone: c.telefone,
      "E-mail": c.email,
      Cidades: Array.from(c.cidades).join(", ")
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contatos");
    
    // Auto-ajuste de colunas simples
    const maxWidths = [
      { wch: 30 }, // Nome
      { wch: 35 }, // Função
      { wch: 20 }, // Telefone
      { wch: 50 }, // Cidades
    ];
    worksheet['!cols'] = maxWidths;

    XLSX.writeFile(workbook, "contatos_seven.xlsx");
  };

  // Restrição de acesso
  if (profile?.role !== "dev" && profile?.role !== "admin" && profile?.role !== "produtor") {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <ShieldAlert className="size-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-700">Acesso Negado</h2>
        <p className="text-slate-500 mt-2">Esta tela é restrita a Produtores e Administradores.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* HEADER */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
            Agenda de Contatos
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl">
            Aqui estão reunidos todos os contatos telefônicos (Produção Local, Hospitalidade, Extras e Locais) cadastrados nos Road Books. Contatos repetidos foram agrupados por cidade.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportPDF} variant="outline" className="h-11 rounded-xl shadow-sm border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 font-semibold">
            <FileText className="size-4 mr-2 text-red-500" />
            PDF
          </Button>
          <Button onClick={exportExcel} variant="outline" className="h-11 rounded-xl shadow-sm border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 font-semibold">
            <Download className="size-4 mr-2 text-emerald-500" />
            Excel
          </Button>
        </div>
      </section>

      {/* BUSCA */}
      <Card className="border-0 shadow-lg dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-[2rem] overflow-hidden bg-gradient-to-r from-slate-800 to-slate-900 text-white relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-bl-full -mr-20 -mt-20"></div>
        <CardContent className="p-6 md:p-8 relative z-10">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
              <Input
                placeholder="Buscar por nome, função, cidade ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-14 pl-12 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white/20 focus:border-transparent focus:ring-4 focus:ring-white/10 transition-all text-lg font-medium"
              />
            </div>
            <div className="text-slate-300 font-medium bg-white/10 px-4 h-14 rounded-xl flex items-center shrink-0">
              {filteredContacts.length} contato(s)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LISTA */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredContacts.length === 0 ? (
            <div className="col-span-full py-12 text-center">
              <Phone className="size-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Nenhum contato encontrado.</p>
            </div>
          ) : (
            filteredContacts.map((c) => (
              <Card key={c.id} className="border-0 shadow-[0_2px_15px_rgb(0,0,0,0.03)] dark:shadow-[0_2px_15px_rgb(0,0,0,0.2)] bg-white dark:bg-card/40 dark:backdrop-blur-md rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <UserIcon className="size-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-slate-800 dark:text-white leading-tight">{c.nome}</h4>
                        <div className="flex items-center gap-1.5 text-primary mt-0.5 font-semibold">
                          <Briefcase className="size-3.5" />
                          <span className="text-sm">{c.funcao}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-white/10 space-y-2.5">
                    {c.telefone && (
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-lg bg-slate-50 dark:bg-white/5 flex items-center justify-center shrink-0">
                            <Phone className="size-4" />
                          </div>
                          <span className="font-medium text-[15px]">{c.telefone}</span>
                        </div>
                        <Button onClick={() => openWhatsApp(c.telefone)} size="sm" variant="ghost" className="h-8 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 dark:bg-green-500/10 dark:text-green-400 rounded-lg shrink-0 px-2 font-bold">
                          WhatsApp
                        </Button>
                      </div>
                    )}
                    
                    {c.email && (
                      <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300 mt-2">
                        <div className="size-8 rounded-lg bg-slate-50 dark:bg-white/5 flex items-center justify-center shrink-0">
                          <Mail className="size-4" />
                        </div>
                        <span className="font-medium text-[15px]">{c.email}</span>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-2.5 text-slate-500 dark:text-slate-400 mt-2">
                      <div className="size-8 rounded-lg bg-slate-50 dark:bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="size-4" />
                      </div>
                      <div className="flex-1 text-sm font-medium leading-relaxed">
                        {Array.from(c.cidades).join(", ")}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
