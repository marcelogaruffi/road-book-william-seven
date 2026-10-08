import os

def fix_all():
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
                
                has_bom = data.startswith(b'\xef\xbb\xbf')
                if has_bom:
                    data = data[3:]
                
                text = data.decode('utf-8')
                
                needs_fix = 'Á' in text or 'Â' in text or 'â' in text or 'Å' in text or 'Î' in text or 'Ï' in text or has_bom
                
                if needs_fix:
                    try:
                        # Try to reverse the cp1252 corruption
                        fixed_text = text.encode('cp1252').decode('utf-8')
                        text = fixed_text
                    except:
                        pass # if it fails, maybe it wasn't strictly double encoded this way
                    
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(text)
                    count += 1
            except Exception as e:
                pass
    print(f"Fixed {count} files.")

fix_all()
