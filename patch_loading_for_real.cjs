const fs = require('fs');

function forceLoadingFalse(file) {
    let c = fs.readFileSync(file, 'utf8');
    
    // We want to insert `setLoading(false);` at the end of the `handleEdit` function block.
    // The easiest way is to find `function handleEdit(t: ` and insert `setLoading(false);` right before its closing brace.
    // Since we don't want to write a complex AST parser in bash, we'll replace the if(data) block.
    
    // For Malas:
    c = c.replace(/setVolumes\(parsedVolumes\);\s*\}\s*\}/g, 'setVolumes(parsedVolumes);\n      }\n      setLoading(false);\n    }');
    // For Cues:
    c = c.replace(/setCuesList\(parsedCues\);\s*\}\s*\}/g, 'setCuesList(parsedCues);\n      }\n      setLoading(false);\n    }');
    // For Riders:
    c = c.replace(/setLuzList\(parsedLuz\);\s*\}\s*\}/g, 'setLuzList(parsedLuz);\n      }\n      setLoading(false);\n    }');
    
    fs.writeFileSync(file, c, 'utf8');
}

forceLoadingFalse('src/components/MalasTemplateTab.tsx');
forceLoadingFalse('src/components/TemplateRidersTab.tsx');
forceLoadingFalse('src/components/som-operacao/TemplateCuesTab.tsx');

console.log("Loading fixed for real");
