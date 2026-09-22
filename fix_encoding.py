import sys

with open('src/routes/_authenticated/espetaculos.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('Espetǭculo', 'Espetáculo')
c = c.replace('Produes', 'Produções')
c = c.replace('Artsticas', 'Artísticas')
c = c.replace('Concludo', 'Concluído')

with open('src/routes/_authenticated/espetaculos.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
