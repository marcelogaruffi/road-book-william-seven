const fs = require('fs');

let code = fs.readFileSync('src/routes/_authenticated/imprensa.tsx', 'utf8');

// Fix in PDF:
const pdfLogicRegex = /if \(clip\.resultados && typeof clip\.resultados === 'object'\) \{[\s\S]*?doc\.setFont\("helvetica", "normal"\);\s*y \+= 5;\s*\}\s*\}/m;
const newPdfLogic = `
      const g = clip.relevancia_geo || 0, p = clip.relevancia_publico || 0, a = clip.relevancia_autoridade || 0, cta_val = clip.relevancia_cta || 0;
      const score = g + p + a + cta_val;
      const tier = score >= 16 ? 'A' : (score >= 11 ? 'B' : 'C');
      
      let pText = [];
      if (g) pText.push(\`Geo: \${g}/5\`);
      if (p) pText.push(\`Público: \${p}/5\`);
      if (a) pText.push(\`Autoridade: \${a}/5\`);
      if (cta_val) pText.push(\`CTA: \${cta_val}/5\`);
      
      if (pText.length > 0) {
        doc.text(\`Relevância: \${pText.join(' | ')}\`, 14, y);
        y += 5;
        doc.setFont("helvetica", "bold");
        doc.text(\`Pontuação Total: \${score}/20 (Tier \${tier})\`, 14, y);
        doc.setFont("helvetica", "normal");
        y += 5;
      }
`;
code = code.replace(pdfLogicRegex, newPdfLogic);


// Fix in Excel:
const excelLogicRegex = /if \(c\.resultados && typeof c\.resultados === 'object'\) \{[\s\S]*?tier = score >= 16 \? 'A' : \(score >= 11 \? 'B' : 'C'\);\s*\}\s*\}/m;
const newExcelLogic = `
      const g = c.relevancia_geo || 0, p = c.relevancia_publico || 0, a = c.relevancia_autoridade || 0, ct = c.relevancia_cta || 0;
      geo = g ? g.toString() : '-';
      publico = p ? p.toString() : '-';
      autoridade = a ? a.toString() : '-';
      cta = ct ? ct.toString() : '-';
      const score = g + p + a + ct;
      if (score > 0) {
        scoreStr = score.toString();
        tier = score >= 16 ? 'A' : (score >= 11 ? 'B' : 'C');
      }
`;
code = code.replace(excelLogicRegex, newExcelLogic);

fs.writeFileSync('src/routes/_authenticated/imprensa.tsx', code, 'utf8');
