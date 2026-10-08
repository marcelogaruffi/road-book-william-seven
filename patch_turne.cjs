const fs = require("fs");
let content = fs.readFileSync("src/routes/turne.$slug.tsx", "utf8");
let idx = content.indexOf("<footer");
console.log(content.substring(idx, idx+1500));
