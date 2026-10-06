import os
import glob

replacements = {
    'Ã§Ã£o': 'ção', 'Ã§Ãµes': 'ções', 'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú',
    'Ã¢': 'â', 'Ãª': 'ê', 'Ãµ': 'õ', 'Ã£': 'ã', 'Ã§': 'ç', 
    'PadrÃ£o': 'Padrão', 'padrÃ£o': 'padrão', 'NÃ£o': 'Não', 'nÃ£o': 'não',
    'AÃ§Ãµes': 'Ações', 'ConfiguraÃ§Ã£o': 'Configuração', 'ProduÃ§Ã£o': 'Produção', 'produÃ§Ã£o': 'produção',
    'funÃ§Ãµes': 'funções', 'visÃvel': 'visível', 'VocÃª': 'Você', 'jÃ¡': 'já', 'estÃ£o': 'estão', 'hÃ¡': 'há',
    'EdiÃ§Ã£o': 'Edição', 'ediÃ§Ã£o': 'edição', 'EspetÃ¡culo': 'Espetáculo', 'espetÃ¡culo': 'espetáculo',
    'Ã udio': 'Áudio', 'Ã¡udio': 'áudio', 'DuraÃ§Ã£o': 'Duração', 'duraÃ§Ã£o': 'duração',
    'PosiÃ§Ã£o': 'Posição', 'posiÃ§Ã£o': 'posição', 'AÃ§Ã£o': 'Ação', 'aÃ§Ã£o': 'ação',
    'VÃ­deo': 'Vídeo', 'vÃ­deo': 'vídeo', 'TurnÃª': 'Turnê', 'turnÃª': 'turnê',
    'Ãºnico': 'único', 'veÃ­culo': 'veículo', 'NÃºmero': 'Número', 'nÃºmero': 'número',
    'TÃ©cnico': 'Técnico', 'tÃ©cnico': 'técnico', 'PreparaÃ§Ã£o': 'Preparação', 'preparaÃ§Ã£o': 'preparação',
    'MonitoraÃ§Ã£o': 'Monitoração', 'monitoraÃ§Ã£o': 'monitoração', 'NecessÃ¡rios': 'Necessários',
    'locaÃ§Ã£o': 'locação', 'indispensÃ¡vel': 'indispensável', 'AnotaÃ§Ãµes': 'Anotações',
    'RadiofrequÃªncia': 'Radiofrequência', 'regiÃ£o': 'região', 'DescriÃ§Ã£o': 'Descrição',
    'concluÃ­do': 'concluído', 'botÃ£o': 'botão', 'excluirÃ¡': 'excluirá', 'InformaÃ§Ãµes': 'Informações',
    'EstÃ¡': 'Está', 'estÃ¡': 'está', 'veÃ­culos': 'veículos', 'Ã³timo': 'ótimo', 'apresentaÃ§Ã£o': 'apresentação',
    'ApresentaÃ§Ã£o': 'Apresentação', 'avaliaÃ§Ã£o': 'avaliação', 'cÃ³digo': 'código', 'CÃ³digo': 'Código',
    'Ãºltimo': 'último', 'Ãºltima': 'última', 'recomeÃ§ar': 'recomeçar', 'vocÃª': 'você',
    'Ã‰': 'É', 'Ã©': 'é', 'sÃ³': 'só', 'jÃ¡': 'já', 'atrÃ¡s': 'atrás', 'atÃ©': 'até'
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
