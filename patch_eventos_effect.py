import sys

with open('src/routes/_authenticated/eventos.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

effect = '''
  useEffect(() => {
    if (turneId && turneId !== 'none') {
      const t = tours.find(x => x.id === turneId);
      if (t) {
        if (t.produtora_nome) setProdutoraNome(t.produtora_nome);
        if (t.logo_producao_url) setProdutoraLogoUrl(t.logo_producao_url);
      }
    }
  }, [turneId, tours]);
'''

if 'setProdutoraLogoUrl(t.logo_producao_url)' not in c:
    target = 'const [todasApresentacoes, setTodasApresentacoes] = useState<any[]>([]);'
    if target in c:
        c = c.replace(target, target + '\n' + effect)
        with open('src/routes/_authenticated/eventos.tsx', 'w', encoding='utf-8') as f:
            f.write(c)
        print('Injected useEffect in eventos.tsx')
    else:
        print('Target not found in eventos.tsx')
