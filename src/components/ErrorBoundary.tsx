import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children?: ReactNode;
  resetKey?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Erro capturado pela ErrorBoundary:", error, errorInfo);
  }

  public componentDidUpdate(prevProps: Props) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-4 sm:p-8 animate-in fade-in zoom-in-95 duration-300">
          <div className="max-w-md w-full bg-white dark:bg-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl text-center space-y-4">
            <div className="size-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-sm">
              <AlertCircle className="size-7" />
            </div>
            
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
              Ops! Ocorreu um problema ao carregar esta área
            </h2>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Ocorreu uma instabilidade temporária ao exibir este conteúdo. Você pode tentar recarregar ou navegar normalmente para outras páginas pelo menu lateral. Se o problema persistir contate o suporte.
            </p>

            {this.state.error && (
              <details className="text-left text-xs text-slate-400 cursor-pointer">
                <summary className="hover:text-slate-600 dark:hover:text-slate-200">Detalhes técnicos do erro</summary>
                <div className="mt-2 bg-slate-100 dark:bg-white/5 p-3 rounded-xl font-mono text-[11px] text-slate-700 dark:text-slate-300 break-words">
                  {this.state.error.message || String(this.state.error)}
                </div>
              </details>
            )}

            <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
              <Button
                onClick={this.handleReset}
                className="rounded-xl font-bold gap-2 shadow-sm"
              >
                <RefreshCw className="size-4" /> Recarregar tela
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  window.location.href = "/dashboard";
                }}
                className="rounded-xl font-bold gap-2 border-slate-200 dark:border-white/10"
              >
                <Home className="size-4" /> Ir para o Início
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
