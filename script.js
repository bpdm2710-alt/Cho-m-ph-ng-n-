/* =========================================================
   CẤU HÌNH – chỉ cần sửa 2 dòng này
   ========================================================= */
const CONFIG = {
  friendName: 'MPhuong',      // tên người nhận, hiện ở màn mở quà và đầu trang
  yourName: 'Minh'     // tên bạn, hiện ở cuối trang
};

(() => {
  'use strict';

  const $  = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const CONFETTI_COLORS = ['#FFE79A', '#FFB59A', '#A9E8CF', '#B7A4F2', '#F6A8D0', '#FFF8F0'];
  const PETAL_COLORS    = ['#F6A8D0', '#FFB59A', '#FFD1E3', '#D8CCFA', '#FFF0F5'];
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  /* ---------- Điền tên ---------- */
  $$('[data-name]').forEach(el => {
    const v = el.dataset.name === 'friend' ? CONFIG.friendName : CONFIG.yourName;
    if (v) el.textContent = v;
  });
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* =========================================================
     DÂY ĐÈN NHẤP NHÁY
     ========================================================= */
  function buildLights() {
    const box = $('#lights');
    const w = innerWidth;
    const swagW = w < 600 ? 90 : 130;
    const swags = Math.max(2, Math.ceil(w / swagW));
    const sw = w / swags;
    const sag = w < 600 ? 16 : 22;
    const top = 6;
    const NS = 'http://www.w3.org/2000/svg';

    box.innerHTML = '';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', w);
    svg.setAttribute('height', top + sag + 30);

    let d = `M0 ${top}`;
    const bulbs = [];
    for (let i = 0; i < swags; i++) {
      const x0 = i * sw, x1 = x0 + sw, cx = x0 + sw / 2, cy = top + sag * 2;
      d += ` Q ${cx} ${cy} ${x1} ${top}`;
      for (let j = 1; j <= 3; j++) {
        const t = j / 4, u = 1 - t;
        bulbs.push([
          u * u * x0 + 2 * u * t * cx + t * t * x1,
          u * u * top + 2 * u * t * cy + t * t * top
        ]);
      }
    }
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'rgba(255,255,255,.35)');
    path.setAttribute('stroke-width', '1.5');
    svg.appendChild(path);
    box.appendChild(svg);

    bulbs.forEach(([x, y], i) => {
      const b = document.createElement('span');
      b.className = 'bulb c' + (i % 4);
      b.style.left = x + 'px';
      b.style.top = y + 'px';
      b.style.animationDelay = (-Math.random() * 2.4).toFixed(2) + 's';
      box.appendChild(b);
    });
  }

  /* =========================================================
     CÁNH HOA RƠI (nền)
     ========================================================= */
  const pCanvas = $('#petals');
  const pCtx = pCanvas.getContext('2d');
  let W = 0, H = 0, petals = [];

  function sizeCanvas(c, ctx) {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    c.width = W * dpr;
    c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makePetal(initial) {
    return {
      x: rand(0, W),
      y: initial ? rand(0, H) : rand(-40, -10),
      s: rand(6, 13),
      vy: rand(0.3, 0.9),
      sway: rand(0, Math.PI * 2),
      swaySpeed: rand(0.005, 0.015),
      amp: rand(0.4, 1.1),
      rot: rand(0, Math.PI * 2),
      vr: rand(-0.03, 0.03),
      color: pick(PETAL_COLORS),
      alpha: rand(0.35, 0.75)
    };
  }

  function layoutPetals() {
    const count = Math.round(Math.min(34, W / 40));
    petals = Array.from({ length: count }, () => makePetal(true));
  }

  function petalLoop() {
    pCtx.clearRect(0, 0, W, H);
    for (const p of petals) {
      p.sway += p.swaySpeed;
      p.x += Math.sin(p.sway) * p.amp;
      p.y += p.vy;
      p.rot += p.vr;
      if (p.y > H + 20) Object.assign(p, makePetal(false));

      pCtx.save();
      pCtx.translate(p.x, p.y);
      pCtx.rotate(p.rot);
      pCtx.globalAlpha = p.alpha;
      pCtx.fillStyle = p.color;
      pCtx.beginPath();
      pCtx.ellipse(0, 0, p.s, p.s * 0.55, 0, 0, Math.PI * 2);
      pCtx.fill();
      pCtx.restore();
    }
    requestAnimationFrame(petalLoop);
  }

  /* =========================================================
     PHÁO GIẤY / HOA (khi mở quà, bấm nút, chạm màn hình)
     ========================================================= */
  const fCanvas = $('#fx');
  const fCtx = fCanvas.getContext('2d');
  let parts = [];
  let fxRunning = false;

  function burst(x, y, { count = 90, power = 1, petal = false, all = false } = {}) {
    if (reduce) return;
    for (let i = 0; i < count; i++) {
      const angle = all ? rand(0, Math.PI * 2) : rand(-Math.PI * 0.92, -Math.PI * 0.08);
      const speed = rand(3, 12) * power;
      parts.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        g: petal ? 0.1 : 0.22,
        drag: 0.985,
        w: rand(6, 12),
        h: rand(4, 8),
        rot: rand(0, Math.PI * 2),
        vr: rand(-0.3, 0.3),
        ph: rand(0, Math.PI * 2),
        color: petal ? pick(PETAL_COLORS) : pick(CONFETTI_COLORS),
        shape: petal ? 'petal' : (Math.random() < 0.3 ? 'dot' : 'rect'),
        life: 0,
        max: rand(90, 150)
      });
    }
    if (!fxRunning) {
      fxRunning = true;
      requestAnimationFrame(fxLoop);
    }
  }

  function fxLoop() {
    fCtx.clearRect(0, 0, W, H);
    parts = parts.filter(p => p.life < p.max);

    for (const p of parts) {
      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.g;
      p.x += p.vx + (p.shape === 'petal' ? Math.sin(p.life * 0.1 + p.ph) * 0.8 : 0);
      p.y += p.vy;
      p.rot += p.vr;
      p.life++;

      const fade = p.life > p.max * 0.75 ? 1 - (p.life - p.max * 0.75) / (p.max * 0.25) : 1;
      fCtx.save();
      fCtx.translate(p.x, p.y);
      fCtx.rotate(p.rot);
      fCtx.globalAlpha = Math.max(0, fade);
      fCtx.fillStyle = p.color;
      if (p.shape === 'rect') {
        fCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      } else if (p.shape === 'dot') {
        fCtx.beginPath();
        fCtx.arc(0, 0, p.h / 1.6, 0, Math.PI * 2);
        fCtx.fill();
      } else {
        fCtx.beginPath();
        fCtx.ellipse(0, 0, p.w, p.h * 0.8, 0, 0, Math.PI * 2);
        fCtx.fill();
      }
      fCtx.restore();
    }

    if (parts.length) {
      requestAnimationFrame(fxLoop);
    } else {
      fxRunning = false;
      fCtx.clearRect(0, 0, W, H);
    }
  }

  /* =========================================================
     ẢNH: ảnh thiếu thì hiện khung giữ chỗ, rửa ảnh khi cuộn tới
     ========================================================= */
  function placeholder(n) {
    const colors = ['#B7A4F2', '#FFB59A', '#A9E8CF', '#FFE79A', '#F6A8D0'];
    const svg =
      `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'>` +
      `<rect width='600' height='600' fill='${colors[n % colors.length]}'/>` +
      `<text x='300' y='285' font-family='sans-serif' font-size='40' font-weight='bold' text-anchor='middle' fill='#2E1F4D'>Ảnh ${n + 1}</text>` +
      `<text x='300' y='335' font-family='sans-serif' font-size='24' text-anchor='middle' fill='#2E1F4D'>images/anh${n + 1}.jpg</text>` +
      `</svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  $$('.photo img').forEach((img, i) => {
    const fallback = () => { img.onerror = null; img.src = placeholder(i); };
    img.addEventListener('error', fallback);
    if (img.complete && img.naturalWidth === 0) fallback();
  });

  const polaroids = $$('.polaroid');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('developed');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    polaroids.forEach(p => io.observe(p));
  } else {
    polaroids.forEach(p => p.classList.add('developed'));
  }

  /* =========================================================
     MỞ QUÀ
     ========================================================= */
  const intro = $('#intro');
  const gift  = $('#gift');
  const hint  = $('#hint');

  function openGift() {
    intro.classList.add('shaking');

    setTimeout(() => {
      intro.classList.remove('shaking');
      intro.classList.add('opened');

      const r = gift.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height * 0.35;
      burst(cx, cy, { count: 130, power: 1.1 });
      setTimeout(() => burst(cx, cy, { count: 60, power: 0.8, petal: true }), 350);

      hint.textContent = 'Chúc mừng 20/10!';
      hint.classList.add('big');
    }, reduce ? 0 : 650);

    setTimeout(() => {
      document.body.classList.add('revealed');
      intro.classList.add('leaving');
      window.scrollTo(0, 0);

      const h1 = $('.hero-title');
      h1.setAttribute('tabindex', '-1');
      h1.focus({ preventScroll: true });

      setTimeout(() => { intro.hidden = true; }, 1000);
    }, reduce ? 400 : 2700);
  }

  gift.addEventListener('click', openGift, { once: true });

  /* ---------- Nút "Thả thêm hoa" + chạm màn hình ---------- */
  $('#more').addEventListener('click', e => {
    const r = e.currentTarget.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top, { count: 80, power: 1.1, petal: true });
    burst(r.left + r.width / 2, r.top, { count: 50, power: 1 });
  });

  document.addEventListener('pointerdown', e => {
    if (!document.body.classList.contains('revealed')) return;
    if (e.target.closest('button')) return;
    burst(e.clientX, e.clientY, { count: 14, power: 0.45, all: true });
  });

  /* =========================================================
     KHỞI TẠO + RESIZE
     ========================================================= */
  function resizeAll() {
    W = innerWidth;
    H = innerHeight;
    sizeCanvas(pCanvas, pCtx);
    sizeCanvas(fCanvas, fCtx);
    layoutPetals();
    buildLights();
  }

  let rt;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(resizeAll, 150);
  });

  resizeAll();
  if (!reduce) requestAnimationFrame(petalLoop);
})();