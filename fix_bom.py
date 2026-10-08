import os

def fix_bom():
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
                
                # Replace all occurrences of UTF-8 BOM in the middle of the file
                bom = b'\xef\xbb\xbf'
                if bom in data:
                    data = data.replace(bom, b'')
                    with open(path, 'wb') as f:
                        f.write(data)
                    count += 1
            except Exception as e:
                pass
    print(f"Removed BOM from {count} files.")

fix_bom()
