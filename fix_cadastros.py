import os

with open('src/routes/_authenticated/cadastros.tsx', 'r', encoding='utf-8') as f:
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

target1 = '{invites.filter(i => !i.used_at).length === 0 ? ('
replace1 = '{invites.filter(i => !i.used_at && new Date(i.expires_at) > new Date()).length === 0 ? ('

target2 = '{invites.filter(i => !i.used_at).map(i => ('
replace2 = '{invites.filter(i => !i.used_at && new Date(i.expires_at) > new Date()).map(i => ('

content = content.replace(target1, replace1)
content = content.replace(target2, replace2)

with open('src/routes/_authenticated/cadastros.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
