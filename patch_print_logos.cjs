const fs = require('fs');

let vPrint = fs.readFileSync('src/routes/motorista-print.$slug.tsx', 'utf8');

// Replace left logo
vPrint = vPrint.replace(
    /<img src="\/logo-axis\.png" alt="Ã xis" style=\{\{ height: '50px', objectFit: 'contain' \}\} \/>|<img src="\/logo-axis\.png" alt="Áxis" style=\{\{ height: '50px', objectFit: 'contain' \}\} \/>/,
`{(rb as any)._resolved_logos?.logoProducao ? (
            <img src={(rb as any)._resolved_logos.logoProducao} alt="Produtora" style={{ height: '50px', objectFit: 'contain' }} />
          ) : (
            <div style={{ width: '50px' }}></div>
          )}`
);

// Replace right logo
vPrint = vPrint.replace(
    /\{rb\.espetaculo_logo_url \? \([\s\S]*?<img src=\{rb\.espetaculo_logo_url\} alt=\{rb\.espetaculo\} style=\{\{ height: '60px', objectFit: 'contain' \}\} \/>[\s\S]*?\) : \([\s\S]*?<div style=\{\{ width: '60px' \}\}><\/div>[\s\S]*?\)\}/,
`{(rb as any)._resolved_logos?.logoEspetaculo ? (
            <img src={(rb as any)._resolved_logos.logoEspetaculo} alt="Espetáculo" style={{ height: '50px', objectFit: 'contain' }} />
          ) : (
            <div style={{ width: '50px' }}></div>
          )}`
);

fs.writeFileSync('src/routes/motorista-print.$slug.tsx', vPrint, 'utf8');
console.log("Done");
