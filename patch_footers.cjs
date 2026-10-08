const fs = require('fs');

const screenFooterHtml = `
        <footer className="pt-8 pb-12 flex flex-col items-center justify-center gap-4 text-xs text-muted-foreground print:hidden">
          <div className="flex items-center gap-6">
            <img src="/logo-contemporanea.png" alt="Contemporânea Produções" className="h-8 object-contain opacity-80" />
            <span className="w-px h-8 bg-slate-200"></span>
            <img src="/logo-axis-simples.png" alt="Áxis" className="h-8 object-contain opacity-80" />
          </div>
          <div className="text-center">
            <strong className="block font-bold text-slate-500 uppercase tracking-widest mb-1">Gestão de Teatros e Shows</strong>
            <span>Desenvolvido por Marcelo Garuffi</span>
          </div>
        </footer>
`;

const printFooterHtml = `
function PrintFooter() {
  return (
    <div className="flex justify-between items-center text-[9px] text-slate-400 border-t border-slate-200/60 pt-3 mt-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <img src="/logo-contemporanea.png" alt="Contemporânea" className="h-5 object-contain grayscale opacity-80" />
          <span className="w-px h-5 bg-slate-200"></span>
          <img src="/logo-axis-simples.png" alt="Áxis" className="h-5 object-contain grayscale opacity-80" />
        </div>
        <div className="flex flex-col gap-0.5 border-l border-slate-200 pl-4">
          <strong className="font-sans font-bold tracking-widest uppercase text-slate-500">Gestão de Teatros e Shows</strong>
          <span className="font-sans font-medium text-slate-400">Desenvolvido por Marcelo Garuffi</span>
        </div>
      </div>
      <div className="flex items-center justify-center relative size-7 shrink-0 bg-slate-200 rounded-full">
        <span className="relative z-10 text-[10px] font-bold text-slate-600 leading-none print-page-number"></span>
      </div>
    </div>
  );
}
`;

function replaceFooter(file) {
    if (!fs.existsSync(file)) return;
    let c = fs.readFileSync(file, 'utf8');
    
    // Replace PrintFooter function
    c = c.replace(/function PrintFooter\(\) \{[\s\S]*?\}\n/g, printFooterHtml);
    
    // Replace screen footer in rb.$slug.tsx
    c = c.replace(/<footer className="pt-8 pb-12 text-center text-xs text-muted-foreground">[\s\S]*?<\/footer>/g, screenFooterHtml.trim());
    
    // Replace screen footer in turne.$slug.tsx
    c = c.replace(/<footer className="mt-20 border-t border-border pt-8 pb-12 flex flex-col items-center justify-center text-center gap-2">[\s\S]*?<\/footer>/g, screenFooterHtml.trim());

    fs.writeFileSync(file, c, 'utf8');
}

['src/routes/rb.$slug.tsx', 'src/routes/turne.$slug.tsx', 'src/routes/turne-completa.$slug.tsx', 'src/routes/_authenticated/print.$slug.tsx', 'src/routes/motorista-print.$slug.tsx'].forEach(replaceFooter);
console.log("Done");
