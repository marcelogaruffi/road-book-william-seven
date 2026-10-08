import os
import re

for root, dirs, files in os.walk('src/routes'):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Replace "| Áxis" with "- Áxis - Gestão de Teatros e Shows"
                new_content = re.sub(r'\|\s*Áxis', '- Áxis - Gestão de Teatros e Shows', content)
                
                if new_content != content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated {path}")
            except Exception as e:
                pass
