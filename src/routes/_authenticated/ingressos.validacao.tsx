import { AccessDenied } from "@/components/AccessDenied";
import { Route as AuthedRoute } from "./route";
// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";
import { 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Search, 
  Camera, 
  CameraOff,
  RefreshCw, 
  Ticket, 
  Building2, 
  Calendar, 
  User, 
  MapPin, 
  ShieldCheck,
  History,
  Trash2,
  ScanLine,
  Keyboard,
  Clock,
  Maximize2,
  Minimize2,
  X
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/ingressos/validacao")({
  head: () => ({ meta: [{ title: "Validação de Ingressos - Portaria - Áxis" }] }),
  component: ValidacaoIngressosPage,
});

export type ResultadoValidacao = {
  status: "valido" | "ja_utilizado" | "invalido" | "cancelado";
  mensagem: string;
  dataHora: string;
  ingresso?: {
    id: string;
    codigoIngresso: string;
    titularNome: string;
    titularCpf?: string;
    espetaculo: string;
    cidade: string;
    teatro: string;
    setor: string;
    fileira: string;
    assento: string;
    portaAcesso?: string;
    tipoIngresso: string;
    dataShow: string;
    horarioShow: string;
    validadoEm?: string;
  };
};

function formatarCpfMascarado(cpf?: string): string {
  if (!cpf) return "Não informado";
  const nums = cpf.replace(/\D/g, "");
  if (nums.length === 11) {
    return `${nums.slice(0, 3)}.***.***-${nums.slice(9, 11)}`;
  }
  if (nums.length >= 5) {
    return `${nums.slice(0, 3)}***${nums.slice(-2)}`;
  }
  return cpf;
}

function ValidacaoIngressosPage() {
  const { profile } = AuthedRoute.useRouteContext();
  const userRole = profile?.role || "";
  const allowedRoles = ["dev","produtor","assistente_producao"];
  const isAllowed = allowedRoles.includes(userRole);

  if (profile && !isAllowed) {
    return <AccessDenied message="A Validação de Ingressos é restrita à Portaria e Produção." />;
  }

  const [activeTab, setActiveTab] = useState<"leitura" | "digitar" | "historico">("leitura");
  const [codigoInput, setCodigoInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Feedback atual da validação
  const [resultado, setResultado] = useState<ResultadoValidacao | null>(null);
  const timerResultadoRef = useRef<any>(null);

  // Histórico persistente no localStorage
  const [historicoRecente, setHistoricoRecente] = useState<ResultadoValidacao[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("axis_portaria_historico");
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [totaisHoje, setTotaisHoje] = useState<{ validados: number; recusados: number }>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("axis_portaria_totais");
        return saved ? JSON.parse(saved) : { validados: 0, recusados: 0 };
      } catch (e) {
        return { validados: 0, recusados: 0 };
      }
    }
    return { validados: 0, recusados: 0 };
  });

  // Salvar histórico sempre que mudar
  useEffect(() => {
    localStorage.setItem("axis_portaria_historico", JSON.stringify(historicoRecente));
  }, [historicoRecente]);

  useEffect(() => {
    localStorage.setItem("axis_portaria_totais", JSON.stringify(totaisHoje));
  }, [totaisHoje]);

  // Scanner Câmera QR Code
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanLockRef = useRef<boolean>(false);

  const startCamera = async () => {
    try {
      setCameraAtiva(true);
      setTimeout(async () => {
        try {
          if (scannerRef.current && scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          const html5QrCode = new Html5Qrcode("reader-camera-fullscreen");
          scannerRef.current = html5QrCode;

          // Calcular qrbox ideal responsivo para tela de celular
          const qrboxFunction = (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const edgeSize = Math.floor(minEdge * 0.72);
            return {
              width: Math.max(220, Math.min(edgeSize, 320)),
              height: Math.max(220, Math.min(edgeSize, 320))
            };
          };

          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 20,
              qrbox: qrboxFunction,
              aspectRatio: window.innerWidth < 640 ? 0.75 : 1.0
            },
            (decodedText) => {
              if (scanLockRef.current) return;
              scanLockRef.current = true;
              
              // Vibração tátil no celular ao capturar
              if (typeof navigator !== "undefined" && navigator.vibrate) {
                navigator.vibrate(100);
              }

              handleValidarCodigo(decodedText);
              setTimeout(() => {
                scanLockRef.current = false;
              }, 4000);
            },
            () => {}
          );
        } catch (err: any) {
          console.error("Erro ao iniciar câmera:", err);
          toast.error("Não foi possível acessar a câmera. Verifique as permissões.");
          setCameraAtiva(false);
        }
      }, 400);
    } catch (e) {
      console.error(e);
      setCameraAtiva(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.error(e);
      }
    }
    setCameraAtiva(false);
  };

  // Se trocar de aba, encerra a câmera
  useEffect(() => {
    if (activeTab !== "leitura" && cameraAtiva) {
      stopCamera();
    }
  }, [activeTab]);

  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
      if (timerResultadoRef.current) {
        clearTimeout(timerResultadoRef.current);
      }
    };
  }, []);

  // Exibir popup/overlay de resultado por exatamente 5 segundos e depois sumir automaticamente
  const dispararResultadoComTimer = (res: ResultadoValidacao) => {
    if (timerResultadoRef.current) {
      clearTimeout(timerResultadoRef.current);
    }
    setResultado(res);
    setHistoricoRecente(prev => [res, ...prev.slice(0, 99)]);

    if (res.status === "valido") {
      setTotaisHoje(prev => ({ ...prev, validados: prev.validados + 1 }));
    } else {
      setTotaisHoje(prev => ({ ...prev, recusados: prev.recusados + 1 }));
    }

    // Fecha automaticamente após 5 segundos
    timerResultadoRef.current = setTimeout(() => {
      setResultado(null);
    }, 5000);
  };

  // Limpar Histórico de Leituras
  const handleLimparHistorico = () => {
    if (confirm("Deseja zerar o histórico de leituras desta portaria?")) {
      setHistoricoRecente([]);
      setTotaisHoje({ validados: 0, recusados: 0 });
      setResultado(null);
      localStorage.removeItem("axis_portaria_historico");
      localStorage.removeItem("axis_portaria_totais");
      toast.success("Histórico da portaria zerado com sucesso!");
    }
  };

  // Validação por Código (Leitor Óptico USB/Bluetooth, Câmera ou Digitação Manual)
  const handleValidarCodigo = async (codigoParaValidar?: string) => {
    // Normalizar código lido pela câmera ou digitado:
    // Remove espaços em branco, quebras de linha e padroniza maiúsculas
    let cod = (codigoParaValidar || codigoInput).trim().replace(/\r?\n|\r/g, "").toUpperCase();
    if (!cod) {
      toast.warning("Digite ou aponte o leitor para o código do ingresso.");
      return;
    }

    setLoading(true);
    const agoraHora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    try {
      // 1. Buscar no Supabase por código exato ou ilike
      let { data: ingDb } = await supabase
        .from("ingressos_evento")
        .select("*")
        .eq("codigo_ingresso", cod)
        .maybeSingle();

      // Se não achar direto e tiver caracteres sem hífen, tenta buscar com hífen ou vice-versa
      if (!ingDb) {
        const { data: ingIlike } = await supabase
          .from("ingressos_evento")
          .select("*")
          .ilike("codigo_ingresso", cod)
          .maybeSingle();
        ingDb = ingIlike;
      }

      let ingressoEncontrado: any = ingDb;
      let storageEncontradoChave: string | null = null;

      // 2. Fallback caso esteja gravado no localStorage
      if (typeof window !== "undefined") {
        const codNormalizado = cod.replace(/[^A-Z0-9]/g, "");
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("ingressos_evento_")) {
            try {
              const lista = JSON.parse(localStorage.getItem(key) || "[]");
              const idxMatch = lista.findIndex((item: any) => {
                if (!item.codigoIngresso) return false;
                const itemCod = item.codigoIngresso.trim().toUpperCase();
                return itemCod === cod || itemCod.replace(/[^A-Z0-9]/g, "") === codNormalizado;
              });
              if (idxMatch >= 0) {
                storageEncontradoChave = key;
                const match = lista[idxMatch];
                if (!ingressoEncontrado) {
                  ingressoEncontrado = {
                    id: match.id,
                    codigo_ingresso: match.codigoIngresso,
                    titular_nome: match.titularNome,
                    titular_cpf: match.titularCpf,
                    espetaculo: match.espetaculo,
                    cidade: match.cidade,
                    teatro: match.teatro,
                    setor: match.setor,
                    fileira: match.fileira,
                    assento: match.assento,
                    porta_acesso: match.portaAcesso,
                    tipo_ingresso: match.tipoIngresso,
                    data_show: match.data,
                    horario_show: match.horario,
                    status: match.status,
                    validado_em: match.validadoEm
                  };
                }
                break;
              }
            } catch (e) {}
          }
        }
      }

      // Se não encontrou: INVÁLIDO (VERMELHO)
      if (!ingressoEncontrado) {
        dispararResultadoComTimer({
          status: "invalido",
          mensagem: "INGRESSO INVÁLIDO!",
          dataHora: agoraHora
        });
        setCodigoInput("");
        return;
      }

      // Se cancelado: CANCELADO / BLOQUEADO (VERMELHO)
      if (ingressoEncontrado.status === "cancelado") {
        dispararResultadoComTimer({
          status: "cancelado",
          mensagem: "INGRESSO CANCELADO!",
          dataHora: agoraHora,
          ingresso: {
            id: ingressoEncontrado.id,
            codigoIngresso: ingressoEncontrado.codigo_ingresso,
            titularNome: ingressoEncontrado.titular_nome,
            titularCpf: ingressoEncontrado.titular_cpf,
            espetaculo: ingressoEncontrado.espetaculo,
            cidade: ingressoEncontrado.cidade,
            teatro: ingressoEncontrado.teatro,
            setor: ingressoEncontrado.setor,
            fileira: ingressoEncontrado.fileira,
            assento: ingressoEncontrado.assento,
            portaAcesso: ingressoEncontrado.porta_acesso,
            tipoIngresso: ingressoEncontrado.tipo_ingresso,
            dataShow: ingressoEncontrado.data_show,
            horarioShow: ingressoEncontrado.horario_show
          }
        });
        setCodigoInput("");
        return;
      }

      // Se JÁ FOI UTILIZADO: BLOQUEIA (AMARELO)
      if (ingressoEncontrado.status === "utilizado") {
        const horaOriginal = ingressoEncontrado.validado_em 
          ? new Date(ingressoEncontrado.validado_em).toLocaleTimeString("pt-BR") 
          : "leitura anterior";

        dispararResultadoComTimer({
          status: "ja_utilizado",
          mensagem: `INGRESSO JÁ FOI VALIDADO! (Às ${horaOriginal})`,
          dataHora: agoraHora,
          ingresso: {
            id: ingressoEncontrado.id,
            codigoIngresso: ingressoEncontrado.codigo_ingresso,
            titularNome: ingressoEncontrado.titular_nome,
            titularCpf: ingressoEncontrado.titular_cpf,
            espetaculo: ingressoEncontrado.espetaculo,
            cidade: ingressoEncontrado.cidade,
            teatro: ingressoEncontrado.teatro,
            setor: ingressoEncontrado.setor,
            fileira: ingressoEncontrado.fileira,
            assento: ingressoEncontrado.assento,
            portaAcesso: ingressoEncontrado.porta_acesso,
            tipoIngresso: ingressoEncontrado.tipo_ingresso,
            dataShow: ingressoEncontrado.data_show,
            horarioShow: ingressoEncontrado.horario_show,
            validadoEm: ingressoEncontrado.validado_em
          }
        });
        setCodigoInput("");
        return;
      }

      // VÁLIDO PELA PRIMEIRA VEZ (VERDE)
      const agoraIso = new Date().toISOString();

      try {
        await supabase
          .from("ingressos_evento")
          .update({ status: "utilizado", validado_em: agoraIso })
          .eq("codigo_ingresso", cod);
      } catch (errSupabase) {
        console.warn("Supabase update:", errSupabase);
      }

      if (storageEncontradoChave) {
        try {
          const lista = JSON.parse(localStorage.getItem(storageEncontradoChave) || "[]");
          const idx = lista.findIndex((item: any) => item.codigoIngresso === cod);
          if (idx >= 0) {
            lista[idx].status = "utilizado";
            lista[idx].validadoEm = agoraIso;
            localStorage.setItem(storageEncontradoChave, JSON.stringify(lista));
          }
        } catch (e) {}
      }

      dispararResultadoComTimer({
        status: "valido",
        mensagem: "INGRESSO VALIDADO!",
        dataHora: agoraHora,
        ingresso: {
          id: ingressoEncontrado.id,
          codigoIngresso: ingressoEncontrado.codigo_ingresso,
          titularNome: ingressoEncontrado.titular_nome,
          titularCpf: ingressoEncontrado.titular_cpf,
          espetaculo: ingressoEncontrado.espetaculo,
          cidade: ingressoEncontrado.cidade,
          teatro: ingressoEncontrado.teatro,
          setor: ingressoEncontrado.setor,
          fileira: ingressoEncontrado.fileira,
          assento: ingressoEncontrado.assento,
          portaAcesso: ingressoEncontrado.porta_acesso,
          tipoIngresso: ingressoEncontrado.tipo_ingresso,
          dataShow: ingressoEncontrado.data_show,
          horarioShow: ingressoEncontrado.horario_show,
          validadoEm: agoraIso
        }
      });
      setCodigoInput("");
    } catch (e) {
      console.error(e);
      toast.error("Erro na comunicação com a base de dados.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in duration-300 relative">
      {/* ============================================================== */}
      {/* OVERLAY TELA CHEIA 100% PARA RESULTADO DA LEITURA (SOME EM 5s) */}
      {/* ============================================================== */}
      {resultado && (
        <div 
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-6 md:p-12 animate-in zoom-in-95 duration-200 select-none overflow-y-auto ${
            resultado.status === "valido"
              ? "bg-emerald-600 text-white"
              : resultado.status === "ja_utilizado"
              ? "bg-amber-400 text-slate-950"
              : "bg-rose-600 text-white"
          }`}
          onClick={() => setResultado(null)}
          title="Clique em qualquer lugar para fechar agora"
        >
          {/* Botão fechar canto superior */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setResultado(null);
            }}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2.5 sm:p-3 rounded-full bg-black/20 hover:bg-black/30 transition-all text-white backdrop-blur-md cursor-pointer z-10"
          >
            <X className="size-6 sm:size-8" />
          </button>

          {/* Contador/aviso de 5s */}
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-black/20 text-[10px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-md z-10">
            <Clock className="size-3.5 sm:size-4 animate-spin" />
            Fecha em 5s
          </div>

          <div className="w-full max-w-3xl flex flex-col items-center text-center space-y-6">
            {/* Ícone Gigante */}
            {resultado.status === "valido" && (
              <div className="size-28 sm:size-36 rounded-full bg-white/20 flex items-center justify-center shadow-2xl animate-bounce">
                <CheckCircle2 className="size-20 sm:size-24 text-white" />
              </div>
            )}
            {resultado.status === "ja_utilizado" && (
              <div className="size-28 sm:size-36 rounded-full bg-black/15 flex items-center justify-center shadow-2xl animate-pulse">
                <AlertTriangle className="size-20 sm:size-24 text-slate-950" />
              </div>
            )}
            {(resultado.status === "invalido" || resultado.status === "cancelado") && (
              <div className="size-28 sm:size-36 rounded-full bg-white/20 flex items-center justify-center shadow-2xl">
                <XCircle className="size-20 sm:size-24 text-white" />
              </div>
            )}

            {/* Mensagem Principal BEM GRANDE */}
            <div>
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight drop-shadow-md leading-none">
                {resultado.mensagem}
              </h1>
              <p className="text-sm sm:text-base font-bold opacity-90 mt-2">
                Horário da Leitura: {resultado.dataHora}
              </p>
            </div>

            {/* Informações detalhadas do ingresso */}
            {resultado.ingresso && (
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-4 text-slate-950">
                {/* Titular */}
                <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-black/10">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                    Titular / Portador
                  </span>
                  <h3 className="text-xl font-black text-slate-900 leading-tight mt-1">
                    {resultado.ingresso.titularNome}
                  </h3>
                  <p className="text-xs font-mono font-bold text-slate-600 mt-1">
                    CPF: {formatarCpfMascarado(resultado.ingresso.titularCpf)}
                  </p>
                </div>

                {/* Espetáculo / Sessão */}
                <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-black/10">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                    Espetáculo e Sessão
                  </span>
                  <h3 className="text-lg font-black text-slate-900 leading-tight mt-1">
                    {resultado.ingresso.espetaculo}
                  </h3>
                  <p className="text-xs font-black text-indigo-700 mt-1">
                    {resultado.ingresso.dataShow} às {resultado.ingresso.horarioShow}
                  </p>
                </div>

                {/* Localização do Assento */}
                <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-black/10">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                    Assento e Setor
                  </span>
                  <h3 className="text-base font-black text-slate-900 leading-tight mt-1">
                    {resultado.ingresso.setor}
                  </h3>
                  <p className="text-sm font-black text-emerald-800 mt-1">
                    Fila {resultado.ingresso.fileira} • Poltrona {resultado.ingresso.assento}
                  </p>
                </div>

                {/* Porta e Código */}
                <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-black/10">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                    Porta e Bilhete
                  </span>
                  <h3 className="text-base font-black text-slate-900 leading-tight mt-1">
                    {resultado.ingresso.portaAcesso || "Porta Geral"}
                  </h3>
                  <p className="text-xs font-mono font-bold text-slate-700 mt-1">
                    {resultado.ingresso.codigoIngresso}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TELA CHEIA DO LEITOR DE CÂMERA COM SCANNER LASER VERMELHO      */}
      {/* ============================================================== */}
      {cameraAtiva && (
        <div className="fixed inset-0 z-40 bg-black flex flex-col items-center justify-between p-4 sm:p-6 select-none animate-in fade-in duration-200">
          {/* Header Superior da Câmera Tela Cheia */}
          <div className="w-full flex items-center justify-between text-white z-10">
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
              <span className="size-3 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-black uppercase tracking-wider">Câmera Ativa • Leitura Contínua</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={stopCamera}
              className="bg-black/60 hover:bg-black/80 text-white border-white/20 font-bold rounded-full gap-1.5"
            >
              <Minimize2 className="size-4" /> Sair da Tela Cheia
            </Button>
          </div>

          {/* Área Central: Vídeo da Câmera + Mira com Feixe Laser Vermelho */}
          <div className="relative w-full max-w-md aspect-square flex items-center justify-center my-auto">
            {/* Feed real de vídeo do html5-qrcode */}
            <div id="reader-camera-fullscreen" className="w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-white/10" />

            {/* Quadrado de Mira do Leitor de QR Code */}
            <div className="absolute inset-8 sm:inset-12 pointer-events-none border-2 border-dashed border-white/60 rounded-3xl flex items-center justify-center overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]">
              {/* Feixe Laser Vermelho animado simulando leitor profissional */}
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_15px_#f43f5e] animate-pulse absolute animate-bounce" />

              {/* Cantoneiras de enquadramento */}
              <div className="absolute top-2 left-2 size-6 border-t-4 border-l-4 border-rose-500 rounded-tl-lg" />
              <div className="absolute top-2 right-2 size-6 border-t-4 border-r-4 border-rose-500 rounded-tr-lg" />
              <div className="absolute bottom-2 left-2 size-6 border-b-4 border-l-4 border-rose-500 rounded-bl-lg" />
              <div className="absolute bottom-2 right-2 size-6 border-b-4 border-r-4 border-rose-500 rounded-br-lg" />
            </div>

            {/* Instrução Flutuante */}
            <div className="absolute -bottom-10 bg-black/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-white text-xs font-semibold">
              Aponte o QR Code para dentro da mira
            </div>
          </div>

          {/* Rodapé da Câmera */}
          <div className="w-full max-w-md flex items-center justify-center z-10">
            <Button
              onClick={stopCamera}
              className="w-full h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-xl text-sm"
            >
              <CameraOff className="size-4 mr-2" /> Encerrar Câmera
            </Button>
          </div>
        </div>
      )}

      {/* Topo / Header Geral da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <ShieldCheck className="size-8 text-indigo-600" />
            Portaria: Controle de Acesso
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Validação instantânea com câmera em tela cheia, leitor de código de barras e teclado.
          </p>
        </div>

        {historicoRecente.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleLimparHistorico}
            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 self-start sm:self-auto"
          >
            <Trash2 className="size-3.5 mr-1.5" />
            Zerar Histórico
          </Button>
        )}
      </div>

      {/* Cards de Métricas da Portaria */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Entradas Validadas</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{totaisHoje.validados}</p>
            </div>
            <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Recusados / Já Utilizados</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{totaisHoje.recusados}</p>
            </div>
            <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <AlertTriangle className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Total de Leituras</p>
              <p className="text-2xl font-black text-foreground mt-1">{totaisHoje.validados + totaisHoje.recusados}</p>
            </div>
            <div className="size-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
              <QrCode className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3 ABAS BEM DEFINIDAS */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-4">
        <TabsList className="grid grid-cols-3 h-12 w-full max-w-xl mx-auto p-1 bg-muted rounded-xl">
          <TabsTrigger value="leitura" className="font-bold text-xs gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary shadow-2xs">
            <ScanLine className="size-4" />
            Leitura / Scanner
          </TabsTrigger>
          <TabsTrigger value="digitar" className="font-bold text-xs gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary shadow-2xs">
            <Keyboard className="size-4" />
            Digitar Código
          </TabsTrigger>
          <TabsTrigger value="historico" className="font-bold text-xs gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary shadow-2xs">
            <History className="size-4" />
            Histórico ({historicoRecente.length})
          </TabsTrigger>
        </TabsList>

        {/* ============================================================== */}
        {/* ABA 1: LEITURA (SCANNER VIA CÂMERA OU PISTOLA USB/BLUETOOTH)    */}
        {/* ============================================================== */}
        <TabsContent value="leitura" className="space-y-6">
          <Card className="border-border bg-card overflow-hidden shadow-sm">
            <CardHeader className="pb-3 bg-muted/40 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <ScanLine className="size-5 text-indigo-600" />
                  Scanner de Ingressos
                </CardTitle>
                <CardDescription className="text-xs">
                  Abra a câmera em tela cheia com mira laser ou use a pistola leitora de código de barras.
                </CardDescription>
              </div>

              <Button
                size="sm"
                onClick={startCamera}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-2 shadow-md h-10 px-4 rounded-xl"
              >
                <Maximize2 className="size-4" /> Abrir Câmera em Tela Cheia
              </Button>
            </CardHeader>

            <CardContent className="p-6">
              <div className="text-center py-8 border-2 border-dashed rounded-2xl bg-muted/20 mb-6">
                <QrCode className="size-14 text-indigo-600/70 mx-auto mb-3 animate-pulse" />
                <h3 className="text-base font-black text-foreground">
                  Leitor de Código de Barras / QR Code Pronto
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                  Aponte sua pistola leitora USB ou Bluetooth para ler instantaneamente. Ou clique no botão acima para abrir a câmera em tela cheia com mira e feixe laser.
                </p>

                <div className="mt-4">
                  <Button
                    onClick={startCamera}
                    className="bg-primary hover:bg-primary/90 text-white font-bold text-xs gap-2 rounded-xl"
                  >
                    <Camera className="size-4" /> Ativar Câmera (Tela Cheia)
                  </Button>
                </div>
              </div>

              {/* Input para Leitor de Código de Barras */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleValidarCodigo();
                }}
                className="flex gap-2"
              >
                <div className="relative flex-1">
                  <ScanLine className="size-5 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="Clique aqui e bipe com o leitor de código de barras..."
                    value={codigoInput}
                    onChange={(e) => setCodigoInput(e.target.value)}
                    autoFocus
                    className="pl-11 h-12 text-base font-mono font-bold tracking-wide rounded-xl border-border"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md text-sm shrink-0"
                >
                  {loading ? <RefreshCw className="size-4 animate-spin mr-2" /> : <ShieldCheck className="size-4 mr-2" />}
                  Bipar
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* ABA 2: DIGITAR CÓDIGO MANUALMENTE                              */}
        {/* ============================================================== */}
        <TabsContent value="digitar" className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Keyboard className="size-5 text-primary" />
                Digitação Manual de Código
              </CardTitle>
              <CardDescription className="text-xs">
                Digite o código alfanumérico do ingresso (ex: TKT-2026-GOI-001). A caixa com o resultado aparecerá bem na frente e sumirá após 5 segundos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleValidarCodigo();
                }}
                className="space-y-4 max-w-md mx-auto py-4"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">
                    Código do Bilhete
                  </label>
                  <Input
                    placeholder="Ex: TKT-2026-GOI-001"
                    value={codigoInput}
                    onChange={(e) => setCodigoInput(e.target.value)}
                    autoFocus
                    className="h-12 text-center text-lg font-mono font-bold uppercase tracking-wider rounded-xl"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || !codigoInput.trim()}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-base shadow-md"
                >
                  {loading ? <RefreshCw className="size-4 animate-spin mr-2" /> : <ShieldCheck className="size-5 mr-2" />}
                  Validar Código
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* ABA 3: HISTÓRICO COM NOME, CPF MASCARADO E HORÁRIO             */}
        {/* ============================================================== */}
        <TabsContent value="historico" className="space-y-4">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <History className="size-5 text-primary" />
                  Histórico de Validações da Portaria ({historicoRecente.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  Registro ordenado com nome do titular, CPF protegido e horário exato da leitura.
                </CardDescription>
              </div>

              {historicoRecente.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLimparHistorico}
                  className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                >
                  <Trash2 className="size-3.5 mr-1" />
                  Limpar
                </Button>
              )}
            </CardHeader>

            <CardContent>
              {historicoRecente.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-xl">
                  <Clock className="size-10 text-muted-foreground mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-semibold text-muted-foreground">
                    Nenhuma validação registrada ainda nesta sessão.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-muted/70 text-muted-foreground uppercase font-bold text-[10px] border-b">
                      <tr>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Titular do Ingresso</th>
                        <th className="py-3 px-4">CPF (Ofuscado)</th>
                        <th className="py-3 px-4">Código</th>
                        <th className="py-3 px-4">Assento / Setor</th>
                        <th className="py-3 px-4 text-right">Horário de Leitura</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-medium">
                      {historicoRecente.map((hist, idx) => (
                        <tr key={idx} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4">
                            {hist.status === "valido" && (
                              <Badge className="bg-emerald-600 text-white font-bold text-[10px]">
                                LIBERADO
                              </Badge>
                            )}
                            {hist.status === "ja_utilizado" && (
                              <Badge className="bg-amber-500 text-slate-950 font-bold text-[10px]">
                                JÁ VALIDADO
                              </Badge>
                            )}
                            {hist.status === "invalido" && (
                              <Badge className="bg-rose-600 text-white font-bold text-[10px]">
                                INVÁLIDO
                              </Badge>
                            )}
                            {hist.status === "cancelado" && (
                              <Badge className="bg-rose-700 text-white font-bold text-[10px]">
                                CANCELADO
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-foreground">
                              {hist.ingresso?.titularNome || "Não identificado"}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                            {formatarCpfMascarado(hist.ingresso?.titularCpf)}
                          </td>
                          <td className="py-3 px-4 font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                            {hist.ingresso?.codigoIngresso || "-"}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {hist.ingresso?.assento ? (
                              <span>
                                {hist.ingresso.setor} • Fila {hist.ingresso.fileira} - {hist.ingresso.assento}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                            {hist.dataHora}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
