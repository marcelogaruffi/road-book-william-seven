const fs = require('fs');

const f = 'malas.$evento_id.tsx';
const marker = '<div className="flex items-center justify-between mb-4">';

let code = fs.readFileSync('src/routes/_authenticated/' + f, 'utf8');

const startIndex = code.indexOf(marker);
if (startIndex !== -1) {
  let depth = 0;
  let endIndex = -1;
  
  for (let i = startIndex; i < code.length; i++) {
    if (code.startsWith('<div', i)) {
      depth++;
    } else if (code.startsWith('</div', i)) {
      depth--;
      if (depth === 0) {
        endIndex = i + 6; 
        break;
      }
    }
  }

  if (endIndex !== -1) {
    const headerBlock = code.substring(startIndex, endIndex);
    code = code.substring(0, startIndex) + code.substring(endIndex);
    
    const tabsMarker = '<Tabs defaultValue="checklist"';
    const tabsIndex = code.indexOf(tabsMarker);
    
    if (tabsIndex !== -1) {
      const beforeTabs = code.substring(0, tabsIndex);
      const afterTabs = code.substring(tabsIndex);
      
      const wrapperDiv = `\n      <div className="w-full px-2 md:px-6 max-w-4xl mx-auto mb-6 mt-4">\n        ${headerBlock}\n      </div>\n      `;
      
      code = beforeTabs + wrapperDiv + afterTabs;
      
      if (!code.includes('return (\n    <>')) {
        code = code.replace(/return \(\s*(?=<div|<Tabs)/, 'return (\n    <>\n      ');
        code = code.replace(/<\/Tabs>\s*\);\s*\}/, '</Tabs>\n    </>\n  );\n}');
      }
      
      fs.writeFileSync('src/routes/_authenticated/' + f, code, 'utf8');
      console.log('Fixed header in malas');
    }
  }
}
