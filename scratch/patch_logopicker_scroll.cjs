const fs = require('fs');

let content = fs.readFileSync('src/components/LogoPicker.tsx', 'utf8');

// 1. Fix deduplication
const oldDedup = `      setLogos(Array.from(urls).filter(Boolean));`;
const newDedup = `      const uniqueMap = new Map<string, string>();
      for (const url of Array.from(urls).filter(Boolean)) {
        const parts = url.split('/');
        let raw = parts[parts.length - 1] || "";
        try { raw = decodeURIComponent(raw); } catch(e) {}
        const nameParts = raw.split('-');
        const visualName = nameParts.length > 1 ? nameParts.slice(1).join('-') : raw;
        uniqueMap.set(visualName, url);
      }
      setLogos(Array.from(uniqueMap.values()));`;

content = content.replace(oldDedup, newDedup);

// 2. Fix the ScrollArea height and clipping
content = content.replace(
  '<ScrollArea className="flex-1 -mx-6 px-6">',
  '<ScrollArea className="h-[55vh] min-h-[300px] mt-2 border-t pt-4 -mx-6 px-6">'
);

// 3. Ensure the text spans don't get cut at the bottom (add pb-2 inside the button)
content = content.replace(
  'className="group flex flex-col items-center gap-2 focus:outline-none"',
  'className="group flex flex-col items-center gap-2 pb-2 focus:outline-none"'
);

fs.writeFileSync('src/components/LogoPicker.tsx', content, 'utf8');
console.log('Patched LogoPicker.tsx');
