const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/som.$evento_id.tsx', 'utf8');

if (!code.includes('LinkIcon')) {
  code = code.replace("FileUp } from 'lucide-react';", "FileUp, LinkIcon, X } from 'lucide-react';");
}

const handleUploadHelper = `
  const handleRiderSomUpload = async (file: File) => {
    if (!file) return;
    toast.info('Fazendo upload...');
    const cleanName = file.name.replace(/[^a-zA-Z0-9.\\-_]/g, '');
    const { data: user } = await supabase.auth.getUser();
    const uid = user?.user?.id || 'public';
    const filePath = \`\${uid}/midias_eventos/\${Date.now()}-\${cleanName}\`;
    
    const { error: uploadError } = await supabase.storage.from('midias_eventos').upload(filePath, file);
    
    if (uploadError) {
      toast.error('Erro no upload: ' + uploadError.message);
    } else {
      const { data: { publicUrl } } = supabase.storage.from('midias_eventos').getPublicUrl(filePath);
      
      const list = mapa?.json_data?.assets_midia?.anexos_som || [];
      const novoAnexo = { url: publicUrl, nome: file.name };
      
      const newAssets = { ...(mapa?.json_data?.assets_midia || {}), anexos_som: [...list, novoAnexo] };
      updateJson('assets_midia', newAssets);
      
      toast.success('Arquivo anexado com sucesso!');
    }
  };

  const handleSave = async () => {`;

code = code.replace("  const handleSave = async () => {", handleUploadHelper);

const anexosAccordion = `
            <AccordionItem value="bloco-e" className="border border-slate-200 dark:border-white/10 rounded-xl px-4 bg-slate-50/50 dark:bg-black/20 data-[state=open]:bg-white dark:data-[state=open]:bg-white/5 transition-all">
              <AccordionTrigger className="text-lg font-bold hover:no-underline">Bloco E: Anexos e Mapas do Rider</AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4 pb-6">
                <div className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    {(jd.assets_midia?.anexos_som || []).map((anexo: any, index: number) => {
                      const url = typeof anexo === 'string' ? anexo : anexo.url;
                      const nome = typeof anexo === 'string' ? \`Arquivo \${index + 1}\` : anexo.nome;
                      
                      return (
                        <div key={index} className="border rounded-xl p-3 flex flex-col gap-2 bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-white/10">
                          <div className="flex justify-between items-center">
                            <a href={url} target="_blank" rel="noreferrer" className="font-bold text-sm text-blue-500 hover:underline flex items-center gap-2 truncate max-w-[80%]">
                              <LinkIcon className="size-4 shrink-0"/> Ver Arquivo
                            </a>
                            <Button variant="ghost" size="icon" className="text-red-500 shrink-0 size-8 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => {
                              const newAssets = {...(jd.assets_midia||{})};
                              newAssets.anexos_som = newAssets.anexos_som.filter((_: any, i: number) => i !== index);
                              updateJson('assets_midia', newAssets);
                            }}><X className="size-4"/></Button>
                          </div>
                          <Input 
                            value={nome}
                            onChange={(e) => {
                              const newAssets = {...(jd.assets_midia||{})};
                              const lista = [...(newAssets.anexos_som || [])];
                              const current = lista[index];
                              if (typeof current === 'string') {
                                lista[index] = { url: current, nome: e.target.value };
                              } else {
                                lista[index] = { ...current, nome: e.target.value };
                              }
                              newAssets.anexos_som = lista;
                              updateJson('assets_midia', newAssets);
                            }}
                            placeholder="Nome do arquivo..."
                            className="h-8 text-sm bg-slate-50 dark:bg-black/50"
                          />
                        </div>
                      );
                    })}
                    
                    <div 
                      className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl h-[92px] flex items-center justify-center text-slate-400 relative hover:bg-slate-50 dark:hover:bg-slate-900/50 bg-white dark:bg-slate-900 shadow-sm transition-colors cursor-pointer"
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const file = e.dataTransfer.files?.[0]; if (file) handleRiderSomUpload(file); }}
                    >
                      <span className="text-sm font-semibold flex items-center"><Plus className="size-4 mr-1"/> Anexar Arquivo (ou arraste)</span>
                      <input type="file" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleRiderSomUpload(file);
                      }} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
`;

code = code.replace("          </Accordion>", anexosAccordion);

fs.writeFileSync('src/routes/_authenticated/som.$evento_id.tsx', code);
console.log('som.$evento_id.tsx patched');
