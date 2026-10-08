const fs = require('fs');
let c = fs.readFileSync('src/routes/_authenticated/emissao-relatorios.tsx', 'utf8');
c = c.replace('import pkg from "file-saver";', 'import * as fileSaverPkg from "file-saver";');
c = c.replace('const { saveAs } = pkg;', 'const saveAs = fileSaverPkg.saveAs || fileSaverPkg.default?.saveAs || fileSaverPkg.default;');
fs.writeFileSync('src/routes/_authenticated/emissao-relatorios.tsx', c);
