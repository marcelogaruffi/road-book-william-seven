const fs = require('fs');

function replaceFile(path) {
    if (!fs.existsSync(path)) return;
    let c = fs.readFileSync(path, 'utf8');
    
    // For screen footers (usually h-6 or h-8): make them h-12 (48px)
    c = c.replace(/className="h-6 object-contain opacity-80"/g, 'className="h-10 sm:h-12 object-contain opacity-80"');
    c = c.replace(/className="h-8 object-contain opacity-80"/g, 'className="h-10 sm:h-12 object-contain opacity-80"');
    
    // For the separator line, match the height
    c = c.replace(/className="w-px h-6 bg-slate-200"/g, 'className="hidden sm:block w-px h-10 bg-slate-200"');
    c = c.replace(/className="w-px h-8 bg-slate-200"/g, 'className="hidden sm:block w-px h-10 bg-slate-200"');
    
    // For Print/PDF footers (usually h-5 grayscale): make them h-8 (32px)
    c = c.replace(/className="h-5 object-contain grayscale opacity-80"/g, 'className="h-8 object-contain opacity-80"');
    // Also remove grayscale if they want it colorful in PDF too, or keep it? I'll remove grayscale so it pops more.
    
    // PDF separator line
    c = c.replace(/className="w-px h-5 bg-slate-200"/g, 'className="w-px h-8 bg-slate-200"');
    
    // Motorista (inline styles)
    c = c.replace(/height: '24px', opacity: 0.8/g, "height: '36px', opacity: 0.8");
    c = c.replace(/height: '20px', backgroundColor/g, "height: '32px', backgroundColor");
    
    fs.writeFileSync(path, c, 'utf8');
}

['src/routes/rb.$slug.tsx', 'src/routes/turne.$slug.tsx', 'src/routes/turne-completa.$slug.tsx', 'src/routes/_authenticated/print.$slug.tsx', 'src/routes/motorista-print.$slug.tsx'].forEach(replaceFile);
console.log("Done");
