const fs = require('fs');

let content = fs.readFileSync('src/routes/_authenticated/vendas.tsx', 'utf8');

// 1. Update Evento Type
content = content.replace(
  'data: string;\n};',
  'data: string;\n  apresentacoes?: any[];\n};'
);

// 2. Add sessoes state & editProdutoDialog state
content = content.replace(
  'const [eventos, setEventos] = useState<Evento[]>([]);',
  `const [eventos, setEventos] = useState<Evento[]>([]);\n  const [sessoes, setSessoes] = useState<any[]>([]);\n  const [editProdutoDialog, setEditProdutoDialog] = useState<{ open: boolean, id: string, nome: string, preco: string }>({ open: false, id: '', nome: '', preco: '' });`
);

// 3. Update fetchDados for Eventos
content = content.replace(
  'supabase.from("eventos").select("id, cidade, local, data").order("data", { ascending: false }),',
  'supabase.from("eventos").select("id, cidade, local, data, apresentacoes").order("data", { ascending: false }),'
);

// 4. Update fetchDados for sessoes processing
content = content.replace(
  'if (evtRes.data) setEventos(evtRes.data);',
  `if (evtRes.data) {
        setEventos(evtRes.data);
        const allSess: any[] = [];
        evtRes.data.forEach(evt => {
          if (evt.apresentacoes && evt.apresentacoes.length > 0) {
            evt.apresentacoes.forEach((ap: any) => {
              const dt = ap.data || evt.data;
              allSess.push({
                id: evt.id + "|" + dt,
                evento_id: evt.id,
                cidade: evt.cidade,
                displayDate: new Date((dt || '').substring(0, 10) + 'T12:00:00Z').toLocaleDateString('pt-BR'),
                dataIso: dt
              });
            });
          } else {
            allSess.push({
              id: evt.id + "|" + evt.data,
              evento_id: evt.id,
              cidade: evt.cidade,
              displayDate: new Date((evt.data || '').substring(0, 10) + 'T12:00:00Z').toLocaleDateString('pt-BR'),
              dataIso: evt.data
            });
          }
        });
        setSessoes(allSess);
      }`
);

// 5. Update handleAddVenda to split ID and use data_venda
content = content.replace(
  /const { error } = await supabase\.from\("vendas_registros"\)\.insert\(\{\n\s*produto_id: vendaProdutoId,\n\s*evento_id: vendaEventoId,\n\s*quantidade: qtd,\n\s*valor_total\n\s*\}\)\.select\(\)\.single\(\);/g,
  `const [realEvtId, dataSessao] = vendaEventoId.split('|');
      const { error, data: insertedVenda } = await supabase.from("vendas_registros").insert({
        produto_id: vendaProdutoId,
        evento_id: realEvtId,
        quantidade: qtd,
        valor_total,
        data_venda: dataSessao ? new Date(dataSessao + 'T12:00:00Z').toISOString() : new Date().toISOString()
      }).select().single();`
);

// 6. Fix "Finanças Receitas" logic which uses vendaEventoId to search for roadbooks
content = content.replace(
  /const { data: rbData } = await supabase\.from\("roadbooks"\)\.select\("id"\)\.eq\("evento_id", vendaEventoId\)\.maybeSingle\(\);/g,
  'const { data: rbData } = await supabase.from("roadbooks").select("id").eq("evento_id", realEvtId).maybeSingle();'
);

// 7. Update New Sale Select options to use sessoes
content = content.replace(
  /\{eventos\.map\(evt => <option key=\{evt\.id\} value=\{evt\.id\}>\{evt\.cidade\} \(\{new Date\(\(evt\.data \|\| ''\)\.substring\(0, 10\) \+ 'T12:00:00Z'\)\.toLocaleDateString\('pt-BR'\)\}\)<\/option>\)\}/g,
  `{sessoes.map((s, idx) => <option key={s.id + idx} value={s.id}>{s.cidade} ({s.displayDate})</option>)}`
);

// 8. Delete & Edit logic for Produtos
const editProdutoLogic = `
  async function handleDeleteProduto(id: string) {
    if (!confirm("Tem certeza que deseja apagar este produto?")) return;
    const { error } = await supabase.from("vendas_produtos").delete().eq("id", id);
    if (error) toast.error("Erro RLS (Delete): " + error.message);
    else { toast.success("Produto apagado."); fetchDados(); }
  }

  async function salvarEdicaoProduto() {
    const preco = parseFloat(editProdutoDialog.preco.replace(",", "."));
    if (isNaN(preco)) return toast.error("Preço inválido");
    const { error } = await supabase.from("vendas_produtos").update({ nome: editProdutoDialog.nome, preco_unitario: preco }).eq("id", editProdutoDialog.id);
    if (error) toast.error("Erro RLS (Edit): " + error.message);
    else { toast.success("Produto atualizado."); setEditProdutoDialog(prev => ({...prev, open: false})); fetchDados(); }
  }

  async function handleAddVenda`;

content = content.replace(/async function handleAddVenda/g, editProdutoLogic);

// 9. Update the action column in the Produtos table
content = content.replace(
  /<td className="px-4 py-3 text-center">\s*<Button variant="outline" size="sm" onClick=\{\(\) => handleAddEstoque\(p\.id, p\.nome\)\}/g,
  `<td className="px-4 py-3 text-center flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-500" onClick={() => setEditProdutoDialog({ open: true, id: p.id, nome: p.nome, preco: p.preco_unitario.toString().replace('.', ',') })}>✎</Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => handleDeleteProduto(p.id)}>🗑</Button>
                          <Button variant="outline" size="sm" onClick={() => handleAddEstoque(p.id, p.nome)}`
);

// 10. Update table to show real date in vendas
content = content.replace(
  /<td className="px-4 py-3">\{v\.evento\?\.data \? new Date\(v\.evento\.data\.substring\(0, 10\) \+ 'T12:00:00Z'\)\.toLocaleDateString\('pt-BR'\) : '-'\}<\/td>/g,
  `<td className="px-4 py-3">{v.data_venda ? new Date(v.data_venda.substring(0, 10) + 'T12:00:00Z').toLocaleDateString('pt-BR') : (v.evento?.data ? new Date(v.evento.data.substring(0, 10) + 'T12:00:00Z').toLocaleDateString('pt-BR') : '-')}</td>`
);

// 11. Add Edit Dialog to the UI
const editDialogUI = `
      <Dialog open={editProdutoDialog.open} onOpenChange={open => !open && setEditProdutoDialog(prev => ({...prev, open: false}))}>
        <DialogContent className="sm:max-w-md w-[90vw] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl">Editar Produto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Produto</Label>
              <Input value={editProdutoDialog.nome} onChange={e => setEditProdutoDialog(prev => ({...prev, nome: e.target.value}))} className="h-12 text-lg" />
            </div>
            <div className="space-y-2">
              <Label>Preço Unitário</Label>
              <Input value={editProdutoDialog.preco} onChange={e => setEditProdutoDialog(prev => ({...prev, preco: e.target.value}))} className="h-12 text-lg" />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto h-12" onClick={() => setEditProdutoDialog(prev => ({...prev, open: false}))}>Cancelar</Button>
            <Button className="w-full sm:w-auto h-12 bg-primary hover:bg-primary/90 text-white" onClick={salvarEdicaoProduto}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}`;

content = content.replace(/<\/div>\n\s*\);\n\}$/g, editDialogUI);

fs.writeFileSync('src/routes/_authenticated/vendas.tsx', content, 'utf8');
