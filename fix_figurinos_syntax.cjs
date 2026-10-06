const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/figurinos.index.tsx', 'utf8');

content = content.replace(
    /\{activeTab === 'evento' && <button onClick=\{\(\) => setSelectedTipo\("conferencia"\)\}[\s\S]*?<\/button>\s*\}\s*<\/div>/,
    `{activeTab === 'evento' && <button onClick={() => setSelectedTipo("conferencia")} className={\`flex items-center gap-2 whitespace-nowrap rounded-2xl px-6 py-3 transition-all font-semibold text-sm \${selectedTipo === "conferencia" ? "bg-white dark:bg-slate-200 text-primary dark:text-slate-900 shadow-md" : "text-slate-600 hover:text-slate-900"}\`}>\n            <CheckCircle2 className="size-5" /> Conferência\n          </button>}\n        </div>`
);

fs.writeFileSync('src/routes/_authenticated/figurinos.index.tsx', content, 'utf8');
