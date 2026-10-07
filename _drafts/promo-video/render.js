// 全フレームを並列レンダリングして MP4 にエンコードする。
// usage: node render.js [workers]
const { fork, execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const DUR = 13.3, FPS = 60;
const TOTAL = Math.round(DUR * FPS);
const WORKERS = +(process.argv[2] || 5);
const HERE = __dirname;
const outDir = path.join(HERE, 'frames');
const mp4 = path.join(HERE, 'promo-13s.mp4');

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

// 連続ブロックではなくインターリーブで割り当てる（シーンごとの描画コスト差を平均化）
const ranges = [];
const per = Math.ceil(TOTAL / WORKERS);
for (let w = 0; w < WORKERS; w++) ranges.push([w * per, Math.min(TOTAL, (w + 1) * per)]);

let done = 0, t0 = Date.now();
const tick = () => {
  done++;
  if (done % 25 === 0 || done === TOTAL) {
    const el = (Date.now() - t0) / 1000;
    const eta = el / done * (TOTAL - done);
    process.stdout.write(`\r${done}/${TOTAL} frames  ${el.toFixed(0)}s elapsed  ETA ${eta.toFixed(0)}s   `);
  }
};

Promise.all(ranges.filter(([s, e]) => e > s).map(([s, e]) => new Promise((res, rej) => {
  const c = fork(path.join(HERE, 'worker.js'), [s, e, FPS, outDir], { stdio: ['ignore', 'inherit', 'inherit', 'ipc'] });
  c.on('message', tick);
  c.on('exit', code => code === 0 ? res() : rej(new Error(`worker ${s}-${e} exited ${code}`)));
}))).then(() => {
  const n = fs.readdirSync(outDir).filter(f => f.endsWith('.png')).length;
  console.log(`\nrendered ${n}/${TOTAL} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  if (n !== TOTAL) throw new Error('frame count mismatch');

  const ffmpeg = require('@ffmpeg-installer/ffmpeg').path;
  console.log('encoding...');
  execFileSync(ffmpeg, [
    '-y', '-framerate', String(FPS),
    '-i', path.join(outDir, 'f_%04d.png'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
    '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.0',
    '-movflags', '+faststart',
    mp4
  ], { stdio: ['ignore', 'inherit', 'inherit'] });
  const mb = (fs.statSync(mp4).size / 1048576).toFixed(1);
  console.log(`\n=> ${mp4}  (${mb} MB)`);
}).catch(e => { console.error('\n' + e.message); process.exit(1); });
