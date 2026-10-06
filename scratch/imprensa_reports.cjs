const fs = require('fs');

let code = fs.readFileSync('src/routes/_authenticated/imprensa.tsx', 'utf8');

if (!code.includes('import { jsPDF }')) {
  code = code.replace(/import \{ createFileRoute \} from "@tanstack\/react-router";/, `import { createFileRoute } from "@tanstack/react-router";\nimport { jsPDF } from "jspdf";\nimport autoTable from "jspdf-autotable";`);
}
if (!code.includes('import { Newspaper, Mail, Plus, Trash2, Search, Link as LinkIcon, ExternalLink, Filter, Star, Info, CheckCircle2, BarChart, Printer }')) {
  code = code.replace(/BarChart \} from "lucide-react";/, 'BarChart, Printer } from "lucide-react";');
}

const printFunctions = `
  const printMailing = () => {
    if (filteredMailing.length === 0) return toast.error('Nenhum contato para imprimir');
    
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Relatório de Mailing (Imprensa)", 14, 22);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(\`Gerado em \${new Date().toLocaleDateString('pt-BR')} às \${new Date().toLocaleTimeString('pt-BR')}\`, 14, 30);
    
    autoTable(doc, {
      startY: 40,
      head: [['Veículo', 'Nome do Contato', 'Tipo de Mídia', 'Email', 'Telefone']],
      body: filteredMailing.map(m => [
        m.veiculo || '-',
        m.nome || '-',
        m.tipo_midia || '-',
        m.email || '-',
        m.telefone || '-'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [30, 64, 175] },
      styles: { fontSize: 9 }
    });
    
    doc.save('mailing_imprensa.pdf');
  };

  const printClipping = () => {
    const listToPrint = clippingTags.length > 0 ? clipping.filter(c => clippingTags.includes(c.espetaculo)) : clipping;
    if (listToPrint.length === 0) return toast.error('Nenhum clipping para imprimir');
    
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Relatório de Clipping (Resultados)", 14, 22);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(\`Gerado em \${new Date().toLocaleDateString('pt-BR')} às \${new Date().toLocaleTimeString('pt-BR')}\`, 14, 30);
    
    let y = 40;
    
    listToPrint.forEach((clip, index) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(\`Espetáculo: \${clip.espetaculo}\`, 14, y);
      y += 6;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(\`Veículo: \${clip.veiculo}\`, 14, y);
      y += 5;
      doc.text(\`Matéria: \${clip.titulo_materia || '-'}\`, 14, y);
      y += 5;
      doc.text(\`Data: \${new Date(clip.data_publicacao).toLocaleDateString('pt-BR')} | Sentimento: \${clip.sentimento.toUpperCase()}\`, 14, y);
      y += 5;
      
      if (clip.link_materia) {
        doc.text(\`Link: \${clip.link_materia}\`, 14, y);
        y += 5;
      }
      
      if (clip.resultados && typeof clip.resultados === 'object') {
        const res = clip.resultados;
        let pText = [];
        if (res.geo) pText.push(\`Geo: \${res.geo}/5\`);
        if (res.publico) pText.push(\`Público: \${res.publico}/5\`);
        if (res.autoridade) pText.push(\`Autoridade: \${res.autoridade}/5\`);
        if (res.cta) pText.push(\`CTA: \${res.cta}/5\`);
        if (pText.length > 0) {
          doc.text(\`Relevância: \${pText.join(' | ')}\`, 14, y);
          y += 5;
        }
      }
      
      y += 8;
      doc.setDrawColor(200, 200, 200);
      doc.line(14, y - 4, 196, y - 4);
    });
    
    doc.save('clipping_resultados.pdf');
  };

`;

code = code.replace(/const filteredMailing =/g, printFunctions + '\n  const filteredMailing =');

// Inject Button to Mailing
const mailingBtnRegex = /<DialogTrigger asChild>\s*<Button className="bg-blue-600 hover:bg-blue-700 shadow-sm"><Plus className="w-4 h-4 mr-2" \/> Novo Contato<\/Button>\s*<\/DialogTrigger>/;
const mailingBtnReplacement = `<Button variant="outline" onClick={printMailing} className="mr-2 border-slate-200 text-slate-700"><Printer className="w-4 h-4 mr-2" /> Gerar Relatório</Button>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm"><Plus className="w-4 h-4 mr-2" /> Novo Contato</Button>
                  </DialogTrigger>`;
code = code.replace(mailingBtnRegex, mailingBtnReplacement);

// Inject Button to Clipping
// Let's find clipping header buttons
const clippingBtnRegex = /<Dialog open=\{isClippingOpen\} onOpenChange=\{setIsClippingOpen\}>[\s\S]*?<DialogTrigger asChild>\s*<Button className="bg-blue-600 hover:bg-blue-700 shadow-sm"><Plus className="w-4 h-4 mr-2" \/> Registrar Clipping<\/Button>\s*<\/DialogTrigger>/;
const clippingBtnReplacement = `<Button variant="outline" onClick={printClipping} className="mr-2 border-slate-200 text-slate-700"><Printer className="w-4 h-4 mr-2" /> Gerar Relatório</Button>
              <Dialog open={isClippingOpen} onOpenChange={setIsClippingOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm"><Plus className="w-4 h-4 mr-2" /> Registrar Clipping</Button>
                </DialogTrigger>`;

if (code.match(clippingBtnRegex)) {
  code = code.replace(clippingBtnRegex, clippingBtnReplacement);
} else {
  // alternative clipping button finding
  code = code.replace(/(<DialogTrigger asChild>\s*<Button className="bg-blue-600 hover:bg-blue-700 shadow-sm"><Plus className="w-4 h-4 mr-2" \/> Registrar Clipping<\/Button>\s*<\/DialogTrigger>)/, `<Button variant="outline" onClick={printClipping} className="mr-2 border-slate-200 text-slate-700"><Printer className="w-4 h-4 mr-2" /> Gerar Relatório</Button>\n                $1`);
}

fs.writeFileSync('src/routes/_authenticated/imprensa.tsx', code, 'utf8');
console.log('Done modifying imprensa.tsx');
