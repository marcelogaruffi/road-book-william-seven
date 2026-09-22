const fs = require('fs');
const filesToPatch = [
  'src/routes/_authenticated/som.index.tsx',
  'src/routes/_authenticated/som-operacao.index.tsx',
  'src/routes/_authenticated/iluminacao.index.tsx',
  'src/routes/_authenticated/camarins.index.tsx',
  'src/routes/_authenticated/figurinos.index.tsx',
  'src/routes/_authenticated/partituras.index.tsx',
  'src/routes/_authenticated/video.index.tsx',
  'src/routes/_authenticated/checklist.tsx'
];

filesToPatch.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log(`Skipping ${file} as it does not exist`);
    return;
  }
  let content = fs.readFileSync(file, 'utf-8');

  // 1. Update the query
  content = content.replace(
    /supabase\.from\([\"']eventos[\"']\)\.select\([\"'](?:\*|id,\s*cidade,\s*local,\s*data,\s*espetaculo(?:,\s*equipe)?)[\"']\)\.order\([\"']data[\"'],\s*\{\s*ascending:\s*false\s*\}\)/g,
    'supabase.from("evento_apresentacoes").select("id, evento_id, data, horario, local, eventos(cidade, local, espetaculo, equipe)").order("data", { ascending: false })'
  );

  // 2. Update state definitions
  if (!content.includes('const [apresentacoes, setApresentacoes]')) {
    content = content.replace(
      /const \[eventos, setEventos\] = useState<any\[\]>\(\[\]\);/g,
      'const [eventos, setEventos] = useState<any[]>([]);\n  const [apresentacoes, setApresentacoes] = useState<any[]>([]);'
    );
    content = content.replace(
      /const \[eventos, setEventos\] = useState<Evento\[\]>\(\[\]\);/g,
      'const [eventos, setEventos] = useState<Evento[]>([]);\n  const [apresentacoes, setApresentacoes] = useState<any[]>([]);'
    );
    content = content.replace(
      /const \[eventos, setEventos\] = useState\(\[\]\);/g,
      'const [eventos, setEventos] = useState([]);\n  const [apresentacoes, setApresentacoes] = useState<any[]>([]);'
    );
  }

  // 3. Update data setting
  content = content.replace(
    /if \(evtRes\.data\) setEventos\(evtRes\.data\);/g,
    'if (evtRes.data) setApresentacoes(evtRes.data as any);'
  );

  // 4. Update the select dropdown
  content = content.replace(
    /\{eventos\.map\(evt => \(?\s*<option key=\{evt\.id\} value=\{evt\.id\}>\{evt\.cidade\}(?: - \{evt\.local\})? \(\{new Date\(evt\.data\)\.toLocaleDateString\('pt-BR'(?:, \{timeZone: 'UTC'\})?\)[\s\}]*\)<\/option>\)?\)\}/g,
    '{apresentacoes.map(apr => <option key={apr.id} value={apr.id}>{apr.eventos?.cidade} - {apr.local || apr.eventos?.local} ({new Date(apr.data + "T12:00:00Z").toLocaleDateString("pt-BR")} às {apr.horario})</option>)}'
  );
  // Also cover the checklist string interpolation format
  content = content.replace(
    /\{eventos\.map\(\(evt\) => \(\s*<option key=\{evt\.id\} value=\{evt\.id\}>\s*\{evt\.cidade\}\s*-\s*\{evt\.espetaculo\}\s*\(\{new Date\(evt\.data\)\.toLocaleDateString\('pt-BR', \{ timeZone: 'UTC' \}\)\}\)\s*<\/option>\s*\)\)\}/g,
    '{apresentacoes.map((apr) => <option key={apr.id} value={apr.id}>{apr.eventos?.cidade} - {apr.eventos?.espetaculo} ({new Date(apr.data + "T12:00:00Z").toLocaleDateString("pt-BR")} às {apr.horario})</option>)}'
  );

  // 5. Replace selectedEventoId usages for technical fetch/insert
  content = content.replace(
    /\.eq\(\"evento_id\", selectedEventoId\)/g,
    '.eq("apresentacao_id", selectedEventoId)'
  );
  content = content.replace(
    /\.eq\(\'evento_id\', selectedEventoId\)/g,
    '.eq("apresentacao_id", selectedEventoId)'
  );

  // For inserts, provide BOTH evento_id and apresentacao_id
  content = content.replace(
    /const loadData = async \(\) => \{/,
    'const loadData = async () => {\n    const currentApr = apresentacoes.find(a => a.id === selectedEventoId);\n    const realEventoId = currentApr ? currentApr.evento_id : selectedEventoId;'
  );

  // Different insert signatures
  content = content.replace(
    /evento_id: selectedEventoId/g,
    'evento_id: (apresentacoes.find(a => a.id === selectedEventoId)?.evento_id || selectedEventoId), apresentacao_id: selectedEventoId'
  );

  // 6. Update export functions which do `eventos.find(e => e.id === selectedEventoId)`
  content = content.replace(
    /const evt = eventos\.find\(e => e\.id === selectedEventoId\);/g,
    'const apr = apresentacoes.find(e => e.id === selectedEventoId);\n    const evt = apr?.eventos;'
  );

  fs.writeFileSync(file, content);
  console.log(`Patched ${file}`);
});
