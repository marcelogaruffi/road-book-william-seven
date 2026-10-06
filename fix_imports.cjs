const fs = require('fs');
let c = fs.readFileSync('src/routes/_authenticated/emissao-relatorios.tsx', 'utf8');

const targetStr = \import pkg from "file-saver";
const { saveAs } = pkg;
import { FileText, Download, CheckCircle2 } from "lucide-react";\;

const repStr = \import pkg from "file-saver";
import { FileText, Download, CheckCircle2 } from "lucide-react";

const { saveAs } = pkg;\;

c = c.replace(targetStr, repStr);
c = c.replace(targetStr.replace(/\\n/g, '\\r\\n'), repStr);

fs.writeFileSync('src/routes/_authenticated/emissao-relatorios.tsx', c);
