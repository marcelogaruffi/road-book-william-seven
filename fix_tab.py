import os
with open('src/components/MalasTemplateTab.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('espetÃ¡culo', 'espetáculo')
content = content.replace('PadrÃ£o', 'Padrão')
content = content.replace('EdiÃ§Ã£o', 'Edição')
content = content.replace('EspetÃ¡culo', 'Espetáculo')
content = content.replace('Ã udio', 'Áudio')

with open('src/components/MalasTemplateTab.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
