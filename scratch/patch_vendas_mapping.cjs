const fs = require('fs');

let content = fs.readFileSync('src/routes/_authenticated/vendas.tsx', 'utf8');

// Fix the mapping logic to use ap.id and ap.horario
const oldMap = `aps.forEach((ap: any) => {
                const dt = ap.data || evt.data;
                let dObj = new Date((dt || '').substring(0, 10) + 'T12:00:00Z');
                allSess.push({
                  id: evt.id + "|" + dt,
                  evento_id: evt.id,
                  cidade: evt.cidade,
                  displayDate: isNaN(dObj.getTime()) ? 'Data Indefinida' : dObj.toLocaleDateString('pt-BR'),
                  dataIso: dt
                });
              });`;

const newMap = `aps.forEach((ap: any) => {
                const dt = ap.data || evt.data;
                let dObj = new Date((dt || '').substring(0, 10) + 'T12:00:00Z');
                let display = isNaN(dObj.getTime()) ? 'Data Indefinida' : dObj.toLocaleDateString('pt-BR');
                if (ap.horario) display += ' às ' + ap.horario.substring(0,5);
                allSess.push({
                  id: evt.id + "|" + dt + "|" + (ap.horario || ''),
                  evento_id: evt.id,
                  cidade: evt.cidade,
                  displayDate: display,
                  dataIso: dt
                });
              });`;

content = content.replace(oldMap, newMap);

// In handleAddVenda, we split by | now, but we only need realEvtId and dataSessao
const oldInsert = `const [realEvtId, dataSessao] = vendaEventoId.split('|');
      const { error, data } = await supabase.from("vendas_registros").insert({`;

const newInsert = `const [realEvtId, dataSessao, horarioSessao] = vendaEventoId.split('|');
      const { error, data } = await supabase.from("vendas_registros").insert({`;
content = content.replace(oldInsert, newInsert);


fs.writeFileSync('src/routes/_authenticated/vendas.tsx', content, 'utf8');
console.log("Patched mapping");
