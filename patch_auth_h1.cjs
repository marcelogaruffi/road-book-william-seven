const fs = require('fs');
let content = fs.readFileSync('src/routes/auth.tsx', 'utf8');

// Replace the <h1> element that contains Áxis (or anything with text-2xl sm:text-3xl font-black)
// Since it's multiline, we can use regex or just replace the exact line if we can match it.
content = content.replace(/<h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800 dark:text-white">.*?<\/h1>/s, '');

// Increase logo size since there's no title now
content = content.replace(/className="h-20 mx-auto object-contain mb-4"/, 'className="h-28 mx-auto object-contain mb-4"');

fs.writeFileSync('src/routes/auth.tsx', content, 'utf8');
