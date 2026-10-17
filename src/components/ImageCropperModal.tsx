import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Crop, ZoomIn, RotateCcw, Check, X, Image as ImageIcon, Move } from "lucide-react";

interface ImageCropperModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedBase64: string) => void;
  aspectRatio?: number; // Largura / Altura, padrão 2.4 (1200 x 500)
  targetWidth?: number; // Padrão 1200
  targetHeight?: number; // Padrão 500
}

export function ImageCropperModal({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
  aspectRatio = 2.4, // 1200 / 500
  targetWidth = 1200,
  targetHeight = 500,
}: ImageCropperModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgObj, setImgObj] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Carregar imagem
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      setImgObj(img);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };
  }, [imageSrc]);

  // Arrastar para enquadrar
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch em smartphones e tablets
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Processar o corte no Canvas gerando a imagem de 1200x500px em alta definição
  const handleConfirmCrop = () => {
    if (!imgObj || !containerRef.current) return;

    const cropBox = containerRef.current.getBoundingClientRect();
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Fundo limpo
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // Fator de escala do container da tela para o canvas final de 1200x500
    const scaleFactor = targetWidth / cropBox.width;

    // O container exibe a imagem dimensionada por baseScale
    const baseScale = Math.max(cropBox.width / imgObj.naturalWidth, cropBox.height / imgObj.naturalHeight);
    const renderW = imgObj.naturalWidth * baseScale * zoom;
    const renderH = imgObj.naturalHeight * baseScale * zoom;

    // Centro do recorte
    const centerX = cropBox.width / 2 + pan.x;
    const centerY = cropBox.height / 2 + pan.y;

    const imgDrawX = (centerX - renderW / 2) * scaleFactor;
    const imgDrawY = (centerY - renderH / 2) * scaleFactor;
    const imgDrawW = renderW * scaleFactor;
    const imgDrawH = renderH * scaleFactor;

    ctx.drawImage(imgObj, imgDrawX, imgDrawY, imgDrawW, imgDrawH);

    const croppedBase64 = canvas.toDataURL("image/jpeg", 0.95);
    onCropComplete(croppedBase64);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-xl p-5 bg-card border border-border shadow-2xl rounded-2xl overflow-hidden">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base font-black flex items-center gap-2">
            <Crop className="size-5 text-indigo-500" />
            Ajustar e Enquadrar Foto do Ingresso
          </DialogTitle>
          <DialogDescription className="text-xs">
            Arraste com o mouse para enquadrar e use o slider para calibrar na proporção oficial de <strong>1200 x 500 px (2.4:1)</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Caixa de visualização com proporção e limites estritos */}
          <div 
            ref={containerRef}
            style={{ 
              aspectRatio: `${aspectRatio} / 1`,
              maxHeight: "260px"
            }}
            className="relative w-full overflow-hidden rounded-xl bg-slate-950 border-2 border-indigo-500 shadow-inner flex items-center justify-center select-none cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => setIsDragging(false)}
          >
            {imgObj ? (
              <div
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: "center center",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none"
                }}
                className="transition-transform duration-75"
              >
                <img
                  src={imageSrc}
                  alt="Pré-visualização para corte"
                  draggable={false}
                  className="w-full h-full object-cover select-none pointer-events-none"
                />
              </div>
            ) : (
              <div className="text-slate-500 flex flex-col items-center gap-1.5 py-12">
                <ImageIcon className="size-8 opacity-40 animate-pulse" />
                <span className="text-xs">Carregando imagem...</span>
              </div>
            )}

            {/* Grid dos Terços suave para facilitar o enquadramento */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/20">
              <div className="border-r border-b border-white/10" />
              <div className="border-r border-b border-white/10" />
              <div className="border-b border-white/10" />
              <div className="border-r border-b border-white/10" />
              <div className="border-r border-b border-white/10" />
              <div className="border-b border-white/10" />
              <div className="border-r border-white/10" />
              <div className="border-r border-white/10" />
              <div />
            </div>

            {/* Badge de Dica Superior */}
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-medium text-white/90 border border-white/10 pointer-events-none">
              <Move className="size-3 text-indigo-400" />
              Arraste para mover
            </div>

            <div className="absolute top-2 right-2 bg-indigo-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono font-bold text-indigo-200 border border-indigo-400/30 pointer-events-none">
              1200 x 500 (2.4:1)
            </div>
          </div>

          {/* Barra de Controles: Zoom e Reset */}
          <div className="bg-muted/40 p-3 rounded-xl border border-border flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground shrink-0">
              <ZoomIn className="size-4 text-indigo-500" />
              Zoom
            </div>
            <div className="flex-1">
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.05}
                onValueChange={(val) => setZoom(val[0])}
                className="cursor-pointer"
              />
            </div>
            <span className="text-xs font-mono font-bold text-foreground w-12 text-right">
              {zoom.toFixed(2)}x
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-8 px-2.5 text-xs gap-1 border-border shrink-0 font-medium"
              title="Restaurar posição original"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </Button>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs font-semibold"
          >
            <X className="size-3.5 mr-1" />
            Cancelar
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleConfirmCrop}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 px-4"
          >
            <Check className="size-3.5 mr-1.5" />
            Aplicar Enquadramento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
