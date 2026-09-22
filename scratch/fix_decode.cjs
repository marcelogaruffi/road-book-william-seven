const fs = require('fs');
let content = fs.readFileSync('src/components/LogoPicker.tsx', 'utf8');

content = content.replace(/try \{ raw = \(function\(s\)\{try\{return decodeURIComponent\(s\);\}catch\(e\)\{return s;\}\}\)\(\); \} catch\(e\) \{\}/g, 
  'try { raw = decodeURIComponent(raw); } catch(e) {}');

content = content.replace(/const filename = \(function\(s\)\{try\{return decodeURIComponent\(s\);\}catch\(e\)\{return s;\}\}\)\(\);/g, 
  'const rawName = parts[parts.length - 1] || "";\n    let filename = rawName;\n    try { filename = decodeURIComponent(rawName); } catch(e) {}');

fs.writeFileSync('src/components/LogoPicker.tsx', content, 'utf8');
