import os
import re

def fix_file(filename, replacements):
    with open(filename, 'r', encoding='utf-8') as f:
        c = f.read()
    changed = False
    for k, v in replacements:
        if isinstance(k, re.Pattern):
            new_c = k.sub(v, c)
            if new_c != c:
                c = new_c
                changed = True
        else:
            if k in c:
                c = c.replace(k, v)
                changed = True
    if changed:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(c)
        print(f"Patched {filename}")
    else:
        print(f"No changes made to {filename}")

# 1. ESTOQUE_GLOBAL issue
# Create a proper schema for ESTOQUE_GLOBAL or just use a generic 'malas_padrao' in configuracoes_sistema?
# Wait, the user wants: "Não quero essa 'alternativa' que vc criou na tal da tabela infinita.....me mande o sql de uma tabela de estoque que não vai ficar aparecendo em todo menu dropdown que eu criar."
# He means `ESTOQUE_GLOBAL` inside `templates_espetaculos` is appearing in dropdowns!
# So we need to EXCLUDE `ESTOQUE_GLOBAL` from dropdowns, or create a separate table.
# Let's create a SQL script to create `estoque_global` table and migrate data.

# 2. Tela eventos tá quebrada
# Need to add `produtora_nome` logic back to `eventos.tsx`.

# 3. Turnê ainda não ta certo
# Need to patch `turne.$slug.tsx`

# 4. Roadbook form ainda não aparece
# Need to patch `RoadbookForm.tsx`

# 5. Roadbook public ainda não aparece
# Need to patch `rb.$slug.tsx`
