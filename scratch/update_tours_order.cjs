const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/tour.index.tsx', 'utf8');

// Replace the activeTours/finishedTours logic
const oldLogic = `  const { profile } = AuthedRoute.useRouteContext();
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTours();
  }, []);

  async function fetchTours() {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('tours')
      .select('*, roadbooks(id, data_inicial, data_final, cidade, automacoes)')
      .order('created_at', { ascending: false });
  
    if (error) {
      toast.error("Erro ao buscar turnês: " + error.message);
    } else {
      setTours(data || []);
    }
    setLoading(false);
  }

  async function handleDelete(id: string, name: string) {
    const ok = await customConfirm(
      \`Tem certeza que deseja apagar a turnê "\${name}"? Esta ação não pode ser desfeita.\`
    );
    if (!ok) return;

    const { error } = await supabase.from('tours').delete().eq('id', id);
    if (error) {
      toast.error("Erro ao deletar: " + error.message);
    } else {
      toast.success("Turnê removida com sucesso");
      fetchTours();
    }
  }

  const nowTime = new Date().getTime();
  const activeTours = tours.filter(tour => {
    if (!tour.roadbooks || tour.roadbooks.length === 0) return true;
    const dates = tour.roadbooks.map((rb: any) => rb.data_final || rb.data_inicial).filter(Boolean);
    if (dates.length === 0) return true;
    const latestDate = new Date(Math.max(...dates.map((d: string) => new Date(d + 'T23:59:59').getTime())));
    return latestDate.getTime() >= nowTime;
  });

  const finishedTours = tours.filter(tour => {
    if (!tour.roadbooks || tour.roadbooks.length === 0) return false;
    const dates = tour.roadbooks.map((rb: any) => rb.data_final || rb.data_inicial).filter(Boolean);
    if (dates.length === 0) return false;
    const latestDate = new Date(Math.max(...dates.map((d: string) => new Date(d + 'T23:59:59').getTime())));
    return latestDate.getTime() < nowTime;
  });`;

// Wait, the original content might have different formatting or text (Turn\u00eas vs Turnês).
