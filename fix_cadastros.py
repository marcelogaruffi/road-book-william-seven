import os

with open('src/routes/_authenticated/cadastros.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    'ção': 'ção', 'ções': 'ções', 'á': 'á', 'é': 'é', 'í': 'í', 'ó': 'ó', 'ú': 'ú',
    'â': 'â', 'ê': 'ê', 'õ': 'õ', 'ã': 'ã', 'ç': 'ç', 'Padrão': 'Padrão', 'padrão': 'padrão',
    'Não': 'Não', 'não': 'não', 'Ações': 'Ações', 'Configuração': 'Configuração',
    'Produção': 'Produção', 'funções': 'funções', 'visÁvel': 'visível', 'Você': 'Você',
    'já': 'já', 'estão': 'estão', 'há': 'há'
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
