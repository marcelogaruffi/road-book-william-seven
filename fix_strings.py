import os

replacements = {
    'Gestão': 'Gestão',
    'gestão': 'gestão',
    'Apresentação': 'Apresentação',
    'Concluído': 'Concluído',
    'Programação': 'Programação',
    'Apresentação': 'Apresentação',
    'Informações': 'Informações',
    'Informações': 'Informações',
    'Informação': 'Informação',
    'informações': 'informações',
    'Você': 'Você',
    'você': 'você',
    'não': 'não',
    'Não': 'Não',
    'têm': 'têm',
    'turnês': 'turnês',
    'Turnês': 'Turnês',
    'Próximo': 'Próximo',
    'próximas': 'próximas',
    'Próximas': 'Próximas',
    'próximo': 'próximo',
    'concluída': 'concluída',
    'Concluídas': 'Concluídas',
    'Ações': 'Ações',
    'Rápidas': 'Rápidas',
    'rápidas': 'rápidas',
    'visão': 'visão',
    'Visão': 'Visão',
    'geral': 'geral',
    'Mês': 'Mês',
    'mês': 'mês',
    'Até': 'Até',
    'até': 'até',
    'Ativos': 'Ativos',
    'Criação': 'Criação',
    'criação': 'criação',
    'Faça': 'Faça',
    'faça': 'faça',
    'Vá': 'Vá',
    'Cenários': 'Cenários',
    'Cardápio': 'Cardápio',
    'Restrições': 'Restrições',
    'Distribuição': 'Distribuição',
    'Turnê': 'Turnê',
    'Público': 'Público',
    'Iluminação': 'Iluminação',
    'Aéreo': 'Aéreo',
    'aéreo': 'aéreo',
    'padrão': 'padrão',
    'Padrão': 'Padrão',
    'Início': 'Início',
    'início': 'início',
    'Número': 'Número',
    'número': 'número',
    'Mídias': 'Mídias',
    'mídias': 'mídias',
    'Apresentações': 'Apresentações',
    'apresentações': 'apresentações',
    'Configurações': 'Configurações',
    'configurações': 'configurações',
    'á': 'á',
    'é': 'é',
    'í': 'í',
    'ó': 'ó',
    'ú': 'ú',
    'ç': 'ç',
    'ã': 'ã',
    'õ': 'õ',
    'â': 'â',
    'ê': 'ê',
    'Á': 'Á',
    'Á‰': 'É',
    'Á“': 'Ó',
    'Á‡': 'Ç',
    'Á‚': 'Â',
    'ÁŠ': 'Ê',
    'Á”': 'Ô',
    'Á•': 'Õ',
}

count = 0
for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '.output' in root:
        continue
    for file in files:
        if not file.endswith(('.tsx', '.ts', '.js', '.jsx', '.json', '.md', '.html', '.css', '.cjs', '.mjs', '.py')): continue
        path = os.path.join(root, file)
        try:
            with open(path, 'r', encoding='utf-8') as f:
                text = f.read()
            
            needs_fix = False
            for k in replacements.keys():
                if k in text:
                    needs_fix = True
                    break
            
            if needs_fix:
                for k, v in replacements.items():
                    text = text.replace(k, v)
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(text)
                count += 1
        except:
            pass

print(f"Fixed {count} files.")
