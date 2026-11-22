/* ---------- the colour popup ----------
   One picker shared by every colour wheel in ClassTools. Swatches rather than
   numbers: nobody needs an RGB code in the middle of a lesson. The six colours
   last reached for sit at the top, and they are the same six in every window.
   A page only has to load this file; the markup and styling come with it.      */
(function () {
  const CSS = `
#colPop{position:fixed;display:none;z-index:2147483000;padding:10px;border-radius:12px;background:#1f2430;
  box-shadow:0 10px 30px rgba(0,0,0,.45);width:214px;box-sizing:border-box}
#colPop.on{display:block}
#colPop .ttl{color:#9fb0cc;font:700 10.5px system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;margin:0 0 5px}
#colPop .row{display:grid;grid-template-columns:repeat(8,1fr);gap:5px;margin-bottom:9px}
#colPop .row:last-child{margin-bottom:0}
#colPop i{display:block;width:100%;aspect-ratio:1;border-radius:50%;cursor:pointer;border:2px solid rgba(255,255,255,.85);
  box-shadow:0 1px 3px rgba(0,0,0,.5);box-sizing:border-box}
#colPop i.on{outline:2.5px solid #22c55e;outline-offset:1px}
#colPop i.none{background:#fff;position:relative;overflow:hidden}
#colPop i.none:after{content:"";position:absolute;left:-20%;top:45%;width:140%;height:12%;background:#e23;transform:rotate(-45deg)}
#colPop .empty{color:#6b7689;font:600 11px system-ui,sans-serif;grid-column:1/-1}`;

  const PALETTE = [
    '#000000','#444c56','#8b949e','#c9d1d9','#ffffff','#7f1d1d','#9a3412','#713f12',
    '#dc2626','#ea580c','#f59e0b','#facc15','#84cc16','#16a34a','#0d9488','#06b6d4',
    '#2563eb','#1d4ed8','#4f46e5','#7c3aed','#a855f7','#d946ef','#ec4899','#f43f5e',
    '#fecaca','#fed7aa','#fef08a','#bbf7d0','#bfdbfe','#ddd6fe','#fbcfe8','#a16207'
  ];

  let RECENT = [], pop = null, onPick = null;

  if (window.cc && cc.coloursGet) {
    cc.coloursGet().then(l => { RECENT = l || []; paintRecentRow(); }).catch(() => {});
    cc.onColours && cc.onColours(l => { RECENT = l || []; paintRecentRow(); });
  }
  function recentColours() { return RECENT.slice(0, 6); }
  function rememberColour(c) {
    if (!c || !/^#[0-9a-f]{6}$/i.test(c)) return;
    RECENT = [c].concat(RECENT.filter(x => x.toLowerCase() !== c.toLowerCase())).slice(0, 6);
    if (window.cc && cc.colourUsed) cc.colourUsed(c);
  }

  function build() {
    if (pop) return pop;
    const st = document.createElement('style'); st.textContent = CSS;
    document.head.appendChild(st);
    pop = document.createElement('div'); pop.id = 'colPop';
    document.body.appendChild(pop);
    pop.addEventListener('click', e => {
      const i = e.target.closest('i[data-c]'); if (!i) return;
      const c = i.dataset.c;
      rememberColour(c);
      const fn = onPick; closeColourPop();
      if (fn) fn(c);
    });
    document.addEventListener('pointerdown', e => {
      if (pop.classList.contains('on') && !e.target.closest('#colPop') && !e.target.closest('[data-colpop]')) closeColourPop();
    }, true);
    return pop;
  }

  function paintRecentRow() {
    if (!pop || !pop.classList.contains('on')) return;
    const row = pop.querySelector('.recents'); if (!row) return;
    row.innerHTML = recentColours().length
      ? recentColours().map(c => `<i data-c="${c}" style="background:${c}"></i>`).join('')
      : '<span class="empty">Colours you use will collect here</span>';
  }

  /** Opens the picker beside `anchor`. `onPicked` gets the colour, or '' for no fill. */
  function openColourPop(anchor, current, onPicked, allowNone) {
    const p = build();
    onPick = onPicked;
    const recents = recentColours();
    const swatch = c => `<i data-c="${c}" style="background:${c}" class="${c.toLowerCase() === String(current || '').toLowerCase() ? 'on' : ''}"></i>`;
    p.innerHTML =
      (allowNone ? `<p class="ttl">Fill</p><div class="row"><i class="none${current ? '' : ' on'}" data-c="" title="No fill"></i></div>` : '') +
      `<p class="ttl">Recent</p><div class="row recents">` +
        (recents.length ? recents.map(swatch).join('') : '<span class="empty">Colours you use will collect here</span>') +
      `</div><p class="ttl">Colours</p><div class="row">` + PALETTE.map(swatch).join('') + '</div>';
    p.classList.add('on');
    const r = anchor.getBoundingClientRect(), pw = p.offsetWidth, ph = p.offsetHeight;
    // Beside a panel rather than on top of it, so you can still see what you are changing.
    const host = anchor.closest('#stylePop');
    let left, top;
    if (host) { const h = host.getBoundingClientRect(); left = h.right + 8; top = r.top - 8;
      if (left + pw > innerWidth - 6) left = h.left - pw - 8; }
    else { left = r.left; top = r.bottom + 6 + ph > innerHeight ? r.top - ph - 6 : r.bottom + 6; }
    p.style.left = Math.round(Math.max(6, Math.min(innerWidth - pw - 6, left))) + 'px';
    p.style.top = Math.round(Math.max(6, Math.min(innerHeight - ph - 6, top))) + 'px';
  }
  function closeColourPop() { if (pop) pop.classList.remove('on'); onPick = null; }

  window.openColourPop = openColourPop;
  window.closeColourPop = closeColourPop;
  window.recentColours = recentColours;
  window.rememberColour = rememberColour;
  window.COLOUR_PALETTE = PALETTE;
})();
