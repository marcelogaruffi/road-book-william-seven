const fs = require('fs');

const filePath = 'src/routes/_authenticated/catering.index.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add CateringPadraoTab import
if (!content.includes('CateringPadraoTab')) {
  content = content.replace(
    'import { ReportExportButton }',
    'import { ReportExportButton } from "@/components/ReportExportButton";\nimport { CateringPadraoTab } from "@/components/CateringPadraoTab";'
  );
}

// 2. Add handleImportarPadrao function
const importFunc = `
  const handleImportarPadrao = async () => {
    if (!eventoFull?.espetaculo) {
       toast.error("Espetáculo não definido neste evento.");
       return;
    }
    const { data: padraoData, error: errPadrao } = await supabase.from('catering_padrao').select('*').eq('espetaculo_nome', eventoFull.espetaculo).order('ordem', { ascending: true });
    if (errPadrao) return toast.error("Erro ao buscar padrão.");
    if (!padraoData || padraoData.length === 0) return toast.info("Nenhum item padrão encontrado para " + eventoFull.espetaculo);

    const payloads = padraoData.map(p => ({
       evento_id: selectedEventoId,
       produto: p.produto,
       quantidade: p.quantidade,
       unidade: p.unidade,
       camarins: [],
       ordem: p.ordem
    }));
    
    const { data: inserted, error: insertErr } = await supabase.from('catering_eventos').insert(payloads).select();
    if (insertErr) return toast.error("Erro ao importar itens.");
    
    setCateringItens([...cateringItens, ...inserted]);
    toast.success(inserted.length + " itens importados!");
  };
`;
if (!content.includes('handleImportarPadrao')) {
  content = content.replace('const exportRestricoesExcel = async () => {', importFunc + '\n  const exportRestricoesExcel = async () => {');
}

// 3. Update TabsList to 3 columns and add the new TabsTrigger
content = content.replace(
  'className="grid grid-cols-2 lg:w-[400px]"',
  'className="grid grid-cols-3 lg:w-[600px]"'
);

if (!content.includes('value="padrao"')) {
  content = content.replace(
    '<TabsTrigger value="restricoes" className="flex gap-2"><AlertCircle className="size-4" /> Restrições</TabsTrigger>',
    '<TabsTrigger value="restricoes" className="flex gap-2"><AlertCircle className="size-4" /> Restrições</TabsTrigger>\n                    <TabsTrigger value="padrao" className="flex gap-2"><Utensils className="size-4" /> Padrão</TabsTrigger>'
  );
}

// 4. Add the import button near the Export Button
if (!content.includes('Importar Padrão')) {
  content = content.replace(
    '<ReportExportButton onExportPdf={exportCardapioPDF} onExportExcel={exportCardapioExcel} />',
    '<div className="flex items-center gap-2">\n                      <Button variant="outline" onClick={handleImportarPadrao}><Utensils className="size-4 mr-2"/> Importar Padrão</Button>\n                      <ReportExportButton onExportPdf={exportCardapioPDF} onExportExcel={exportCardapioExcel} />\n                    </div>'
  );
}

// 5. Add the TabsContent for 'padrao'
const padraoContent = `
              <TabsContent value="padrao">
                <div className="bg-white p-6 border rounded-2xl shadow-sm">
                  <CateringPadraoTab />
                </div>
              </TabsContent>
`;
if (!content.includes('<TabsContent value="padrao">')) {
  content = content.replace(
    '</Tabs>\n            </div>\n          </div>',
    '</TabsContent>\n' + padraoContent + '\n              </Tabs>\n            </div>\n          </div>'
  );
}

// Replace double import
content = content.replace('import { ReportExportButton } from "@/components/ReportExportButton";\nimport { ReportExportButton } from "@/components/ReportExportButton";', 'import { ReportExportButton } from "@/components/ReportExportButton";');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully updated catering.index.tsx");
