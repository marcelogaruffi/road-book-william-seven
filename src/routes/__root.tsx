import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AccessibilityWidget } from "@/components/AccessibilityWidget";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl text-center space-y-4">
        <h1 className="text-6xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">404</h1>
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">Página não encontrada</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
          >
            <Home className="size-4" /> Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl text-center space-y-4">
        <div className="size-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-sm">
          <AlertTriangle className="size-7" />
        </div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          Ops! Ocorreu um problema ao carregar esta tela
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Ocorreu uma instabilidade inesperada. Você pode tentar recarregar ou retornar para a página inicial. Se o problema persistir contate o suporte.
        </p>
        {error && (
          <details className="text-left text-xs text-slate-400 cursor-pointer">
            <summary className="hover:text-slate-600 dark:hover:text-slate-200">Detalhes técnicos do erro</summary>
            <div className="mt-2 bg-slate-100 dark:bg-white/5 p-3 rounded-xl font-mono text-[11px] text-slate-700 dark:text-slate-300 break-words">
              {error.message || String(error)}
            </div>
          </details>
        )}
        <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
          >
            <RefreshCw className="size-4" /> Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
          >
            <Home className="size-4" /> Página inicial
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Áxis | Gestão de Teatros e Shows" },
      { name: "description", content: "Áxis é uma plataforma de gestão de teatros, espetáculos, shows, turnês, equipes, contratos e operações de produção." },
      { name: "author", content: "Áxis" },
      { property: "og:title", content: "Áxis | Gestão de Teatros e Shows" },
      { property: "og:description", content: "Áxis é uma plataforma de gestão de teatros, espetáculos, shows, turnês, equipes, contratos e operações de produção." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Áxis | Gestão de Teatros e Shows" },
      { name: "twitter:description", content: "Áxis é uma plataforma de gestão de teatros, espetáculos, shows, turnês, equipes, contratos e operações de produção." },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <AccessibilityWidget />
      <Toaster />
    </QueryClientProvider>
  );
}
