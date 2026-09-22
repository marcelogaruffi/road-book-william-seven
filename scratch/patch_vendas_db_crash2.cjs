const fs = require('fs');

let content = fs.readFileSync('src/routes/_authenticated/vendas.tsx', 'utf8');

// 1. Fix the query crash
content = content.replace(
  'supabase.from("eventos").select("id, cidade, local, data, apresentacoes").order("data", { ascending: false }),',
  'supabase.from("eventos").select("id, cidade, local, data").order("data", { ascending: false }),\n          supabase.from("evento_apresentacoes").select("*"),'
);

// 2. Fix the promise destruct array
content = content.replace(
  'const [prodRes, evtRes, vendRes, estoqueRes] = await Promise.all([',
  'const [prodRes, evtRes, aprRes, vendRes, estoqueRes] = await Promise.all(['
);

// 3. Fix the mapping
const oldMap = `let aps = evt.apresentacoes;
            if (typeof aps === 'string') {
              try { aps = JSON.parse(aps); } catch(e) { aps = []; }
            }
            if (Array.isArray(aps) && aps.length > 0) {`;

const newMap = `let aps = (aprRes.data || []).filter(a => a.evento_id === evt.id);
            if (Array.isArray(aps) && aps.length > 0) {`;
content = content.replace(oldMap, newMap);

// 4. Fix handleAddVenda insert (realEvtId and dataSessao)
content = content.replace(
  /const \{ error, data \} = await supabase\.from\("vendas_registros"\)\.insert\(\{[\s\S]*?produto_id: vendaProdutoId,[\s\S]*?evento_id: vendaEventoId,[\s\S]*?quantidade: qtd,[\s\S]*?valor_total[\s\S]*?\}\)\.select\(\)\.single\(\);/,
  `const [realEvtId, dataSessao] = vendaEventoId.split('|');
      const { error, data } = await supabase.from("vendas_registros").insert({
        produto_id: vendaProdutoId,
        evento_id: realEvtId,
        quantidade: qtd,
        valor_total,
        data_venda: dataSessao ? dataSessao : null
      }).select().single();`
);

// 5. Fix financas_receitas logic that uses realEvtId instead of vendaEventoId
content = content.replace(
  /const \{ data: rbData \} = await supabase\.from\("roadbooks"\)\.select\("id"\)\.eq\("evento_id", vendaEventoId\)\.maybeSingle\(\);/,
  'const { data: rbData } = await supabase.from("roadbooks").select("id").eq("evento_id", realEvtId).maybeSingle();'
);

// 6. Fix the table to show event data when data_venda is missing, and avoid crash if data_venda is YYYY-MM-DD
content = content.replace(
  /v\.data_venda \? new Date\(v\.data_venda\.substring\(0, 10\) \+ 'T12:00:00Z'\)\.toLocaleDateString\('pt-BR'\)/g,
  'v.data_venda ? new Date(v.data_venda.substring(0, 10) + "T12:00:00Z").toLocaleDateString("pt-BR")'
);

fs.writeFileSync('src/routes/_authenticated/vendas.tsx', content, 'utf8');
console.log("Patched!");
