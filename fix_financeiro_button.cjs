const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/financeiro.tsx', 'utf8');

// Insert Button import if not present
if (!content.includes('import { Button }')) {
    content = content.replace(
        'import { Label } from "@/components/ui/label";',
        'import { Label } from "@/components/ui/label";\nimport { Button } from "@/components/ui/button";'
    );
    fs.writeFileSync('src/routes/_authenticated/financeiro.tsx', content, 'utf8');
}
