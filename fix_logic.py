import os

with open('src/routes/_authenticated/checklist.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = 'if (itensDesteShow.length === 0) return toast.warning(NÃ£o hÃ¡ itens no Checklist PadrÃ£o para o show "".);'
replace = 'if (itensDesteShow.length === 0) return toast.warning(`Não há itens no Checklist Padrão para o show "${nomeEspetaculo}".`);'
content = content.replace(target, replace)

with open('src/routes/_authenticated/checklist.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
