import os

with open('src/routes/_authenticated/checklist.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = '''    async function handleGerarChecklist() {
    if (!selectedEventoId) return;
    const eventoSelecionado = eventos.find(e => e.id === selectedEventoId);
    if (!eventoSelecionado) return;
    
    const itensDesteShow = itensPadrao.filter(i => i.espetaculo_nome === eventoSelecionado.espetaculo);
    
    if (itensDesteShow.length === 0) return toast.warning(Não há itens no Checklist Padrão para o show "".);'''

replace = '''    async function handleGerarChecklist() {
    if (!selectedEventoId) return;
    const apresentacaoSelecionada = apresentacoes.find(a => a.id === selectedEventoId);
    if (!apresentacaoSelecionada || !apresentacaoSelecionada.eventos) return;
    
    const nomeEspetaculo = apresentacaoSelecionada.eventos.espetaculo;
    const itensDesteShow = itensPadrao.filter(i => i.espetaculo_nome === nomeEspetaculo);
    
    if (itensDesteShow.length === 0) return toast.warning(Não há itens no Checklist Padrão para o show "".);'''

content = content.replace(target, replace)

with open('src/routes/_authenticated/checklist.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
