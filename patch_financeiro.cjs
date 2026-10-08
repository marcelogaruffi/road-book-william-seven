const fs = require('fs');
let c = fs.readFileSync('src/routes/_authenticated/financeiro.tsx', 'utf8');

if (!c.includes('NotasBoletosTab')) {
    c = c.replace('import { CachesPadraoTab } from "@/components/CachesPadraoTab";', 'import { CachesPadraoTab } from "@/components/CachesPadraoTab";\nimport { NotasBoletosTab } from "@/components/NotasBoletosTab";');
    
    // Change the grid cols
    c = c.replace('grid w-full max-w-md grid-cols-2 bg-slate-100', 'grid w-full max-w-xl grid-cols-3 bg-slate-100');
    
    // Add the trigger
    c = c.replace(
        '<TabsTrigger value="caches" className="rounded-lg font-bold text-xs sm:text-sm">Cachês da Equipe</TabsTrigger>',
        '<TabsTrigger value="caches" className="rounded-lg font-bold text-xs sm:text-sm">Cachês da Equipe</TabsTrigger>\n                    <TabsTrigger value="notas" className="rounded-lg font-bold text-xs sm:text-sm">Notas e Boletos</TabsTrigger>'
    );
    
    // Add the content
    c = c.replace(
        '<CachesEquipeTab roadbookId={selectedRoadbook} />\n                    </TabsContent>',
        '<CachesEquipeTab roadbookId={selectedRoadbook} />\n                    </TabsContent>\n\n                    <TabsContent value="notas" className="mt-0">\n                      <NotasBoletosTab roadbookId={selectedRoadbook} />\n                    </TabsContent>'
    );
    
    fs.writeFileSync('src/routes/_authenticated/financeiro.tsx', c, 'utf8');
    console.log("Integrated");
} else {
    console.log("Already integrated");
}
