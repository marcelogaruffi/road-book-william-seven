import os
import re

for root, dirs, files in os.walk('src/routes'):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Replace "- Seven Produções Artísticas" with "| Áxis"
                new_content = re.sub(r'\s*-\s*Seven Produções Artísticas', ' | Áxis', content)
                new_content = re.sub(r'William Seven', 'Áxis', new_content)
                new_content = re.sub(r'Gestão de Viagens e Turnês', 'Gestão de Teatros e Shows', new_content)
                
                if new_content != content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated {path}")
            except Exception as e:
                pass
