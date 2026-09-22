const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/imprensa.tsx', 'utf8');

// 1. Remove the microlink fetch from saveClipping completely
const oldSaveCall = /const saveClipping = async \(\) => \{[\s\S]*?const payload = \{ \.\.\.newClipping, link_materia: urlToFetch, thumbnail_url \};/m;

const newSaveCall = `const saveClipping = async () => {
    if (!newClipping.titulo_materia || !newClipping.veiculo || !newClipping.data_publicacao) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    
    let urlToFetch = newClipping.link_materia;
    if (urlToFetch && !urlToFetch.startsWith('http')) {
       urlToFetch = 'https://' + urlToFetch;
    }

    const payload: any = { ...newClipping, link_materia: urlToFetch };
    // Remove thumbnail_url da payload, vamos renderizar on-the-fly`;

code = code.replace(oldSaveCall, newSaveCall);

// 2. Fix the card rendering to use Microlink dynamically on the img tag!
// AND fix the array crash (Array.isArray(clip.tags))
// AND fix the link formatting.
const oldCardPattern = /<Card key=\{clip\.id\} className="border-0 shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden flex flex-col md:flex-row relative group">[\s\S]*?<\/Card>/g;

const newCardPattern = `<Card key={clip.id} className="border-0 shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden flex flex-col md:flex-row relative group">
                  {clip.link_materia && (
                    <div className="w-full md:w-48 h-32 md:h-auto bg-slate-100 shrink-0">
                      <img src={\`https://api.microlink.io?url=\${encodeURIComponent(clip.link_materia)}&embed=image.url\`} onError={(e) => { e.currentTarget.style.display = 'none'; }} alt="Thumbnail" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4 flex-1 flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <span className="text-xl">{sentimentEmoji}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-800 dark:text-slate-100">{clip.titulo_materia}</h3>
                          <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                            <span className="font-medium text-blue-600">{clip.veiculo}</span>
                            <span>&bull;</span>
                            <span>{new Date(clip.data_publicacao).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                        {isAllowed && (
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-blue-600" onClick={() => editClipping(clip)}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => deleteClipping(clip.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {clip.espetaculo && <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">{clip.espetaculo}</span>}
                        {clip.relevancia_tier && <span className={\`px-2 py-1 text-xs rounded-md font-medium \${tierColor}\`}>{clip.relevancia_tier}</span>}
                        {clip.relevancia_score && <span className="text-xs text-slate-500 font-medium">Score: {clip.relevancia_score}</span>}
                      </div>

                      {Array.isArray(clip.tags) && clip.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {clip.tags.map((t: string) => <span key={t} className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-500 text-[10px] rounded-full uppercase tracking-wider">{t}</span>)}
                        </div>
                      )}

                      {clip.link_materia && (
                        <a href={clip.link_materia.startsWith('http') ? clip.link_materia : 'https://' + clip.link_materia} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-3 font-medium">
                          Ler matéria completa <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </Card>`;

code = code.replace(oldCardPattern, newCardPattern);

// 3. Fix ALL encoding issues aggressively
const map = {
  'Ã§': 'ç', 'Ã¡': 'á', 'Ã¢': 'â', 'Ã£': 'ã', 'Ã©': 'é', 'Ãª': 'ê', 
  'Ã­': 'í', 'Ã³': 'ó', 'Ãµ': 'õ', 'Ãº': 'ú', 'Ã€': 'À', 'Ã ': 'À', 
  'Ã‡': 'Ç', 'Ã‰': 'É', 'Ã“': 'Ó', 'Ãš': 'Ú', 'Ã‚': 'Â', 'Ã”': 'Ô',
  'ðŸŸ¢': '🟢', 'ðŸ”´': '🔴', 'ðŸŸ¡': '🟡', 'ðŸ“ ': '📍', 'ðŸŽ­': '🎭', 
  'ðŸ †': '🏆', 'ðŸ”—': '🔗', 'matÃƒÂ©ria': 'matéria', 'obrigatÃ³rios': 'obrigatórios',
  'PÃºblico': 'Público', 'TÃ­tulo': 'Título', 'VeÃ­culo': 'Veículo', 'RelevÃ¢ncia': 'Relevância',
  'atraÃ§Ã£o': 'atração', 'CirculaÃ§Ã£o': 'Circulação', 'apresentaÃ§Ã£o': 'apresentação',
  'pÃºblico': 'público', 'AvaliaÃ§Ã£o': 'Avaliação', 'ComprovaÃ§Ã£o': 'Comprovação',
  'DivulgaÃ§Ã£o': 'Divulgação', 'EspetÃ¡culo': 'Espetáculo', 'RÃ¡dio': 'Rádio',
  'portfÃ³lio': 'portfólio', 'inscriÃ§Ã£o': 'inscrição', 'MatÃ©ria': 'Matéria', 'PublicaÃ§Ã£o': 'Publicação',
  'produÃ§Ãµes': 'produções', 'artÃ­sticas': 'artísticas', 'Ã§Ã£o': 'ção', 'Ã§Ãµes': 'ções',
  'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú', 'Ã¢': 'â', 'Ãª': 'ê', 'Ã®': 'î', 'Ã´': 'ô', 'Ã»': 'û',
  'Ã£': 'ã', 'Ãµ': 'õ', 'Ã§': 'ç', 'Ã': 'À', 'Ã ': 'Á', 'Ã‰': 'É', 'Ã ': 'Í', 'Ã“': 'Ó', 'Ãš': 'Ú',
};

for (const [bad, good] of Object.entries(map)) {
  code = code.split(bad).join(good);
}

fs.writeFileSync('src/routes/_authenticated/imprensa.tsx', code, 'utf8');
console.log("Patched architecture!");
