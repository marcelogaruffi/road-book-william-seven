const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/catering.index.tsx', 'utf8');

const types = "type Restricao = {\n" +
"  id: string;\n" +
"  evento_id: string;\n" +
"  nome_pessoa: string;\n" +
"  restricoes: string;\n" +
"  observacoes?: string;\n" +
"};\n\n" +
"type PedidoCatering = {\n" +
"  id: string;\n" +
"  evento_id: string;\n" +
"  item: string;\n" +
"  quantidade: string;\n" +
"  status: 'Pendente' | 'Concluído';\n" +
"  observacoes?: string;\n" +
"};\n\n" +
"type ItemCompras = {\n" +
"  id: string;\n" +
"  evento_id: string;\n" +
"  item: string;\n" +
"  quantidade: string;\n" +
"  status: 'Pendente' | 'Comprado';\n" +
"  observacoes?: string;\n" +
"};\n\n";

content = content.replace('export const Route = createFileRoute(', types + '\nexport const Route = createFileRoute(');
fs.writeFileSync('src/routes/_authenticated/catering.index.tsx', content);
console.log('Types injected!');
