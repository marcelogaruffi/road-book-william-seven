import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, Search, ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

export function LogoPicker({
  open,
  onOpenChange,
  onSelect,
  uploadPath
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
  uploadPath?: string;
}) {
  const [logos, setLogos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [uploadingLocal, setUploadingLocal] = useState(false);
  const [hiddenLogos, setHiddenLogos] = useState<string[]>(['0.9862359553083587.png', 'extracted_page_1_0_Image5.png']);

  useEffect(() => {
    const saved = localStorage.getItem('hidden_logos');
    if (saved) setHiddenLogos(JSON.parse(saved));
  }, []);

  function hideLogo(visualName: string) {
    const newHidden = [...hiddenLogos, visualName];
    setHiddenLogos(newHidden);
    localStorage.setItem('hidden_logos', JSON.stringify(newHidden));
    toast.success("Logo ocultado da lista.");
  }

  useEffect(() => {
    if (open) fetchLogos();
  }, [open]);

  async function fetchLogos() {
    setLoading(true);
    try {
      const [
        { data: t },
        { data: e },
        { data: tp },
        { data: r }
      ] = await Promise.all([
        supabase.from('tours').select('logo_producao'),
        supabase.from('eventos').select('produtora_logo_url'),
        supabase.from('templates_espetaculos').select('logo_espetaculo_url, logo_cia_url'),
        supabase.from('roadbooks').select('logo_espetaculo_override, logo_cia_override, logo_producao_override')
      ]);

      const urls = new Set<string>();
      
      t?.forEach(i => i.logo_producao && urls.add(i.logo_producao));
      e?.forEach(i => i.produtora_logo_url && urls.add(i.produtora_logo_url));
      tp?.forEach(i => {
        if (i.logo_espetaculo_url) urls.add(i.logo_espetaculo_url);
        if (i.logo_cia_url) urls.add(i.logo_cia_url);
      });
      r?.forEach(i => {
        if (i.logo_espetaculo_override) urls.add(i.logo_espetaculo_override);
        if (i.logo_cia_override) urls.add(i.logo_cia_override);
        if (i.logo_producao_override) urls.add(i.logo_producao_override);
      });

      const uniqueMap = new Map<string, string>();
      for (const url of Array.from(urls).filter(Boolean)) {
        const parts = url.split('/');
        let raw = parts[parts.length - 1] || "";
        try { raw = decodeURIComponent(raw); } catch(e) {}
        const nameParts = raw.split('-');
        const visualName = nameParts.length > 1 ? nameParts.slice(1).join('-') : raw;
        uniqueMap.set(visualName, url);
      }
      setLogos(Array.from(uniqueMap.values()));
    } catch (err) {
      console.error("Erro ao buscar logos:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(file: File) {
    if (!file) return;
    setUploadingLocal(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      const defaultPath = `${user?.user?.id || 'public'}/logos/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = uploadPath || defaultPath;
      
      const { error } = await supabase.storage.from('roadbook-docs').upload(filePath, file);
      if (error) throw error;
      
      const { data } = supabase.storage.from('roadbook-docs').getPublicUrl(filePath);
      onSelect(data.publicUrl);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erro no upload");
    } finally {
      setUploadingLocal(false);
    }
  }

  const filteredLogos = logos.filter(url => {
    const parts = url.split('/');
    const rawName = parts[parts.length - 1] || "";
    let filename = rawName;
    try { filename = decodeURIComponent(rawName); } catch(e) {}
    const visualName = filename.split('-').length > 1 ? filename.split('-').slice(1).join('-') : filename;
      if (hiddenLogos.includes(visualName)) return false;
      if (!filter) return true;
    return filename.toLowerCase().includes(filter.toLowerCase());
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Selecionar Logo</DialogTitle>
          <DialogDescription>Escolha um logo já inserido no banco de dados ou envie um novo.</DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 my-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input 
              placeholder="Pesquisar logos cadastrados (nome do arquivo)..." 
              value={filter} 
              onChange={e => setFilter(e.target.value)} 
              className="pl-9 h-11"
            />
          </div>
          <Button asChild disabled={uploadingLocal} className="cursor-pointer h-11">
            <label>
              <Upload className="size-4 mr-2" /> {uploadingLocal ? 'Enviando...' : 'Fazer Upload'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                if (e.target.files?.[0]) handleUpload(e.target.files[0]);
              }} />
            </label>
          </Button>
        </div>

        <ScrollArea className="h-[55vh] min-h-[300px] mt-2 border-t pt-4 -mx-6 px-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              Buscando logos...
            </div>
          ) : filteredLogos.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500 text-center">
              <ImageIcon className="size-12 mb-3 opacity-20" />
              <p>{filter ? 'Nenhum logo encontrado com esse nome.' : 'Nenhum logo cadastrado ainda.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 pb-6">
              {filteredLogos.map(url => {
                const parts = url.split('/');
                const rawName = parts[parts.length - 1] || "";
    let filename = rawName;
    try { filename = decodeURIComponent(rawName); } catch(e) {}
                return (
                  <div
                    key={url}
                    className="group flex flex-col items-center gap-2 pb-2 relative"
                  >
                    <div 
                      onClick={() => {
                        onSelect(url);
                        onOpenChange(false);
                      }}
                      role="button"
                      className="relative cursor-pointer aspect-square w-full rounded-xl border bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 flex items-center justify-center overflow-hidden transition-all hover:border-primary/50 group-focus-within:ring-2 group-focus-within:ring-primary group-focus-within:ring-offset-2"
                    >
                      <img src={url} alt="Logo" className="w-full h-full object-contain p-3" />
                      <div 
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          const vName = filename.split('-').length > 1 ? filename.split('-').slice(1).join('-') : filename;
                          hideLogo(vName);
                        }}
                        className="absolute top-1 right-1 bg-white hover:bg-red-500 hover:text-white text-slate-400 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all z-20 shadow-sm cursor-pointer"
                        title="Ocultar logo da lista"
                      >
                        <X className="size-3" />
                      </div>
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                        <span className="text-white text-sm font-bold bg-primary px-3 py-1.5 rounded-full">Selecionar</span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 w-full line-clamp-2 break-all text-center px-1" title={filename}>
                      {filename.split('-').slice(1).join('-') || filename}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
