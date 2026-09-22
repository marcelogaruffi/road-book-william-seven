const fs = require('fs');

let content = fs.readFileSync('src/routes/_authenticated/espetaculos.tsx', 'utf-8');

const oldUploadFunc = `const uploadFotoDivulgacao = async (e: any) => {
    if (!e.target.files?.[0]) return;
    try {
      toast.loading("Enviando foto...");
      const url = await handleFileUpload(e.target.files[0], "fotos");
      const fotos = [...(currentShow.assets_midia?.fotos_divulgacao || [])];
      fotos.push({ url, creditos: '' });
      setCurrentShow(s => ({ 
        ...s, 
        assets_midia: { ...(s.assets_midia || {}), fotos_divulgacao: fotos } 
      }));
      toast.dismiss();
      toast.success("Foto adicionada!");
    } catch (err: any) {
      toast.dismiss();
      toast.error("Erro: " + err.message);
    }
  };`;

const newUploadFunc = `const uploadFotoDivulgacao = async (e: any) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      toast.loading(\`Enviando \${files.length} foto(s)...\`);
      
      const newFotos: any[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await handleFileUpload(files[i], "fotos");
        newFotos.push({ url, creditos: '' });
      }

      setCurrentShow(s => {
        const currentFotos = [...(s.assets_midia?.fotos_divulgacao || [])];
        return { 
          ...s, 
          assets_midia: { ...(s.assets_midia || {}), fotos_divulgacao: [...currentFotos, ...newFotos] } 
        };
      });
      
      toast.dismiss();
      toast.success(\`\${files.length} foto(s) adicionada(s)!\`);
    } catch (err: any) {
      toast.dismiss();
      toast.error("Erro: " + err.message);
    }
    // Limpar o input para permitir selecionar os mesmos arquivos novamente se necessário
    e.target.value = '';
  };`;

content = content.replace(oldUploadFunc, newUploadFunc);

const oldInput = `<input type="file" accept="image/*" onChange={uploadFotoDivulgacao} className="absolute inset-0 opacity-0 cursor-pointer" />`;
const newInput = `<input type="file" accept="image/*" multiple onChange={uploadFotoDivulgacao} className="absolute inset-0 opacity-0 cursor-pointer" />`;

content = content.replace(oldInput, newInput);

const oldBtnText = `<span className="font-semibold text-sm group-hover:text-primary transition-colors">Adicionar Nova Foto</span>`;
const newBtnText = `<span className="font-semibold text-sm group-hover:text-primary transition-colors">Adicionar Foto(s)</span>`;
content = content.replace(oldBtnText, newBtnText);

fs.writeFileSync('src/routes/_authenticated/espetaculos.tsx', content);
