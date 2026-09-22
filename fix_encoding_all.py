import glob

files = [
    'src/routes/_authenticated/espetaculos.tsx',
    'src/components/RoadbookForm.tsx',
    'src/routes/_authenticated/tour.new.tsx',
    'src/routes/_authenticated/tour.$id.tsx',
    'src/routes/turne.$slug.tsx',
    'src/routes/_authenticated/eventos.tsx',
]

replacements = {
    'Espetǭculo': 'Espetáculo',
    'Produes': 'Produções',
    'Artsticas': 'Artísticas',
    'Concludo': 'Concluído',
    'Automǭtico': 'Automático',
    'Programaǜo': 'Programação',
    'Informaes': 'Informações',
    'es': 'ões',
    'Produǜo': 'Produção',
    'TurnǦs': 'Turnês',
    'Apresentaǜo': 'Apresentação',
    'Informaǜo': 'Informação',
}

for file in files:
    try:
        with open(file, 'r', encoding='utf-8') as f:
            c = f.read()
        
        changed = False
        for k, v in replacements.items():
            if k in c:
                c = c.replace(k, v)
                changed = True
        
        if changed:
            with open(file, 'w', encoding='utf-8') as f:
                f.write(c)
            print(f"Fixed {file}")
    except Exception as e:
        print(f"Error reading {file}: {e}")
