const fs = require('fs');

let c = fs.readFileSync('src/routes/_authenticated/catering.index.tsx', 'utf8');

c = c.replace(/{ key: 'ordem', width: 10 }/g, "{ key: 'ordem', width: 18 }");

c = c.replace(
`                  <div>
                    {activeTab === 'cardapio' ? (
                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleImportarPadrao}><Utensils className="size-4 mr-2"/> Importar Padrão</Button>
                        <ReportExportButton onExportPdf={exportCardapioPDF} onExportExcel={exportCardapioExcel} />
                      </div>
                    ) : (
                      <ReportExportButton onExportPdf={exportRestricoesPDF} onExportExcel={exportRestricoesExcel} />
                    )}
                  </div>`,
`                  <div>
                    {activeTab === 'cardapio' && (
                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleImportarPadrao}><Utensils className="size-4 mr-2"/> Importar Padrão</Button>
                        <ReportExportButton onExportPdf={exportCardapioPDF} onExportExcel={exportCardapioExcel} />
                      </div>
                    )}
                    {activeTab === 'restricoes' && (
                      <ReportExportButton onExportPdf={exportRestricoesPDF} onExportExcel={exportRestricoesExcel} />
                    )}
                  </div>`
);

fs.writeFileSync('src/routes/_authenticated/catering.index.tsx', c);
