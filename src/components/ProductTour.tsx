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
        try {
          driverRef.current.destroy();
        } catch (e) {}
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
            title: "👋 Bem-vindo ao Áxis!",
            description: "Esta é a sua central de gestão de espetáculos e turnês. Preparamos uma rápida apresentação prática para você conhecer os recursos fundamentais.",
            side: "bottom",
            align: "center",
          },
        },
        {
          element: "#tour-city-status",
          popover: {
            title: "📍 Cidade Atual & Próxima Viagem",
            description: "Acompanhe de relance onde a turnê está sediada hoje e qual é o próximo destino programado no calendário da companhia.",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: "#tour-sidebar-navigation",
          popover: {
            title: "📂 Meu Espaço & Ferramentas",
            description: "Na barra lateral você encontra o Meu Espaço, onde consulta sua Agenda, Escalas, Pagamentos e Notificações, além das ferramentas dedicadas à sua área.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#tour-guias-viagem",
          popover: {
            title: "📖 Guias de Viagem",
            description: "Acesse o cronograma completo de cada viagem. Ao abrir um guia, você confere horários minuto a minuto, hotéis, mapas do teatro, documentos e contatos.",
            side: "top",
            align: "start",
          },
        },
        {
          element: "#tour-profile-menu",
          popover: {
            title: "👤 Dados Cadastrais & Chave Pix",
            description: "Importante: mantenha sempre seus Dados Cadastrais completos com CPF e Chave Pix para a correta emissão de escalas, contratos e pagamentos.",
            side: "right",
            align: "center",
          },
        },
        {
          popover: {
            title: "🚀 Tudo Pronto!",
            description: "O tour inicial foi concluído! A partir de agora você terá acesso em tempo real a todas as suas informações oficiais. Você pode revisitar este tour a qualquer momento no botão de ajuda.",
          },
        },
      ],
    });

    driverRef.current = d;

    // Small delay to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      try {
        d.drive();
      } catch (err) {
        console.error("Erro ao iniciar driver tour:", err);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      if (d) {
        try {
          d.destroy();
        } catch (e) {}
      }
    };
  }, [active, onFinish]);

  return null;
}
