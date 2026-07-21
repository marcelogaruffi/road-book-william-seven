import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic2, Lightbulb, FileText, CheckCircle2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function RiderViewModal({ 
  open, 
  onClose, 
  loading, 
  eventName, 
  somData, 
  luzData 
}: {
  open: boolean,
  onClose: (v: boolean) => void,
  loading: boolean,
  eventName: string,
  somData: any,
  luzData: any
}) {

  const renderEquipamentosList = (jd: any, colorClass: string) => {
    const list = jd?.equipamentos_lista || [];
    if (list.length === 0) return <p className="text-slate-500 italic">Nenhum equipamento listado.</p>;
    
    return (
      <div className="space-y-2">
        {list.map((eq: any) => (
          <div key={eq.id} className="flex gap-3 p-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl items-center">
            <Badge className="bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 w-12 justify-center font-black">
              {eq.qtd || "1"}x
            </Badge>
            <div className="flex-1 font-bold text-slate-800 dark:text-white">
              {eq.nome || "Item sem nome"}
            </div>
            {eq.detalhes && (
              <div className="text-sm text-slate-500">
                {eq.detalhes}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const Badge = ({ children, className }: any) => (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${className}`}>
      {children}
    </span>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem] p-0 border-0 bg-white dark:bg-card">
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-card/80 backdrop-blur-xl border-b border-slate-100 dark:border-white/5 p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-2">
              <FileText className="size-6 text-primary" />
              Rider Técnico: {eventName}
            </DialogTitle>
          </DialogHeader>
        </div>

        {loading ? (
          <div className="p-16 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="p-6 pb-12">
            <Tabs defaultValue="som" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8 bg-slate-100 dark:bg-white/5 rounded-xl h-14 p-1">
                <TabsTrigger value="som" className="rounded-lg h-full font-bold data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  <Mic2 className="size-4 mr-2" />
                  Rider de Som
                </TabsTrigger>
                <TabsTrigger value="luz" className="rounded-lg h-full font-bold data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                  <Lightbulb className="size-4 mr-2" />
                  Rider de Luz
                </TabsTrigger>
              </TabsList>

              <TabsContent value="som" className="space-y-6">
                {!somData ? (
                  <div className="text-center p-12 border-2 border-dashed rounded-2xl border-slate-200 dark:border-white/10">
                    <Mic2 className="size-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-xl font-bold text-slate-500">Mapa de som não iniciado</h3>
                    <p className="text-sm text-slate-400">O técnico de som ainda não criou o rider deste evento.</p>
                  </div>
                ) : (
                  <>
                    <Card className="border-blue-100 dark:border-blue-900/30 shadow-md">
                      <CardContent className="p-6 space-y-4">
                        <Label className="text-lg font-bold flex items-center gap-2 text-blue-600">
                          <CheckCircle2 className="size-5" />
                          Lista de Equipamentos (Input / Locação)
                        </Label>
                        {renderEquipamentosList(somData.json_data, "blue")}
                      </CardContent>
                    </Card>

                    {somData.json_data?.arquivo_url && (
                      <Card className="bg-slate-50 dark:bg-black/20 border-slate-100 dark:border-white/10 shadow-none">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-bold">Arquivo de Cena / Mapa</p>
                            <p className="text-sm text-slate-500">{somData.json_data.arquivo_nome}</p>
                            {somData.json_data.arquivo_descricao && <p className="text-xs text-slate-400">{somData.json_data.arquivo_descricao}</p>}
                          </div>
                          <Button asChild variant="outline" className="border-blue-200 text-blue-700">
                            <a href={somData.json_data.arquivo_url} target="_blank" rel="noreferrer">Baixar</a>
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {somData.json_data?.pa_sistema && (
                        <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                          <Label className="font-bold">Sistema PA</Label>
                          <p className="text-slate-600 dark:text-slate-300 mt-1">{somData.json_data.pa_sistema}</p>
                        </div>
                      )}
                      {somData.json_data?.monitoracao && (
                        <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                          <Label className="font-bold">Monitoração</Label>
                          <p className="text-slate-600 dark:text-slate-300 mt-1">{somData.json_data.monitoracao}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="luz" className="space-y-6">
                {!luzData ? (
                  <div className="text-center p-12 border-2 border-dashed rounded-2xl border-slate-200 dark:border-white/10">
                    <Lightbulb className="size-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-xl font-bold text-slate-500">Mapa de luz não iniciado</h3>
                    <p className="text-sm text-slate-400">O iluminador ainda não criou o rider deste evento.</p>
                  </div>
                ) : (
                  <>
                    <Card className="border-amber-100 dark:border-amber-900/30 shadow-md">
                      <CardContent className="p-6 space-y-4">
                        <Label className="text-lg font-bold flex items-center gap-2 text-amber-600">
                          <CheckCircle2 className="size-5" />
                          Lista de Equipamentos
                        </Label>
                        {renderEquipamentosList(luzData.json_data, "amber")}
                      </CardContent>
                    </Card>

                    {luzData.json_data?.arquivo_url && (
                      <Card className="bg-slate-50 dark:bg-black/20 border-slate-100 dark:border-white/10 shadow-none">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-bold">Mapa de Palco / Patch</p>
                            <p className="text-sm text-slate-500">{luzData.json_data.arquivo_nome}</p>
                            {luzData.json_data.arquivo_descricao && <p className="text-xs text-slate-400">{luzData.json_data.arquivo_descricao}</p>}
                          </div>
                          <Button asChild variant="outline" className="border-amber-200 text-amber-700">
                            <a href={luzData.json_data.arquivo_url} target="_blank" rel="noreferrer">Baixar</a>
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {luzData.json_data?.console_casa && (
                        <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                          <Label className="font-bold">Console Disponível</Label>
                          <p className="text-slate-600 dark:text-slate-300 mt-1">{luzData.json_data.console_casa}</p>
                        </div>
                      )}
                      {luzData.json_data?.refletores_casa && (
                        <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                          <Label className="font-bold">Refletores da Casa</Label>
                          <p className="text-slate-600 dark:text-slate-300 mt-1">{luzData.json_data.refletores_casa}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
