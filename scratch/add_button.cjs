const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/configuracoes.tsx', 'utf8');

const target = `<div className="space-y-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-3 pb-1">
            <Settings className="size-8 text-slate-500" />
            Configurações do Sistema
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Ajustes globais e regras de segurança da plataforma. (Acesso exclusivo para Administradores)
          </p>
        </div>`;

const newTarget = `<div className="space-y-8 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-3 pb-1">
              <Settings className="size-8 text-slate-500" />
              Configurações do Sistema
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
              Ajustes globais e regras de segurança da plataforma. (Acesso exclusivo para Administradores)
            </p>
          </div>
          <Button onClick={() => navigate({ to: "/admin-limpeza" })} className="bg-red-500 hover:bg-red-600 text-white rounded-xl h-12 px-6 shadow-md font-bold shrink-0">
            Ferramenta de Limpeza
          </Button>
        </div>`;

// Account for potential encoding differences (e.g., Ã§Ãµes instead of ções)
const regexTarget = /<div className="space-y-8 max-w-4xl mx-auto">[\s\S]*?<\/div>/;

content = content.replace(regexTarget, newTarget.replace(/Configurações/, 'ConfiguraÃ§Ãµes').replace(/segurança/, 'seguranÃ§a'));

fs.writeFileSync('src/routes/_authenticated/configuracoes.tsx', content, 'utf8');
