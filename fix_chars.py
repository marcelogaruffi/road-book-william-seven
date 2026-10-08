import os
import re

replacements = {
    "Ã£": "ã",
    "Ã§": "ç",
    "Ãµ": "õ",
    "Ã¡": "á",
    "Ã©": "é",
    "Ã­": "í",
    "Ã³": "ó",
    "Ãº": "ú",
    "Ã¢": "â",
    "Ãª": "ê",
    "Ã´": "ô",
    "Ã€": "À",
    "Ã ": "Á",
    "Ã‰": "É",
    "Ã“": "Ó",
    "Ãš": "Ú",
    "Ã‡": "Ç",
    "Ãƒ": "Ã",
    "Ã•": "Õ",
    "Ã‚": "Â",
    "ÃŠ": "Ê",
    "Ã”": "Ô",
    "Âº": "º",
    "Âª": "ª",
    "Â´": "´",
    "Ã ": "à",
    "Ã£o": "ão", # Sometimes it might get mixed up
    "Ã§Ã£o": "ção",
    "Ã§Ãµes": "ções",
    "Ã": "Á", # Sometimes 'Ã' alone is 'Á' if the next char was lost? Or maybe "Ã " is "Á "
    "â€“": "–",
    "â€”": "—",
    "Ã§Ã£": "çã",
}

def fix_encoding(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts') or file.endswith('.json'):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    new_content = content
                    
                    # Fix specific double-encoded strings
                    for bad, good in replacements.items():
                        new_content = new_content.replace(bad, good)
                        
                    # Also there is 'Ã xis' which should be 'Áxis'
                    new_content = new_content.replace("Ã xis", "Áxis")
                    new_content = new_content.replace("Ã¡", "á")
                    new_content = new_content.replace("Ã¢", "â")
                    new_content = new_content.replace("Ã£", "ã")
                    new_content = new_content.replace("Ã§", "ç")
                    new_content = new_content.replace("Ã©", "é")
                    new_content = new_content.replace("Ãª", "ê")
                    new_content = new_content.replace("Ã­", "í")
                    new_content = new_content.replace("Ã³", "ó")
                    new_content = new_content.replace("Ã´", "ô")
                    new_content = new_content.replace("Ãµ", "õ")
                    new_content = new_content.replace("Ãº", "ú")
                    
                    
                    if new_content != content:
                        with open(path, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        print(f"Fixed {path}")
                except Exception as e:
                    pass

fix_encoding('src')
