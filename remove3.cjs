const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/camarins.index.tsx', 'utf8');

const str = \                      )}
                      {selectedTipo === 'catering' && activeTab === 'evento' && selectedEventoId && (
                        <>
                          <ReportExportButton onExportPdf={exportCateringPDF} onExportExcel={exportCateringExcel} />
                        </>
                      )}\;
code = code.replace(str, '                      )}');

const str2 = \          {activeTab === 'evento' && (
            <button onClick={() => setSelectedTipo("catering")} className={\\\lex items-center gap-2 whitespace-nowrap rounded-2xl px-6 py-3 transition-all font-semibold text-sm \\\\\\}>
              <Utensils className="size-5" /> Catering / Restrições
            </button>
          )}\;
code = code.replace(str2, '');

fs.writeFileSync('src/routes/_authenticated/camarins.index.tsx', code);
