const fs = require('fs');

let c = fs.readFileSync('src/routes/rb.$slug.tsx', 'utf8');

c = c.replace(
    /const title = loaderData \? `\$\{loaderData\.espetaculo\} â€” \$\{loaderData\.cidade\}` : "Guia de Viagem";/,
    'const title = loaderData ? `${loaderData.espetaculo} - ${loaderData.cidade} - Áxis - Gestão de Teatros e Shows` : "Guia de Viagem - Áxis - Gestão de Teatros e Shows";'
);
// In case the symbol was different or already replaced:
c = c.replace(
    /const title = loaderData \? `\$\{loaderData\.espetaculo\} — \$\{loaderData\.cidade\}` : "Guia de Viagem";/,
    'const title = loaderData ? `${loaderData.espetaculo} - ${loaderData.cidade} - Áxis - Gestão de Teatros e Shows` : "Guia de Viagem - Áxis - Gestão de Teatros e Shows";'
);

fs.writeFileSync('src/routes/rb.$slug.tsx', c, 'utf8');
