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

# Update the fallback logic
malas_evento = '''        } else if (evData) {
          // 1. Try to load from template
          const { data: tData } = await supabase.from('templates_espetaculos').select('assets_midia').eq('nome_espetaculo', evData.espetaculo).maybeSingle();
          let padrao = [];
          if (tData && tData.assets_midia?.malas_padrao) {
             padrao = tData.assets_midia.malas_padrao;
          } else {
             // 2. If no template, fallback to global stock
             const { data: globalData } = await supabase.from('estoque_global').select('itens').limit(1).maybeSingle();
             if (globalData && globalData.itens) {
                padrao = globalData.itens;
             }
          }
          
          if (padrao.length > 0) {
            // Initialize checklist
            const initialized = padrao.map((v: any) => ({
              ...v,
              itens: (v.itens || []).map((i: any) => ({ ...i, checked: false }))
            }));
            setVolumes(initialized);
          }
        }'''
modify_file('src/routes/_authenticated/malas.$evento_id.tsx', r'\} else if \(evData\) \{.*?setVolumes\(padrao\);\s*\}\s*\}', malas_evento)
