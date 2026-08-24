const fs = require('fs');
const content = fs.readFileSync('src/routes/_authenticated/route.tsx', 'utf8');

const navStart = content.indexOf('<div className="flex-1 overflow-y-auto');
const navEnd = content.indexOf('{realProfile?.role === \'dev\' && (');

if (navStart === -1 || navEnd === -1) {
  console.log('Could not find markers');
  process.exit(1);
}

const navContent = content.substring(navStart, navEnd);

// We'll replace navContent with our new accordion structure.
// We need to define some helpers inside route.tsx. We can prepend them just before `export const Route`.
// Actually, easier to define them inside AuthedLayout or just use inline raw HTML/React.

let replaceContent = `
        <div className="flex-1 overflow-y-auto py-6 px-2 space-y-2" onClick={closeMobileMenu}>
          
          {/* HELPERS FOR SIDEBAR */}
          {(() => {
            const SLink = ({ to, icon: Icon, label, show=true }: any) => {
              if (!show) return null;
              return (
                <Link to={to} className={\`w-full flex items-center justify-start \${sidebarOpen ? 'px-4' : 'px-0 justify-center'} h-10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 text-sm font-medium rounded-xl transition-colors\`} activeProps={{ className: "bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:text-primary-foreground font-semibold" }}>
                  <Icon className={\`size-4 \${sidebarOpen ? 'mr-3' : ''}\`} />
                  {sidebarOpen && <span>{label}</span>}
                </Link>
              );
            };

            const SGroup = ({ title, icon: Icon, children, show=true }: any) => {
              if (!show) return null;
              if (!sidebarOpen) {
                return (
                  <div className="py-2 border-b border-slate-100 dark:border-white/5 last:border-0 flex flex-col items-center space-y-1">
                    <div className="mb-2 text-slate-300 dark:text-slate-600"><Icon className="size-5" /></div>
                    {children}
                  </div>
                );
              }
              return (
                <details className="group [&_summary::-webkit-details-marker]:hidden" open>
                  <summary className="flex cursor-pointer items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 select-none">
                    <div className="flex items-center gap-2">
                      <Icon className="size-4" /> {title}
                    </div>
                    <ChevronRight className="size-4 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="mt-1 space-y-1 ml-2">
                    {children}
                  </div>
                </details>
              );
            };

            const isProdutor = userRole === 'admin' || userRole === 'dev' || userRole === 'produtor';

            return (
              <>
                <SGroup title="Meu Espaço" icon={Contact2}>
                  <SLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                  <SLink to="/perfil" icon={UserPlus} label="Dados Cadastrais" />
                  <SLink to="/minhas-escalas" icon={Calendar} label="Minhas Escalas" />
                  <SLink to="/meus-pagamentos" icon={Wallet} label="Meus Pagamentos" />
                </SGroup>

                <SGroup title="Produção" icon={ClipboardList}>
                  <SLink to="/eventos" icon={Calendar} label="Eventos e Shows" />
                  <SLink to="/viagens" icon={Bus} label="Guias de Viagem & Malas" />
                  <SLink to="/tour.new" icon={RouteIcon} label="Nova Turnê" show={isProdutor} />
                </SGroup>

                <SGroup title="Equipe" icon={Users}>
                  <SLink to="/contatos" icon={Contact2} label="Contatos da Equipe" />
                  <SLink to="/dados-equipe" icon={Users} label="Dados da Equipe" />
                </SGroup>

                <SGroup title="Artístico" icon={Drama}>
                  <SLink to="/partituras" icon={Music} label="Partituras e Músicas" />
                </SGroup>

                <SGroup title="Bastidores" icon={DoorOpen}>
                  <SLink to="/palco" icon={StageIcon} label="Montagem de Palco" />
                  <SLink to="/figurinos" icon={ClothesRackIcon} label="Figurinos" />
                  <SLink to="/camarins" icon={StarDoorIcon} label="Camarins" />
                </SGroup>

                <SGroup title="Técnica" icon={Settings}>
                  <SLink to="/iluminacao" icon={Lightbulb} label="Iluminação" />
                  <SLink to="/som" icon={Mic2} label="Áudio / Som" />
                  <SLink to="/video" icon={Video} label="Vídeo" />
                </SGroup>

                <SGroup title="Comunicação e Mídia" icon={Smartphone}>
                  <SLink to="/imprensa" icon={Newspaper} label="Imprensa" show={isProdutor || userRole === 'assessoria_imprensa'} />
                  <SLink to="/midias" icon={Smartphone} label="Mídias Sociais" show={isProdutor || userRole === 'midias_sociais'} />
                </SGroup>

                <SGroup title="Controles e Gestão" icon={Banknote}>
                  <SLink to="/publico" icon={Users} label="Público" show={isProdutor} />
                  <SLink to="/financeiro" icon={Wallet} label="Financeiro" show={userRole === 'admin' || userRole === 'dev'} />
                  <SLink to="/vendas" icon={ShoppingCart} label="Controle de Vendas" show={isProdutor} />
                  <SLink to="/escalas" icon={Users} label="Painel de Escalas" show={isProdutor} />
                  <SLink to="/checklist" icon={CheckSquare} label="Prancheta Produtor" show={isProdutor} />
                </SGroup>

                <SGroup title="Administração" icon={Settings} show={userRole === 'admin' || userRole === 'dev'}>
                  <SLink to="/espetaculos" icon={Music} label="Cadastro de Shows" />
                  <SLink to="/cadastros" icon={UserPlus} label="Cadastros de Equipe" />
                  <SLink to="/configuracoes" icon={Settings} label="Configurações" />
                </SGroup>
              </>
            );
          })()}
        </div>
        `;

const newContent = content.substring(0, navStart) + replaceContent + content.substring(navEnd);
fs.writeFileSync('src/routes/_authenticated/route.tsx', newContent);
console.log('Sidebar updated');
