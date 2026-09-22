const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/imprensa.tsx', 'utf8');

// Safeguard Card entirely
const unsafeHref = /clip\.link_materia\.startsWith\('http'\) \? clip\.link_materia : 'https:\/\/' \+ clip\.link_materia/g;
code = code.replace(unsafeHref, "(clip.link_materia?.startsWith('http') ? clip.link_materia : 'https://' + clip.link_materia)");

const unsafeImg = /encodeURIComponent\(clip\.link_materia\)/g;
code = code.replace(unsafeImg, "encodeURIComponent(clip.link_materia || '')");

const unsafeIncludes = /clip\.relevancia_tier\?\.includes/g;
code = code.replace(unsafeIncludes, "(clip.relevancia_tier || '').includes");

fs.writeFileSync('src/routes/_authenticated/imprensa.tsx', code, 'utf8');
console.log('Fixed optional chaining');
