
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  
  page.on('pageerror', err => {
    errors.push('PAGE ERROR: ' + err.message);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push('CONSOLE ERROR: ' + msg.text());
    }
  });

  // First go to /auth and login if needed or assume we can just see the crash right away
  // If the page redirects to auth, that's fine, but the crash might happen before redirect.
  // Actually, TanStack router renders the error component if the route throws before or during render.
  
  console.log('Visiting /perfil...');
  await page.goto('http://localhost:8080/perfil', { waitUntil: 'networkidle' });
  console.log('/perfil errors:', errors);
  
  errors.length = 0;
  console.log('Visiting /minhas-escalas...');
  await page.goto('http://localhost:8080/minhas-escalas', { waitUntil: 'networkidle' });
  console.log('/minhas-escalas errors:', errors);

  errors.length = 0;
  console.log('Visiting /financeiro...');
  await page.goto('http://localhost:8080/financeiro', { waitUntil: 'networkidle' });
  console.log('/financeiro errors:', errors);

  await browser.close();
})();

