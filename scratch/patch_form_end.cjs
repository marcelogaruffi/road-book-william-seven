const fs = require('fs');
let content = fs.readFileSync('src/components/RoadbookForm.tsx', 'utf8');

const replacement = `      <LogoPicker 
        open={logoPicker.open} 
        onOpenChange={(v) => setLogoPicker(s => ({ ...s, open: v }))}
        onSelect={(url) => {
          if (logoPicker.field) {
            up(logoPicker.field, url);
          }
        }}
        uploadPath={\`\${d.id || 'draft'}/logos\`}
      />
    </form>`;

content = content.replace("    </form>", replacement);
fs.writeFileSync('src/components/RoadbookForm.tsx', content, 'utf8');
console.log('Patched form end');
