const fs = require('fs');

let content = fs.readFileSync('src/routes/_authenticated/vendas.tsx', 'utf8');

// Replace fetchDados with a robust tracing version
const oldFetchDados = /async function fetchDados\(\) \{[\s\S]*?setLoading\(false\);\n\s*\}/;

const newFetchDados = `async function fetchDados() {
    setLoading(true);
    try {
      const [prodRes, evtRes, aprRes, vendRes, estoqueRes] = await Promise.all([
        supabase.from("vendas_produtos").select("*").order("nome"),
        supabase.from("eventos").select("id, cidade, local, data").order("data", { ascending: false }),
        supabase.from("evento_apresentacoes").select("*"),
        supabase.from("vendas_registros").select("*, produto:vendas_produtos(nome), evento:eventos(cidade, local, data)").order("data_venda", { ascending: false }),
        supabase.from("estoque_global").select("itens, merch").limit(1).maybeSingle()
      ]);

      if (prodRes.error) toast.error("Erro prodRes: " + prodRes.error.message);
      if (evtRes.error) toast.error("Erro evtRes: " + evtRes.error.message);
      if (aprRes.error) toast.error("Erro aprRes: " + aprRes.error.message);
      if (vendRes.error) toast.error("Erro vendRes: " + vendRes.error.message);
      if (estoqueRes.error && estoqueRes.error.code !== 'PGRST116') toast.error("Erro estoqueRes: " + estoqueRes.error.message);

      if (estoqueRes.data && estoqueRes.data.merch) {
        setEstoque(estoqueRes.data.merch);
      }
      if (prodRes.data) setProdutos(prodRes.data);
      
      if (evtRes.data) {
        setEventos(evtRes.data);
        const allSess: any[] = [];
        try {
          evtRes.data.forEach(evt => {
            let aps = (aprRes.data || []).filter(a => a.evento_id === evt.id);
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
            } else {
              let dObj2 = new Date((evt.data || '').substring(0, 10) + 'T12:00:00Z');
              allSess.push({
                id: evt.id + "|" + evt.data,
                evento_id: evt.id,
                cidade: evt.cidade,
                displayDate: isNaN(dObj2.getTime()) ? 'Data Indefinida' : dObj2.toLocaleDateString('pt-BR'),
                dataIso: evt.data
              });
            }
          });
          setSessoes(allSess);
        } catch (forEachErr: any) {
          toast.error("Crash no loop de sessões: " + forEachErr.message);
        }
      }
      
      if (vendRes.data) {
        setVendas(vendRes.data);
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Crash fatal no fetchDados: " + e.message);
    }
    setLoading(false);
  }`;

content = content.replace(oldFetchDados, newFetchDados);

fs.writeFileSync('src/routes/_authenticated/vendas.tsx', content, 'utf8');
console.log("Replaced fetchDados with robust tracing");
