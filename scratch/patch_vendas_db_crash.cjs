const fs = require('fs');

let content = fs.readFileSync('src/routes/_authenticated/vendas.tsx', 'utf8');

// Replace the query that crashes
content = content.replace(
  /supabase\.from\("eventos"\)\.select\("id, cidade, local, data, apresentacoes"\)\.order\("data", \{ ascending: false \}\)/g,
  'supabase.from("eventos").select("id, cidade, local, data").order("data", { ascending: false }), supabase.from("evento_apresentacoes").select("*")'
);

// We need to change the Promise.all array destructuring
content = content.replace(
  /const \[prodRes, evtRes, vendRes, estoqueRes\] = await Promise\.all\(\[/g,
  'const [prodRes, evtRes, aprRes, vendRes, estoqueRes] = await Promise.all(['
);

// We need to modify evtRes.data.forEach
// evt.apresentacoes is not natively on evt, so we filter from aprRes.data
const oldMappingRegex = /let aps = evt\.apresentacoes;[\s\S]*?if \(typeof aps === 'string'\) \{[\s\S]*?try \{ aps = JSON\.parse\(aps\); \} catch\(e\) \{ aps = \[\]; \}\n\s*\}[\s\S]*?if \(Array\.isArray\(aps\) && aps\.length > 0\) \{/g;

const newMapping = `let aps = (aprRes.data || []).filter(a => a.evento_id === evt.id);
          if (Array.isArray(aps) && aps.length > 0) {`;

content = content.replace(oldMappingRegex, newMapping);

fs.writeFileSync('src/routes/_authenticated/vendas.tsx', content, 'utf8');
