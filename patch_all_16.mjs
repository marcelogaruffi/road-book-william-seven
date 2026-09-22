import fs from 'fs';

let content = fs.readFileSync('src/components/RoadbookForm.tsx', 'utf-8');

// 1. Add `const up` back!
content = content.replace(
  'const [saving, setSaving] = useState(false);',
  'const [saving, setSaving] = useState(false);\n    const up = (key: keyof RoadbookData, val: any) => setD((s) => ({ ...s, [key]: val }));'
);

// 2. Remove the ENTIRE `Visual e Compartilhamento` card!
const visualCardRegex = /<div className="mt-6">\s*<Card className="rounded-2xl border-slate-200\/60 dark:border-white\/10 dark:bg-card\/40 backdrop-blur-xl \nshadow-lg">.*?Visual e Compartilhamento.*?<\/Card>\s*<\/div>/s;

// Since there is a newline in the classname in my output, let's just make a more robust regex:
const visualCardRegexRobust = /<div className="mt-6">\s*<Card[^>]*>.*?Visual e Compartilhamento.*?<\/Card>\s*<\/div>/s;
content = content.replace(visualCardRegexRobust, '');

fs.writeFileSync('src/components/RoadbookForm.tsx', content);
console.log("Done");
