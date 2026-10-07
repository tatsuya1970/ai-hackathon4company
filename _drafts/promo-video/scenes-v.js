/* ══════════════════════════════════════════════
   縦版（1080×1920）のシーン。scene.html の各シーンを縦に組み直したもの。
   タイミングは横版と同じ（音声を共有するため）。
   SNS の UI に隠れないよう、上 200px・下 320px には主要な文字を置かない。
   ══════════════════════════════════════════════ */

/* 中央揃えの reveal（左端を計算して渡す） */
function revealC(text, cx, y, p, opt){
  const w = ctx.measureText(text).width;
  return reveal(text, cx - w/2, y, p, opt);
}

/* A  0.00–1.70   アイデアに価値はない。 */
function sA(t){
  ctx.fillStyle = C.navyDeep; ctx.fillRect(0,0,W,H);
  seigaiha(200, '#A9C2E4', .05, 2, -t*9);
  const z = 1 + t*0.018;
  ctx.save();
  ctx.translate(W/2, H/2); ctx.scale(z,z); ctx.translate(-W/2, -H/2);
  ctx.fillStyle = C.onDark;
  ctx.font = font(900, 150, SERIF);
  ctx.textAlign='left'; ctx.textBaseline='alphabetic';
  setLS('.04em');
  revealC('アイデアに', W/2, 900, seg(t,0.18,0.80), {size:150, bar:C.shu});
  revealC('価値はない。', W/2, 1090, seg(t,0.45,1.10), {size:150, bar:C.shu});
  setLS('0px');
  ctx.restore();
  grain(); vignette();
}

/* B  1.70–3.20   動かなければ、ただのゴミ。（付箋が落ちる） */
const NOTES = [
  [120,250,-6,'#F7F3EC'],[450,230,4,'#F4D3D3'],[780,260,-3,'#FBF1B0'],
  [160,520,5,'#F4D3D3'],[480,500,-5,'#FBF1B0'],[790,530,3,'#F7F3EC'],
  [110,790,-4,'#FBF1B0'],[440,780,6,'#F7F3EC'],[770,800,-6,'#F4D3D3']
];
function sB(t){
  bgPaper(t);
  NOTES.forEach((n,i)=>{
    const t0 = 0.35 + ((i*5)%9)*0.05;
    const d = Math.max(0, t - t0);
    const y = n[1] + 3400*d*d;
    const x = n[0] + (i%2?1:-1)*100*d;
    const rot = (n[2] + (i%2?1:-1)*140*d) * Math.PI/180;
    // 文字（y=1100 以下）に重ならないよう、落ちながら消える
    const fade = cl(1 - (y - n[1]) / 420);
    if(fade <= 0) return;
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(x+90, y+90); ctx.rotate(rot);
    ctx.shadowColor='rgba(20,33,61,.14)'; ctx.shadowBlur=18; ctx.shadowOffsetY=8;
    ctx.fillStyle=n[3]; ctx.fillRect(-90,-90,180,180);
    ctx.shadowColor='transparent';
    ctx.strokeStyle='rgba(36,34,32,.30)'; ctx.lineWidth=5; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(-58,-40); ctx.lineTo(56,-40); ctx.moveTo(-58,-4); ctx.lineTo(30,-4);
    ctx.moveTo(-58,32); ctx.lineTo(44,32); ctx.stroke();
    ctx.restore();
  });

  ctx.textAlign='left'; ctx.textBaseline='alphabetic';
  ctx.fillStyle = C.ink;
  ctx.font = font(700, 84, SERIF);
  setLS('.04em');
  reveal('動かなければ、', 90, 1230, seg(t,0.08,0.55), {size:84});
  ctx.font = font(900, 168, SERIF);
  reveal('ただの', 90, 1440, seg(t,0.38,0.85), {size:168, bar:C.shu});
  ctx.fillStyle = C.shu;
  reveal('ゴミ。', 90, 1630, seg(t,0.62,1.05), {size:168, bar:C.shu});
  setLS('0px');
  grain(); vignette();
}

/* C  3.20–5.20   課題解決AIハッカソン（タイトル） */
function sC(t){
  bgNavy(t, true);
  hanko(W/2, 700, 190, seg(t,0.05,0.70));

  ctx.textAlign='center'; ctx.textBaseline='alphabetic';
  const p1 = seg(t,0.30,1.05);
  if(p1>0){
    ctx.save();
    ctx.globalAlpha = cl(p1*1.4);
    ctx.translate(0,(1-outExpo(p1))*24);
    const z = 1 + t*0.012;
    ctx.translate(W/2,1080); ctx.scale(z,z); ctx.translate(-W/2,-1080);
    ctx.fillStyle = C.onDark;
    ctx.font = font(900, 150, SERIF);
    setLS('.04em');
    ctx.fillText('課題解決', W/2, 1040);
    ctx.fillText('AIハッカソン', W/2, 1210);
    setLS('0px');
    ctx.restore();
  }
  const p2 = seg(t,0.65,1.25);
  if(p2>0){ ctx.fillStyle = C.shu; ctx.fillRect(W/2-190*outExpo(p2), 1270, 380*outExpo(p2), 8); }
  grain(); vignette();
}

/* D  5.20–7.60   キャッチ */
function s2(t){
  bgNavy(t);
  jlabel('だから、動くものをつくる。', 90, 520, seg(t,0.12,0.7), C.lemon, 40);

  ctx.textAlign='left'; ctx.textBaseline='alphabetic';
  ctx.fillStyle = C.onDark;
  ctx.font = font(900, 138, SERIF);
  setLS('.01em');
  reveal('課題も', 90, 720, seg(t,0.22,0.90), {size:138, bar:C.lemon});
  reveal('新規事業も、', 90, 880, seg(t,0.40,1.15), {size:138, bar:C.lemon});
  setLS('0px');

  // 「3時間で」：「3」をレモンで強調
  const p2 = seg(t,0.62,1.40);
  if(p2>0){
    ctx.save();
    ctx.font = font(900, 138, SERIF);
    const a = '3', b = '時間で';
    const wa = ctx.measureText(a).width, wb = ctx.measureText(b).width;
    const total = wa + wb, e = outQuint(p2);
    ctx.beginPath(); ctx.rect(80, 900, (total+40)*e, 200); ctx.clip();
    ctx.translate(0,(1-outExpo(p2))*20);
    ctx.fillStyle = C.lemon; ctx.fillText(a, 90, 1040);
    ctx.fillStyle = C.onDark; ctx.fillText(b, 90+wa, 1040);
    ctx.restore();
    if(p2<1){ ctx.fillStyle=C.lemon; ctx.fillRect(90+total*e, 932, 14, 128); }
    const ul = seg(t,1.20,1.8);
    if(ul>0){ ctx.fillStyle=C.lemon; ctx.fillRect(90, 1068, wa*outExpo(ul), 10); }
  }
  ctx.fillStyle = C.onDark;
  ctx.font = font(900, 138, SERIF);
  reveal('形にします。', 90, 1210, seg(t,0.85,1.60), {size:138, bar:C.lemon});

  // 下段メタ 30min / 3h / 1社（横3列）
  const items = [['30','min','お題説明'],['3','hours','ハックタイム'],['1','社','お題は御社だけ']];
  const bx = 90, by = 1460, gapx = 310;
  items.forEach((it,i)=>{
    const p = seg(t, 1.35+i*0.14, 2.10+i*0.14);
    if(p<=0) return;
    ctx.save();
    ctx.globalAlpha = cl(p*1.4);
    ctx.translate(0,(1-outExpo(p))*20);
    const x = bx+i*gapx;
    ctx.fillStyle = 'rgba(244,241,236,.22)';
    ctx.fillRect(x, by-66, 2, 104);
    ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillStyle = C.onDark;
    ctx.font = font(700, 76, LATIN);
    ctx.fillText(it[0], x+24, by);
    const wn = ctx.measureText(it[0]).width;
    ctx.fillStyle = C.lemon;
    ctx.font = font(500, 30, it[1]==='社'?GOTHIC:LATIN);
    ctx.fillText(it[1], x+32+wn, by-38);
    ctx.fillStyle = 'rgba(244,241,236,.72)';
    ctx.font = font(500, 28, GOTHIC);
    ctx.fillText(it[2], x+24, by+40);
    ctx.restore();
  });
  grain(); vignette();
}

/* E  7.60–10.40   動くものが残る（挿絵＋3項目） */
function sE(t){
  bgPaper(t);
  const p = seg(t,0.05,0.60);
  ctx.save();
  ctx.globalAlpha = cl(p*1.5);
  const sc = 1.62;
  ctx.translate((W - 540*sc)/2 + 20, 300 + (1-outExpo(p))*30);
  ctx.scale(sc,sc);
  ilHack(t + 1.3);
  ctx.restore();

  jlabel('このハッカソンでは', 90, 1030, seg(t,0.10,0.6), C.shu, 34);
  ctx.textAlign='left'; ctx.textBaseline='alphabetic';
  ctx.fillStyle = C.ink;
  ctx.font = font(900, 104, SERIF);
  setLS('.03em');
  reveal('動くものが残る。', 90, 1160, seg(t,0.18,0.85), {size:104, bar:C.shu});
  setLS('0px');

  const rows = ['生成AIで、3時間で動くものをつくる','その場で触って、使えるか確かめる','最優秀賞のチームと、そのまま協業へ'];
  rows.forEach((r,i)=>{
    const q = seg(t, 0.55+i*0.22, 1.15+i*0.22);
    rise(()=>{
      const y = 1310 + i*112;
      ctx.fillStyle = C.shu; rr(90, y-36, 48, 48, 6); ctx.fill();
      ctx.strokeStyle = C.paper; ctx.lineWidth = 5; ctx.lineCap='round'; ctx.lineJoin='round';
      ctx.beginPath(); ctx.moveTo(102, y-12); ctx.lineTo(112, y-2); ctx.lineTo(127, y-23); ctx.stroke();
      ctx.fillStyle = C.ink; ctx.font = font(700, 40, GOTHIC);
      ctx.textAlign='left'; ctx.textBaseline='alphabetic';
      ctx.fillText(r, 160, y);
      ctx.strokeStyle = C.rule; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(90, y+42); ctx.lineTo(990, y+42); ctx.stroke();
    }, q, 20);
  });
  grain(); vignette();
}

/* S5  10.40–13.30   ロゴ + CTA（QRコードと検索窓） */
const qrImg = new Image();
qrImg.src = 'qr.png';
function s5(t){
  bgNavy(t, true);
  ctx.save();
  ctx.beginPath(); ctx.rect(0, H-360, W, 360); ctx.clip();
  seigaiha(150, C.lemon, .08, 2, -t*16);
  ctx.restore();

  hanko(W/2, 380, 140, seg(t,0.08,0.70));

  ctx.textAlign='center'; ctx.textBaseline='alphabetic';
  const p1 = seg(t,0.25,1.00);
  if(p1>0){
    ctx.save();
    ctx.globalAlpha = cl(p1*1.4);
    ctx.translate(0,(1-outExpo(p1))*24);
    ctx.fillStyle = C.onDark;
    ctx.font = font(900, 124, SERIF);
    setLS('.04em');
    ctx.fillText('課題解決', W/2, 640);
    ctx.fillText('AIハッカソン', W/2, 780);
    setLS('0px');
    ctx.restore();
  }
  const p2 = seg(t,0.55,1.05);
  if(p2>0){ ctx.fillStyle = C.shu; ctx.fillRect(W/2-160*outExpo(p2), 830, 320*outExpo(p2), 7); }

  rise(()=>{
    ctx.fillStyle = C.onDark;
    ctx.font = font(700, 44, SERIF);
    ctx.textAlign='center';
    ctx.fillText('企業・団体・自治体のお題', W/2, 930);
    ctx.fillText('（課題・新規事業）を募集中', W/2, 996);
  }, seg(t,0.65,1.35), 22);

  // QRコード（白いカードの上に。読み取り用の余白を確保）
  const qs = 330, pad = 34, cardW = qs + pad*2;
  const qx = W/2 - cardW/2, qy = 1050;
  pop(W/2, qy + cardW/2, seg(t,0.90,1.45), ()=>{
    ctx.save();
    ctx.shadowColor='rgba(0,0,0,.35)'; ctx.shadowBlur=30; ctx.shadowOffsetY=10;
    ctx.fillStyle='#fff'; rr(qx, qy, cardW, cardW, 18); ctx.fill();
    ctx.restore();
    if(qrImg.complete && qrImg.naturalWidth){
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(qrImg, qx+pad, qy+pad, qs, qs);
      ctx.imageSmoothingEnabled = true;
    }
  });

  // 検索窓：「課題解決ハッカソン」で検索
  const sy = 1510, sh = 96, sw = 640, sx = W/2 - 405;
  rise(()=>{
    ctx.fillStyle = '#fff'; rr(sx, sy, sw, sh, sh/2); ctx.fill();
    ctx.fillStyle = C.ink; ctx.font = font(700, 44, GOTHIC);
    ctx.textAlign='left'; ctx.textBaseline='middle';
    const typed = '課題解決ハッカソン';
    const n = Math.round(typed.length * cl(seg(t,1.40,2.00)));
    ctx.fillText(typed.slice(0, n), sx+44, sy+sh/2+2);
    // 入力中のカーソル
    if(n < typed.length || Math.floor(t*2.5)%2===0){
      const cw = ctx.measureText(typed.slice(0, n)).width;
      ctx.fillStyle = C.navyMid; ctx.fillRect(sx+48+cw, sy+26, 4, sh-52);
    }
    // 虫めがね
    const mx = sx+sw-60, my = sy+sh/2;
    ctx.strokeStyle = C.navy; ctx.lineWidth = 7; ctx.lineCap='round';
    ctx.beginPath(); ctx.arc(mx-6, my-6, 18, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(mx+7, my+7); ctx.lineTo(mx+22, my+22); ctx.stroke();
    ctx.fillStyle = C.lemon; ctx.font = font(900, 50, SERIF);
    ctx.textAlign='left';
    ctx.fillText('で検索', sx+sw+20, sy+sh/2+2);
  }, seg(t,1.20,1.75), 18);

  const p6 = seg(t,1.55,2.4);
  ctx.fillStyle = C.lemon;
  ctx.fillRect(0, H-18, W*outExpo(p6), 18);
  grain(); vignette();
}
