import re

def modify_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the double loader insertion and fix it
    pattern = r'const rb = rowToRoadbook\(data\);\s*let logoEspetaculo = rb\.logo_espetaculo_override \|\| null;.*?// We attach them to the rb object to pass to the component\s*\(rb as any\)\._resolved_logos = \{ logoEspetaculo, logoCia, logoProducao \};\s*let logoEspetaculo = rb\.logo_espetaculo_override \|\| null;'
    
    if 'let logoEspetaculo = rb.logo_espetaculo_override || null;' in content:
        # Just replace everything between rowToRoadbook(data); and `return rb;` with the correct single block
        content = re.sub(r'const rb = rowToRoadbook\(data\);.*?return rb;', '''const rb = rowToRoadbook(data);
    let logoEspetaculo = rb.logo_espetaculo_override || null;
    let logoCia = rb.logo_cia_override || null;
    let logoProducao = rb.logo_producao_override || null;

    if (!logoEspetaculo || !logoCia) {
      const { data: espData } = await supabase.from("templates_espetaculos").select("logo_espetaculo_url, logo_cia_url").eq("nome_espetaculo", rb.espetaculo).maybeSingle();
      if (espData) {
        if (!logoEspetaculo) logoEspetaculo = espData.logo_espetaculo_url;
        if (!logoCia) logoCia = espData.logo_cia_url;
      }
    }

    if (!logoProducao && rb.tour_id) {
      const { data: tourData } = await supabase.from("tours").select("logo_producao, exibir_logo_espetaculo, exibir_logo_cia, exibir_logo_producao").eq("id", rb.tour_id).maybeSingle();
      if (tourData) {
        logoProducao = tourData.logo_producao;
      }
    }
    
    // We attach them to the rb object to pass to the component
    (rb as any)._resolved_logos = { logoEspetaculo, logoCia, logoProducao };
    return rb;''', content, flags=re.DOTALL)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Cleaned up {filepath}")

modify_file('src/routes/rb.$slug.tsx')
modify_file('src/routes/_authenticated/print.$slug.tsx')
