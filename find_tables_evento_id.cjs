const fs = require('fs');

const typesContent = fs.readFileSync('src/integrations/supabase/types.ts', 'utf-8');
const lines = typesContent.split('\n');

const tablesWithEventoId = [];
let currentTable = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const tableMatch = line.match(/^ {8}([a-z0-9_]+): \{/);
  if (tableMatch) {
    currentTable = tableMatch[1];
  }
  
  if (currentTable && line.includes('evento_id: string')) {
    tablesWithEventoId.push(currentTable);
  }
  
  if (currentTable && line.match(/^ {8}\}/)) {
    currentTable = null;
  }
}

console.log([...new Set(tablesWithEventoId)].join('\n'));
