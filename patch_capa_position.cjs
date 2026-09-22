const fs = require('fs');

let content = fs.readFileSync('src/routes/_authenticated/espetaculos.tsx', 'utf-8');

const oldBanner = `{/* Banner */}
        <div className="relative h-64 bg-slate-900 shrink-0 flex items-end px-4 sm:px-12 py-8 border-b-4 border-primary">
          {currentShow.assets_midia?.capa_url ? (
            <img src={currentShow.assets_midia.capa_url} className="absolute inset-0 w-full h-full object-cover" />
          ) : currentShow.logo_espetaculo_url ? (
            <img src={currentShow.logo_espetaculo_url} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm mix-blend-screen" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
          
          <Button variant="secondary" size="sm" onClick={() => setView("list")} className="absolute top-6 left-6 font-bold z-20">
            <ChevronLeft className="size-4 mr-1"/> Voltar para Lista
          </Button>`;

const newBanner = `{/* Banner */}
        <div className="relative h-64 bg-slate-900 shrink-0 flex items-end px-4 sm:px-12 py-8 border-b-4 border-primary">
          {currentShow.assets_midia?.capa_url ? (
            <img src={currentShow.assets_midia.capa_url} style={{ objectPosition: \`center \${currentShow.assets_midia?.capa_pos_y ?? 50}%\` }} className="absolute inset-0 w-full h-full object-cover" />
          ) : currentShow.logo_espetaculo_url ? (
            <img src={currentShow.logo_espetaculo_url} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm mix-blend-screen" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
          
          <Button variant="secondary" size="sm" onClick={() => setView("list")} className="absolute top-6 left-6 font-bold z-20">
            <ChevronLeft className="size-4 mr-1"/> Voltar para Lista
          </Button>

          {currentShow.assets_midia?.capa_url && (
            <div className="absolute top-6 right-6 z-20 flex gap-3 items-center bg-black/60 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 shadow-lg">
              <span className="text-white text-xs font-bold uppercase tracking-wider">Ajustar Posição</span>
              <input 
                type="range" 
                min="0" max="100" 
                value={currentShow.assets_midia?.capa_pos_y ?? 50} 
                onChange={(e) => {
                   const y = parseInt(e.target.value);
                   setCurrentShow(s => ({...s, assets_midia: {...(s.assets_midia||{}), capa_pos_y: y}}));
                }}
                onMouseUp={async (e) => {
                   const y = parseInt((e.target as HTMLInputElement).value);
                   await supabase.from("templates_espetaculos").update({ assets_midia: {...currentShow.assets_midia, capa_pos_y: y} }).eq("nome_espetaculo", currentShow.nome_espetaculo);
                   toast.success("Posição salva!");
                }}
                onTouchEnd={async (e) => {
                   const y = parseInt((e.target as HTMLInputElement).value);
                   await supabase.from("templates_espetaculos").update({ assets_midia: {...currentShow.assets_midia, capa_pos_y: y} }).eq("nome_espetaculo", currentShow.nome_espetaculo);
                   toast.success("Posição salva!");
                }}
                className="w-32 accent-white h-1.5 bg-white/20 rounded-lg appearance-none cursor-ew-resize" 
              />
            </div>
          )}`;

content = content.replace(oldBanner, newBanner);

fs.writeFileSync('src/routes/_authenticated/espetaculos.tsx', content);
