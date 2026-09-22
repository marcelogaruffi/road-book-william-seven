import re

def modify_file(filepath, pattern, replacement):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Patched {filepath}")
    else:
        print(f"No changes (pattern not found) in {filepath}")

# Add states
eventos_states = '''  const [cidade, setCidade] = useState('');
  const [turneId, setTurneId] = useState('');
  const [produtoraNome, setProdutoraNome] = useState('');
  const [produtoraLogoUrl, setProdutoraLogoUrl] = useState('');'''
modify_file('src/routes/_authenticated/eventos.tsx', r"const \[cidade, setCidade\] = useState\(''\);\s*const \[turneId, setTurneId\] = useState\(''\);", eventos_states)
