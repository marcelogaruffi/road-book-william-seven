const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  // The app needs login, but if it crashes immediately on routing, it might crash before login redirect, or if we go to events, we'll see.
  // Actually, TanStack router crashes on the module load if there's a syntax error, or if we navigate.
  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle0' });
  
  await browser.close();
})();
