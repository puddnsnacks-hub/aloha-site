/* app.js (aloha) — loads data/*.json, renders every card, feeds the map. Same helpers as wsp: tiles, sheets, tabs, drawer.
   Each widget renders independently: a missing or broken file leaves a quiet
   "coming soon" note and never blocks the rest of the page. */
window.WSP = window.WSP || {};
/* Michael, 2026-10-25: every link that leaves the site opens in a new tab (decided at click time, so links built later and the map's links follow too) */
document.addEventListener('click', (e) => { const a = e.target.closest && e.target.closest('a[href]'); if (!a) return; let u; try { u = new URL(a.getAttribute('href'), location.href); } catch (err) { return; }
  if ((u.protocol === 'http:' || u.protocol === 'https:') && u.origin !== location.origin) { a.target = '_blank'; a.rel = 'noopener'; } }, true);
  /* The hero: each city is done, now or ahead, in Hawaii time. */
  WSP.heroType = function () {
    const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Honolulu', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const cities = [...document.querySelectorAll('.h2-day[data-from]')];
    cities.forEach((d, i) => { const from = d.dataset.from, next = cities[i + 1] ? cities[i + 1].dataset.from : null, to = d.dataset.to;
      const st = ymd < from ? 'ahead' : (next ? ymd < next : ymd <= to) ? 'today' : 'past';
      d.dataset.state = st; const t = d.querySelector('.h2-state'); if (t) t.textContent = st === 'past' ? ', done' : st === 'today' ? ', now' : ''; });
  };
  const heroGo = () => { WSP.heroType();
    document.addEventListener('click', (e) => { const a = e.target.closest('[data-hero-go]'); if (!a) return; const ch = a.dataset.heroGo;
      if (WSP.shell && WSP.shell.go) { e.preventDefault(); history.replaceState(null, '', '#' + (a.dataset.heroCard || 'scene-' + ch));
        const first = (a.dataset.heroCard && document.getElementById(a.dataset.heroCard)) || document.querySelector(`#scene-${ch} > section.w:not([hidden]):not([data-nocollapse])`); if (first && WSP.shell.setOpen) WSP.shell.setOpen(first, true);
        setTimeout(() => {
          if (a.dataset.heroCard && first) {   /* a named card: land on the card itself */
            WSP.shell.go(ch, { scroll: false }); const nav = document.querySelector('.site-nav'); const top = first.getBoundingClientRect().top + scrollY - (nav ? nav.offsetHeight : 0) - 12;
            scrollTo({ top: Math.max(0, top), behavior: WSP.motion() }); const t = first.querySelector('.w-toggle'); if (t) t.focus({ preventScroll: true });
          } else { WSP.shell.go(ch); const t = document.querySelector(`#scene-${ch} [data-chapter-toggle]`); if (t) t.focus({ preventScroll: true }); }
        }, 50); } }); };  /* review 5: focus follows */   /* review 2: open the first card, then land on the category head */  /* review 2: land on the first card, open */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', heroGo); else heroGo();
  setInterval(() => WSP.heroType && WSP.heroType(), 5 * 60 * 1000);
  /* review 3: arrow keys move along a tab row, as tabs should */
  document.addEventListener('keydown', (e) => { const t = e.target.closest && e.target.closest('[role=tab]'); if (!t || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    const all = [...t.parentNode.querySelectorAll('[role=tab]')]; let i = all.indexOf(t);
    i = e.key === 'Home' ? 0 : e.key === 'End' ? all.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length;
    e.preventDefault(); all[i].focus(); all[i].click(); });
  WSP.motion = () => (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth');
(function () {
  const I = WSP.icons.ui, TZ = 'Pacific/Honolulu';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const body = (name) => $(`[data-widget="${name}"] .body`);
  const gmaps = (loc) => loc.gmaps_url || WSP.map.gmapsFallback(loc);
  const imgSrc = (img) => img && (img.local || img.src) || '';
  const pick = (o, k) => o && (o[k + '_local'] || o[k]) || '';
  const todayISO = () => new Date().toLocaleDateString('en-CA', { timeZone: TZ });
  const nowHour = () => Number(new Date().toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: TZ }));
  const dayKey = (iso) => ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date(iso + 'T12:00:00').getDay()];
  const longDay = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  async function load(name) {
    try { const r = await fetch(`data/${name}.json`, { cache: 'no-cache' }); if (!r.ok) throw 0; return await r.json(); }
    catch (e) { return null; }
  }
  function pending(name, msg) { const b = body(name); if (b) b.innerHTML = `<div class="pending-note">${esc(msg || 'Research still coming in — check back in a bit')}</div>`; }
  /* a source can be one URL, a list, or several URLs in one string: each becomes its own small link */
  function src(url, label) { const u = [].concat(url || []).join(' ').split(/[\s;,]+/).filter(x => /^https?:\/\//.test(x)); return u.map((x, i) => ` <a class="src" href="${esc(x)}" target="_blank" rel="noopener" title="Source">${label || 'source'}${u.length > 1 ? ' ' + (i + 1) : ''}</a>`).join(''); }
  function media(img, cls = '') {
    if (!imgSrc(img)) return '';
    return `<figure class="media ${cls}"><img src="${esc(imgSrc(img))}" alt="" loading="lazy" onerror="this.closest('figure').remove()">${img.credit ? `<figcaption class="credit">${img.credit_url ? `<a href="${esc(img.credit_url)}" target="_blank" rel="noopener">${esc(img.credit)}</a>` : esc(img.credit)}</figcaption>` : ''}</figure>`;
  }
  function hoursToday(h) {
    if (!h) return ''; if (typeof h === 'string') return h;
    const k = dayKey(todayISO()); return h[k] ? `Today ${h[k]}` : '';
  }
  function links(loc, extra = '') {
    const out = [`<a class="link-pill maps" href="${esc(gmaps(loc))}" target="_blank" rel="noopener">${I.pin}Maps</a>`];
    if (loc.yelp_photos_url) out.push(`<a class="link-pill" href="${esc(loc.yelp_photos_url)}" target="_blank" rel="noopener">${I.camera}${/restaurant|street-food/.test(loc.category || '') ? 'Food photos' : 'Photos'}</a>`);
    if (loc.spotify_url) out.push(`<a class="link-pill" href="${esc(loc.spotify_url)}" target="_blank" rel="noopener">${I.spotify}Spotify</a>`);
    if (loc.reservation && loc.reservation.url) out.push(`<a class="link-pill" href="${esc(loc.reservation.url)}" target="_blank" rel="noopener">${I.ticket}Reserve</a>`);
    if (loc.website) out.push(`<a class="link-pill" href="${esc(loc.website)}" target="_blank" rel="noopener">${I.link}Site</a>`);
    if (loc.lat && loc.lng) out.push(`<button class="link-pill" data-focus="${esc(loc.id)}">${I.pin}On map</button>`);
    return `<div class="links">${out.join('')}${extra}</div>`;
  }
  function metaBits(loc) {
    const m = [];
    if (loc.price) m.push(esc(loc.price));
    if (loc.walk_from_venue_minutes != null) m.push(`${loc.walk_from_venue_minutes} min walk`);
    else if (loc.walk_from_riverside_miles != null) m.push(`${loc.walk_from_riverside_miles} mi from the Riverside`);
    else if (loc.travel_from_downtown) m.push(esc(loc.travel_from_downtown));
    if (loc.best_time) m.push(esc(loc.best_time));
    if (loc.best_window) m.push(esc(loc.best_window));
    const h = hoursToday(loc.hours_this_weekend); if (h) m.push(esc(h));
    return m.length ? `<div class="meta">${m.map(x => `<span>${x}</span>`).join('<span aria-hidden="true">·</span>')}</div>` : '';
  }
  /* A tile: the picture, the name, one line, and Read more. The rest lives in the sheet. */
  function tile(o) {
    const img = o.art ? `<span class="tile-img tile-garn" style="--c:var(--wsp-cat-${esc(o.cat || 'landmark')})">${o.art}</span>` : o.img ? `<img class="tile-img" src="${esc(o.img)}" alt="" loading="lazy" onerror="this.classList.add('is-gone')">` : `<span class="tile-img tile-cat" style="--c:var(--wsp-cat-${esc(o.cat || 'landmark')})"></span>`;
    const bare = o.bare || (!o.art && !o.img);   /* no picture: no placeholder block */
    return `<li class="tile${bare ? ' tile--bare' : ''}" ${o.attrs || ''}>${bare ? '' : img}<div class="tile-t"><h3>${esc(o.name)}</h3>${o.line ? `<p class="tile-line">${o.line}</p>` : ''}</div><button class="btn btn--sm tile-more" type="button" aria-label="Read more: ${esc(o.name)}" ${o.open}>Read more</button></li>`;
  }
  function placeRow(loc, opts = {}) {
    const cat = loc.category || 'landmark';
    const bits = []; if (loc.walk_from_venue_minutes != null) bits.push(`${loc.walk_from_venue_minutes} min walk`); else if (loc.walk_from_riverside_miles != null) bits.push(`${loc.walk_from_riverside_miles} mi`); if (loc.price) bits.push(esc(loc.price));
    const line = opts.line ? opts.line(loc) : bits.join(' · ');
    return tile({ img: imgSrc(loc.image), cat, name: loc.name, line, open: `data-sheet="${esc(loc.id)}"`, attrs: `data-id="${esc(loc.id)}"` });
  }
  /* Blocks of info that are not places (cast, mascots, bands): the same tile, the content in the sheet. */
  const modals = {}; let modalN = 0;
  function modal(html) { const id = 'm' + (++modalN); modals[id] = html; return `data-modal="${id}"`; }
  const FOLD = 6;
  function factsList(arr, limit = 6, cls = '') {
    arr = arr || []; const rows = arr.map((f, i) => `<li ${i >= limit ? 'data-folded ' : ''}><span class="n num">${i + 1}</span><span>${esc(typeof f === 'string' ? f : f.fact || f.text)}${src(typeof f === 'string' ? '' : f.source)}</span></li>`);
    const more = arr.length > limit ? `<button class="btn btn--sm fold-btn" type="button" data-fold-n="${arr.length - limit}">Show ${arr.length - limit} more</button>` : '';
    return `<ul class="facts-list places${arr.length > limit ? ' folded' : ''} ${cls}">${rows.join('')}</ul>${more}`;
  }
  function placeList(arr, opts = {}) {
    arr = arr || []; const limit = opts.limit || FOLD;
    const rows = arr.map((l, i) => placeRow(l, opts).replace('<li class="tile"', `<li ${i >= limit ? 'data-folded ' : ''}class="tile"`));
    const more = arr.length > limit ? `<button class="btn btn--sm fold-btn" type="button" data-fold-n="${arr.length - limit}">Show ${arr.length - limit} more</button>` : '';
    return `<ul class="tiles${arr.length > limit ? ' folded' : ''}">${rows.join('')}</ul>${more}`;
  }
  document.addEventListener('click', (e) => {
    const f = e.target.closest('.fold-btn'); if (!f) return;
    const ul = f.previousElementSibling; const open = ul.classList.toggle('folded');
    f.textContent = open ? `Show ${f.dataset.foldN} more` : 'Show fewer';
    if (open) ul.scrollIntoView({ block: 'nearest' });
  });

  /* ---------- Detail sheet ---------- */
  const byId = {};
  WSP.sheet = {
    openLocation(loc) {
      const sb = $('#sheet-body'); if (!sb) return;
      const rows = [];
      if (loc.address) rows.push(['Address', esc(loc.address)]);
      if (loc.hours_this_weekend) rows.push(['Hours', typeof loc.hours_this_weekend === 'string' ? esc(loc.hours_this_weekend) : ['fri', 'sat', 'sun', 'mon'].filter(k => loc.hours_this_weekend[k]).map(k => `<b>${k[0].toUpperCase() + k.slice(1)}</b> ${esc(loc.hours_this_weekend[k])}`).join('<br>')]);
      if (loc.must_order) rows.push(['Order', esc([].concat(loc.must_order).join(', '))]);
      if (loc.signature_drink) rows.push(['Drink', esc(loc.signature_drink)]);
      if (loc.vibe) rows.push(['Vibe', esc(loc.vibe)]);
      if (loc.why_special) rows.push(['Why', esc(loc.why_special)]);
      if (loc.tv_setup) rows.push(['Screens', esc(loc.tv_setup)]);
      if (loc.cost) rows.push(['Cost', esc(loc.cost)]);
      if (loc.reservation && loc.reservation.needed != null) rows.push(['Reservation', loc.reservation.needed ? 'Recommended' : 'Walk in']);
      if (loc.wsp_fan_note) rows.push(['Panic fans', esc(loc.wsp_fan_note)]);
      if (loc.why) rows.push(['Why go', esc(loc.why)]);
      if (loc.phone) rows.push(['Phone', `<a href="tel:${esc(loc.phone.replace(/[^\d+]/g, ''))}">${esc(loc.phone)}</a>`]);
      sb.innerHTML = `${media(loc.image)}<div style="display:flex;flex-direction:column;gap:10px;margin-top:12px">
        <span class="eyebrow"><span class="dot" style="display:inline-block;width:9px;height:9px;background:var(--wsp-cat-${esc(loc.category || 'landmark')});margin-right:8px;vertical-align:middle"></span>${esc((WSP.map.CATS[loc.category] || {}).label || loc.category || '')}</span>
        <h3 id="sheet-title" class="heading-sm">${esc(loc.name)}</h3>
        <p class="prose">${esc(loc.blurb || '')}</p>
        ${rows.length ? `<dl style="display:grid;grid-template-columns:auto 1fr;gap:6px 14px;font-size:var(--pds-text-caption);margin:0">${rows.map(([k, v]) => `<dt class="label" style="padding-top:2px">${k}</dt><dd style="margin:0">${v}</dd>`).join('')}</dl>` : ''}
        ${links(loc)}${loc.source ? `<p class="caption">Source: <a href="${esc(loc.source)}" target="_blank" rel="noopener">${esc(new URL(loc.source, location.href).hostname)}</a></p>` : ''}</div>`;
      WSP.sheet._show();
    },
    _show() { const sh = $('#sheet'); WSP.sheet._from = document.activeElement; sh.setAttribute('aria-modal', 'true'); sh.classList.add('open'); sh.setAttribute('aria-hidden', 'false'); $('#scrim').classList.add('open'); sh.scrollTop = 0; const m = $('main'); if (m && !sh.closest('main')) m.inert = true; ['.site-header', '.site-nav', 'footer'].forEach(q => { const x = $(q); if (x) x.inert = true; });  /* review 4: focus stays in the sheet */ const c = $('#sheet-close'); if (c) setTimeout(() => c.focus(), 30); },
    openHTML(html) {
      const sb = $('#sheet-body'); if (!sb) return; sb.innerHTML = html;
      WSP.sheet._show();
    },
    close() { const sh = $('#sheet'); if (!sh.classList.contains('open')) return; sh.classList.remove('open'); sh.setAttribute('aria-hidden', 'true'); $('#scrim').classList.remove('open'); const m = $('main'); if (m) m.inert = false; ['.site-header', '.site-nav', 'footer'].forEach(q => { const x = $(q); if (x) x.inert = false; }); if (WSP.sheet._from && WSP.sheet._from.focus) WSP.sheet._from.focus(); WSP.sheet._from = null; }
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-sheet]'); if (a) { e.preventDefault(); const l = byId[a.dataset.sheet]; if (l) WSP.sheet.openLocation(l); return; }
    const m = e.target.closest('[data-modal]'); if (m) { e.preventDefault(); if (modals[m.dataset.modal]) WSP.sheet.openHTML(modals[m.dataset.modal]); return; }
    const f = e.target.closest('[data-focus]'); if (f) { e.preventDefault(); WSP.sheet.close(); WSP.map.focus(f.dataset.focus); return; }
    if (e.target.closest('#sheet-close') || e.target.id === 'scrim') WSP.sheet.close();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') WSP.sheet.close(); });

  /* ---------- Theme toggle ---------- */
  if ($('#theme-toggle')) $('#theme-toggle').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next); try { localStorage.setItem('aloha-theme', next); } catch (e) {}
  });

  /* ---------- Menu: a drawer from the left over a light scrim (Michael 2026-10-24 00:46) ---------- */
  const mega = $('#mega'), menuBtn = $('#menu-btn'), scrim = $('#mega-scrim');
  const sectionTitle = (id) => { const h = $(`#${id} > header h2`) || $(`#${id} h2`); return h ? h.textContent.trim() : id; };
  const isOpen = () => mega.classList.contains('is-open');
  function setMenu(open, focusBack) {
    mega.classList.toggle('is-open', open); if (scrim) scrim.classList.toggle('is-on', open);
    mega.inert = !open; mega.setAttribute('aria-hidden', String(!open));
    document.documentElement.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    if (open) {
      const cur = document.body.dataset.chapter || '';
      $$('.mega-cat', mega).forEach(a => { if (a.dataset.chapterLink === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
      setTimeout(() => { const f = $('.mega-cat[aria-current]', mega) || $('.mega-cat', mega); if (f) f.focus({ preventScroll: true }); }, 60);
    } else if (focusBack) menuBtn.focus({ preventScroll: true });
  }
  // the drawer and its scrim live at the top of the page's stacking order, not inside the sticky bar
  if (scrim) document.body.append(scrim); document.body.append(mega);
  mega.hidden = false; setMenu(false);
  menuBtn.addEventListener('click', () => setMenu(!isOpen(), true));
  if (scrim) scrim.addEventListener('click', () => setMenu(false, true));
  const closeBtn = $('.mega-close', mega); if (closeBtn) closeBtn.addEventListener('click', () => setMenu(false, true));
  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    if (e.key === 'Escape') { setMenu(false, true); return; }
    if (e.key === 'Tab') { const f = $$('button, a', mega); const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
  });
  // a swipe toward the left closes it
  let sx = null; mega.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
  mega.addEventListener('touchend', (e) => { if (sx !== null && sx - e.changedTouches[0].clientX > 60) setMenu(false, true); sx = null; }, { passive: true });
  mega.addEventListener('click', (e) => {
    const x = e.target.closest('a.mega-xl');
    if (x) { setMenu(false); if (x.dataset.x === 'top') { e.preventDefault(); scrollTo({ top: 0, behavior: WSP.motion() }); history.replaceState(null, '', location.pathname); const h = document.querySelector('.h2-btn'); if (h) setTimeout(() => h.focus({ preventScroll: true }), 60); } return; }
    const a = e.target.closest('a.mega-cat'); if (!a) return;
    e.preventDefault(); setMenu(false);
    const ch = a.dataset.chapterLink;
    if (WSP.shell && WSP.shell.go) WSP.shell.go(ch);
    history.replaceState(null, '', '#scene-' + ch);
    setTimeout(() => { const t = document.querySelector(`#scene-${ch} [data-chapter-toggle]`) || document.querySelector(`#scene-${ch} h2`); if (t) { if (!t.matches('button, a')) t.tabIndex = -1; t.focus({ preventScroll: true }); } }, 80);  /* review 4: focus follows her to the category */
  });

  /* ---------- Shared pieces for the trip ---------- */
  const arr = (x) => Array.isArray(x) ? x : (x == null || x === '' ? [] : [x]);
  const known = (v) => v != null && v !== '' && !/^\s*(not found|unknown|n\/a|tbd)\b/i.test(String(v));
  const txt = (v) => known(v) ? esc(String(v)) : '';
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const isoDates = (v) => [...String(Array.isArray(v) ? v.join(' ') : (v || '')).matchAll(/(\d{4})-(\d{2})-(\d{2})/g)].map(m => m[0]);
  const dLabel = (iso, wd) => { const d = new Date(iso + 'T12:00:00'); return `${wd ? WD[d.getDay()] + ' ' : ''}${MON[d.getMonth()]} ${d.getDate()}`; };
  /* "2026-10-28/2026-11-01" reads as a run, a list reads as days, one date reads with its weekday */
  function when(v) {
    const ds = isoDates(v); if (!ds.length) return txt(Array.isArray(v) ? v.join(', ') : v);
    const ranged = !Array.isArray(v) && ds.length === 2 && /\d\s*(\/|to|–|—|-\s|through|until)\s*\d|\d\/\d/.test(String(v));
    if (ds.length === 1) return dLabel(ds[0], true);
    if (ranged || (Array.isArray(v) && v.length === 2 && /\//.test(v.join('')))) return `${dLabel(ds[0])} – ${dLabel(ds[1])}`;
    return ds.map((x, i) => i && x.slice(5, 7) === ds[i - 1].slice(5, 7) ? String(Number(x.slice(8))) : dLabel(x)).join(', ');
  }
  /* is it on today, and has it all gone by? (Hawaii time) */
  function span(v) { const ds = isoDates(v).sort(); if (!ds.length) return null; const ranged = !Array.isArray(v) && ds.length === 2; return { first: ds[0], last: ds[ds.length - 1], all: ranged ? null : ds }; }
  const onToday = (v) => { const s = span(v), t = todayISO(); if (!s) return false; return s.all ? s.all.includes(t) : s.first <= t && t <= s.last; };
  const gone = (v) => { const s = span(v); return !!s && s.last < todayISO(); };
  const srcList = (urls) => { const u = [...new Set(arr(urls).join(' ').split(/[\s;,]+/).filter(x => /^https?:\/\//.test(x)))]; return u.length ? `<p class="caption src-list">Sources: ${u.map((x, i) => `<a href="${esc(x)}" target="_blank" rel="noopener">${esc(host(x))}</a>`).join(', ')}</p>` : ''; };
  const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return 'source'; } };
  const row = (k, v) => v ? `<p class="bm-garn"><b>${k}:</b> ${v}</p>` : '';
  const pill = (href, label, icon, cls = '') => href && /^(https?:|tel:)/.test(href) ? `<a class="link-pill ${cls}" href="${esc(href)}" target="_blank" rel="noopener">${icon}${label}</a>` : '';
  const mapsFor = (p) => p.gmaps_url || WSP.map.gmapsFallback(p);
  const onMap = (p) => typeof p.lat === 'number' && typeof p.lng === 'number' && p.id ? `<button class="link-pill" data-focus="${esc(p.id)}">${I.pin}On map</button>` : '';
  function tabs(bd, key, groups) {
    groups = groups.filter(g => g && g[2]);
    if (!groups.length) return;
    bd.innerHTML = `<div class="tabs" role="tablist">${groups.map(([id, l], i) => `<button class="tab" role="tab" id="${key}-${id}" aria-selected="${i === 0}" aria-controls="${key}p-${id}" tabindex="${i ? -1 : 0}">${esc(l)}</button>`).join('')}</div>${groups.map(([id, , html], i) => `<div role="tabpanel" id="${key}p-${id}" aria-labelledby="${key}-${id}" ${i ? 'hidden' : ''}>${html}</div>`).join('')}`;
    bd.querySelector('.tabs').addEventListener('click', (e) => { const t = e.target.closest('.tab'); if (!t) return; bd.querySelectorAll('.tab').forEach(x => { x.setAttribute('aria-selected', x === t); x.tabIndex = x === t ? 0 : -1; }); bd.querySelectorAll('[role=tabpanel]').forEach(x => x.hidden = x.id !== t.getAttribute('aria-controls')); });
  }
  /* a tile line: no asides, no year, en dashes, nothing "not found" */
  const tidy = (t) => String(t || '').replace(/\s*\([^)]*\)/g, '').replace(/,?\s*2026\b/g, '').replace(/\s+-\s+/g, ' – ').replace(/(\d)-(\d)/g, '$1–$2').split(/[.;]\s/).filter(x => !/not found/i.test(x))[0] || '';
  const roastLine = (sig) => { if (!known(sig)) return ''; const parts = String(sig).split(/[,;.(]\s*/).map(x => x.trim()).filter(Boolean); return parts.find(x => /cochinillo|suckling|lech[oó]n|cordero|lamb|roast|asado/i.test(x)) || parts[0]; };
  const tiles = (list) => list.length ? `<ul class="tiles">${list.join('')}</ul>` : '';
  const ruleList = (list, k = 'note') => { list = arr(list).filter(x => x && (typeof x === 'string' || x[k])); return list.length ? `<ul class="rules">${list.map(t => `<li class="rule"><span class="ic">${I.info}</span><span>${esc(typeof t === 'string' ? t : t[k])}${typeof t === 'string' ? '' : src(t.source)}</span></li>`).join('')}</ul>` : ''; };
  /* a dated list: the year in the margin, the fact beside it, its source after it */
  const yearList = (list, k = 'fact') => { list = arr(list).filter(x => x && x[k]); return list.length ? `<ol class="yr-list">${list.map(f => `<li><span class="yr num">${esc(f.year || '')}</span><span>${esc(f[k])}${src(f.source)}</span></li>`).join('')}</ol>` : ''; };

  /* ================= Aloha ================= */
  const ISL = { 'Oahu': 'Oʻahu', 'Maui': 'Maui', 'Big Island': 'Big Island', 'Kauai': 'Kauaʻi', 'Lanai': 'Lānaʻi' };
  const ISL_ORDER = ['Oahu', 'Maui', 'Big Island', 'Kauai'];
  const slug = (x) => String(x).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const usd = (n) => '$' + Math.round(n).toLocaleString('en-US');
  const usd2 = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const longDate = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const P = {};   /* every place by id */

  /* ---------- the place sheet: what to order, when, the check-first note, then the links ---------- */
  function placeHTML(p, back) {
    const rows = [];
    const add = (k, v) => { if (v) rows.push([k, v]); };
    add(p.order_label || (p.category === 'nature' ? 'See' : p.category === 'music' ? 'Sound' : p.chapter === 'luaus' ? 'What' : 'Order'), esc(p.order));
    if (p.dates && p.dates.length) add('Nights', esc(p.dates.map(longDate).join(', ')));
    add('Time', esc(p.time)); add('Hours', esc(p.hours)); add('Price', esc(p.price)); add('Crowd', esc(p.age));
    add('Getting in', esc(p.reservation)); add('Distance', esc(p.distance)); add('Effort', esc(p.difficulty)); add('Address', esc(p.address));
    const cat = (WSP.map.CATS[p.category] || {}).label || '';
    return `${back ? `<button class="btn btn--sm sheet-back" type="button" data-back>${esc('Back to ' + back)}</button>` : ''}
      <span class="eyebrow"><span class="dot" style="display:inline-block;width:9px;height:9px;background:var(--wsp-cat-${esc(p.category)});margin-right:8px;vertical-align:middle"></span>${esc([cat, ISL[p.island] || p.island, p.area].filter(Boolean).join(' · '))}</span>
      <h3 id="sheet-title" class="heading-sm">${esc(p.name)}</h3>
      <p class="prose"><b class="strong">${esc(p.blurb)}</b></p>
      ${p.check ? `<p class="check-first"><b>Check first</b> ${esc(p.check)}</p>` : ''}
      ${rows.length ? `<dl class="hrs--wide place-dl">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>` : ''}
      <div class="links">${p.address || (p.lat && p.lng) ? pill(mapsFor(Object.assign({}, p, { city: ISL[p.island] || p.island })), 'Maps', I.pin, 'maps') : ''}${pill(p.website, /luau|holiday|xmas/.test(p.card || '') ? 'Book' : 'Site', p.website && /book|reserv|ticket|fareharbor|tock|opentable/i.test(p.website) ? I.ticket : I.link)}${onMap(p)}</div>
      ${srcList(p.sources)}`;
  }
  let backStack = null;
  WSP.sheet.openLocation = (loc) => openPlace(loc.id);   /* the map's Details link opens the same sheet */
  function openPlace(id, back) { const p = P[id]; if (!p) return; WSP.sheet.openHTML(placeHTML(p, back && back.title)); backStack = back || null; }
  document.addEventListener('click', (e) => {
    const s = e.target.closest('[data-place]'); if (s) { e.preventDefault(); const t = s.closest('#sheet') && backStack ? backStack : (s.dataset.backTitle ? { title: s.dataset.backTitle, html: modals[s.dataset.backModal] } : null); openPlace(s.dataset.place, t); return; }
    if (e.target.closest('[data-back]') && backStack) { e.preventDefault(); const b = backStack; backStack = null; WSP.sheet.openHTML(b.html); return; }
    const g = e.target.closest('[data-island-go]'); if (g) { e.preventDefault(); WSP.sheet.close(); goCard('islands', 'island-' + g.dataset.islandGo); }
  });
  /* open a chapter and land on one card, the way the hero buttons do */
  function goCard(ch, cardId) { const a = document.createElement('a'); a.dataset.heroGo = ch; a.dataset.heroCard = cardId; a.hidden = true; document.body.appendChild(a); a.click(); a.remove(); }

  /* a tile for a place: name, island and area, a check-first mark when there is something to confirm */
  function placeTile(p, showIsland = true) {
    const line = [showIsland ? ISL[p.island] : '', p.area && p.area !== (ISL[p.island] || p.island) ? p.area : ''].filter(Boolean).join(' · ');
    return tile({ bare: true, cat: p.category, name: p.name, line: esc(line), open: `data-place="${esc(p.id)}"`, attrs: `data-id="${esc(p.id)}"${p.check ? ' data-check' : ''}` });
  }
  /* a card of places: All, then one tab per island that has any */
  function renderPlaces(cardId, list) {
    const bd = body(cardId); if (!bd) return;
    list = arr(list); if (!list.length) return pending(cardId, 'Nothing here for these dates');
    const isles = ISL_ORDER.filter(i => list.some(p => p.island === i));
    if (isles.length < 2) { bd.innerHTML = tiles(list.map(p => placeTile(p, true))); return; }
    const grouped = isles.map(i => `<h3 class="isle-h">${esc(ISL[i])}</h3>${tiles(list.filter(p => p.island === i).map(p => placeTile(p, false)))}`).join('');
    tabs(bd, cardId, [['all', 'All', grouped]].concat(isles.map(i => [slug(i), ISL[i], tiles(list.filter(p => p.island === i).map(p => placeTile(p, false)))])));
  }

  /* ---------- The menu: six trips, set like drinks. Islands are the pour, measured in nights ---------- */
  const UMB = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 0 1 9 8H3a9 9 0 0 1 9-8Z" fill="currentColor"/><path d="M12 11v8.5a1.5 1.5 0 0 1-3 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  const strength = (n, label) => `<span class="strength" role="img" aria-label="Pace: ${esc(label)}, ${n} of 3">${[1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}">${UMB}</i>`).join('')}<span class="strength-l" aria-hidden="true">${esc(label)}</span></span>`;
  const pour = (t) => t.islands.map(x => `<span class="pour"><b class="num">${x.nights}</b> ${x.nights === 1 ? 'night' : 'nights'} ${esc(x.display)}</span>`).join('') + (t.ferry ? `<span class="pour pour--dash">a boat to ${esc(ISL.Lanai)}</span>` : '');
  function tripHTML(t, n) {
    const c = t.cost;
    const day = (d) => `<li class="day"><span class="day-d">${esc(longDate(d.date))}</span><div class="day-b"><h4>${esc(d.title)}</h4>${d.stops.length ? `<p class="day-stops">${d.stops.filter(id => P[id]).map(id => `<button class="link-pill stop" type="button" data-place="${esc(id)}">${esc(P[id].short || P[id].name)}</button>`).join('')}</p>` : ''}${d.note ? `<p class="day-note">${esc(d.note)}</p>` : ''}</div></li>`;
    const legRow = l => `<li><span>${esc(l.from)} → ${esc(l.to)} · ${esc(longDate(l.date))}<span class="leg-basis">${esc(usd(l.fare))} plus ${esc(usd2(l.companion))} for the companion. ${esc(l.basis[0].toUpperCase() + l.basis.slice(1))}.${src(l.source, 'fare page')}</span></span><span class="num">${esc(usd2(l.two))}</span></li>`;
    const legs = c.legs.map(legRow).join('');
    const vs = c.vias || [];
    const viaName = v => v.out === v.back ? `Through ${v.out}` : `Out through ${v.out}, home through ${v.back}`;
    const stayName = (v, o) => ({ none: 'Same-day connections', out: `A night in ${v.out} going out`, back: `A night in ${v.back} coming home`, both: v.out === v.back ? `A night in ${v.out} each way` : `A night in each city`, home1: `Home through ${v.back}, a day there`, home2: `Home through ${v.back}, two days there` })[o.stay];
    const vsDiff = d => d > 0 ? `${usd(d)} more than the Houston plan` : d < 0 ? `${usd(-d)} less than the Houston plan` : 'the same as the Houston plan';
    const optRow = (v, o) => `<li><span>${esc(stayName(v, o))}<span class="leg-basis">${o.days} days, ${o.legs.length} one-way tickets, flights ${esc(usd(o.flights))}${o.hub_nights ? `, ${o.hub_nights === 1 ? 'hotel' : 'hotels'} ${esc(usd(o.hotel[0]))}–${esc(usd(o.hotel[1]))}` : ''}. ${o.gives.length ? esc(o.gives.map(g => g[0].toUpperCase() + g.slice(1)).join('. ')) + '. ' : ''}About ${esc(vsDiff(o.diff))}.</span></span><span class="num">${esc(usd(o.low))}–${esc(usd(o.high))}</span></li>`;
    const pick = vs.length && (vs[0].options.find(o => o.stay === 'home1') || vs[0].options[0]);
    const viaHTML = vs.length ? `<h4 class="sheet-h">Through Las Vegas</h4>
      <p class="prose">Southwest flies Las Vegas nonstop to and from every island. You still land in Honolulu on Dec 19 (a night in Vegas going out leaves Houston on Dec 18). On the way home, take a day or two in Vegas before Houston. Seattle is out: Southwest\'s Seattle flights to Hawaii connect.</p>
      ${vs.map(v => `<h5 class="via-h">${esc(viaName(v))} <span class="badge badge--${v.nonstop ? 'go' : 'caution'}">${v.nonstop ? 'Nonstop' : 'Connects'}</span></h5>
      <ul class="price-list">${v.options.map(o => optRow(v, o)).join('')}</ul>
      <p class="caption">${esc([...new Set(v.options.flatMap(o => o.notes))].join(' '))}</p>`).join('')}
      <h4 class="sheet-h">The tickets, ${esc(stayName(vs[0], pick).toLowerCase())}</h4>
      <ul class="price-list bill">${pick.legs.map(legRow).join('')}</ul>` : '';
    const vegasHTML = viaHTML ? viaHTML + `<p class="caption">Separate tickets don't protect a connection. On a same-day connection, a late first flight can cost you the second ticket, so leave three hours or more, or take the night. Bags come off at the end of each ticket, so expect to pay for them again. City hotels are average December rates before resort fees.</p>` : '';
    const cars = c.cars.map(x => x.rate ? `<li><span>Car, ${esc(ISL[x.island])}, ${x.days} days<span class="leg-basis">${esc(usd(x.rate))} a day, ${esc(x.basis)}.</span></span><span class="num">${esc(usd(x.rate * x.days))}</span></li>` : `<li><span>Car, ${esc(ISL[x.island])}, ${x.days} days<span class="leg-basis">Not in the total: ${esc(x.basis)}.</span></span><span class="num">–</span></li>`).join('');
    return `<span class="eyebrow">No. ${n} · ${esc(t.tag)}</span>
      <h3 id="sheet-title" class="heading-sm tm-name">${esc(t.name)}</h3>
      <p class="prose"><b class="strong">${esc(t.line)}</b></p>
      <p class="tm-recipe">${pour(t)}</p>
      <p class="trip-when">${esc(longDate(t.start))} – ${esc(longDate(t.end))} · ${strength(t.pace_n, t.pace)}</p>
      ${t.checks.map(x => `<p class="check-first"><b>Check first</b> ${esc(x)}</p>`).join('')}
      <div class="links">${t.islands.map(x => `<button class="link-pill" type="button" data-island-go="${esc(slug(x.island))}">${I.pin}${esc(x.display)} must-sees</button>`).join('')}</div>
      <h4 class="sheet-h">Day by day</h4>
      <ol class="days">${t.days.map(day).join('')}</ol>
      ${t.trim ? `<p class="day-note trim-note"><b>Shorter trip</b> ${esc(t.trim)}</p>` : ''}
      <h4 class="sheet-h">The bill for two</h4>
      <p class="prose">Book ${t.tickets} one-way tickets, one per flight, and add the companion to each.</p>
      ${t.deal ? `<p class="check-first"><b>Check first</b> ${esc(t.deal)}</p>` : ''}
      <ul class="price-list bill">${legs}
        ${t.islands.map(x => `<li><span>Stays, ${esc(x.display)}, ${x.nights} nights<span class="leg-basis">Look in ${esc(x.bases.join(' and '))}. Clean, simple stays, estimated.</span></span><span class="num">${esc(usd(x.stay_low))}–${esc(usd(x.stay_high))}</span></li>`).join('')}
        ${cars}
        ${c.ferry ? `<li><span>Ferry to Lānaʻi and back, two people<span class="leg-basis">Expeditions, ${esc(usd(c.ferry_each))} a person each way.</span></span><span class="num">${esc(usd(c.ferry))}</span></li>` : ''}
        <li class="bill-total"><span>About</span><span class="num">${esc(usd(c.low))}–${esc(usd(c.high))}</span></li></ul>
      <p class="caption">Not counted: ${esc([...t.extras, c.excludes].join(". ").replace(/^./, m => m.toLowerCase()))}</p>
      ${vegasHTML}`;
  }
  function renderTrips(d) {
    const bd = body('trips-menu'); if (!bd) return;
    const ts = arr(d && d.trips); if (!ts.length) return pending('trips-menu');
    bd.innerHTML = `<div class="tm"><p class="tm-head"><span>Honolulu, Dec 19</span><span>For two</span></p><ol class="tm-list">${ts.map((t, i) => {
      const m = modal(tripHTML(t, i + 1));
      return `<li class="tm-row" data-trip="${esc(t.id)}"><button class="tm-item" type="button" ${m} data-trip-open="${esc(t.id)}" aria-label="${esc(`No. ${i + 1}, ${t.name}: ${t.tag}, ${longDate(t.start)} to ${longDate(t.end)}, about ${usd(t.cost.low)} to ${usd(t.cost.high)} for two. Open the day-by-day`)}">
        <span class="tm-top"><span class="tm-n num">${i + 1}</span><span class="tm-name">${esc(t.name)}</span><span class="tm-dots" aria-hidden="true"></span><span class="tm-price num">${esc(usd(t.cost.low))}<span class="tm-to">–${esc(usd(t.cost.high))}</span></span></span>
        <span class="tm-line">${esc(t.line)}</span>
        <span class="tm-recipe">${pour(t)}</span>
        <span class="tm-meta"><span>${t.length} days · ${esc(longDate(t.start))} – ${esc(longDate(t.end))}</span>${strength(t.pace_n, t.pace)}${t.flag ? `<span class="tm-flag tm-flag--car">${esc(t.flag)}</span>` : ''}${t.checks.length ? '<span class="tm-flag">Check first</span>' : ''}</span>
      </button></li>`; }).join('')}</ol>
      <p class="tm-foot">For two. Every flight is its own one-way ticket, the only way the 2-for-1 applies (the companion pays from $5.60 a flight). Flights, stays and cars, before taxes, fees, food and fun.</p></div>`;
    /* the sheet's island buttons and stop pills need the trip to come back to */
    bd.addEventListener('click', (e) => { const b = e.target.closest('[data-trip-open]'); if (!b) return; const t = ts.find(x => x.id === b.dataset.tripOpen); backStack = null; WSP.sheet._trip = { title: t.name, html: modals[b.getAttribute('data-modal')] }; }, true);
    const fb = body('trips-math'); if (fb) fb.innerHTML = `<p class="prose">${esc(d.basis)}</p>
      <ul class="price-list">${ts.map(t => `<li><span>${esc(t.name)}<span class="leg-basis">Flights ${esc(usd(t.cost.flights))} · stays ${esc(usd(t.cost.lodging[0]))}–${esc(usd(t.cost.lodging[1]))}${t.cost.car ? ` · car ${esc(usd(t.cost.car))}` : ''}${t.cost.ferry ? ` · ferry ${esc(usd(t.cost.ferry))}` : ''}${t.cost.vias && t.cost.vias.length ? (o => ` · home through Vegas with a day there, ${esc(usd(o.low))}–${esc(usd(o.high))}`)(t.cost.vias[0].options.find(o => o.stay === 'home1') || t.cost.vias[0].options[0]) : ''}</span></span><span class="num">${esc(usd(t.cost.low))}–${esc(usd(t.cost.high))}</span></li>`).join('')}</ul>
      <p class="caption">Each flight uses the lowest fare Southwest showed for that route and month. Holiday dates usually cost more.</p>`;
  }
  /* a stop inside a trip opens the place, with a way back to the trip */
  document.addEventListener('click', (e) => { const s = e.target.closest('#sheet [data-place]'); if (s && WSP.sheet._trip && !backStack) backStack = WSP.sheet._trip; }, true);

  /* ---------- The islands: the must-see list, the car, where to look for a room ---------- */
  function renderIslands(isl, get) {
    const stays = {}; arr(get && get.islands).forEach(x => stays[x.island] = x);
    arr(isl && isl.islands).forEach(x => {
      const bd = body('island-' + x.id); if (!bd) return; const st = stays[x.island] || {};
      const must = x.must.filter(id => P[id]);
      bd.innerHTML = `<p class="isle-line">${x.outlook === 'caution' ? '<span class="badge badge--caution">Caution</span> ' : ''}${esc(x.line)}</p>
        <h3 class="isle-h">Must-see</h3>
        <ol class="must">${must.map(id => `<li><button class="must-b" type="button" data-place="${esc(id)}"><span class="must-dot" style="--c:var(--wsp-cat-${esc(P[id].category)})" aria-hidden="true"></span><span class="must-n">${esc(P[id].short || P[id].name)}</span><span class="must-a">${esc(P[id].area || '')}</span></button></li>`).join('')}</ol>
        <dl class="hrs--wide"><dt>Car</dt><dd>${esc(st.car || '')}</dd><dt>Stay</dt><dd>${esc(arr(st.stay).join(', '))}</dd><dt>Budget</dt><dd>${esc(st.budget || '')} ${esc(st.adr || '')}</dd><dt>Airport</dt><dd>${esc(x.airport)}</dd></dl>`;
    });
  }

  /* ---------- Tiki: Donn Beach's story, then the bars ---------- */
  function renderTiki(t) {
    const bd = body('tiki-history'); if (bd && t) bd.innerHTML = `${yearList(t.history)}
      <p class="prose">${esc(t.mai_tai)}</p>
      <div class="links"><button class="link-pill maps" type="button" data-place="international-market-place-dons-treehouse">${I.pin}Stand under the banyan</button></div>
      ${srcList(t.history_sources)}`;
    if (t) renderPlaces('tiki-bars', (t.cards || {})['tiki-bars']);
    const tb = body('tiki-bars'); if (tb && t) {
      const ev = arr(t.events).map(x => `<li class="rule"><span class="ic">${I.info}</span><span><b>${esc(x.name)}</b>, ${esc(x.venue)}. ${esc(x.status)}.${src(x.source)}</span></li>`).join('');
      tb.insertAdjacentHTML('beforeend', `${ev ? `<h3 class="isle-h">Holiday pop-ups</h3><ul class="rules">${ev}</ul>` : ''}${closedList(t.closed)}`);
    }
  }
  const closedList = (list) => arr(list).length ? `<h3 class="isle-h">Closed, so don't plan on it</h3><ul class="rules">${arr(list).map(x => `<li class="rule"><span class="ic">${I.info}</span><span><b>${esc(x.name)}.</b> ${esc(x.note)}</span></li>`).join('')}</ul>` : '';

  function renderLuaus(l) {
    if (!l) return ['luau-list', 'holiday-list', 'adult-stays'].forEach(k => pending(k));
    renderPlaces('luau-list', l.cards['luau-list']);
    renderPlaces('holiday-list', l.cards['holiday-list']);
    renderPlaces('adult-stays', l.cards['adult-stays']);
    const hb = body('holiday-list'); if (hb) hb.insertAdjacentHTML('afterbegin', `<p class="check-first"><b>Check first</b> ${esc(l.holiday_note)}</p>`);
    const lb = body('luau-list'); if (lb) lb.insertAdjacentHTML('beforeend', closedList(l.closed));
  }
  function renderChristmas(x) {
    const ids = ['xmas-verdict', 'xmas-trips', 'xmas-eve', 'xmas-day', 'xmas-lights', 'xmas-open', 'xmas-calls'];
    if (!x) return ids.forEach(k => pending(k));
    const vb = body('xmas-verdict');
    if (vb) vb.innerHTML = `<ul class="rules">${arr(x.verdicts).map(v => `<li class="rule"><span class="badge badge--${v.verdict === 'go' ? 'go' : 'caution'}">${v.verdict === 'go' ? 'Go' : 'Quiet'}</span><span><b>${esc(v.display)}.</b> ${esc(v.text)}</span></li>`).join('')}</ul>${srcList(x.sources)}`;
    const pills = (d) => d && d.stops.length ? `<p class="day-stops">${d.stops.filter(id => P[id]).map(id => `<button class="link-pill stop" type="button" data-place="${esc(id)}">${esc(P[id].short || P[id].name)}</button>`).join('')}</p>` : '';
    const on = (i) => i === 'Big Island' ? 'the Big Island' : (ISL[i] || i);
    const where = (t) => !t.eve ? `Christmas Day on ${on(t.day)}.` : t.eve === t.day ? `Christmas Eve and Christmas Day on ${on(t.eve)}.` : `Christmas Eve on ${on(t.eve)}, Christmas Day on ${on(t.day)}.`;
    const tb = body('xmas-trips');
    if (tb) tb.innerHTML = `<ul class="xmas-trips">${arr(x.trips).map(t => `<li><b>${esc(t.name)}</b><span>${esc(where(t))} ${t.eve_day ? esc(t.eve_day.title) + '.' : ''} ${t.xmas_day ? esc(t.xmas_day.title) + '.' : ''}</span>${pills(t.eve_day)}${pills(t.xmas_day)}</li>`).join('')}</ul>`;
    ['xmas-eve', 'xmas-day', 'xmas-lights', 'xmas-open'].forEach(k => renderPlaces(k, x.cards[k]));
    const cb = body('xmas-calls'); if (cb) cb.innerHTML = `<ol class="xmas-calls">${arr(x.calls).map(c => `<li>${esc(c)}</li>`).join('')}</ol>`;
  }
  function renderMusic(m) {
    if (!m) return ['music-shows', 'music-rooms'].forEach(k => pending(k));
    const bd = body('music-shows');
    if (bd) bd.innerHTML = `<p class="check-first"><b>Surf and exotica</b> ${esc(m.surf_note)}</p>
      <ul class="tkt-list">${arr(m.shows).sort((a, b) => a.date.localeCompare(b.date)).map(s => `<li class="tkt"><div><h3>${esc(s.name)}</h3><p>${esc(longDate(s.date))} · ${esc(s.venue)}, ${esc(ISL[s.island] || s.island)}</p></div><div class="tkt-p">${esc(s.price)}${s.url ? `<br><a href="${esc(s.url)}" target="_blank" rel="noopener">Tickets</a>` : ''}</div></li>`).join('')}</ul>`;
    renderPlaces('music-rooms', m.cards['music-rooms']);
    const rb = body('music-rooms'); if (rb) rb.insertAdjacentHTML('beforeend', closedList(m.closed));
  }
  function renderFood(f) {
    ['food-fine', 'food-shrimp', 'food-poke', 'food-diners', 'food-markets'].forEach(k => f ? renderPlaces(k, f.cards[k]) : pending(k));
  }
  function renderNature(n) {
    if (!n) return ['nature-outlook', 'nature-volcano', 'nature-jungle', 'nature-lagoons'].forEach(k => pending(k));
    const ob = body('nature-outlook');
    if (ob) ob.innerHTML = `<ul class="rules">${arr(n.outlook).sort((a, b) => ISL_ORDER.indexOf(a.island) - ISL_ORDER.indexOf(b.island)).map(o => `<li class="rule"><span class="badge badge--${o.verdict === 'go' ? 'go' : 'caution'}">${o.verdict === 'go' ? 'Open' : 'Caution'}</span><span><b>${esc(ISL[o.island] || o.island)}.</b> ${esc(o.why)}</span></li>`).join('')}</ul>${closedList(n.closed)}`;
    ['nature-volcano', 'nature-jungle', 'nature-lagoons'].forEach(k => renderPlaces(k, n.cards[k]));
  }
  function renderGetting(g) {
    if (!g) return ['getting-flights', 'getting-boat', 'getting-stay'].forEach(k => pending(k));
    const rl = (list) => `<ul class="rules">${arr(list).map(x => `<li class="rule"><span class="ic">${I.info}</span><span><b>${esc(x.label)}.</b> ${esc(x.text)}${src(x.source)}</span></li>`).join('')}</ul>`;
    const fb = body('getting-flights'); if (fb) fb.innerHTML = rl(g.flights);
    const bb = body('getting-boat'); if (bb) bb.innerHTML = rl(g.boat);
    const sb = body('getting-stay'); if (sb) sb.innerHTML = `<dl class="hrs--wide">${arr(g.islands).map(x => `<dt>${esc(x.display)}</dt><dd><b>Car.</b> ${esc(x.car)}<br><b>Look in</b> ${esc(x.stay.join(', '))}.<br>${esc(x.budget)} ${esc(x.adr)}</dd>`).join('')}</dl>
      <p class="caption">${esc(g.rentals_note)}</p>
      <p class="caption"><b>Lahaina.</b> ${esc(g.lahaina)}${src(g.lahaina_source)}</p>`;
  }

  /* ---------- Boot ---------- */
  async function boot() {
    const wxP = WSP.weather.init();
    const names = ['trips', 'christmas', 'islands', 'tiki', 'luaus', 'music', 'food', 'nature', 'getting', 'places'];
    const d = Object.fromEntries(await Promise.all(names.map(async n => [n, await load(n)])));
    arr(d.places && d.places.places).forEach(p => { P[p.id] = p; byId[p.id] = p; });
    const locs = arr(d.places && d.places.pins).map(p => Object.assign({}, P[p.id] || {}, p));
    WSP.locations = locs;
    [() => renderTrips(d.trips), () => renderChristmas(d.christmas), () => renderIslands(d.islands, d.getting), () => renderTiki(d.tiki), () => renderLuaus(d.luaus),
     () => renderMusic(d.music), () => renderFood(d.food), () => renderNature(d.nature), () => renderGetting(d.getting)]
      .forEach(f => { try { f(); } catch (e) { console.warn('render', e); } });
    WSP.map.init(locs, 'all');
    WSP.shell.init(d);
    /* the note at the top is Snacks' to write */
    if (!d.updates) { const b = body('updates'); if (b) b.innerHTML = `<p class="needs-info"><b>Needs info.</b> Snacks' note to Crystal goes here, in his words.</p>`; }
    await wxP;
  }
  boot();
})();
