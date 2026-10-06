const fs = require('fs');

let idCode = fs.readFileSync('src/routes/_authenticated/malas.$evento_id.tsx', 'utf8');

// We want to add the template import and replace the MAIN return.
// The main return is `return (\n    <div className="max-w-4xl mx-auto space-y-6 pb-20">`
if (!idCode.includes('import { MalasTemplateTab } from "@/components/MalasTemplateTab";')) {
  idCode = idCode.replace(/(import .*?;[\r\n]+)/, '$1import { MalasTemplateTab } from "@/components/MalasTemplateTab";\nimport { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";\n');
}

// Replace the main return block precisely
const target = `return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">`;
const replacement = `return (
  <Tabs defaultValue="evento" className="w-full px-2 md:px-6 py-6 max-w-6xl mx-auto">
    <TabsList className="grid w-full grid-cols-2 max-w-md bg-slate-100 dark:bg-white/10 rounded-xl h-14 p-1 mb-6 mx-auto">
      <TabsTrigger value="evento" className="rounded-lg h-full font-bold">Mapa do Evento</TabsTrigger>
      <TabsTrigger value="modelos" className="rounded-lg h-full font-bold">Modelos (Padrão)</TabsTrigger>
    </TabsList>
    <TabsContent value="evento" className="mt-0">
      <div className="max-w-4xl mx-auto space-y-6 pb-20">`;

idCode = idCode.replace(target, replacement);

// And we need to add the closing tags to the very end of the file.
// The file ends with:
//         </div>
//       )}
//     </div>
//   );
// }

idCode = idCode.replace(/      \}\)\}\r?\n    <\/div>\r?\n  \);\r?\n\}/, `      })}\n    </div>\n    </TabsContent>\n    <TabsContent value="modelos" className="mt-0">\n      <MalasTemplateTab />\n    </TabsContent>\n  </Tabs>\n  );\n}`);

fs.writeFileSync('src/routes/_authenticated/malas.$evento_id.tsx', idCode, 'utf8');
