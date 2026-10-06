const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/imprensa.tsx', 'utf8');

if (!code.includes('import * as XLSX')) {
  code = code.replace(/import autoTable from "jspdf-autotable";/, `import autoTable from "jspdf-autotable";\nimport * as XLSX from "xlsx";\nimport { ReportExportButton } from "@/components/ReportExportButton";`);
}

// Add the Excel export functions
const excelFunctions = `
  const exportMailingExcel = () => {
    if (filteredMailing.length === 0) return toast.error('Nenhum contato para exportar');
    
    const data = filteredMailing.map(m => ({
      'Veículo': m.veiculo || '-',
      'Nome do Contato': m.nome || '-',
      'Tipo de Mídia': m.tipo_midia || '-',
      'Email': m.email || '-',
      'Telefone': m.telefone || '-'
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mailing");
    XLSX.writeFile(wb, "mailing_imprensa.xlsx");
  };

  const exportClippingExcel = () => {
    const listToPrint = clippingTags.length > 0 ? clipping.filter(c => clippingTags.includes(c.espetaculo)) : clipping;
    if (listToPrint.length === 0) return toast.error('Nenhum clipping para exportar');
    
    const data = listToPrint.map(c => {
      let geo = '-', publico = '-', autoridade = '-', cta = '-';
      if (c.resultados && typeof c.resultados === 'object') {
        const res = c.resultados;
        geo = res.geo ? res.geo.toString() : '-';
        publico = res.publico ? res.publico.toString() : '-';
        autoridade = res.autoridade ? res.autoridade.toString() : '-';
        cta = res.cta ? res.cta.toString() : '-';
      }
      return {
        'Espetáculo': c.espetaculo,
        'Veículo': c.veiculo,
        'Matéria': c.titulo_materia || '-',
        'Data': new Date(c.data_publicacao).toLocaleDateString('pt-BR'),
        'Sentimento': c.sentimento.toUpperCase(),
        'Link': c.link_materia || '-',
        'Geo': geo,
        'Público': publico,
        'Autoridade': autoridade,
        'CTA': cta
      };
    });
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clipping");
    XLSX.writeFile(wb, "clipping_resultados.xlsx");
  };
`;

if (!code.includes('exportMailingExcel')) {
  code = code.replace(/const filteredMailing =/g, excelFunctions + '\n  const filteredMailing =');
}

// Replace the old PDF buttons with <ReportExportButton>
const mailingBtnRegex = /<Button variant="outline" onClick=\{printMailing\} className="mr-2 border-slate-200 text-slate-700"><Printer className="w-4 h-4 mr-2" \/> Gerar Relatório<\/Button>/g;
code = code.replace(mailingBtnRegex, `<ReportExportButton onExportPdf={printMailing} onExportExcel={exportMailingExcel} />`);

const clippingBtnRegex = /<Button variant="outline" onClick=\{printClipping\} className="mr-2 border-slate-200 text-slate-700"><Printer className="w-4 h-4 mr-2" \/> Gerar Relatório<\/Button>/g;
code = code.replace(clippingBtnRegex, `<ReportExportButton onExportPdf={printClipping} onExportExcel={exportClippingExcel} />`);

fs.writeFileSync('src/routes/_authenticated/imprensa.tsx', code, 'utf8');
