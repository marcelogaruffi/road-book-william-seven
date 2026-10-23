import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Route as AuthedRoute } from "./route";
import { 
  HelpCircle, Sparkles, BookOpen, Search, Users, Bus, Theater, 
  Mic2, Lightbulb, Video, Luggage, Wallet, FileText, ChevronRight, 
  ExternalLink, CheckCircle2, MessageSquare, Play, Coffee, ShieldCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/ajuda")({
  head: () => ({ meta: [{ title: "Central de Ajuda e Tutoriais - Áxis" }] }),
  component: AjudaPage,
});

interface ManualItem {
  id: string;
  title: string;
  category: "geral" | "elenco" | "tecnica" | "backstage" | "motorista" | "producao";
  roles?: string[];
  icon: any;
  summary: string;
  steps: string[];
  link?: string;
}

const MANUAIS: ManualItem[] = [
  // 1. GERAL (TODOS)
  {
    id: "perfil-pix",
    title: "Como cadastrar CPF e Chave Pix",
    category: "geral",
    icon: Wallet,
    summary: "Seus dados bancários e documento são indispensáveis para a emissão de escalas, contratos digitais e pagamento pontual de cachês.",
    steps: [
      "No menu lateral, vá em 'Meu Espaço' e clique em 'Dados Cadastrais'.",
      "Confira e preencha seu CPF, RG, Nome Completo e Órgão Emissor.",
      "No campo 'Chave Pix', insira sua chave atualizada e selecione o tipo correspondente (CPF, Celular, E-mail ou Aleatória).",
      "Clique no botão 'Salvar Alterações' no final do formulário."
    ],
    link: "/perfil"
  },
  {
    id: "guia-viagem-consulta",
    title: "Como consultar seu Guia de Viagem",
    category: "geral",
    icon: Bus,
    summary: "Os Guias de Viagem contêm tudo o que você precisa: horários de voo, ônibus, hotel, camarim e rotas diretas.",
    steps: [
      "Acesse 'Viagens e Logística' > 'Guias de Viagem' ou clique diretamente nos eventos na sua Visão Geral.",
      "Ao abrir o guia, você verá a previsão do tempo, cronograma hora a hora e botões com links rápidos para o Waze e Google Maps.",
      "Você pode verificar a aba 'Hotéis' para ver a lista de quartos e 'Documentos' para baixar anexos da produção."
    ],
    link: "/viagens"
  },
  {
    id: "notificacoes-sistema",
    title: "Central de Notificações e Avisos",
    category: "geral",
    icon: MessageSquare,
    summary: "Fique por dentro das confirmações de escalas, novos contratos gerados e recados urgentes da turnê.",
    steps: [
      "Clique no sininho no topo do menu lateral para ver os alertas recentes.",
      "Avisos de alterações de roteiro ou chamadas de ensaio chegam em tempo real.",
      "Você também pode conferir sua 'Minha Agenda' para ver os compromissos mês a mês."
    ],
    link: "/notificacoes"
  },

  // 2. ELENCO & MÚSICOS
  {
    id: "escalas-elenco",
    title: "Como confirmar e visualizar suas Escalas",
    category: "elenco",
    roles: ["elenco", "musico", "standby"],
    icon: Users,
    summary: "Saiba com antecedência em quais apresentações e ensaios você está escalado como titular ou standby.",
    steps: [
      "Acesse 'Meu Espaço' > 'Minhas Escalas'.",
      "Visualize suas datas confirmadas, horários de passagem e figurinos designados.",
      "Caso haja confirmação pendente, clique em 'Confirmar Presença' para liberar a emissão do cachê."
    ],
    link: "/minhas-escalas"
  },
  {
    id: "figurinos-elenco",
    title: "Conferência de Figurinos e Ajustes",
    category: "elenco",
    roles: ["elenco", "musico"],
    icon: Theater,
    summary: "Acompanhe os códigos das peças, cabides e medidas registradas com o camareiro.",
    steps: [
      "Acesse 'Backstage' > 'Meus Figurinos'.",
      "Confira a foto das peças e as orientações de conservação e lavagem.",
      "Qualquer reparo emergencial pode ser solicitado diretamente à equipe de figurino no teatro."
    ],
    link: "/meus-figurinos"
  },

  // 3. TÉCNICA (SOM, LUZ, VÍDEO, PALCO)
  {
    id: "tecnica-riders",
    title: "Consultar Rider Técnico e Mapa de Palco",
    category: "tecnica",
    roles: ["admin", "dev", "produtor", "tecnico_som", "iluminador", "tecnico_video", "cenotecnico", "roadie", "stage_manager"],
    icon: Mic2,
    summary: "Acesse mapas de canal, microfonação, iluminação e posicionamento de projetores.",
    steps: [
      "No menu 'Técnica e Artístico', selecione a especialidade desejada (Áudio/Som, Iluminação, Vídeo ou Palco).",
      "Consulte os arquivos de patch list, mapa de luz e especificações de voltagem do teatro.",
      "Utilize a 'Operação de Som' durante a apresentação para check-lists de microfones em tempo real."
    ],
    link: "/som"
  },

  // 4. BACKSTAGE & LOGÍSTICA
  {
    id: "camarins-catering",
    title: "Organização de Camarins, Malas e Catering",
    category: "backstage",
    roles: ["admin", "dev", "produtor", "camareiro", "assistente_producao"],
    icon: Coffee,
    summary: "Controle de distribuição de quartos de camarim, alimentação e pesagem de malas da companhia.",
    steps: [
      "Acesse 'Backstage' > 'Camarins' para definir portas e distribuição de atores.",
      "Em 'Catering', confira horários de café, lanche pós-passagem e restrições alimentares da equipe.",
      "Em 'Malas e Cases', confira etiquetas e pesos para transporte rodoviário ou aéreo."
    ],
    link: "/camarins"
  },

  // 5. MOTORISTA
  {
    id: "motorista-visao",
    title: "Acesso Rápido para Motoristas e Vans",
    category: "motorista",
    roles: ["admin", "dev", "produtor", "motorista"],
    icon: Bus,
    summary: "Tela limpa focada exclusivamente em pontos de embarque, hotel, teatro e navegação Waze/Google Maps.",
    steps: [
      "Acesse o roteiro pelo link simplificado na sua Visão Geral.",
      "Clique nos botões azuis 'Abrir no Waze' ou 'Abrir no Google Maps' para iniciar o GPS imediatamente.",
      "Consulte horários exatos de saída do saguão do hotel e retorno após a desmontagem."
    ],
    link: "/viagens"
  },

  // 6. PRODUÇÃO EXECUTIVA & ADMIN
  {
    id: "producao-maestro",
    title: "Maestro de Produção: Criação de Turnês e Eventos",
    category: "producao",
    roles: ["admin", "dev", "produtor"],
    icon: Sparkles,
    summary: "Guia completo para cadastrar novas praças, emitir contratos em lote e gerar relatórios financeiros.",
    steps: [
      "Vá em 'Produção Executiva' > 'Maestro de Produção' para criar um novo espetáculo ou turnê inteira com 1 clique.",
      "Em 'Gestão de Contratos', utilize os modelos automáticos pré-preenchidos com os dados de CPF/Pix dos cadastrados.",
      "Em 'Painel de Escalas', distribua funções e envie lembretes por SMS e E-mail aos escalados."
    ],
    link: "/novo-projeto"
  }
];

function AjudaPage() {
  const { profile } = AuthedRoute.useRouteContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("todos");

  const userRole = profile?.role || "elenco";

  const handleRestartTour = () => {
    localStorage.removeItem("axis_tutorial_completed");
    navigate({ to: "/dashboard" }).then(() => {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("start-axis-tutorial"));
      }, 300);
    });
  };

  const filteredManuais = useMemo(() => {
    return MANUAIS.filter((item) => {
      // Filter by search query
      const matchSearch =
        search.trim() === "" ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.summary.toLowerCase().includes(search.toLowerCase()) ||
        item.steps.some((s) => s.toLowerCase().includes(search.toLowerCase()));

      if (!matchSearch) return false;

      // Filter by Tab
      if (activeTab === "todos") return true;
      if (activeTab === item.category) return true;
      if (activeTab === "recomendados") {
        if (!item.roles) return true;
        return item.roles.includes(userRole);
      }

      return false;
    });
  }, [search, activeTab, userRole]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      
      {/* HERO BANNER: CENTRAL DE AJUDA & REFAZER TOUR */}
      <div className="relative overflow-hidden rounded-[2.5rem] p-8 sm:p-10 text-white shadow-xl bg-gradient-to-br from-sky-600 via-indigo-600 to-purple-700">
        <div className="absolute top-0 right-0 p-8 opacity-15 transform translate-x-4 -translate-y-4">
          <HelpCircle className="size-64" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-4">
          <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md px-3.5 py-1 text-xs uppercase tracking-wider font-bold">
            Suporte e Conhecimento
          </Badge>
          
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Central de Ajuda & Tutoriais
          </h1>
          
          <p className="text-white/90 text-base sm:text-lg font-medium leading-relaxed">
            Consulte manuais passo a passo adaptados para sua função ou reinicie o tour interativo a qualquer momento para explorar a interface.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button 
              onClick={handleRestartTour}
              className="bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-bold px-6 shadow-lg shadow-black/10 gap-2 h-11"
            >
              <Play className="size-4 text-sky-600 fill-sky-600" />
              Refazer Tour Interativo
            </Button>
            
            <Button 
              asChild
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl font-bold px-5 backdrop-blur-sm h-11"
            >
              <a href="/sobre">
                Sobre o Sistema <ExternalLink className="size-3.5 ml-1.5 opacity-70" />
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
        <Input 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Busque por dúvida, recurso (ex: pix, escalas, waze, hotel)..."
          className="h-12 pl-12 pr-4 rounded-2xl bg-white dark:bg-card border-slate-200 dark:border-white/10 shadow-sm text-sm"
        />
        {search && (
          <button 
            onClick={() => setSearch("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            Limpar
          </button>
        )}
      </div>

      {/* FILTER TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-center">
          <TabsList className="bg-slate-100 dark:bg-card/60 p-1 rounded-2xl flex-wrap justify-center h-auto gap-1">
            <TabsTrigger value="todos" className="rounded-xl font-bold text-xs px-4 py-2">
              Todos os Manuais
            </TabsTrigger>
            <TabsTrigger value="recomendados" className="rounded-xl font-bold text-xs px-4 py-2 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="size-3 mr-1 inline-block" />
              Para Minha Função
            </TabsTrigger>
            <TabsTrigger value="geral" className="rounded-xl font-bold text-xs px-4 py-2">
              Uso Geral
            </TabsTrigger>
            <TabsTrigger value="elenco" className="rounded-xl font-bold text-xs px-4 py-2">
              Elenco & Músicos
            </TabsTrigger>
            <TabsTrigger value="tecnica" className="rounded-xl font-bold text-xs px-4 py-2">
              Técnica
            </TabsTrigger>
            <TabsTrigger value="backstage" className="rounded-xl font-bold text-xs px-4 py-2">
              Backstage
            </TabsTrigger>
            <TabsTrigger value="motorista" className="rounded-xl font-bold text-xs px-4 py-2">
              Motoristas
            </TabsTrigger>
            <TabsTrigger value="producao" className="rounded-xl font-bold text-xs px-4 py-2">
              Produção & Admin
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="mt-8">
          {filteredManuais.length === 0 ? (
            <Card className="p-12 text-center rounded-3xl border-dashed border-2 border-slate-200 dark:border-white/10 bg-transparent">
              <HelpCircle className="size-10 text-slate-400 mx-auto mb-3 opacity-60" />
              <p className="font-bold text-slate-700 dark:text-slate-300">Nenhum manual encontrado para esta busca.</p>
              <p className="text-xs text-slate-500 mt-1">Tente pesquisar com outros termos ou limpe o campo de busca.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredManuais.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Card key={item.id} className="border-0 shadow-sm bg-white dark:bg-card/70 dark:backdrop-blur-xl rounded-3xl p-6 flex flex-col justify-between group hover:shadow-md transition-all">
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 ring-1 ring-sky-100 dark:ring-sky-500/20 group-hover:scale-105 transition-transform">
                          <IconComponent className="size-6" />
                        </div>
                        <Badge variant="outline" className="capitalize text-[11px] font-bold px-2.5 py-0.5 rounded-lg border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400">
                          {item.category === "geral" ? "Geral" : item.category}
                        </Badge>
                      </div>

                      <h3 className="font-extrabold text-xl text-slate-800 dark:text-white mb-2 leading-snug">
                        {item.title}
                      </h3>
                      
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-5">
                        {item.summary}
                      </p>

                      <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-white/5">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Passo a Passo:</span>
                        {item.steps.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            <span className="size-4.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {item.link && (
                      <div className="pt-6 mt-4 border-t border-slate-100 dark:border-white/5 flex justify-end">
                        <Button 
                          asChild
                          variant="ghost" 
                          size="sm" 
                          className="rounded-xl font-bold text-xs text-sky-600 hover:text-sky-700 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-500/10"
                        >
                          <a href={item.link}>
                            Acessar Tela <ChevronRight className="size-3.5 ml-1" />
                          </a>
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* FOOTER SUPORTE */}
      <Card className="border border-slate-200/80 dark:border-white/10 shadow-sm bg-gradient-to-r from-slate-50 to-white dark:from-white/[0.02] dark:to-transparent rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <h4 className="font-black text-slate-800 dark:text-white text-base">Precisa de suporte ou tem alguma dúvida técnica?</h4>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Nossa equipe de coordenação está sempre disponível para orientar você.</p>
          </div>
        </div>

        <Button 
          variant="outline" 
          onClick={handleRestartTour}
          className="rounded-xl font-bold text-xs h-10 px-5 border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 shrink-0"
        >
          <Play className="size-3.5 mr-2 text-primary" />
          Ver Tour Guiado Novamente
        </Button>
      </Card>
    </div>
  );
}
