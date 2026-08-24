const fs = require('fs');
let content = fs.readFileSync('src/components/RoadbookForm.tsx', 'utf8');

// Replace TabsList end to include malas
let newContent = content.replace(
  'value="docs"',
  'value="docs"' 
);

newContent = content.replace(
  '</TabsList>',
  '  <TabsTrigger value="malas" className="rounded-2xl px-5 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-200 data-[state=active]:text-primary dark:data-[state=active]:text-slate-900 data-[state=active]:shadow-md transition-all font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">\n                <Luggage className="size-4 mr-2" /> Malas & Cases\n              </TabsTrigger>\n            </TabsList>'
);

// Add TabsContent before </Tabs>
newContent = newContent.replace(
  '</Tabs>\n\n      <div className="flex gap-3 justify-end sticky bottom-4">',
  '  <TabsContent value="malas" className="mt-0">\n          <MalasViagemTab malas={d.automacoes?.malas || []} onChange={malas => up("automacoes", { ...d.automacoes, malas })} />\n        </TabsContent>\n      </Tabs>\n\n      <div className="flex gap-3 justify-end sticky bottom-4">'
);

// Fix Luggage import
if (!newContent.includes('Luggage, Trash2')) {
  newContent = newContent.replace('Trash2, Plus,', 'Luggage, Trash2, Plus,');
}

fs.writeFileSync('src/components/RoadbookForm.tsx', newContent);
console.log('updated RoadbookForm again');
