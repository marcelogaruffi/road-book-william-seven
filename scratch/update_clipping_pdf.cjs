const fs = require('fs');

let code = fs.readFileSync('src/routes/_authenticated/imprensa.tsx', 'utf8');

// I need to add profile to ImprensaPage if not already there, it is:
// const { profile } = AuthedRoute.useRouteContext();

// Now, replace printClipping function
const oldClippingRegex = /const printClipping = \(\) => \{[\s\S]*?doc\.save\('clipping_resultados\.pdf'\);\s*\};/m;
const newClippingCode = `const printClipping = async () => {
    const listToPrint = clippingTags.length > 0 ? clipping.filter(c => clippingTags.includes(c.espetaculo)) : clipping;
    if (listToPrint.length === 0) return toast.error('Nenhum clipping para imprimir');
    
    toast.info("Gerando relatório, aguarde...");
    const doc = new jsPDF();
    
    // Header
    if (profile?.logo_cia_url) {
      try {
        const logoData = await fetch(profile.logo_cia_url).then(r => r.blob()).then(blob => new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        }));
        doc.addImage(logoData, 'PNG', 14, 10, 30, 30, undefined, 'FAST');
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("Relatório de Clipping", 50, 22);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(\`Gerado em \${new Date().toLocaleDateString('pt-BR')} às \${new Date().toLocaleTimeString('pt-BR')}\`, 50, 30);
      } catch(e) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("Relatório de Clipping", 14, 22);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(\`Gerado em \${new Date().toLocaleDateString('pt-BR')} às \${new Date().toLocaleTimeString('pt-BR')}\`, 14, 30);
      }
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("Relatório de Clipping", 14, 22);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(\`Gerado em \${new Date().toLocaleDateString('pt-BR')} às \${new Date().toLocaleTimeString('pt-BR')}\`, 14, 30);
    }
    
    let y = profile?.logo_cia_url ? 50 : 40;
    
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
      
      doc.setFontSize(11);
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
        doc.textWithLink(clip.link_materia.substring(0, 50) + (clip.link_materia.length > 50 ? '...' : ''), 14 + textWidth, y, { url: clip.link_materia });
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

code = code.replace(oldClippingRegex, newClippingCode);

fs.writeFileSync('src/routes/_authenticated/imprensa.tsx', code, 'utf8');
