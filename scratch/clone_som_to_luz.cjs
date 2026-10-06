const fs = require('fs');

let code = fs.readFileSync('src/routes/_authenticated/som.index.tsx', 'utf8');

// Replacements
code = code.replace(/mapas_som/g, 'mapas_luz');
code = code.replace(/MapaSom/g, 'MapaLuz');
code = code.replace(/SomComponent/g, 'IluminacaoComponent');
code = code.replace(/Route = createFileRoute\('\/_authenticated\/som\/'\)/g, "Route = createFileRoute('/_authenticated/iluminacao/')");
code = code.replace(/Painel de Som/g, 'Painel de Iluminação');
code = code.replace(/Mapas de Som/g, 'Mapas de Luz');
code = code.replace(/Mapa de Som/g, 'Mapa de Luz');
code = code.replace(/Rider Técnico de som/g, 'Rider Técnico de luz');
code = code.replace(/Mic2/g, 'Lightbulb');
code = code.replace(/text-blue-/g, 'text-amber-');
code = code.replace(/bg-blue-/g, 'bg-amber-');
code = code.replace(/border-blue-/g, 'border-amber-');
code = code.replace(/\/som\//g, '/iluminacao/');

fs.writeFileSync('src/routes/_authenticated/iluminacao.index.tsx', code, 'utf8');
