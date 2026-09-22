const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/vendas.tsx', 'utf8');

// 1. Fix sessoes mapping (parse JSON if string, handle Invalid Dates)
const oldSessoesRegex = /if \(evt\.apresentacoes && evt\.apresentacoes\.length > 0\) \{[\s\S]*?\} else \{/g;
const newSessoes = `
          let aps = evt.apresentacoes;
          if (typeof aps === 'string') {
            try { aps = JSON.parse(aps); } catch(e) { aps = []; }
          }
          if (Array.isArray(aps) && aps.length > 0) {
            aps.forEach((ap: any) => {
              const dt = ap.data || evt.data;
              let dObj = new Date((dt || '').substring(0, 10) + 'T12:00:00Z');
              allSess.push({
                id: evt.id + "|" + dt,
                evento_id: evt.id,
                cidade: evt.cidade,
                displayDate: isNaN(dObj.getTime()) ? 'Data Indefinida' : dObj.toLocaleDateString('pt-BR'),
                dataIso: dt
              });
            });
          } else {`;
content = content.replace(oldSessoesRegex, newSessoes);

const oldSessoesElseRegex = /allSess\.push\(\{\n\s*id: evt\.id \+ "\|" \+ evt\.data,\n\s*evento_id: evt\.id,\n\s*cidade: evt\.cidade,\n\s*displayDate: new Date\(\(evt\.data \|\| ''\)\.substring\(0, 10\) \+ 'T12:00:00Z'\)\.toLocaleDateString\('pt-BR'\),\n\s*dataIso: evt\.data\n\s*\}\);\n\s*\}/g;
const newSessoesElse = `let dObj2 = new Date((evt.data || '').substring(0, 10) + 'T12:00:00Z');
            allSess.push({
              id: evt.id + "|" + evt.data,
              evento_id: evt.id,
              cidade: evt.cidade,
              displayDate: isNaN(dObj2.getTime()) ? 'Data Indefinida' : dObj2.toLocaleDateString('pt-BR'),
              dataIso: evt.data
            });
          }`;
content = content.replace(oldSessoesElseRegex, newSessoesElse);

// 2. Fix the sorting so NaN doesn't mess it up
const sortRegex = /const dataA = new Date\(a\.data_venda \|\| a\.evento\?\.data \|\| a\.created_at \|\| 0\)\.getTime\(\);\n\s*const dataB = new Date\(b\.data_venda \|\| b\.evento\?\.data \|\| b\.created_at \|\| 0\)\.getTime\(\);\n\s*return dataB - dataA; \/\/ do maior pro menor/g;
const newSort = `const dataA = new Date(a.data_venda || a.evento?.data || a.created_at || 0).getTime();
    const dataB = new Date(b.data_venda || b.evento?.data || b.created_at || 0).getTime();
    const valA = isNaN(dataA) ? 0 : dataA;
    const valB = isNaN(dataB) ? 0 : dataB;
    return valB - valA;`;
content = content.replace(sortRegex, newSort);

// 3. Edit Dialog State Update
content = content.replace(
  /const \[editProdutoDialog, setEditProdutoDialog\] = useState<\{ open: boolean, id: string, nome: string, preco: string \}>\(\{ open: false, id: '', nome: '', preco: '' \}\);/g,
  `const [editProdutoDialog, setEditProdutoDialog] = useState<{ open: boolean, id: string, nome: string, preco: string, estoqueStr: string }>({ open: false, id: '', nome: '', preco: '', estoqueStr: '' });`
);

// 4. Update the Edit function to also handle Stock
const salvarEdicaoRegex = /async function salvarEdicaoProduto\(\) \{[\s\S]*?fetchDados\(\);\s*\}/g;
const newSalvarEdicao = `async function salvarEdicaoProduto() {
    const preco = parseFloat(editProdutoDialog.preco.replace(",", "."));
    if (isNaN(preco)) return toast.error("Preço inválido");
    
    const { error } = await supabase.from("vendas_produtos").update({ nome: editProdutoDialog.nome, preco_unitario: preco }).eq("id", editProdutoDialog.id);
    if (error) { return toast.error("Erro RLS (Edit): " + error.message); }
    
    const qty = parseInt(editProdutoDialog.estoqueStr, 10);
    if (!isNaN(qty) && qty >= 0) {
      await updateEstoque(editProdutoDialog.id, qty);
    }

    toast.success("Produto atualizado.");
    setEditProdutoDialog(prev => ({...prev, open: false}));
    fetchDados();
  }`;
content = content.replace(salvarEdicaoRegex, newSalvarEdicao);

// 5. Replace buttons in table (remove handleAddEstoque button, update edit button)
const buttonRegex = /<Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-500" onClick=\{\(\) => setEditProdutoDialog\(\{ open: true, id: p\.id, nome: p\.nome, preco: p\.preco_unitario\.toString\(\)\.replace\('\.', ','\) \}\)\}>✎<\/Button>\n\s*<Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick=\{\(\) => handleDeleteProduto\(p\.id\)\}>🗑<\/Button>\n\s*<Button variant="outline" size="sm" onClick=\{\(\) => handleAddEstoque\(p\.id, p\.nome\)\}/g;
const newButtons = `<Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-500" onClick={() => setEditProdutoDialog({ open: true, id: p.id, nome: p.nome, preco: p.preco_unitario.toString().replace('.', ','), estoqueStr: qtdeEstoque.toString() })}>✎</Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => handleDeleteProduto(p.id)}>🗑</Button>
                          {/* Botão estoque removido */}`;
content = content.replace(buttonRegex, newButtons);
// The regex above left the rest of the old button tag like `><Plus className="size-3 mr-1" /> Estoque</Button>`.
// Wait, I will just do a simpler replace.
content = content.replace(/<td className="px-4 py-3 text-center flex items-center justify-center gap-1">[\s\S]*?<\/td>/g, (match) => {
  if (match.includes("handleAddEstoque")) {
    return `<td className="px-4 py-3 text-center flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-500" onClick={() => setEditProdutoDialog({ open: true, id: p.id, nome: p.nome, preco: p.preco_unitario.toString().replace('.', ','), estoqueStr: (estoque[p.id]||0).toString() })}>✎</Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => handleDeleteProduto(p.id)}>🗑</Button>
                        </td>`;
  }
  return match;
});

// 6. Add Estoque field to Dialog UI
const dialogUIRegex = /<div className="space-y-2">\n\s*<Label>Preço Unitário<\/Label>\n\s*<Input value=\{editProdutoDialog\.preco\} onChange=\{e => setEditProdutoDialog\(prev => \(\{\.\.\.prev, preco: e\.target\.value\}\)\)\} className="h-12 text-lg" \/>\n\s*<\/div>/g;
const newDialogUI = `<div className="space-y-2">
              <Label>Preço Unitário</Label>
              <Input value={editProdutoDialog.preco} onChange={e => setEditProdutoDialog(prev => ({...prev, preco: e.target.value}))} className="h-12 text-lg" />
            </div>
            <div className="space-y-2">
              <Label>Quantidade em Estoque</Label>
              <Input type="number" value={editProdutoDialog.estoqueStr} onChange={e => setEditProdutoDialog(prev => ({...prev, estoqueStr: e.target.value}))} className="h-12 text-lg" />
            </div>`;
content = content.replace(dialogUIRegex, newDialogUI);

// 7. Remove the unneeded handleAddEstoque function and estoqueDialog state if they are there
// Wait, I can just leave them if they exist, but it's cleaner to replace them.
// Let's just leave the old modal inside so we don't break regexes. The button doesn't trigger it anymore.

fs.writeFileSync('src/routes/_authenticated/vendas.tsx', content, 'utf8');
