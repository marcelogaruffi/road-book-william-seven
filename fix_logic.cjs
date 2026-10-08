const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/checklist.tsx', 'utf8');

const targetRegex = /const eventoSelecionado = eventos\.find[\s\S]*?eventoSelecionado\.espetaculo\}\"\.\);/m;
const replaceString = `const apresentacaoSelecionada = apresentacoes.find(a => a.id === selectedEventoId);
    if (!apresentacaoSelecionada || !apresentacaoSelecionada.eventos) return;
    
    const nomeEspetaculo = apresentacaoSelecionada.eventos.espetaculo;
    const itensDesteShow = itensPadrao.filter(i => i.espetaculo_nome === nomeEspetaculo);
    
    if (itensDesteShow.length === 0) return toast.warning(\`Não há itens no Checklist Padrão para o show "\${nomeEspetaculo}".\`);`;

content = content.replace(targetRegex, replaceString);
fs.writeFileSync('src/routes/_authenticated/checklist.tsx', content, 'utf8');
