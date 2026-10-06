const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/camarins.index.tsx', 'utf8');

// Remove selectedTipo type 'catering'
code = code.replace(/useState<"lista" \| "conferencia" \| "catering">/g, 'useState<"lista" | "conferencia">');

// Remove catering button
code = code.replace(/\{activeTab === 'evento' && \([\s\S]*?<button onClick=\{\(\) => setSelectedTipo\("catering"\)\}[\s\S]*?<\/button>[\s\S]*?\)\}/g, '');

// Remove the ReportExportButton for catering
code = code.replace(/\{selectedTipo === 'catering' && activeTab === 'evento' && selectedEventoId && \([\s\S]*?<\/ReportExportButton>[\s\S]*?<\/>\s*\)\}/g, '');

// Remove the TAB: CATERING section entirely
code = code.replace(/\{\/\* TAB: CATERING \(Apenas Evento\) \*\/\}[\s\S]*?\{selectedTipo === 'catering' && activeTab === 'evento' && \([\s\S]*?<\/div>\s*\)\}/g, '');

// Remove exportCateringExcel and exportCateringPDF functions
code = code.replace(/const exportCateringExcel = async \(\) => \{[\s\S]*?^\s*\};\s*/m, '');
code = code.replace(/const exportCateringPDF = async \(\) => \{[\s\S]*?^\s*\};\s*/m, '');

// Save changes
fs.writeFileSync('src/routes/_authenticated/camarins.index.tsx', code);
console.log('Removed catering from camarins');
