const fs = require('fs');

function replaceFile(path, regex, repl) {
    if (!fs.existsSync(path)) return;
    let c = fs.readFileSync(path, 'utf8');
    c = c.replace(regex, repl);
    fs.writeFileSync(path, c, 'utf8');
}

// 1. turne.$slug.tsx
replaceFile('src/routes/turne.$slug.tsx',
    /<footer className="pt-12 pb-8 text-center text-\[10px\] font-medium text-slate-400 dark:text-slate-500 flex flex-col gap-1">[\s\S]*?<\/footer>/,
`        <footer className="pt-12 pb-8 flex flex-col items-center justify-center gap-4 text-[10px] text-slate-400 dark:text-slate-500">
          <div className="flex items-center justify-center gap-6">
            <img src="/logo-contemporanea.png" alt="Contemporânea" className="h-6 object-contain opacity-80" />
            <span className="w-px h-6 bg-slate-200"></span>
            <img src="/logo-axis-simples.png" alt="Áxis" className="h-6 object-contain opacity-80" />
          </div>
          <div className="text-center flex flex-col gap-1">
            <span className="font-bold tracking-widest uppercase text-slate-500 text-[10px]">Gestão de Teatros e Shows</span>
            <span className="text-[10px]">Desenvolvido por Marcelo Garuffi</span>
          </div>
        </footer>`
);

// 2. turne-completa.$slug.tsx
replaceFile('src/routes/turne-completa.$slug.tsx',
    /function FixedPrintFooter\(\) \{[\s\S]*?\}\n/,
`function FixedPrintFooter() {
  return (
    <div className="hidden print:flex fixed bottom-0 left-0 w-full flex-col items-center justify-center text-[9px] text-slate-400 pt-4 pb-6 bg-white z-50">
      <div className="w-full max-w-[21cm] mx-auto border-t border-slate-200/60 pt-4 flex flex-col items-center justify-center gap-3 text-center">
        <div className="flex items-center justify-center gap-4">
          <img src="/logo-contemporanea.png" alt="Contemporânea" className="h-5 object-contain grayscale opacity-80" />
          <span className="w-px h-5 bg-slate-200"></span>
          <img src="/logo-axis-simples.png" alt="Áxis" className="h-5 object-contain grayscale opacity-80" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-sans font-bold tracking-widest uppercase text-slate-500">Gestão de Teatros e Shows</span>
          <span className="font-sans font-medium text-slate-400">Desenvolvido por Marcelo Garuffi</span>
        </div>
      </div>
    </div>
  );
}
`
);

// 3. motorista-print.$slug.tsx
replaceFile('src/routes/motorista-print.$slug.tsx',
    /<div style=\{\{ textAlign: 'center', fontSize: '10px', color: '#666', borderTop: '1px solid #ccc', paddingTop: '10px' \}\}>[\s\S]*?<\/div>/,
`      <div style={{ textAlign: 'center', fontSize: '10px', color: '#666', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          <img src="/logo-contemporanea.png" style={{ height: '24px', opacity: 0.8 }} />
          <div style={{ width: '1px', height: '20px', backgroundColor: '#ccc' }}></div>
          <img src="/logo-axis-simples.png" style={{ height: '24px', opacity: 0.8 }} />
        </div>
        <strong style={{ display: 'block', textTransform: 'uppercase', marginBottom: '4px' }}>Gestão de Teatros e Shows</strong>
        Desenvolvido por Marcelo Garuffi
      </div>`
);

// 4. _authenticated/print.$slug.tsx
replaceFile('src/routes/_authenticated/print.$slug.tsx',
    /<footer className="mt-16 pb-8 text-center text-\[10px\] font-medium text-slate-400 no-print flex flex-col gap-1">[\s\S]*?<\/footer>/,
`          <footer className="mt-16 pb-8 flex flex-col items-center justify-center gap-4 text-[10px] font-medium text-slate-400 no-print">
            <div className="flex items-center justify-center gap-6">
              <img src="/logo-contemporanea.png" alt="Contemporânea" className="h-6 object-contain opacity-80" />
              <span className="w-px h-6 bg-slate-200"></span>
              <img src="/logo-axis-simples.png" alt="Áxis" className="h-6 object-contain opacity-80" />
            </div>
            <div className="text-center flex flex-col gap-1">
              <span className="font-bold tracking-widest uppercase text-slate-500">Gestão de Teatros e Shows</span>
              <span>Desenvolvido por Marcelo Garuffi</span>
            </div>
          </footer>`
);

replaceFile('src/routes/_authenticated/print.$slug.tsx',
    /function PrintFooter\(\) \{[\s\S]*?\}\n/,
`function PrintFooter() {
  return (
    <div className="flex flex-col items-center justify-center text-[9px] text-slate-400 border-t border-slate-200/60 pt-4 mt-6 gap-3 text-center">
      <div className="flex items-center justify-center gap-4">
        <img src="/logo-contemporanea.png" alt="Contemporânea" className="h-5 object-contain grayscale opacity-80" />
        <span className="w-px h-5 bg-slate-200"></span>
        <img src="/logo-axis-simples.png" alt="Áxis" className="h-5 object-contain grayscale opacity-80" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-sans font-bold tracking-widest uppercase text-slate-500">Gestão de Teatros e Shows</span>
        <span className="font-sans font-medium text-slate-400">Desenvolvido por Marcelo Garuffi</span>
      </div>
    </div>
  );
}
`
);

console.log("Done");
