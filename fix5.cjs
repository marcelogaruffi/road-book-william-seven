const fs = require("fs");
let lines = fs.readFileSync("src/routes/_authenticated/camarins.index.tsx", "utf8").split("\n");
let cardEnd = -1;
for(let i=lines.length-1; i>=0; i--) {
  if (lines[i].includes("</Card>")) {
    cardEnd = i;
    break;
  }
}
if (cardEnd !== -1) {
  lines.splice(cardEnd + 1, 0, "        )}");
}

let emptyStateLine = -1;
for(let i=0; i<lines.length; i++) {
  if (lines[i].includes("{((activeTab === 'evento' && !selectedEventoId) || (activeTab === 'configuracao' && !selectedEspetaculoPadrao)) ? (")) {
    emptyStateLine = i;
    break;
  }
}
if(emptyStateLine !== -1) {
   lines[emptyStateLine] = "            {((activeTab === 'configuracao' && !selectedEspetaculoPadrao)) ? (";
   lines[emptyStateLine+2] = "                  <p>Selecione um show acima para gerenciar.</p>";
}

fs.writeFileSync("src/routes/_authenticated/camarins.index.tsx", lines.join("\n"));
console.log("Done");
