const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/palco.index.tsx', 'utf8');

// The buttons are rendered inside:
// <button onClick={() => setSelectedTipo("conferencia")} ...>
// <button onClick={() => setSelectedTipo("infra")} ...>

const oldConferencia = `<button onClick={() => setSelectedTipo("conferencia")} className={\`flex items-center gap-2 whitespace-nowrap rounded-2xl px-6 py-3 transition-all font-semibold text-sm \${selectedTipo === "conferencia" ? "bg-white dark:bg-slate-200 text-primary dark:text-slate-900 shadow-md" : "text-slate-600 hover:text-slate-900"}\`}>
            <CheckCircle2 className="size-5" /> Conferência (Props)
          </button>`;

const oldInfra = `<button onClick={() => setSelectedTipo("infra")} className={\`flex items-center gap-2 whitespace-nowrap rounded-2xl px-6 py-3 transition-all font-semibold text-sm \${selectedTipo === "infra" ? "bg-white dark:bg-slate-200 text-primary dark:text-slate-900 shadow-md" : "text-slate-600 hover:text-slate-900"}\`}>
            <Wrench className="size-5" /> Infraestrutura do Local
          </button>`;

const newButtons = `{activeTab === 'evento' && (
            <>
              <button onClick={() => setSelectedTipo("conferencia")} className={\`flex items-center gap-2 whitespace-nowrap rounded-2xl px-6 py-3 transition-all font-semibold text-sm \${selectedTipo === "conferencia" ? "bg-white dark:bg-slate-200 text-primary dark:text-slate-900 shadow-md" : "text-slate-600 hover:text-slate-900"}\`}>
                <CheckCircle2 className="size-5" /> Conferência (Props)
              </button>
              <button onClick={() => setSelectedTipo("infra")} className={\`flex items-center gap-2 whitespace-nowrap rounded-2xl px-6 py-3 transition-all font-semibold text-sm \${selectedTipo === "infra" ? "bg-white dark:bg-slate-200 text-primary dark:text-slate-900 shadow-md" : "text-slate-600 hover:text-slate-900"}\`}>
                <Wrench className="size-5" /> Infraestrutura do Local
              </button>
            </>
          )}`;

content = content.replace(oldConferencia + '\n          ' + oldInfra, newButtons);

// Make sure to replace just in case the space mapping is off:
if (!content.includes("{activeTab === 'evento' && (")) {
    content = content.replace(
        /<button onClick=\{\(\) => setSelectedTipo\("conferencia"\)\}[\s\S]*?<\/button>/,
        "{activeTab === 'evento' && <button onClick={() => setSelectedTipo(\"conferencia\")} className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-6 py-3 transition-all font-semibold text-sm ${selectedTipo === \"conferencia\" ? \"bg-white dark:bg-slate-200 text-primary dark:text-slate-900 shadow-md\" : \"text-slate-600 hover:text-slate-900\"}`}>\n            <CheckCircle2 className=\"size-5\" /> Conferência (Props)\n          </button>}"
    );
    content = content.replace(
        /<button onClick=\{\(\) => setSelectedTipo\("infra"\)\}[\s\S]*?<\/button>/,
        "{activeTab === 'evento' && <button onClick={() => setSelectedTipo(\"infra\")} className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-6 py-3 transition-all font-semibold text-sm ${selectedTipo === \"infra\" ? \"bg-white dark:bg-slate-200 text-primary dark:text-slate-900 shadow-md\" : \"text-slate-600 hover:text-slate-900\"}`}>\n            <Wrench className=\"size-5\" /> Infraestrutura do Local\n          </button>}"
    );
}

fs.writeFileSync('src/routes/_authenticated/palco.index.tsx', content, 'utf8');
