const fs = require('fs');

// 1. viagens.tsx
let c1 = fs.readFileSync('src/routes/_authenticated/viagens.tsx', 'utf8');
c1 = c1.replace('excluir este Road Book?', 'excluir este Guia de Viagem?');
fs.writeFileSync('src/routes/_authenticated/viagens.tsx', c1, 'utf8');

// 2. eventos.tsx
let c2 = fs.readFileSync('src/routes/_authenticated/eventos.tsx', 'utf8');
c2 = c2.replace('um Road Book ainda', 'um Guia de Viagem ainda');
fs.writeFileSync('src/routes/_authenticated/eventos.tsx', c2, 'utf8');

// 3. RoadbookForm.tsx
let c3 = fs.readFileSync('src/components/RoadbookForm.tsx', 'utf8');
c3 = c3.replace('ver este Roadbook.', 'ver este Guia de Viagem.');
fs.writeFileSync('src/components/RoadbookForm.tsx', c3, 'utf8');

// 4. tour.new.tsx
let c4 = fs.readFileSync('src/routes/_authenticated/tour.new.tsx', 'utf8');
c4 = c4.replace('cabeçalho do Roadbook (PDF).', 'cabeçalho do Guia de Viagem (PDF).');
// The file is using utf-8, maybe the string in regex should handle accents correctly.
// Let's just use 'cabeçalho do Roadbook (PDF)' -> 'cabeçalho do Guia de Viagem (PDF)'
c4 = c4.replace(/cabe.alho do Roadbook \(PDF\)/, 'cabeçalho do Guia de Viagem (PDF)');
fs.writeFileSync('src/routes/_authenticated/tour.new.tsx', c4, 'utf8');

console.log("Done");
