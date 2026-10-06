const fs = require('fs');
let c = fs.readFileSync('src/routes/_authenticated/catering.index.tsx', 'utf8');

const targetStr = \                <div>
                  {activeTab === 'cardapio' ? (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={handleImportarPadrao}><Utensils className="size-4 mr-2"/> Importar PadrÃ£o</Button>
                      <ReportExportButton onExportPdf={exportCardapioPDF} onExportExcel={exportCardapioExcel} />
                    </div>
                  ) : (
                    <ReportExportButton onExportPdf={exportRestricoesPDF} onExportExcel={exportRestricoesExcel} />
                  )}
                </div>\;

const repStr = \                <div>
                  {activeTab === 'cardapio' && (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={handleImportarPadrao}><Utensils className="size-4 mr-2"/> Importar Padrão</Button>
                      <ReportExportButton onExportPdf={exportCardapioPDF} onExportExcel={exportCardapioExcel} />
                    </div>
                  )}
                  {activeTab === 'restricoes' && (
                    <ReportExportButton onExportPdf={exportRestricoesPDF} onExportExcel={exportRestricoesExcel} />
                  )}
                </div>\;

c = c.replace(targetStr, repStr);
// Fix windows line endings
c = c.replace(targetStr.replace(/\\n/g, '\\r\\n'), repStr);

fs.writeFileSync('src/routes/_authenticated/catering.index.tsx', c);
