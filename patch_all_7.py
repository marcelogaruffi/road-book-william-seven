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

# Update the ESTOQUE_GLOBAL fallback logic
malas_evento = '''        } else {
          // If no template or no started checklist, fallback to global stock
          const { data: globalData } = await supabase.from('estoque_global').select('itens').limit(1).maybeSingle();
          if (globalData && globalData.itens) {
            const padrao = globalData.itens.map((v: any) => ({
              ...v,
              itens: (v.itens || []).map((i: any) => ({ ...i, check: false }))
            }));
            setVolumes(padrao);
            
            // Auto-save the initial template for this roadbook
            if (rbData.id) {
              await supabase.from('roadbooks').update({ 
                automacoes: { ...(rbData.automacoes || {}), operacao_malas: padrao } 
              }).eq('id', rbData.id);
            }
          }
        }'''
modify_file('src/routes/_authenticated/malas.$evento_id.tsx', r'\}\s*else\s*if\s*\(evData\)\s*\{\s*// Fallback to template if not started\s*const\s*\{\s*data:\s*tData\s*\}\s*=\s*await\s*supabase\.from\(\'templates_espetaculos\'\)\.select\(\'assets_midia\'\)\.neq\(\'nome_espetaculo\',\s*\'ESTOQUE_GLOBAL\'\)\.eq\(\'nome_espetaculo\',\s*evData\.espetaculo\)\.maybeSingle\(\);\s*if\s*\(tData\s*&&\s*tData\.assets_midia\?\.malas_padrao\)\s*\{\s*// Initialize checklist\s*const\s*padrao\s*=\s*\(tData\.assets_midia\.malas_padrao\s*\|\|\s*\[\]\)\.map\(\(v:\s*any\)\s*=>\s*\(\{\s*\.\.\.v,\s*itens:\s*\(v\.itens\s*\|\|\s*\[\]\)\.map\(\(i:\s*any\)\s*=>\s*\(\{\s*\.\.\.i,\s*check:\s*false\s*\}\)\)\s*\}\)\);\s*setVolumes\(padrao\);\s*// Auto-save the initial template for this roadbook\s*if\s*\(rbData\.id\)\s*\{\s*await\s*supabase\.from\(\'roadbooks\'\)\.update\(\{\s*automacoes:\s*\{\s*\.\.\.\(rbData\.automacoes\s*\|\|\s*\{\}\),\s*operacao_malas:\s*padrao\s*\}\s*\}\)\.eq\(\'id\',\s*rbData\.id\);\s*\}\s*\}\s*\}', malas_evento)
