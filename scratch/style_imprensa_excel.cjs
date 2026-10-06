const fs = require('fs');

let code = fs.readFileSync('src/routes/_authenticated/imprensa.tsx', 'utf8');

const excelFunctions = `
  const exportMailingExcel = async () => {
    if (filteredMailing.length === 0) return toast.error('Nenhum contato para exportar');
    
    toast.info("Gerando Excel, aguarde...");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Mailing");
    
    let logoBase64;
    try {
      const response = await fetch('/logo-seven.png');
      const blob = await response.blob();
      logoBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result);
      });
    } catch (e) { }

    let imgHeightExcel = 70;
    const imgWidthExcel = 140;
    if (logoBase64) {
      const img = new Image();
      img.src = logoBase64;
      await new Promise((res) => { img.onload = res; });
      imgHeightExcel = (img.naturalHeight / img.naturalWidth) * imgWidthExcel;
    }

    worksheet.getColumn(1).width = 25;
    worksheet.getColumn(2).width = 30;
    worksheet.getColumn(3).width = 20;
    worksheet.getColumn(4).width = 30;
    worksheet.getColumn(5).width = 20;

    const headerRowNumber = logoBase64 ? 6 : 1;
    
    if (logoBase64) {
      const imageId = workbook.addImage({ base64: logoBase64, extension: 'png' });
      worksheet.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: imgWidthExcel, height: imgHeightExcel } });
      worksheet.mergeCells('D1:E4');
      const titleCell = worksheet.getCell('D1');
      titleCell.value = 'Relatório de Mailing';
      titleCell.font = { size: 16, bold: true, color: { argb: "FF0f172a" } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
    }

    const headerRow = worksheet.getRow(headerRowNumber);
    headerRow.values = ['Veículo', 'Nome do Contato', 'Tipo de Mídia', 'Email', 'Telefone'];
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FF0F172A' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: {style:'thin', color: {argb:'FFE2E8F0'}}, bottom: {style:'thin', color: {argb:'FFE2E8F0'}}, left: {style:'thin', color: {argb:'FFE2E8F0'}}, right: {style:'thin', color: {argb:'FFE2E8F0'}} };
    });

    let currentRow = headerRowNumber + 1;
    filteredMailing.forEach(m => {
      const row = worksheet.getRow(currentRow);
      row.values = [m.veiculo || '-', m.nome || '-', m.tipo_midia || '-', m.email || '-', m.telefone || '-'];
      row.eachCell((cell) => {
        cell.font = { color: { argb: 'FF334155' } };
        cell.border = { top: {style:'thin', color: {argb:'FFE2E8F0'}}, bottom: {style:'thin', color: {argb:'FFE2E8F0'}}, left: {style:'thin', color: {argb:'FFE2E8F0'}}, right: {style:'thin', color: {argb:'FFE2E8F0'}} };
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      });
      currentRow++;
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
    
    let logoBase64;
    try {
      const response = await fetch('/logo-seven.png');
      const blob = await response.blob();
      logoBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result);
      });
    } catch (e) { }

    let imgHeightExcel = 70;
    const imgWidthExcel = 140;
    if (logoBase64) {
      const img = new Image();
      img.src = logoBase64;
      await new Promise((res) => { img.onload = res; });
      imgHeightExcel = (img.naturalHeight / img.naturalWidth) * imgWidthExcel;
    }

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

    const headerRowNumber = logoBase64 ? 6 : 1;
    
    if (logoBase64) {
      const imageId = workbook.addImage({ base64: logoBase64, extension: 'png' });
      worksheet.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: imgWidthExcel, height: imgHeightExcel } });
      worksheet.mergeCells('D1:L4');
      const titleCell = worksheet.getCell('D1');
      titleCell.value = 'Relatório de Clipping';
      titleCell.font = { size: 16, bold: true, color: { argb: "FF0f172a" } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
    }

    const headerRow = worksheet.getRow(headerRowNumber);
    headerRow.values = ['Espetáculo', 'Veículo', 'Matéria', 'Data', 'Sentimento', 'Link', 'Geo', 'Público', 'Autoridade', 'CTA', 'Score Total', 'Tier'];
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FF0F172A' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: {style:'thin', color: {argb:'FFE2E8F0'}}, bottom: {style:'thin', color: {argb:'FFE2E8F0'}}, left: {style:'thin', color: {argb:'FFE2E8F0'}}, right: {style:'thin', color: {argb:'FFE2E8F0'}} };
    });

    let currentRow = headerRowNumber + 1;
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
      
      const row = worksheet.getRow(currentRow);
      row.values = [
        c.espetaculo, c.veiculo, c.titulo_materia || '-', 
        new Date(c.data_publicacao).toLocaleDateString('pt-BR'), c.sentimento.toUpperCase(), c.link_materia || '-',
        geo, publico, autoridade, cta, scoreStr, tier
      ];
      
      row.eachCell((cell, colNumber) => {
        cell.font = { color: { argb: 'FF334155' } };
        cell.border = { top: {style:'thin', color: {argb:'FFE2E8F0'}}, bottom: {style:'thin', color: {argb:'FFE2E8F0'}}, left: {style:'thin', color: {argb:'FFE2E8F0'}}, right: {style:'thin', color: {argb:'FFE2E8F0'}} };
        cell.alignment = { vertical: 'middle', horizontal: colNumber >= 7 ? 'center' : 'left', wrapText: true };
      });
      
      currentRow++;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "clipping_resultados.xlsx");
    toast.dismiss();
  };
`;

const blockRegex = /const exportMailingExcel = async \(\) => \{[\s\S]*?toast\.dismiss\(\);\s*\};/m;
code = code.replace(blockRegex, excelFunctions);

fs.writeFileSync('src/routes/_authenticated/imprensa.tsx', code, 'utf8');
