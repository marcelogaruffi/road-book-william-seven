const fs = require('fs');

const files = [
    'src/routes/_authenticated/fornecedores.tsx',
    'src/routes/_authenticated/contratos.tsx',
    'src/routes/_authenticated/rooming-list.tsx'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/import \{ supabase \} from "@\/lib\/supabase";/g, 'import { supabase } from "@/integrations/supabase/client";');
    fs.writeFileSync(file, content, 'utf8');
});
