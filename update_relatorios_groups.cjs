const fs = require('fs');

let content = fs.readFileSync('src/routes/_authenticated/emissao-relatorios.tsx', 'utf8');

const reportOptionsBlock = `const REPORT_GROUPS = [
  {
    name: "Técnica e Artístico",
    options: [
      { id: "palco_props", label: "Palco - Props e Cenários" },
      { id: "figurinos", label: "Figurinos - Listagem" }
    ]
  },
  {
    name: "Backstage",
    options: [
      { id: "camarins", label: "Camarins - Distribuição" },
      { id: "catering_cardapio", label: "Catering - Cardápio" },
      { id: "catering_restricoes", label: "Catering - Restrições Alimentares" }
    ]
  },
  {
    name: "Equipe e RH",
    options: [
      { id: "dados_pessoais", label: "Equipe - Dados Pessoais" },
      { id: "contatos_turne", label: "Equipe - Contatos Turnê" }
    ]
  },
  {
    name: "Comunicação e Mídia",
    options: [
      { id: "imprensa_mailing", label: "Imprensa - Mailing" },
      { id: "imprensa_clipping", label: "Imprensa - Clipping" },
      { id: "midias_cronograma", label: "Mídias - Cronograma" },
      { id: "midias_divulgacoes", label: "Divulgações Redes Sociais" }
    ]
  },
  {
    name: "Produção Executiva",
    options: [
      { id: "publico", label: "Público - Geral" },
      { id: "vendas", label: "Vendas - Geral" },
      { id: "rooming_list", label: "Rooming List" }
    ]
  }
];

const REPORT_OPTIONS = REPORT_GROUPS.flatMap(g => g.options);`;

content = content.replace(/const REPORT_OPTIONS = \[[\s\S]*?\];/g, reportOptionsBlock);

// Replace the map rendering logic
const oldMap = `{REPORT_OPTIONS.map(opt => (
                    <label key={opt.id} className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                      <Checkbox checked={!!selectedReports[opt.id]} onCheckedChange={() => toggleReport(opt.id)} />
                      <span className="font-medium text-slate-700 text-sm">{opt.label}</span>
                    </label>
                  ))}`;

const newMap = `{REPORT_GROUPS.map(group => (
                  <div key={group.name} className="mb-6">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">{group.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {group.options.map(opt => (
                        <label key={opt.id} className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-slate-50 transition-colors bg-white">
                          <Checkbox checked={!!selectedReports[opt.id]} onCheckedChange={() => toggleReport(opt.id)} />
                          <span className="font-medium text-slate-700 text-sm">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}`;

content = content.replace(oldMap, newMap);
content = content.replace('<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">', '<div className="mb-8">');

// Remove any remaining (Global) from titles in Excel/PDF export logic
content = content.replace(/\(Global\)/g, '');

fs.writeFileSync('src/routes/_authenticated/emissao-relatorios.tsx', content, 'utf8');
