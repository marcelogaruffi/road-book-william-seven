import React, { useState, useEffect } from "react";
import { 
  Accessibility, ZoomIn, ZoomOut, Contrast, 
  EyeOff, Eye, Play, Pause, ChevronRight, X 
} from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

export function AccessibilityWidget() {
  const [mounted, setMounted] = useState(false);
  
  // Settings State
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("normal");
  const [highContrast, setHighContrast] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [readingMode, setReadingMode] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load from local storage
    const saved = localStorage.getItem("a11y-settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.fontSize) setFontSize(parsed.fontSize);
        if (typeof parsed.highContrast === "boolean") setHighContrast(parsed.highContrast);
        if (typeof parsed.reduceMotion === "boolean") setReduceMotion(parsed.reduceMotion);
        if (typeof parsed.readingMode === "boolean") setReadingMode(parsed.readingMode);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Save to local storage
    localStorage.setItem("a11y-settings", JSON.stringify({ fontSize, highContrast, reduceMotion, readingMode }));

    // Apply to HTML element
    const html = document.documentElement;
    
    // Font Size
    html.classList.remove("text-base", "text-lg", "text-xl", "a11y-large", "a11y-xlarge");
    if (fontSize === "large") html.classList.add("a11y-large");
    if (fontSize === "xlarge") html.classList.add("a11y-xlarge");

    // High Contrast
    if (highContrast) {
      html.classList.add("a11y-high-contrast");
    } else {
      html.classList.remove("a11y-high-contrast");
    }

    // Reduce Motion
    if (reduceMotion) {
      html.classList.add("a11y-reduce-motion");
    } else {
      html.classList.remove("a11y-reduce-motion");
    }

    // Reading Mode
    if (readingMode) {
      html.classList.add("a11y-reading-mode");
    } else {
      html.classList.remove("a11y-reading-mode");
    }
  }, [fontSize, highContrast, reduceMotion, readingMode, mounted]);

  if (!mounted) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            size="icon" 
            className="size-14 rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700 text-white border-4 border-white dark:border-slate-900 transition-transform hover:scale-110 active:scale-95 flex items-center justify-center"
            title="Ferramentas de Acessibilidade"
          >
            <Accessibility className="size-6" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          align="end" 
          sideOffset={16}
          className="w-80 rounded-2xl p-0 overflow-hidden shadow-2xl border-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl"
        >
          <div className="bg-blue-600 p-4 text-white">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Accessibility className="size-5" /> Acessibilidade
            </h3>
            <p className="text-blue-100 text-sm mt-1">Ajuste o sistema para a sua necessidade.</p>
          </div>

          <div className="p-4 space-y-5">
            {/* Font Size */}
            <div className="space-y-3">
              <Label className="text-slate-500 font-bold uppercase text-xs tracking-wider">Tamanho do Texto</Label>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <Button 
                  variant={fontSize === "normal" ? "default" : "ghost"} 
                  className={`flex-1 rounded-lg ${fontSize === "normal" ? "bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}
                  onClick={() => setFontSize("normal")}
                >
                  Aa
                </Button>
                <Button 
                  variant={fontSize === "large" ? "default" : "ghost"} 
                  className={`flex-1 rounded-lg text-lg ${fontSize === "large" ? "bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}
                  onClick={() => setFontSize("large")}
                >
                  Aa
                </Button>
                <Button 
                  variant={fontSize === "xlarge" ? "default" : "ghost"} 
                  className={`flex-1 rounded-lg text-xl font-bold ${fontSize === "xlarge" ? "bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}
                  onClick={() => setFontSize("xlarge")}
                >
                  Aa
                </Button>
              </div>
            </div>

            <hr className="border-slate-100 dark:border-white/5" />

            {/* Toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-lg dark:bg-amber-500/20 dark:text-amber-400">
                    <Contrast className="size-4" />
                  </div>
                  <Label htmlFor="a11y-contrast" className="font-semibold cursor-pointer">Alto Contraste</Label>
                </div>
                <Switch 
                  id="a11y-contrast" 
                  checked={highContrast} 
                  onCheckedChange={setHighContrast} 
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg dark:bg-emerald-500/20 dark:text-emerald-400">
                    {reduceMotion ? <Pause className="size-4" /> : <Play className="size-4" />}
                  </div>
                  <Label htmlFor="a11y-motion" className="font-semibold cursor-pointer">Reduzir Animações</Label>
                </div>
                <Switch 
                  id="a11y-motion" 
                  checked={reduceMotion} 
                  onCheckedChange={setReduceMotion} 
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-lg dark:bg-purple-500/20 dark:text-purple-400">
                    {readingMode ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </div>
                  <Label htmlFor="a11y-reading" className="font-semibold cursor-pointer">Modo Foco / Leitura</Label>
                </div>
                <Switch 
                  id="a11y-reading" 
                  checked={readingMode} 
                  onCheckedChange={setReadingMode} 
                />
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full mt-2 rounded-xl text-slate-500 font-bold"
              onClick={() => {
                setFontSize("normal");
                setHighContrast(false);
                setReduceMotion(false);
                setReadingMode(false);
              }}
            >
              Restaurar Padrões
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
