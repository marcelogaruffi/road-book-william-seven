const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/rooming-list.tsx', 'utf8');
content = content.replace('import GridEventos from "@/components/GridEventos";', 'import { GridEventos } from "@/components/GridEventos";');
fs.writeFileSync('src/routes/_authenticated/rooming-list.tsx', content, 'utf8');
