const fs = require('fs');
let c = fs.readFileSync('src/routes/_authenticated/emissao-relatorios.tsx', 'utf8');

c = c.replace(/const \{ data \} = await supabase.from\('imprensa_clipping'\).select\('\*, eventos\\(espetaculo_nome\\)'\);/g, "const { data } = await supabase.from('imprensa_clipping').select('*');");
c = c.replace(/const rows = \(data \|\| \[\]\).map\(\(c: any\) => \[c.veiculo, c.titulo \|\| '-', c.data_publicacao \? new Date\(c.data_publicacao\).toLocaleDateString\('pt-BR'\) : '-', c.link \|\| '-'\].*?\);/g, "const rows = (data || []).map((c: any) => [c.veiculo, c.titulo_materia || '-', c.data_publicacao ? new Date(c.data_publicacao).toLocaleDateString('pt-BR') : '-', c.link_materia || '-']);");
c = c.replace(/\(data \|\| \[\]\).forEach\(\(c: any\) => ws.addRow\(\[c.veiculo, c.titulo \|\| '-', c.data_publicacao \? new Date\(c.data_publicacao\).toLocaleDateString\('pt-BR'\) : '-', c.link \|\| '-'\].*?\);/g, "(data || []).forEach((c: any) => ws.addRow([c.veiculo, c.titulo_materia || '-', c.data_publicacao ? new Date(c.data_publicacao).toLocaleDateString('pt-BR') : '-', c.link_materia || '-']));");

fs.writeFileSync('src/routes/_authenticated/emissao-relatorios.tsx', c);
