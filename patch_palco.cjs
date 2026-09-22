const fs = require('fs');
const path = require('path');

const file = 'src/routes/_authenticated/palco.index.tsx';
let content = fs.readFileSync(file, 'utf-8');

// 1. Update the query
content = content.replace(
  /supabase\.from\(\"eventos\"\)\.select\(\"\*\"\)\.order\(\"data\", \{ ascending: false \}\)/g,
  'supabase.from("evento_apresentacoes").select("id, evento_id, data, horario, local, eventos(cidade, local, espetaculo)").order("data", { ascending: false })'
);

// 2. Update state definitions
content = content.replace(
  /const \[eventos, setEventos\] = useState<any\[\]>\(\[\]\);/g,
  'const [apresentacoes, setApresentacoes] = useState<any[]>([]);\n  const [eventos, setEventos] = useState<any[]>([]); // fallback'
);
if (!content.includes('const [apresentacoes, setApresentacoes]')) {
  // If no explicit type or it was missed
  content = content.replace(
    /const \[eventos, setEventos\] = useState\(\[\]\);/g,
    'const [apresentacoes, setApresentacoes] = useState<any[]>([]);'
  );
  // Also look for other formats
  content = content.replace(
    /const \[eventos, setEventos\] = useState<any\[\]\|null>\(\[\]\);/g,
    'const [apresentacoes, setApresentacoes] = useState<any[]>([]);'
  );
}

// 3. Update data setting
content = content.replace(
  /if \(evtRes\.data\) setEventos\(evtRes\.data\);/g,
  'if (evtRes.data) setApresentacoes(evtRes.data as any);'
);

// 4. Update the select dropdown
content = content.replace(
  /\{eventos\.map\(evt => <option key=\{evt\.id\} value=\{evt\.id\}>\{evt\.cidade\} - \{evt\.local\} \(\{new Date\(evt\.data\)\.toLocaleDateString\('pt-BR', \{timeZone: 'UTC'\}\)\}\)<\/option>\)\}/g,
  '{apresentacoes.map(apr => <option key={apr.id} value={apr.id}>{apr.eventos?.cidade} - {apr.local || apr.eventos?.local} ({new Date(apr.data + "T12:00:00Z").toLocaleDateString("pt-BR")} às {apr.horario})</option>)}'
);

// 5. Replace selectedEventoId usages for technical fetch/insert (arquivos_eventos, props_eventos)
// We need to fetch by apresentacao_id
content = content.replace(
  /\.eq\(\"evento_id\", selectedEventoId\)/g,
  '.eq("apresentacao_id", selectedEventoId)' // Note: selectedEventoId is now storing the apresentacao_id for minimal code change
);

// For inserts, we need to provide BOTH evento_id and apresentacao_id
// Let's find the current apresentacao to get the evento_id
content = content.replace(
  /const loadData = async \(\) => \{/,
  'const loadData = async () => {\n    const currentApr = apresentacoes.find(a => a.id === selectedEventoId);\n    const realEventoId = currentApr ? currentApr.evento_id : selectedEventoId;'
);

content = content.replace(
  /\.insert\(\{ \.\.\.propData, evento_id: selectedEventoId,/g,
  '.insert({ ...propData, evento_id: (apresentacoes.find(a => a.id === selectedEventoId)?.evento_id || selectedEventoId), apresentacao_id: selectedEventoId,'
);
content = content.replace(
  /evento_id: selectedEventoId, nome: f\.name/g,
  'evento_id: (apresentacoes.find(a => a.id === selectedEventoId)?.evento_id || selectedEventoId), apresentacao_id: selectedEventoId, nome: f.name'
);
content = content.replace(
  /evento_id: selectedEventoId,/g,
  'evento_id: (apresentacoes.find(a => a.id === selectedEventoId)?.evento_id || selectedEventoId), apresentacao_id: selectedEventoId,'
);

// 6. Update export functions which do `eventos.find(e => e.id === selectedEventoId)`
content = content.replace(
  /const evt = eventos\.find\(e => e\.id === selectedEventoId\);/g,
  'const apr = apresentacoes.find(e => e.id === selectedEventoId);\n    const evt = apr?.eventos;'
);

fs.writeFileSync(file, content);
console.log('Patched palco.index.tsx');
