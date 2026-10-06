const fs = require('fs');

const files = [
  'som.$evento_id.tsx',
  'video.$evento_id.tsx',
  'iluminacao.$evento_id.tsx',
  'som-operacao.$evento_id.tsx'
];

for (const f of files) {
  let code = fs.readFileSync('src/routes/_authenticated/' + f, 'utf8');

  // We want to extract the header block:
  // <div className="flex items-center gap-4"> ... up to the closing </div> of that flex block.
  // We can locate it by finding <TabsContent value="evento" className="mt-0">
  // then <div className="max-w-4xl mx-auto space-y-6 pb-20">
  // then <div className="flex items-center gap-4">...
  // We'll move the <div className="flex items-center gap-4">...</div> block to ABOVE the <Tabs> tag.

  const tabsRegex = /(<Tabs defaultValue="evento" className="w-full px-2 md:px-6 py-6 max-w-6xl mx-auto">\s*<TabsList[\s\S]*?<TabsContent value="evento" className="mt-0">\s*<div className="max-w-4xl mx-auto space-y-6 pb-20">\s*)(<div className="flex items-center gap-4">[\s\S]*?<\/div>)\s*(<Card)/;
  
  if (tabsRegex.test(code)) {
    code = code.replace(tabsRegex, (match, prefix, header, suffix) => {
      // Put the header ABOVE the <Tabs>
      // The prefix has `<Tabs defaultValue="evento"...` at the start.
      // So we move header before the Tabs.
      // Wait, <Tabs> is the root of the return statement.
      // If we put something before it, we need a fragment!
      // `return ( <>\n ${header} \n <Tabs ...`
      const tabsPrefix = `<Tabs defaultValue="evento" className="w-full px-2 md:px-6 py-6 max-w-6xl mx-auto">`;
      const modifiedPrefix = prefix.replace(tabsPrefix, `\n      <div className="w-full px-2 md:px-6 max-w-6xl mx-auto mb-6 mt-4">\n        ${header}\n      </div>\n      ${tabsPrefix}`);
      return modifiedPrefix + suffix;
    });

    // We also need to add <Fragment> wrapper if it's not already wrapped.
    // Wait, the main return is:
    // return (
    //   <Tabs ...>
    // We can replace it with:
    // return (
    //   <>
    //     <div header>
    //     <Tabs ...>
    //   </>
    // )
    
    // Instead of parsing the whole tree to append </>, let's just use <div className="w-full"> to wrap everything!
    // No, <Tabs> is already wrapped?
    // Wait, let's look at `som.$evento_id.tsx`.
    // return (
    //   <Tabs ...>
    // ...
    //   </Tabs>
    // );
    
    // To make it valid JSX, we can wrap the whole return in <>...</>.
    code = code.replace(/return \(\s*<Tabs/, 'return (\n    <>\n      <Tabs');
    code = code.replace(/<\/Tabs>\s*\);\s*\}/, '</Tabs>\n    </>\n  );\n}');
    
    fs.writeFileSync('src/routes/_authenticated/' + f, code, 'utf8');
    console.log(`Updated layout for ${f}`);
  } else {
    console.log(`Could not match regex in ${f}`);
  }
}
