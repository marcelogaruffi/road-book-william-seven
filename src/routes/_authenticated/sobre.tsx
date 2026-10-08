import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Code2, Settings, X } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute('/_authenticated/sobre')({
  component: SobrePage
});

function SobrePage() {
  const [zoomedLogo, setZoomedLogo] = useState<string | null>(null);

  return (
    <>
      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 max-w-4xl mx-auto p-4 md:p-8 pt-6 mb-16 md:mb-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
              <Info className="size-8 text-primary" />
              Sobre o Sistema
            </h1>
            <p className="text-slate-500 mt-1">Créditos e desenvolvimento do Áxis.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card className="border-0 shadow-sm bg-white dark:bg-card/40 dark:backdrop-blur-xl rounded-[2rem] overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            
            <CardHeader className="relative z-10 flex flex-col md:flex-row md:items-center gap-6 border-b border-slate-100 pb-8 pt-8">
              <div 
                className="shrink-0 cursor-pointer hover:scale-105 transition-transform duration-300"
                onClick={() => setZoomedLogo("/logo-axis.png")}
              >
                <img src="/logo-axis.png" alt="Logo Áxis" className="h-20 object-contain drop-shadow-sm dark:hidden" />
                  <img src="/logo-axis-dark.png" alt="Logo Áxis" className="h-20 object-contain drop-shadow-sm hidden dark:block" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-slate-800">Áxis</CardTitle>
                <p className="text-slate-500 text-lg mt-1">Plataforma de Gestão para Teatros e Shows</p>
              </div>
            </CardHeader>
            
            <CardContent className="relative z-10 pt-8 pb-10 space-y-8">
              <div className="space-y-4 text-slate-600 text-lg leading-relaxed">
                <p>
                  O <strong>Áxis</strong> é uma solução tecnológica projetada para centralizar, otimizar e escalar a gestão de espetáculos, turnês e equipes.
                </p>
                <p>
                  Este sistema foi idealizado e desenvolvido por <strong>Marcelo Garuffi</strong>, com autoria da <strong>Contemporânea Produções</strong>, para revolucionar o padrão de qualidade, velocidade e precisão no controle do show business. O objetivo é unificar logística, técnica, backstage e finanças, garantindo que nenhuma informação se perca em conversas paralelas ou arquivos dispersos.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div 
                    className="shrink-0 cursor-pointer hover:scale-110 transition-transform duration-300"
                    onClick={() => setZoomedLogo("/logo-contemporanea.png")}
                  >
                    <img src="/logo-contemporanea.png" alt="Contemporânea Produções" className="h-16 w-16 object-contain drop-shadow-sm" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Autoria e Desenvolvimento</h4>
                    <p className="text-sm text-slate-700 font-medium">Marcelo Garuffi</p>
                    <p className="text-sm text-slate-500">Contemporânea Produções</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div className="bg-emerald-100 p-3 rounded-full text-emerald-600 shrink-0">
                    <Code2 className="size-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Versão do Sistema</h4>
                    <p className="text-sm text-slate-500">v1.0.0</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex gap-4 mt-8">
                <Settings className="size-6 text-amber-500 shrink-0" />
                <div>
                  <h4 className="font-bold text-amber-900 mb-1">Evolução Contínua</h4>
                  <p className="text-amber-800/80 text-sm leading-relaxed">
                    Esta plataforma é um ecossistema vivo e em constante aprimoramento. Novos módulos e melhorias serão adicionados para manter a ferramenta sempre na vanguarda da gestão artística e corporativa.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* LIGHTBOX OVERLAY */}
      {zoomedLogo && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4"
          onClick={() => setZoomedLogo(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setZoomedLogo(null)}
              className="absolute -top-12 right-0 md:-right-12 text-white/70 hover:text-white transition-colors bg-black/20 hover:bg-black/40 rounded-full p-2"
            >
              <X className="size-8" />
            </button>
            <img 
              src={zoomedLogo} 
              alt="Logo Ampliada" 
              className="w-full h-full object-contain drop-shadow-2xl max-h-[80vh]" 
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
