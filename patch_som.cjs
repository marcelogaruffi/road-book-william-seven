const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/som.index.tsx', 'utf8');

const oldParse = `    let initialJsonData = {};
    if (templateData && templateData.rider_som) {
      initialJsonData = templateData.rider_som;
    }`;

const newParse = `    let initialJsonData = {};
    if (templateData && templateData.rider_som) {
      try {
        initialJsonData = JSON.parse(templateData.rider_som);
      } catch (e) {
        initialJsonData = { input_list: templateData.rider_som };
      }
    }`;

code = code.replace(oldParse, newParse);
fs.writeFileSync('src/routes/_authenticated/som.index.tsx', code);
console.log('Som index updated');
