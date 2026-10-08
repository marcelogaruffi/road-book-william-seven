import os

replacements = {
    'Apresentação': 'Apresentação',
    'Concluído': 'Concluído',
    'Programação': 'Programação',
    'Apresentação': 'Apresentação',
    'Informações': 'Informações',
    'Informações': 'Informações',
    'Informação': 'Informação',
    'Você': 'Você',
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
    'Vá': 'Vá',
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
}

file = 'src/routes/_authenticated/dashboard.tsx'
with open(file, 'r', encoding='utf-8') as f:
    text = f.read()

for k, v in replacements.items():
    text = text.replace(k, v)

with open(file, 'w', encoding='utf-8') as f:
    f.write(text)
