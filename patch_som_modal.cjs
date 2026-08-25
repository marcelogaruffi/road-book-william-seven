const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/som.index.tsx', 'utf8');

// 1. Add new imports
const importsToAdd = `
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
`;
code = code.replace("import { toast } from 'sonner';", "import { toast } from 'sonner';" + importsToAdd);

// 2. Add states inside SomComponent
const statesToAdd = `
  const [initDialogEvento, setInitDialogEvento] = useState<Evento | null>(null);
  const [initMode, setInitMode] = useState<'zero' | 'padrao' | 'clonar'>('zero');
  const [selectedPadrao, setSelectedPadrao] = useState<string>('');
  const [selectedCloneId, setSelectedCloneId] = useState<string>('');
  const [templatesDisponiveis, setTemplatesDisponiveis] = useState<any[]>([]);
  
  // Fetch templates when dialog opens
  useEffect(() => {
    if (initDialogEvento) {
      supabase.from('templates_espetaculos').select('nome_espetaculo').order('nome_espetaculo').then(({ data }) => {
        if (data) setTemplatesDisponiveis(data);
      });
      setInitMode('zero');
      setSelectedPadrao('');
      setSelectedCloneId('');
    }
  }, [initDialogEvento]);
`;

code = code.replace("const [searchTerm, setSearchTerm] = useState('');", "const [searchTerm, setSearchTerm] = useState('');" + statesToAdd);

// 3. Replace handleCreateOrEdit with the open dialog trigger and confirm function
const oldHandleCreate = /const handleCreateOrEdit = async \(evento: Evento\) => {[\s\S]*?toast\.error.*?\n    \};/;

const newHandleCreate = `
  const handleCreateOrEdit = (evento: Evento) => {
    setInitDialogEvento(evento);
  };

  const confirmInitMapa = async () => {
    if (!initDialogEvento) return;
    const evento = initDialogEvento;
    const { data: userData } = await supabase.auth.getUser();
    const toastId = toast.loading("Iniciando mapa...");

    let initialJsonData = {};

    if (initMode === 'padrao' && selectedPadrao) {
      const { data: templateData } = await supabase
        .from('templates_espetaculos')
        .select('rider_som')
        .eq('nome_espetaculo', selectedPadrao)
        .single();
      
      if (templateData && templateData.rider_som) {
        try {
          initialJsonData = typeof templateData.rider_som === 'string' ? JSON.parse(templateData.rider_som) : templateData.rider_som;
        } catch (e) {
          initialJsonData = { notas_gerais: templateData.rider_som };
        }
      }
    } else if (initMode === 'clonar' && selectedCloneId) {
      const { data: cloneData } = await supabase
        .from('mapas_som')
        .select('json_data')
        .eq('evento_id', selectedCloneId)
        .single();
      if (cloneData && cloneData.json_data) {
        initialJsonData = cloneData.json_data;
      }
    }

    const { data, error } = await supabase.from('mapas_som').insert({
      evento_id: evento.id,
      user_id: userData.user?.id,
      cidade: evento.cidade,
      data_apresentacao: evento.data,
      espetaculo: evento.espetaculo,
      json_data: initialJsonData
    }).select().single();

    if (!error && data) {
      toast.dismiss(toastId);
      window.location.href = \`/som/\${evento.id}\`;
    } else {
      toast.error("Erro ao iniciar mapa: " + (error?.message || "Desconhecido"));
    }
  };
`;

code = code.replace(oldHandleCreate, newHandleCreate);

// 4. Add the Dialog UI at the end of the return statement
const dialogUI = `
      <Dialog open={!!initDialogEvento} onOpenChange={(val) => { if (!val) setInitDialogEvento(null); }}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Iniciar Mapa de Som</DialogTitle>
            <DialogDescription>Como deseja preencher as informações iniciais deste mapa?</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <RadioGroup value={initMode} onValueChange={(val: any) => setInitMode(val)} className="space-y-3">
              <div className="flex items-center space-x-2 bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/10">
                <RadioGroupItem value="zero" id="r-zero" />
                <Label htmlFor="r-zero" className="cursor-pointer font-semibold flex-1">Começar do Zero</Label>
              </div>
              <div className="flex items-center space-x-2 bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/10">
                <RadioGroupItem value="padrao" id="r-padrao" />
                <Label htmlFor="r-padrao" className="cursor-pointer font-semibold flex-1">Importar um Rider Padrão</Label>
              </div>
              {initMode === 'padrao' && (
                <div className="pl-8 -mt-2 animate-in slide-in-from-top-2">
                  <Select value={selectedPadrao} onValueChange={setSelectedPadrao}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um Rider Padrão..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templatesDisponiveis.map(t => (
                        <SelectItem key={t.nome_espetaculo} value={t.nome_espetaculo}>{t.nome_espetaculo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center space-x-2 bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/10">
                <RadioGroupItem value="clonar" id="r-clonar" />
                <Label htmlFor="r-clonar" className="cursor-pointer font-semibold flex-1">Clonar mapa de outro Show</Label>
              </div>
              {initMode === 'clonar' && (
                <div className="pl-8 -mt-2 animate-in slide-in-from-top-2">
                  <Select value={selectedCloneId} onValueChange={setSelectedCloneId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um show já mapeado..." />
                    </SelectTrigger>
                    <SelectContent>
                      {eventos.filter(e => mapas.some(m => m.evento_id === e.id)).map(e => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.espetaculo} - {e.cidade} ({new Date(e.data + 'T12:00:00').toLocaleDateString('pt-BR')})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </RadioGroup>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setInitDialogEvento(null)}>Cancelar</Button>
            <Button onClick={confirmInitMapa} className="bg-blue-600 hover:bg-blue-700 text-white font-bold" disabled={(initMode === 'padrao' && !selectedPadrao) || (initMode === 'clonar' && !selectedCloneId)}>
              Iniciar Mapa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
`;

code = code.replace("    </div>\r\n  );\r\n}", dialogUI);
if (!code.includes('<Dialog open={!!initDialogEvento}')) {
  code = code.replace("    </div>\n  );\n}", dialogUI);
}

fs.writeFileSync('src/routes/_authenticated/som.index.tsx', code);
console.log('som.index patched');
