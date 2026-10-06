const fs = require('fs');
let code = fs.readFileSync('src/components/GridEventos.tsx', 'utf8');

code = code.replace(
  /if \(eventos\.length === 0\) return <div className="py-12 text-center text-slate-400 font-medium">Nenhum evento encontrado\.<\/div>;/,
  'if (eventos.length === 0) return <div className="py-12 text-center text-slate-400 font-medium">Nenhum evento encontrado. {(window as any).debugGridError || ""}</div>;'
);

code = code.replace(
  /if \(evRes\.data\) \{/,
  'if (evRes.error) { (window as any).debugGridError = JSON.stringify(evRes.error); } if (evRes.data) {'
);

fs.writeFileSync('src/components/GridEventos.tsx', code, 'utf8');
