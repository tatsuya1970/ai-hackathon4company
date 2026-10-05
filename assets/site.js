/* ============================================================================
   課題解決AIハッカソン — interactions
   依存なしのバニラJS。prefers-reduced-motion / JS無効 / 旧ブラウザで必ず素のまま読める。
   ============================================================================ */
(function () {
  "use strict";

  var root = document.documentElement;
  var REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FINE = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var raf = window.requestAnimationFrame
    ? window.requestAnimationFrame.bind(window)
    : function (f) { return setTimeout(f, 16); };

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ───────────────────── 0. ブート / ローダー ───────────────────── */
  (function boot() {
    var MIN = 1150;
    var t0 = Date.now();
    function go() {
      root.classList.remove("booting");
      root.classList.add("loaded");
      try { sessionStorage.setItem("h4c-intro", "1"); } catch (e) {}
    }
    if (REDUCE || root.classList.contains("no-loader")) {
      root.classList.remove("booting");
      return;
    }
    function done() {
      var wait = Math.max(0, MIN - (Date.now() - t0));
      setTimeout(go, wait);
    }
    if (document.readyState === "complete") done();
    else addEventListener("load", done, { once: true });
    // 保険：読み込みが遅くても 4 秒で必ず開ける
    setTimeout(function () { if (root.classList.contains("booting")) go(); }, 4000);
  })();

  /* ───────────────────── 1. ヘッダー / 進捗 ───────────────────── */
  var bar = $(".bar");
  var pb = $(".bar .progress");
  var scrollY = 0, lastY = 0, vel = 0;

  function onScroll() {
    var h = document.documentElement;
    scrollY = h.scrollTop;
    var max = h.scrollHeight - h.clientHeight;
    if (pb) pb.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + "%";
    if (bar) bar.classList.toggle("scrolled", scrollY > 10);
  }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll, { passive: true });
  onScroll();

  /* ───────────────────── 2. 全画面ナビ ───────────────────── */
  (function nav() {
    var btn = $(".menu-btn");
    var ov = $(".nav-ov");
    if (!btn || !ov) return;
    var lastFocus = null;

    function open() {
      lastFocus = document.activeElement;
      root.classList.add("nav-open");
      btn.setAttribute("aria-expanded", "true");
      ov.removeAttribute("aria-hidden");
      setTimeout(function () {
        var f = $("a,button", ov);
        if (f) f.focus();
      }, 320);
    }
    function close() {
      root.classList.remove("nav-open");
      btn.setAttribute("aria-expanded", "false");
      ov.setAttribute("aria-hidden", "true");
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function toggle() { root.classList.contains("nav-open") ? close() : open(); }

    btn.addEventListener("click", toggle);
    ov.addEventListener("click", function (e) {
      if (e.target.closest("a")) close();
    });
    document.addEventListener("keydown", function (e) {
      if (!root.classList.contains("nav-open")) return;
      if (e.key === "Escape") { close(); return; }
      if (e.key !== "Tab") return;
      var f = $$('a[href],button:not([disabled])', ov).filter(function (el) {
        return el.offsetParent !== null;
      });
      f.unshift(btn);
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  })();

  /* ───────────────────── 3. 章インデックス / 暗転判定 ───────────────────── */
  (function rail() {
    var links = $$(".rail a");
    var targets = links.map(function (a) { return $(a.getAttribute("href")); });
    var darks = $$("section.ink, #contact, footer");
    if (!links.length && !darks.length) return;

    function mark() {
      var mid = innerHeight * 0.42;
      var best = -1;
      for (var i = 0; i < targets.length; i++) {
        var el = targets[i];
        if (el && el.getBoundingClientRect().top <= mid) best = i;
      }
      for (var j = 0; j < links.length; j++) links[j].classList.toggle("cur", j === best);

      var onDark = false;
      for (var k = 0; k < darks.length; k++) {
        var r = darks[k].getBoundingClientRect();
        if (r.top <= innerHeight / 2 && r.bottom >= innerHeight / 2) { onDark = true; break; }
      }
      root.classList.toggle("on-dark", onDark);
    }
    addEventListener("scroll", mark, { passive: true });
    addEventListener("resize", mark, { passive: true });
    mark();
  })();

  /* ───────────────────── 4. スクロールリビール ───────────────────── */
  (function reveal() {
    if (REDUCE || !("IntersectionObserver" in window)) return;
    var sel = ".sec-head,.feat,.card,.step,.steps,.tt-row,.statement,.chips,.sub-h,.note,.ind," +
      ".cmp,.prize-hero,.qa,.ov-row,.contact,.crosslink,.tbar,.tscale,.tt-note,.btns,.ex,.mid-h,.mid-p,.vs-p," +
      ".band-head,.flowline";
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("on");
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -9% 0px", threshold: 0.04 });

    $$(sel).forEach(function (el) {
      /* 「御社にお願いすること」は演出なしで最初から見える状態にする */
      if (el.closest(".hero") || el.closest("#role")) return;
      var sibs = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.transitionDelay = Math.min(sibs * 48, 240) + "ms";
      el.classList.add("rv");
      io.observe(el);
    });
  })();

  /* ───────────────────── 5. 数字カウンタ ───────────────────── */
  (function counters() {
    var els = $$("[data-count]");
    if (!els.length) return;
    if (REDUCE || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.textContent = el.getAttribute("data-count"); });
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target; io.unobserve(el);
        var to = parseFloat(el.getAttribute("data-count"));
        var dec = (el.getAttribute("data-count").split(".")[1] || "").length;
        var t0 = null, dur = 1100;
        (function step(ts) {
          if (t0 === null) t0 = ts;
          var p = clamp((ts - t0) / dur, 0, 1);
          var e2 = 1 - Math.pow(1 - p, 3);
          el.textContent = (to * e2).toFixed(dec);
          if (p < 1) raf(step);
        })(performance.now());
      });
    }, { threshold: 0.2, rootMargin: "0px 0px -5% 0px" });
    els.forEach(function (el) { el.textContent = "0"; io.observe(el); });
  })();

  /* ───────────────────── 6. ティッカー（スクロール速度に反応） ───────────────────── */
  (function ticker() {
    var rows = $$(".ticker");
    if (!rows.length) return;
    if (REDUCE) { root.classList.add("no-tickjs"); return; }

    var items = rows.map(function (row, i) {
      var inner = $(".ticker-in", row);
      return { el: inner, x: 0, w: 0, dir: i % 2 ? -1 : 1, base: 0.42 };
    });
    function measure() {
      items.forEach(function (it) { it.w = it.el.scrollWidth / 2 || 1; });
    }
    measure();
    addEventListener("resize", measure, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

    var smooth = 0;
    (function tick() {
      vel = scrollY - lastY; lastY = scrollY;
      smooth = lerp(smooth, clamp(vel, -90, 90), 0.1);
      items.forEach(function (it) {
        var d = it.dir * (it.base + Math.abs(smooth) * 0.055) + smooth * 0.3 * it.dir;
        it.x -= d;
        if (it.x <= -it.w) it.x += it.w;
        if (it.x > 0) it.x -= it.w;
        it.el.style.transform = "translate3d(" + it.x.toFixed(2) + "px,0,0)";
      });
      raf(tick);
    })();
  })();

  /* ───────────────────── 7. ポインタ連動（ひかり・ボタン） ───────────────────── */
  (function pointer() {
    if (!FINE || REDUCE) return;
    var hero = $(".hero");

    /* HERO のひかりをポインタに追従させる */
    if (hero) {
      document.addEventListener("pointermove", function (e) {
        var r = hero.getBoundingClientRect();
        if (r.bottom > 0 && r.top < innerHeight) {
          hero.style.setProperty("--mx", (e.clientX - r.left) + "px");
          hero.style.setProperty("--my", (e.clientY - r.top) + "px");
        }
      }, { passive: true });
    }

    /* ボタンがポインタにわずかに引き寄せられる */
    $$(".mag").forEach(function (el) {
      var r = null;
      el.addEventListener("pointerenter", function () { r = el.getBoundingClientRect(); });
      el.addEventListener("pointermove", function (e) {
        if (!r) r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * 0.12;
        var dy = (e.clientY - (r.top + r.height / 2)) * 0.16;
        el.style.transform = "translate3d(" + dx + "px," + dy + "px,0)";
      });
      el.addEventListener("pointerleave", function () {
        r = null; el.style.transform = "";
      });
    });
  })();

  /* ───────────────────── 8. HERO：青海波の水面（canvas） ───────────────────── */
  (function wave() {
    var hero = $(".hero");
    var cv = hero && $("canvas.wave", hero);
    if (!cv || !cv.getContext) return;
    var ctx = cv.getContext("2d", { alpha: true });
    if (!ctx) return;

    var dpr = 1, W = 0, H = 0, PAD = 0, SLICE = 0;
    var src = null, tile = null;
    var mx = -9999, amp2 = 0, t = 0, visible = true, running = false;

    function makeTile() {
      var u = 48, v = 24;
      var c = document.createElement("canvas");
      c.width = Math.round(u * dpr); c.height = Math.round(v * dpr);
      var g = c.getContext("2d");
      g.scale(dpr, dpr);
      g.fillStyle = "#F7F3EC"; g.fillRect(0, 0, u, v);
      g.lineWidth = 1;
      var pts = [[24, -12], [0, 0], [48, 0], [24, 12], [0, 24], [48, 24], [24, 36]];
      var rs = [23, 17, 11, 5];
      for (var i = 0; i < pts.length; i++) {
        g.beginPath(); g.arc(pts[i][0], pts[i][1], 23, 0, 6.2832);
        g.fillStyle = "#F7F3EC"; g.fill();
        g.strokeStyle = "rgba(200,16,46,.30)";
        for (var k = 0; k < rs.length; k++) {
          g.beginPath(); g.arc(pts[i][0], pts[i][1], rs[k], 0, 6.2832); g.stroke();
        }
      }
      return c;
    }

    function build() {
      var r = hero.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = Math.max(1, Math.round(r.width * dpr));
      H = Math.max(1, Math.round(r.height * dpr));
      PAD = Math.round(34 * dpr);
      SLICE = Math.max(6, Math.round(11 * dpr));
      cv.width = W; cv.height = H;
      cv.style.width = r.width + "px"; cv.style.height = r.height + "px";

      tile = makeTile();
      src = document.createElement("canvas");
      src.width = W; src.height = H + PAD * 2;
      var g = src.getContext("2d");
      var pat = g.createPattern(tile, "repeat");
      g.fillStyle = pat;
      g.fillRect(0, 0, src.width, src.height);
    }

    function draw() {
      if (!src) return;
      ctx.clearRect(0, 0, W, H);
      var base = 9 * dpr;
      var n = Math.ceil(W / SLICE);
      for (var i = 0; i <= n; i++) {
        var x = i * SLICE;
        var dy = Math.sin(x / (120 * dpr) + t) * base
               + Math.sin(x / (47 * dpr) - t * 1.6) * base * 0.42;
        if (amp2 > 0.01) {
          var d = (x - mx) / dpr;
          dy += amp2 * Math.exp(-(d * d) / 16000) * Math.sin(d / 24 - t * 3.4) * dpr;
        }
        ctx.drawImage(src, x, 0, SLICE + 1, src.height,
                           x, -PAD + dy, SLICE + 1, src.height);
      }
    }

    function frame() {
      if (!visible || document.hidden) { running = false; return; }
      t += 0.011;
      amp2 *= 0.975;
      draw();
      raf(frame);
    }
    function start() {
      if (running || REDUCE) return;
      running = true; raf(frame);
    }

    var rid;
    function resize() {
      clearTimeout(rid);
      rid = setTimeout(function () { build(); draw(); }, 140);
    }

    build(); draw();
    root.classList.add("wave-on");

    if (REDUCE) return;
    start();
    addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", function () { if (!document.hidden) start(); });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        if (visible) start();
      }, { threshold: 0 }).observe(hero);
    }

    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      mx = (e.clientX - r.left) * dpr;
      amp2 = Math.min(34, amp2 + 3.2);
    }, { passive: true });
  })();

  /* ───────────────────── 10. 内部リンクのスムーススクロール補正 ───────────────────── */
  (function anchors() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.getElementById(id.slice(1));
      if (!el) return;
      e.preventDefault();
      if (root.classList.contains("nav-open")) {
        root.classList.remove("nav-open");
        var mb = $(".menu-btn"); if (mb) mb.setAttribute("aria-expanded", "false");
      }
      var barH = parseFloat(getComputedStyle(root).getPropertyValue("--bar-h")) || 68;
      var y = window.pageYOffset + el.getBoundingClientRect().top - barH - 8;
      scrollTo({ top: y, behavior: REDUCE ? "auto" : "smooth" });
      history.replaceState(null, "", id);
      el.setAttribute("tabindex", "-1");
      setTimeout(function () { el.focus({ preventScroll: true }); }, REDUCE ? 0 : 620);
    });
  })();

  /* ───────────────────── 11. FAQ：ひとつ開くと他を閉じる ───────────────────── */
  (function faq() {
    var qs = $$(".faq .qa");
    qs.forEach(function (d) {
      d.addEventListener("toggle", function () {
        if (!d.open) return;
        qs.forEach(function (o) { if (o !== d) o.open = false; });
      });
    });
  })();
})();
