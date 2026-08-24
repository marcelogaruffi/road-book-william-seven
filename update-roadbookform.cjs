const fs = require('fs');
let content = fs.readFileSync('src/components/RoadbookForm.tsx', 'utf8');

if (!content.includes('MalasViagemTab')) {
  content = content.replace(
    'import { FinanceiroTab } from "./FinanceiroTab";', 
    'import { FinanceiroTab } from "./FinanceiroTab";\nimport { MalasViagemTab } from "./MalasViagemTab";'
  );
  
  content = content.replace(
    'import {\n  Trash2, Plus, Upload, FileText, ExternalLink, Plane, Clock,', 
    'import {\n  Luggage, Trash2, Plus, Upload, FileText, ExternalLink, Plane, Clock,'
  );

  content = content.replace(
    '<FolderOpen className="size-4 mr-2" /> Documentos\n              </TabsTrigger>', 
    '<FolderOpen className="size-4 mr-2" /> Documentos\n              </TabsTrigger>\n              <TabsTrigger value="malas" className="rounded-2xl px-5 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-200 data-[state=active]:text-primary dark:data-[state=active]:text-slate-900 data-[state=active]:shadow-md transition-all font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">\n                <Luggage className="size-4 mr-2" /> Malas & Cases\n              </TabsTrigger>'
  );

  content = content.replace(
    '</TabsContent>\n      </Tabs>\n\n      <div className="flex gap-3 justify-end sticky bottom-4">', 
    '</TabsContent>\n\n        <TabsContent value="malas" className="mt-0">\n          <MalasViagemTab malas={d.automacoes?.malas || []} onChange={malas => up("automacoes", { ...d.automacoes, malas })} />\n        </TabsContent>\n      </Tabs>\n\n      <div className="flex gap-3 justify-end sticky bottom-4">'
  );

  fs.writeFileSync('src/components/RoadbookForm.tsx', content);
}
console.log('updated RoadbookForm');
