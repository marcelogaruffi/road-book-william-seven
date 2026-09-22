const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/vendas.tsx', 'utf8');

const regex = /async function fetchDados\(\) \{[\s\S]*?setSessoes\(allSess\);\n      \}/;

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

      if (estoqueRes.data && estoqueRes.data.merch) {
        setEstoque(estoqueRes.data.merch);
      }
      if (prodRes.data) setProdutos(prodRes.data);
      if (evtRes.data) {
        setEventos(evtRes.data);
        const allSess: any[] = [];
        evtRes.data.forEach(evt => {
          let aps = (aprRes && aprRes.data || []).filter((a:any) => a.evento_id === evt.id);
          if (Array.isArray(aps) && aps.length > 0) {
            aps.forEach((ap: any) => {
              const dt = ap.data || evt.data;
              let dObj = new Date((dt || '').substring(0, 10) + 'T12:00:00Z');
              let display = isNaN(dObj.getTime()) ? 'Data Indefinida' : dObj.toLocaleDateString('pt-BR');
              if (ap.horario) display += ' às ' + ap.horario.substring(0,5);
              allSess.push({
                id: evt.id + "|" + dt + "|" + (ap.horario || ''),
                evento_id: evt.id,
                cidade: evt.cidade,
                displayDate: display,
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
      }`;

content = content.replace(regex, newFetchDados);
fs.writeFileSync('src/routes/_authenticated/vendas.tsx', content, 'utf8');
console.log("Rewrote fetchDados top half");
