const fs = require('fs');

function replaceFile(path) {
    if (!fs.existsSync(path)) return;
    let c = fs.readFileSync(path, 'utf8');
    
    // Increase logo sizes again
    // Screen
    c = c.replace(/className="h-10 sm:h-12 object-contain opacity-80"/g, 'className="h-14 sm:h-16 object-contain opacity-90"');
    c = c.replace(/className="hidden sm:block w-px h-10 bg-slate-200"/g, 'className="hidden sm:block w-px h-14 bg-slate-200"');
    
    // PDF
    c = c.replace(/className="h-8 object-contain opacity-80"/g, 'className="h-10 object-contain opacity-90"');
    c = c.replace(/className="w-px h-8 bg-slate-200"/g, 'className="w-px h-10 bg-slate-200"');
    
    // Motorista (inline styles)
    c = c.replace(/height: '36px', opacity: 0.8/g, "height: '44px', opacity: 0.9");
    c = c.replace(/height: '32px', backgroundColor/g, "height: '40px', backgroundColor");

    // Change text
    c = c.replace(/<span>Desenvolvido por Marcelo Garuffi<\/span>/g, '<span>Desenvolvido por Marcelo Garuffi - Contemporânea Produções</span>');
    c = c.replace(/<span className="text-\[10px\]">Desenvolvido por Marcelo Garuffi<\/span>/g, '<span className="text-[10px]">Desenvolvido por Marcelo Garuffi - Contemporânea Produções</span>');
    c = c.replace(/<span className="font-sans font-medium text-slate-400">Desenvolvido por Marcelo Garuffi<\/span>/g, '<span className="font-sans font-medium text-slate-400">Desenvolvido por Marcelo Garuffi - Contemporânea Produções</span>');
    
    // Motorista
    c = c.replace(/Desenvolvido por Marcelo Garuffi\s*<\/div>/g, 'Desenvolvido por Marcelo Garuffi - Contemporânea Produções\n      </div>');
    
    fs.writeFileSync(path, c, 'utf8');
}

['src/routes/rb.$slug.tsx', 'src/routes/turne.$slug.tsx', 'src/routes/turne-completa.$slug.tsx', 'src/routes/_authenticated/print.$slug.tsx', 'src/routes/motorista-print.$slug.tsx'].forEach(replaceFile);
console.log("Done");
