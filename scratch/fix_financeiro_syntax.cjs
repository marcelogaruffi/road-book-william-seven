const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/financeiro.tsx', 'utf8');

if (!code.includes('</TabsContent>')) return; // just a sanity check

// We need to find the `</TabsContent>` of "eventos" and inject `)}` before it closes the outer div.
// Wait, the structure is:
//           </div>
//         </TabsContent>
// 
//         <TabsContent value="caches_padrao"

code = code.replace(/<\/div>\s*<\/TabsContent>\s*<TabsContent value="caches_padrao"/,
  `</div>\n            )}\n        </TabsContent>\n\n        <TabsContent value="caches_padrao"`
);

// We also didn't remove the inner `<Select>`. Let's just remove the inner `<Select>` and `<Label>` and `max-w-md` div.
const innerSelectRegex = /<div className="max-w-md space-y-2">[\s\S]*?<\/Select>\s*<\/div>/;
code = code.replace(innerSelectRegex, `<div className="flex items-center justify-start mb-4"><Button variant="outline" onClick={() => setSelectedRoadbook("")}>← Voltar para Grade</Button></div>`);

fs.writeFileSync('src/routes/_authenticated/financeiro.tsx', code, 'utf8');
console.log('Fixed financeiro syntax');
