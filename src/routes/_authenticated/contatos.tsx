import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ShieldAlert, Search, Phone, User as UserIcon, MapPin, Briefcase, Download, Mail, Plus, Trash2, Users, FileText } from "lucide-react";
import { RoadbookData } from "@/lib/roadbook-types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

type ContactRow = {
  id: string; // just a unique key
  nome: string;
  telefone: string;
  email: string;
  cidades: Set<string>;
  funcao: string;
};

type DiretorioRow = {
  id: string;
  nome: string;
  funcao: string;
  departamento: string;
  telefone: string;
  email: string;
  cidade: string;
  estado: string;
  observacoes: string;
  criador_id: string;
};

const DEPARTAMENTOS = [
  "Áudio",
  "Iluminação",
  "Palco / Cenotécnica",
  "Figurino / Camarim",
  "Elenco",
  "Vídeo",
  "Música",
  "Produção Geral"
];

export const Route = createFileRoute("/_authenticated/contatos")({
  head: () => ({ meta: [{ title: "Contatos da Equipe - Seven Produções Artísticas" }] }),
  component: ContatosPage,
});

function ContatosPage() {
  const { profile, isSimulating, realProfile } = Route.useRouteContext();
  const [roadbooks, setRoadbooks] = useState<RoadbookData[]>([]);
  const [diretorio, setDiretorio] = useState<DiretorioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTermTurne, setSearchTermTurne] = useState("");
  const [searchTermDiretorio, setSearchTermDiretorio] = useState("");
  const [activeTab, setActiveTab] = useState("diretorio");
  
  // Dialog estado
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: "", funcao: "", departamento: "", telefone: "", email: "", cidade: "", estado: "", observacoes: ""
  });
  
  const [estados, setEstados] = useState<any[]>([]);
  const [cidades, setCidades] = useState<any[]>([]);

  useEffect(() => {
    if (openDialog && estados.length === 0) {
      fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
        .then(res => res.json())
        .then(data => setEstados(data));
    }
  }, [openDialog]);

  useEffect(() => {
    if (form.estado) {
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${form.estado}/municipios`)
        .then(res => res.json())
        .then(data => setCidades(data));
    } else {
      setCidades([]);
    }
  }, [form.estado]);

  const formatPhone = (val: string) => {
    let v = val.replace(/\D/g, "");
    if (v.length > 11) v = v.substring(0, 11);
    if (v.length <= 10) return v.replace(/(\d{2})(\d{0,4})(\d{0,4})/, (m, p1, p2, p3) => p3 ? `(${p1}) ${p2}-${p3}` : p2 ? `(${p1}) ${p2}` : p1 ? `(${p1}` : "");
    return v.replace(/(\d{2})(\d{0,5})(\d{0,4})/, (m, p1, p2, p3) => p3 ? `(${p1}) ${p2}-${p3}` : p2 ? `(${p1}) ${p2}` : p1 ? `(${p1}` : "");
  };

  const isManagement = ['dev', 'admin', 'produtor', 'assistente_producao', 'tour_manager'].includes(profile?.role || '');
  const canDeleteAny = ['dev', 'admin', 'produtor'].includes(profile?.role || '');
  
  const allRoles = useMemo(() => {
    let roles = [profile?.role || ''];
    if (profile?.funcoes && Array.isArray(profile.funcoes)) {
      roles = [...roles, ...profile.funcoes];
    }
    return roles;
  }, [profile]);

  const userDepartments = useMemo(() => {
    const deps = new Set<string>();
    if (isManagement) {
      DEPARTAMENTOS.forEach(d => deps.add(d));
    } else {
      allRoles.forEach(r => {
        if (r === 'tecnico_som' || r === 'roadie') deps.add('Áudio');
        if (r === 'iluminador') deps.add('Iluminação');
        if (r === 'stage_manager' || r === 'contra_regra' || r === 'cenotecnico') deps.add('Palco / Cenotécnica');
        if (r === 'camareiro') deps.add('Figurino / Camarim');
        if (r === 'elenco') deps.add('Elenco');
        if (r === 'tecnico_video') deps.add('Vídeo');
        if (r === 'musico') deps.add('Música');
      });
    }
    return deps;
  }, [allRoles, isManagement]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    
    try {
      if (isManagement) {
        const { data: rbData, error: errRb } = await supabase.from("roadbooks").select("*").order("data_inicial", { ascending: false });
        if (!errRb && rbData) {
          setRoadbooks(rbData as RoadbookData[]);
          localStorage.setItem('seven_cache_roadbooks', JSON.stringify(rbData));
        } else { throw new Error('Offline rb'); }
      }

      const { data: dirData, error: errDir } = await supabase.from("contatos_diretorio").select("*").order("nome", { ascending: true });
      if (!errDir && dirData) {
        setDiretorio(dirData as DiretorioRow[]);
        localStorage.setItem('seven_cache_diretorio', JSON.stringify(dirData));
      } else { throw new Error('Offline dir'); }
    } catch (e) {
      toast.warning("Você está offline. Carregando dados salvos no aparelho...", { duration: 5000 });
      const cachedRb = localStorage.getItem('seven_cache_roadbooks');
      if (cachedRb) setRoadbooks(JSON.parse(cachedRb));
      const cachedDir = localStorage.getItem('seven_cache_diretorio');
      if (cachedDir) setDiretorio(JSON.parse(cachedDir));
    }

    setLoading(false);
  }

  // ============== LÓGICA DE CONTATOS DE TURNÊ (ROADBOOKS) ==============
  const allTurneContacts = useMemo(() => {
    const map = new Map<string, ContactRow>();
    
    const getUniqueKey = (nome: string, telefone: string, email: string) => {
      return `${nome.trim().toLowerCase()}|${telefone.trim().replace(/\D/g, '')}|${email.trim().toLowerCase()}`;
    };

    const pushContact = (nome: any, telefone: any, email: any, funcao: string, cidade: string) => {
      const cleanPhone = String(telefone || "").trim();
      const cleanEmail = String(email || "").trim();
      const cleanName = String(nome || "").trim();
      
      if ((cleanPhone && cleanPhone.length > 3) || (cleanEmail && cleanEmail.includes("@"))) {
        const key = getUniqueKey(cleanName, cleanPhone, cleanEmail);
        if (map.has(key)) {
          map.get(key)!.cidades.add(cidade);
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
      pushContact(rb.producao_nome, rb.producao_whatsapp, rb.producao_telefone, "Produção Local", cidade);
      pushContact(rb.receptivo_nome, rb.receptivo_whatsapp || rb.receptivo_telefone, "", "Produtor de Hospitalidade (Anjo)", cidade);
      if (Array.isArray(rb.outros_contatos)) {
        rb.outros_contatos.forEach(oc => {
          pushContact(oc.nome, oc.whatsapp || oc.telefone, "", oc.funcao || "Contato Adicional", cidade);
        });
      }
      if (rb.automacoes && Array.isArray(rb.automacoes.outros_locais)) {
        rb.automacoes.outros_locais.forEach(loc => {
          pushContact(loc.nome, loc.telefone, loc.contato, loc.categoria || "Fornecedor / Local", cidade);
        });
      }
      if (rb.hotel_nome) {
        pushContact(rb.hotel_nome, rb.hotel_telefone, rb.hotel_email, "Hotel (Recepção/Reservas)", cidade);
      }
      if (rb.teatro_nome) {
        pushContact(rb.teatro_nome, rb.teatro_telefone, rb.teatro_email, "Teatro / Espaço (Administração)", cidade);
      }
    });

    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [roadbooks]);

  const filteredTurneContacts = allTurneContacts.filter(c => {
    if (!searchTermTurne) return true;
    const term = searchTermTurne.toLowerCase();
    return c.nome.toLowerCase().includes(term) ||
           c.funcao.toLowerCase().includes(term) ||
           c.telefone.includes(term) ||
           c.email.toLowerCase().includes(term) ||
           Array.from(c.cidades).some(cid => cid.toLowerCase().includes(term));
  });

  // ============== LÓGICA DO DIRETÓRIO DE EQUIPE ==============
  const allowedDiretorio = useMemo(() => {
    return diretorio.filter(c => userDepartments.has(c.departamento) || c.criador_id === profile?.id);
  }, [diretorio, userDepartments, profile?.id]);

  const filteredDiretorio = allowedDiretorio.filter(c => {
    if (!searchTermDiretorio) return true;
    const term = searchTermDiretorio.toLowerCase();
    return c.nome.toLowerCase().includes(term) ||
           c.funcao.toLowerCase().includes(term) ||
           (c.cidade || "").toLowerCase().includes(term) ||
           (c.telefone || "").includes(term);
  });

  // Export & actions
  function openWhatsApp(phone: string) {
    const cleanNumber = phone.replace(/\D/g, "");
    if (cleanNumber) {
      window.open(`https://wa.me/55${cleanNumber}`, "_blank");
    }
  }

  async function handleSaveContato() {
    if (!form.nome || !form.funcao || !form.departamento || !form.cidade) {
      toast.error("Preencha os campos obrigatórios (Nome, Função, Departamento e Cidade).");
      return;
    }
    
    if (editingId) {
      const { error } = await supabase.from('contatos_diretorio').update({ ...form }).eq('id', editingId);
      if (error) {
        toast.error("Erro ao atualizar contato.");
      } else {
        toast.success("Contato atualizado!");
        setDiretorio(prev => prev.map(c => c.id === editingId ? { ...c, ...form } : c).sort((a: any, b: any) => a.nome.localeCompare(b.nome)));
        closeModal();
      }
    } else {
      const { data, error } = await supabase.from('contatos_diretorio').insert([{
        ...form,
        criador_id: profile?.id
      }]).select().single();

      if (error) {
        toast.error("Erro ao salvar contato: " + error.message);
      } else if (data) {
        toast.success("Contato salvo com sucesso!");
        setDiretorio(prev => [...prev, data as DiretorioRow].sort((a, b) => a.nome.localeCompare(b.nome)));
        closeModal();
      }
    }
  }

  function handleEditContato(contato: any) {
    setForm({
      nome: contato.nome || "",
      funcao: contato.funcao || "",
      departamento: contato.departamento || "",
      telefone: contato.telefone || "",
      email: contato.email || "",
      cidade: contato.cidade || "",
      estado: contato.estado || "",
      observacoes: contato.observacoes || ""
    });
    setEditingId(contato.id);
    setOpenDialog(true);
  }

  function closeModal() {
    setOpenDialog(false);
    setEditingId(null);
    setForm({ nome: "", funcao: "", departamento: "", telefone: "", email: "", cidade: "", estado: "", observacoes: "" });
  }

  async function handleDeleteContato(id: string) {
    if (!confirm("Tem certeza que deseja remover este contato?")) return;
    const { error } = await supabase.from('contatos_diretorio').delete().eq('id', id);
    if (error) {
      toast.error("Erro ao remover contato ou você não tem permissão.");
    } else {
      toast.success("Contato removido!");
      setDiretorio(prev => prev.filter(c => c.id !== id));
    }
  }

  const exportPDF = async () => {
    const doc = new jsPDF();
    const isDir = activeTab === "diretorio";

    let startY = 38;
    try {
      const response = await fetch('/logo-seven.png');
      const blob = await response.blob();
      const logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result as string);
      });
      
      const img = new Image();
      img.src = logoBase64;
      await new Promise((res) => { img.onload = res; });
      
      const imgWidth = 40;
      const imgHeight = (img.naturalHeight / img.naturalWidth) * imgWidth;
      const pageWidth = doc.internal.pageSize.getWidth();
      const x = (pageWidth - imgWidth) / 2;
      
      doc.addImage(logoBase64, 'PNG', x, 10, imgWidth, imgHeight);
      
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text(isDir ? "Diretório da Equipe" : "Contatos de Turnê", pageWidth / 2, 10 + imgHeight + 10, { align: 'center' });
      
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.line(14, 10 + imgHeight + 15, pageWidth - 14, 10 + imgHeight + 15);
      
      startY = 10 + imgHeight + 20;
    } catch (e) {
      console.warn("Logo não carregado", e);
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont("helvetica", "bold");
      doc.text(isDir ? "Diretório da Equipe" : "Contatos de Turnê", 14, 20);
      
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFont("helvetica", "normal");
      doc.text("Seven Produções Artísticas", 14, 28);
      
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.line(14, 32, doc.internal.pageSize.getWidth() - 14, 32);
    }
    
    const tableData = isDir ? filteredDiretorio.map((c: any) => [
      c.nome, c.funcao, c.telefone || "-", c.email || "-", c.cidade || "-", c.observacoes || "-"
    ]) : filteredTurneContacts.map(c => [
      c.nome, c.funcao, c.telefone || "-", c.email || "-", Array.from(c.cidades).join(", "), c.observacoes || "-"
    ]);

    autoTable(doc, {
      startY: startY,
      head: [['Nome', 'Função', 'Telefone', 'E-mail', isDir ? 'Cidade' : 'Cidades', 'Observações']],
      body: tableData,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 5, textColor: [51, 65, 85], font: "helvetica" },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        5: { cellWidth: 40 } // Limita a largura das observações
      }
    });
    doc.save(isDir ? "diretorio_equipe_seven.pdf" : "contatos_turne_seven.pdf");
  };

  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const isDir = activeTab === "diretorio";
    const worksheet = workbook.addWorksheet(isDir ? "Diretório da Equipe" : "Contatos Turnê");

    worksheet.columns = [
      { key: 'nome', width: 25 },
      { key: 'funcao', width: 25 },
      { key: 'telefone', width: 20 },
      { key: 'email', width: 30 },
      { key: 'cidades', width: 30 },
      { key: 'observacoes', width: 45 }
    ];

    let headerRowNumber = 1;

    try {
      const response = await fetch('/logo-seven.png');
      const blob = await response.blob();
      const logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result as string);
      });

      const img = new Image();
      img.src = logoBase64;
      await new Promise((res) => { img.onload = res; });
      const imgWidthExcel = 150;
      const imgHeightExcel = (img.naturalHeight / img.naturalWidth) * imgWidthExcel;

      const imageId = workbook.addImage({
        base64: logoBase64,
        extension: 'png',
      });
      worksheet.addImage(imageId, {
        tl: { col: 0, row: 0 },
        ext: { width: imgWidthExcel, height: imgHeightExcel }
      });
      
      // Mesclar e preencher o título na parte vazia superior
      worksheet.mergeCells('B1:D4');
      worksheet.getCell('B1').value = isDir ? "Diretório da Equipe" : "Contatos de Turnê";
      worksheet.getCell('B1').font = { size: 16, bold: true, color: { argb: "FF0f172a" } };
      worksheet.getCell('B1').alignment = { vertical: 'middle', horizontal: 'left' };
      
      headerRowNumber = 6;
    } catch (e) {
      console.warn("Logo não carregado no excel", e);
    }

    const headerRow = worksheet.getRow(headerRowNumber);
    headerRow.values = ['Nome', 'Função', 'Telefone', 'E-mail', isDir ? 'Cidade' : 'Cidades', 'Observações'];
    
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F172A' } // slate-900
      };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    });

    if (isDir) {
      filteredDiretorio.forEach((c: any) => {
        worksheet.addRow({
          nome: c.nome,
          funcao: c.funcao,
          telefone: c.telefone || "-",
          email: c.email || "-",
          cidades: c.cidade || "-",
          observacoes: c.observacoes || "-"
        });
      });
    } else {
      filteredTurneContacts.forEach((c) => {
        worksheet.addRow({
          nome: c.nome,
          funcao: c.funcao,
          telefone: c.telefone || "-",
          email: c.email || "-",
          cidades: Array.from(c.cidades).join(", "),
          observacoes: c.observacoes || "-"
        });
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), isDir ? "diretorio_equipe_seven.xlsx" : "contatos_turne_seven.xlsx");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[100vw] overflow-x-hidden p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between flex-wrap gap-4 px-2">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl shadow-sm ring-1 ring-primary/20 hidden sm:flex">
             <Users className="size-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Contatos da Equipe</h1>
            <p className="text-muted-foreground mt-1 font-medium">Acesse a agenda inteligente do seu departamento.</p>
          </div>
        </div>
        
        {isManagement && (
          <div className="flex gap-2 w-full sm:w-auto">
             <Button onClick={exportExcel} variant="outline" className="flex-1 sm:flex-none h-11 rounded-xl font-bold bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400 transition-colors shadow-sm">
                <Download className="mr-2 size-4" />
                Excel
             </Button>
             <Button onClick={exportPDF} variant="outline" className="flex-1 sm:flex-none h-11 rounded-xl font-bold bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400 transition-colors shadow-sm">
                <FileText className="mr-2 size-4" />
                PDF
             </Button>
          </div>
        )}
      </div>

      {!isManagement ? (
        // VISÃO DA EQUIPE (APENAS DIRETÓRIO)
        <DiretorioView 
          diretorio={filteredDiretorio} 
          searchTerm={searchTermDiretorio} 
          setSearchTerm={setSearchTermDiretorio}
          onNovo={() => { setEditingId(null); setOpenDialog(true); }}
          onEdit={handleEditContato}
          onDelete={handleDeleteContato}
          profileId={profile?.id}
          canDeleteAny={canDeleteAny}
        />
      ) : (
        // VISÃO DA GESTÃO (TABS)
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full sm:w-auto h-12 bg-white dark:bg-card/40 border shadow-sm rounded-2xl p-1 mb-6 inline-flex">
            <TabsTrigger value="diretorio" className="px-6 h-full rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">
              <Users className="size-4 mr-2" />
              Diretório Equipe ({filteredDiretorio.length})
            </TabsTrigger>
            <TabsTrigger value="turne" className="flex-1 h-full rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-[15px]">
              Contatos de Turnê (Roadbooks)
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="diretorio" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
             <DiretorioView 
                diretorio={filteredDiretorio} 
                searchTerm={searchTermDiretorio} 
                setSearchTerm={setSearchTermDiretorio}
                onNovo={() => { setEditingId(null); setOpenDialog(true); }}
                onEdit={handleEditContato}
                onDelete={handleDeleteContato}
                profileId={profile?.id}
                canDeleteAny={canDeleteAny}
              />
          </TabsContent>
          
          <TabsContent value="turne" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
             <TurneView 
                contatos={filteredTurneContacts} 
                searchTerm={searchTermTurne} 
                setSearchTerm={setSearchTermTurne} 
             />
          </TabsContent>
        </Tabs>
      )}

      {/* MODAL NOVO/EDITAR CONTATO */}
      <Dialog open={openDialog} onOpenChange={open => !open && closeModal()}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Contato" : "Cadastrar Novo Contato"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input placeholder="Ex: João Silva" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Função *</Label>
                <Input placeholder="Ex: Técnico Local" value={form.funcao} onChange={e => setForm({...form, funcao: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Departamento *</Label>
                <Select value={form.departamento} onValueChange={v => setForm({...form, departamento: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTAMENTOS.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone (WhatsApp)</Label>
                <Input placeholder="(11) 99999-9999" value={form.telefone} onChange={e => setForm({...form, telefone: formatPhone(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input placeholder="email@exemplo.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>UF *</Label>
                <Select value={form.estado} onValueChange={v => setForm({...form, estado: v, cidade: ""})}>
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {estados.map((e: any) => (
                      <SelectItem key={e.sigla} value={e.sigla}>{e.sigla}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cidade *</Label>
                <Select value={form.cidade} onValueChange={v => setForm({...form, cidade: v})} disabled={!form.estado || cidades.length === 0}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {cidades.map((c: any) => (
                      <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea placeholder="Anotações extras..." value={form.observacoes} onChange={e => setForm({...form, observacoes: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>Cancelar</Button>
            <Button onClick={handleSaveContato}>{editingId ? "Salvar Alterações" : "Salvar Contato"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { Edit2 } from "lucide-react";

function DiretorioView({ diretorio, searchTerm, setSearchTerm, onNovo, onEdit, onDelete, profileId, canDeleteAny }: any) {
  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-[2rem] overflow-hidden bg-white dark:bg-transparent relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 dark:bg-white/5 rounded-bl-full -mr-20 -mt-20"></div>
        <CardContent className="p-6 md:p-8 relative z-10 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
            <Input
              placeholder="Buscar no diretório..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-14 pl-12 rounded-xl bg-slate-50 border-slate-200 dark:bg-white/10 dark:border-white/20 text-slate-800 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-white/20 transition-all text-lg font-medium shadow-sm"
            />
          </div>
          <Button onClick={onNovo} className="h-14 px-6 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl whitespace-nowrap shadow-sm">
            <Plus className="mr-2 size-5" /> Novo Contato
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {diretorio.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500">Nenhum contato encontrado no seu departamento.</div>
        ) : (
          diretorio.map((c: any) => (
            <Card key={c.id} className="border-0 shadow-sm dark:bg-card/40 rounded-2xl overflow-hidden hover:shadow-xl transition-all">
              <div className="p-5 space-y-4 relative">
                {(canDeleteAny || c.criador_id === profileId) && (
                  <div className="absolute top-3 right-3 flex gap-1">
                    <Button variant="ghost" size="icon" className="text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 h-8 w-8" onClick={() => onEdit(c)}>
                      <Edit2 className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 h-8 w-8" onClick={() => onDelete(c.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-3 pr-16">
                  <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <UserIcon className="size-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-800 dark:text-white">{c.nome}</h4>
                    <span className="text-sm font-semibold text-primary">{c.funcao}</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
                    <MapPin className="size-4" /> {c.cidade} {c.estado ? `(${c.estado})` : ''}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
                    <Briefcase className="size-4" /> {c.departamento}
                  </div>
                  {c.telefone && (
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-medium text-slate-700 dark:text-slate-200">{c.telefone}</span>
                      <Button size="sm" onClick={() => {
                        const cleanNumber = c.telefone.replace(/\D/g, "");
                        if (cleanNumber) window.open(`https://wa.me/55${cleanNumber}`, "_blank");
                      }} className="bg-green-500 text-white hover:bg-green-600 h-8">WhatsApp</Button>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-500 truncate">
                      <FileText className="size-4 shrink-0" /> {c.email}
                    </div>
                  )}
                  {c.observacoes && (
                    <div className="pt-2 border-t border-slate-50 dark:border-white/5 mt-2">
                      <p className="text-sm text-slate-500 dark:text-slate-400 italic leading-relaxed text-balance">
                        "{c.observacoes}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function TurneView({ contatos, searchTerm, setSearchTerm }: any) {
  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-[2rem] overflow-hidden bg-white dark:bg-transparent relative">
        <CardContent className="p-6 md:p-8 relative z-10 flex gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
            <Input
              placeholder="Buscar nos contatos de turnê..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-14 pl-12 rounded-xl bg-slate-50 border-slate-200 dark:bg-white/10 dark:border-white/20 text-slate-800 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-white/20 transition-all text-lg font-medium shadow-sm"
            />
          </div>
          <div className="text-slate-700 dark:text-slate-300 font-bold bg-slate-50 border border-slate-200 dark:border-white/10 dark:bg-white/10 px-4 h-14 rounded-xl flex items-center shrink-0 shadow-sm">
             {contatos.length} contato(s)
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {contatos.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500">Nenhum contato encontrado nas turnês.</div>
        ) : (
          contatos.map((c: any) => (
            <Card key={c.id} className="border-0 shadow-sm dark:bg-card/40 rounded-2xl overflow-hidden hover:shadow-xl transition-all">
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <Briefcase className="size-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-800 dark:text-white">{c.nome}</h4>
                    <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">{c.funcao}</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-white/10 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-start gap-2"><MapPin className="size-4 shrink-0 mt-0.5" /> <span>{Array.from(c.cidades).join(", ")}</span></div>
                  {c.telefone && <div className="flex items-center gap-2"><Phone className="size-4 shrink-0" /> {c.telefone}</div>}
                  {c.email && <div className="flex items-center gap-2 truncate"><FileText className="size-4 shrink-0" /> <span className="truncate">{c.email}</span></div>}
                  {c.observacoes && (
                    <div className="pt-2 border-t border-slate-50 dark:border-white/5 mt-2">
                      <p className="text-sm text-slate-500 dark:text-slate-400 italic leading-relaxed text-balance">
                        "{c.observacoes}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
