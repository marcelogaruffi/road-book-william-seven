const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/som.$evento_id.tsx', 'utf8');

const anchor = `<Button variant="ghost" size="icon" onClick={() => navigate({ to: '/som' })} className="rounded-full">
            <ArrowLeft className="size-5" />
          </Button>`;

const newButtons = `<Button variant="ghost" size="icon" onClick={() => navigate({ to: '/som' })} className="rounded-full">
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex-1" />
          <Button 
            variant="outline" 
            size="sm" 
            className="text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20"
            onClick={async () => {
              if (confirm('Tem certeza que deseja apagar as edições e recomeçar este mapa do zero/modelo? Isso excluirá o mapa atual permanentemente.')) {
                await supabase.from('mapas_som').delete().eq('evento_id', evento_id);
                navigate({ to: '/som' });
              }
            }}
          >
            <Trash2 className="size-4 mr-2" />
            Recomeçar / Trocar Modelo
          </Button>`;

if (code.includes(anchor)) {
  code = code.replace(anchor, newButtons);
  fs.writeFileSync('src/routes/_authenticated/som.$evento_id.tsx', code);
  console.log('Added Recomeçar button!');
} else {
  console.log('Anchor not found');
}
