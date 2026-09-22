const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/vendas.tsx', 'utf8');

const badCode = `              let dObj = new Date((dt || '').substring(0, 10) + 'T12:00:00Z');
                let display = isNaN(dObj.getTime()) ? 'Data Indefinida' : dObj.toLocaleDateString('pt-BR');
                if (ap.horario) display += ' Ã s ' + ap.horario.substring(0,5);
                displayDate: display,
                dataIso: dt
              });`;

const goodCode = `              let dObj = new Date((dt || '').substring(0, 10) + 'T12:00:00Z');
              let display = isNaN(dObj.getTime()) ? 'Data Indefinida' : dObj.toLocaleDateString('pt-BR');
              if (ap.horario) display += ' às ' + ap.horario.substring(0,5);
              allSess.push({
                id: evt.id + "|" + dt + "|" + (ap.horario || ''),
                evento_id: evt.id,
                cidade: evt.cidade,
                displayDate: display,
                dataIso: dt
              });`;

content = content.replace(badCode, goodCode);
fs.writeFileSync('src/routes/_authenticated/vendas.tsx', content, 'utf8');
console.log("Fixed syntax error");
