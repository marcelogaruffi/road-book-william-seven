const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/imprensa.tsx', 'utf8');

const regexMailing = /\{isAllowed && \(\s*<ReportExportButton onExportPdf=\{printMailing\} onExportExcel=\{exportMailingExcel\} \/>\s*<Dialog open=\{isMailingOpen\} onOpenChange=\{setIsMailingOpen\}>/g;
code = code.replace(regexMailing, `{isAllowed && (\n<div className="flex items-center">\n<ReportExportButton onExportPdf={printMailing} onExportExcel={exportMailingExcel} />\n<Dialog open={isMailingOpen} onOpenChange={setIsMailingOpen}>`);

code = code.replace(/<\/Dialog>\s*\)\}\s*<\/div>\s*\{loading \?/g, `</Dialog>\n</div>\n)}\n</div>\n{loading ?`); // Fix closing div for mailing

const regexClipping = /\{isAllowed && \(\s*<>\s*<ReportExportButton onExportPdf=\{printClipping\} onExportExcel=\{exportClippingExcel\} \/>/g;
code = code.replace(regexClipping, `{isAllowed && (\n<div className="flex items-center">\n<ReportExportButton onExportPdf={printClipping} onExportExcel={exportClippingExcel} />`);

code = code.replace(/<\/Dialog>\s*<\/>\s*\)\}\s*<\/div>\s*<div className="grid/g, `</Dialog>\n</div>\n)}\n</div>\n<div className="grid`); // Fix closing div for clipping

fs.writeFileSync('src/routes/_authenticated/imprensa.tsx', code, 'utf8');
