const fs = require('fs');

let content = fs.readFileSync('src/routes/_authenticated/rooming-list.tsx', 'utf8');

// replace <Card> with the fancy card
content = content.replace(
    '<Card>', 
    '<Card className="border-0 shadow-[0_4px_25px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white dark:bg-card/40 dark:backdrop-blur-xl dark:border dark:border-white/10 rounded-[2rem] overflow-hidden relative">'
);

// replace <CardHeader className="..."> with the fancy header
content = content.replace(
    '<CardHeader className="bg-slate-50 border-b flex flex-col sm:flex-row justify-between gap-4 items-center">',
    '<CardHeader className="relative z-10 border-b border-slate-100 dark:border-white/5 pb-5 flex flex-col sm:flex-row justify-between gap-4 items-center bg-slate-50/50">'
);

fs.writeFileSync('src/routes/_authenticated/rooming-list.tsx', content, 'utf8');
