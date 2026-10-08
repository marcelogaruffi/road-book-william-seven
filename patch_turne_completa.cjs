const fs = require("fs");
let content = fs.readFileSync("src/routes/turne-completa.$slug.tsx", "utf8");
let idx = content.indexOf("function FixedPrintFooter");
console.log(content.substring(idx, idx+1500));
