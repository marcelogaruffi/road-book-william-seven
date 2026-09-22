const fs = require('fs');

let content = fs.readFileSync('src/routes/_authenticated/viagens.tsx', 'utf-8');

// 1. Double the size of the cards by reducing the number of columns.
// Previous was grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5
// New is grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3
content = content.replace(/className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6"/g, 'className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6"');

// 2. Change the floating calendar square logic inside renderRoadbookCard
const oldCalendarLogic = `    let monthStr = '';
    let dayStr = '';
    if (r.data_inicial) {
      const dt = new Date(r.data_inicial + 'T12:00:00Z');
      monthStr = dt.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      dayStr = dt.toLocaleDateString('pt-BR', { day: '2-digit' });
    }`;

const newCalendarLogic = `    let monthStr = '';
    let dayStr = '';
    if (r.data_inicial) {
      const dt1 = new Date(r.data_inicial + 'T12:00:00Z');
      monthStr = dt1.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      dayStr = dt1.toLocaleDateString('pt-BR', { day: '2-digit' });
      
      if (r.data_final && r.data_final !== r.data_inicial) {
        const dt2 = new Date(r.data_final + 'T12:00:00Z');
        const m2 = dt2.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
        const d2 = dt2.toLocaleDateString('pt-BR', { day: '2-digit' });
        
        if (monthStr === m2) {
          dayStr = \`\${dayStr} a \${d2}\`;
        } else {
          dayStr = \`\${dayStr}/\${monthStr} - \${d2}/\${m2}\`;
          monthStr = 'PERÍODO';
        }
      }
    }`;

content = content.replace(oldCalendarLogic, newCalendarLogic);

const oldCalendarSquare = `{/* Quadrado da Data Flutuante */}
          <div className="absolute -bottom-4 right-4 bg-white dark:bg-slate-900 shadow-lg rounded-xl flex flex-col items-center justify-center w-14 h-16 border border-slate-100 dark:border-slate-800 z-10 group-hover:-translate-y-1 transition-transform">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">{monthStr}</span>
            <span className="text-xl font-black text-slate-800 dark:text-slate-100 leading-none">{dayStr}</span>
          </div>`;

const newCalendarSquare = `{/* Quadrado da Data Flutuante */}
          <div className="absolute -bottom-4 right-4 bg-white dark:bg-slate-900 shadow-lg rounded-xl flex flex-col items-center justify-center min-w-[3.5rem] px-3 h-16 border border-slate-100 dark:border-slate-800 z-10 group-hover:-translate-y-1 transition-transform">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">{monthStr}</span>
            <span className="text-lg font-black text-slate-800 dark:text-slate-100 leading-none tracking-tighter whitespace-nowrap">{dayStr}</span>
          </div>`;

content = content.replace(oldCalendarSquare, newCalendarSquare);

fs.writeFileSync('src/routes/_authenticated/viagens.tsx', content);
