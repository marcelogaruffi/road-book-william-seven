const fs = require('fs');

let content = fs.readFileSync('src/routes/_authenticated/vendas.tsx', 'utf8');

// Replace using simple substring logic to avoid CRLF issues on Windows

// 1. Fix the Promise.all array (it might already be fixed)
content = content.replace(
  'const [prodRes, evtRes, vendRes, estoqueRes] = await Promise.all([',
  'const [prodRes, evtRes, aprRes, vendRes, estoqueRes] = await Promise.all(['
);

content = content.replace(
  'supabase.from("estoque_global").select("itens, merch").limit(1).maybeSingle()\n          ]);',
  'supabase.from("estoque_global").select("itens, merch").limit(1).maybeSingle()\n          ]);\n          console.log("vendRes data:", vendRes.data);'
);

// 2. Fix let aps = evt.apresentacoes
const mapPattern = /let aps = evt\.apresentacoes;[\s\S]*?if \(Array\.isArray\(aps\) && aps\.length > 0\) \{/;
content = content.replace(mapPattern, `let aps = (aprRes && aprRes.data || []).filter((a:any) => a.evento_id === evt.id);
            if (Array.isArray(aps) && aps.length > 0) {`);

// 3. Fix the ID mapping
const idPattern = /id: evt\.id \+ "\|" \+ dt,/g;
content = content.replace(idPattern, `id: evt.id + "|" + dt + "|" + (ap.horario || ''),`);

// 4. Fix displayDate
const displayPattern = /let dObj = new Date\(\(dt \|\| ''\)\.substring\(0, 10\) \+ 'T12:00:00Z'\);[\s\S]*?displayDate: isNaN\(dObj\.getTime\(\)\) \? 'Data Indefinida' : dObj\.toLocaleDateString\('pt-BR'\),/;
content = content.replace(displayPattern, `let dObj = new Date((dt || '').substring(0, 10) + 'T12:00:00Z');
                let display = isNaN(dObj.getTime()) ? 'Data Indefinida' : dObj.toLocaleDateString('pt-BR');
                if (ap.horario) display += ' às ' + ap.horario.substring(0,5);
                displayDate: display,`);

fs.writeFileSync('src/routes/_authenticated/vendas.tsx', content, 'utf8');
console.log("Successfully patched vendas.tsx - Windows CRLF safe");
