const fs = require('fs');

const files = [
  { index: 'som.index.tsx', id: 'som.$evento_id.tsx', template: '<TemplateRiderSomViewer role={role} />', import: 'import TemplateRiderSomViewer from "@/components/TemplateRiderSomViewer";' },
  { index: 'video.index.tsx', id: 'video.$evento_id.tsx', template: '<TemplateRidersTab role={role} context="video" />', import: 'import TemplateRidersTab from "@/components/TemplateRidersTab";' },
  { index: 'iluminacao.index.tsx', id: 'iluminacao.$evento_id.tsx', template: '<TemplateRidersTab role={role} context="luz" />', import: 'import TemplateRidersTab from "@/components/TemplateRidersTab";' },
  { index: 'som-operacao.index.tsx', id: 'som-operacao.$evento_id.tsx', template: '<TemplateCuesTab role={role} />', import: 'import { TemplateCuesTab } from "@/components/som-operacao/TemplateCuesTab";' },
  { index: 'malas.index.tsx', id: 'malas.$evento_id.tsx', template: '<MalasTemplateTab />', import: 'import { MalasTemplateTab } from "@/components/MalasTemplateTab";' }
];

for (const f of files) {
  // 1. Process index.tsx
  let idxCode = fs.readFileSync('src/routes/_authenticated/' + f.index, 'utf8');
  idxCode = idxCode.replace(/<TabsList[^>]*>[\s\S]*?<\/TabsList>/, '');
  idxCode = idxCode.replace(/<TabsContent value="modelos"[^>]*>[\s\S]*?<\/TabsContent>/, '');
  idxCode = idxCode.replace(/<Tabs[^>]*>/, '');
  idxCode = idxCode.replace(/<\/Tabs>/, '');
  idxCode = idxCode.replace(/<TabsContent value="eventos"[^>]*>/, '');
  idxCode = idxCode.replace(/<\/TabsContent>/, ''); 
  fs.writeFileSync('src/routes/_authenticated/' + f.index, idxCode, 'utf8');

  // 2. Process $evento_id.tsx
  let idCode = fs.readFileSync('src/routes/_authenticated/' + f.id, 'utf8');
  if (!idCode.includes(f.import)) {
    idCode = idCode.replace(/(import .*?;[\r\n]+)/, `$1${f.import}\nimport { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";\n`);
  }
  
  // Find the last return ( which is usually the main render
  // Instead of complex parsing, let's wrap the outermost div of the main return
  // Usually it looks like:
  // return (\n    <div className="max-w-4xl mx-auto space-y-6 pb-20">
  // We want to replace it with:
  // return (<Tabs defaultValue="evento" className="w-full"><TabsList className="grid w-full grid-cols-2 bg-slate-100 rounded-xl h-14 p-1 mb-6"><TabsTrigger value="evento" className="rounded-lg h-full font-bold">Mapa do Evento</TabsTrigger><TabsTrigger value="modelos" className="rounded-lg h-full font-bold">Modelos (Padrão)</TabsTrigger></TabsList><TabsContent value="evento">
  // and append </TabsContent><TabsContent value="modelos">{template}</TabsContent></Tabs>)
  
  const returnRegex = /return \(\s*<div([^>]*className="max-w-[^>]*>[\s\S]*)\s*\);\s*}/;
  idCode = idCode.replace(returnRegex, (match, p1) => {
    // Need to extract 'role' if needed by the template
    let roleDecl = '';
    if (f.template.includes('role={role}') && !idCode.includes('const role =')) {
      // add role from profile? The file usually doesn't have profile.
      // Wait, let's just pass null or fetch it. Most pages already have it or don't need it.
      if (!idCode.includes('useRouteContext')) {
        roleDecl = 'const role = null; // add if needed';
      }
    }
    
    return `return (
      <Tabs defaultValue="evento" className="w-full px-2 md:px-6 py-6 max-w-6xl mx-auto">
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-slate-100 dark:bg-white/10 rounded-xl h-14 p-1 mb-6 mx-auto">
          <TabsTrigger value="evento" className="rounded-lg h-full font-bold">Mapa do Evento</TabsTrigger>
          <TabsTrigger value="modelos" className="rounded-lg h-full font-bold">Modelos (Padrão)</TabsTrigger>
        </TabsList>
        <TabsContent value="evento" className="mt-0">
          <div${p1}
        </TabsContent>
        <TabsContent value="modelos" className="mt-0">
          ${f.template}
        </TabsContent>
      </Tabs>
    );
}`;
  });

  fs.writeFileSync('src/routes/_authenticated/' + f.id, idCode, 'utf8');
  console.log(`Processed ${f.index} and ${f.id}`);
}
