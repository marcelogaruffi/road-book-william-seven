const fs = require('fs');
let code = fs.readFileSync('src/components/GridEventos.tsx', 'utf8');

if (!code.includes('roadbookId: string | null;')) {
  code = code.replace(
    'type EventoComCapa = {',
    'type EventoComCapa = {\n  roadbookId: string | null;'
  );
}

if (!code.includes('roadbookId: rb?.id || null,')) {
  code = code.replace(
    'capa_pos_y: rb?.automacoes?.capa_pos_y ?? 50,',
    'roadbookId: rb?.id || null,\n              capa_pos_y: rb?.automacoes?.capa_pos_y ?? 50,'
  );
}

if (!code.includes('roadbookId?: string | null')) {
  code = code.replace(
    'export function GridEventos({ onSelect }: { onSelect: (eventoId: string) => void }) {',
    'export function GridEventos({ onSelect }: { onSelect: (eventoId: string, roadbookId?: string | null) => void }) {'
  );
}

code = code.replace(
  'onClick={() => onSelect(ev.id)}',
  'onClick={() => onSelect(ev.id, ev.roadbookId)}'
);

code = code.replace(
  'supabase.from("roadbooks").select("evento_id, automacoes")',
  'supabase.from("roadbooks").select("id, evento_id, automacoes")'
);

fs.writeFileSync('src/components/GridEventos.tsx', code, 'utf8');
console.log('Updated GridEventos');
