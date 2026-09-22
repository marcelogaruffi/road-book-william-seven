const fs = require('fs');

let content = fs.readFileSync('src/components/LogoPicker.tsx', 'utf8');

content = content.replace(
  '<button \n                        type="button" \n                        onClick={(e) => {',
  '<div \n                        role="button"\n                        onClick={(e) => {'
);
content = content.replace(
  '<X className="size-3" />\n                      </button>',
  '<X className="size-3" />\n                      </div>'
);

fs.writeFileSync('src/components/LogoPicker.tsx', content, 'utf8');
console.log('Fixed button nesting');
