import { createFileRoute } from "@tanstack/react-router";
import { Route as AuthedRoute } from "./route";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, ShieldAlert, ScanSearch } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin-limpeza")({
  head: () => ({ meta: [{ title: "Limpeza de Sistema" }] }),
  component: AdminLimpeza,
});

function AdminLimpeza() {
  const { profile } = AuthedRoute.useRouteContext();
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [orphans, setOrphans] = useState<{ name: string; path: string; size: number }[]>([]);
  const [deleting, setDeleting] = useState(false);

  // Somente admins ou devs
  if (profile?.role !== "admin" && profile?.role !== "dev" && profile?.role !== "produtor") {
    return <div className="p-12 text-center">Acesso restrito.</div>;
  }

  async function handleScan() {
    setLoading(true);
    setScanned(false);
    setOrphans([]);
    
    try {
      // 1. Pegar todos os links usados no DB
      const [ { data: t }, { data: e }, { data: tp }, { data: r } ] = await Promise.all([
        supabase.from('tours').select('logo_producao'),
        supabase.from('eventos').select('produtora_logo_url'),
        supabase.from('templates_espetaculos').select('logo_espetaculo_url, logo_cia_url'),
        supabase.from('roadbooks').select('logo_espetaculo_override, logo_cia_override, logo_producao_override')
      ]);

      const usedUrls = new Set<string>();
      t?.forEach(i => i.logo_producao && usedUrls.add(i.logo_producao));
      e?.forEach(i => i.produtora_logo_url && usedUrls.add(i.produtora_logo_url));
      tp?.forEach(i => {
        if (i.logo_espetaculo_url) usedUrls.add(i.logo_espetaculo_url);
        if (i.logo_cia_url) usedUrls.add(i.logo_cia_url);
      });
      r?.forEach(i => {
        if (i.logo_espetaculo_override) usedUrls.add(i.logo_espetaculo_override);
        if (i.logo_cia_override) usedUrls.add(i.logo_cia_override);
        if (i.logo_producao_override) usedUrls.add(i.logo_producao_override);
      });

      // 2. Procurar em todos os buckets/pastas comuns. O problema é que o list não é recursivo em todas as pastas.
      // O Supabase tem RLS no list, mas como admin/produtor podemos tentar listar pastas raiz comuns.
      // logos/, produtoras/, tours/
      const folders = ['logos', 'produtoras', 'tours'];
      const allFiles: { name: string; path: string; size: number }[] = [];

      for (const folder of folders) {
        const { data, error } = await supabase.storage.from('roadbook-docs').list(folder, { limit: 1000 });
        if (data) {
          for (const file of data) {
            // Ignorar placeholder de pasta
            if (file.name === '.emptyFolderPlaceholder') continue;
            allFiles.push({ name: file.name, path: `${folder}/${file.name}`, size: file.metadata?.size || 0 });
          }
        }
      }

      // 3. Cruzar dados
      const foundOrphans = allFiles.filter(file => {
        const { data: publicUrlData } = supabase.storage.from('roadbook-docs').getPublicUrl(file.path);
        const publicUrl = publicUrlData.publicUrl;
        
        // Verifica se a exata publicUrl está em uso
        // Como o BD pode ter variações ou o usuário pode ter colocado manualmente, validamos se parte do path está em alguma URL usada
        const isUsed = Array.from(usedUrls).some(url => url.includes(file.path));
        return !isUsed;
      });

      setOrphans(foundOrphans);
      setScanned(true);

    } catch (error: any) {
      toast.error(error.message || "Erro ao escanear o sistema");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteOrphans() {
    if (orphans.length === 0) return;
    const confirm = window.confirm(`Você tem certeza que deseja EXCLUIR DEFINITIVAMENTE ${orphans.length} arquivos órfãos? Essa ação não pode ser desfeita.`);
    if (!confirm) return;

    setDeleting(true);
    try {
      const paths = orphans.map(o => o.path);
      const { error } = await supabase.storage.from('roadbook-docs').remove(paths);
      if (error) throw error;

      toast.success(`${paths.length} arquivos inúteis foram excluídos com sucesso!`);
      setOrphans([]);
      setScanned(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao deletar arquivos");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-red-100 text-red-600 rounded-xl">
          <ShieldAlert className="size-8" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white">Limpeza de Sistema</h1>
          <p className="text-slate-500 font-medium">Varredura de Imagens Órfãs no Servidor</p>
        </div>
      </div>

      <Card className="border-0 shadow-lg rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100">
          <CardTitle>Scanner de Logos e Imagens Inúteis</CardTitle>
          <CardDescription>
            Essa ferramenta vasculha a nuvem (Supabase Storage) buscando por logos que foram enviados no passado e que não estão mais vinculados a nenhum Cadastro, Evento ou Guia de Viagem.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 text-center space-y-6">
          {!scanned && !loading && (
            <div className="py-8">
              <ScanSearch className="size-16 text-slate-300 mx-auto mb-4" />
              <p className="text-lg text-slate-600 mb-6 font-medium">Clique no botão abaixo para iniciar a varredura segura.</p>
              <Button onClick={handleScan} className="h-14 px-8 rounded-xl text-lg font-bold bg-primary hover:bg-primary/90">
                Iniciar Varredura
              </Button>
            </div>
          )}

          {loading && (
            <div className="py-12 flex flex-col items-center">
              <div className="animate-spin size-10 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
              <p className="text-slate-600 font-medium">Lendo arquivos do servidor e cruzando com o banco de dados...</p>
            </div>
          )}

          {scanned && !loading && (
            <div className="space-y-6">
              {orphans.length === 0 ? (
                <div className="py-8 bg-green-50 text-green-700 rounded-2xl border border-green-200">
                  <h3 className="text-xl font-bold mb-2">Tudo Limpo! 🎉</h3>
                  <p>Não encontramos nenhuma imagem órfã nas pastas do sistema.</p>
                </div>
              ) : (
                <div className="space-y-6 text-left">
                  <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200">
                    <h3 className="text-xl font-bold text-amber-800 flex items-center gap-2 mb-2">
                      <ShieldAlert className="size-5" /> Encontramos {orphans.length} arquivo(s) inútil(is)
                    </h3>
                    <p className="text-amber-700 font-medium">
                      Estes arquivos estão ocupando espaço na nuvem e podem ser deletados com segurança pois não constam em nenhum registro atual do sistema.
                    </p>
                  </div>
                  
                  <div className="bg-slate-50 border rounded-xl max-h-[300px] overflow-y-auto p-4 space-y-2">
                    {orphans.map(o => (
                      <div key={o.path} className="flex justify-between items-center text-sm p-2 hover:bg-white rounded border border-transparent hover:border-slate-200">
                        <span className="font-medium text-slate-700 truncate mr-4">{o.name}</span>
                        <span className="text-slate-400 whitespace-nowrap text-xs">{(o.size / 1024).toFixed(1)} KB</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-center pt-4">
                    <Button 
                      onClick={handleDeleteOrphans} 
                      disabled={deleting}
                      className="h-14 px-8 rounded-xl text-lg font-bold bg-red-500 hover:bg-red-600 text-white"
                    >
                      {deleting ? "Limpando..." : <><Trash2 className="size-5 mr-2" /> Apagar {orphans.length} arquivos inúteis</>}
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="pt-6 border-t">
                <Button variant="outline" onClick={() => setScanned(false)} className="rounded-xl">Fazer nova varredura</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
