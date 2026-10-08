import os
with open('src/routes/_authenticated/malas.index.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('padrão', 'padrão')
content = content.replace('Padrão', 'Padrão')
content = content.replace('espetáculo', 'espetáculo')
content = content.replace('operação', 'operação')
content = content.replace('faça', 'faça')

with open('src/routes/_authenticated/malas.index.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
