const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/fotos.tsx', 'utf8');

// Fix 1: Eventos select
code = code.replace(/select\('id, espetaculo, nome, local, data'\)/g, "select('id, espetaculo, cidade, local, data')");

// Fix 2: MidiasHD select
code = code.replace(/select\('\*, eventos\(nome, local, data\)'\)/g, "select('*, eventos(cidade, local, data)')");

// Fix 3: Render logic e.nome || e.local -> e.cidade + (e.local ? ' - ' + e.local : '')
code = code.replace(/e\.nome \|\| e\.local/g, "e.cidade + (e.local ? ' - ' + e.local : '')");

// Fix 4: Render logic album.evento.nome || album.evento.local
code = code.replace(/album\.evento\.nome \|\| album\.evento\.local/g, "album.evento.cidade + (album.evento.local ? ' - ' + album.evento.local : '')");

// Fix 5: Render logic item.eventos.nome || item.eventos.local
code = code.replace(/item\.eventos\.nome \|\| item\.eventos\.local/g, "item.eventos.cidade + (item.eventos.local ? ' - ' + item.eventos.local : '')");

// Fix 6: Render logic activeAlbumData.evento.nome || activeAlbumData.evento.local
code = code.replace(/activeAlbumData\.evento\.nome \|\| activeAlbumData\.evento\.local/g, "activeAlbumData.evento.cidade + (activeAlbumData.evento.local ? ' - ' + activeAlbumData.evento.local : '')");

fs.writeFileSync('src/routes/_authenticated/fotos.tsx', code, 'utf8');
console.log('Fixed fotos.tsx with cidade/local');
