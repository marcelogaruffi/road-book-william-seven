const fs = require('fs');

let content = fs.readFileSync('src/routes/_authenticated/vendas.tsx', 'utf8');

const tableData = `
  async function restaurarHistoricoPerdido() {
    try {
      const confirmacao = confirm("Isso vai recriar o produto 'Chaveiro' e injetar as 10 vendas do histórico recuperado. Deseja continuar?");
      if (!confirmacao) return;

      setLoading(true);
      toast.info("1/3 Criando produto Chaveiro...");

      let prodId;
      const { data: existingProd } = await supabase.from("vendas_produtos").select("id").ilike("nome", "%Chaveiro%").limit(1).maybeSingle();
      
      if (existingProd) {
        prodId = existingProd.id;
      } else {
        const { data: newProd, error: prodErr } = await supabase.from("vendas_produtos").insert({
          nome: "Chaveiro",
          preco_unitario: 10
        }).select().single();
        if (prodErr) throw new Error("Erro ao criar produto: " + prodErr.message);
        prodId = newProd.id;
      }

      toast.info("2/3 Lendo cidades do banco...");
      const { data: evts } = await supabase.from("eventos").select("id, cidade");

      const rowsToInsert = [
        { c: "Salvador", d: "2026-07-25", q: 17, t: 170 },
        { c: "Aracaju", d: "2026-07-27", q: 4, t: 40 },
        { c: "Pessoa", d: "2026-08-18", q: 13, t: 130 },
        { c: "Campina", d: "2026-08-20", q: 27, t: 270 },
        { c: "Campina", d: "2026-08-21", q: 21, t: 210 },
        { c: "Paulo", d: "2026-08-27", q: 13, t: 130 },
        { c: "Paulo", d: "2026-08-28", q: 18, t: 180 },
        { c: "Lagoas", d: "2026-08-30", q: 21, t: 210 },
        { c: "Campo", d: "2026-09-04", q: 21, t: 210 },
        { c: "Caldas", d: "2026-09-12", q: 23, t: 230 }
      ];

      toast.info("3/3 Injetando vendas perdidas...");
      for (const row of rowsToInsert) {
        // Encontra o ID do evento pela cidade
        const evt = evts?.find(e => e.cidade && e.cidade.toLowerCase().includes(row.c.toLowerCase()));
        if (evt) {
          await supabase.from("vendas_registros").insert({
            produto_id: prodId,
            evento_id: evt.id,
            quantidade: row.q,
            valor_total: row.t,
            data_venda: row.d
          });
        }
      }

      toast.success("HISTÓRICO TOTALMENTE RECUPERADO!");
      fetchDados();
    } catch (err: any) {
      toast.error("Falha: " + err.message);
    } finally {
      setLoading(false);
    }
  }
`;

content = content.replace('async function fetchDados() {', tableData + '\n  async function fetchDados() {');

const buttonHTML = `
          <Button variant="default" onClick={restaurarHistoricoPerdido} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
            <Package className="mr-2 size-4" /> Restaurar Histórico de Chaveiros
          </Button>
          <Button variant="outline"`;

content = content.replace('<Button variant="outline"', buttonHTML);

fs.writeFileSync('src/routes/_authenticated/vendas.tsx', content, 'utf8');
console.log("Injected restore script");
