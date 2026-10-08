import os
import re

with open('src/routes/_authenticated/checklist.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix common mojibake
replacements = {
    'ção': 'ção',
    'ções': 'ções',
    'á': 'á',
    'é': 'é',
    'í': 'í',
    'ó': 'ó',
    'ú': 'ú',
    'â': 'â',
    'ê': 'ê',
    'õ': 'õ',
    'ã': 'ã',
    'ç': 'ç',
    'Padrão': 'Padrão',
    'padrão': 'padrão',
    'Não': 'Não',
    'não': 'não',
    'Ações': 'Ações',
    'Configuração': 'Configuração',
    'Produção': 'Produção',
    'funções': 'funções',
    'visÁvel': 'visível',
    'Você': 'Você',
    'já': 'já',
    'estão': 'estão',
    'há': 'há'
}

for bad, good in replacements.items():
    content = content.replace(bad, good)

with open('src/routes/_authenticated/checklist.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
