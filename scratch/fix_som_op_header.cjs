const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/som-operacao.$evento_id.tsx', 'utf8');

const tabsRegex = /(<Tabs defaultValue="evento" className="w-full px-2 md:px-6 py-6 max-w-6xl mx-auto">\s*<TabsList[\s\S]*?<TabsContent value="evento" className="mt-0">\s*<div className="max-w-6xl mx-auto space-y-6 pb-20">\s*)(<div className="flex items-center justify-between">[\s\S]*?<\/div>)\s*(<Card)/;

if (tabsRegex.test(code)) {
  code = code.replace(tabsRegex, (match, prefix, header, suffix) => {
    const tabsPrefix = `<Tabs defaultValue="evento" className="w-full px-2 md:px-6 py-6 max-w-6xl mx-auto">`;
    const modifiedPrefix = prefix.replace(tabsPrefix, `\n      <div className="w-full px-2 md:px-6 max-w-6xl mx-auto mb-6 mt-4">\n        ${header}\n      </div>\n      ${tabsPrefix}`);
    return modifiedPrefix + suffix;
  });

  code = code.replace(/return \(\s*<Tabs/, 'return (\n    <>\n      <Tabs');
  code = code.replace(/<\/Tabs>\s*\);\s*\}/, '</Tabs>\n    </>\n  );\n}');
  
  fs.writeFileSync('src/routes/_authenticated/som-operacao.$evento_id.tsx', code, 'utf8');
  console.log(`Updated layout for som-operacao.$evento_id.tsx`);
} else {
  console.log(`Could not match regex in som-operacao.$evento_id.tsx`);
}
