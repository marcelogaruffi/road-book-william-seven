const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/espetaculos.tsx', 'utf-8').replace(/\r\n/g, '\n');

// 1. Replace totalSteps
content = content.replace('const totalSteps = 10;', 'const totalSteps = 11;');

// 2. Shift steps 4 to 10.
// We must do this in descending order so we don't accidentally replace already shifted steps!
for (let i = 10; i >= 4; i--) {
  content = content.replace(`{step === ${i} &&`, `{step === ${i + 1} &&`);
}

// 3. Add uploadFotoDivulgacao function
const uploadAnexoCode = `const uploadAnexo = async (e: any, key: string) => {`;
const uploadFotoDivulgacaoCode = `const uploadFotoDivulgacao = async (e: any) => {
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
  };

  const uploadAnexo = async (e: any, key: string) => {`;
content = content.replace(uploadAnexoCode, uploadFotoDivulgacaoCode);

// 4. Insert Step 4 logic
const step3CodeEnd = `            </div>
          )}

          {step === 5 && (`;

const step4Logic = `            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-white/10 pb-3">Fotos de Divulgação</h3>
              <div className="space-y-4 max-w-2xl">
                {(currentShow.assets_midia?.fotos_divulgacao || []).map((foto: any, index: number) => (
                  <div key={index} className="flex gap-4 items-start p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                    {foto.url ? (
                      <img src={foto.url} alt="Divulgação" className="w-32 h-24 object-cover rounded-lg shadow-sm border border-slate-200 dark:border-slate-700" />
                    ) : (
                      <div className="w-32 h-24 bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                        <ImageIcon className="size-6 text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1 space-y-3">
                      <div>
                        <Label className="text-xs font-bold text-slate-500 uppercase">Créditos (Fotógrafo)</Label>
                        <Input 
                          value={foto.creditos || ''} 
                          onChange={e => {
                            const novas = [...(currentShow.assets_midia?.fotos_divulgacao || [])];
                            novas[index].creditos = e.target.value;
                            setCurrentShow({...currentShow, assets_midia: {...currentShow.assets_midia, fotos_divulgacao: novas}});
                          }} 
                          placeholder="Nome de quem tirou a foto..." 
                          className="mt-1"
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => {
                          const novas = [...(currentShow.assets_midia?.fotos_divulgacao || [])];
                          novas.splice(index, 1);
                          setCurrentShow({...currentShow, assets_midia: {...currentShow.assets_midia, fotos_divulgacao: novas}});
                        }}>
                          <Trash2 className="size-4 mr-2" /> Remover Foto
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl h-24 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors bg-white dark:bg-slate-900 cursor-pointer group">
                  <Plus className="size-6 mb-1 text-slate-300 group-hover:text-primary transition-colors" />
                  <span className="font-semibold text-sm group-hover:text-primary transition-colors">Adicionar Nova Foto</span>
                  <input type="file" accept="image/*" onChange={uploadFotoDivulgacao} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>
            </div>
          )}

          {step === 5 && (`;

content = content.replace(step3CodeEnd, step4Logic);

fs.writeFileSync('src/routes/_authenticated/espetaculos.tsx', content);
console.log('Done!');
