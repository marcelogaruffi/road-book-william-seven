const fs = require('fs');

const files = [
  { f: 'som.$evento_id.tsx', marker: '<div className="flex items-center gap-4">' },
  { f: 'video.$evento_id.tsx', marker: '<div className="flex items-center gap-4">' },
  { f: 'iluminacao.$evento_id.tsx', marker: '<div className="flex items-center gap-4">' },
  { f: 'som-operacao.$evento_id.tsx', marker: '<div className="flex items-center justify-between">' },
  { f: 'malas.$evento_id.tsx', marker: '<div className="flex items-center justify-between mb-4">' }
];

for (const {f, marker} of files) {
  let code = fs.readFileSync('src/routes/_authenticated/' + f, 'utf8');
  
  const startIndex = code.indexOf(marker);
  if (startIndex === -1) {
    console.log('Marker not found in ' + f);
    continue;
  }

  // Count divs to find the matching closing div
  let depth = 0;
  let endIndex = -1;
  
  // Start searching just after the <div...
  for (let i = startIndex; i < code.length; i++) {
    if (code.startsWith('<div', i)) {
      depth++;
    } else if (code.startsWith('</div', i)) {
      depth--;
      if (depth === 0) {
        endIndex = i + 6; // length of </div>
        break;
      }
    }
  }

  if (endIndex !== -1) {
    const headerBlock = code.substring(startIndex, endIndex);
    
    // Remove it from its original place
    code = code.substring(0, startIndex) + code.substring(endIndex);
    
    // Now find the <Tabs tag and inject it BEFORE <Tabs
    const tabsMarker = '<Tabs defaultValue="evento"';
    const tabsIndex = code.indexOf(tabsMarker);
    
    if (tabsIndex !== -1) {
      // Find the start of the line where <Tabs is
      const beforeTabs = code.substring(0, tabsIndex);
      const afterTabs = code.substring(tabsIndex);
      
      const wrapperDiv = `\n      <div className="w-full px-2 md:px-6 max-w-6xl mx-auto mb-6 mt-4">\n        ${headerBlock}\n      </div>\n      `;
      
      code = beforeTabs + wrapperDiv + afterTabs;
      
      // Now ensure the main return is wrapped in <> ... </>
      // We look for `return (\n` and change to `return (\n    <>\n`
      if (!code.includes('return (\n    <>')) {
        code = code.replace(/return \(\s*(?=<div|<Tabs)/, 'return (\n    <>\n      ');
        code = code.replace(/<\/Tabs>\s*\);\s*\}/, '</Tabs>\n    </>\n  );\n}');
      }
      
      fs.writeFileSync('src/routes/_authenticated/' + f, code, 'utf8');
      console.log('Fixed header in ' + f);
    } else {
      console.log('Could not find <Tabs in ' + f);
    }
  } else {
    console.log('Could not find matching div in ' + f);
  }
}
