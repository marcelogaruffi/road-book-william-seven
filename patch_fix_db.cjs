const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('src');
let changedFiles = 0;

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf-8');
    let original = content;
    
    content = content.replace(/from\("Guias de Viagem"\)/g, 'from("roadbooks")');
    content = content.replace(/from\('Guias de Viagem'\)/g, "from('roadbooks')");
    content = content.replace(/from\("Guia de Viagem"\)/g, 'from("roadbooks")');
    content = content.replace(/from\('Guia de Viagem'\)/g, "from('roadbooks')");
    content = content.replace(/from\("Guia de Viagem-docs"\)/g, 'from("roadbook-docs")');
    content = content.replace(/from\('Guia de Viagem-docs'\)/g, "from('roadbook-docs')");

    // Also fixing variables that might have been broken by 'Roadbooks' -> 'Guias de Viagem' if they weren't quoted?
    // Wait, the regex ONLY replaced inside "..." or '...' or >...<
    // So variables like `const roadbooks` are safe!
    // But object keys? `roadbooks(cidade, ...)` inside supabase selects!
    content = content.replace(/\bGuias de Viagem\(/g, 'roadbooks(');

    // Any import paths? "Guias de Viagem" won't match paths usually unless it had quotes
    // But `import ... from "roadbooks"` ? No, no such import.
    
    if (content !== original) {
        fs.writeFileSync(f, content);
        console.log('Fixed DB call in', f);
        changedFiles++;
    }
});
console.log('Fixed', changedFiles);
