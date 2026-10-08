import os

def replace_in_file(path, old, new):
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {path}")

replace_in_file('app.html', 'Áxis - Gestão para Teatros e Shows', 'Áxis - Gestão para Teatros e Shows')
replace_in_file('src/routes/_authenticated/route.tsx', 'Roadbook', 'Áxis')
replace_in_file('src/routes/_authenticated/route.tsx', 'Gestão para Teatros e Shows', 'Gestão para Teatros e Shows')

replace_in_file('src/routes/auth.tsx', 'Roadbook Digital', 'Áxis')
replace_in_file('src/routes/auth.tsx', 'Roadbook', 'Áxis')

replace_in_file('src/routes/_authenticated/sobre.tsx', 'Roadbook Digital Seven', 'Áxis')
replace_in_file('src/routes/_authenticated/sobre.tsx', 'Roadbook Digital', 'Áxis')
replace_in_file('src/routes/_authenticated/sobre.tsx', 'Plataforma Exclusiva de Gestão Artística e Turnês', 'Plataforma de Gestão para Teatros e Shows')

