const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/route.tsx', 'utf8');

if (!code.includes('useLocation')) {
  code = code.replace(/import { createFileRoute, Link, Outlet, useNavigate }/, 'import { createFileRoute, Link, Outlet, useNavigate, useLocation }');
}
if (!code.includes('FileAudio')) {
  code = code.replace(/import {([^}]+)} from "lucide-react";/, 'import { $1, FileAudio } from "lucide-react";');
}

const oldSLinkDefRegex = /const SLink = \(\{ to, icon: Icon, label, show=true \}: any\) => \{[\s\S]*?return \([\s\S]*?<Link to=\{to\}[\s\S]*?<Icon className=\{`size-4 \$\{sidebarOpen \? 'mr-3' : ''\}`\} \/>\s*\{sidebarOpen && <span>\{label\}<\/span>\}\s*<\/Link>\s*\);\s*\};/;

const newSLinkDef = `const location = useLocation();
            const SLink = ({ to, icon: Icon, label, show=true }: any) => {
              if (!show) return null;
              const isActive = location.pathname.startsWith(to);
              return (
                <Link 
                  to={to} 
                  ref={el => { if (isActive && el) { setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100); } }}
                  className={\`w-full flex items-center justify-start \${sidebarOpen ? 'px-4' : 'px-0 justify-center'} h-10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 text-sm font-medium rounded-xl transition-colors\`} 
                  activeProps={{ className: "bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:text-primary-foreground font-semibold" }}
                >
                  <Icon className={\`\${sidebarOpen ? 'mr-3' : ''} size-4 shrink-0\`} />
                  {sidebarOpen && <span className="truncate">{label}</span>}
                </Link>
              );
            };`;

if (code.match(oldSLinkDefRegex)) {
  code = code.replace(oldSLinkDefRegex, newSLinkDef);
  console.log('Replaced SLink');
} else {
  console.log('Could not find SLink definition to replace');
}

// Change Partituras e Músicas to Partituras and add Músicas
if (code.includes('label="Partituras e Músicas"')) {
  code = code.replace(
    /<SLink to="\/partituras" icon=\{Music\} label="Partituras e Músicas" \/>/,
    `<SLink to="/partituras" icon={Music} label="Partituras" />\n                  <SLink to="/musicas" icon={FileAudio} label="Músicas" />`
  );
} else if (code.includes('label="Partituras e MÃºsicas"')) {
  code = code.replace(
    /<SLink to="\/partituras" icon=\{Music\} label="Partituras e MÃºsicas" \/>/,
    `<SLink to="/partituras" icon={Music} label="Partituras" />\n                  <SLink to="/musicas" icon={FileAudio} label="Músicas" />`
  );
}

fs.writeFileSync('src/routes/_authenticated/route.tsx', code, 'utf8');
