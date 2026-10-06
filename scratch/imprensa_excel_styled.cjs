const fs = require('fs');

let code = fs.readFileSync('src/routes/_authenticated/imprensa.tsx', 'utf8');

// Replace xlsx imports with exceljs
code = code.replace(/import \* as XLSX from "xlsx";/, `import ExcelJS from "exceljs";\nimport pkg from "file-saver";\nconst { saveAs } = pkg;`);

const newExcelFunctions = `const exportMailingExcel = async () => {
    if (filteredMailing.length === 0) return toast.error('Nenhum contato para exportar');
    
    toast.info("Gerando Excel, aguarde...");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Mailing");
    
    worksheet.getColumn(1).width = 25;
    worksheet.getColumn(2).width = 30;
    worksheet.getColumn(3).width = 20;
    worksheet.getColumn(4).width = 30;
    worksheet.getColumn(5).width = 20;
    
    const headerRow = worksheet.addRow(['Veículo', 'Nome do Contato', 'Tipo de Mídia', 'Email', 'Telefone']);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: "FF1E3A8A" } }; // blue-900
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    
    filteredMailing.forEach(m => {
      worksheet.addRow([
        m.veiculo || '-',
        m.nome || '-',
        m.tipo_midia || '-',
        m.email || '-',
        m.telefone || '-'
      ]);
    });
    
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "mailing_imprensa.xlsx");
    toast.dismiss();
  };

  const exportClippingExcel = async () => {
    const listToPrint = clippingTags.length > 0 ? clipping.filter(c => clippingTags.includes(c.espetaculo)) : clipping;
    if (listToPrint.length === 0) return toast.error('Nenhum clipping para exportar');
    
    toast.info("Gerando Excel, aguarde...");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Clipping");
    
    worksheet.getColumn(1).width = 25;
    worksheet.getColumn(2).width = 25;
    worksheet.getColumn(3).width = 40;
    worksheet.getColumn(4).width = 15;
    worksheet.getColumn(5).width = 15;
    worksheet.getColumn(6).width = 40;
    worksheet.getColumn(7).width = 10;
    worksheet.getColumn(8).width = 10;
    worksheet.getColumn(9).width = 12;
    worksheet.getColumn(10).width = 10;
    worksheet.getColumn(11).width = 12;
    worksheet.getColumn(12).width = 10;
    
    const headerRow = worksheet.addRow([
      'Espetáculo', 'Veículo', 'Matéria', 'Data', 'Sentimento', 'Link', 
      'Geo', 'Público', 'Autoridade', 'CTA', 'Score Total', 'Tier'
    ]);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: "FF1E3A8A" } }; // blue-900
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    
    listToPrint.forEach(c => {
      let geo = '-', publico = '-', autoridade = '-', cta = '-';
      let scoreStr = '-', tier = '-';
      if (c.resultados && typeof c.resultados === 'object') {
        const res = c.resultados;
        const g = res.geo || 0, p = res.publico || 0, a = res.autoridade || 0, ct = res.cta || 0;
        geo = g ? g.toString() : '-';
        publico = p ? p.toString() : '-';
        autoridade = a ? a.toString() : '-';
        cta = ct ? ct.toString() : '-';
        
        const score = g + p + a + ct;
        if (score > 0) {
          scoreStr = score.toString();
          tier = score >= 16 ? 'A' : (score >= 11 ? 'B' : 'C');
        }
      }
      worksheet.addRow([
        c.espetaculo,
        c.veiculo,
        c.titulo_materia || '-',
        new Date(c.data_publicacao).toLocaleDateString('pt-BR'),
        c.sentimento.toUpperCase(),
        c.link_materia || '-',
        geo, publico, autoridade, cta, scoreStr, tier
      ]);
    });
    
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "clipping_resultados.xlsx");
    toast.dismiss();
  };`;

const blockRegex = /const exportMailingExcel = \(\) => \{[\s\S]*?XLSX\.writeFile\(wb, "clipping_resultados\.xlsx"\);\s*\};/m;
code = code.replace(blockRegex, newExcelFunctions);

fs.writeFileSync('src/routes/_authenticated/imprensa.tsx', code, 'utf8');
