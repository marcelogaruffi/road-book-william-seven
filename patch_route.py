import sys
with open('src/routes/_authenticated/route.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('label="Eventos e Shows"', 'label="Eventos e Espetáculos"')
c = c.replace('label="Cadastro de Shows"', 'label="Cadastro de Espetáculo"')

with open('src/routes/_authenticated/route.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
