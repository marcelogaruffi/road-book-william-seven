import os

def fix_line_endings():
    count = 0
    for root, dirs, files in os.walk('.'):
        if 'node_modules' in root or '.git' in root or '.output' in root:
            continue
        for file in files:
            if not file.endswith(('.tsx', '.ts', '.js', '.jsx', '.json', '.md', '.html', '.css', '.cjs', '.mjs', '.py')): continue
            path = os.path.join(root, file)
            try:
                with open(path, 'rb') as f:
                    data = f.read()
                
                if b'\r\r\n' in data:
                    data = data.replace(b'\r\r\n', b'\n')
                    data = data.replace(b'\r\n', b'\n')
                    with open(path, 'wb') as f:
                        f.write(data)
                    count += 1
            except Exception as e:
                pass
    print(f"Fixed {count} files line endings.")

fix_line_endings()
