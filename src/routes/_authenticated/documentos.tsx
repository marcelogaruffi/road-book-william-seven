// @ts-nocheck
import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  Download, 
  Upload, 
  Calendar, 
  FolderArchive, 
  Filter, 
  FileCheck2, 
  Clock, 
  ExternalLink,
  ShieldAlert,
  AlertTriangle
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, isPast, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Route as AuthedRoute } from "./route";
import { AccessDenied } from "@/components/AccessDenied";

export const Route = createFileRoute('/_authenticated/documentos')({
  head: () => ({ meta: [{ title: 'Documentos e Alvarás - Áxis' }] }),
  component: DocumentosPage
});

type DocumentoAvulso = {
  id: string;
  titulo: string;
  categoria: string;
  arquivo_url: string;
  data_vencimento?: string | null;
  observacoes?: string | null;
  created_at: string;
};

const CATEGORIAS_DOCUMENTO = [
  "Alvarás e Liberações",
  "Corpo de Bombeiros / Vistoria",
  "ECAD e Direitos Autorais",
  "Notas Fiscais e Recibos",
  "Autorizações Judiciais e Menores",
  "Seguros e Apólices",
  "Contratos de Teatros / Locação",
  "Outros"
];

function DocumentosPage() {
  const { profile } = AuthedRoute.useRouteContext();
  const userRole = profile?.role || "user";
  const isProdutor = userRole === "admin" || userRole === "dev" || userRole === "produtor";

  const [documentos, setDocumentos] = useState<DocumentoAvulso[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");

  // Modal de upload
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<Partial<DocumentoAvulso>>({
    categoria: "Alvarás e Liberações",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchDocumentos();
  }, []);

  async function fetchDocumentos() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("contratos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocumentos(data || []);
    } catch (err: any) {
      console.error("Erro ao carregar documentos:", err);
      toast.error("Erro ao carregar documentos: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSalvarDocumento(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.titulo?.trim()) {
      return toast.warning("Digite o título do documento.");
    }

    setUploading(true);
    try {
      let arquivo_url = formData.arquivo_url || "";

      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `documentos_producao/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("midias_eventos")
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("midias_eventos")
          .getPublicUrl(filePath);

        arquivo_url = publicUrl;
      } else if (!formData.id && !arquivo_url) {
        toast.error("Você precisa selecionar um arquivo.");
        setUploading(false);
        return;
      }

      const payload = {
        id: formData.id || undefined,
        titulo: formData.titulo.trim(),
        categoria: formData.categoria || "Outros",
        data_vencimento: formData.data_vencimento || null,
        observacoes: formData.observacoes?.trim() || "",
        arquivo_url,
      };

      const { error } = await supabase.from("contratos").upsert(payload);
      if (error) throw error;

      toast.success("Documento salvo com sucesso!");
      setModalOpen(false);
      setFormData({ categoria: "Alvarás e Liberações" });
      setSelectedFile(null);
      fetchDocumentos();
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string, titulo: string) {
    if (!confirm(`Tem certeza que deseja excluir o documento "${titulo}"?`)) return;
    try {
      const { error } = await supabase.from("contratos").delete().eq("id", id);
      if (error) throw error;
      toast.success("Documento excluído com sucesso!");
      fetchDocumentos();
    } catch (err: any) {
      toast.error("Erro ao excluir: " + err.message);
    }
  }

  // Filtragem
  const documentosFiltrados = useMemo(() => {
    return documentos.filter((doc) => {
      const matchesBusca =
        doc.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
        doc.observacoes?.toLowerCase().includes(busca.toLowerCase());
      const matchesCategoria =
        categoriaFiltro === "todas" || doc.categoria === categoriaFiltro;
      return matchesBusca && matchesCategoria;
    });
  }, [documentos, busca, categoriaFiltro]);

  if (!isProdutor) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-6 pb-20">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2.5">
              <FolderArchive className="size-6 text-primary" />
              Documentos e Alvarás
            </h1>
            <Badge variant="secondary" className="font-bold text-xs">
              {documentos.length} {documentos.length === 1 ? 'documento' : 'documentos'}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Arquivo de alvarás de funcionamento, vistorias de bombeiros, ECAD, notas fiscais e documentos gerais.
          </p>
        </div>

        <Button
          onClick={() => {
            setFormData({ categoria: "Alvarás e Liberações" });
            setSelectedFile(null);
            setModalOpen(true);
          }}
          className="gap-2 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-md"
        >
          <Upload className="size-4" />
          Anexar Documento
        </Button>
      </div>

      {/* FILTROS E BUSCA */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="size-4 absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="Buscar por título ou observações..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9 h-10 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2">
              <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
                <SelectTrigger className="w-56 h-10 rounded-xl">
                  <SelectValue placeholder="Todas as Categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Categorias</SelectItem>
                  {CATEGORIAS_DOCUMENTO.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(busca || categoriaFiltro !== "todas") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setBusca("");
                    setCategoriaFiltro("todas");
                  }}
                  className="text-xs text-slate-500"
                >
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GRID DE DOCUMENTOS */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 animate-pulse">
          Carregando documentos...
        </div>
      ) : documentosFiltrados.length === 0 ? (
        <Card className="border-dashed border-2 py-16 text-center">
          <CardContent className="space-y-3">
            <FolderArchive className="size-12 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-slate-600 dark:text-slate-300 font-bold text-base">
              Nenhum documento encontrado
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {busca || categoriaFiltro !== "todas"
                ? "Tente alterar os termos da busca ou selecionar outra categoria."
                : "Clique no botão 'Anexar Documento' para fazer o upload do primeiro alvará ou documento da produção."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documentosFiltrados.map((doc) => {
            const hasVencimento = !!doc.data_vencimento;
            const vencido = hasVencimento && isPast(new Date(doc.data_vencimento!));
            const prestesAVencer =
              hasVencimento &&
              !vencido &&
              isBefore(new Date(doc.data_vencimento!), addDays(new Date(), 15));

            return (
              <Card 
                key={doc.id} 
                className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <Badge variant="outline" className="text-[10px] font-bold">
                      {doc.categoria || "Geral"}
                    </Badge>

                    {vencido && (
                      <Badge variant="destructive" className="text-[10px] gap-1">
                        <AlertTriangle className="size-3" /> Vencido
                      </Badge>
                    )}
                    {prestesAVencer && (
                      <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] gap-1">
                        <Clock className="size-3" /> Vence em breve
                      </Badge>
                    )}
                  </div>

                  <CardTitle className="text-base font-bold text-slate-800 dark:text-white leading-tight">
                    {doc.titulo}
                  </CardTitle>

                  {doc.observacoes && (
                    <CardDescription className="text-xs line-clamp-3 mt-1.5 text-slate-500 dark:text-slate-400">
                      {doc.observacoes}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="pt-0">
                  {hasVencimento && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pb-3">
                      <Calendar className="size-3.5 text-slate-400" />
                      Validade: <strong className={vencido ? "text-rose-600" : ""}>{format(new Date(doc.data_vencimento!), "dd/MM/yyyy", { locale: ptBR })}</strong>
                    </div>
                  )}

                  <div className="border-t border-slate-100 dark:border-white/5 pt-3 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {doc.created_at ? format(new Date(doc.created_at), "dd/MM/yyyy") : ""}
                    </span>

                    <div className="flex items-center gap-2">
                      <a href={doc.arquivo_url} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs rounded-lg">
                          <Download className="size-3.5" />
                          Baixar
                        </Button>
                      </a>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(doc.id, doc.titulo)}
                        className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                        title="Excluir Documento"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* MODAL DE UPLOAD / NOVO DOCUMENTO */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Upload className="size-5 text-primary" />
              Anexar Novo Documento
            </DialogTitle>
            <DialogDescription className="text-xs">
              Faça o upload de alvarás, vistorias, laudos ou notas fiscais da produção.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSalvarDocumento} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-bold">Título do Documento *</Label>
              <Input
                placeholder="Ex: Alvará de Funcionamento - Teatro Municipal"
                value={formData.titulo || ""}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Categoria</Label>
                <Select
                  value={formData.categoria || "Alvarás e Liberações"}
                  onValueChange={(val) => setFormData({ ...formData, categoria: val })}
                >
                  <SelectTrigger className="mt-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_DOCUMENTO.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-xs">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-bold">Data de Vencimento</Label>
                <Input
                  type="date"
                  value={formData.data_vencimento || ""}
                  onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold">Observações / Detalhes</Label>
              <Textarea
                placeholder="Ex: Protocolo nº 4920/2026, válido para a temporada de outono."
                value={formData.observacoes || ""}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-bold">Arquivo (PDF ou Imagem) *</Label>
              <Input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
                required={!formData.id && !formData.arquivo_url}
                className="mt-1 text-xs cursor-pointer"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setModalOpen(false)}
                disabled={uploading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={uploading}
                className="gap-2 bg-primary font-bold"
              >
                {uploading ? "Enviando arquivo..." : "Salvar Documento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
