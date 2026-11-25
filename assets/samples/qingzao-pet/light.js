// 晴澡寵物美容：首屏右邊的水光（概念作品）
// 用 2D canvas 畫一張慢慢流動的水面光紋，像澡盆底下的光。
// 只在看得到的時候動；使用者設定「減少動態」時，只畫一張靜止的。
'use strict';

(() => {
  const canvas = document.getElementById('light');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });
  const root = getComputedStyle(document.documentElement);

  // 把 CSS 顏色換成 RGB（canvas 要數字）
  const px = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  function rgb(name) {
    const v = root.getPropertyValue(name).trim();
    if (!v) return null;
    px.clearRect(0, 0, 1, 1);
    px.fillStyle = v;
    px.fillRect(0, 0, 1, 1);
    const [r, g, b] = px.getImageData(0, 0, 1, 1).data;
    return [r, g, b];
  }
  const shade = rgb('--color-shade') || [178, 222, 233];
  const deep = rgb('--color-shade-2') || [128, 186, 208];
  const light = rgb('--color-light') || [255, 254, 251];

  const SCALE = 3; // 畫小一點再放大，光紋自然柔
  let W = 0, H = 0, img = null;

  function size() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(2, Math.round(r.width / SCALE));
    H = Math.max(2, Math.round(r.height / SCALE));
    canvas.width = W; canvas.height = H;
    img = ctx.createImageData(W, H);
  }

  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  function frame(t) {
    const d = img.data;
    const k = 0.045 * SCALE; // 光紋的密度
    for (let j = 0; j < H; j++) {
      for (let i = 0; i < W; i++) {
        const x = i * k, y = j * k;
        // 先把座標扭一下，再取兩組波的「零點」當亮線，交錯成網
        const x2 = x + 0.85 * Math.sin(y * 1.25 + t * 0.52);
        const y2 = y + 0.85 * Math.sin(x * 1.05 - t * 0.43);
        const v = Math.sin(x2 * 1.6 + t * 0.31) + Math.sin(y2 * 1.8 - t * 0.37) + Math.sin((x2 + y2) * 1.15 + t * 0.23);
        const w = Math.sin(x2 * 1.25 - y2 * 0.95 + t * 0.21) + Math.sin(y2 * 2.05 + x2 * 0.35 + t * 0.29);
        const a = 1 - sstep(0.0, 0.42, Math.abs(v));
        const b = 1 - sstep(0.0, 0.34, Math.abs(w));
        let I = Math.max(a, b * 0.9);
        I = Math.pow(I, 1.35);
        // 底色：上淺下深一點點，像水有深度
        const g = j / H;
        const p = (j * W + i) * 4;
        for (let c = 0; c < 3; c++) {
          const base = shade[c] * (1 - g * 0.35) + deep[c] * (g * 0.35);
          d[p + c] = base + (light[c] - base) * I;
        }
        d[p + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  const still = matchMedia('(prefers-reduced-motion: reduce)');
  let running = false, visible = true, raf = 0, last = 0;
  const T0 = 4.2; // 靜止時用的那一格

  function loop(now) {
    if (!running) return;
    if (now - last > 80) { frame(T0 + now / 1000 * 0.5); last = now; }
    raf = requestAnimationFrame(loop);
  }
  function update() {
    const go = visible && !still.matches && !document.hidden;
    if (go && !running) { running = true; raf = requestAnimationFrame(loop); }
    if (!go && running) { running = false; cancelAnimationFrame(raf); }
    if (!go) frame(T0);
  }

  size(); frame(T0);
  new ResizeObserver(() => { size(); frame(T0); }).observe(canvas);
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; update(); }).observe(canvas);
  still.addEventListener('change', update);
  document.addEventListener('visibilitychange', update);
  update();
})();
