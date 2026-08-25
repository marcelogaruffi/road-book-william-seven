const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/som.index.tsx', 'utf8');

const looseRegex = /const handleCreateOrEdit = async \(evento: Evento\) => \{[\s\S]*?console\.error.*?\n\s*\};/;

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
        .select('rider_som, assets_midia')
        .eq('nome_espetaculo', selectedPadrao)
        .single();
      
      if (templateData && templateData.rider_som) {
        try {
          initialJsonData = typeof templateData.rider_som === 'string' ? JSON.parse(templateData.rider_som) : templateData.rider_som;
        } catch (e) {
          initialJsonData = { notas_gerais: templateData.rider_som };
        }
      }
      
      // Inherit assets if present
      if (templateData && templateData.assets_midia) {
        initialJsonData = {
          ...initialJsonData,
          assets_midia: templateData.assets_midia
        };
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

if (looseRegex.test(code)) {
  code = code.replace(looseRegex, newHandleCreate);
  fs.writeFileSync('src/routes/_authenticated/som.index.tsx', code);
  console.log("Success with looseRegex");
} else {
  console.log("Failed to find handleCreateOrEdit with regex");
}
