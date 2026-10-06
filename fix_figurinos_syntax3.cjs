const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/figurinos.index.tsx', 'utf8');

// Just look for the exact button tag and append } if it's missing
content = content.replace(
    /(\{activeTab === 'evento' && <button onClick=\{\(\) => setSelectedTipo\("conferencia"\)\}[^>]+>[\s\S]*?<\/button>)(?!\s*\})/g,
    `$1}`
);

fs.writeFileSync('src/routes/_authenticated/figurinos.index.tsx', content, 'utf8');
