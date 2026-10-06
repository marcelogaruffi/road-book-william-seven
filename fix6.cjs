const fs = require("fs");
let lines = fs.readFileSync("src/routes/_authenticated/camarins.index.tsx", "utf8").split("\n");
let tabsListIdx = -1;
for(let i=0; i<lines.length; i++) {
  if (lines[i].includes("<TabsList className=\"grid w-full")) {
    tabsListIdx = i;
    break;
  }
}
if(tabsListIdx !== -1) {
  lines.splice(tabsListIdx, 0, "        {((activeTab === \"evento\" && selectedEventoId) || activeTab !== \"evento\") && (");
  let tabsListEnd = tabsListIdx + 1;
  for(let i=tabsListIdx+1; i<lines.length; i++) {
    if(lines[i].includes("</TabsList>")) {
      tabsListEnd = i;
      break;
    }
  }
  lines.splice(tabsListEnd+1, 0, "        )}");
}
fs.writeFileSync("src/routes/_authenticated/camarins.index.tsx", lines.join("\n"));
console.log("Done");
