import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 2, // 2 minutos de cache em memória
        gcTime: 1000 * 60 * 10,   // Mantém cache em segundo plano por 10 minutos
        refetchOnWindowFocus: false, // Evita requisições repetitivas ao trocar de aba no navegador
        retry: 1,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent", // Pré-carrega o código da rota instantaneamente no hover do mouse
    defaultPreloadDelay: 50,
  });

  return router;
};
