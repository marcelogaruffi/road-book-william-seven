const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/escalas.tsx', 'utf8');

// Insert handleAcceptAll
const handleAcceptCode = `
  const handleAccept = async (id: string) => {
    if (!confirm("Confirmar a presença manualmente nesta escala?")) return;
    
    const { error } = await supabase.from('evento_escalas').update({ status: 'aceita' }).eq('id', id);
    if (error) {
      toast.error("Erro ao aceitar: " + error.message);
    } else {
      toast.success("Escala aceita manualmente!");
      loadData();
    }
  };

  const handleAcceptAll = async () => {
    const pendentes = escalas.filter(e => e.status === 'pendente');
    if (pendentes.length === 0) {
      toast.info("Não há escalas pendentes.");
      return;
    }
    if (!confirm(\`Tem certeza que deseja aceitar manualmente todas as \${pendentes.length} escalas pendentes?\`)) return;
    
    const ids = pendentes.map(e => e.id);
    
    // Supabase in() works great for bulk updates
    const { error } = await supabase.from('evento_escalas').update({ status: 'aceita' }).in('id', ids);
    if (error) {
      toast.error("Erro ao aceitar em lote: " + error.message);
    } else {
      toast.success(\`\${pendentes.length} escalas aceitas com sucesso!\`);
      loadData();
    }
  };
`;

content = content.replace(
  /const handleAccept = async \([\s\S]*?loadData\(\);\n    \}\n  \};/,
  handleAcceptCode.trim()
);

// Insert Button in CardHeader
const cardHeaderCode = `
              <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/5 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input 
                    placeholder="Buscar por nome, evento ou status..." 
                    className="pl-9 bg-white dark:bg-black"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                {escalas.some(e => e.status === 'pendente') && (
                  <Button onClick={handleAcceptAll} className="bg-green-500 hover:bg-green-600 text-white font-bold shrink-0">
                    <Check className="size-4 mr-2" /> Aceitar Todas as Pendentes
                  </Button>
                )}
              </CardHeader>
`;

content = content.replace(
  /<CardHeader className="bg-slate-50\/50 dark:bg-slate-900\/50 border-b border-slate-100 dark:border-white\/5 pb-4">[\s\S]*?<\/CardHeader>/,
  cardHeaderCode.trim()
);

fs.writeFileSync('src/routes/_authenticated/escalas.tsx', content);
console.log('escalas.tsx updated');
