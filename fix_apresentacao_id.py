import os
import glob

files = glob.glob('src/routes/**/*.tsx', recursive=True) + glob.glob('src/components/**/*.tsx', recursive=True)

for filepath in files:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        original = content
        
        # Replace the complex evento_id logic with just selectedEventoId and set apresentacao_id to null
        target1 = "evento_id: (apresentacoes.find(a => a.id === selectedEventoId)?.evento_id || selectedEventoId), apresentacao_id: selectedEventoId"
        replace1 = "evento_id: selectedEventoId, apresentacao_id: null"
        
        content = content.replace(target1, replace1)
        
        # There might be some with different spacing
        target2 = "apresentacao_id: selectedEventoId"
        replace2 = "apresentacao_id: null"
        
        # Actually just replace target1
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed: {filepath}")
    except Exception as e:
        pass

