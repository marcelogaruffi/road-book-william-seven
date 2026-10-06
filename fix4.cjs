const fs = require("fs");
let lines = fs.readFileSync("src/routes/_authenticated/camarins.index.tsx", "utf8").split("\n");
const newLines = [
"        {activeTab === \"evento\" && !selectedEventoId ? (",
"          <div className=\"mt-6\">",
"            <GridEventos onSelect={(id) => setSelectedEventoId(id)} />",
"          </div>",
"        ) : (",
"        <Card className=\"mt-6\">",
"          <CardHeader className=\"bg-slate-50 dark:bg-slate-800/50 border-b\">",
"            <div className=\"flex flex-col sm:flex-row gap-4 items-end\">",
"              <div className=\"flex-1 space-y-2 w-full\">",
"                {activeTab === \"evento\" ? (",
"                  <div className=\"flex flex-col gap-2\">",
"                    <Label className=\"text-slate-500\">Evento Selecionado</Label>",
"                    <Button variant=\"outline\" onClick={() => setSelectedEventoId(\"\")} className=\"w-fit\">? Voltar para Grade de Eventos</Button>",
"                  </div>",
"                ) : (",
"                  <>",
"                    <Label>Selecione o Show Padrão</Label>",
"                    <select value={selectedEspetaculoPadrao} onChange={e => setSelectedEspetaculoPadrao(e.target.value)} className=\"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm\">",
"                      <option value=\"\">Selecione um show...</option>",
"                      {espetaculosList.map(esp => <option key={esp} value={esp}>{esp}</option>)}",
"                    </select>",
"                  </>",
"                )}",
"              </div>"
];
lines.splice(801, 17, ...newLines);
fs.writeFileSync("src/routes/_authenticated/camarins.index.tsx", lines.join("\n"));
console.log("Done");
