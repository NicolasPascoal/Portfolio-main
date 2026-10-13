const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------
   Lente do hero: revela a camada de código sob a tela.
   A posição é suavizada (lerp) e o loop para quando a lente
   chega ao destino.
------------------------------------------------------------ */
const stage = document.getElementById('stage');

if (stage) {
  const rest = document.getElementById('lens-rest');
  const toggle = document.getElementById('reveal-all');

  const cur = { x: 0, y: 0, r: 0 };
  const target = { x: 0, y: 0, r: 0 };
  let running = false;
  let introTimers = [];
  let pointerInside = false;

  const radius = () => Math.round(Math.min(130, Math.max(72, stage.clientWidth * 0.2)));

  const xrays = [...stage.querySelectorAll('.xray')];

  // Cada .xray mascara em coordenadas próprias; o deslocamento alinha todas à mesma lente.
  const measure = () => {
    const s = stage.getBoundingClientRect();
    xrays.forEach((el) => {
      const b = el.getBoundingClientRect();
      el.style.setProperty('--ox', `${b.left - s.left}px`);
      el.style.setProperty('--oy', `${b.top - s.top}px`);
    });
  };

  const centerOf = (el) => {
    const s = stage.getBoundingClientRect();
    const b = el.getBoundingClientRect();
    return { x: b.left - s.left + b.width / 2, y: b.top - s.top + b.height / 2 };
  };

  const paint = () => {
    stage.style.setProperty('--x', `${cur.x}px`);
    stage.style.setProperty('--y', `${cur.y}px`);
    stage.style.setProperty('--r', `${cur.r}px`);
  };

  const tick = () => {
    const k = 0.14;
    cur.x += (target.x - cur.x) * k;
    cur.y += (target.y - cur.y) * k;
    cur.r += (target.r - cur.r) * 0.12;
    paint();

    const done = Math.abs(target.x - cur.x) < 0.3 && Math.abs(target.y - cur.y) < 0.3 && Math.abs(target.r - cur.r) < 0.3;
    if (done) {
      Object.assign(cur, target);
      paint();
      running = false;
      return;
    }
    requestAnimationFrame(tick);
  };

  const go = () => {
    if (!running) {
      running = true;
      requestAnimationFrame(tick);
    }
  };

  const toRest = () => {
    const p = centerOf(rest);
    target.x = p.x;
    target.y = p.y;
    target.r = radius();
  };

  const snapToRest = () => {
    toRest();
    Object.assign(cur, target);
    paint();
  };

  const clearIntro = () => {
    introTimers.forEach(clearTimeout);
    introTimers = [];
  };

  // Abertura: a lente percorre a tela uma vez e para sobre o alerta.
  const intro = () => {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    cur.x = w * 0.22;
    cur.y = h * 0.42;
    cur.r = 0;
    paint();

    const path = [
      [0, w * 0.26, h * 0.46],
      [650, w * 0.34, h * 0.16],
      [1350, w * 0.42, h * 0.88],
    ];
    path.forEach(([t, x, y]) => {
      introTimers.push(setTimeout(() => {
        target.x = x;
        target.y = y;
        target.r = radius();
        go();
      }, 350 + t));
    });
    introTimers.push(setTimeout(() => {
      toRest();
      go();
    }, 350 + 2100));
  };

  const follow = (e) => {
    const s = stage.getBoundingClientRect();
    target.x = e.clientX - s.left;
    target.y = e.clientY - s.top;
    target.r = radius();
    if (reduceMotion) {
      Object.assign(cur, target);
      paint();
    } else {
      go();
    }
  };

  stage.addEventListener('pointerenter', () => {
    pointerInside = true;
    clearIntro();
  });

  stage.addEventListener('pointermove', follow);
  stage.addEventListener('pointerdown', (e) => {
    clearIntro();
    follow(e);
  });

  stage.addEventListener('pointerleave', (e) => {
    pointerInside = false;
    // No toque, a lente fica onde o dedo deixou.
    if (e.pointerType !== 'mouse') return;
    toRest();
    reduceMotion ? snapToRest() : go();
  });

  toggle.addEventListener('click', () => {
    const on = toggle.getAttribute('aria-pressed') !== 'true';
    toggle.setAttribute('aria-pressed', String(on));
    stage.classList.toggle('is-revealed', on);
  });

  // Layout do palco pode mudar com fontes e largura; mede de novo quando mudar.
  new ResizeObserver(measure).observe(stage);

  window.addEventListener('resize', () => {
    if (pointerInside) return;
    clearIntro();
    snapToRest();
  });

  const start = () => {
    measure();
    reduceMotion ? snapToRest() : intro();
  };
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(start);
  } else {
    window.addEventListener('load', start);
  }
}

/* ------------------------------------------------------------
   Borda do topo só depois de rolar
------------------------------------------------------------ */
const topbar = document.querySelector('.topbar');
const onScroll = () => topbar.classList.toggle('is-scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ------------------------------------------------------------
   Copiar e-mail
------------------------------------------------------------ */
const emailBtn = document.querySelector('.email-copy');

if (emailBtn) {
  const state = emailBtn.querySelector('.email-state');
  const idle = state.textContent;
  let timer;

  emailBtn.addEventListener('click', async () => {
    const email = emailBtn.dataset.email;
    try {
      await navigator.clipboard.writeText(email);
      state.textContent = 'E-mail copiado';
      emailBtn.classList.add('is-copied');
    } catch {
      window.location.href = `mailto:${email}`;
      return;
    }
    clearTimeout(timer);
    timer = setTimeout(() => {
      state.textContent = idle;
      emailBtn.classList.remove('is-copied');
    }, 2400);
  });
}
