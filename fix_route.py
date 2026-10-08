import os

with open('src/routes/_authenticated/route.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    'ção': 'ção', 'ções': 'ções', 'á': 'á', 'é': 'é', 'í': 'í', 'ó': 'ó', 'ú': 'ú',
    'â': 'â', 'ê': 'ê', 'õ': 'õ', 'ã': 'ã', 'ç': 'ç', 'Padrão': 'Padrão', 'padrão': 'padrão',
    'Não': 'Não', 'não': 'não', 'Ações': 'Ações', 'Configuração': 'Configuração',
    'Produção': 'Produção', 'funções': 'funções', 'visÁvel': 'visível', 'Você': 'Você',
    'já': 'já', 'estão': 'estão', 'há': 'há', 'Relatórios': 'Relatórios', 'Público': 'Público',
    'Administração': 'Administração', 'Espetáculo': 'Espetáculo'
}
for bad, good in replacements.items():
    content = content.replace(bad, good)

with open('src/routes/_authenticated/route.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
