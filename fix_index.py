import os
with open('src/routes/_authenticated/malas.index.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('padrÃ£o', 'padrão')
content = content.replace('PadrÃ£o', 'Padrão')
content = content.replace('espetÃ¡culo', 'espetáculo')
content = content.replace('operaÃ§Ã£o', 'operação')
content = content.replace('faÃ§a', 'faça')

with open('src/routes/_authenticated/malas.index.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
