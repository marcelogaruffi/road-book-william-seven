const fs = require('fs');

let content = fs.readFileSync('src/components/RoadbookForm.tsx', 'utf8');

// Replace Espetaculo
content = content.replace(
  /<label className="cursor-pointer text-white flex flex-col items-center w-full h-full justify-center">[\s\S]*?<input type="file" accept="image\/\*" className="hidden" onChange=\{\(e\) => \{[\s\S]*?uploadLogoOverride\(e\.target\.files\?\.\[0\], "logo_espetaculo_override"\);[\s\S]*?\}\} disabled=\{uploading\} \/>[\s\S]*?<\/label>/g,
  `<button type="button" className="cursor-pointer text-white flex flex-col items-center w-full h-full justify-center" onClick={() => setLogoPicker({open: true, field: "logo_espetaculo_override"})}>
  <Upload className="size-5 mb-1" />
  <span className="text-xs font-semibold">Substituir</span>
</button>`
);

content = content.replace(
  /<label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">[\s\S]*?<input type="file" accept="image\/\*" className="hidden" onChange=\{\(e\) => \{[\s\S]*?uploadLogoOverride\(e\.target\.files\?\.\[0\], "logo_espetaculo_override"\);[\s\S]*?\}\} disabled=\{uploading\} \/>[\s\S]*?<\/label>/g,
  `<button type="button" className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => setLogoPicker({open: true, field: "logo_espetaculo_override"})}>
  <div className="flex flex-col items-center justify-center py-4 text-center">
    <Upload className="size-5 text-slate-400 mb-1" />
    <span className="text-[10px] text-slate-500 leading-tight">Nenhum Padrão<br/>Selecionar/Upload</span>
  </div>
</button>`
);


// Replace Producao
content = content.replace(
  /<label className="cursor-pointer text-white flex flex-col items-center w-full h-full justify-center">[\s\S]*?<input type="file" accept="image\/\*" className="hidden" onChange=\{\(e\) => \{[\s\S]*?uploadLogoOverride\(e\.target\.files\?\.\[0\], "logo_producao_override"\);[\s\S]*?\}\} disabled=\{uploading\} \/>[\s\S]*?<\/label>/g,
  `<button type="button" className="cursor-pointer text-white flex flex-col items-center w-full h-full justify-center" onClick={() => setLogoPicker({open: true, field: "logo_producao_override"})}>
  <Upload className="size-5 mb-1" />
  <span className="text-xs font-semibold">Substituir</span>
</button>`
);

content = content.replace(
  /<label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">[\s\S]*?<input type="file" accept="image\/\*" className="hidden" onChange=\{\(e\) => \{[\s\S]*?uploadLogoOverride\(e\.target\.files\?\.\[0\], "logo_producao_override"\);[\s\S]*?\}\} disabled=\{uploading\} \/>[\s\S]*?<\/label>/g,
  `<button type="button" className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => setLogoPicker({open: true, field: "logo_producao_override"})}>
  <div className="flex flex-col items-center justify-center py-4 text-center">
    <Upload className="size-5 text-slate-400 mb-1" />
    <span className="text-[10px] text-slate-500 leading-tight">Nenhum Padrão<br/>Selecionar/Upload</span>
  </div>
</button>`
);


// Replace Cia
content = content.replace(
  /<label className="cursor-pointer text-white flex flex-col items-center w-full h-full justify-center">[\s\S]*?<input type="file" accept="image\/\*" className="hidden" onChange=\{\(e\) => \{[\s\S]*?uploadLogoOverride\(e\.target\.files\?\.\[0\], "logo_cia_override"\);[\s\S]*?\}\} disabled=\{uploading\} \/>[\s\S]*?<\/label>/g,
  `<button type="button" className="cursor-pointer text-white flex flex-col items-center w-full h-full justify-center" onClick={() => setLogoPicker({open: true, field: "logo_cia_override"})}>
  <Upload className="size-5 mb-1" />
  <span className="text-xs font-semibold">Substituir</span>
</button>`
);

content = content.replace(
  /<label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">[\s\S]*?<input type="file" accept="image\/\*" className="hidden" onChange=\{\(e\) => \{[\s\S]*?uploadLogoOverride\(e\.target\.files\?\.\[0\], "logo_cia_override"\);[\s\S]*?\}\} disabled=\{uploading\} \/>[\s\S]*?<\/label>/g,
  `<button type="button" className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => setLogoPicker({open: true, field: "logo_cia_override"})}>
  <div className="flex flex-col items-center justify-center py-4 text-center">
    <Upload className="size-5 text-slate-400 mb-1" />
    <span className="text-[10px] text-slate-500 leading-tight">Nenhum Padrão<br/>Selecionar/Upload</span>
  </div>
</button>`
);

fs.writeFileSync('src/components/RoadbookForm.tsx', content, 'utf8');
console.log('Patched RoadbookForm');
