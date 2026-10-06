const fs = require('fs');

function fixBracket(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  if (!code.includes('</Card>\n        )}')) {
    code = code.replace(/<\/Card>\s*<\/Tabs>/, '</Card>\n        )}\n      </Tabs>');
  }

  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Fixed', filePath);
}

fixBracket('src/routes/_authenticated/figurinos.index.tsx');
fixBracket('src/routes/_authenticated/camarins.index.tsx');
fixBracket('src/routes/_authenticated/iluminacao.index.tsx');
