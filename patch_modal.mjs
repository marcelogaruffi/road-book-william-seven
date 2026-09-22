import fs from 'fs';

let evt = fs.readFileSync('src/routes/_authenticated/eventos.tsx', 'utf-8');

// Update DialogHeader
const oldHeaderRegex = /<DialogHeader>\s*<DialogTitle className="text-2xl font-black">\{editingId \? 'Editar Evento' : 'Novo Evento'\}<\/DialogTitle>\s*<\/DialogHeader>/;

const newHeader = `<DialogHeader>
              <div className="flex items-center justify-between pr-4">
                <DialogTitle className="text-2xl font-black">
                  {viewMode ? 'Informações do Evento' : (editingId ? 'Editar Evento' : 'Novo Evento')}
                </DialogTitle>
                {viewMode && canEdit && (
                  <Button variant="outline" size="sm" onClick={() => setViewMode(false)} className="rounded-lg font-bold h-8 px-3 text-indigo-600 border-indigo-200 hover:bg-indigo-50 shadow-sm mt-1">
                    <Edit className="size-3.5 mr-1" /> Editar
                  </Button>
                )}
              </div>
            </DialogHeader>`;

evt = evt.replace(oldHeaderRegex, newHeader);

// Update DialogFooter
const oldFooterRegex = /<DialogFooter className="mt-4 gap-2">[\s\S]*?<\/DialogFooter>/;

const newFooter = `<DialogFooter className="mt-4 gap-2">
              <Button variant="outline" onClick={() => setShowCachǦǦesDialog(true)} className="rounded-xl h-12 px-6 font-bold mr-auto bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-200">
                💰 Cachês da Equipe
              </Button>
              {viewMode ? (
                <Button onClick={() => setOpenDialog(false)} className="rounded-xl h-12 px-8 font-bold shadow-md bg-indigo-600 hover:bg-indigo-700 text-white">
                  Fechar
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setOpenDialog(false)} className="rounded-xl h-12 px-6 font-bold">
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} className="rounded-xl h-12 px-8 font-bold shadow-md">
                    <Save className="size-4 mr-2"/> Salvar Evento
                  </Button>
                </>
              )}
            </DialogFooter>`;

evt = evt.replace(oldFooterRegex, newFooter);

fs.writeFileSync('src/routes/_authenticated/eventos.tsx', evt);
console.log("Done");
