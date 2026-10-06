const fs = require('fs');

// Fix malas.index.tsx duplication
let malas = fs.readFileSync('src/routes/_authenticated/malas.index.tsx', 'utf8');
const searchStr = `
        <TabsContent value="estoque" className="mt-0">
          <EstoqueGlobalTab />
        </TabsContent>

        <TabsContent value="estoque" className="mt-0">
          <EstoqueGlobalTab />
        </TabsContent>
`;
const replaceStr = `
        <TabsContent value="estoque" className="mt-0">
          <EstoqueGlobalTab />
        </TabsContent>
`;

// It might be spaced differently, so let's do a regex
malas = malas.replace(/<TabsContent value="estoque" className="mt-0">\s*<EstoqueGlobalTab \/>\s*<\/TabsContent>\s*<TabsContent value="estoque" className="mt-0">\s*<EstoqueGlobalTab \/>\s*<\/TabsContent>/g, '<TabsContent value="estoque" className="mt-0">\n          <EstoqueGlobalTab />\n        </TabsContent>');
fs.writeFileSync('src/routes/_authenticated/malas.index.tsx', malas, 'utf8');

// Fix Unicode in EstoqueGlobalTab.tsx
let estoque = fs.readFileSync('src/components/EstoqueGlobalTab.tsx', 'utf8');
estoque = estoque.replace(/Descri\\u00e7\\u00e3o/g, 'Descrição');
estoque = estoque.replace(/Este \\u00e9 o invent\\u00e1rio/g, 'Este é o inventário');
estoque = estoque.replace(/dispon\\u00edvel/g, 'disponível');
estoque = estoque.replace(/Altera\\u00e7\\u00f5es/g, 'Alterações');
fs.writeFileSync('src/components/EstoqueGlobalTab.tsx', estoque, 'utf8');
