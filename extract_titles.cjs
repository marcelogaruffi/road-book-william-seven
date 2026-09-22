const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/routes/**/*.tsx');
files.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  // Match `head: () => ({ meta: [{ title: "..." }] })`
  const match = c.match(/meta:\s*\[\{\s*title:\s*['"`]([^'"`]+)['"`]/);
  if (match) {
    console.log(`- **${f.split('/').pop()}**: ${match[1]}`);
  }
});
