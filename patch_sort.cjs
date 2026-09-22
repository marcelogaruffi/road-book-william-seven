const fs = require('fs');
let t = fs.readFileSync('src/routes/_authenticated/eventos.tsx', 'utf-8');

// 1. Sort the list in handleSave BEFORE payload
const sortPatch = `
  const handleSave = async () => {
    // Sort apresentacoes
    if (apresentacoesList.length > 0) {
       apresentacoesList.sort((a,b) => {
         const tA = new Date((a.data||'2000-01-01') + 'T' + (a.horario||'00:00'));
         const tB = new Date((b.data||'2000-01-01') + 'T' + (b.horario||'00:00'));
         return tA.getTime() - tB.getTime();
       });
       setDataApres(apresentacoesList[0].data);
       setHorario(apresentacoesList[0].horario);
       setLocal(apresentacoesList[0].local);
    }
    
    if (!cidade || !dataApres || !horario || !local || !espetaculo) {`;

t = t.replace(`  const handleSave = async () => {\n    if (!cidade || !dataApres || !horario || !local || !espetaculo) {`, sortPatch);
t = t.replace(`  const handleSave = async () => {\r\n    if (!cidade || !dataApres || !horario || !local || !espetaculo) {`, sortPatch);

// 2. Also fix the sort in loadData
t = t.replace(`.sort((a,b)=>a.data.localeCompare(b.data))`, `.sort((a,b) => {
          const tA = new Date((a.data||'2000-01-01') + 'T' + (a.horario||'00:00'));
          const tB = new Date((b.data||'2000-01-01') + 'T' + (b.horario||'00:00'));
          return tA.getTime() - tB.getTime();
        })`);

fs.writeFileSync('src/routes/_authenticated/eventos.tsx', t);
console.log('Fixed Sorting');
