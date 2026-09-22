const fs = require('fs');
let content = fs.readFileSync('src/components/RoadbookForm.tsx', 'utf8');

const oldLogic = `                  const hasApresentacao = newProgramacao.some(p => p.titulo === "ApresentaÃ§Ã£o" && p.data === evData && p.hora_inicio === (ev.horario || ""));
                  
                  if (!hasApresentacao && evData && ev.horario) {
                    let hora_fim = "";
                    const [h, m] = ev.horario.split(':');
                    if (h && m) {
                      const endH = (parseInt(h) + 1).toString().padStart(2, '0');
                      hora_fim = \`\${endH}:\${m}\`;
                    }
                    newProgramacao = [...newProgramacao, {
                      data: evData,
                      hora_inicio: ev.horario,
                      hora_fim: hora_fim,
                      titulo: "ApresentaÃ§Ã£o",
                      tipo: "EspetÃ¡culo",
                      local: ev.local || "",
                      observacao: ""
                    }];
                  }`;

const newLogic = `                  if (ev.apresentacoes && ev.apresentacoes.length > 0) {
                    ev.apresentacoes.forEach((ap: any) => {
                      const apData = ap.data || evData;
                      const hasAp = newProgramacao.some(p => p.titulo === "Apresentação" && p.data === apData && p.hora_inicio === (ap.horario || ""));
                      if (!hasAp && apData && ap.horario) {
                        let hora_fim = "";
                        const [h, m] = ap.horario.split(':');
                        if (h && m) {
                          const endH = (parseInt(h) + 1).toString().padStart(2, '0');
                          hora_fim = \`\${endH}:\${m}\`;
                        }
                        newProgramacao.push({
                          data: apData,
                          hora_inicio: ap.horario,
                          hora_fim: hora_fim,
                          titulo: "Apresentação",
                          tipo: "Espetáculo",
                          local: ap.local || ev.local || "",
                          observacao: ""
                        });
                      }
                    });
                  } else {
                    const hasApresentacao = newProgramacao.some(p => p.titulo === "Apresentação" && p.data === evData && p.hora_inicio === (ev.horario || ""));
                    if (!hasApresentacao && evData && ev.horario) {
                      let hora_fim = "";
                      const [h, m] = ev.horario.split(':');
                      if (h && m) {
                        const endH = (parseInt(h) + 1).toString().padStart(2, '0');
                        hora_fim = \`\${endH}:\${m}\`;
                      }
                      newProgramacao.push({
                        data: evData,
                        hora_inicio: ev.horario,
                        hora_fim: hora_fim,
                        titulo: "Apresentação",
                        tipo: "Espetáculo",
                        local: ev.local || "",
                        observacao: ""
                      });
                    }
                  }`;

// Notice: In the oldLogic I copied the encoding Ã§Ã£o
// I will just use regex to replace it to be safe
content = content.replace(/const hasApresentacao = newProgramacao\.some\([\s\S]*?observacao: ""\n\s*\}\]\;\n\s*\}/g, newLogic);

fs.writeFileSync('src/components/RoadbookForm.tsx', content, 'utf8');
