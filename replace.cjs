const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/checklist.tsx', 'utf8');

const target = `    // Ações - Conferência (Evento)
    async function handleGerarChecklist() {`;

const replace = `    // Ações - Conferência (Evento)
    async function handleGerarChecklist() {
      if (!selectedEventoId) return;
      
      setLoading(true);
      const { data: evData } = await supabase.from('eventos').select('espetaculo').eq('id', selectedEventoId).single();
      if (!evData || !evData.espetaculo) {
        setLoading(false);
        return toast.error("Não foi possível encontrar o espetáculo do evento selecionado.");
      }
      
      const nomeEspetaculo = evData.espetaculo;
      
      // IMPORTANT: MUST ALSO MATCH THE CURRENT SELECTED SETOR!
      // Otherwise, importing in "Luz" will import everything and then only show "Luz"
      const itensDesteShow = itensPadrao.filter(i => i.espetaculo_nome === nomeEspetaculo && (i.setor || 'Produção') === selectedSetor);
      
      if (itensDesteShow.length === 0) {
        setLoading(false);
        return toast.warning(\`Não há itens no Checklist Padrão de \${selectedSetor} para o show "\${nomeEspetaculo}".\`);
      }
      
      // Preparar itens para inserção baseados no padrão e evitar duplicados
      const displayedItensEvento = itensEvento.filter(i => (i.setor || 'Produção') === selectedSetor);
      const existingNames = new Set(displayedItensEvento.map(i => i.item_nome.toLowerCase().trim()));
      
      const itensParaInserir = itensDesteShow
        .filter(item => !existingNames.has(item.item_nome.toLowerCase().trim()))
        .map(item => ({
          evento_id: selectedEventoId,
          apresentacao_id: null,
          item_nome: item.item_nome,
          obrigatorio: item.obrigatorio,
          ordem: item.ordem,
          concluido: false,
          setor: item.setor || 'Produção'
        }));
  
      if (itensParaInserir.length === 0) {
        setLoading(false);
        return toast.info(\`Todos os itens padrão de \${selectedSetor} já estão presentes neste checklist!\`);
      }
  
      const { data, error } = await supabase.from("checklist_eventos").insert(itensParaInserir).select();
      
      setLoading(false);
  
      if (error) {
        toast.error("Erro ao importar itens do padrão");
      } else {
        toast.success(\`Itens padrão de \${selectedSetor} importados com sucesso!\`);
        setItensEvento([...itensEvento, ...(data || [])]);
      }
    }
    
    // OLD FUNC`;

// Let's replace the whole old handleGerarChecklist function. We can find where it ends by looking for toggleItemConcluido
const oldFuncRegex = /async function handleGerarChecklist\(\) \{[\s\S]*?async function toggleItemConcluido/m;

const newString = replace.replace('    // OLD FUNC', 'async function toggleItemConcluido');

content = content.replace(oldFuncRegex, newString);

fs.writeFileSync('src/routes/_authenticated/checklist.tsx', content, 'utf8');
