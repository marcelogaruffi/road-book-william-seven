const fs = require('fs');

function fixPage(file, tableName, pathName) {
  let code = fs.readFileSync(file, 'utf8');
  
  // Find where GridEventos is rendered and replace its onSelect
  // But wait, we need to add the handleGridSelect function inside the component.
  // The component is always something like `function SomComponent() {`
  
  const handleCode = `
  const handleGridSelect = async (id: string, rbId?: string | null, ev?: any) => {
    // Check if map exists
    const { data } = await supabase.from('${tableName}').select('id, apresentacao_id').eq('apresentacao_id', id).maybeSingle();
    if (data) {
      navigate({ to: '/${pathName}/' + id });
    } else {
      // Need to create
      setInitDialogEvento(ev || { id, evento_id: id, cidade: '', espetaculo: '', data: '' });
    }
  };
  `;
  
  // Inject handleGridSelect after `const navigate = useNavigate();`
  code = code.replace(/const navigate = useNavigate\(\);/, 'const navigate = useNavigate();\n' + handleCode);
  
  // Replace the GridEventos call
  // <GridEventos onSelect={(id) => window.location.href = `/som/${id}`} />
  code = code.replace(/<GridEventos onSelect=\{\(id\) => window\.location\.href = `\/${pathName}\/\$\{id\}`\} \/>/g, '<GridEventos onSelect={handleGridSelect} />');
  // Also handle cases where it might use navigate
  code = code.replace(/<GridEventos onSelect=\{\(id\) => navigate\(\{ to: `\/${pathName}\/\$\{id\}` \}\)\} \/>/g, '<GridEventos onSelect={handleGridSelect} />');
  
  fs.writeFileSync(file, code, 'utf8');
}

fixPage('src/routes/_authenticated/som.index.tsx', 'mapas_som', 'som');
fixPage('src/routes/_authenticated/video.index.tsx', 'mapas_video', 'video');
fixPage('src/routes/_authenticated/som-operacao.index.tsx', 'operacao_som_mapas', 'som-operacao');
fixPage('src/routes/_authenticated/iluminacao.index.tsx', 'mapas_luz', 'iluminacao');
