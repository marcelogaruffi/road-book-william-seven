import os
import re

# motorista-print.$slug.tsx
path1 = 'src/routes/motorista-print.$slug.tsx'
with open(path1, 'r', encoding='utf-8') as f:
    c1 = f.read()

# Replace head title
c1 = re.sub(
    r'const title = loaderData \? `Programa.*` : ".*";',
    'const title = loaderData ? `Programação - ${loaderData.espetaculo || ""} - ${loaderData.cidade || ""} - Áxis - Gestão de Teatros e Shows` : "Programação - Áxis - Gestão de Teatros e Shows";',
    c1
)

# Remove Roteiro Motorista text
c1 = re.sub(
    r'<p style=\{\{ margin: \'0 0 5px 0\', fontSize: \'12px\', color: \'#555\', textTransform: \'uppercase\', letterSpacing: \'2px\' \}\}>.*?</p>\s*',
    '',
    c1
)

# Replace logo-seven with logo-axis
c1 = c1.replace('"/logo-seven.png"', '"/logo-axis.png"')
c1 = c1.replace('alt="Seven"', 'alt="Áxis"')

with open(path1, 'w', encoding='utf-8') as f:
    f.write(c1)

# _authenticated/versao-motorista.$slug.tsx
path2 = 'src/routes/_authenticated/versao-motorista.$slug.tsx'
with open(path2, 'r', encoding='utf-8') as f:
    c2 = f.read()

# Replace head title
c2 = re.sub(
    r'const title = loaderData \? `Roteiro Motorista: \$\{loaderData\.espetaculo\}.*` : "Roteiro Motorista";',
    'const title = loaderData ? `Programação - ${loaderData.espetaculo} - ${loaderData.cidade} - Áxis - Gestão de Teatros e Shows` : "Programação - Áxis - Gestão de Teatros e Shows";',
    c2
)

# Remove Versão para Motorista badge
c2 = re.sub(
    r'<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-widest mb-4">\s*<Users className="size-3\.5" />.*?\s*</div>',
    '',
    c2
)

# Replace logo-seven with logo-axis
c2 = c2.replace('"/logo-seven.png"', '"/logo-axis.png"')
c2 = c2.replace('alt="Seven Produções"', 'alt="Áxis"')
# Also fix `alt="Seven ProduÃ§Ãµes"`
c2 = re.sub(r'alt="Seven Produ.*?"', 'alt="Áxis"', c2)

with open(path2, 'w', encoding='utf-8') as f:
    f.write(c2)

print("Done")
