const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/imprensa.tsx', 'utf8');

const newPrintFunctions = `const fetchLogo = async () => {
    try {
      const response = await fetch('/logo-seven.png');
      const blob = await response.blob();
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result as string);
      });
    } catch(e) { return null; }
  };

  const printMailing = async () => {
    if (filteredMailing.length === 0) return toast.error('Nenhum contato para imprimir');
    
    toast.info("Gerando relatório, aguarde...");
    const doc = new jsPDF();
    let startY = 20;
    
    const logoBase64 = await fetchLogo();
    if (logoBase64) {
      const imgWidth = 40;
      const imgHeight = 40; // Approx or we can just use 40x20
      const pageWidth = doc.internal.pageSize.getWidth();
      const x = (pageWidth - imgWidth) / 2;
      doc.addImage(logoBase64, 'PNG', x, 10, imgWidth, 25);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Relatório de Mailing", pageWidth / 2, 45, { align: 'center' });
      startY = 52;
    } else {
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Relatório de Mailing", pageWidth / 2, 15, { align: 'center' });
    }
    
    autoTable(doc, {
      startY: startY,
      head: [['Veículo', 'Nome do Contato', 'Tipo de Mídia', 'Email', 'Telefone']],
      body: filteredMailing.map(m => [
        m.veiculo || '-',
        m.nome || '-',
        m.tipo_midia || '-',
        m.email || '-',
        m.telefone || '-'
      ]),
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, textColor: [51, 65, 85], lineColor: [226, 232, 240] },
      headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42] }
    });
    
    doc.save('mailing_imprensa.pdf');
    toast.dismiss();
  };

  const printClipping = async () => {
    const listToPrint = clippingTags.length > 0 ? clipping.filter(c => clippingTags.includes(c.espetaculo)) : clipping;
    if (listToPrint.length === 0) return toast.error('Nenhum clipping para imprimir');
    
    toast.info("Gerando relatório, aguarde...");
    const doc = new jsPDF();
    
    let y = 20;
    const logoBase64 = await fetchLogo();
    if (logoBase64) {
      const imgWidth = 40;
      const pageWidth = doc.internal.pageSize.getWidth();
      const x = (pageWidth - imgWidth) / 2;
      doc.addImage(logoBase64, 'PNG', x, 10, imgWidth, 25);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Relatório de Clipping", pageWidth / 2, 45, { align: 'center' });
      y = 55;
    } else {
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Relatório de Clipping", pageWidth / 2, 15, { align: 'center' });
      y = 30;
    }
    
    listToPrint.forEach((clip, index) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(clip.espetaculo, 14, y);
      y += 6;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(\`Veículo: \${clip.veiculo}\`, 14, y);
      y += 5;
      doc.text(\`Matéria: \${clip.titulo_materia || '-'}\`, 14, y);
      y += 5;
      doc.text(\`Data: \${new Date(clip.data_publicacao).toLocaleDateString('pt-BR')} | Sentimento: \${clip.sentimento.toUpperCase()}\`, 14, y);
      y += 5;
      
      if (clip.link_materia) {
        doc.text('Link da Matéria: ', 14, y);
        doc.setTextColor(37, 99, 235); // blue-600
        const textWidth = doc.getTextWidth('Link da Matéria: ');
        doc.textWithLink(clip.link_materia.substring(0, 70) + (clip.link_materia.length > 70 ? '...' : ''), 14 + textWidth, y, { url: clip.link_materia });
        doc.setTextColor(0, 0, 0);
        y += 5;
      }
      
      if (clip.resultados && typeof clip.resultados === 'object') {
        const res = clip.resultados;
        const g = res.geo || 0, p = res.publico || 0, a = res.autoridade || 0, c = res.cta || 0;
        const score = g + p + a + c;
        const tier = score >= 16 ? 'A' : (score >= 11 ? 'B' : 'C');
        
        let pText = [];
        if (g) pText.push(\`Geo: \${g}/5\`);
        if (p) pText.push(\`Público: \${p}/5\`);
        if (a) pText.push(\`Autoridade: \${a}/5\`);
        if (c) pText.push(\`CTA: \${c}/5\`);
        
        if (pText.length > 0) {
          doc.text(\`Relevância: \${pText.join(' | ')}\`, 14, y);
          y += 5;
          doc.setFont("helvetica", "bold");
          doc.text(\`Pontuação Total: \${score}/20 (Tier \${tier})\`, 14, y);
          doc.setFont("helvetica", "normal");
          y += 5;
        }
      }
      
      y += 6;
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.line(14, y - 4, 196, y - 4);
    });
    
    doc.save('clipping_resultados.pdf');
    toast.dismiss();
  };`;

const blockRegex = /const printMailing = \(\) => \{[\s\S]*?toast\.dismiss\(\);\s*\};/m;
code = code.replace(blockRegex, newPrintFunctions);
fs.writeFileSync('src/routes/_authenticated/imprensa.tsx', code, 'utf8');
