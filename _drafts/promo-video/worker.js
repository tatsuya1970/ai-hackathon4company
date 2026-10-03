// 1ワーカー = 1 Chrome。フレーム番号の range を受け取って PNG を書き出す。
// usage: node worker.js <start> <end> <fps> <outDir>
const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const [start, end, fps, outDir] = [+process.argv[2], +process.argv[3], +process.argv[4], process.argv[5]];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--hide-scrollbars', '--force-device-scale-factor=1', '--allow-file-access-from-files',
           '--disable-lcd-text', '--font-render-hinting=none']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('PAGE ERROR:', e.message));
  await page.goto('file://' + path.join(__dirname, 'scene.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.__ready === true', { timeout: 60000 });

  for (let i = start; i < end; i++) {
    await page.evaluate(tt => window.__render(tt), i / fps);
    await page.screenshot({
      path: path.join(outDir, `f_${String(i).padStart(4, '0')}.png`),
      type: 'png', optimizeForSpeed: true
    });
    if (process.send) process.send({ done: 1 });
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
