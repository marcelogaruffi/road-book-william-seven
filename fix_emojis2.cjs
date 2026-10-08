const fs = require("fs");
let c = fs.readFileSync("src/routes/_authenticated/cadastros.tsx", "utf8");
c = c.replace(/ðŸ”’/g, "🔒");
fs.writeFileSync("src/routes/_authenticated/cadastros.tsx", c, "utf8");

let d = fs.readFileSync("src/routes/_authenticated/dashboard.tsx", "utf8");
d = d.replace(/ðŸ”¥/g, "🔥");
fs.writeFileSync("src/routes/_authenticated/dashboard.tsx", d, "utf8");
console.log("Fixed emojis");
