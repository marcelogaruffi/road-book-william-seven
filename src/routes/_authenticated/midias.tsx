import { createFileRoute } from "@tanstack/react-router";
import { Route as AuthedRoute } from "./route";
import { Smartphone } from "lucide-react";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/midias")({
  head: () => ({ meta: [{ title: "Mídias Sociais - Seven Produções Artísticas" }] }),
  component: MidiasPage,
});

function MidiasPage() {
  const { profile } = AuthedRoute.useRouteContext();
  const userRole = profile?.role;
  const isAllowed = userRole === 'admin' || userRole === 'dev' || userRole === 'produtor' || userRole === 'midias_sociais';

  if (!isAllowed) {
    return (
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center py-24 px-6 text-center">
        <div className="bg-red-500/10 text-red-500 p-6 rounded-3xl mb-6">
          <Smartphone className="size-12" />
        </div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Acesso Negado</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-4 max-w-md">
          Você não tem permissão para acessar o painel de Mídias Sociais.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Smartphone className="size-8 text-primary" />
            Mídias Sociais
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Painel dedicado para a equipe de Mídias Sociais.
          </p>
        </div>
      </div>

      <Card className="p-16 text-center border-dashed border-2 border-slate-200 dark:border-white/10 bg-transparent rounded-[2rem]">
        <p className="text-slate-500 dark:text-slate-400 font-medium">Novas funcionalidades em breve.</p>
      </Card>
    </div>
  );
}
