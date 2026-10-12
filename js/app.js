import {
  SPORTS, LINEUP, ORIGIN_PAIRS, ORIGIN_PIECES, PRODUCTS, BY_ID, SIZES, photo, tile,
} from './data.js?v=16';   // keep the version in step with index.html, so a stale copy is never mixed in
import { createPlate } from './plate.js?v=16';

const root = document.documentElement;
window.__tavra = true;

try {
  boot();
} catch (err) {
  console.error('[tavra] boot failed — showing the page without motion', err);
  root.classList.remove('js');
  document.getElementById('loader')?.classList.add('is-done');
}

function boot() {
  /* ================================================================ helpers */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const expoOut = t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
  const smoothstep = t => t * t * (3 - 2 * t);
  const cubicOut = t => 1 - Math.pow(1 - t, 3);
  const r3 = v => Math.round(v * 1000) / 1000;
  const lag = (cur, target, dt, tau) => cur + (target - cur) * (1 - Math.exp(-dt * tau));
  const indexOf = el => parseFloat(el.style.getPropertyValue('--i')) || 0;
  const docTop = el => { let y = 0; for (let e = el; e; e = e.offsetParent) y += e.offsetTop; return y; };
  const pad = v => String(v).padStart(2, '0');
  const euro = v => `€${v}`;
  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };

  const memo = new WeakMap();
  const stateOf = n => { let m = memo.get(n); if (!m) memo.set(n, (m = {})); return m; };
  const setVar = (n, name, v) => { const m = stateOf(n); if (m[name] !== v) { m[name] = v; n.style.setProperty(name, v); } };
  const flag = (n, cls, on) => { const m = stateOf(n); if (m[cls] !== on) { m[cls] = on; n.classList.toggle(cls, on); } };

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ========================================================= smooth scroll */
  const lenis = window.Lenis && !reduced ? new window.Lenis({ autoRaf: false, lerp: 0.085 }) : null;
  const scrollToEl = target => {
    const y = target ? docTop(target) : 0;
    if (lenis) lenis.scrollTo(y, { duration: 1.6 });
    else window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
  };

  /* ============================================================== content */
  // marquee: two identical runs so it can loop seamlessly
  const marquee = $('[data-marquee]');
  const MARQ = [['Lotus', 'leheriya'], ['Bengal', 'ikat'], ['Vermilion', 'bandhani'], ['Indigo', 'ajrakh'], ['Ivory', 'zari-gold'], ['Noir', 'mirror']];
  for (let k = 0; k < 2; k++) {
    for (const [name, tex] of MARQ) {
      const item = el('span', 'marquee__item', `${name}<i style="--tex:url(${tile(tex)})"></i>`);
      marquee.append(item);
    }
  }

  // sport: the headline as letters, one athlete per sport, one kit tile per sport
  const arenaTitle = $('[data-arena-title]');
  const titleLetters = [...arenaTitle.textContent].map((ch, k) => {
    const s = el('span', ch === ' ' ? 'arena__gap' : 'arena__l');
    s.textContent = ch;
    if (ch !== ' ') { s.dataset.reveal = 'scroll'; s.style.setProperty('--i', (k * 0.12).toFixed(2)); }
    return s;
  });
  arenaTitle.replaceChildren(...titleLetters);
  // a second, outlined copy of the headline sits in front of the athlete, so the letters she covers still read
  const titleFront = arenaTitle.parentElement.cloneNode(true);
  titleFront.removeAttribute('id');
  titleFront.removeAttribute('aria-label');
  titleFront.setAttribute('aria-hidden', 'true');
  titleFront.classList.add('arena__title--front');
  $('[data-arena-figs]').after(titleFront);
  const arenaWords = [arenaTitle, $('[data-arena-title]', titleFront)];
  // each sport's campaign shot, as a card standing in front of the headline
  const arenaFigs = SPORTS.map((sp, i) => {
    const fig = el('figure', 'arena__fig');
    const img = el('img');
    img.src = photo(sp.shot);
    img.alt = sp.shotAlt;
    img.width = 1122; img.height = 1402;
    img.decoding = 'async';
    img.loading = i ? 'lazy' : 'eager';
    img.style.objectPosition = sp.shotPos;
    fig.append(img);
    $('[data-arena-figs]').append(fig);
    return fig;
  });
  const arenaTabs = SPORTS.map((sp, i) => {
    const b = el('button', 'arena__tab', sp.name);
    b.type = 'button';
    b.setAttribute('role', 'tab');
    $('[data-arena-tabs]').append(b);
    return b;
  });
  // one tile per sport: the campaign shot and its caption
  const kitGrid = $('[data-kit-grid]');
  SPORTS.forEach((sp, i) => {
    const li = el('li', 'kit__item');
    li.dataset.reveal = 'scroll';
    li.style.setProperty('--i', String(i * 0.5));
    li.innerHTML = `
      <a class="kit__tile" href="#shop" data-cursor="Shop"${sp.blend ? ' data-blend' : ''}>
        <span class="kit__photo"><img src="${photo(sp.shot)}" alt="${sp.shotAlt}" width="1122" height="1402" loading="lazy" decoding="async" style="--pos:${sp.shotPos}"></span>
        <span class="kit__cap">
          <span class="kit__no">${pad(i + 1)}</span>
          <span class="kit__name">${sp.name}</span>
          <span class="kit__list">${sp.print} · ${sp.line.split(',')[0]}</span>
          <span class="kit__more">Shop ${sp.name.toLowerCase()}</span>
        </span>
      </a>`;
    kitGrid.append(li);
  });

  // lineup: studio sets sit on their own colour, campaign shots fill the card
  {
    const box = $('#lineup .lineup');
    const ctrl = $('.lineup__ctrl', box);
    LINEUP.forEach((l, i) => {
      const b = el('button', `look${l.cut ? ' look--cut' : ''}`);
      b.type = 'button';
      b.dataset.collection = l.tag;
      b.dataset.name = l.name;
      b.style.setProperty('--b', l.bg || 'var(--studio)');
      b.innerHTML = `<img src="${photo(l.img)}" alt="" decoding="async"${i > 6 ? ' loading="lazy"' : ''} style="object-position:${l.pos || '50% 100%'}">`;
      box.insertBefore(b, ctrl);
    });
    $('[data-meta="range"]', box).textContent = `01–${pad(LINEUP.length)}`;
  }

  // origins: the artworks and the pieces scattered round the sentence; each knows its pair
  const oStage = $('[data-origin-stage]');
  const oPieces = ORIGIN_PIECES.map(o => {
    const [x, y, w, tilt] = o.at;
    const pr = ORIGIN_PAIRS[o.pair];
    const f = el('figure', `opiece${o.art ? ' opiece--art' : ''}`);
    f.style.cssText = `--x:${x};--y:${y};--w:${w};--ar:${(o.w / o.h).toFixed(4)};--tilt:${tilt}deg`;   // units of the 16:9 collage (see .origins__stage)
    f.dataset.pair = String(o.pair);
    f.tabIndex = 0;
    f.innerHTML = `<img src="${photo(o.img)}" alt="${o.alt}" width="${o.w}" height="${o.h}" loading="lazy" decoding="async">
      <figcaption class="opiece__cap">${o.art ? pr.art : pr.piece}</figcaption>`;
    $('[data-origin-pieces]').append(f);
    return f;
  });
  // each piece flies in from beyond its corner of the stage, and leans with the pointer by its depth
  const oFly = ORIGIN_PIECES.map((o, i) => {
    const [x, y, w, , depth] = o.at;
    const dx = (x + w / 2 - 50) / 50, dy = (y + 12 - 50) / 50, len = Math.hypot(dx, dy) || 1;
    return { dx: dx / len, dy: dy / len, depth, spin: (i % 2 ? 1 : -1) * 22 };
  });
  const oWords = $$('.ot', oStage);
  const oStickers = $$('.sticker', oStage);

  /* ================================================================== bag */
  const BAG_KEY = 'tavra-bag-v1';
  const bag = {
    items: (() => {
      try {
        const raw = JSON.parse(localStorage.getItem(BAG_KEY) || '[]');
        return Array.isArray(raw) ? raw.filter(x => BY_ID[x.id] && SIZES.includes(x.size) && x.qty > 0) : [];
      } catch { return []; }
    })(),
    save() { try { localStorage.setItem(BAG_KEY, JSON.stringify(this.items)); } catch { /* storage unavailable */ } },
    add(id, size) {
      const hit = this.items.find(x => x.id === id && x.size === size);
      if (hit) hit.qty = Math.min(10, hit.qty + 1); else this.items.push({ id, size, qty: 1 });
      this.save(); renderBag();
    },
    step(i, d) {
      const it = this.items[i]; if (!it) return;
      it.qty = clamp(it.qty + d, 0, 10);
      if (!it.qty) this.items.splice(i, 1);
      this.save(); renderBag();
    },
    remove(i) { this.items.splice(i, 1); this.save(); renderBag(); },
    get count() { return this.items.reduce((n, x) => n + x.qty, 0); },
    get total() { return this.items.reduce((n, x) => n + BY_ID[x.id].price * x.qty, 0); },
  };
  const bagEl = $('#bag');
  const bagList = $('[data-bag-items]');
  const scrim = $('[data-scrim]');
  const hdrBag = $('.hdr__bag');
  function renderBag() {
    $$('[data-bag-count]').forEach(n => { n.textContent = bag.count; });
    $('[data-bag-total]').textContent = euro(bag.total);
    $('[data-bag-empty]').hidden = bag.items.length > 0;
    $('.bag__foot').hidden = bag.items.length === 0;
    bagList.replaceChildren(...bag.items.map((it, i) => {
      const p = BY_ID[it.id];
      const li = el('li', 'bag__item');
      li.innerHTML = `
        <div class="bag__thumb" style="--b:${p.bg}"><img src="${p.img}" alt="" style="--zoom:${p.zoom};--focus:${p.focus}"></div>
        <div><p class="bag__name">${p.name}</p><p class="bag__meta">${p.color} · Size ${it.size}</p>
          <div class="bag__qty"><button type="button" data-q="-1" aria-label="One fewer ${p.name}">−</button><span>${it.qty}</span><button type="button" data-q="1" aria-label="One more ${p.name}">+</button></div></div>
        <div class="bag__side"><span>${euro(p.price * it.qty)}</span><button class="bag__remove" type="button" data-rm>Remove</button></div>`;
      li.querySelectorAll('[data-q]').forEach(b => b.addEventListener('click', () => bag.step(i, Number(b.dataset.q))));
      li.querySelector('[data-rm]').addEventListener('click', () => bag.remove(i));
      return li;
    }));
  }

  let lastFocus = null;
  function openBag() {
    closeMenu();
    lastFocus = document.activeElement;
    scrim.hidden = false;
    requestAnimationFrame(() => scrim.classList.add('is-open'));
    bagEl.classList.add('is-open');
    bagEl.inert = false;
    bagEl.setAttribute('aria-hidden', 'false');
    lenis?.stop();
    $('[data-bag-close]').focus({ preventScroll: true });
  }
  function closeBag() {
    if (!bagEl.classList.contains('is-open')) return;
    bagEl.classList.remove('is-open');
    bagEl.inert = true;
    bagEl.setAttribute('aria-hidden', 'true');
    scrim.classList.remove('is-open');
    setTimeout(() => { if (!bagEl.classList.contains('is-open')) scrim.hidden = true; }, 500);
    lenis?.start();
    lastFocus?.focus?.({ preventScroll: true });
  }
  $$('[data-bag-open]').forEach(b => b.addEventListener('click', openBag));
  $('[data-bag-close]').addEventListener('click', closeBag);
  scrim.addEventListener('click', () => { closeBag(); });

  const toastEl = $('[data-toast]');
  let toastTimer = 0;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2600);
  }
  function addToBag(id, size) {
    bag.add(id, size);
    toast(`Added to bag: ${BY_ID[id].name}, size ${size}`);
    hdrBag.classList.remove('is-bump');
    void hdrBag.offsetWidth;
    hdrBag.classList.add('is-bump');
  }

  /* ================================================================ store */
  // one piece per category, each with quick add
  $('[data-store-tiles]').append(...PRODUCTS.map((p, i) => {
    const li = el('li', 'stile');
    li.dataset.reveal = 'scroll';
    li.style.setProperty('--i', String(i * 0.3));
    li.innerHTML = `
      <p class="stile__cat">${p.type}</p>
      <div class="stile__img"><img src="${photo(p.photo)}" alt="${p.name} in ${p.color}" width="1024" height="1536" loading="lazy" decoding="async"></div>
      <p class="stile__name"><span>${p.name}</span><span>${euro(p.price)}</span></p>
      <div class="stile__sizes" role="group" aria-label="Add ${p.name} in size"><p>Quick add</p>${SIZES.map(z => `<button type="button" data-size="${z}">${z}</button>`).join('')}</div>`;
    li.querySelectorAll('[data-size]').forEach(b => b.addEventListener('click', () => addToBag(p.id, b.dataset.size)));
    return li;
  }));
  renderBag();

  /* ============================================================== lineup */
  // one sharp model at the centre, faded flankers either side; plays on its own
  function lineupCtl(box) {
    const looks = $$('.look', box);
    const count = looks.length;
    const reach = Math.min(3, Math.floor((count - 1) / 2));
    const extra = count - (2 * reach + 1);
    const spread = reach >= 3 ? 1 : 1.17;
    const offset = d => Math.sign(d) * (4 + 12.5 * Math.abs(d)) * spread;
    const collection = $('[data-meta="collection"]', box);
    const lookLabel = $('[data-meta="look"]', box);
    const counter = $('.lineup__count', box);
    const timer = $('[data-lineup-timer]', box);
    const playBtn = $('[data-lineup-play]', box);
    const INTERVAL = 1100;              // quick: the lineup is a parade of every look
    const st = { active: 0, dir: -1, swiped: false, playing: !reduced, hover: false, elapsed: 0, lastNow: 0 };

    const place = (n, d) => {
      const away = Math.abs(d) > reach;
      const slot = away ? Math.sign(d) * (reach + 1) : d;
      n.style.setProperty('--x', d === 0 ? '0' : offset(slot).toFixed(2));
      n.style.setProperty('--s', d === 0 ? '1' : '.5');
      n.style.setProperty('--o', d === 0 ? '1' : away ? '0' : '.3');
      n.style.setProperty('--z', String(10 - Math.min(Math.abs(d), reach + 1)));
      n.classList.toggle('is-away', away);
    };
    const render = shift => {
      const lo = -reach - (extra > 0 && st.dir > 0 ? 1 : 0);
      looks.forEach((n, i) => {
        const d = ((i - st.active - lo) % count + count) % count + lo;
        const prev = n.dataset.d === undefined ? undefined : Number(n.dataset.d);
        if (prev !== undefined && d !== prev - shift) {
          n.classList.add('is-wrap');
          place(n, Math.sign(d) * (reach + 1));
          void n.offsetWidth;
          n.classList.remove('is-wrap');
        }
        n.dataset.d = d;
        place(n, d);
        n.setAttribute('aria-current', d === 0 ? 'true' : 'false');
        n.setAttribute('aria-label', `Look ${pad(i + 1)}: ${n.dataset.name}`);
        n.toggleAttribute('aria-hidden', Math.abs(d) > reach);
        n.tabIndex = d === 0 || Math.abs(d) > reach ? -1 : 0;
      });
      collection.textContent = looks[st.active].dataset.collection;
      lookLabel.textContent = `Look ${pad(st.active + 1)}`;
      counter.textContent = `${pad(st.active + 1)}/${pad(count)}`;
    };
    const go = step => {
      if (!step) return;
      st.dir = Math.sign(step);
      st.active = (st.active + step + count) % count;
      st.elapsed = 0;
      render(step);
    };
    const setPlaying = on => {
      st.playing = on;
      st.elapsed = 0;
      playBtn.setAttribute('aria-pressed', String(on));
      playBtn.textContent = on ? 'Pause' : 'Play';
    };

    $$('[data-step]', box).forEach(b => b.addEventListener('click', () => go(Number(b.dataset.step))));
    looks.forEach(n => n.addEventListener('click', () => {
      if (st.swiped) { st.swiped = false; return; }
      const d = Number(n.dataset.d);
      if (d && Math.abs(d) <= reach) go(d);
    }));
    playBtn.addEventListener('click', () => setPlaying(!st.playing));
    box.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    });
    let x0 = null;
    box.addEventListener('pointerdown', e => { x0 = e.clientX; st.swiped = false; });
    box.addEventListener('pointerup', e => {
      if (x0 === null) return;
      const dx = e.clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 40) { st.swiped = true; go(dx < 0 ? 1 : -1); }
    });
    box.addEventListener('pointercancel', () => { x0 = null; });
    box.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') st.hover = true; });
    box.addEventListener('pointerleave', () => { st.hover = false; });
    box.addEventListener('focusin', () => { st.hover = true; });
    box.addEventListener('focusout', () => { st.hover = false; });
    box.dataset.cursor = 'Drag';
    if (reduced) setPlaying(false);
    render(0);

    // advanced from the RAF loop: counts only while the lineup is on screen and not held
    return (now, visible) => {
      const dt = st.lastNow ? Math.min(100, now - st.lastNow) : 0;
      st.lastNow = now;
      if (st.playing && visible && !st.hover) st.elapsed += dt;
      if (st.elapsed >= INTERVAL) go(1);
      setVar(timer, '--t', (st.playing ? st.elapsed / INTERVAL : 0).toFixed(3));
    };
  }
  const tickLineup = lineupCtl($('#lineup .lineup'));

  /* ============================================================== origins */
  // hovering a piece lights it and its pair, draws a line between them and names them on the panel
  const oPointer = { x: 0, y: 0, tx: 0, ty: 0 };
  {
    const sub = $('[data-origin-sub]');
    const plain = sub.innerHTML;
    const link = $('[data-origin-link]');
    const setHot = pair => {
      oPieces.forEach(f => {
        flag(f, 'is-hot', pair >= 0 && f.dataset.pair === String(pair));
        flag(f, 'is-dim', pair >= 0 && f.dataset.pair !== String(pair));
      });
      flag(oStage, 'is-linking', false);
      if (pair < 0) { sub.innerHTML = plain; return; }
      const pr = ORIGIN_PAIRS[pair];
      sub.innerHTML = `<b>${pr.art} → ${pr.piece}</b><br>${pr.line}`;
      const st = oStage.getBoundingClientRect();
      const [a, b] = oPieces.filter(f => f.dataset.pair === String(pair)).map(f => f.getBoundingClientRect());
      link.setAttribute('x1', (a.left + a.width / 2 - st.left).toFixed(1));
      link.setAttribute('y1', (a.top + a.height / 2 - st.top).toFixed(1));
      link.setAttribute('x2', (b.left + b.width / 2 - st.left).toFixed(1));
      link.setAttribute('y2', (b.top + b.height / 2 - st.top).toFixed(1));
      void link.getBoundingClientRect();
      flag(oStage, 'is-linking', true);
    };
    oPieces.forEach(f => {
      const on = () => setHot(Number(f.dataset.pair));
      f.addEventListener('pointerenter', on);
      f.addEventListener('focus', on);
      f.addEventListener('pointerleave', () => setHot(-1));
      f.addEventListener('blur', () => setHot(-1));
    });
    if (finePointer && !reduced) {
      oStage.addEventListener('pointermove', e => {
        const r = oStage.getBoundingClientRect();
        oPointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
        oPointer.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
      }, { passive: true });
      oStage.addEventListener('pointerleave', () => { oPointer.tx = 0; oPointer.ty = 0; });
    }
  }

  /* =============================================================== arena */
  // the sky stage: one athlete per sport, switched by tabs, arrows or on a timer; clouds drift by depth
  function arenaCtl(box) {
    const no = $('[data-arena-no]', box);
    const name = $('[data-arena-name]', box);
    const line = $('[data-arena-line]', box);
    const shop = $('[data-arena-shop]', box);
    const shopLabel = $('[data-arena-shop-label]', box);
    const timer = $('[data-arena-timer]', box);
    const far = $('.arena__clouds--far', box);
    const near = $('.arena__clouds--near', box);
    const figs = $('[data-arena-figs]', box);
    const INTERVAL = 5200;
    const st = { active: -1, elapsed: 0, lastNow: 0, hover: false, mx: 0, tmx: 0, drift: 0 };
    $('[data-arena-total]', box).textContent = pad(SPORTS.length);

    const show = (i, dir = 1) => {
      i = (i + SPORTS.length) % SPORTS.length;
      if (i === st.active) return;
      const prev = st.active;
      st.active = i;
      st.elapsed = 0;
      const sp = SPORTS[i];
      arenaFigs.forEach((f, k) => {
        f.classList.toggle('is-on', k === i);
        f.classList.toggle('is-off', k === prev);
        f.style.setProperty('--dir', String(dir));
        f.toggleAttribute('aria-hidden', k !== i);
      });
      arenaTabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
      no.textContent = pad(i + 1);
      name.textContent = sp.name;
      line.textContent = sp.line;
      shopLabel.textContent = `Shop ${sp.name.toLowerCase()}`;
      box.dataset.sport = sp.court;
      for (const n of [name, line]) { n.classList.remove('is-roll'); void n.offsetWidth; n.classList.add('is-roll'); }
    };
    const go = d => show(st.active + d, Math.sign(d) || 1);

    $$('[data-arena-step]', box).forEach(b => b.addEventListener('click', () => go(Number(b.dataset.arenaStep))));
    arenaTabs.forEach((t, k) => {
      t.addEventListener('click', () => show(k, k > st.active ? 1 : -1));
      t.addEventListener('keydown', e => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        go(e.key === 'ArrowRight' ? 1 : -1);
        arenaTabs[st.active].focus();
      });
    });
    box.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') st.hover = true; });
    box.addEventListener('pointerleave', () => { st.hover = false; st.tmx = 0; });
    box.addEventListener('focusin', () => { st.hover = true; });
    box.addEventListener('focusout', () => { st.hover = false; });
    if (finePointer && !reduced) {
      box.addEventListener('pointermove', e => {
        const r = box.getBoundingClientRect();
        st.tmx = ((e.clientX - r.left) / r.width) * 2 - 1;
      }, { passive: true });
    }
    let x0 = null;
    figs.addEventListener('pointerdown', e => { x0 = e.clientX; });
    figs.addEventListener('pointerup', e => {
      if (x0 === null) return;
      const dx = e.clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    });
    show(0);

    // q: how far the stage has travelled through the viewport (0 entering at the bottom, 1 leaving at the top)
    return (now, dt, visible, q) => {
      const step = st.lastNow ? Math.min(100, now - st.lastNow) : 0;
      st.lastNow = now;
      if (!reduced && visible && !st.hover) st.elapsed += step;
      if (st.elapsed >= INTERVAL) go(1);
      setVar(timer, '--t', reduced ? '0' : (st.elapsed / INTERVAL).toFixed(3));
      if (reduced || !visible) return;
      st.mx = lag(st.mx, st.tmx, dt, 3);
      st.drift += dt;
      const c = q - 0.5;
      // clouds sway on a slow sine (the layers are oversized, so no edge ever shows) and part with depth
      setVar(far, '--cx', `${(Math.sin(st.drift * 0.07) * 30 + st.mx * -8).toFixed(1)}px`);
      setVar(far, '--cy', `${(c * -40).toFixed(1)}px`);
      setVar(near, '--cx', `${(Math.sin(st.drift * 0.05 + 1) * 60 + st.mx * -22).toFixed(1)}px`);
      setVar(near, '--cy', `${(c * -120).toFixed(1)}px`);
      setVar(figs, '--fx', `${(st.mx * 14).toFixed(1)}px`);
      setVar(figs, '--fy', `${(c * -70).toFixed(1)}px`);
      for (const w of arenaWords) setVar(w, '--tx', `${(st.mx * -18).toFixed(1)}px`);
    };
  }
  const tickArena = arenaCtl($('[data-arena]'));

  /* ============================================================ projects */
  (function projectCtl(box) {
    const items = $$('.acc', box);
    const frames = $$('.project__frame', box);
    const list = $('.project__list', box);
    const peek = $('.project__peek', box);
    const peekImg = $('img', peek);
    const open = idx => items.forEach((it, i) => {
      const on = i === idx;
      it.classList.toggle('is-open', on);
      $('.acc__btn', it).setAttribute('aria-expanded', String(on));
      $('.acc__panel', it).inert = !on;
      frames[i]?.classList.toggle('is-active', on);
    });
    items.forEach((it, i) => $('.acc__btn', it).addEventListener('click', () => open(i)));
    if (finePointer) {
      list.addEventListener('pointermove', e => {
        const btn = e.target.closest('.acc__btn');
        const i = btn ? items.indexOf(btn.closest('.acc')) : -1;
        if (i < 0 || items[i].classList.contains('is-open')) { list.classList.remove('is-peeking'); return; }
        const src = $('img', frames[i]);
        if (peekImg.dataset.i !== String(i)) {
          peekImg.src = src.currentSrc || src.src;
          peekImg.style.setProperty('--pos', src.style.getPropertyValue('--pos'));
          peekImg.dataset.i = String(i);
        }
        const r = list.getBoundingClientRect();
        peek.style.setProperty('--px', `${Math.round(e.clientX - r.left + 20)}px`);
        peek.style.setProperty('--py', `${Math.round(e.clientY - r.top - peek.offsetHeight / 2)}px`);
        list.classList.add('is-peeking');
      });
      list.addEventListener('pointerleave', () => list.classList.remove('is-peeking'));
    }
    open(0);
  })($('#capsules .project'));

  /* ================================================================= menu */
  const menu = $('#menu');
  const menuBtn = $('[data-menu-toggle]');
  const menuFig = $('.menu__fig', menu);
  const menuImg = $('[data-menu-img]', menu);
  let menuSwap = 0;
  $$('.menu__chapters a', menu).forEach((a, i) => {
    a.style.setProperty('--n', i);
    // each chapter previews its own photograph in the arch
    const show = () => {
      const src = photo(a.dataset.img);
      if (menuImg.src === src) return;
      menuFig.classList.add('is-swap');
      clearTimeout(menuSwap);
      menuSwap = setTimeout(() => {
        menuImg.onload = () => menuFig.classList.remove('is-swap');
        menuImg.src = src;
      }, 200);
    };
    a.addEventListener('pointerenter', show);
    a.addEventListener('focus', show);
  });
  function openMenu() {
    closeBag();
    menu.classList.add('is-open');
    menu.inert = false;
    menu.setAttribute('aria-hidden', 'false');
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
    lenis?.stop();
  }
  function closeMenu() {
    if (!menu.classList.contains('is-open')) return;
    menu.classList.remove('is-open');
    menu.inert = true;
    menu.setAttribute('aria-hidden', 'true');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    lenis?.start();
  }
  menuBtn.addEventListener('click', () => (menu.classList.contains('is-open') ? closeMenu() : openMenu()));
  addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (bagEl.classList.contains('is-open')) closeBag();
    else if (menu.classList.contains('is-open')) { closeMenu(); menuBtn.focus(); }
  });

  // every in-page link: close overlays, glide there
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.classList.contains('skip')) return;
    const id = a.getAttribute('href').slice(1);
    const target = id ? document.getElementById(id) : null;
    if (id && !target) return;
    e.preventDefault();
    closeMenu();
    closeBag();
    scrollToEl(target);
  });

  /* =============================================================== cursor */
  const cursor = $('.cursor');
  const cursorLabel = $('.cursor__label', cursor);
  const cur = { x: -100, y: -100, tx: -100, ty: -100, on: false };
  if (finePointer && !reduced) {
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      cur.tx = e.clientX; cur.ty = e.clientY;
      if (!cur.on) { cur.on = true; cur.x = cur.tx; cur.y = cur.ty; cursor.classList.add('is-on'); }
      const t = e.target instanceof Element ? e.target : null;
      const link = t?.closest('a, button');
      const labelled = t?.closest('[data-cursor]');
      // a labelled region shows its word, unless the pointer is on a separate control inside it
      const label = labelled && (!link || link === labelled || link.contains(labelled)) ? labelled.dataset.cursor : '';
      flag(cursor, 'is-label', Boolean(label));
      flag(cursor, 'is-link', Boolean(link) && !label);
      if (label && cursorLabel.textContent !== label) cursorLabel.textContent = label;
    }, { passive: true });
    root.addEventListener('mouseleave', () => { cur.on = false; cursor.classList.remove('is-on'); });
    addEventListener('pointerdown', () => cursor.classList.add('is-press'));
    addEventListener('pointerup', () => cursor.classList.remove('is-press'));
  }

  /* ================================================================ reveal */
  class Reveal {
    constructor(n) { this.el = n; this.vin = NaN; this.vout = NaN; this.anim = null; this.hidden = null; }
    set(vin, vout) {
      vin = r3(vin); vout = r3(vout);
      const s = this.el.style;
      if (vin !== this.vin) { this.vin = vin; s.setProperty('--in', vin); }
      if (vout !== this.vout) { this.vout = vout; s.setProperty('--out', vout); }
      const hidden = vin <= 0 || vout >= 1;
      const anim = !hidden && (vin < 1 || vout > 0);
      if (hidden !== this.hidden) { this.hidden = hidden; this.el.classList.toggle('is-hidden', hidden); }
      if (anim !== this.anim) { this.anim = anim; this.el.classList.toggle('is-anim', anim); }
    }
  }

  function splitWords(n) {
    const text = n.textContent.replace(/\s+/g, ' ').trim();
    const frag = document.createDocumentFragment();
    const out = [];
    text.split(' ').forEach((w, k) => {
      if (k) frag.append(' ');
      const s = el('span', 'word');
      s.dataset.reveal = 'scroll';
      s.textContent = w;
      frag.append(s);
      out.push(s);
    });
    n.replaceChildren(frag);
    return out;
  }

  /* ========================================================= choreography */
  const ENTER = { STEP: 0.09, DUR: 1.1, DUR_BRAND: 1.4 };
  const HERO_EXIT = { START: 0.06, STEP: 0.07, DUR: 0.45 };   // fractions of the hero's scroll
  const SHRINK_UNTIL = 0.85;                                  // the wordmark is in the header by here
  const LINES = { START: 0.03, STEP: 0.045, DUR: 0.15, OUT_START: 0.82, OUT_STEP: 0.02, OUT_DUR: 0.12 };
  const FLOW = { FROM: 0.92, TO: 0.62, STAGGER: 0.11, WINDOW: 0.18 };
  // where the woman stands in clip 2, as fractions of the video frame (measured at 16:9), and where the
  // Lotus cut-out's figure sits in its own image; FROM/DUR place the sweep in the craft section's scroll
  const MORPH = { cx: 0.482, top: 0.046, bottom: 0.875, FIG_TOP: 0.005, FIG_SPAN: 0.978, FROM: 0.14, DUR: 0.26 };
  const MAT_WIN = {
    pinned: { inStart: 0.22, inStep: 0.05, inDur: 0.28, outStart: 0.70, outStep: 0.02, outDur: 0.14 },
    flow:   { inStart: 0.28, inStep: 0.06, inDur: 0.32, outStart: 0.78, outStep: 0.02, outDur: 0.14 },
  };
  const MAT = {
    'bandhani': { from: 'left',   k: 0, speed: 0.46, drift: -0.30, rot: 1.4,  tau: 5, spin: -18, bow: 70,  s0: 1.10, tilt: -6, blur: 12 },
    'ajrakh':   { from: 'top',    k: 1, speed: 0.42, drift: 0.26,  rot: -1.0, tau: 6, spin: 14,  bow: -50, s0: 1.08, tilt: 5,  blur: 12 },
    'zari':     { from: 'right',  k: 2, speed: 0.60, drift: 0.28,  rot: -0.6, tau: 4, spin: 16,  bow: 60,  s0: 1.12, tilt: 4,  blur: 14 },
    'mirror':   { from: 'top',    k: 3, speed: 0.30, drift: 0.24,  rot: -1.2, tau: 7, spin: -12, bow: 40,  s0: 0.92, tilt: 8,  blur: 10 },
    'phulkari': { from: 'bottom', k: 4, speed: 0.18, drift: 0.16,  rot: 0.5,  tau: 8, spin: 10,  bow: -90, s0: 0.90, tilt: 12, blur: 10 },
  };
  const lineIn = (p, r) => expoOut(clamp01((p - (LINES.START + r * LINES.STEP)) / LINES.DUR));
  const lineOut = (p, r) => expoOut(clamp01((p - (LINES.OUT_START + r * LINES.OUT_STEP)) / LINES.OUT_DUR));
  const flowIn = (top, i) => {
    const t = (FLOW.FROM * vh - top) / ((FLOW.FROM - FLOW.TO) * vh);
    return cubicOut(clamp01((t - i * FLOW.STAGGER) / FLOW.WINDOW));
  };

  /* ================================================================ nodes */
  const hero = $('#top');
  const sec2 = $('#craft');
  const sec2Stage = $('.sec2__stage', sec2);
  const arena = $('[data-arena]');
  const lineupSec = $('#lineup');
  const hdr = $('#hdr');
  const hdrCh = $('.hdr__ch');
  const hdrChNo = $('[data-hdr-ch-no]');
  const hdrChName = $('[data-hdr-ch-name]');
  const CHAPTERS = [['top', 'Film'], ['craft', 'Craft'], ['about', 'About'], ['sport', 'Sport'], ['lineup', 'Lineup'], ['origins', 'Origins'],
    ['shop', 'Shop'], ['campaign', 'Campaign'], ['capsules', 'Capsules']];
  let chapterShown = 0;
  const matsBox = $('.mats', sec2);
  const morph = $('[data-morph]');
  const stageEl = $('#stage');
  const darkSections = $$('[data-theme="dark"]');
  const driftImgs = $$('.ctile img, .kit__photo img, .foot__frame img, .store__media img');   // photos that drift inside their frames
  const storeFloats = $$('[data-float]');
  const brand = $('.hdr__brand');
  const plate = createPlate({ stage: $('#stage'), reduced, setVar, flag });

  const words = splitWords($('[data-split="lines"]', sec2));
  // the wordmark and the hero copy enter on a timer after the intro; the copy leaves as the film scrolls
  const heroEls = $$('[data-reveal]', hero);
  const loadNodes = [brand, ...heroEls].map(n => Object.assign(new Reveal(n), {
    idx: indexOf(n),
    dur: n === brand ? ENTER.DUR_BRAND : ENTER.DUR,
    exit: heroEls.indexOf(n),
  }));
  const wordNodes = words.map(n => Object.assign(new Reveal(n), { line: 0, nth: 0, top: 0 }));
  const specNodes = $$('.specs__row', sec2).map((n, r) => Object.assign(new Reveal(n), { r, top: 0 }));
  let flowNodes = [];
  const collectFlow = () => {
    flowNodes = $$('[data-reveal="scroll"]').filter(n => !sec2.contains(n)).map(n => Object.assign(new Reveal(n), { idx: indexOf(n), top: 0 }));
  };
  collectFlow();
  const mats = $$('.mat', matsBox).map(n => {
    const m = Object.assign(new Reveal(n), MAT[n.dataset.mat], { p: null, l: 0, t: 0, w: 0, h: 0, tr: '', ro: '', sc: '' });
    n.style.setProperty('--mat-blur', `${m.blur}px`);
    return m;
  });

  /* ============================================================== measure */
  let dirty = true;
  let vw = 0, vh = 0, heroTop = 0, heroSpan = 0, sec2Top = 0, sec2Span = 0, pinned = true;
  let arenaBand = [0, 0];
  let originsTop = 0, originsSpan = 1, originsPinned = true, floatMids = [];
  let matsLeft = 0, matsTop = 0, matsH = 0, travel = 520, rotK = 4;
  let chapterTops = [], darkBands = [], lineupBand = [0, 0], driftBoxes = [];
  let plateS1 = 1, plateS2 = 2, navFrom = 0;
  let morphSpan = [0, 1];

  function measure() {
    dirty = false;
    vw = root.clientWidth;
    vh = window.innerHeight;

    heroTop = docTop(hero);
    heroSpan = Math.max(1, hero.offsetHeight - vh);
    sec2Top = docTop(sec2);
    sec2Span = Math.max(1, sec2.offsetHeight - vh);
    pinned = getComputedStyle(sec2Stage).position === 'sticky';
    arenaBand = [docTop(arena), docTop(arena) + arena.offsetHeight];
    const origins = $('#origins');
    originsTop = docTop(origins);
    originsSpan = Math.max(1, origins.offsetHeight - vh);
    originsPinned = getComputedStyle($('.origins__stage', origins)).position === 'sticky';
    floatMids = storeFloats.map(f => docTop(f) + f.offsetHeight / 2);

    let line = -1, lastTop = -Infinity, nth = 0, lineTop = 0;
    for (const n of wordNodes) {
      const t = n.el.offsetTop;
      if (Math.abs(t - lastTop) > 2) { line++; lastTop = t; nth = 0; lineTop = docTop(n.el); }
      n.line = line; n.nth = nth++; n.top = lineTop;
    }
    for (const n of specNodes) n.top = docTop(n.el);
    flowNodes = flowNodes.filter(n => n.el.isConnected);
    for (const n of flowNodes) n.top = docTop(n.el);

    const cs = getComputedStyle(root);
    travel = parseFloat(cs.getPropertyValue('--mat-travel')) || 520;
    rotK = parseFloat(cs.getPropertyValue('--mat-rot')) || 4;

    // the wordmark shrinks from its full size to the header size (offsetHeight ignores transforms)
    const brandEnd = parseFloat(cs.getPropertyValue('--brand-end')) || 22;
    root.style.setProperty('--shrink-end', Math.min(1, brandEnd / (brand.offsetHeight || brandEnd)).toFixed(4));

    // the film: clip 1 plays across the hero, clip 2 while the craft statement is on screen, then whites out
    const sec2End = sec2Top + sec2.offsetHeight;
    const firstWordTop = wordNodes.length ? wordNodes[0].top : sec2Top;
    plateS1 = Math.max(1, pinned ? sec2Top + LINES.START * sec2Span : firstWordTop - FLOW.FROM * vh);
    plateS2 = Math.max(plateS1 + 1, pinned ? sec2End - vh : sec2End - vh * 0.5);
    navFrom = plateS2 + vh * 0.5;   // the header links stay off the film until it has whited out

    // the Lotus figure lands where the woman stands in clip 2, wherever the film is drawn on this screen
    const v2 = $('#v2');
    const va = v2.videoWidth && v2.videoHeight ? v2.videoWidth / v2.videoHeight : 16 / 9;
    let Wv, Hv, ox, oy;
    if (matchMedia('(max-aspect-ratio: 3/4)').matches) { Wv = vw; Hv = vw / va; ox = 0; oy = (vh - Hv) * 0.92; }
    else if (vw / vh > va) { Wv = vw; Hv = vw / va; ox = 0; oy = (vh - Hv) / 2; }
    else { Hv = vh; Wv = vh * va; ox = (vw - Wv) / 2; oy = 0; }
    const fh = ((MORPH.bottom - MORPH.top) * Hv) / MORPH.FIG_SPAN, fw = (fh * 2) / 3;
    const fx = ox + MORPH.cx * Wv - fw / 2, fy = oy + MORPH.top * Hv - MORPH.FIG_TOP * fh;
    setVar(morph, '--fx', `${fx.toFixed(1)}px`); setVar(morph, '--fy', `${fy.toFixed(1)}px`);
    setVar(morph, '--fw', `${fw.toFixed(1)}px`); setVar(morph, '--fh', `${fh.toFixed(1)}px`);
    morphSpan = [fx + fw * 0.2 - 200, fx + fw * 0.8 + 200];
    matsLeft = matsBox.getBoundingClientRect().left;
    matsTop = docTop(matsBox);
    matsH = matsBox.offsetHeight;
    for (const m of mats) { m.l = m.el.offsetLeft; m.t = m.el.offsetTop; m.w = m.el.offsetWidth; m.h = m.el.offsetHeight; }

    chapterTops = CHAPTERS.map(([id]) => docTop(document.getElementById(id)));
    darkBands = darkSections.map(s => { const t = docTop(s); return [t, t + s.offsetHeight]; });
    lineupBand = [docTop(lineupSec), docTop(lineupSec) + lineupSec.offsetHeight];
    driftBoxes = driftImgs.map(img => { const f = img.parentElement; return [docTop(f), f.offsetHeight]; });
    mq.half = marquee.scrollWidth / 2;
  }

  addEventListener('resize', () => { dirty = true; });
  addEventListener('load', () => { dirty = true; });
  if (document.fonts) document.fonts.ready.then(() => { dirty = true; });
  if ('ResizeObserver' in window) new ResizeObserver(() => { dirty = true; }).observe(document.body);

  /* =============================================================== intro */
  const loader = $('#loader');
  const loaderCount = $('[data-loader-count]');
  // the intro waits for the fonts and the first frame of the film (or gives up on it, see below)
  const intro = { start: performance.now(), shown: 0, loaded: 0, total: 2, done: false };
  {
    const v = plate.firstClip;
    const tick = () => { intro.loaded++; };
    if (v.readyState >= 2) tick();
    else {
      let once = false;
      const fire = () => { if (!once) { once = true; tick(); } };
      v.addEventListener('loadeddata', fire, { once: true });
      v.addEventListener('error', fire, { once: true });
    }
  }
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { intro.loaded++; });
  let readyAt = -1;
  lenis?.stop();
  // backstop for tabs that load in the background, where animation frames are throttled
  setTimeout(() => { if (!intro.done) finishIntro(); }, 3600);
  function finishIntro() {
    intro.done = true;
    loaderCount.textContent = '100';
    loader.style.setProperty('--lp', '1');
    setTimeout(() => {
      loader.classList.add('is-done');
      root.classList.add('is-ready');
      readyAt = performance.now() + 150;
      lenis?.start();
      dirty = true;
    }, reduced ? 0 : 380);
  }
  function tickIntro(now) {
    if (intro.done) return;
    const elapsed = now - intro.start;
    const target = Math.min(intro.loaded / intro.total, reduced ? 1 : elapsed / 900);
    intro.shown = lag(intro.shown, target, 1 / 60, 10);
    const pct = Math.round(intro.shown * 100);
    loaderCount.textContent = String(pct).padStart(3, '0');
    loader.style.setProperty('--lp', intro.shown.toFixed(3));
    // never hold anyone for long: the film starts by 3.2s even on a slow connection
    if ((intro.loaded >= intro.total && elapsed > (reduced ? 200 : 900) && pct >= 97) || elapsed > 3200) finishIntro();
  }

  /* ================================================================= hero */
  // timed entrance after the intro; scroll then takes the copy away and settles the wordmark into the header
  function updateHero(y, now) {
    const p1 = clamp01((y - heroTop) / heroSpan);
    const since = readyAt < 0 ? -1 : (now - readyAt) / 1000;
    for (const n of loadNodes) {
      const vin = since < 0 ? 0 : expoOut(clamp01((since - n.idx * ENTER.STEP) / n.dur));
      const vout = n.exit < 0 ? 0 : expoOut(clamp01((p1 - (HERO_EXIT.START + n.exit * HERO_EXIT.STEP)) / HERO_EXIT.DUR));
      n.set(vin, vout);
    }
    setVar(hdr, '--q', String(Math.round(clamp01(p1 / SHRINK_UNTIL) * 1e4) / 1e4));
    flag(hdr, 'is-top', y < navFrom);
    return p1;
  }

  /* ============================================================== marquee */
  const mq = { x: 0, v: 60, half: 0 };
  function updateMarquee(dt, velocity) {
    if (reduced || !mq.half) return;
    const target = 60 + Math.min(900, Math.abs(velocity) * 0.6);
    mq.v = lag(mq.v, target, dt, 3);
    const dir = velocity < -1 ? 1 : -1;
    mq.x += dir * mq.v * dt;
    if (mq.x <= -mq.half) mq.x += mq.half;
    if (mq.x > 0) mq.x -= mq.half;
    setVar(marquee, '--mx', `${mq.x.toFixed(1)}px`);
  }

  /* ================================================================= mats */
  let first = true;
  function updateMats(p, dt, y) {
    const W = pinned ? MAT_WIN.pinned : MAT_WIN.flow;
    const top0 = pinned ? 0 : matsTop - y;
    for (const m of mats) {
      if (first || m.p === null) m.p = p;
      else { m.p = lag(m.p, p, dt, m.tau); if (Math.abs(p - m.p) < 1e-4) m.p = p; }
      const e = cubicOut(clamp01((m.p - (W.inStart + m.k * W.inStep)) / W.inDur));
      const o = cubicOut(clamp01((m.p - (W.outStart + m.k * W.outStep)) / W.outDur));
      m.set(e, o);
      if (m.hidden) continue;
      let x = 0, yy = 0, rot = m.tilt, sc = 1;
      if (!reduced) {
        const u = 1 - e, side = Math.sin(Math.PI * e) * m.bow, q = m.p - 0.62;
        const L = matsLeft + m.l, T = top0 + m.t;
        if (m.from === 'left')       { x -= u * (L + m.w + 60); yy += side; }
        else if (m.from === 'right') { x += u * (vw - L + 60);  yy += side; }
        else if (m.from === 'top')   { yy -= u * (T + m.h + 60); x += side; }
        else                         { yy += u * (vh - T + 60);  x += side; }
        x += q * m.speed * m.drift * travel;
        yy -= q * m.speed * travel;
        yy -= o * (40 + m.speed * 120);
        rot = m.tilt + m.spin * u + q * m.rot * rotK;
        sc = 1 + (m.s0 - 1) * u;
      }
      const tr = `${x.toFixed(1)}px ${yy.toFixed(1)}px`, ro = `${rot.toFixed(2)}deg`, s = sc.toFixed(3);
      if (tr !== m.tr) { m.tr = tr; m.el.style.translate = tr; }
      if (ro !== m.ro) { m.ro = ro; m.el.style.rotate = ro; }
      if (s !== m.sc) { m.sc = s; m.el.style.scale = s; }
    }
  }

  /* ============================================================= RAF loop */
  let last = 0, lastY = window.scrollY, velocity = 0, lastScrollY = window.scrollY;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    lenis?.raf(now);
    if (dirty) measure();
    const y = window.scrollY;
    velocity = dt ? lag(velocity, (y - lastScrollY) / dt, dt, 8) : 0;
    lastScrollY = y;

    tickIntro(now);

    // header stays through the film, then hides on the way down and returns on the way up;
    // it turns light over dark sections
    const heroEnd = heroTop + heroSpan + 160;
    if (!document.body.classList.contains('menu-open')) {
      if (y > heroEnd && y - lastY > 4) flag(hdr, 'is-hidden', true);
      else if (lastY - y > 4 || y < heroEnd) flag(hdr, 'is-hidden', false);
    }
    lastY = y;
    flag(hdr, 'on-dark', darkBands.some(([a, b]) => y + 40 >= a && y + 40 < b));
    let active = 0;
    chapterTops.forEach((t, k) => { if (t <= y + vh * 0.45) active = k; });
    if (active !== chapterShown) {
      chapterShown = active;
      hdrChNo.textContent = pad(active + 1);
      hdrChName.textContent = CHAPTERS[active][1];
      hdrCh.classList.remove('is-roll');
      void hdrCh.offsetWidth;
      hdrCh.classList.add('is-roll');
    }

    // hero entrance after the intro, then the film behind the hero and the craft statement
    updateHero(y, now);
    plate.update({ y, dt, vh, S1: plateS1, S2: plateS2, first });
    updateMarquee(dt, velocity);

    // craft: pinned lines and the textile collage
    let pm;
    if (pinned) {
      const p2 = clamp01((y - sec2Top) / sec2Span);
      for (const n of wordNodes) n.set(lineIn(p2, n.line), lineOut(p2, n.line));
      for (const n of specNodes) n.set(lineIn(p2, n.r), lineOut(p2, n.r));
      pm = p2;
    } else {
      for (const n of wordNodes) n.set(flowIn(n.top - y, Math.min(n.nth, 7)), 0);
      for (const n of specNodes) n.set(flowIn(n.top - y, 0), 0);
      pm = clamp01((vh - (matsTop - y)) / (vh + matsH));
    }
    updateMats(pm, dt, y);

    // the transformation: the film's woman is swept into TĀVRA's Lotus set by a band of bandhani
    {
      const mp = pinned ? clamp01((y - sec2Top) / sec2Span) : clamp01((y - (sec2Top - vh * 0.4)) / (sec2.offsetHeight + vh * 0.2));
      const tf = reduced ? (mp > 0.27 ? 1 : 0) : smoothstep(clamp01((mp - MORPH.FROM) / MORPH.DUR));
      const mo = reduced ? 0 : smoothstep(clamp01((mp - 0.86) / 0.12));
      const bx = morphSpan[0] + (morphSpan[1] - morphSpan[0]) * tf;
      flag(morph, 'is-on', tf > 0 && mo < 1);
      flag(morph, 'is-blurring', mo > 0 && mo < 1);
      setVar(morph, '--bx', `${(tf >= 1 ? vw + 200 : bx).toFixed(1)}px`);
      setVar(morph, '--bo', r3(Math.min(1, tf * 10, (1 - tf) * 10)));
      setVar(morph, '--mo', r3(mo));
      setVar(morph, '--fs', r3(1.035 - 0.035 * tf - 0.02 * clamp01((mp - MORPH.FROM - MORPH.DUR) / 0.4)));
      // the film is hidden behind the band as it passes, then entirely once she has changed
      const clip = tf <= 0 ? 'none' : tf >= 1 ? 'inset(0 0 0 100%)' : `inset(0 0 0 ${bx.toFixed(1)}px)`;
      if (stageEl.style.clipPath !== clip) stageEl.style.clipPath = clip;
    }

    // origins: as the section pins, the pieces fly in from the edges and the orange line draws itself;
    // after that they lean with the pointer, each by its own depth
    {
      const p = originsPinned ? clamp01((y - originsTop) / originsSpan) : 1;
      const arrive = clamp01((y - (originsTop - vh * 0.7)) / (vh * 0.7));
      oPointer.x = lag(oPointer.x, oPointer.tx, dt, 4);
      oPointer.y = lag(oPointer.y, oPointer.ty, dt, 4);
      setVar(oStage, '--loop', r3(reduced ? 0 : 1 - smoothstep(clamp01((p - 0.02) / 0.5))));
      oWords.forEach((w, k) => setVar(w, '--in', r3(reduced ? 1 : expoOut(clamp01((arrive - 0.35 - k * 0.1) / 0.5)))));
      oPieces.forEach((f, i) => {
        const d = oFly[i];
        const a = reduced ? 1 : expoOut(clamp01((p - i * 0.035) / 0.4));
        const drift = (p - 0.7) * d.depth * -40;
        setVar(f, '--tx', `${((1 - a) * d.dx * vw * 0.6 + oPointer.x * d.depth * 22).toFixed(1)}px`);
        setVar(f, '--ty', `${((1 - a) * d.dy * vh * 0.6 + oPointer.y * d.depth * 16 + drift).toFixed(1)}px`);
        setVar(f, '--rot', `${((1 - a) * d.spin).toFixed(2)}deg`);
        setVar(f, '--o', r3(Math.min(1, a * 1.6)));
      });
      oStickers.forEach((st, k) => {
        const pop = reduced ? 1 : clamp01((p - 0.32 - k * 0.06) / 0.18);
        const back = 1 + 2.4 * Math.pow(pop - 1, 3) + 1.4 * Math.pow(pop - 1, 2);      // a little overshoot
        setVar(st, '--sp', r3(pop <= 0 ? 0 : back));
        setVar(st, '--sr', `${(k === 0 ? p * 120 : k === 1 ? -p * 40 : -8).toFixed(1)}deg`);
        setVar(st, '--sy', `${(k === 2 && !reduced ? Math.sin(now / 420) * 8 : 0).toFixed(1)}px`);
      });
    }

    // store: the floating category cards ride slightly against the scroll
    if (!reduced) storeFloats.forEach((f, k) => {
      setVar(f, '--fy', `${((floatMids[k] - (y + vh / 2)) * Number(f.dataset.float)).toFixed(1)}px`);
    });

    // everything else enters by position
    for (const n of flowNodes) n.set(flowIn(n.top - y, n.idx), 0);

    // campaign and sport tiles: photos drift inside their frames
    if (!reduced) driftImgs.forEach((img, k) => {
      const [t, h] = driftBoxes[k] || [0, 0];
      const c = t + h / 2 - (y + vh / 2);
      setVar(img, '--py', `${clamp(c * -0.08, -60, 60).toFixed(1)}px`);
    });

    // autoplay only while on screen
    const onScreen = ([a, b]) => b > y + vh * 0.15 && a < y + vh * 0.85;
    tickLineup(now, onScreen(lineupBand));
    const [a0, a1] = arenaBand;
    tickArena(now, dt, a1 > y && a0 < y + vh, clamp01((y + vh - a0) / (vh + a1 - a0)));

    // cursor follows with a little weight
    if (cur.on) {
      cur.x = lag(cur.x, cur.tx, dt, 18);
      cur.y = lag(cur.y, cur.ty, dt, 18);
      setVar(cursor, '--cx', `${cur.x.toFixed(1)}px`);
      setVar(cursor, '--cy', `${cur.y.toFixed(1)}px`);
    }
    first = false;
  }
  requestAnimationFrame(frame);
}
