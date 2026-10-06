const fs = require('fs');

function fixSingleCardPage(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  // Inject GridEventos
  if (!code.includes('GridEventos')) {
    code = code.replace(/import { supabase }/, 'import { GridEventos } from "@/components/GridEventos";\nimport { supabase }');
  }

  // Find the exact <Card className="mt-6"> that follows Tabs
  code = code.replace(/<Card className="mt-6">/, 
    `{activeTab === 'evento' && !selectedEventoId ? (
          <div className="mt-6"><GridEventos onSelect={setSelectedEventoId} /></div>
        ) : (
        <Card className="mt-6">`
  );

  // Close the conditional at the very end of the Tabs block.
  // Wait, the file usually ends with:
  //         </Card>
  //       </Tabs>
  //     </div>
  //   );
  // }
  code = code.replace(/<\/Card>\s*<\/Tabs>\s*<\/div>\s*\)\;\s*\}/, 
    `</Card>\n        )}\n      </Tabs>\n    </div>\n  );\n}`
  );

  // Now replace the select inside CardHeader when activeTab === 'evento'
  // 
  // {activeTab === 'evento' ? (
  //   <select value={selectedEventoId} ...> ... </select>
  // ) : (
  
  const eventSelectRegex = /\{activeTab === 'evento' \? \([\s\S]*?<\/select>\s*\) : \(/;
  code = code.replace(eventSelectRegex, `{activeTab === 'evento' ? (
                    <div className="flex items-center"><Button variant="outline" onClick={() => setSelectedEventoId("")}>← Voltar para Grade</Button></div>
                  ) : (`);

  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Fixed', filePath);
}

fixSingleCardPage('src/routes/_authenticated/figurinos.index.tsx');
fixSingleCardPage('src/routes/_authenticated/camarins.index.tsx');
fixSingleCardPage('src/routes/_authenticated/iluminacao.index.tsx'); // assuming it's the same
