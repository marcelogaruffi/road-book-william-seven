const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/route.tsx', 'utf8');

const newGroups = `                <SGroup title="Meu Espaço" icon={Contact2}>
                  <SLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                  <SLink to="/perfil" icon={UserPlus} label="Dados Cadastrais" />
                  <SLink to="/minhas-escalas" icon={Calendar} label="Minhas Escalas" />
                  <SLink to="/meus-pagamentos" icon={Wallet} label="Meus Pagamentos" />
                </SGroup>

                <SGroup title="Gestão e Logística" icon={Bus}>
                  <SLink to="/eventos" icon={Calendar} label="Eventos e Espetáculos" />
                  <SLink to="/viagens" icon={Bus} label="Guias de Viagem" />
                  <SLink to="/tour" icon={RouteIcon} label="Turnês" show={isProdutor} />
                  <SLink to="/malas" icon={Luggage} label="Malas e Cases" />
                  <SLink to="/escalas" icon={Users} label="Painel de Escalas" show={isProdutor} />
                  <SLink to="/rooming-list" icon={DoorOpen} label="Rooming List (Hotéis)" show={isProdutor} />
                </SGroup>

                <SGroup title="Backstage" icon={DoorOpen}>
                  <SLink to="/camarins" icon={StarDoorIcon} label="Camarins" />
                  <SLink to="/catering" icon={Coffee} label="Catering" />
                  <SLink to="/figurinos" icon={ClothesRackIcon} label="Figurinos" />
                </SGroup>

                <SGroup title="Técnica e Artístico" icon={Drama}>
                  <SLink to="/palco" icon={StageIcon} label="Montagem de Palco" />
                  <SLink to="/musicas" icon={FileAudio} label="Músicas" />
                  <SLink to="/partituras" icon={Music} label="Partituras" />
                  <SLink to="/iluminacao" icon={Lightbulb} label="Iluminação" />
                  <SLink to="/som" icon={Mic2} label="Áudio / Som" />
                  <SLink to="/som-operacao" icon={Play} label="Operação de Som" />
                  <SLink to="/video" icon={Video} label="Vídeo" />
                </SGroup>

                <SGroup title="Produção Executiva" icon={ClipboardList}>
                  <SLink to="/checklist" icon={CheckSquare} label="Prancheta Produtor" show={isProdutor} />
                  <SLink to="/espetaculos" icon={Music} label="Cadastro de Espetáculo" />
                  <SLink to="/financeiro" icon={Wallet} label="Financeiro" show={userRole === 'admin' || userRole === 'dev'} />
                  <SLink to="/vendas" icon={ShoppingCart} label="Controle de Vendas" show={isProdutor} />
                  <SLink to="/emissao-relatorios" icon={File} label="Emissão de Relatórios" show={isProdutor} />
                  <SLink to="/fornecedores" icon={Contact2} label="Diretório de Fornecedores" show={isProdutor} />
                </SGroup>

                <SGroup title="Comunicação e Mídia" icon={Smartphone}>
                  <SLink to="/imprensa" icon={Newspaper} label="Imprensa" show={isProdutor || userRole === 'assessoria_imprensa'} />
                  <SLink to="/fotos" icon={ImageIcon} label="Fotos" show={isProdutor || userRole === 'midias_sociais'} />
                  <SLink to="/midias" icon={Smartphone} label="Mídias Sociais" show={isProdutor || userRole === 'midias_sociais'} />
                  <SLink to="/divulgacoes" icon={Megaphone} label="Divulgações Redes Sociais" show={isProdutor || userRole === 'midias_sociais'} />
                  <SLink to="/publico" icon={Users} label="Público" show={isProdutor} />
                </SGroup>

                <SGroup title="Equipe e RH" icon={Users}>
                  <SLink to="/contatos" icon={Contact2} label="Contatos da Equipe" />
                  <SLink to="/dados-equipe" icon={Users} label="Dados da Equipe" />
                  <SLink to="/cadastros" icon={UserPlus} label="Cadastros de Equipe" />
                </SGroup>

                <SGroup title="Administração" icon={Settings} show={userRole === 'admin' || userRole === 'dev'}>
                  <SLink to="/contratos" icon={File} label="Contratos e Documentos" />
                  <SLink to="/configuracoes" icon={Settings} label="Configurações" />
                  <SLink to="/sobre" icon={Settings} label="Sobre o Sistema" />
                </SGroup>`;

// Replace from <SGroup title="Meu Espaço" to the end of the groups
const startIdx = content.indexOf('<SGroup title="Meu Espa');
const endIdx = content.indexOf('</SGroup>', content.lastIndexOf('<SGroup title="Administra')) + 9;

if (startIdx !== -1 && endIdx !== -1) {
    content = content.substring(0, startIdx) + newGroups + content.substring(endIdx);
    fs.writeFileSync('src/routes/_authenticated/route.tsx', content, 'utf8');
    console.log("Success");
} else {
    console.log("Could not find bounds");
}
