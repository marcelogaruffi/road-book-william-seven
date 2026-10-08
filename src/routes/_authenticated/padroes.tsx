import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Music, Settings, Luggage, Coffee, Scissors, Mic2, Lightbulb, Clapperboard, CheckSquare, Shirt, Layers } from "lucide-react";

import { CateringPadraoTab } from "@/components/CateringPadraoTab";
import { MalasTemplateTab } from "@/components/MalasTemplateTab";
import TemplateRidersTab from "@/components/TemplateRidersTab";
import TemplateCuesTab from "@/components/som-operacao/TemplateCuesTab";
import { PartiturasPadraoTab } from "@/components/PartiturasPadraoTab";
import { FigurinosPadraoTab } from "@/components/FigurinosPadraoTab";
import { PalcoPadraoTab } from "@/components/PalcoPadraoTab";

export const Route = createFileRoute("/_authenticated/padroes")({
  head: () => ({ meta: [{ title: "Padrões de Espetáculo - Áxis - Gestão de Teatros e Shows" }] }),
  component: PadroesPage,
});

function PadroesPage() {
  const [espetaculos, setEspetaculos] = useState<string[]>([]);
  const [selectedEspetaculo, setSelectedEspetaculo] = useState<string>("");

  useEffect(() => {
    async function loadEspetaculos() {
      const { data } = await supabase.from('templates_espetaculos').select('nome_espetaculo').order('nome_espetaculo');
      if (data) setEspetaculos(data.map(d => d.nome_espetaculo));
    }
    loadEspetaculos();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Layers className="size-8 text-primary" />
            Padrões de Espetáculo
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Gerencie as configurações e riders padrão para cada espetáculo de forma centralizada.
          </p>
        </div>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2 max-w-md">
              <Label>Selecione o Espetáculo</Label>
              <Select value={selectedEspetaculo} onValueChange={setSelectedEspetaculo}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Selecione um espetáculo..." />
                </SelectTrigger>
                <SelectContent>
                  {espetaculos.map(esp => (
                    <SelectItem key={esp} value={esp}>{esp}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!selectedEspetaculo ? (
            <div className="p-12 text-center text-slate-500">
              <Layers className="size-12 mx-auto mb-4 opacity-20" />
              <p>Selecione um espetáculo acima para configurar seus padrões.</p>
            </div>
          ) : (
            <Tabs defaultValue="catering" className="w-full">
              <div className="px-6 pt-6 pb-2">
                <TabsList className="flex flex-wrap h-auto gap-1">
                  <TabsTrigger value="catering" className="flex items-center gap-2"><Coffee className="size-4" /> Catering</TabsTrigger>
                  <TabsTrigger value="malas" className="flex items-center gap-2"><Luggage className="size-4" /> Malas</TabsTrigger>
                  <TabsTrigger value="som_cues" className="flex items-center gap-2"><Music className="size-4" /> Som (Cues)</TabsTrigger>
                  <TabsTrigger value="som_riders" className="flex items-center gap-2"><Mic2 className="size-4" /> Som (Riders)</TabsTrigger>
                  <TabsTrigger value="partituras" className="flex items-center gap-2"><Music className="size-4" /> Partituras/Músicas</TabsTrigger>
                  <TabsTrigger value="figurino" className="flex items-center gap-2"><Shirt className="size-4" /> Figurinos</TabsTrigger>
                  <TabsTrigger value="palco" className="flex items-center gap-2"><CheckSquare className="size-4" /> Palco/Props</TabsTrigger>
                  <TabsTrigger value="luz" className="flex items-center gap-2"><Lightbulb className="size-4" /> Iluminação</TabsTrigger>
                  <TabsTrigger value="video" className="flex items-center gap-2"><Clapperboard className="size-4" /> Vídeo</TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6">
                <TabsContent value="catering" className="mt-0">
                  <CateringPadraoTab espetaculoNome={selectedEspetaculo} />
                </TabsContent>

                <TabsContent value="malas" className="mt-0">
                  <MalasTemplateTab espetaculoNome={selectedEspetaculo} />
                </TabsContent>

                <TabsContent value="som_cues" className="mt-0">
                  <TemplateCuesTab espetaculoNome={selectedEspetaculo} />
                </TabsContent>

                <TabsContent value="som_riders" className="mt-0">
                  <TemplateRidersTab espetaculoNome={selectedEspetaculo} context='som' />
                </TabsContent>

                <TabsContent value="partituras" className="mt-0">
                    <PartiturasPadraoTab espetaculoNome={selectedEspetaculo} />
                  </TabsContent>
                
                <TabsContent value="figurino" className="mt-0">
                    <FigurinosPadraoTab espetaculoNome={selectedEspetaculo} />
                  </TabsContent>

                <TabsContent value="palco" className="mt-0">
                    <PalcoPadraoTab espetaculoNome={selectedEspetaculo} />
                  </TabsContent>
                
                <TabsContent value="luz" className="mt-0">
                    <TemplateRidersTab espetaculoNome={selectedEspetaculo} context="luz" />
                  </TabsContent>

                <TabsContent value="video" className="mt-0">
                    <TemplateRidersTab espetaculoNome={selectedEspetaculo} context="video" />
                  </TabsContent>
              </div>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
