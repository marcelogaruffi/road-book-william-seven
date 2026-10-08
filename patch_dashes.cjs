const fs = require('fs');

function replaceFile(path) {
    if (!fs.existsSync(path)) return;
    let c = fs.readFileSync(path, 'utf8');
    
    // Replace em dash
    c = c.replace(/`\$\{loaderData\.espetaculo\} — \$\{loaderData\.cidade\} - Áxis - Gestão de Teatros e Shows`/g, '`${loaderData.espetaculo} - ${loaderData.cidade} - Áxis - Gestão de Teatros e Shows`');
    c = c.replace(/`\$\{loaderData\.tour\.nome\} — Turnê Completa - Áxis - Gestão de Teatros e Shows`/g, '`${loaderData.tour.nome} - Turnê Completa - Áxis - Gestão de Teatros e Shows`');
    c = c.replace(/`\$\{loaderData\.tour\.nome\} — Turnê - Áxis - Gestão de Teatros e Shows`/g, '`${loaderData.tour.nome} - Turnê - Áxis - Gestão de Teatros e Shows`');
    c = c.replace(/`\$\{loaderData\.espetaculo\} — \$\{loaderData\.cidade\}`/g, '`${loaderData.espetaculo} - ${loaderData.cidade}`'); // fallback
    
    fs.writeFileSync(path, c, 'utf8');
}

['src/routes/turne.$slug.tsx', 'src/routes/turne-completa.$slug.tsx', 'src/routes/_authenticated/print.$slug.tsx', 'src/routes/motorista-print.$slug.tsx'].forEach(replaceFile);
console.log("Done");
