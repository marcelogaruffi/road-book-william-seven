const fs = require('fs');
let content = fs.readFileSync('src/lib/roadbook-types.ts', 'utf8');

const malaType = `
export type MalaViagem = {
  id: string;
  responsavel_id?: string;
  responsavel_nome?: string;
  descricao: string;
  peso?: string;
  fragil?: boolean;
  status?: 'despachada' | 'recebida' | 'extraviada' | 'pendente';
  observacoes?: string;
};
`;

if (!content.includes('MalaViagem')) {
  content = content.replace('export type Automacoes = {', malaType + '\nexport type Automacoes = {\n  malas?: MalaViagem[];');
  fs.writeFileSync('src/lib/roadbook-types.ts', content);
}
console.log('updated roadbook-types');
