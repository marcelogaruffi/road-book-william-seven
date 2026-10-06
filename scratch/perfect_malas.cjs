const fs = require('fs');

let code = fs.readFileSync('src/routes/_authenticated/malas.$evento_id.tsx', 'utf8');

// 1. Ensure the import is there
if (!code.includes('import { MalasTemplateTab }')) {
  code = code.replace(/(import .*?;[\r\n]+)/, '$1import { MalasTemplateTab } from "@/components/MalasTemplateTab";\nimport { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";\n');
}

// 2. Remove the old header string
const headerRegex = /<div className="flex items-center justify-between mb-4">[\s\S]*?<Button onClick=\{saveChecklist\}[\s\S]*?<\/Button>\s*<\/div>/;
const headerMatch = code.match(headerRegex);
let headerStr = '';
if (headerMatch) {
  headerStr = headerMatch[0];
  code = code.replace(headerStr, '');
}

// 3. Find the main return block and inject Tabs + Header
// The return block starts with `return (\s*<div className="max-w-4xl mx-auto space-y-6 pb-20">`
const returnRegex = /return \([\s\S]*?<div className="max-w-4xl mx-auto space-y-6 pb-20">/;
if (code.match(returnRegex)) {
  const replacement = `return (
    <>
      <div className="w-full px-2 md:px-6 max-w-4xl mx-auto mb-6 mt-4">
        ${headerStr}
      </div>
      <Tabs defaultValue="evento" className="w-full px-2 md:px-6 py-6 max-w-6xl mx-auto">
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-slate-100 dark:bg-white/10 rounded-xl h-14 p-1 mb-6 mx-auto">
          <TabsTrigger value="evento" className="rounded-lg h-full font-bold">Mapa do Evento</TabsTrigger>
          <TabsTrigger value="modelos" className="rounded-lg h-full font-bold">Modelos (Padrão)</TabsTrigger>
        </TabsList>
        <TabsContent value="evento" className="mt-0">
          <div className="max-w-4xl mx-auto space-y-6 pb-20">`;
  code = code.replace(returnRegex, replacement);
}

// 4. Fix the end of the file
// The file might end with:
//         </div>
//       )}
//     </div>
//   );
// }
// Or it might ALREADY have the broken TabsContent if fix_malas_manual.cjs was run!
// Let's just find the final `  );\n}` and replace what's right above it.
// If it already has `</TabsContent>`, let's clean it up first.
if (code.includes('<MalasTemplateTab />')) {
  // It was already modified by the broken script, let's remove the broken injection
  code = code.replace(/<\/TabsContent>[\s\S]*?<MalasTemplateTab \/>[\s\S]*?<\/Tabs>[\s\S]*?\);[\s\S]*?\}/, '</div>\n  );\n}');
}

// Now do a clean injection at the end
const endRegex = /([ \t]*)\}\)\}\s*<\/div>\s*\);\s*\}/;
if (code.match(endRegex)) {
  code = code.replace(endRegex, `$1})}\n          </div>\n        </TabsContent>\n        <TabsContent value="modelos" className="mt-0">\n          <MalasTemplateTab />\n        </TabsContent>\n      </Tabs>\n    </>\n  );\n}`);
}

fs.writeFileSync('src/routes/_authenticated/malas.$evento_id.tsx', code, 'utf8');
