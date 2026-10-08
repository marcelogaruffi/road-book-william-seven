const fs = require('fs');
let c = fs.readFileSync('src/components/TemplateRidersTab.tsx', 'utf8');

c = c.replace(
    "export default function TemplateRidersTab({ role, context = 'ambos' }: { role?: string, context?: 'som' | 'luz' | 'ambos' }) {",
    "export default function TemplateRidersTab({ role, context = 'ambos', espetaculoNome }: { role?: string, context?: 'som' | 'luz' | 'ambos', espetaculoNome?: string }) {"
);

c = c.replace(
    'useEffect(() => {\n    loadTemplates();\n  }, []);',
    'useEffect(() => {\n    if (espetaculoNome) {\n      handleEdit({ nome_espetaculo: espetaculoNome } as any);\n    } else {\n      loadTemplates();\n    }\n  }, [espetaculoNome]);'
);

c = c.replace(
    '<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">',
    '<div className={espetaculoNome ? "mt-6" : "grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6"}>'
);

c = c.replace(
    '<div className="lg:col-span-1 space-y-6">',
    '{!espetaculoNome && (\n      <div className="lg:col-span-1 space-y-6">'
);

c = c.replace(
    '</CardContent>\n        </Card>\n      </div>\n\n      <div className="lg:col-span-2">',
    '</CardContent>\n        </Card>\n      </div>\n      )}\n\n      <div className={espetaculoNome ? "" : "lg:col-span-2"}>'
);

fs.writeFileSync('src/components/TemplateRidersTab.tsx', c, 'utf8');
console.log("Patched Riders");
