const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/tour.index.tsx', 'utf8');

const oldConfirm = `    const ok = await customConfirm({
      title: "Apagar TurnÃª",
      description: \`Tem certeza que deseja apagar a turnÃª "\${name}"? Esta aÃ§Ã£o nÃ£o pode ser desfeita e todos os eventos vinculados perderÃ£o a referÃªncia de turnÃª.\`,
      confirmText: "Sim, apagar",
      cancelText: "Cancelar"
    });`;

const newConfirm = `    const ok = await customConfirm(
      \`Tem certeza que deseja apagar a turnê "\${name}"? Esta ação não pode ser desfeita.\`
    );`;

content = content.replace(oldConfirm, newConfirm);
fs.writeFileSync('src/routes/_authenticated/tour.index.tsx', content, 'utf8');
