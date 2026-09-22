const fs = require('fs');
let content = fs.readFileSync('src/components/LogoPicker.tsx', 'utf8');

// Use regex to remove `if (!filter) return true;` from the beginning of the filter function
// and append it before the `toLowerCase` return statement.

content = content.replace(/if \(!filter\) return true;\s*/g, '');

content = content.replace(
  'return filename.toLowerCase().includes(filter.toLowerCase());',
  'if (!filter) return true;\n    return filename.toLowerCase().includes(filter.toLowerCase());'
);

fs.writeFileSync('src/components/LogoPicker.tsx', content, 'utf8');
