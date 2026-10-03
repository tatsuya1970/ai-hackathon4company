const os = require('os');
const puppeteer = require('puppeteer-core');
const path = require('path');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  console.log('cores', os.cpus().length);
  const b = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--hide-scrollbars', '--force-device-scale-factor=1', '--disable-lcd-text', '--font-render-hinting=none']
  });
  const pg = await b.newPage();
  await pg.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await pg.goto('file://' + path.join(__dirname, 'scene.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  await pg.waitForFunction('window.__ready === true', { timeout: 60000 });

  const N = 15;
  let t0 = Date.now();
  for (let i = 0; i < N; i++) await pg.evaluate(t => window.__render(t), 7 + i * 0.02);
  console.log('render only      ', ((Date.now() - t0) / N).toFixed(0), 'ms/frame');

  t0 = Date.now();
  for (let i = 0; i < N; i++) { await pg.evaluate(t => window.__render(t), 7 + i * 0.02); await pg.screenshot({ encoding: 'binary', type: 'png', optimizeForSpeed: true }); }
  console.log('render + png shot', ((Date.now() - t0) / N).toFixed(0), 'ms/frame');

  t0 = Date.now();
  for (let i = 0; i < N; i++) { await pg.evaluate(t => window.__render(t), 7 + i * 0.02); await pg.screenshot({ encoding: 'binary', type: 'jpeg', quality: 95 }); }
  console.log('render + jpeg shot', ((Date.now() - t0) / N).toFixed(0), 'ms/frame');

  t0 = Date.now();
  for (let i = 0; i < N; i++) {
    await pg.evaluate(t => { window.__render(t); return document.getElementById('cv').toDataURL('image/jpeg', 0.96).length; }, 7 + i * 0.02);
  }
  console.log('render + toDataURL', ((Date.now() - t0) / N).toFixed(0), 'ms/frame');

  await b.close();
})();
