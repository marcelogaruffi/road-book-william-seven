const fs = require('fs');

let code = fs.readFileSync('src/routes/_authenticated/imprensa.tsx', 'utf8');

// Find the first and second occurrences
const parts = code.split('const exportClippingExcel = async () => {');
if (parts.length > 2) {
  // It appeared twice. We want to KEEP parts[0] and parts[1] (which contains the NEW logic), and remove the old one in parts[2].
  // But wait, where does the old one end? It ends before the return statement of the component.
  // The old one ended at `toast.dismiss();\n  };`
  const oldFunctionEndRegex = /toast\.dismiss\(\);\s*\};\s*/;
  parts[2] = parts[2].replace(/[\s\S]*?toast\.dismiss\(\);\s*\};\s*/, '');
  code = parts[0] + 'const exportClippingExcel = async () => {' + parts[1] + parts[2];
}

fs.writeFileSync('src/routes/_authenticated/imprensa.tsx', code, 'utf8');
