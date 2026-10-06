const fs = require('fs');

let code = fs.readFileSync('src/routes/_authenticated/imprensa.tsx', 'utf8');

// The original button is:
// <Button className="bg-slate-800 text-white hover:bg-slate-700 shadow-sm" onClick={() => {
// We want to add the print button right before the <DialogTrigger> for Nova Matéria

const clippingBtnRegex = /<DialogTrigger asChild>\s*<Button className="bg-slate-800 text-white hover:bg-slate-700 shadow-sm"/;
const clippingBtnReplacement = `<Button variant="outline" onClick={printClipping} className="mr-2 border-slate-200 text-slate-700"><Printer className="w-4 h-4 mr-2" /> Gerar Relatório</Button>
                    <DialogTrigger asChild>
                      <Button className="bg-slate-800 text-white hover:bg-slate-700 shadow-sm"`;

code = code.replace(clippingBtnRegex, clippingBtnReplacement);

fs.writeFileSync('src/routes/_authenticated/imprensa.tsx', code, 'utf8');
