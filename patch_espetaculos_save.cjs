const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/espetaculos.tsx', 'utf-8');

// 1. Remove blue filter from cover photos
const oldBannerImage = `<img src={currentShow.assets_midia.capa_url} className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay" />`;
const newBannerImage = `<img src={currentShow.assets_midia.capa_url} className="absolute inset-0 w-full h-full object-cover" />`;
content = content.replace(oldBannerImage, newBannerImage);

// 2. Add Save button to all steps
const oldButtons = `{step < totalSteps ? (
                <Button size="sm" onClick={() => setStep(step + 1)} className="font-bold bg-primary hover:bg-primary/90 text-white shadow-md">
                  Próximo <ChevronRight className="size-4 ml-1" />
                </Button>
              ) : (
                <Button size="sm" onClick={saveWizard} className="font-bold bg-green-500 hover:bg-green-600 text-white shadow-md">
                  <Save className="size-4 mr-2" /> Salvar
                </Button>
              )}`;

const newButtons = `<Button size="sm" variant="outline" onClick={saveWizard} className="font-bold border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 shadow-sm">
                <Save className="size-4 mr-1" /> {step < totalSteps ? "Salvar" : "Finalizar"}
              </Button>
              {step < totalSteps && (
                <Button size="sm" onClick={() => setStep(step + 1)} className="font-bold bg-primary hover:bg-primary/90 text-white shadow-md">
                  Próximo <ChevronRight className="size-4 ml-1" />
                </Button>
              )}`;

content = content.replace(oldButtons, newButtons);

fs.writeFileSync('src/routes/_authenticated/espetaculos.tsx', content);
