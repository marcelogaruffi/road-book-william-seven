const fs = require('fs');

let content = fs.readFileSync('src/routes/_authenticated/vendas.tsx', 'utf8');

// Subtitui a função atual pela que injeta apenas Aracajú
const novaFuncao = `
  async function restaurarHistoricoPerdido() {
    try {
      setLoading(true);

      // Pega o ID do Chaveiro
      const { data: existingProd } = await supabase.from("vendas_produtos").select("id").ilike("nome", "%Chaveiro%").limit(1).single();
      if (!existingProd) throw new Error("Chaveiro não encontrado");

      // Pega os eventos
      const { data: evts } = await supabase.from("eventos").select("id, cidade");

      // Aracaju
      const evt = evts?.find(e => e.cidade && e.cidade.toLowerCase().includes("aracaj"));
      if (evt) {
        await supabase.from("vendas_registros").insert({
          produto_id: existingProd.id,
          evento_id: evt.id,
          quantidade: 4,
          valor_total: 40,
          data_venda: "2026-07-27"
        });
        toast.success("Aracajú inserido com sucesso!");
        fetchDados();
      } else {
        toast.error("Cidade Aracajú não encontrada no banco");
      }
    } catch (err: any) {
      toast.error("Falha: " + err.message);
    } finally {
      setLoading(false);
    }
  }
`;

// Como a função já existe no arquivo, vamos usar regex para substituí-la
const regexFuncao = /async function restaurarHistoricoPerdido\(\) \{[\s\S]*?\}\s*async function fetchDados/m;
content = content.replace(regexFuncao, novaFuncao.trim() + '\n\n  async function fetchDados');

const regexBotao = /Restaurar Histórico de Chaveiros/g;
content = content.replace(regexBotao, "Injetar Aracaju (Faltante)");

fs.writeFileSync('src/routes/_authenticated/vendas.tsx', content, 'utf8');
console.log("Patched for Aracaju");
