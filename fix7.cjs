const fs = require("fs");
let lines = fs.readFileSync("src/routes/_authenticated/camarins.index.tsx", "utf8").split("\n");
lines.splice(802, 1);
fs.writeFileSync("src/routes/_authenticated/camarins.index.tsx", lines.join("\n"));
console.log("Done");
