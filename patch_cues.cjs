const fs = require('fs');
let c = fs.readFileSync('src/components/som-operacao/TemplateCuesTab.tsx', 'utf8');

c = c.replace(
    'export default function TemplateCuesTab() {',
    'export default function TemplateCuesTab({ espetaculoNome }: { espetaculoNome?: string }) {'
);

c = c.replace(
    'useEffect(() => {\n    loadTemplates();\n  }, []);',
    'useEffect(() => {\n    if (espetaculoNome) {\n      handleEdit({ nome_espetaculo: espetaculoNome } as any);\n    } else {\n      loadTemplates();\n    }\n  }, [espetaculoNome]);'
);

c = c.replace(
    '<div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mt-6">',
    '<div className={espetaculoNome ? "mt-6" : "grid grid-cols-1 xl:grid-cols-4 gap-8 mt-6"}>'
);

c = c.replace(
    '<div className="xl:col-span-1 space-y-6">',
    '{!espetaculoNome && (\n      <div className="xl:col-span-1 space-y-6">'
);

c = c.replace(
    '</CardContent>\n        </Card>\n      </div>\n\n      <div className="xl:col-span-3">',
    '</CardContent>\n        </Card>\n      </div>\n      )}\n\n      <div className={espetaculoNome ? "" : "xl:col-span-3"}>'
);

fs.writeFileSync('src/components/som-operacao/TemplateCuesTab.tsx', c, 'utf8');
console.log("Patched Cues");
