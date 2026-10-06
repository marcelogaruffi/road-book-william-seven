import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { GridEventos } from "@/components/GridEventos";
import { Luggage } from 'lucide-react';
import { Route as AuthedRoute } from "./route";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MalasTemplateTab } from '@/components/MalasTemplateTab';
import { EstoqueGlobalTab } from '@/components/EstoqueGlobalTab';

export const Route = createFileRoute('/_authenticated/malas/')({
  head: () => ({ meta: [{ title: 'Malas e Cases' }] }),
  component: MalasComponent,
});

function MalasComponent() {
  const { profile, isSimulating } = AuthedRoute.useRouteContext();
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
        <TabsList className="grid w-full grid-cols-3 max-w-2xl bg-slate-100 dark:bg-white/10 rounded-xl h-14 p-1">
          <TabsTrigger value="eventos" className="rounded-lg h-full font-bold">Eventos (Checklist)</TabsTrigger>
          <TabsTrigger value="modelos" className="rounded-lg h-full font-bold">Modelos (Padrão)</TabsTrigger>
          <TabsTrigger value="estoque" className="rounded-lg h-full font-bold">Estoque Global</TabsTrigger>
        </TabsList>

        <TabsContent value="eventos" className="mt-8">
          <GridEventos onSelect={(id) => window.location.href = /malas/ + id} />
        </TabsContent>

        <TabsContent value="modelos" className="mt-8">
          <MalasTemplateTab />
        </TabsContent>

        <TabsContent value="estoque" className="mt-8">
          <EstoqueGlobalTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
