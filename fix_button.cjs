const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/malas.$evento_id.tsx', 'utf8');

const target = `              })}
            </div>
          </div>`;
const add = `              })}
            </div>
            <div className="flex justify-center mt-8">
              <Button onClick={handleAddExtraVolume} variant="outline" className="border-dashed border-2 border-slate-300 dark:border-slate-700 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 h-14 rounded-2xl px-8 shadow-none">
                <Luggage className="size-5 mr-2" />
                Adicionar Nova Mala (Volume Extra)
              </Button>
            </div>
          </div>`;

content = content.replace(target, add);
fs.writeFileSync('src/routes/_authenticated/malas.$evento_id.tsx', content, 'utf8');
