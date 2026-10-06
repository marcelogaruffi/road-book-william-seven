import re
import os

with open('src/routes/_authenticated/catering.index.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add getLogoBase64 helper outside the functions
logo_helper = """
  const getLogoBase64AndImg = async (): Promise<{base64: string, img: HTMLImageElement, width: number, height: number} | null> => {
    try {
      const response = await fetch('/logo-seven.png');
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result as string);
      });
      const img = new Image();
      img.src = base64;
      await new Promise((res) => { img.onload = res; });
      return { base64, img, width: img.naturalWidth, height: img.naturalHeight };
    } catch (e) {
      console.warn("Logo não carregado", e);
      return null;
    }
  };
"""
content = re.sub(r'(const exportRestricoesExcel = async \(\) => {)', logo_helper + r'\n  \1', content)

# 2. Fix Excel Restricoes layout with Logo and Filename
excel_rest_regex = r"let headerRowNumber = 1;[\s\S]*?headerRowNumber = 3;"
excel_rest_replacement = """      let headerRowNumber = 1;
      const logoData = await getLogoBase64AndImg();
      if (logoData) {
        const imageId = workbook.addImage({ base64: logoData.base64, extension: 'png' });
        worksheet.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 120, height: 40 } });
        worksheet.getRow(1).height = 60;
        worksheet.mergeCells('B1:C1');
        worksheet.getCell('B1').value = `Restrições Alimentares - ${eventoFull?.espetaculo || ''}`;
        worksheet.getCell('B1').font = { size: 16, bold: true };
        worksheet.getCell('B1').alignment = { vertical: 'middle', horizontal: 'left' };
        headerRowNumber = 3;
      } else {
        worksheet.getRow(1).height = 60;
        worksheet.mergeCells('A1:C1');
        worksheet.getCell('A1').value = `Restrições Alimentares - ${eventoFull?.espetaculo || ''}`;
        worksheet.getCell('A1').font = { size: 16, bold: true };
        worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left' };
        headerRowNumber = 3;
      }"""
content = re.sub(excel_rest_regex, excel_rest_replacement, content, count=1)

# fix filename Excel Restricoes
content = re.sub(
    r"const safeName = \(eventoFull\?\.espetaculo \|\| 'Evento'\)\.replace\(/\[\^a-zA-Z0-9_ -\]/g, '_'\);\s*saveAs\(new Blob\(\[buffer\]\), `Restricoes_\$\{safeName\}\.xlsx`\);",
    r"const safeName = `Restricoes_${eventoFull?.espetaculo || 'Evento'}_${eventoFull?.cidade || ''}`.replace(/[^a-zA-Z0-9_ -]/g, '_');\n      saveAs(new Blob([buffer]), `${safeName}.xlsx`);",
    content
)

# 3. Fix Excel Cardapio layout with Logo and Filename
excel_card_regex = r"let headerRowNumber = 1;[\s\S]*?headerRowNumber = 3;"
excel_card_replacement = """      let headerRowNumber = 1;
      const logoData = await getLogoBase64AndImg();
      if (logoData) {
        const imageId = workbook.addImage({ base64: logoData.base64, extension: 'png' });
        worksheet.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 120, height: 40 } });
        worksheet.getRow(1).height = 60;
        worksheet.mergeCells('B1:D1');
        worksheet.getCell('B1').value = `Cardápio de Catering - ${eventoFull?.espetaculo || ''}`;
        worksheet.getCell('B1').font = { size: 16, bold: true };
        worksheet.getCell('B1').alignment = { vertical: 'middle', horizontal: 'left' };
        headerRowNumber = 3;
      } else {
        worksheet.getRow(1).height = 60;
        worksheet.mergeCells('A1:D1');
        worksheet.getCell('A1').value = `Cardápio de Catering - ${eventoFull?.espetaculo || ''}`;
        worksheet.getCell('A1').font = { size: 16, bold: true };
        worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left' };
        headerRowNumber = 3;
      }"""
content = re.sub(excel_card_regex, excel_card_replacement, content, count=1)

content = re.sub(
    r"const safeName = \(eventoFull\?\.espetaculo \|\| 'Evento'\)\.replace\(/\[\^a-zA-Z0-9_ -\]/g, '_'\);\s*saveAs\(new Blob\(\[buffer\]\), `Cardapio_\$\{safeName\}\.xlsx`\);",
    r"const safeName = `Cardapio_${eventoFull?.espetaculo || 'Evento'}_${eventoFull?.cidade || ''}`.replace(/[^a-zA-Z0-9_ -]/g, '_');\n      saveAs(new Blob([buffer]), `${safeName}.xlsx`);",
    content
)

# 4. Fix drawHeaderPDF
draw_header_pdf = """  const drawHeaderPDF = (doc: jsPDF, title: string, logoData: {base64: string, width: number, height: number} | null) => {
    let y = 15;
    if (logoData) {
      const imgWidth = 40;
      const imgHeight = (logoData.height / logoData.width) * imgWidth;
      doc.addImage(logoData.base64, 'PNG', 14, y, imgWidth, imgHeight);
      y += imgHeight + 10;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(title, 14, y);
    y += 8;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Espetáculo: ${eventoFull?.espetaculo || '-'}`, 14, y);
    y += 6;
    if (eventoFull?.data) {
       doc.text(`Data: ${new Date(eventoFull.data + 'T12:00:00').toLocaleDateString('pt-BR')}`, 14, y);
       y += 6;
    }
    if (eventoFull?.local || eventoFull?.cidade) {
       doc.text(`Local: ${eventoFull.local || ''} - ${eventoFull.cidade || ''}`, 14, y);
       y += 6;
    }
    y += 6;
    return y;
  };"""
content = re.sub(r'const drawHeaderPDF = \(doc: jsPDF, title: string\) => \{[\s\S]*?return y;\n  \};', draw_header_pdf, content)

# 5. Fix PDF Restricoes
content = re.sub(
    r'let y = drawHeaderPDF\(doc, "Restrições Alimentares da Equipe"\);',
    r'const logoData = await getLogoBase64AndImg();\n      let y = drawHeaderPDF(doc, "Restrições Alimentares da Equipe", logoData);',
    content
)
# Note: "Restrições" encoding might be weird so fallback
content = re.sub(
    r'let y = drawHeaderPDF\(doc, "RestriÃ§Ãµes Alimentares da Equipe"\);',
    r'const logoData = await getLogoBase64AndImg();\n      let y = drawHeaderPDF(doc, "Restrições Alimentares da Equipe", logoData);',
    content
)

content = re.sub(
    r"const safeName = \(eventoFull\?\.espetaculo \|\| 'Evento'\)\.replace\(/\[\^a-zA-Z0-9_ -\]/g, '_'\);\s*doc\.save\(`Restricoes_\$\{safeName\}\.pdf`\);",
    r"const safeName = `Restricoes_${eventoFull?.espetaculo || 'Evento'}_${eventoFull?.cidade || ''}`.replace(/[^a-zA-Z0-9_ -]/g, '_');\n      doc.save(`${safeName}.pdf`);",
    content
)

# 6. Fix PDF Cardapio
content = re.sub(
    r'let y = drawHeaderPDF\(doc, "Cardápio de Catering"\);',
    r'const logoData = await getLogoBase64AndImg();\n      let y = drawHeaderPDF(doc, "Cardápio de Catering", logoData);',
    content
)
content = re.sub(
    r'let y = drawHeaderPDF\(doc, "CardÃ¡pio de Catering"\);',
    r'const logoData = await getLogoBase64AndImg();\n      let y = drawHeaderPDF(doc, "Cardápio de Catering", logoData);',
    content
)

content = re.sub(
    r"const safeName = \(eventoFull\?\.espetaculo \|\| 'Evento'\)\.replace\(/\[\^a-zA-Z0-9_ -\]/g, '_'\);\s*doc\.save\(`Cardapio_\$\{safeName\}\.pdf`\);",
    r"const safeName = `Cardapio_${eventoFull?.espetaculo || 'Evento'}_${eventoFull?.cidade || ''}`.replace(/[^a-zA-Z0-9_ -]/g, '_');\n      doc.save(`${safeName}.pdf`);",
    content
)

# Replace the info toasts from Cardapio
content = re.sub(r'toast\.info\(".*?\"\);\n', '', content)

with open('src/routes/_authenticated/catering.index.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
