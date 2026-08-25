const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/espetaculos.tsx', 'utf8');

const helper = `
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

code = code.replace(
  'const updateSomData =',
  helper + '\n  const updateSomData ='
);

// We need to replace the old upload box with regex since exact string match might fail on formatting
const oldUploadRegex = /<div className="border-2 border-dashed rounded-xl h-\[52px\] flex items-center justify-center text-slate-400 relative hover:bg-slate-50 dark:hover:bg-slate-900\/50 bg-white dark:bg-slate-900 shadow-sm transition-colors cursor-pointer">[\s\S]*?<\/div>/;

const newUploadBox = `<div 
                        className="border-2 border-dashed rounded-xl h-[52px] flex items-center justify-center text-slate-400 relative hover:bg-slate-50 dark:hover:bg-slate-900/50 bg-white dark:bg-slate-900 shadow-sm transition-colors cursor-pointer"
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const file = e.dataTransfer.files?.[0]; if (file) handleRiderSomUpload(file); }}
                      >
                        <span className="text-sm font-semibold flex items-center"><Plus className="size-4 mr-1"/> Anexar Arquivo (ou arraste aqui)</span>
                        <input type="file" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleRiderSomUpload(file);
                        }} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>`;

if(oldUploadRegex.test(code)) {
  code = code.replace(oldUploadRegex, newUploadBox);
  fs.writeFileSync('src/routes/_authenticated/espetaculos.tsx', code);
  console.log('espetaculos.tsx drag and drop updated');
} else {
  console.log('Could not find upload box to replace');
}
