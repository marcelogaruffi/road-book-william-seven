const fs = require('fs');

const fixes = [
  {
    f: 'som.$evento_id.tsx',
    headerSearch: /<div className="flex items-center gap-4">[\s\S]*?Recomeçar \/ Trocar Modelo\s*<\/Button>\s*<div>\s*<h1.*?<\/h1>\s*<p.*?<\/p>\s*<\/div>\s*<\/div>/
  },
  {
    f: 'video.$evento_id.tsx',
    headerSearch: /<div className="flex items-center gap-4">[\s\S]*?Recomeçar \/ Trocar Modelo\s*<\/Button>\s*<div>\s*<h1.*?<\/h1>\s*<p.*?<\/p>\s*<\/div>\s*<\/div>/
  },
  {
    f: 'iluminacao.$evento_id.tsx',
    headerSearch: /<div className="flex items-center gap-4">[\s\S]*?Recomeçar \/ Trocar Modelo\s*<\/Button>\s*<div>\s*<h1.*?<\/h1>\s*<p.*?<\/p>\s*<\/div>\s*<\/div>/
  },
  {
    f: 'som-operacao.$evento_id.tsx',
    headerSearch: /<div className="flex items-center justify-between">\s*<div className="flex items-center gap-4">[\s\S]*?<\/div>\s*<\/div>\s*<Button onClick=\{startOperation\}[\s\S]*?<\/Button>\s*<\/div>/
  }
];

for (const {f, headerSearch} of fixes) {
  let code = fs.readFileSync('src/routes/_authenticated/' + f, 'utf8');

  const match = code.match(headerSearch);
  if (match) {
    const block = match[0];
    code = code.replace(block, "");
    const tabsPrefix = `<Tabs defaultValue="evento" className="w-full px-2 md:px-6 py-6 max-w-6xl mx-auto">`;
    code = code.replace(tabsPrefix, `\n      <div className="w-full px-2 md:px-6 max-w-6xl mx-auto mb-6 mt-4">\n${block}\n      </div>\n      ${tabsPrefix}`);

    if (!code.includes('return (\n    <>\n      <Tabs')) {
      code = code.replace(/return \(\s*<Tabs/, 'return (\n    <>\n      <Tabs');
      code = code.replace(/<\/Tabs>\s*\);\s*\}/, '</Tabs>\n    </>\n  );\n}');
    }
    
    fs.writeFileSync('src/routes/_authenticated/' + f, code, 'utf8');
    console.log('Fixed ' + f);
  } else {
    console.log('Regex did not match in ' + f);
  }
}
