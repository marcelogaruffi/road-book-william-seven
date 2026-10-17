import { Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function AccessDenied({ 
  message = "Esta página é exclusiva para Administradores e Produtores." 
}: { 
  message?: string 
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] text-center p-6 animate-in fade-in duration-300">
      <div className="size-16 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-500 flex items-center justify-center mb-4 shadow-sm border border-rose-100 dark:border-rose-900/30">
        <Lock className="size-8" />
      </div>
      <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Acesso Restrito</h2>
      <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md text-sm leading-relaxed">
        {message}
      </p>
      <Link to="/dashboard" className="mt-6">
        <Button variant="outline" className="rounded-xl">
          Voltar ao Dashboard
        </Button>
      </Link>
    </div>
  );
}
