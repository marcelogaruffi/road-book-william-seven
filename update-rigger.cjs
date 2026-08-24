const fs = require('fs');
const glob = require('glob');
const files = glob.sync('src/**/*.{ts,tsx}');
let count = 0;
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  if (content.includes('midias_sociais";')) {
    content = content.replace('midias_sociais";', 'midias_sociais" | "rigger";');
    changed = true;
  }
  
  if (content.includes("'cenotecnico', 'tecnico_video']")) {
    content = content.replaceAll("'cenotecnico', 'tecnico_video']", "'cenotecnico', 'tecnico_video', 'rigger']");
    changed = true;
  }

  // cadatros.tsx inviteRole state
  if (content.includes("'tecnico_video'>('produtor');")) {
    content = content.replace("'tecnico_video'>('produtor');", "'tecnico_video'|'rigger'>('produtor');");
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    count++;
    console.log('Updated', file);
  }
}
console.log(count, 'files updated');
