import os

with open('src/routes/_authenticated/configuracoes.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    'Ã§Ã£o': 'ção', 'Ã§Ãµes': 'ções', 'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú',
    'Ã¢': 'â', 'Ãª': 'ê', 'Ãµ': 'õ', 'Ã£': 'ã', 'Ã§': 'ç', 'PadrÃ£o': 'Padrão', 'padrÃ£o': 'padrão',
    'NÃ£o': 'Não', 'nÃ£o': 'não', 'AÃ§Ãµes': 'Ações', 'ConfiguraÃ§Ã£o': 'Configuração',
    'ProduÃ§Ã£o': 'Produção', 'funÃ§Ãµes': 'funções', 'visÃvel': 'visível', 'VocÃª': 'Você',
    'jÃ¡': 'já', 'estÃ£o': 'estão', 'hÃ¡': 'há'
}
for bad, good in replacements.items():
    content = content.replace(bad, good)

with open('src/routes/_authenticated/configuracoes.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
