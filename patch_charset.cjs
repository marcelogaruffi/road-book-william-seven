const fs = require('fs');

let c = fs.readFileSync('src/routes/__root.tsx', 'utf8');

if (!c.includes('<meta charSet="utf-8" />')) {
    c = c.replace('<HeadContent />', '<meta charSet="utf-8" />\n        <HeadContent />');
    fs.writeFileSync('src/routes/__root.tsx', c, 'utf8');
    console.log("Added charSet");
}
