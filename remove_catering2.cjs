const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/camarins.index.tsx', 'utf8');

// The button rendering part
const buttonRegex = /\{activeTab === 'evento' && \(\s*<button onClick=\{\(\) => setSelectedTipo\("catering"\)\}.*?<\/button>\s*\)\}/gs;
code = code.replace(buttonRegex, '');

// The export buttons rendering part
const exportRegex = /\{selectedTipo === 'catering'.*?<\/ReportExportButton>\s*<\/>\s*\)\}/gs;
code = code.replace(exportRegex, '');

// The tab content
const tabRegex = /\{\/\* TAB: CATERING \(Apenas Evento\) \*\/\}\s*\{selectedTipo === 'catering'.*?<\/table>\s*<\/div>\s*<\/div>\s*\)\}/gs;
code = code.replace(tabRegex, '');

// The functions
const func1Regex = /const exportCateringExcel = async \(\) => \{.*?\};\s*(?=const exportCateringPDF|const exportToExcel)/gs;
code = code.replace(func1Regex, '');

const func2Regex = /const exportCateringPDF = async \(\) => \{.*?\};\s*(?=const exportToExcel|const exportToPDF)/gs;
code = code.replace(func2Regex, '');

fs.writeFileSync('src/routes/_authenticated/camarins.index.tsx', code);
console.log('done 2');
