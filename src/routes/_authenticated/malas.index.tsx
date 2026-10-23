import { AccessDenied } from "@/components/AccessDenied";
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { GridEventos } from "@/components/GridEventos";
import { Luggage } from 'lucide-react';
import { Route as AuthedRoute } from "./route";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MalasTemplateTab } from '@/components/MalasTemplateTab';

export const Route = createFileRoute('/_authenticated/malas/')({
  head: () => ({ meta: [{ title: 'Malas e Cases' }] }),
  component: MalasComponent,
});

function MalasComponent() {
  // --- SEGURANÇA E CONTROLE DE ACESSO OFICIAL AXIS ---
  const routeCtx = AuthedRoute.useRouteContext ? AuthedRoute.useRouteContext() : null;
  const currentRole = routeCtx?.profile?.role || "";
  const allowedRolesList = ["dev","produtor","assistente_producao","tour_manager","cenotecnico","roadie"];
  if (routeCtx?.profile && !allowedRolesList.includes(currentRole)) {
    return <AccessDenied message="Você não possui permissão para acessar esta área com o seu perfil atual." />;
  }
  // ----------------------------------------------------

  const { profile } = AuthedRoute.useRouteContext();
  const userRole = profile?.role || "";
  const allowedRoles = ["dev","produtor","assistente_producao","tour_manager","cenotecnico","roadie"];
  const isAllowed = allowedRoles.includes(userRole);

  if (profile && !isAllowed) {
    return <AccessDenied message="O módulo de Malas e Cases é restrito à Logística, Cenotécnica e Produção." />;
  }

  
  const navigate = useNavigate();

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-3 pb-1">
          <Luggage className="size-8 text-slate-800 dark:text-white" />
          Malas e Cases
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
          Gerencie as malas padrão por espetáculo e faça o checklist de operação nos eventos.
        </p>
      </div>

      <Tabs defaultValue="eventos" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-slate-100 dark:bg-white/10 rounded-xl h-14 p-1">
          <TabsTrigger value="eventos" className="rounded-lg h-full font-bold">Eventos (Checklist)</TabsTrigger>
          <TabsTrigger value="modelos" className="rounded-lg h-full font-bold">Modelos (Padrão)</TabsTrigger>
        </TabsList>

        <TabsContent value="eventos" className="mt-8">
          <GridEventos onSelect={(id) => window.location.href = `/malas/` + id} />
        </TabsContent>

        <TabsContent value="modelos" className="mt-8">
          <MalasTemplateTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
