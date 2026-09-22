const fs = require('fs');

let content = fs.readFileSync('src/routes/_authenticated/tour.index.tsx', 'utf8');

// I will just use regex to replace everything from `const now = new Date().toISOString().substring(0, 10);` up to the `return (`
const regex1 = /\/\/ Separar em ativas[\s\S]*?const finishedTours = tours\.filter\(t => !isTourActive\(t\)\);/g;

const replacement1 = `  const nowTime = new Date().getTime();
  
  const toursWithDates = tours.map(tour => {
    let earliestTime = Infinity;
    let latestTime = 0;
    let isHappening = false;

    if (tour.roadbooks && tour.roadbooks.length > 0) {
      const startTimes = tour.roadbooks.map((rb: any) => rb.data_inicial ? new Date(rb.data_inicial + 'T00:00:00').getTime() : Infinity);
      const endTimes = tour.roadbooks.map((rb: any) => (rb.data_final || rb.data_inicial) ? new Date((rb.data_final || rb.data_inicial) + 'T23:59:59').getTime() : 0);
      earliestTime = Math.min(...startTimes);
      latestTime = Math.max(...endTimes);
      
      isHappening = tour.roadbooks.some((rb: any) => {
        if (!rb.data_inicial) return false;
        const rbStart = new Date(rb.data_inicial + 'T00:00:00').getTime();
        const rbEnd = new Date((rb.data_final || rb.data_inicial) + 'T23:59:59').getTime();
        return nowTime >= (rbStart - 2 * 24 * 60 * 60 * 1000) && nowTime <= rbEnd;
      });
    }

    return {
      ...tour,
      earliestTime,
      latestTime,
      isHappening
    };
  });

  const happeningTours = toursWithDates.filter(t => t.isHappening).sort((a, b) => a.earliestTime - b.earliestTime);
  const futureTours = toursWithDates.filter(t => !t.isHappening && (t.latestTime >= nowTime || t.earliestTime === Infinity)).sort((a, b) => a.earliestTime - b.earliestTime);
  const finishedTours = toursWithDates.filter(t => !t.isHappening && t.latestTime < nowTime && t.earliestTime !== Infinity).sort((a, b) => b.latestTime - a.latestTime);`;

content = content.replace(regex1, replacement1);

// I also need to make sure customConfirm receives a string, since my previous fix_confirm script also failed (because the string was different!).
const regexConfirm = /const ok = await customConfirm\(\{[\s\S]*?cancelText: "Cancelar"[\s\S]*?\}\);/g;
const replacementConfirm = `const ok = await customConfirm(
      \`Tem certeza que deseja apagar a turnê "\${name}"? Esta ação não pode ser desfeita.\`
    );`;

content = content.replace(regexConfirm, replacementConfirm);

fs.writeFileSync('src/routes/_authenticated/tour.index.tsx', content, 'utf8');
