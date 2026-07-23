import re

with open('src/routes/_authenticated/route.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add useLocation import
content = content.replace(
    'import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";',
    'import { createFileRoute, Outlet, redirect, Link, useNavigate, useLocation } from "@tanstack/react-router";'
)

# 2. Add ClipboardList to lucide imports for Escalas icon
content = content.replace(
    'Wallet, UserPlus',
    'Wallet, UserPlus, ClipboardList'
)

# 3. Add getLinkClass and useLocation inside AuthenticatedLayout
if 'const location = useLocation();' not in content:
    layout_def = 'function AuthenticatedLayout() {\n  const { profile, isSimulating } = Route.useRouteContext();\n'
    new_layout_def = layout_def + '''  const location = useLocation();
  const getLinkClass = (path: string, exact: boolean = false) => {
    const isActive = exact ? location.pathname === path : location.pathname.startsWith(path);
    return `w-full justify-start ${sidebarOpen ? 'px-4' : 'px-0 justify-center'} h-12 transition-all duration-200 rounded-xl ${
      isActive
        ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20"
        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 font-medium"
    }`;
  };
'''
    content = content.replace(layout_def, new_layout_def)

# 4. Add the missing /escalas link under Gestao
financeiro_btn = '''            {(userRole === 'admin' || userRole === 'dev') && (
              <Button asChild variant="ghost" className={`w-full justify-start ${sidebarOpen ? 'px-4' : 'px-0 justify-center'} h-12 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 font-medium rounded-xl transition-colors`}>
                 <Link to="/financeiro">
                   <Wallet className={`size-5 ${sidebarOpen ? 'mr-3' : ''}`} />
                   {sidebarOpen && <span>Financeiro</span>}
                 </Link>
              </Button>
            )}'''
if 'to="/escalas"' not in content:
    escalas_btn = '''          {(userRole === 'admin' || userRole === 'dev' || userRole === 'produtor') && (
            <Button asChild variant="ghost" className={getLinkClass("/escalas", false)}>
               <Link to="/escalas">
                 <ClipboardList className={`size-5 ${sidebarOpen ? 'mr-3' : ''}`} />
                 {sidebarOpen && <span>Gestão de Escalas</span>}
               </Link>
            </Button>
          )}\n'''
    content = content.replace(financeiro_btn, escalas_btn + financeiro_btn)

# 5. Fix all existing Buttons in the sidebar to use getLinkClass
content = re.sub(
    r'<Button asChild variant="ghost" className={`w-full justify-start \${sidebarOpen \? \'px-4\' : \'px-0 justify-center\'} h-12[^`]+`}>\s*<Link to="([^"]+)"(?:\shash="([^"]+)")?>',
    lambda m: f'<Button asChild variant="ghost" className={{getLinkClass("{m.group(1)}", {"true" if m.group(1) == "/dashboard" and not m.group(2) else "false"})}}>\n             <Link to="{m.group(1)}"{f" hash=\\"{m.group(2)}\\"" if m.group(2) else ""}>',
    content
)

with open('src/routes/_authenticated/route.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('route.tsx patched successfully')
