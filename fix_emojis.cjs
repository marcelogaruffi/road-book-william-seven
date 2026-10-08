const fs = require("fs");
let c = fs.readFileSync("src/routes/_authenticated/dashboard.tsx", "utf8");
c = c.replace(/ðŸŽ‰/g, "🎉");
c = c.replace(/ðŸŽ‚/g, "🎂");
fs.writeFileSync("src/routes/_authenticated/dashboard.tsx", c, "utf8");
console.log("Fixed emojis");
