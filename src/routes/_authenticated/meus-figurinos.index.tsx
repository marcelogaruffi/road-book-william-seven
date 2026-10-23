import { Route as AuthedRoute } from "./route";
import { AccessDenied } from "@/components/AccessDenied";
import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent } from '@/components/ui/card'
import { Construction } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/meus-figurinos/')({
  head: () => ({ meta: [{ title: "Meus Figurinos - Áxis - Gestão de Teatros e Shows" }] }),
  component: MeusFigurinosPage,
})

function MeusFigurinosPage() {
  // --- SEGURANÇA E CONTROLE DE ACESSO OFICIAL AXIS ---
  const routeCtx = AuthedRoute.useRouteContext ? AuthedRoute.useRouteContext() : null;
  const allowedRolesList = ["dev","produtor","assistente_producao","contra_regra","stage_manager","camareiro","elenco"];
  const profileRoles = routeCtx?.profile ? [routeCtx.profile.role, ...(Array.isArray(routeCtx.profile.funcoes) ? routeCtx.profile.funcoes : [])] : [];
  const hasAccess = profileRoles.some(r => allowedRolesList.includes(r));
  if (routeCtx?.profile && !hasAccess) {
    return <AccessDenied message="Você não possui permissão para acessar esta área com o seu perfil atual." />;
  }
  // ----------------------------------------------------

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 w-full max-w-7xl mx-auto mb-16 md:mb-0">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
          Meus Figurinos
        </h2>
      </div>
      
      <Card className="border-dashed border-2 shadow-sm rounded-xl">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
          <Construction className="size-16 text-slate-300 mb-4 animate-pulse" />
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Em Construção</h3>
          <p className="max-w-md mx-auto">Esta tela exibirá os figurinos e informações exclusivas designadas para você em breve.</p>
        </CardContent>
      </Card>
    </div>
  )
}
