const fs = require('fs');

let malas = fs.readFileSync('src/routes/_authenticated/malas.index.tsx', 'utf8');

// Remove import
malas = malas.replace(/import { EstoqueGlobalTab } from '@\/components\/EstoqueGlobalTab';\n/g, '');

// Fix TabsList grid to cols-2
malas = malas.replace(/grid-cols-3/g, 'grid-cols-2');

// Remove trigger
malas = malas.replace(/<TabsTrigger value="estoque" className="rounded-lg h-full font-bold">Estoque Global<\/TabsTrigger>\n/g, '');

// Remove content block
malas = malas.replace(/<TabsContent value="estoque" className="mt-0">\s*<EstoqueGlobalTab \/>\s*<\/TabsContent>/g, '');

fs.writeFileSync('src/routes/_authenticated/malas.index.tsx', malas, 'utf8');
