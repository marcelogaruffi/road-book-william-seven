const fs = require('fs');
let content = fs.readFileSync('src/components/LogoPicker.tsx', 'utf8');

const oldFilter = `  const filteredLogos = logos.filter(url => {
    if (!filter) return true;
    const parts = url.split('/');
    const rawName = parts[parts.length - 1] || "";
    let filename = rawName;
    try { filename = decodeURIComponent(rawName); } catch(e) {}
    const visualName = filename.split('-').length > 1 ? filename.split('-').slice(1).join('-') : filename;
    if (hiddenLogos.includes(visualName)) return false;
    return filename.toLowerCase().includes(filter.toLowerCase());
  });`;

const newFilter = `  const filteredLogos = logos.filter(url => {
    const parts = url.split('/');
    const rawName = parts[parts.length - 1] || "";
    let filename = rawName;
    try { filename = decodeURIComponent(rawName); } catch(e) {}
    const visualName = filename.split('-').length > 1 ? filename.split('-').slice(1).join('-') : filename;
    
    if (hiddenLogos.includes(visualName)) return false;
    
    if (!filter) return true;
    return filename.toLowerCase().includes(filter.toLowerCase());
  });`;

content = content.replace(oldFilter, newFilter);

fs.writeFileSync('src/components/LogoPicker.tsx', content, 'utf8');
console.log('Fixed filter logic');
