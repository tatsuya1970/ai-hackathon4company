// 縦版（1080×1920）の書き出し。
// usage: node render-v.js preview        → preview-v/ にキーフレームの PNG
//        node render-v.js [workers]      → 全フレームを並列レンダリングし promo-13s-vertical.mp4 を作る
// 音声は横版 promo-13s.mp4 から流用する（シーンのタイミングが同じ）。
const puppeteer = require('puppeteer-core');
const { fork, execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const HERE = __dirname;
const DUR = 13.3, FPS = 60, VW = 1080, VH = 1920;
const TOTAL = Math.round(DUR * FPS);
const ARGS = ['--hide-scrollbars', '--force-device-scale-factor=1', '--allow-file-access-from-files',
              '--disable-lcd-text', '--font-render-hinting=none'];

async function open() {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ARGS });
  const page = await browser.newPage();
  await page.setViewport({ width: VW, height: VH, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('PAGE ERROR:', e.message));
  await page.goto('file://' + path.join(HERE, 'scene-v.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.__ready === true', { timeout: 60000 });
  return { browser, page };
}

async function worker(start, end, outDir) {
  const { browser, page } = await open();
  for (let i = start; i < end; i++) {
    await page.evaluate(tt => window.__render(tt), i / FPS);
    await page.screenshot({ path: path.join(outDir, `f_${String(i).padStart(4, '0')}.png`), type: 'png', optimizeForSpeed: true });
    if (process.send) process.send(1);
  }
  await browser.close();
}

async function preview() {
  const outDir = path.join(HERE, 'preview-v');
  fs.rmSync(outDir, { recursive: true, force: true }); fs.mkdirSync(outDir);
  const { browser, page } = await open();
  for (const t of [1.5, 2.9, 4.6, 7.2, 9.8, 13.0]) {
    await page.evaluate(tt => window.__render(tt), t);
    await page.screenshot({ path: path.join(outDir, `p_${t.toFixed(2).replace('.', '-')}.png`) });
  }
  await browser.close();
  console.log('preview ->', outDir);
}

async function full(workers) {
  const outDir = path.join(HERE, 'frames-v');
  fs.rmSync(outDir, { recursive: true, force: true }); fs.mkdirSync(outDir);
  const per = Math.ceil(TOTAL / workers);
  let done = 0; const t0 = Date.now();
  await Promise.all(Array.from({ length: workers }, (_, w) => [w * per, Math.min(TOTAL, (w + 1) * per)])
    .filter(([s, e]) => e > s)
    .map(([s, e]) => new Promise((res, rej) => {
      const c = fork(__filename, ['__worker', s, e, outDir], { stdio: ['ignore', 'inherit', 'inherit', 'ipc'] });
      c.on('message', () => { if (++done % 50 === 0 || done === TOTAL) process.stdout.write(`\r${done}/${TOTAL}  ${((Date.now() - t0) / 1000).toFixed(0)}s   `); });
      c.on('exit', code => code === 0 ? res() : rej(new Error('worker exited ' + code)));
    })));
  const n = fs.readdirSync(outDir).filter(f => f.endsWith('.png')).length;
  if (n !== TOTAL) throw new Error(`frame count mismatch ${n}/${TOTAL}`);

  const ff = 'ffmpeg';
  const master = path.join(HERE, 'promo-13s-vertical.mp4');
  const web = path.join(HERE, 'promo-13s-vertical-web.mp4');
  console.log('\nencoding...');
  execFileSync(ff, ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(outDir, 'f_%04d.png'),
    '-i', path.join(HERE, 'promo-13s.mp4'), '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.2',
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', master], { stdio: 'inherit' });
  // SNS 投稿用：30fps・軽量
  execFileSync(ff, ['-y', '-loglevel', 'error', '-i', master, '-r', '30',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-maxrate', '5M', '-bufsize', '10M', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', web], { stdio: 'inherit' });
  execFileSync(ff, ['-y', '-loglevel', 'error', '-ss', '12.8', '-i', master, '-frames:v', '1', '-q:v', '3',
    path.join(HERE, 'promo-13s-vertical-poster.jpg')], { stdio: 'inherit' });
  fs.rmSync(outDir, { recursive: true, force: true });
  for (const f of [master, web]) console.log(path.basename(f), (fs.statSync(f).size / 1048576).toFixed(1), 'MB');
}

const a = process.argv.slice(2);
(a[0] === '__worker' ? worker(+a[1], +a[2], a[3])
  : a[0] === 'preview' ? preview()
  : full(+(a[0] || 5))).catch(e => { console.error(e); process.exit(1); });
