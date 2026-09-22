const fs = require('fs');

let content = fs.readFileSync('src/routes/_authenticated/vendas.tsx', 'utf8');

// Import Dialog
content = content.replace(
  'import { toast } from "sonner";',
  'import { toast } from "sonner";\nimport { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";'
);

// Add Dialog state variables inside VendasPage
const stateTarget = 'const [totalGeral, setTotalGeral] = useState(0);';
const stateNew = `const [totalGeral, setTotalGeral] = useState(0);
  const [estoqueDialog, setEstoqueDialog] = useState<{ open: boolean, produtoId: string, nome: string, atual: number, novo: string }>({ open: false, produtoId: "", nome: "", atual: 0, novo: "" });
  const [salvandoEstoque, setSalvandoEstoque] = useState(false);`;
content = content.replace(stateTarget, stateNew);

// Fix updateEstoque to return boolean and handle errors properly
const updateEstoqueRegex = /async function updateEstoque\([\s\S]*?\}\n      \}/;
const updateEstoqueNew = `async function updateEstoque(produtoId: string, novoEstoque: number) {
      const updated = { ...estoque, [produtoId]: novoEstoque };
      
      const { data } = await supabase.from('estoque_global').select('id, merch').limit(1).maybeSingle();
      if (data) {
        const { error } = await supabase.from('estoque_global').update({ merch: updated }).eq('id', data.id);
        if (error) { toast.error("Erro RLS (Update): " + error.message); return false; }
      } else {
        const { error } = await supabase.from('estoque_global').insert({ merch: updated });
        if (error) { toast.error("Erro RLS (Insert): " + error.message); return false; }
      }
      setEstoque(updated);
      return true;
    }`;
content = content.replace(updateEstoqueRegex, updateEstoqueNew);

// Replace handleAddEstoque to open Dialog
const handleAddEstoqueRegex = /async function handleAddEstoque[\s\S]*?toast\.success\("Estoque atualizado para " \+ qty \+ " unidades!"\);\n    \}/;
const handleAddEstoqueNew = `function handleAddEstoque(produtoId: string, nome: string) {
      const current = estoque[produtoId] || 0;
      setEstoqueDialog({ open: true, produtoId, nome, atual: current, novo: current.toString() });
    }

    async function salvarNovoEstoque() {
      const qty = parseInt(estoqueDialog.novo, 10);
      if (isNaN(qty) || qty < 0) return toast.error("Quantidade inválida");
      setSalvandoEstoque(true);
      const success = await updateEstoque(estoqueDialog.produtoId, qty);
      setSalvandoEstoque(false);
      if (success) {
        toast.success("Estoque atualizado para " + qty + " unidades!");
        setEstoqueDialog(prev => ({ ...prev, open: false }));
      }
    }`;
content = content.replace(handleAddEstoqueRegex, handleAddEstoqueNew);

// Add the horizontal scroll wrapper to tables
content = content.replace(
  /<table className="w-full text-sm text-left">/g,
  '<div className="overflow-x-auto w-full -mx-4 sm:mx-0 px-4 sm:px-0"><table className="w-full text-sm text-left whitespace-nowrap min-w-[600px]">'
);

// Add </div> after </table> for the horizontal scroll wrapper
content = content.replace(
  /<\/table>/g,
  '</table></div>'
);

// Update onClick to pass produto.nome
content = content.replace(
  /onClick=\{\(\) => handleAddEstoque\(p\.id\)\}/g,
  'onClick={() => handleAddEstoque(p.id, p.nome)}'
);

// Inject Dialog UI before the final </div> of the component
const finalDivRegex = /(<\/Tabs>\n\s*)(<\/div>\n\s*\);\n\})/;
const dialogUI = `$1
      <Dialog open={estoqueDialog.open} onOpenChange={open => !open && setEstoqueDialog(prev => ({...prev, open: false}))}>
        <DialogContent className="sm:max-w-md w-[90vw] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl">Ajustar Estoque</DialogTitle>
            <DialogDescription>
              Ajuste a quantidade em estoque para o produto <strong>{estoqueDialog.nome}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Quantidade em Estoque</Label>
              <Input 
                type="number" 
                value={estoqueDialog.novo} 
                onChange={e => setEstoqueDialog(prev => ({...prev, novo: e.target.value}))}
                className="h-12 text-lg" 
              />
            </div>
            <p className="text-sm text-slate-500">Estoque atual: {estoqueDialog.atual}</p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto h-12" onClick={() => setEstoqueDialog(prev => ({...prev, open: false}))}>Cancelar</Button>
            <Button className="w-full sm:w-auto h-12 bg-primary hover:bg-primary/90 text-white" disabled={salvandoEstoque} onClick={salvarNovoEstoque}>
              {salvandoEstoque ? "Salvando..." : "Salvar Estoque"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
$2`;
content = content.replace(finalDivRegex, dialogUI);

fs.writeFileSync('src/routes/_authenticated/vendas.tsx', content, 'utf8');
