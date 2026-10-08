const fs = require('fs');

function fixRidersAndCues(file) {
    let c = fs.readFileSync(file, 'utf8');
    
    // We want to change the useEffect to fetch the template
    const newEffect = `
    useEffect(() => {
      if (espetaculoNome) {
        async function fetchTemplate() {
          setLoading(true);
          const { data } = await supabase.from('templates_espetaculos').select('*').neq('nome_espetaculo', 'ESTOQUE_GLOBAL').eq('nome_espetaculo', espetaculoNome).single();
          if (data) {
            handleEdit(data as any);
          } else {
            handleEdit({ nome_espetaculo: espetaculoNome } as any);
          }
          setLoading(false);
        }
        fetchTemplate();
      } else {
        loadTemplates();
      }
    }, [espetaculoNome]);
    `;

    // Replace the old useEffect
    c = c.replace(/useEffect\(\(\) => \{\s*if \(espetaculoNome\) \{\s*handleEdit\(\{ nome_espetaculo: espetaculoNome \} as any\);\s*\} else \{\s*loadTemplates\(\);\s*\}\s*\}, \[espetaculoNome\]\);/g, newEffect);

    fs.writeFileSync(file, c, 'utf8');
}

fixRidersAndCues('src/components/TemplateRidersTab.tsx');
fixRidersAndCues('src/components/som-operacao/TemplateCuesTab.tsx');

console.log("Fixed Riders and Cues effect");
