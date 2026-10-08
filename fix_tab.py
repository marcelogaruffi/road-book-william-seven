import os
with open('src/components/MalasTemplateTab.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('espetáculo', 'espetáculo')
content = content.replace('Padrão', 'Padrão')
content = content.replace('Edição', 'Edição')
content = content.replace('Espetáculo', 'Espetáculo')
content = content.replace('Á udio', 'Áudio')

with open('src/components/MalasTemplateTab.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
