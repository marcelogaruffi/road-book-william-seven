import os
import glob

replacements = {
    'ção': 'ção', 'ções': 'ções', 'á': 'á', 'é': 'é', 'í': 'í', 'ó': 'ó', 'ú': 'ú',
    'â': 'â', 'ê': 'ê', 'õ': 'õ', 'ã': 'ã', 'ç': 'ç', 
    'Padrão': 'Padrão', 'padrão': 'padrão', 'Não': 'Não', 'não': 'não',
    'Ações': 'Ações', 'Configuração': 'Configuração', 'Produção': 'Produção', 'produção': 'produção',
    'funções': 'funções', 'visÁvel': 'visível', 'Você': 'Você', 'já': 'já', 'estão': 'estão', 'há': 'há',
    'Edição': 'Edição', 'edição': 'edição', 'Espetáculo': 'Espetáculo', 'espetáculo': 'espetáculo',
    'Á udio': 'Áudio', 'áudio': 'áudio', 'Duração': 'Duração', 'duração': 'duração',
    'Posição': 'Posição', 'posição': 'posição', 'Ação': 'Ação', 'ação': 'ação',
    'Vídeo': 'Vídeo', 'vídeo': 'vídeo', 'Turnê': 'Turnê', 'turnê': 'turnê',
    'único': 'único', 'veículo': 'veículo', 'Número': 'Número', 'número': 'número',
    'Técnico': 'Técnico', 'técnico': 'técnico', 'Preparação': 'Preparação', 'preparação': 'preparação',
    'Monitoração': 'Monitoração', 'monitoração': 'monitoração', 'Necessários': 'Necessários',
    'locação': 'locação', 'indispensável': 'indispensável', 'Anotações': 'Anotações',
    'Radiofrequência': 'Radiofrequência', 'região': 'região', 'Descrição': 'Descrição',
    'concluído': 'concluído', 'botão': 'botão', 'excluirá': 'excluirá', 'Informações': 'Informações',
    'Está': 'Está', 'está': 'está', 'veículos': 'veículos', 'ótimo': 'ótimo', 'apresentação': 'apresentação',
    'Apresentação': 'Apresentação', 'avaliação': 'avaliação', 'código': 'código', 'Código': 'Código',
    'último': 'último', 'última': 'última', 'recomeçar': 'recomeçar', 'você': 'você',
    'Á‰': 'É', 'é': 'é', 'só': 'só', 'já': 'já', 'atrás': 'atrás', 'até': 'até'
}

files = glob.glob('src/**/*.tsx', recursive=True) + glob.glob('src/**/*.ts', recursive=True)

count = 0
for filepath in files:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        original = content
        for bad, good in replacements.items():
            content = content.replace(bad, good)
            
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            count += 1
            print(f"Fixed: {filepath}")
    except Exception as e:
        pass

print(f"Total files fixed: {count}")
