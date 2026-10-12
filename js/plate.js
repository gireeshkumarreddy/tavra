// The scroll-scrubbed video plate behind the hero and the craft section.
// Clip 1 plays across the hero, clip 2 across the pinned craft section, then the plate fades to the page white.
// Where WebCodecs and MP4Box are available, each clip is decoded once into stills and drawn from a small
// bitmap cache for frame-accurate scrubbing; otherwise the <video> elements are seeked directly.

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const r3 = v => Math.round(v * 1000) / 1000;

const PLATE = { HANDOFF: 24, TAU: 8, SNAP: 0.002, WHITEOUT: 0.5 };
const BANK = {
  LRU: 24, AHEAD: 16, MIN_AHEAD: 6, INFLIGHT: 8, WATCHDOG: 60000, QUALITY: 0.82, MAX_W: 1920,
  // still encodes run on worker threads, so the surface pool scales with cores
  POOL: Math.max(2, Math.min(6, (navigator.hardwareConcurrency || 4) - 2)),
};

export function createPlate({ stage, reduced, setVar, flag }) {
  const $ = s => document.querySelector(s);
  const clips = [
    { id: 1, v: $('#v1'), c: $('#c1'), layer: $('#layerA') },
    { id: 2, v: $('#v2'), c: $('#c2'), layer: $('#layerB') },
  ].map(c => Object.assign(c, { cur: 0, target: 0, bank: null, ctx: null, live: false, drawn: -1, dir: 1, kicked: false }));

  // iOS only paints seeks on a video that has started once
  for (const c of clips) {
    const prime = () => { const p = c.v.play(); if (p) p.then(() => c.v.pause(), () => {}); };
    if (c.v.readyState >= 1) prime(); else c.v.addEventListener('loadedmetadata', prime, { once: true });
  }

  function update({ y, dt, vh, S1, S2, first }) {
    const half = PLATE.HANDOFF / 2;
    let t1 = clamp01(y / S1);
    let t2 = clamp01((y - S1) / (S2 - S1));
    let x2 = clamp01((y - (S1 - half)) / PLATE.HANDOFF);
    if (reduced) t1 = t2 = x2 = 0;
    const out = clamp01((y - S2) / (PLATE.WHITEOUT * vh));

    setVar(stage, '--x2', r3(x2));
    setVar(stage, '--stage-out', r3(out));
    flag(stage, 'is-blurring', !reduced && out > 0 && out < 1);
    flag(stage, 'is-covered', out >= 1);

    clips[0].target = t1;
    clips[1].target = t2;
    const k = 1 - Math.exp(-dt * PLATE.TAU);
    for (const c of clips) {
      if (first) c.cur = c.target;
      else {
        c.cur += (c.target - c.cur) * k;
        if (Math.abs(c.target - c.cur) < PLATE.SNAP) c.cur = c.target;
      }
      const covered = c.id === 1 ? x2 >= 1 : x2 <= 0;
      flag(c.layer, 'is-covered', covered);
      if (out >= 1) continue;
      if (c.bank) paintBank(c, covered);
      if (!c.live) seekVideo(c);
    }
  }

  function seekVideo(c) {
    const v = c.v;
    if (v.readyState < 1 || !(v.duration > 0) || v.seeking) return;
    const t = Math.min(c.cur * v.duration, Math.max(0, v.duration - 0.001));
    if (Math.abs(v.currentTime - t) > 1 / 60 || (!c.kicked && v.readyState < 2)) {
      c.kicked = true;
      try { v.currentTime = t; } catch { /* not seekable yet */ }
    }
  }

  /* ---------------------------------------------- frame bank: LRU of bitmaps */
  const KEY = 1e5;
  const lru = new Map();
  const pending = new Set();
  let inflight = 0;
  // read by the site showcase capture: it waits for the banks, and for pending stills before each frame
  window.__tavraPlate = {
    busy: () => pending.size,
    banked: () => clips.filter(c => c.bank).length,
    repaint: () => { for (const c of clips) if (c.bank && c.ctx) paintBank(c, c.layer.classList.contains('is-covered')); },
  };

  function want(b, idx) {
    if (idx < 0 || idx >= b.n) return;
    const key = b.id * KEY + idx;
    const hit = lru.get(key);
    if (hit) { lru.delete(key); lru.set(key, hit); return; }
    if (pending.has(key) || inflight >= BANK.INFLIGHT) return;
    pending.add(key);
    inflight++;
    createImageBitmap(b.stills[idx])
      .then(bmp => {
        lru.set(key, bmp);
        while (lru.size > BANK.LRU) {
          const [k0, b0] = lru.entries().next().value;
          lru.delete(k0);
          b0.close();
        }
      })
      .catch(() => {})
      .finally(() => { pending.delete(key); inflight--; });
  }

  function paintBank(c, covered) {
    const b = c.bank, n = b.n;
    const at = p => Math.min(n - 1, Math.max(0, Math.floor(p * n)));
    const cur = at(c.cur), tgt = at(c.target);
    want(b, cur);
    if (!covered) {
      const dist = Math.abs(tgt - cur);
      const dir = tgt > cur ? 1 : tgt < cur ? -1 : c.dir;
      c.dir = dir;
      if (dist) want(b, tgt);
      const span = Math.min(BANK.AHEAD, Math.max(BANK.MIN_AHEAD, dist));
      const step = dist > BANK.AHEAD ? dist / BANK.AHEAD : 1;
      for (let s = 1; s <= span; s++) want(b, cur + dir * Math.round(s * step));
    }
    let idx = cur;
    let bmp = lru.get(b.id * KEY + cur);
    if (!bmp) {
      idx = -1;
      let best = c.drawn >= 0 ? Math.abs(c.drawn - cur) : Infinity;
      for (const [key, v] of lru) {
        if (Math.floor(key / KEY) !== b.id) continue;
        const d = Math.abs((key % KEY) - cur);
        if (d < best) { best = d; idx = key % KEY; bmp = v; }
      }
    }
    if (bmp && idx !== c.drawn) {
      c.ctx.drawImage(bmp, 0, 0, c.c.width, c.c.height);
      c.drawn = idx;
      if (!c.live) { c.live = true; c.c.classList.add('is-live'); }
    }
  }

  /* --------------------------------------- frame bank: fetch → demux → decode */
  function canEncodeWebP() {
    try {
      const cv = document.createElement('canvas');
      cv.width = cv.height = 1;
      return cv.toDataURL('image/webp').startsWith('data:image/webp');
    } catch { return false; }
  }

  function watchdog(task, ms) {
    const ctrl = new AbortController();
    let timer = 0;
    const guard = new Promise((_, reject) => {
      timer = setTimeout(() => { ctrl.abort(); reject(new Error('watchdog')); }, ms);
    });
    return Promise.race([task(ctrl.signal), guard]).finally(() => clearTimeout(timer));
  }

  async function fetchClip(url, signal) {
    const get = cache => fetch(url, { mode: 'cors', credentials: 'omit', cache, signal });
    let res;
    try { res = await get('default'); }
    catch (err) { if (signal.aborted) throw err; res = await get('reload'); }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.arrayBuffer();
  }

  function describe(file, track, buf) {
    const trak = file.getTrackById(track.id);
    for (const entry of trak.mdia.minf.stbl.stsd.entries) {
      const box = entry.hvcC || entry.avcC || entry.vpcC || entry.av1C;
      if (!box) continue;
      if (Number.isFinite(box.start) && box.size > box.hdr_size && box.start + box.size <= buf.byteLength) {
        const raw = new Uint8Array(buf, box.start + box.hdr_size, box.size - box.hdr_size);
        if (raw[0] === 1) return raw.slice();
      }
      try {
        const ds = new window.DataStream(undefined, 0, window.DataStream.BIG_ENDIAN);
        box.write(ds);
        return new Uint8Array(ds.buffer, 8);
      } catch { /* fall through */ }
    }
    return undefined;
  }

  function demux(buf) {
    return new Promise((resolve, reject) => {
      const file = window.MP4Box.createFile();
      const samples = [];
      let track = null, settled = false;
      const done = err => {
        if (settled) return;
        settled = true;
        if (err) return reject(err);
        if (!track || !samples.length) return reject(new Error('no video samples'));
        resolve({
          samples,
          pts: samples.map(s => s.ts).sort((a, b) => a - b),
          codec: track.codec,
          width: track.video.width,
          height: track.video.height,
          description: describe(file, track, buf),
        });
      };
      file.onError = e => done(new Error(`demux: ${e}`));
      file.onReady = info => {
        track = info.videoTracks[0];
        if (!track) return done(new Error('no video track'));
        file.setExtractionOptions(track.id, null, { nbSamples: Infinity });
        file.start();
      };
      file.onSamples = (id, user, list) => {
        for (const s of list) {
          samples.push({
            ts: Math.round((1e6 * s.cts) / s.timescale),
            dur: Math.round((1e6 * s.duration) / s.timescale),
            key: s.is_sync,
            data: s.data,
          });
        }
        if (track && samples.length >= track.nb_samples) done();
      };
      buf.fileStart = 0;
      file.appendBuffer(buf);
      file.flush();
      setTimeout(() => done(), 0);
    });
  }

  function nearest(arr, v) {
    let lo = 0, hi = arr.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (arr[mid] < v) lo = mid + 1; else hi = mid; }
    if (lo > 0 && Math.abs(arr[lo - 1] - v) < Math.abs(arr[lo] - v)) lo--;
    return lo;
  }

  function surface(w, h) {
    if (typeof OffscreenCanvas === 'function') {
      try {
        const cv = new OffscreenCanvas(w, h);
        const ctx = cv.getContext('2d', { alpha: false });
        if (ctx && cv.convertToBlob) return { ctx, encode: type => cv.convertToBlob({ type, quality: BANK.QUALITY }) };
      } catch { /* fall back to a DOM canvas */ }
    }
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const ctx = cv.getContext('2d', { alpha: false });
    return {
      ctx,
      encode: type => new Promise((res, rej) => cv.toBlob(b => (b ? res(b) : rej(new Error('encode failed'))), type, BANK.QUALITY)),
    };
  }

  // decode every sample once and keep each frame as a compressed still
  async function decodeAll(dm, accel, type, size, signal) {
    const config = { codec: dm.codec, codedWidth: dm.width, codedHeight: dm.height, hardwareAcceleration: accel };
    if (dm.description) config.description = dm.description;
    const support = await VideoDecoder.isConfigSupported(config);
    if (!support.supported) throw new Error(`${dm.codec} not decodable (${accel})`);

    const { samples, pts } = dm;
    const n = pts.length;
    const stills = new Array(n);
    const frames = [];
    const pool = Array.from({ length: BANK.POOL }, () => surface(size.w, size.h));
    let made = 0, busy = 0, fed = 0, flushing = false, flushed = false, failure = null, wake = null;
    const poke = () => { if (wake) { const w = wake; wake = null; w(); } };
    const nap = () => new Promise(r => { wake = r; setTimeout(poke, 30); });

    const decoder = new VideoDecoder({
      output: f => { frames.push(f); poke(); },
      error: e => { failure = failure || e; poke(); },
    });
    decoder.addEventListener?.('dequeue', poke);
    decoder.configure(config);

    try {
      for (;;) {
        if (signal.aborted) throw new Error('aborted');
        if (failure) throw failure;
        while (fed < n && decoder.decodeQueueSize < 8 && frames.length < 4) {
          const s = samples[fed++];
          decoder.decode(new EncodedVideoChunk({ type: s.key ? 'key' : 'delta', timestamp: s.ts, duration: s.dur, data: s.data }));
        }
        if (fed === n && !flushing) {
          flushing = true;
          decoder.flush().then(() => { flushed = true; poke(); }, e => { failure = failure || e; poke(); });
        }
        while (frames.length && pool.length) {
          const f = frames.shift();
          const surf = pool.pop();
          const idx = nearest(pts, f.timestamp);
          surf.ctx.drawImage(f, 0, 0, size.w, size.h);
          f.close();
          busy++;
          surf.encode(type)
            .then(blob => { if (!stills[idx]) { stills[idx] = blob; made++; } }, e => { failure = failure || e; })
            .finally(() => { busy--; pool.push(surf); poke(); });
        }
        if (flushed && !frames.length && !busy) break;
        await nap();
      }
    } finally {
      for (const f of frames.splice(0)) f.close();
      if (decoder.state !== 'closed') decoder.close();
    }
    if (!made) throw new Error('decoder produced no frames');
    for (let i = 0; i < n; i++) if (!stills[i]) stills[i] = stills[i - 1] || stills.find(Boolean);
    return stills;
  }

  async function makeBank(c, type, signal) {
    const buf = await fetchClip(c.v.currentSrc || c.v.src, signal);
    const dm = await demux(buf);
    const w = Math.min(dm.width, BANK.MAX_W);
    const size = { w, h: Math.round((dm.height * w) / dm.width) };
    let stills;
    try {
      stills = await decodeAll(dm, 'prefer-hardware', type, size, signal);
    } catch (err) {
      if (signal.aborted) throw err;
      console.info(`[tavra] ${c.v.id}: hardware decode failed (${err && err.message}); one software retry`);
      stills = await decodeAll(dm, 'prefer-software', type, size, signal);
    }
    return { id: c.id, n: stills.length, stills, ...size };
  }

  async function buildBanks() {
    const able = 'VideoDecoder' in window && 'EncodedVideoChunk' in window && 'createImageBitmap' in window
      && window.MP4Box && window.DataStream;
    if (reduced || !able) return;
    const type = canEncodeWebP() ? 'image/webp' : 'image/jpeg';
    for (const c of clips) {           // clip 1, then clip 2
      const t0 = performance.now();
      try {
        const bank = await watchdog(signal => makeBank(c, type, signal), BANK.WATCHDOG);
        if (c.c.width !== bank.w || c.c.height !== bank.h) { c.c.width = bank.w; c.c.height = bank.h; }
        c.ctx = c.c.getContext('2d', { alpha: false });
        c.bank = bank;
        console.info(`[tavra] ${c.v.id}: ${bank.n} frames banked as ${type.slice(6)} in ${((performance.now() - t0) / 1000).toFixed(1)}s`);
      } catch (err) {
        console.info(`[tavra] ${c.v.id}: frame bank unavailable (${err && err.message}); using <video> seeking`);
      }
    }
  }

  const startBanks = () => setTimeout(() => { buildBanks().catch(() => {}); }, 400);
  if (document.readyState === 'complete') startBanks();
  else addEventListener('load', startBanks, { once: true });

  return { update, firstClip: clips[0].v };
}
