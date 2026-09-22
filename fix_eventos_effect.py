import sys

with open('src/routes/_authenticated/eventos.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

bad_effect = '''  useEffect(() => {
    if (turneId && turneId !== 'none') {
      const t = tours.find(x => x.id === turneId);
      if (t) {
        if (t.produtora_nome) setProdutoraNome(t.produtora_nome);
        if (t.logo_producao_url) setProdutoraLogoUrl(t.logo_producao_url);
      }
    }
  }, [turneId, tours]);'''

good_effect = '''  const [todasApresentacoes, setTodasApresentacoes] = useState<any[]>([]);

  useEffect(() => {
    if (turneId && turneId !== 'none') {
      const t = tours.find(x => x.id === turneId);
      if (t) {
        if (t.produtora_nome) setProdutoraNome(t.produtora_nome);
        if (t.logo_producao_url) setProdutoraLogoUrl(t.logo_producao_url);
      }
    }
  }, [turneId, tours]);'''

c = c.replace(bad_effect, '')
c = c.replace('const [todasApresentacoes, setTodasApresentacoes] = useState<any[]>([]);', good_effect)

with open('src/routes/_authenticated/eventos.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
