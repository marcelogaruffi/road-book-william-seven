const fs = require('fs');

// 1. auth.tsx
let auth = fs.readFileSync('src/routes/auth.tsx', 'utf8');
auth = auth.replace(
    /<img src="\/logo-axis\.png" alt="[ÁA]xis"\s+className="h-28 mx-auto object-contain mb-4" \/>/,
    `<img src="/logo-axis.png" alt="Áxis" className="h-28 mx-auto object-contain mb-4 dark:hidden" />
              <img src="/logo-axis-dark.png" alt="Áxis" className="h-28 mx-auto object-contain mb-4 hidden dark:block" />`
);
fs.writeFileSync('src/routes/auth.tsx', auth, 'utf8');

// 2. _authenticated/sobre.tsx
let sobre = fs.readFileSync('src/routes/_authenticated/sobre.tsx', 'utf8');
sobre = sobre.replace(
    /<img src="\/logo-axis\.png" alt="Logo [ÁA]xis" className="h-20 object-contain drop-shadow-sm" \/>/,
    `<img src="/logo-axis.png" alt="Logo Áxis" className="h-20 object-contain drop-shadow-sm dark:hidden" />
                  <img src="/logo-axis-dark.png" alt="Logo Áxis" className="h-20 object-contain drop-shadow-sm hidden dark:block" />`
);
// Make sure the zoomed logo uses the dark version when clicked in dark mode?
// Actually, `onClick={() => setZoomedLogo("/logo-axis.png")}` can be changed to dynamically use the dark logo if possible, but let's just leave it simple for now or change it based on document.documentElement.classList.contains("dark"). Let's ignore it for now.
fs.writeFileSync('src/routes/_authenticated/sobre.tsx', sobre, 'utf8');

// 3. Footers in rb.$slug.tsx, turne.$slug.tsx, _authenticated/print.$slug.tsx
const footerFiles = [
    'src/routes/rb.$slug.tsx',
    'src/routes/turne.$slug.tsx',
    'src/routes/turne-completa.$slug.tsx',
    'src/routes/_authenticated/print.$slug.tsx'
];

for (let file of footerFiles) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        content = content.replace(
            /<img src="\/logo-axis-simples\.png" alt="[ÁA]xis" className="h-14 sm:h-16 object-contain opacity-90" \/>/,
            `<img src="/logo-axis-simples.png" alt="Áxis" className="h-14 sm:h-16 object-contain opacity-90 dark:hidden" />
              <img src="/logo-axis-simples-dark.png" alt="Áxis" className="h-14 sm:h-16 object-contain opacity-90 hidden dark:block" />`
        );
        fs.writeFileSync(file, content, 'utf8');
    }
}

console.log("Done");
