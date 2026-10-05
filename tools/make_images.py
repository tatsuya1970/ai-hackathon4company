# -*- coding: utf-8 -*-
"""OG画像とfaviconを生成する。配色・字面は assets/base.css と favicon.svg に合わせる。"""
import os
from PIL import Image, ImageDraw, ImageFont

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")

SHU = (200, 16, 46)        # 朱 #C8102E
AI = (20, 33, 61)          # 瀬戸内の藍 #14213D
AI_MID = (31, 58, 99)      # #1F3A63
LEMON = (245, 217, 10)     # 広島レモン #F5D90A
WASHI = (250, 247, 242)    # 和紙 #FAF7F2
WHITE = (255, 255, 255)
MUTED = (106, 101, 96)     # #6A6560

MINCHO_B = "C:/Windows/Fonts/yumindb.ttf"   # 游明朝 Demibold
MINCHO_R = "C:/Windows/Fonts/yumin.ttf"     # 游明朝 Regular
GOTHIC_B = "C:/Windows/Fonts/YuGothB.ttc"   # 游ゴシック Bold


def font(path, size, index=0):
    return ImageFont.truetype(path, size, index=index)


def fit(draw, text, path, max_size, max_width):
    """max_width に収まる最大の級数でフォントを返す。"""
    size = max_size
    while size > 8:
        f = font(path, size)
        if draw.textlength(text, font=f) <= max_width:
            return f
        size -= 2
    return font(path, 8)


def seigaiha(draw, cx, cy, r, color, rings=4, width=2):
    """青海波の一単位（同心円の弧）を描く。"""
    for i in range(rings):
        rr = r * (i + 1) / rings
        draw.arc([cx - rr, cy - rr, cx + rr, cy + rr], 180, 360, fill=color, width=width)


def kaimark(img, size, radius_ratio=0.094):
    """favicon.svg と同じ「解」の判子マークを描く。"""
    s = size * 4  # 4倍で描いて縮小（アンチエイリアス）
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * radius_ratio), fill=SHU)
    # 下部のレモン色の帯（svg: x=10,y=46,w=44,h=6 / 64）
    d.rectangle([s * 10 / 64, s * 46 / 64, s * 54 / 64, s * 52 / 64], fill=LEMON)
    f = font(MINCHO_B, int(s * 32 / 64))
    # svg は font-size 32 / baseline y=39 を中央寄せ
    d.text((s / 2, s * 39 / 64), "解", font=f, fill=WHITE, anchor="ms")
    im.thumbnail((size, size), Image.LANCZOS)
    return im


def make_og():
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), WASHI)
    d = ImageDraw.Draw(img)

    # 背景：右下に青海波をごく薄く敷く
    wave = Image.new("RGB", (W, H), WASHI)
    wd = ImageDraw.Draw(wave)
    r, step = 86, 60
    for row in range(4):
        cy = H - 40 + row * step
        offset = 0 if row % 2 == 0 else r
        for cx in range(600 - r, W + r * 2, r * 2):
            seigaiha(wd, cx + offset, cy, r, (226, 217, 205), rings=4, width=3)
    img = Image.blend(img, wave, 0.85)
    d = ImageDraw.Draw(img)

    # 外枠の罫（藍の細線）
    d.rectangle([28, 28, W - 29, H - 29], outline=AI, width=2)

    # 上段：判子マーク＋運営名
    mark = kaimark(img, 64)
    img.paste(mark, (72, 70), mark)
    d.text((152, 90), "企画・運営", font=font(GOTHIC_B, 20), fill=MUTED)
    d.text((152, 116), "タケムラテックラボ", font=font(GOTHIC_B, 25), fill=AI)

    # 主見出し（枠内に収まる級数へ自動調整）
    inner = W - 72 * 2
    head = "課題解決AIハッカソン"
    d.text((72, 226), head, font=fit(d, head, MINCHO_B, 128, inner), fill=AI)

    # 朱の罫
    d.rectangle([74, 388, 74 + 300, 393], fill=SHU)

    # 従見出し
    sub = "課題も新規事業も、3時間で形にする。"
    d.text((72, 424), sub, font=fit(d, sub, MINCHO_R, 44, inner), fill=AI_MID)
    d.text((74, 496), "企業・団体・自治体のお題（課題・新規事業）を募集しています",
           font=font(GOTHIC_B, 24), fill=MUTED)

    # 下端：レモンの帯
    d.rectangle([28, H - 42, W - 29, H - 29], fill=LEMON)

    img.save(os.path.join(OUT, "assets", "og.png"), "PNG", optimize=True)
    print("assets/og.png", img.size)


def make_favicons():
    for size, name in [(32, "favicon-32.png"),
                       (180, "apple-touch-icon.png"),
                       (192, "icon-192.png"),
                       (512, "icon-512.png")]:
        im = kaimark(None, size)
        bg = Image.new("RGB", (size, size), WHITE)
        bg.paste(im, (0, 0), im)
        bg.save(os.path.join(OUT, name), "PNG", optimize=True)
        print(name, bg.size)

    # .ico（16/32/48 をまとめる）
    ico = kaimark(None, 256).convert("RGBA")
    ico.save(os.path.join(OUT, "favicon.ico"), "ICO",
             sizes=[(16, 16), (32, 32), (48, 48)])
    print("favicon.ico")


if __name__ == "__main__":
    make_og()
    make_favicons()
