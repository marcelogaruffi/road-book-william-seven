const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/route.tsx', 'utf8');

// Add FileAudio to imports
if (!code.includes('FileAudio')) {
  code = code.replace(/import {([^}]+)} from "lucide-react";/, 'import { $1, FileAudio } from "lucide-react";');
}
if (!code.includes('useLocation')) {
  code = code.replace(/import { createFileRoute, Link, Outlet, useNavigate }/, 'import { createFileRoute, Link, Outlet, useNavigate, useLocation }');
}

// Modify SLink definition to scroll into view
const oldSLinkDef = `const SLink = ({ to, icon: Icon, label, show=true }: any) => {
              if (!show) return null;
              return (
                <Link to={to} className={\`w-full flex items-center justify-start \${sidebarOpen ? 'px-4' : 'px-0 justify-center'} h-10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 text-sm font-medium rounded-xl transition-colors\`} activeProps={{ className: "bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:text-primary-foreground font-semibold" }}>
                  <Icon className={\`\${sidebarOpen ? 'mr-3' : ''} size-4 shrink-0\`} />
                  {sidebarOpen && <span className="truncate">{label}</span>}
                </Link>
              );
            };`;

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

code = code.replace(oldSLinkDef, newSLinkDef);

// Change Partituras e Músicas to Partituras and add Músicas
code = code.replace(
  /<SLink to="\/partituras" icon=\{Music\} label="Partituras e MÃºsicas" \/>/,
  `<SLink to="/partituras" icon={Music} label="Partituras" />
                  <SLink to="/musicas" icon={FileAudio} label="Músicas" />`
);

fs.writeFileSync('src/routes/_authenticated/route.tsx', code, 'utf8');
console.log('Fixed sidebar');
