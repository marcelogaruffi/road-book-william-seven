const fs = require('fs');

// 1. Update route.tsx to add "Sessão de Fotos"
let routeCode = fs.readFileSync('src/routes/_authenticated/route.tsx', 'utf8');
routeCode = routeCode.replace(
  /<SLink to="\/midias" icon=\{Smartphone\} label="Mídias Sociais"/g,
  '<SLink to="/fotos" icon={ImageIcon} label="Sessão de Fotos" show={isProdutor || userRole === \'midias_sociais\'} />\n                  <SLink to="/midias" icon={Smartphone} label="Mídias Sociais"'
);
// Import ImageIcon in route.tsx if needed
if (!routeCode.includes('ImageIcon')) {
  routeCode = routeCode.replace(/import \{([^}]+)\} from "lucide-react";/, 'import { $1, Image as ImageIcon } from "lucide-react";');
}
fs.writeFileSync('src/routes/_authenticated/route.tsx', routeCode, 'utf8');

console.log('Updated route.tsx');

// 2. Refactor fotos.tsx (Only HD Virtual)
let fotosCode = fs.readFileSync('src/routes/_authenticated/fotos.tsx', 'utf8');
fotosCode = fotosCode.replace(/\/midias/g, '/fotos');
fotosCode = fotosCode.replace(/MidiasPage/g, 'FotosPage');
fotosCode = fotosCode.replace(/Mídias Sociais/g, 'Sessão de Fotos');
fotosCode = fotosCode.replace(/<TabsList.*?<\/TabsList>/s, '');
fotosCode = fotosCode.replace(/<TabsContent value="cronograma".*?<\/TabsContent>\s*<!-- TAB ASSETS \(HD VIRTUAL\) -->/s, '');
// Wait, the regex might be tricky. Let's just generate fotos.tsx cleanly.
