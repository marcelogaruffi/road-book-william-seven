import re

def modify_file(filepath, pattern, replacement):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Patched {filepath}")
    else:
        print(f"No changes (pattern not found) in {filepath}")

# 1. Update eventos.tsx to filter ESTOQUE_GLOBAL (though it shouldn't exist anyway)
modify_file('src/routes/_authenticated/eventos.tsx', r"supabase\.from\('templates_espetaculos'\)\.select\('nome_espetaculo'\),", "supabase.from('templates_espetaculos').select('nome_espetaculo').neq('nome_espetaculo', 'ESTOQUE_GLOBAL'),")

# 2. Update vendas.tsx to use `estoque_global` instead of `templates_espetaculos` for merch
vendas_fetch = '''        const [prodRes, evtRes, vendRes, estoqueRes] = await Promise.all([
          supabase.from("vendas_produtos").select("*").order("nome"),
          supabase.from("eventos").select("id, cidade, local, data").order("data", { ascending: false }),
          supabase.from("vendas_registros").select("*, produto:vendas_produtos(nome), evento:eventos(cidade, local, data)").order("data_venda", { ascending: false }),
          supabase.from("estoque_global").select("itens, merch").limit(1).maybeSingle()
        ]);

        if (estoqueRes.data && estoqueRes.data.merch) {
          setEstoque(estoqueRes.data.merch);
        }'''
modify_file('src/routes/_authenticated/vendas.tsx', r'const \[prodRes, evtRes, vendRes, estoqueRes\] = await Promise\.all\(\[.*?supabase\.from\("vendas_produtos"\)\.select\("\*"\)\.order\("nome"\),.*?supabase\.from\("eventos"\)\.select\("id, cidade, local, data"\)\.order\("data", \{ ascending: false \}\),.*?supabase\.from\("vendas_registros"\)\.select\("\*, produto:vendas_produtos\(nome\), evento:eventos\(cidade, local, \s*data\)"\)\.order\("data_venda", \{ ascending: false \}\),.*?supabase\.from\("templates_espetaculos"\)\.select\("assets_midia"\)\.eq\("nome_espetaculo", \s*"ESTOQUE_GLOBAL"\)\.maybeSingle\(\)\s*\]\);\s*if \(estoqueRes\.data && estoqueRes\.data\.assets_midia\?\.estoque\) \{\s*setEstoque\(estoqueRes\.data\.assets_midia\.estoque\);\s*\}', vendas_fetch)

vendas_update = '''    async function updateEstoque(produtoId: string, novoEstoque: number) {
      const updated = { ...estoque, [produtoId]: novoEstoque };
      setEstoque(updated);
      
      const { data } = await supabase.from('estoque_global').select('id, merch').limit(1).maybeSingle();
      if (data) {
        await supabase.from('estoque_global').update({
          merch: updated
        }).eq('id', data.id);
      } else {
        await supabase.from('estoque_global').insert({
          merch: updated
        });
      }
    }'''
modify_file('src/routes/_authenticated/vendas.tsx', r"async function updateEstoque\(produtoId: string, novoEstoque: number\) \{.*?assets_midia: \{ estoque: updated \}\s*\}\);\s*\}\s*\}", vendas_update)
