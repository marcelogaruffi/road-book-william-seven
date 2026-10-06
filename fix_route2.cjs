const fs = require('fs');
let c = fs.readFileSync('src/routes/_authenticated/route.tsx', 'utf8');
c = c.replace(/import \{([^}]+)\} from \"lucide-react\";/, 'import { , FileText } from "lucide-react";');
fs.writeFileSync('src/routes/_authenticated/route.tsx', c);
