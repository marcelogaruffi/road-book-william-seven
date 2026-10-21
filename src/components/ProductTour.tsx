import { useEffect, useRef } from "react";
import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";

interface ProductTourProps {
  active: boolean;
  onFinish: () => void;
}

export function ProductTour({ active, onFinish }: ProductTourProps) {
  const driverRef = useRef<Driver | null>(null);

  useEffect(() => {
    if (!active) {
      if (driverRef.current) {
        driverRef.current.destroy();
        driverRef.current = null;
      }
      return;
    }

    // Initialize Driver.js
    const d = driver({
      animate: true,
      allowClose: true,
      overlayColor: "rgba(15, 23, 42, 0.75)",
      stagePadding: 8,
      stageRadius: 16,
      nextBtnText: "Próximo ›",
      prevBtnText: "‹ Anterior",
      doneBtnText: "Começar a Usar 🎉",
      showProgress: true,
      progressText: "{{current}} de {{total}}",
      onDestroyed: () => {
        onFinish();
      },
      steps: [
        {
          element: "#tour-welcome-banner",
          popover: {
            title: "👋 Bem-vindo ao Áxis Roadbook!",
            description: "Você está no Modo Demonstração. Os dados exibidos nesta tela são apenas exemplos limpos para você conhecer as ferramentas antes de acessar seus registros reais.",
            side: "bottom",
            align: "center",
          },
        },
        {
          element: "#tour-city-status",
          popover: {
            title: "📍 Cidade Atual & Próxima Viagem",
            description: "Aqui você acompanha na hora em qual cidade a equipe está hoje e qual é o próximo destino agendado da turnê.",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: "#tour-sidebar-navigation",
          popover: {
            title: "📂 Menu de Ferramentas",
            description: "Navegue com facilidade entre sua Agenda Pessoal, Escalas de Equipe, Mídias de Divulgação, Central de Padrões e Financeiro.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#tour-roadbooks-list",
          popover: {
            title: "📖 Guias de Viagem (Roadbooks)",
            description: "Aqui ficam centralizados todos os roteiros. Ao abrir um guia, você vê o cronograma minuto a minuto, hotel, teatro, clima e rotas diretas para Waze e Google Maps.",
            side: "top",
            align: "start",
          },
        },
        {
          element: "#tour-profile-footer",
          popover: {
            title: "👤 Seu Perfil & Dados Bancários",
            description: "Dica de ouro: acesse 'Meu Perfil' para cadastrar seu CPF e Chave Pix. Isso garante que seus contratos e cachês sejam gerados e pagos sem atrasos!",
            side: "right",
            align: "end",
          },
        },
        {
          popover: {
            title: "🚀 Tudo Pronto!",
            description: "Ao clicar abaixo, o modo demonstração será finalizado e seus dados reais serão carregados. Você pode rever este tutorial quando quiser no botão de ajuda do menu!",
          },
        },
      ],
    });

    driverRef.current = d;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      d.drive();
    }, 300);

    return () => {
      clearTimeout(timer);
      if (d) d.destroy();
    };
  }, [active, onFinish]);

  return null;
}
