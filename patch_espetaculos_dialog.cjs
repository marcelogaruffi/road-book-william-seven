const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/espetaculos.tsx', 'utf8');

if (!code.includes('DialogContent')) {
  code = code.replace(
    'import { Textarea } from "@/components/ui/textarea";',
    'import { Textarea } from "@/components/ui/textarea";\nimport { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";'
  );
}

if (!code.includes('viewRiderModal')) {
  code = code.replace(
    'const [isEditing, setIsEditing] = useState(false);',
    'const [isEditing, setIsEditing] = useState(false);\n  const [viewRiderModal, setViewRiderModal] = useState<string | null>(null);'
  );
}

const mapRegex = /\[\s*\{\s*title:\s*"Rider de Som"[\s\S]*?"anexo_figurino"\s*\},?\s*\]/;
const newMap = `[
                    { title: "Rider de Som", icon: Mic2, color: "text-emerald-500", key: "rider_som", attach: "anexos_som" },
                    { title: "Rider de Luz", icon: Lightbulb, color: "text-amber-500", key: "rider_luz", attach: "anexos_luz" },
                    { title: "Rider Vídeo", icon: Clapperboard, color: "text-purple-500", key: "rider_video", attach: "anexos_video" },
                    { title: "Mapa Palco", icon: Map, color: "text-blue-500", key: "mapa_palco_url", attach: "anexos_palco" },
                    { title: "Figurinos", icon: Users, color: "text-pink-500", key: "figurinos_url", attach: "anexos_figurino" },
                  ]`;
if (mapRegex.test(code)) {
  code = code.replace(mapRegex, newMap);
} else {
  console.log('Map regex failed');
}

const oldDiv = /<div key=\{i\} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100\s*\ndark:border-white\/5 flex flex-col items-center justify-center text-center">/;
const newDiv = `<div 
                      key={i} 
                      onClick={() => { if (hasText || hasAttach) setViewRiderModal(item.key) }}
                      className={\`bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-white/5 flex flex-col items-center justify-center text-center \${(hasText || hasAttach) ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors' : 'opacity-70'}\`}
                    >`;
if (oldDiv.test(code)) {
  code = code.replace(oldDiv, newDiv);
} else {
  console.log('Div regex failed');
}

fs.writeFileSync('src/routes/_authenticated/espetaculos.tsx', code);
console.log('Patched top of espetaculos');
