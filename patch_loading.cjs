const fs = require('fs');

function fixLoading(file) {
    let c = fs.readFileSync(file, 'utf8');
    
    // Add setLoading(false) to handleEdit
    c = c.replace(
        'setVolumes(parsedVolumes);\n      }\n    }',
        'setVolumes(parsedVolumes);\n      }\n      setLoading(false);\n    }'
    );
    // for riders:
    c = c.replace(
        'setLuzList(parsedLuz);\n      }\n    }',
        'setLuzList(parsedLuz);\n      }\n      setLoading(false);\n    }'
    );
    // for cues:
    c = c.replace(
        'setCuesList(parsedCues);\n      }\n    }',
        'setCuesList(parsedCues);\n      }\n      setLoading(false);\n    }'
    );

    fs.writeFileSync(file, c, 'utf8');
}

fixLoading('src/components/MalasTemplateTab.tsx');
fixLoading('src/components/TemplateRidersTab.tsx');
fixLoading('src/components/som-operacao/TemplateCuesTab.tsx');
console.log("Fixed loading");
