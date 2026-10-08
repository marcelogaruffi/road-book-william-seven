const fs = require('fs');
let c = fs.readFileSync('src/routes/_authenticated/padroes.tsx', 'utf8');

c = c.replace(
    "await supabase.from('espetaculos').select('nome_espetaculo').order('nome_espetaculo');",
    "await supabase.from('templates_espetaculos').select('nome_espetaculo').order('nome_espetaculo');"
);

// Also change the title icon to Layers
c = c.replace(
    'import { Music, Settings, Luggage, Coffee, Scissors, Mic2, Lightbulb, Clapperboard, CheckSquare, Shirt } from "lucide-react";',
    'import { Music, Settings, Luggage, Coffee, Scissors, Mic2, Lightbulb, Clapperboard, CheckSquare, Shirt, Layers } from "lucide-react";'
);
c = c.replace('<Settings className="size-8 text-primary" />', '<Layers className="size-8 text-primary" />');
c = c.replace('<Settings className="size-12 mx-auto mb-4 opacity-20" />', '<Layers className="size-12 mx-auto mb-4 opacity-20" />');

fs.writeFileSync('src/routes/_authenticated/padroes.tsx', c, 'utf8');
console.log("Fixed query");
