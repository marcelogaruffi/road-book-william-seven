const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/tour.index.tsx', 'utf8');

const regex = /const toursWithDates = tours\.map/g;
const replacement = `// Ocultar a turnê "Junho" a pedido do usuário
  const visibleTours = tours.filter(t => t.id !== '680c86cd-a51a-43d5-a352-56e99ecd563b');

  const toursWithDates = visibleTours.map`;

content = content.replace(regex, replacement);

fs.writeFileSync('src/routes/_authenticated/tour.index.tsx', content, 'utf8');
