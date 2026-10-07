# 宣伝動画（13.3秒）の BGM・効果音を合成して bgm.wav に書き出す（numpy のみ使用）
# シーン切り替え: 1.70 / 3.20 / 5.20 / 7.60 / 10.40 秒（scene.html の SCENES と対応）
import numpy as np
import wave

SR = 48000
DUR = 13.3
N = int(SR * DUR)
rng = np.random.default_rng(7)

# 5.20 秒（ドラム開始）と 10.40 秒（決め）が拍頭に乗るようにテンポと原点を決める（約138BPM）
HIT = 10.40
BEAT = (HIT - 5.20) / 12
T0 = 5.20 - 16 * BEAT
def bt(b): return T0 + b * BEAT

L = np.zeros(N); R = np.zeros(N)

def add(sig, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= N: return
    if i < 0:
        sig = sig[-i:]; i = 0
    sig = sig[:N - i]
    l = gain * np.sqrt((1 - pan) / 2) * np.sqrt(2)
    r = gain * np.sqrt((1 + pan) / 2) * np.sqrt(2)
    L[i:i + len(sig)] += sig * l
    R[i:i + len(sig)] += sig * r

def tt(d): return np.arange(int(d * SR)) / SR

def lowpass(x, fc):
    fc = np.broadcast_to(np.asarray(fc, float), x.shape)
    a = 1 - np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x); s = 0.0
    for i in range(len(x)):
        s += a[i] * (x[i] - s); y[i] = s
    return y

def highpass(x, fc): return x - lowpass(x, fc)

def saw(f, t, ph=0.0): return 2 * ((f * t + ph) % 1) - 1

def midi(n): return 440 * 2 ** ((n - 69) / 12)

# ───────── 楽器 ─────────
def kick():
    t = tt(0.45)
    f = 48 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 7) + 0.3 * np.exp(-t * 120) * rng.standard_normal(len(t)) * 0.3

def hat(d=0.06):
    t = tt(d)
    return highpass(rng.standard_normal(len(t)), 7000) * np.exp(-t * 70)

def clap():
    t = tt(0.25)
    n = highpass(lowpass(rng.standard_normal(len(t)), 5000), 900)
    env = np.exp(-t * 22) + 0.6 * np.exp(-((t - 0.012) % 0.012) * 300) * (t < 0.036)
    return n * env * 0.8 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.4

def bass(n, d):
    t = tt(d)
    f = midi(n)
    x = saw(f, t) + 0.5 * np.sin(2 * np.pi * f / 2 * t)
    x = lowpass(x, 300 + 900 * np.exp(-t * 18))
    return x * np.minimum(1, t * 400) * np.exp(-t * 3) * np.minimum(1, (d - t) * 200)

def pluck(n, d=0.35):
    t = tt(d)
    f = midi(n)
    x = 0.6 * np.sign(np.sin(2 * np.pi * f * t)) + saw(f * 1.003, t)
    x = lowpass(x, 600 + 5000 * np.exp(-t * 25))
    return x * np.exp(-t * 9) * np.minimum(1, t * 600)

def pad(notes, d, cutoff=1400):
    t = tt(d)
    x = np.zeros(len(t))
    for n in notes:
        for det in (-0.12, 0.0, 0.11):
            x += saw(midi(n + det), t, rng.random())
    x = lowpass(x / (len(notes) * 3), cutoff)
    att = np.minimum(1, t / 0.25); rel = np.minimum(1, (d - t) / 0.3)
    return x * att * rel

def bell(n, d=2.5):
    t = tt(d)
    f = midi(n)
    x = np.sin(2 * np.pi * f * t + 1.8 * np.sin(2 * np.pi * f * 3.5 * t) * np.exp(-t * 4))
    return x * np.exp(-t * 1.6) * np.minimum(1, t * 800)

def whoosh(d, f0=400, f1=6000):
    t = tt(d)
    fc = f0 * (f1 / f0) ** (t / d)
    x = lowpass(highpass(rng.standard_normal(len(t)), 300), fc)
    return x * np.sin(np.pi * t / d) ** 2

def riser(d):
    t = tt(d)
    fc = 300 * (9000 / 300) ** (t / d) ** 2
    x = lowpass(rng.standard_normal(len(t)), fc)
    tone = saw(midi(57) * (1 + t / d), t) * 0.25
    return (x + lowpass(tone, fc)) * (t / d) ** 2

def impact():
    t = tt(2.5)
    f = 35 + 90 * np.exp(-t * 12)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    crash = highpass(rng.standard_normal(len(t)), 3000) * np.exp(-t * 2.8) * 0.35
    return boom + crash

def stamp():
    t = tt(0.3)
    body = lowpass(rng.standard_normal(len(t)), 1800) * np.exp(-t * 35)
    thud = np.sin(2 * np.pi * (90 + 120 * np.exp(-t * 40)) * t) * np.exp(-t * 18)
    return body * 0.7 + thud

# ───────── 和声（1小節=4拍） ─────────
# Am – F – C – G を基調に、終盤 Fmaj7 → Cadd9 で解決
CHORDS = {0: [57, 60, 64], 1: [57, 60, 64, 67], 2: [53, 57, 60, 64], 3: [55, 59, 62, 67],
          4: [57, 60, 64, 67], 5: [53, 57, 60, 64], 6: [55, 59, 62, 65]}
ROOTS = {0: 33, 1: 33, 2: 29, 3: 31, 4: 33, 5: 29, 6: 31}
# 拍28（=10.40秒）で決めのヒット

# パッド：冒頭から（タイトルまでは暗めに）
for bar in range(7):
    b0 = bar * 4
    dur = 4 * BEAT + 0.05
    if bar == 6: dur = 2 * BEAT + 0.05  # ヒット直前で切る
    cut = 700 if bar < 2 else (1000 if bar < 3 else 1800)
    add(pad(CHORDS[bar], dur, cut), bt(b0), 0.20 if bar < 3 else 0.17)

# 0〜3.2秒：心拍のような低いパルス（「アイデアに価値はない」「ただのゴミ」）
for b in range(4, 12):
    add(bass(33, BEAT * 0.9), bt(b), 0.15 if b % 2 == 0 else 0.07)

# 1.70 秒：「ただのゴミ」へのハードカットに重い一打
add(stamp(), 1.70, 0.70)
add(kick(), 1.70, 0.60)
# 付箋が落ちる：下がっていく短い音
for i, n in enumerate([79, 76, 72, 67, 64]):
    add(pluck(n, 0.25), 2.05 + 0.13 * i, 0.08, pan=(0.4 - 0.2 * i))

# 3.20 秒：タイトル「課題解決AIハッカソン」
add(impact(), 3.20, 0.55)
add(stamp(), 3.55, 0.45)
for i, n in enumerate([69, 72, 76, 81]):
    add(bell(n, 2.0), 3.20 + 0.10 * i, 0.08, pan=(-0.4 + 0.27 * i))

# 8分のベース（タイトルの後は控えめ、5.20 秒から本格的に）
for b8 in range(24, 64):
    beat = b8 / 2
    if beat >= 26: break
    bar = int(beat // 4)
    n = ROOTS[bar] + (12 if b8 % 2 else 0)
    add(bass(n, BEAT / 2 * 0.9), bt(beat), 0.17 if beat < 16 else 0.26)

def arp(b_from, b_to, gain):
    for s in range(int(b_from * 4), int(b_to * 4)):
        beat = s / 4
        bar = int(beat // 4)
        ch = CHORDS[bar]
        seq = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[-1] + 12, ch[2] + 12, ch[1] + 12, ch[0] + 24, ch[2] + 12]
        add(pluck(seq[s % 8]), bt(beat), gain, pan=0.35 if s % 2 else -0.35)
arp(12, 16, 0.10)
arp(16, 26, 0.13)

# ドラム：5.20 秒（拍16）から本格的に
for b in range(16, 26):
    add(kick(), bt(b), 0.85)
    if b % 2 == 1: add(clap(), bt(b), 0.38)
    add(hat(), bt(b + 0.5), 0.18, pan=0.2)
    add(hat(0.03), bt(b), 0.08, pan=-0.2)
# タイトルの後は軽いハットでノリだけ予告
for b in range(12, 16):
    add(hat(0.04), bt(b + 0.5), 0.10, pan=0.2)
add(riser(1.0), 5.20 - 1.0, 0.28)
# 拍26〜28：フィル（スネアロール）
for i in range(8):
    add(clap(), bt(26 + i * 0.25), 0.25 + 0.05 * i)

# ───────── 効果音（シーン切り替え） ─────────
for cut in (5.20, 7.60):
    add(whoosh(0.55), cut - 0.38, 0.30, pan=-0.3)
add(riser(1.6), HIT - 1.6, 0.45)

# 決め：10.40 秒のヒット＋ハンコ＋余韻のベル
add(impact(), HIT, 0.9)
add(kick(), HIT, 0.9)
add(pad([48, 55, 62, 64, 67], 2.95, 2200), HIT, 0.20)   # Cadd9
add(bass(36, 2.6), HIT, 0.30)
add(stamp(), HIT + 0.38, 0.55)
for i, n in enumerate([72, 76, 79, 84]):
    add(bell(n, 2.6), HIT + 0.12 * i, 0.10, pan=(-0.4 + 0.27 * i))

# 冒頭の小さなフェードインと末尾フェードアウト
t = np.arange(N) / SR
env = np.minimum(1, t / 0.25) * np.minimum(1, (DUR - t) / 0.8)
L *= env; R *= env

# 軽いリバーブ（多タップのフィードバック遅延）
def verb(x, mix=0.18):
    y = np.zeros_like(x)
    for d, g in ((0.031, .5), (0.047, .45), (0.071, .4), (0.113, .33), (0.167, .25), (0.241, .18)):
        k = int(d * SR); y[k:] += x[:-k] * g
    return x + lowpass(y, 4000) * mix
L, R = verb(L), verb(R)

peak = max(np.abs(L).max(), np.abs(R).max())
L = np.tanh(L / peak * 1.2) * 0.89; R = np.tanh(R / peak * 1.2) * 0.89
data = (np.stack([L, R], 1) * 32767).astype('<i2')
with wave.open('bgm.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data.tobytes())
print('ok', BEAT, T0)
