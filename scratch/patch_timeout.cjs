const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/imprensa.tsx', 'utf8');

const oldFetch = /const res = await fetch\('https:\/\/api\.microlink\.io\?url=' \+ encodeURIComponent\(urlToFetch\)\);/;

const newFetch = `          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          const res = await fetch('https://api.microlink.io?url=' + encodeURIComponent(urlToFetch), { signal: controller.signal });
          clearTimeout(timeoutId);`;

code = code.replace(oldFetch, newFetch);

fs.writeFileSync('src/routes/_authenticated/imprensa.tsx', code, 'utf8');
console.log("Added fetch timeout");
