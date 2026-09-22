const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/tour.index.tsx', 'utf8');

const regex = /const nowTime = new Date\(\)\.getTime\(\);[\s\S]*?const finishedTours = tours\.filter[\s\S]*?return latestDate\.getTime\(\) < nowTime;\n  \}\);/g;

const replacement = `
  const nowTime = new Date().getTime();
  
  const toursWithDates = tours.map(tour => {
    let earliestTime = Infinity;
    let latestTime = 0;
    let isHappening = false;

    if (tour.roadbooks && tour.roadbooks.length > 0) {
      const startTimes = tour.roadbooks.map((rb) => rb.data_inicial ? new Date(rb.data_inicial + 'T00:00:00').getTime() : Infinity);
      const endTimes = tour.roadbooks.map((rb) => (rb.data_final || rb.data_inicial) ? new Date((rb.data_final || rb.data_inicial) + 'T23:59:59').getTime() : 0);
      earliestTime = Math.min(...startTimes);
      latestTime = Math.max(...endTimes);
      
      isHappening = tour.roadbooks.some((rb) => {
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
  const finishedTours = toursWithDates.filter(t => !t.isHappening && t.latestTime < nowTime && t.earliestTime !== Infinity).sort((a, b) => b.latestTime - a.latestTime);
`;

content = content.replace(regex, replacement);

const jsxRegex = /\{activeTours\.length > 0 && \([\s\S]*?\{finishedTours\.length > 0 && \(/;

const newJsx = `{happeningTours.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center">
                <div className="bg-indigo-50 dark:bg-indigo-500/10 p-2.5 rounded-xl mr-4 border border-indigo-100 dark:border-indigo-500/20">
                  <RouteIcon className="size-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-2xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">Acontecendo Agora</h2>
                <div className="h-px flex-1 bg-slate-200 dark:bg-white/10 ml-4"></div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                {happeningTours.map(tour => (
                  <TourCard key={tour.id} tour={tour} isHappening={true} onDelete={() => handleDelete(tour.id, tour.nome)} />
                ))}
              </div>
            </section>
          )}

          {futureTours.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center">
                <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl mr-4">
                  <Calendar className="size-6 text-slate-500 dark:text-slate-400" />
                </div>
                <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">Turnês Futuras</h2>
                <div className="h-px flex-1 bg-slate-200 dark:bg-white/10 ml-4"></div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                {futureTours.map(tour => (
                  <TourCard key={tour.id} tour={tour} onDelete={() => handleDelete(tour.id, tour.nome)} />
                ))}
              </div>
            </section>
          )}

          {finishedTours.length > 0 && (`;

content = content.replace(jsxRegex, newJsx);

content = content.replace(
  'function TourCard({ tour, isFinished = false, onDelete }: { tour: any, isFinished?: boolean, onDelete: () => void }) {',
  'function TourCard({ tour, isFinished = false, isHappening = false, onDelete }: { tour: any, isFinished?: boolean, isHappening?: boolean, onDelete: () => void }) {'
);

const cardHappeningRegex = /const isHappening = tour\.roadbooks\?\.some\([\s\S]*?\}\);/g;
content = content.replace(cardHappeningRegex, '');

fs.writeFileSync('src/routes/_authenticated/tour.index.tsx', content, 'utf8');
