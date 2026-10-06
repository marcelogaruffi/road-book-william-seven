import os

with open('src/routes/_authenticated/route.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target1 = '<SLink to="/emissao-relatorios" icon={File} label="Emissão de Relatórios" show={isProdutor} />'
target2 = '<SLink to="/checklist" icon={CheckSquare} label="Prancheta Produtor" show={isProdutor} />'

# remove target1
content = content.replace(target1 + '\n', '')
content = content.replace(target1, '')

# insert target1 after target2
content = content.replace(target2, target2 + '\n                  ' + target1)

with open('src/routes/_authenticated/route.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
