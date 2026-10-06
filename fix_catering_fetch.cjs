const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/catering.index.tsx', 'utf8');

const oldHandleSelect = \    const handleSelect = async (id: string, rbId: any, fullEvent: any) => {
      setSelectedEventoId(id);
      if (fullEvent && fullEvent.equipe && fullEvent.equipe.length > 0) {
         setEventoFull(fullEvent);
      } else {
         const { data } = await supabase.from('eventos').select('*').eq('id', id).single();
         setEventoFull(data);
      }
    };\;

const newHandleSelect = \    const handleSelect = async (id: string, rbId: any, fullEvent: any) => {
      setSelectedEventoId(id);
      // Sempre buscar os dados completos do evento para garantir que temos a equipe atualizada
      const { data } = await supabase.from('eventos').select('*').eq('id', id).single();
      setEventoFull(data || fullEvent);
    };\;

if (code.includes(oldHandleSelect)) {
  code = code.replace(oldHandleSelect, newHandleSelect);
  fs.writeFileSync('src/routes/_authenticated/catering.index.tsx', code);
  console.log('Fixed handleSelect');
} else {
  console.log('Could not find handleSelect to replace');
}

