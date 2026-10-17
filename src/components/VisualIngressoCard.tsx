import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, MapPin, Calendar, Clock, Ticket } from "lucide-react";
import { exportarIngressoPDF, type DadosIngresso } from "@/lib/ticketGenerator";

interface Props {
  dados: DadosIngresso;
  onDownload?: () => void;
}

export function VisualIngressoCard({ dados, onDownload }: Props) {
  const handleBaixar = () => {
    if (onDownload) onDownload();
    else exportarIngressoPDF(dados);
  };

  return (
    <div className="max-w-sm mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2rem] overflow-hidden shadow-2xl relative transition-all">
      {/* Imagem de Capa do Espetáculo (se houver) */}
      {dados.bannerShowUrl && (
        <div className="h-40 w-full relative overflow-hidden bg-slate-950">
          <img 
            src={dados.bannerShowUrl} 
            alt={dados.espetaculo}
            className="w-full h-full object-cover object-center" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          <div className="absolute top-3 right-3">
            <Badge className="bg-indigo-600 text-white font-bold text-[10px] border-none px-2.5 py-0.5 shadow-md">
              {dados.tipoIngresso}
            </Badge>
          </div>
        </div>
      )}

      {/* Topo do Bilhete */}
      <div className={`bg-slate-900 text-white p-6 ${dados.bannerShowUrl ? 'pt-2 pb-5' : 'pb-5'} relative overflow-hidden`}>
        <div className="absolute -right-6 -bottom-6 size-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        
        {!dados.bannerShowUrl && (
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">
            <span>{dados.produtoraNome || "WILLIAM SEVEN PRODUÇÕES"}</span>
            <Badge className="bg-indigo-600 text-white font-bold text-[10px] border-none px-2.5 py-0.5">
              {dados.tipoIngresso}
            </Badge>
          </div>
        )}

        {dados.bannerShowUrl && (
          <span className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1">
            {dados.produtoraNome || "WILLIAM SEVEN PRODUÇÕES"}
          </span>
        )}

        <h3 className="text-xl font-black text-white leading-tight">
          {dados.espetaculo}
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold mt-2">
          <MapPin className="size-3.5 text-indigo-400 shrink-0" />
          <span className="truncate">{dados.teatro} • {dados.cidade}</span>
        </div>
      </div>

      {/* Recortes de picote de ingresso nas laterais */}
      <div className="relative flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 px-4 py-3 border-y border-dashed border-slate-200 dark:border-white/10">
        <div className="absolute -left-3 size-6 bg-slate-100 dark:bg-background rounded-full border border-slate-200 dark:border-white/10" />
        <div className="absolute -right-3 size-6 bg-slate-100 dark:bg-background rounded-full border border-slate-200 dark:border-white/10" />
        
        <div className="w-full flex items-center justify-around text-center px-4">
          <div className="max-w-[130px]">
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Setor</span>
            <span className="font-black text-xs text-slate-800 dark:text-white uppercase truncate block" title={dados.setor}>
              {dados.setor}
            </span>
          </div>
          <div className="h-7 w-px bg-slate-200 dark:bg-white/10" />
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Fila</span>
            <span className="font-black text-base text-slate-800 dark:text-white uppercase">{dados.fileira}</span>
          </div>
          <div className="h-7 w-px bg-slate-200 dark:bg-white/10" />
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Assento</span>
            <span className="font-black text-lg text-primary">{dados.assento}</span>
          </div>
        </div>
      </div>

      {/* Corpo do Bilhete */}
      <div className="p-6 space-y-4">
        {dados.portaAcesso && (
          <div className="bg-primary/5 border border-primary/15 rounded-xl p-2.5 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-500">Porta de Entrada:</span>
            <span className="font-black text-primary">{dados.portaAcesso}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Data e Hora</span>
            <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
              <Calendar className="size-3.5 text-slate-400" />
              <span>{dados.data}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500 font-semibold">
              <Clock className="size-3 text-slate-400" />
              <span>{dados.horario}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Titular</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
              {dados.titularNome}
            </span>
            <span className="text-[11px] font-mono text-slate-400 block">
              {dados.codigoIngresso}
            </span>
          </div>
        </div>

        {/* Botão de Download */}
        <Button 
          onClick={handleBaixar}
          className="w-full gap-2 font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 h-11 shadow-md"
        >
          <Download className="size-4" /> Baixar Ingresso em PDF
        </Button>
      </div>
    </div>
  );
}
