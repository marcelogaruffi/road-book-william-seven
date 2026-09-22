const fs = require('fs');

function fixEspetaculos() {
    let content = fs.readFileSync('src/routes/_authenticated/espetaculos.tsx', 'utf8');
    
    if (!content.includes('import { LogoPicker }')) {
        content = content.replace(
            'import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";',
            `import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";\nimport { LogoPicker } from "@/components/LogoPicker";`
        );
    }
    
    content = content.replace('setLogoEspetaculo(url);', 'setCurrentShow(s => ({ ...s, logo_espetaculo_url: url }));');
    content = content.replace('setLogoCia(url);', 'setCurrentShow(s => ({ ...s, logo_cia_url: url }));');
    
    fs.writeFileSync('src/routes/_authenticated/espetaculos.tsx', content, 'utf8');
}

function fixEventos() {
    let content = fs.readFileSync('src/routes/_authenticated/eventos.tsx', 'utf8');
    if (!content.includes('import { LogoPicker }')) {
        content = content.replace(
            'import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";',
            `import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";\nimport { LogoPicker } from "@/components/LogoPicker";`
        );
    }
    fs.writeFileSync('src/routes/_authenticated/eventos.tsx', content, 'utf8');
}

fixEspetaculos();
fixEventos();
console.log('Fixed TS errors');
