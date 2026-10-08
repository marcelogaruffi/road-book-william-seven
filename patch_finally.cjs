const fs = require('fs');

function fixFinally(file) {
    let c = fs.readFileSync(file, 'utf8');
    c = c.replace(/async function handleEdit[\s\S]*?setLoading\(false\);\s*\}/g, (match) => {
        return match.replace(/const { data, error } = await supabase/, 'try {\n      const { data, error } = await supabase')
                    .replace(/setLoading\(false\);\s*\}/, '} catch (e) { console.error(e); } finally { setLoading(false); }\n    }');
    });
    fs.writeFileSync(file, c, 'utf8');
}

fixFinally('src/components/MalasTemplateTab.tsx');
fixFinally('src/components/TemplateRidersTab.tsx');
fixFinally('src/components/som-operacao/TemplateCuesTab.tsx');
console.log("Added finally to handleEdit");
