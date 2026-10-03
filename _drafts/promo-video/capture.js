const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const HERE = __dirname;
const DUR = 15.0, FPS = 60;

(async () => {
  const mode = process.argv[2] || 'preview';
  const outDir = path.join(HERE, mode === 'preview' ? 'preview' : 'frames');
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--hide-scrollbars', '--force-device-scale-factor=1', '--allow-file-access-from-files',
           '--disable-lcd-text', '--font-render-hinting=none']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('PAGE ERROR:', e.message));
  await page.goto('file://' + path.join(HERE, 'scene.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.__ready === true', { timeout: 60000 });

  const times = mode === 'preview'
    ? [0.9, 2.2, 3.35, 4.6, 5.9, 6.6, 8.0, 9.5, 10.3, 11.6, 12.3, 13.4, 14.6]
    : Array.from({ length: Math.round(DUR * FPS) }, (_, i) => i / FPS);

  for (let i = 0; i < times.length; i++) {
    const t = times[i];
    await page.evaluate(tt => window.__render(tt), t);
    const name = mode === 'preview'
      ? `p_${t.toFixed(2).replace('.', '-')}.png`
      : `f_${String(i).padStart(4, '0')}.png`;
    await page.screenshot({ path: path.join(outDir, name), type: 'png', optimizeForSpeed: true });
    if (mode !== 'preview' && i % 50 === 0) console.log(`${i}/${times.length}`);
  }
  console.log('done', times.length, 'frames ->', outDir);
  await browser.close();
})();
