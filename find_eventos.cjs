const fs = require('fs');
const dir = 'src/routes/_authenticated';
fs.readdirSync(dir).forEach(f => {
  if (f.endsWith('.tsx')) {
    const c = fs.readFileSync(dir + '/' + f, 'utf-8');
    if (c.includes('from("eventos")') || c.includes("from('eventos')")) {
      console.log(f);
    }
  }
});
