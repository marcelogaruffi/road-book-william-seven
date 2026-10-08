const fs = require('fs');

let content = fs.readFileSync('src/routes/_authenticated/emissao-relatorios.tsx', 'utf8');

content = content.replace(
    '{ id: "publico", label: "Público - Geral (Global)" },',
    '{ id: "publico", label: "Público - Geral (Global)" },\n    { id: "rooming_list", label: "Gestão - Rooming List (Global)" },'
);

const pdfBlock = `
          else if (repId === "rooming_list") {
            let y = drawHeaderPDF(doc, "Gestão - Rooming List", logoData);
            const { data } = await supabase.from('rooming_list').select('*, evento:eventos(cidade, local, espetaculo)');
            const rows = (data || []).map((r: any) => [
              r.evento ? \`\${r.evento.cidade} (\${r.evento.espetaculo})\` : "-",
              r.numero_quarto || "S/N",
              r.tipo_quarto || "-",
              r.hospede_1 || "-",
              r.hospede_2 || "-",
              r.hospede_3 || "-"
            ]);
            autoTable(doc, { startY: y, head: [['Evento', 'Quarto', 'Tipo', 'Hóspede 1', 'Hóspede 2', 'Hóspede 3']], body: rows, theme: 'striped', headStyles: { fillColor: [15, 23, 42] } });
          }`;

const excelBlock = `
          else if (repId === "rooming_list") {
            const ws = workbook.addWorksheet('Rooming List');
            ws.columns = [{ width: 35 }, { width: 15 }, { width: 20 }, { width: 25 }, { width: 25 }, { width: 25 }, { width: 35 }];
            drawLogoExcel(ws);
            ws.getCell('B1').value = \`Rooming List (Global)\`;
            ws.getCell('B1').font = { size: 16, bold: true };
            ws.getCell('B1').alignment = { vertical: 'middle' };
            
            const header = ws.getRow(3);
            header.values = ['Evento', 'Quarto', 'Tipo', 'Hóspede 1', 'Hóspede 2', 'Hóspede 3', 'Obs'];
            const { data } = await supabase.from('rooming_list').select('*, evento:eventos(cidade, local, espetaculo)');
            (data || []).forEach((r: any) => ws.addRow([
              r.evento ? \`\${r.evento.cidade} (\${r.evento.espetaculo})\` : "-",
              r.numero_quarto || "S/N",
              r.tipo_quarto || "-",
              r.hospede_1 || "-",
              r.hospede_2 || "-",
              r.hospede_3 || "-",
              r.observacoes || "-"
            ]));
            applyExcelStyles(ws, 3);
          }`;

const pdfPublicoIdx = content.indexOf('else if (repId === "publico") {');
const excelPublicoIdx = content.indexOf('else if (repId === "publico") {', pdfPublicoIdx + 1);

content = content.substring(0, excelPublicoIdx) + excelBlock.trim() + '\n          ' + content.substring(excelPublicoIdx);
content = content.substring(0, pdfPublicoIdx) + pdfBlock.trim() + '\n          ' + content.substring(pdfPublicoIdx);

fs.writeFileSync('src/routes/_authenticated/emissao-relatorios.tsx', content, 'utf8');
