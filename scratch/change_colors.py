import os

files = [
    'src/routes/_authenticated/iluminacao.tsx',
    'src/routes/_authenticated/iluminacao.$evento_id.tsx'
]

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace('yellow-', 'amber-')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Colors updated.")
