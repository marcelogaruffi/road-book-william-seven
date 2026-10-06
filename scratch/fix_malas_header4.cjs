const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/malas.$evento_id.tsx', 'utf8');

const regex = /(<div className="flex items-center justify-between mb-4">[\s\S]*?<\/div>)/;

const match = code.match(regex);
if (match) {
  const header = match[0];
  code = code.replace(header, "");
  
  const tabsPrefix = `<Tabs defaultValue="evento" className="w-full px-2 md:px-6 py-6 max-w-6xl mx-auto">`;
  code = code.replace(tabsPrefix, `\n      <div className="w-full px-2 md:px-6 max-w-4xl mx-auto mb-6 mt-4">\n        ${header}\n      </div>\n      ${tabsPrefix}`);

  if (!code.includes('return (\n    <>\n      <Tabs')) {
    code = code.replace(/return \(\s*<Tabs/, 'return (\n    <>\n      <Tabs');
    code = code.replace(/<\/Tabs>\s*\);\s*\}/, '</Tabs>\n    </>\n  );\n}');
  }
  fs.writeFileSync('src/routes/_authenticated/malas.$evento_id.tsx', code, 'utf8');
  console.log('Fixed malas header');
} else {
  console.log('Still failed');
}
