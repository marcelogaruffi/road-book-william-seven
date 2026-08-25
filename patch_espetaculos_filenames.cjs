const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/espetaculos.tsx', 'utf8');

// 1. Rewrite handleRiderSomUpload to add the file as an object with original name
const oldUploadHelper = `
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
      
      const m = {...(currentShow.assets_midia||{})};
      m.anexos_som = [...(m.anexos_som || []), publicUrl];
      setCurrentShow(s => ({ ...s, assets_midia: m }));
      
      toast.success('Arquivo anexado com sucesso!');
    }
  };
`;

const newUploadHelper = `
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
      
      const m = {...(currentShow.assets_midia||{})};
      const novoAnexo = { url: publicUrl, nome: file.name };
      m.anexos_som = [...(m.anexos_som || []), novoAnexo];
      setCurrentShow(s => ({ ...s, assets_midia: m }));
      
      toast.success('Arquivo anexado com sucesso!');
    }
  };
`;

let normalizedCode = code.replace(/\r\n/g, '\n');
if (normalizedCode.includes(oldUploadHelper.trim())) {
  code = normalizedCode.replace(oldUploadHelper.trim(), newUploadHelper.trim());
} else {
  // Use regex
  const regex = /const handleRiderSomUpload = async \(file: File\) => \{[\s\S]*?toast\.success\('Arquivo anexado com sucesso!'\);\s*\}\s*\};/;
  if (regex.test(code)) {
    code = code.replace(regex, newUploadHelper.trim());
  }
}

// 2. Rewrite the render map for attachments in step 6
const oldRender = /\{\(currentShow\.assets_midia\?\.anexos_som \|\| \[\]\)\.map\(\(url: string, index: number\) => \([\s\S]*?<\/Button>\s*<\/div>\s*\)\)/;

const newRender = `{(currentShow.assets_midia?.anexos_som || []).map((anexo: any, index: number) => {
                        const url = typeof anexo === 'string' ? anexo : anexo.url;
                        const nome = typeof anexo === 'string' ? \`Arquivo \${index + 1}\` : anexo.nome;
                        
                        return (
                          <div key={index} className="border rounded-xl p-3 flex flex-col gap-2 bg-white dark:bg-slate-900 shadow-sm">
                            <div className="flex justify-between items-center">
                              <a href={url} target="_blank" rel="noreferrer" className="font-bold text-sm text-blue-500 hover:underline flex items-center gap-2 truncate max-w-[80%]">
                                <LinkIcon className="size-4 shrink-0"/> Ver Arquivo
                              </a>
                              <Button variant="ghost" size="icon" className="text-red-500 shrink-0 size-8" onClick={() => {
                                const m = {...(currentShow.assets_midia||{})};
                                m.anexos_som = m.anexos_som.filter((_: any, i: number) => i !== index);
                                setCurrentShow({...currentShow, assets_midia: m});
                              }}><X className="size-4"/></Button>
                            </div>
                            <Input 
                              value={nome}
                              onChange={(e) => {
                                const m = {...(currentShow.assets_midia||{})};
                                const lista = [...(m.anexos_som || [])];
                                const current = lista[index];
                                if (typeof current === 'string') {
                                  lista[index] = { url: current, nome: e.target.value };
                                } else {
                                  lista[index] = { ...current, nome: e.target.value };
                                }
                                m.anexos_som = lista;
                                setCurrentShow({...currentShow, assets_midia: m});
                              }}
                              placeholder="Nome do arquivo..."
                              className="h-8 text-sm bg-slate-50 dark:bg-black/50"
                            />
                          </div>
                        );
                      })}`;

if (oldRender.test(code)) {
  code = code.replace(oldRender, newRender);
}

fs.writeFileSync('src/routes/_authenticated/espetaculos.tsx', code);
console.log('espetaculos.tsx patched for file names');
