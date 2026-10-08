const fs = require('fs');

function fixEffect(file) {
    let c = fs.readFileSync(file, 'utf8');
    
    const regex = /useEffect\(\(\) => \{\s*loadTemplates\(\);\s*\}, \[\]\);/g;
    
    if (regex.test(c)) {
        c = c.replace(regex, `useEffect(() => {\n    if (espetaculoNome) {\n      handleEdit({ nome_espetaculo: espetaculoNome } as any);\n    } else {\n      loadTemplates();\n    }\n  }, [espetaculoNome]);`);
        fs.writeFileSync(file, c, 'utf8');
        console.log("Fixed " + file);
    } else {
        console.log("No match in " + file);
    }
}

fixEffect('src/components/MalasTemplateTab.tsx');
fixEffect('src/components/TemplateRidersTab.tsx');
fixEffect('src/components/som-operacao/TemplateCuesTab.tsx');
