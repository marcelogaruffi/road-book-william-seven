const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

walkDir('./src', (filePath) => {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let code = fs.readFileSync(filePath, 'utf8');
    if (code.includes('import { saveAs } from "file-saver"')) {
      code = code.replace(/import\s*\{\s*saveAs\s*\}\s*from\s*["']file-saver["'];?/, 'import pkg from "file-saver";\nconst { saveAs } = pkg;');
      fs.writeFileSync(filePath, code, 'utf8');
      console.log('Fixed file-saver in ' + filePath);
    }
  }
});
