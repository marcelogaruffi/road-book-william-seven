const fs = require('fs');

const loaderReplacement = `
    const rb = rowToRoadbook(data);
    let logoEspetaculo = rb.logo_espetaculo_override || null;
    let logoProducao = rb.logo_producao_override || null;

    if (!logoEspetaculo) {
      const { data: espData } = await supabase.from('templates_espetaculos').select("logo_espetaculo_url").neq('nome_espetaculo', 'ESTOQUE_GLOBAL').ilike("nome_espetaculo", rb.espetaculo).maybeSingle();
      if (espData) logoEspetaculo = espData.logo_espetaculo_url;
    }

    if (!logoProducao && rb.evento_id) {
      const { data: evData } = await supabase.from("eventos").select("produtora_logo_url").eq("id", rb.evento_id).maybeSingle();
      if (evData?.produtora_logo_url) logoProducao = evData.produtora_logo_url;
    }

    if (!logoProducao && rb.tour_id) {
      const { data: tourData } = await supabase.from("tours").select("logo_producao").eq("id", rb.tour_id).maybeSingle();
      if (tourData) logoProducao = tourData.logo_producao;
    }

    rb._resolved_logos = { logoEspetaculo, logoProducao };
    return rb;
`;

// 1. versao-motorista.$slug.tsx
let vWeb = fs.readFileSync('src/routes/_authenticated/versao-motorista.$slug.tsx', 'utf8');
vWeb = vWeb.replace(/return rowToRoadbook\(data\);/, loaderReplacement.trim());

// replace the logos block
vWeb = vWeb.replace(
    /<div className="flex justify-between items-center gap-6 mb-8 pb-8 border-b border-slate-200\/60 dark:border-slate-800\/60">[\s\S]*?<\/div>\s*<\/div>\s*<div className="flex flex-col md:flex-row/,
`<div className="flex justify-center items-center gap-6 mb-8 pb-8 border-b border-slate-200/60 dark:border-slate-800/60">
              {(rb as any)._resolved_logos?.logoProducao && (
                <img src={(rb as any)._resolved_logos.logoProducao} alt="Produtora" className="h-14 w-auto object-contain dark:brightness-200" />
              )}
              {(rb as any)._resolved_logos?.logoProducao && (rb as any)._resolved_logos?.logoEspetaculo && (
                <div className="w-px h-10 bg-slate-200 dark:bg-white/10"></div>
              )}
              {(rb as any)._resolved_logos?.logoEspetaculo && (
                <img src={(rb as any)._resolved_logos.logoEspetaculo} alt={\`\${rb.espetaculo} Logo\`} className="h-14 w-auto object-contain dark:brightness-200" />
              )}
            </div>
          </div>
          <div className="flex flex-col md:flex-row`
);
fs.writeFileSync('src/routes/_authenticated/versao-motorista.$slug.tsx', vWeb, 'utf8');

// 2. motorista-print.$slug.tsx
let vPrint = fs.readFileSync('src/routes/motorista-print.$slug.tsx', 'utf8');
vPrint = vPrint.replace(/return rowToRoadbook\(data\);/, loaderReplacement.trim());

vPrint = vPrint.replace(
    /<div style=\{\{ borderBottom: '2px solid black', paddingBottom: '15px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' \}\}>[\s\S]*?<\/div>\s*<\/div>\s*<div style=\{\{ display: 'flex'/,
`<div style={{ borderBottom: '2px solid black', paddingBottom: '15px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {(rb as any)._resolved_logos?.logoProducao ? (
            <img src={(rb as any)._resolved_logos.logoProducao} alt="Produtora" style={{ height: '50px', objectFit: 'contain' }} />
          ) : (
            <div style={{ width: '50px' }}></div>
          )}
          
          <div style={{ textAlign: 'center', flex: 1, padding: '0 20px' }}>
            <h1 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: '900', textTransform: 'uppercase' }}>{rb.espetaculo}</h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#333' }}>
              {rb.cidade && <span>{rb.cidade}{rb.estado ? \`/\${rb.estado}\` : ""}</span>}
            </p>
          </div>
          
          {(rb as any)._resolved_logos?.logoEspetaculo ? (
            <img src={(rb as any)._resolved_logos.logoEspetaculo} alt="Espetáculo" style={{ height: '50px', objectFit: 'contain' }} />
          ) : (
            <div style={{ width: '50px' }}></div>
          )}
        </div>
      </div>
      
      <div style={{ display: 'flex'`
);
fs.writeFileSync('src/routes/motorista-print.$slug.tsx', vPrint, 'utf8');

console.log("Done");
