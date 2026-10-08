const fs = require('fs');
let c = fs.readFileSync('src/routes/_authenticated/emissao-relatorios.tsx', 'utf8');

c = c.replace(/const \{ data \} = await supabase.from\('imprensa_clipping'\).select\('\*, eventos\\(espetaculo_nome\\)'\);/g, "const { data } = await supabase.from('imprensa_clipping').select('*');");
c = c.replace(/const rows = \(data \|\| \[\]\).map\(\(c: any\) => \[c.veiculo, c.titulo \|\| '-', c.data_publicacao \? new Date\(c.data_publicacao\).toLocaleDateString\('pt-BR'\) : '-', c.link \|\| '-'\].*?\);/g, "const rows = (data || []).map((c: any) => [c.veiculo, c.titulo_materia || '-', c.data_publicacao ? new Date(c.data_publicacao).toLocaleDateString('pt-BR') : '-', c.link_materia || '-']);");
c = c.replace(/\(data \|\| \[\]\).forEach\(\(c: any\) => ws.addRow\(\[c.veiculo, c.titulo \|\| '-', c.data_publicacao \? new Date\(c.data_publicacao\).toLocaleDateString\('pt-BR'\) : '-', c.link \|\| '-'\].*?\);/g, "(data || []).forEach((c: any) => ws.addRow([c.veiculo, c.titulo_materia || '-', c.data_publicacao ? new Date(c.data_publicacao).toLocaleDateString('pt-BR') : '-', c.link_materia || '-']));");

c = c.replace(/const \{ data \} = await supabase.from\('registro_publico'\).select\('\*, eventos\\(espetaculo_nome\\)'\);/g, "const { data } = await supabase.from('relatorio_publico').select('*, roadbooks(espetaculo, cidade)');");
c = c.replace(/const rows = \(data \|\| \[\]\).map\(\(p: any\) => \[p.eventos\?\.espetaculo_nome \|\| '-', p.quantidade_pagantes\?\.toString\(\) \|\| '0', p.quantidade_cortesias\?\.toString\(\) \|\| '0', p.quantidade_total\?\.toString\(\) \|\| '0'\]\);/g, "const rows = (data || []).map((p: any) => [`${p.roadbooks?.espetaculo || '-'} - ${p.roadbooks?.cidade || '-'}`, p.publico_presente?.toString() || '0', p.publico_majoritario?.join(', ') || '-', p.atividade || '-']);");
c = c.replace(/\(data \|\| \[\]\).forEach\(\(p: any\) => ws.addRow\(\[p.eventos\?\.espetaculo_nome \|\| '-', p.quantidade_pagantes \|\| 0, p.quantidade_cortesias \|\| 0, p.quantidade_total \|\| 0\]\)\);/g, "(data || []).forEach((p: any) => ws.addRow([`${p.roadbooks?.espetaculo || '-'} - ${p.roadbooks?.cidade || '-'}`, p.publico_presente || '0', p.publico_majoritario?.join(', ') || '-', p.atividade || '-']));");

c = c.replace(/const \{ data \} = await supabase.from\('registro_vendas'\).select\('\*, eventos\\(espetaculo_nome\\), produtos\\(nome\\)'\);/g, "const { data } = await supabase.from('vendas_registros').select('*, produto:vendas_produtos(nome), evento:eventos(cidade)');");
c = c.replace(/const rows = \(data \|\| \[\]\).map\(\(v: any\) => \[v.eventos\?\.espetaculo_nome \|\| '-', v.produtos\?\.nome \|\| '-', v.quantidade\?\.toString\(\) \|\| '0', v.valor_total \? `R\$ \$\{v.valor_total.toFixed\(2\)\}` : '-'\]\);/g, "const rows = (data || []).map((v: any) => [v.evento?.cidade || 'Geral', v.produto?.nome || '-', v.quantidade?.toString() || '0', v.valor_total ? `R$ ${v.valor_total.toFixed(2)}` : '-']);");
c = c.replace(/\(data \|\| \[\]\).forEach\(\(v: any\) => ws.addRow\(\[v.eventos\?\.espetaculo_nome \|\| '-', v.produtos\?\.nome \|\| '-', v.quantidade \|\| 0, v.valor_total \|\| 0\]\)\);/g, "(data || []).forEach((v: any) => ws.addRow([v.evento?.cidade || 'Geral', v.produto?.nome || '-', v.quantidade || 0, v.valor_total || 0]));");

fs.writeFileSync('src/routes/_authenticated/emissao-relatorios.tsx', c);

