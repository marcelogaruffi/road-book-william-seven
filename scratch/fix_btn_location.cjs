const fs = require('fs');

let code = fs.readFileSync('src/routes/_authenticated/imprensa.tsx', 'utf8');

// Fix Mailing button too!
const mailingWrong = /<Dialog open=\{isMailingOpen\} onOpenChange=\{setIsMailingOpen\}>\s*<Button variant="outline" onClick=\{printMailing\} className="mr-2 border-slate-200 text-slate-700"><Printer className="w-4 h-4 mr-2" \/> Gerar Relatório<\/Button>/g;
const mailingRight = `<Button variant="outline" onClick={printMailing} className="mr-2 border-slate-200 text-slate-700"><Printer className="w-4 h-4 mr-2" /> Gerar Relatório</Button>
                  <Dialog open={isMailingOpen} onOpenChange={setIsMailingOpen}>`;

code = code.replace(mailingWrong, mailingRight);

// Fix Clipping button too!
const clippingWrong = /<Dialog open=\{isClippingOpen\} onOpenChange=\{setIsClippingOpen\}>\s*<Button variant="outline" onClick=\{printClipping\} className="mr-2 border-slate-200 text-slate-700"><Printer className="w-4 h-4 mr-2" \/> Gerar Relatório<\/Button>/g;
const clippingRight = `<Button variant="outline" onClick={printClipping} className="mr-2 border-slate-200 text-slate-700"><Printer className="w-4 h-4 mr-2" /> Gerar Relatório</Button>
                  <Dialog open={isClippingOpen} onOpenChange={setIsClippingOpen}>`;
code = code.replace(clippingWrong, clippingRight);

fs.writeFileSync('src/routes/_authenticated/imprensa.tsx', code, 'utf8');
