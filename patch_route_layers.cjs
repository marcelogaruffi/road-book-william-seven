const fs = require('fs');
let c = fs.readFileSync('src/routes/_authenticated/route.tsx', 'utf8');

if (!c.includes(', Layers } from "lucide-react"')) {
    c = c.replace(
        '} from "lucide-react";',
        ', Layers } from "lucide-react";'
    );
}

fs.writeFileSync('src/routes/_authenticated/route.tsx', c, 'utf8');
console.log("Fixed Layers import");
