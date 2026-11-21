/* ClassCalc question bank – AQA GCSE Foundation
   Each topic has:  flu() -> {q,a}  (recall / fluency)   and   ps[] of () -> {q,a,d?}  (problem solving)
   q and a are HTML; d is an optional SVG diagram. Numbers are randomised on every call. */
(function () {
'use strict';
/* ---------------- helpers ---------------- */
const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const P = a => a[Math.floor(Math.random() * a.length)];
const SH = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
const lcm = (a, b) => a / gcd(a, b) * b;
const M = s => String(s).replace(/-/g, '−');
const C = v => M((+v).toLocaleString('en-GB', { maximumFractionDigits: 6 }));
const fx = (v, d) => M((+v).toFixed(d));
const r2 = v => Math.round(v * 100) / 100;
const GBP = v => Math.abs(v - Math.round(v)) < 1e-9 ? '£' + C(Math.round(v)) : '£' + M((+v).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const F = (n, d) => `<span class="fr"><span>${n}</span><span>${d}</span></span>`;
const FS = (n, d) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d) || 1; n /= g; d /= g; if (d === 1) return M(n); return (n < 0 ? '−' : '') + F(Math.abs(n), d); };
const MX = (n, d) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d) || 1; n /= g; d /= g; const s = n < 0 ? '−' : ''; n = Math.abs(n); if (d === 1) return s + n; const w = Math.floor(n / d), r = n % d; return s + (w ? w + ' ' : '') + F(r, d); };
const SUP = e => `<sup>${M(e)}</sup>`;
const br = v => v < 0 ? `(${M(v)})` : String(v);
const NAMES = ['Amir', 'Bea', 'Chloe', 'Dev', 'Ella', 'Femi', 'Grace', 'Harry', 'Isla', 'Jay', 'Kai', 'Leah', 'Maya', 'Noah', 'Omar', 'Priya', 'Ravi', 'Sam', 'Tom', 'Zara', 'Lucy', 'Ben', 'Aisha', 'Josh', 'Mo'];
const nm = () => P(NAMES);
const nm2 = () => { const s = SH(NAMES); return [s[0], s[1]]; };
const nm3 = () => SH(NAMES).slice(0, 3);
// algebra: a*x + b as text
const term = (c, v, first) => { if (c === 0) return ''; const s = c < 0 ? '−' : (first ? '' : '+'); const a = Math.abs(c); const body = v ? (a === 1 ? v : a + v) : String(a); return first ? (c < 0 ? '−' : '') + body : ` ${s} ${body}`; };
const lin = (a, b, v = 'x') => { let s = term(a, v, true); if (!s) return M(b); if (b) s += term(b, '', false); return s; };
const sumTerms = list => { let s = ''; for (const [c, v] of list) { if (!c) continue; s += term(c, v, !s); } return s || '0'; };
const pfHTML = n => { const out = []; for (let p = 2; p <= n; p++) { let c = 0; while (n % p === 0) { n /= p; c++; } if (c) out.push(p + (c > 1 ? SUP(c) : '')); } return out.join(' × '); };
const sf1 = v => { if (v === 0) return 0; const e = Math.floor(Math.log10(Math.abs(v))); const p = Math.pow(10, e); return Math.round(v / p) * p; };
const stdF = v => { const e = Math.floor(Math.log10(Math.abs(v))); let m = +(v / Math.pow(10, e)).toPrecision(4); let ee = e; if (Math.abs(m) >= 10) { m = +(m / 10).toPrecision(4); ee++; } return `${M(m)} × 10${SUP(ee)}`; };
const time = mins => { mins = ((mins % 1440) + 1440) % 1440; return String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0'); };
const list = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
const table = (head, rows) => `<table class="qt"><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;

/* ---------------- diagrams (SVG) ---------------- */
const SV = (w, h, body, pad) => {
  // The drawing fills the w by h box. pad is [left, top, right, bottom]: room outside it for the
  // labels, which hang off the edges of the shape. Keeping the pad to just what the labels need
  // means the shape itself is drawn as large as the space allows.
  const [l, t, r, b] = pad || [6, 6, 6, 6];
  return `<svg viewBox="${-l} ${-t} ${w + l + r} ${h + t + b}" xmlns="http://www.w3.org/2000/svg" font-family="Segoe UI,Arial,sans-serif" font-size="19" font-weight="700">${body}</svg>`;
};
const T = (x, y, s, a = 'middle') => `<text x="${x}" y="${y}" text-anchor="${a}">${s}</text>`;
const SW = 'stroke="#222" stroke-width="2.8"';
const D = {
  rect: (bottom, side) => SV(180, 106,
    `<rect x="0" y="0" width="180" height="106" fill="#eef4ff" ${SW}/>${T(90, 130, bottom)}${T(188, 59, side, 'start')}`,
    [4, 6, 64, 32]),

  rtri: (base, height, hyp, ang) => SV(170, 106,
    `<path d="M0 106 L170 106 L0 0 Z" fill="#fff4e6" ${SW}/><path d="M0 88h18v18" fill="none" stroke="#222" stroke-width="2"/>` +
    (ang ? `<path d="M142 106 A28 28 0 0 1 147.2 89.6" fill="none" stroke="#222" stroke-width="2.2"/>` : '') +
    `${T(74, 130, base)}${T(-8, 60, height, 'end')}${T(96, 42, hyp, 'start')}${ang ? T(156, 130, ang) : ''}`,
    [64, 4, 8, 32]),

  tri: (A, B, Cc) => SV(170, 106,
    `<path d="M0 106 L170 106 L80 0 Z" fill="#effaf1" ${SW}/>${T(44, 99, A)}${T(124, 99, B)}${T(80, 46, Cc)}`,
    [8, 8, 8, 8]),

  circle: (lab, type) => SV(120, 120,
    `<circle cx="60" cy="60" r="60" fill="#f3efff" ${SW}/><circle cx="60" cy="60" r="3.4" fill="#222"/>` +
    (type === 'r' ? `<line x1="60" y1="60" x2="120" y2="60" stroke="#222" stroke-width="2.4"/>${T(90, 51, lab)}`
                  : `<line x1="0" y1="60" x2="120" y2="60" stroke="#222" stroke-width="2.4"/>${T(60, 51, lab)}`),
    [6, 6, 6, 6]),

  cuboid: (l, w, h) => SV(180, 110,
    `<g transform="translate(-24,-22) scale(1.2,1.1)"><path d="M20 50 L130 50 L130 120 L20 120 Z" fill="#eef4ff" ${SW}/>` +
    `<path d="M20 50 L60 20 L170 20 L130 50 M130 120 L170 90 L170 20" fill="#dde8ff" ${SW}/>` +
    `<path d="M130 50 L170 20 L170 90 L130 120Z" fill="#cfdcfb" ${SW}/></g>` +
    `${T(66, 134, l)}${T(184, 98, w, 'start')}${T(-8, 70, h, 'end')}`,
    [66, 6, 62, 34]),

  lshape: (W, H, cw, ch, lab) => {
    const s = Math.min(170 / W, 106 / H), X = v => v * s, Y = v => v * s;
    const path = `M${X(0)} ${Y(0)} H${X(W - cw)} V${Y(ch)} H${X(W)} V${Y(H)} H${X(0)} Z`;
    return SV(X(W), Y(H), `<path d="${path}" fill="#effaf1" ${SW}/>` +
      T(X(W - cw) / 2, -9, lab.top) + T(-8, Y(H) / 2 + 6, lab.left, 'end') + T(X(W) / 2, Y(H) + 26, lab.bottom) +
      T(X(W) + 8, (Y(ch) + Y(H)) / 2 + 6, lab.right, 'start') + T((X(W - cw) + X(W)) / 2, Y(ch) - 9, lab.inH || '') +
      T(X(W - cw) + 8, Y(ch) / 2 + 6, lab.inV || '', 'start'),
      [32, 32, 26, 34]);
  },

  parallel: (posA, labA, posB, labB) => {
    const pt = { tr: [18, -12], tl: [-30, -12], br: [16, 26], bl: [-30, 26] };
    const lab = (cx, cy, pos, s) => s ? T(cx + pt[pos][0], cy + pt[pos][1], s) : '';
    return SV(180, 110,
      `<line x1="0" y1="24" x2="180" y2="24" ${SW}/><line x1="0" y1="86" x2="180" y2="86" ${SW}/>` +
      `<path d="M164 17l9 7-9 7M164 79l9 7-9 7" fill="none" stroke="#222" stroke-width="2.4"/>` +
      `<line x1="46" y1="110" x2="134" y2="0" ${SW}/>` + lab(112, 24, posA, labA) + lab(70, 86, posB, labB),
      [8, 8, 12, 8]);
  },

  isos: (top, base) => SV(170, 106,
    `<path d="M0 106 L170 106 L85 0 Z" fill="#fff4e6" ${SW}/>` +
    `<path d="M36 58l10 5M134 58l-10 5" stroke="#222" stroke-width="2.4"/>` +
    `${T(85, 44, top)}${T(46, 99, base)}`,
    [8, 8, 8, 10]),
};

/* ---------------- topics ---------------- */
const TOPICS = [];
const add = (id, name, strand, keys, flu, ps) => TOPICS.push({ id, name, strand, keys, flu, ps });

/* ===== NUMBER ===== */
add('place', 'Place value & ordering numbers', 'Number', ['place value', 'ordering', 'order decimals', 'compare', 'digits', 'value of a digit'],
  () => P([
    () => { const a = R(2, 8); const v = SH([`0.${a}`, `0.${a}${R(1, 9)}`, `0.0${a}`, `0.${a - 1}${R(5, 9)}`, `0.${a}0${R(1, 9)}`]).slice(0, 4);
      return { q: `Write in order, smallest first:<br><b>${v.join(', &nbsp; ')}</b>`, a: v.slice().sort((x, y) => x - y).join(', ') }; },
    () => { const s = String(R(1000, 9999)) + '.' + R(100, 999); const pv = ['thousands', 'hundreds', 'tens', 'ones', '', 'tenths', 'hundredths', 'thousandths'];
      const val = [1000, 100, 10, 1, 0, 0.1, 0.01, 0.001]; let i; do { i = R(0, 7); } while (i === 4 || s[i] === '0');
      return { q: `What is the value of the underlined digit?<br><b>${s.slice(0, i)}<u>${s[i]}</u>${s.slice(i + 1)}</b>`, a: `${s[i]} ${pv[i]} (${C(+s[i] * val[i])})` }; }
  ])(),
  [
    () => { let ds; do { ds = SH([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4); } while (!ds.some(d => d % 2 === 0) || !ds.some(d => d % 2 === 1));
      let big = -1, small = Infinity;
      for (const e of ds.filter(d => d % 2 === 0)) { const r = ds.filter(d => d !== e).sort((a, b) => b - a); if (r[0] === 0) continue; big = Math.max(big, +(r.join('') + e)); }
      for (const o of ds.filter(d => d % 2 === 1)) { const r = ds.filter(d => d !== o).sort((a, b) => a - b); if (r[0] === 0) { const k = r.findIndex(d => d > 0); [r[0], r[k]] = [r[k], r[0]]; } small = Math.min(small, +(r.join('') + o)); }
      return { q: `Using each of the digits <b>${ds.join(', ')}</b> exactly once, make<br>(a) the <b>largest even</b> number<br>(b) the <b>smallest odd</b> number.`, a: `(a) ${C(big)} &nbsp; (b) ${C(small)}` }; },
    () => { const d = R(3, 9), x = R(1, d - 1), y = R(1, 9), n = nm();
      return { q: `${n} says <b>0.${x}${y}</b> is bigger than <b>0.${d}</b> because ${x}${y} is bigger than ${d}.<br>Is ${n} correct? Explain.`, a: `No. 0.${d} = 0.${d}0, which is bigger than 0.${x}${y}.` }; },
    () => { const a = R(1, 9) + R(1, 8) / 10, b = +(a + 0.1).toFixed(1);
      return { q: `Write down a number between <b>${a.toFixed(1)}</b> and <b>${b.toFixed(1)}</b> that rounds to <b>${b.toFixed(1)}</b> to 1 decimal place. What is the smallest such number?`, a: `Any number from ${(a + 0.05).toFixed(2)} up to ${b.toFixed(1)}, e.g. ${(a + 0.07).toFixed(2)}. Smallest: ${(a + 0.05).toFixed(2)}` }; },
    () => { const v = SH([R(2, 9) * 1000 + R(0, 9) * 100, R(2, 9) * 1000 + R(0, 9) * 10, R(20, 99) * 100 + R(1, 9)]), [n1] = nm2();
      const tot = v[0] + v[1] + v[2];
      return { q: `Three schools raised <b>£${C(v[0])}</b>, <b>£${C(v[1])}</b> and <b>£${C(v[2])}</b>. ${n1} says the total is more than £${C(Math.round(tot / 1000) * 1000 + 1000)}. Is ${n1} right? Show how you decide.`, a: `Total £${C(tot)} – so no.` }; },
  ]);

add('neg', 'Negative numbers', 'Number', ['negative numbers', 'directed numbers', 'negatives', 'temperature', 'minus numbers'],
  () => { let a = R(-12, 12) || 5, b = R(-12, -1); const op = P(['+', '−', '×', '÷']); let ans;
    if (op === '+') ans = a + b; else if (op === '−') ans = a - b; else if (op === '×') ans = a * b; else { const k = R(-9, 9) || 3; a = b * k; ans = k; }
    return { q: `Work out <b>${br(a)} ${op} ${br(b)}</b>`, a: M(ans) }; },
  [
    () => { const t0 = R(-9, -1), up = R(5, 15), dn = R(8, 20);
      return { q: `At 6am the temperature was <b>${M(t0)}°C</b>. By midday it had risen by <b>${up}°C</b>. By midnight it had fallen by <b>${dn}°C</b> from the midday temperature.<br>What was the temperature at midnight?`, a: `${M(t0 + up - dn)}°C` }; },
    () => { let p, q; do { p = R(2, 9); q = -R(2, 9); } while (p === -q);
      return { q: `Two whole numbers multiply to make <b>${M(p * q)}</b> and add to make <b>${M(p + q)}</b>.<br>What are the two numbers?`, a: `${p} and ${M(q)}` }; },
    () => { const b = -(R(2, 9) * 10 + 5), i = R(6, 15) * 10, o = R(40, 180), n = nm();
      return { q: `${n}'s bank balance is <b>${GBP(b).replace('£−', '−£')}</b>. ${n} pays in <b>£${i}</b> then spends <b>£${o}</b>.<br>What is the balance now? Is the account overdrawn?`, a: `${(b + i - o < 0 ? '−£' + Math.abs(b + i - o) : '£' + (b + i - o))} – ${b + i - o < 0 ? 'yes, overdrawn' : 'not overdrawn'}` }; },
    () => { const s = R(-3, 4), a = R(4, 8), b = R(2, 6), c = R(5, 9);
      const end = s - a + b - c;
      return { q: `A lift starts at floor <b>${M(s)}</b> (ground floor = 0).<br>It goes down ${a} floors, up ${b} floors, then down ${c} floors.<br>Which floor does it finish on? How many floors is that below the start?`, a: `Floor ${M(end)}; ${s - end} floors below` }; },
  ]);

add('addsub', 'Addition & subtraction', 'Number', ['adding', 'addition', 'subtraction', 'subtract', 'column method', 'written methods', 'change'],
  () => { const a = R(1000, 9999), b = R(100, 999); return P([{ q: `Work out <b>${C(a)} + ${b}</b>`, a: C(a + b) }, { q: `Work out <b>${C(a)} − ${b}</b>`, a: C(a - b) }]); },
  [
    () => { const p1 = R(15, 45) + P([0.99, 0.49, 0.5, 0]), p2 = R(10, 35) + P([0.99, 0.25, 0.75, 0]), n = nm(), pay = p1 + p2 < 50 ? 50 : 100;
      return { q: `${n} buys a jumper for <b>${GBP(p1)}</b> and jeans for <b>${GBP(p2)}</b>. ${n} pays with a <b>£${pay}</b> note.<br>How much change should ${n} get?`, a: GBP(r2(pay - p1 - p2)) }; },
    () => { let a, b, s; do { a = R(100, 499); b = R(100, 499); s = a + b; } while (s > 999 || String(a)[1] === '0');
      const A = String(a), B = String(b), S = String(s), box = '<span class="bx"></span>';
      return { q: `Fill in the missing digits:<br><b style="font-size:1.25em">${A[0]}${box}${A[2]} + ${box}${B[1]}${B[2]} = ${S[0]}${S[1]}${box}</b>`, a: `${a} + ${b} = ${s}` }; },
    () => { let n, b; do { n = R(1100, 1500); b = R(450, 700); } while (n - b <= b);
      return { q: `A school has <b>${C(n)}</b> students. <b>${b}</b> of them are boys.<br>How many more girls than boys are there?`, a: `${C(n - b)} girls, so ${C(n - 2 * b)} more girls` }; },
    () => { const start = R(23000, 48000), trips = [R(120, 480), R(120, 480), R(120, 480)];
      return { q: `A car's mileage reads <b>${C(start)}</b>. It does three trips of <b>${trips.join('</b>, <b>')}</b> miles.<br>What does the mileage read now? How far until it reaches ${C(Math.ceil((start + 1500) / 10000) * 10000)}?`,
        a: `${C(start + trips[0] + trips[1] + trips[2])}; ${C(Math.ceil((start + 1500) / 10000) * 10000 - start - trips[0] - trips[1] - trips[2])} miles` }; },
  ]);

add('muldiv', 'Multiplication & division', 'Number', ['multiplication', 'multiply', 'long multiplication', 'division', 'divide', 'long division', 'short division', 'times'],
  () => P([() => { const a = R(100, 999), b = R(12, 79); return { q: `Work out <b>${a} × ${b}</b>`, a: C(a * b) }; },
    () => { const c = R(3, 9), q = R(120, 999); return { q: `Work out <b>${C(c * q)} ÷ ${c}</b>`, a: C(q) }; }])(),
  [
    () => { const cap = P([12, 14, 16, 15, 52]), st = R(150, 400), v = P(['minibuses', 'coaches']);
      return { q: `Each ${v.slice(0, -1).replace('coache', 'coach')} holds <b>${cap}</b> people. <b>${st}</b> students and <b>${R(8, 14)}</b> teachers are going on a trip.<br>How many ${v} are needed?`, a: '' , _f: (q) => q }; },
    () => { const pr = R(12, 29), bud = R(300, 800);
      return { q: `Tickets cost <b>£${pr}</b> each. A club has <b>£${bud}</b>.<br>What is the greatest number of tickets they can buy, and how much money is left over?`, a: `${Math.floor(bud / pr)} tickets, £${bud % pr} left` }; },
    () => { const bx = P([6, 12]), e = R(500, 1200);
      return { q: `Eggs are packed in boxes of <b>${bx}</b>. A farm collects <b>${C(e)}</b> eggs.<br>How many full boxes can be filled? How many eggs are left over?`, a: `${Math.floor(e / bx)} boxes, ${e % bx} left over` }; },
    () => { const w = R(18, 35), d = 5, h = R(6, 8), pay = w * h * d;
      return { q: `${nm()} earns <b>£${w}</b> per hour and works <b>${h}</b> hours a day, <b>${d}</b> days a week.<br>How much is that per week? How many weeks to earn at least £${C(Math.round(pay * 3.4 / 100) * 100)}?`, a: `£${C(pay)} per week; ${Math.ceil(Math.round(pay * 3.4 / 100) * 100 / pay)} weeks` }; },
  ]);
// fix minibus answer (needs total)
TOPICS[TOPICS.length - 1].ps[0] = () => { const cap = P([12, 14, 16, 15]), st = R(150, 400), t = R(8, 14);
  return { q: `Each minibus holds <b>${cap}</b> people. <b>${st}</b> students and <b>${t}</b> teachers are going on a trip.<br>How many minibuses are needed? How many empty seats will there be?`, a: `${Math.ceil((st + t) / cap)} minibuses; ${Math.ceil((st + t) / cap) * cap - st - t} empty seats` }; };

add('bidmas', 'Order of operations (BIDMAS)', 'Number', ['order of operations', 'bidmas', 'bodmas', 'brackets', 'priority of operations'],
  () => { const a = R(2, 12), b = R(2, 9), c = R(2, 9);
    return P([{ q: `<b>${a} + ${b} × ${c}</b>`, a: a + b * c }, { q: `<b>(${a} + ${b}) × ${c}</b>`, a: (a + b) * c }, { q: `<b>${a}² − ${b} × ${c}</b>`, a: M(a * a - b * c) }, { q: `<b>${b * c} ÷ ${b} + ${a} × 2</b>`, a: c + a * 2 }]); },
  [
    () => { for (;;) { const a = R(2, 9), b = R(2, 9), c = R(3, 9), d = R(1, c - 1); const plain = a + b * c - d;
        const f = SH([[`(${a} + ${b}) × ${c} − ${d}`, (a + b) * c - d], [`${a} + ${b} × (${c} − ${d})`, a + b * (c - d)]])[0];
        if (f[1] !== plain) return { q: `Put <b>one pair of brackets</b> in to make this correct:<br><b style="font-size:1.2em">${a} + ${b} × ${c} − ${d} = ${f[1]}</b>`, a: f[0] + ' = ' + f[1] }; } },
    () => { let a, b; do { a = R(15, 40); b = R(2, 9) * 2; } while ((a - b) % 2); const n = nm();
      return { q: `${n} says <b>${a} − ${b} ÷ 2 = ${(a - b) / 2}</b>.<br>Explain ${n}'s mistake and give the correct answer.`, a: `Divide first: ${b} ÷ 2 = ${b / 2}, so ${a} − ${b / 2} = ${a - b / 2}` }; },
    () => { const ns = SH([2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3); let best = -1, ex = '';
      const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
      for (const [i, j, k] of perms) { const [x, y, z] = [ns[i], ns[j], ns[k]]; if ((x + y) * z > best) { best = (x + y) * z; ex = `(${x} + ${y}) × ${z}`; } if (x * y + z > best) { best = x * y + z; ex = `${x} × ${y} + ${z}`; } }
      return { q: `Use the numbers <b>${ns.join(', ')}</b> once each, with one <b>+</b>, one <b>×</b> and brackets if you like.<br>What is the <b>largest</b> answer you can make?`, a: `${ex} = ${best}` }; },
  ]);

add('factors', 'Factors, multiples & primes', 'Number', ['factors', 'multiples', 'prime numbers', 'primes', 'factor pairs'],
  () => P([() => { const n = P([12, 18, 20, 24, 28, 30, 32, 36, 40, 42, 45, 48, 50, 60]); const f = []; for (let i = 1; i <= n; i++) if (n % i === 0) f.push(i); return { q: `List all the factors of <b>${n}</b>`, a: f.join(', ') }; },
    () => { const k = R(3, 12); return { q: `Write down the first five multiples of <b>${k}</b>`, a: [1, 2, 3, 4, 5].map(i => i * k).join(', ') }; },
    () => { const ns = SH([2, 9, 11, 15, 17, 21, 23, 27, 29, 31, 33, 37, 39, 41, 49, 51]).slice(0, 6); const pr = n => { for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return n > 1; };
      return { q: `Which of these are prime?<br><b>${ns.join(', ')}</b>`, a: ns.filter(pr).join(', ') || 'none' }; }])(),
  [
    () => { for (;;) { const [a, b] = SH([2, 3, 4, 5, 6, 9]).slice(0, 2), L = lcm(a, b), c = R(50, 99); const m = []; for (let x = L; x < c; x += L) if (x >= 10) m.push(x);
        if (m.length >= 1 && m.length <= 4) return { q: `I am a two-digit number.<br>I am a multiple of <b>${a}</b> and a multiple of <b>${b}</b>.<br>I am less than <b>${c}</b>. What number could I be? Find all the possibilities.`, a: m.join(', ') }; } },
    () => { const [s, a] = P([['All odd numbers are prime.', 'e.g. 9 = 3 × 3 (also 15, 21, 25…)'], ['All prime numbers are odd.', '2 is prime and even'], ['Two prime numbers always add to make an even number.', 'e.g. 2 + 3 = 5'], ['A number can only have an even number of factors.', 'Square numbers, e.g. 16 has 5 factors: 1, 2, 4, 8, 16']]);
      return { q: `${nm()} says: <i>“${s}”</i><br>Give an example to show this is wrong.`, a }; },
    () => { const n = P([24, 36, 48, 30, 60, 40, 72]); const pr = []; for (let r = 2; r < n; r++) if (n % r === 0 && n / r > 1) pr.push(`${r}×${n / r}`);
      return { q: `A teacher arranges <b>${n}</b> chairs in equal rows. There must be more than one row and more than one chair in each row.<br>How many different arrangements are possible?`, a: `${pr.length}: ${pr.join(', ')}` }; },
  ]);

add('hcflcm', 'HCF & LCM', 'Number', ['hcf', 'lcm', 'highest common factor', 'lowest common multiple', 'common factor', 'common multiple'],
  () => { let a, b; do { const g = R(2, 9); a = g * R(2, 7); b = g * R(2, 7); } while (a === b); return { q: `Find the HCF and LCM of <b>${a}</b> and <b>${b}</b>`, a: `HCF ${gcd(a, b)}, LCM ${lcm(a, b)}` }; },
  [
    () => { let a, b; do { a = P([6, 8, 10, 12, 15, 20]); b = P([6, 8, 9, 12, 15, 18, 20]); } while (a === b || lcm(a, b) > 180); const st = R(7, 9) * 60;
      return { q: `Two buses leave the station together at <b>${time(st)}</b>. One leaves every <b>${a}</b> minutes, the other every <b>${b}</b> minutes.<br>When do they next leave together?`, a: `${time(st + lcm(a, b))} (LCM = ${lcm(a, b)} min)` }; },
    () => { let a, b; do { a = P([6, 8, 10, 12]); b = P([4, 6, 8, 10, 12]); } while (a === b); const L = lcm(a, b);
      return { q: `Hot dogs come in packs of <b>${a}</b>. Buns come in packs of <b>${b}</b>.<br>What is the smallest number of each pack to buy so there are exactly the same number of hot dogs and buns?`, a: `${L / a} packs of hot dogs, ${L / b} packs of buns (${L} of each)` }; },
    () => { let p, q; do { const g = R(3, 12); p = g * R(2, 6); q = g * R(2, 6); } while (p === q); const h = gcd(p, q);
      return { q: `A florist has <b>${p}</b> roses and <b>${q}</b> tulips. She makes identical bunches using all the flowers.<br>What is the greatest number of bunches she can make? What is in each bunch?`, a: `${h} bunches, each with ${p / h} roses and ${q / h} tulips` }; },
  ]);

add('primefact', 'Prime factorisation', 'Number', ['prime factors', 'product of primes', 'factor tree', 'prime factorisation', 'prime factor decomposition'],
  () => { let n; do { n = Math.pow(2, R(1, 4)) * Math.pow(3, R(0, 2)) * Math.pow(5, R(0, 1)) * Math.pow(7, R(0, 1)); } while (n < 40 || n > 1000); return { q: `Write <b>${n}</b> as a product of its prime factors.`, a: pfHTML(n) }; },
  [
    () => { const A = Math.pow(2, R(1, 4)) * Math.pow(3, R(1, 2)) * 5, B = Math.pow(2, R(1, 3)) * Math.pow(3, R(1, 3)) * 7;
      return { q: `<b>A = ${pfHTML(A)}</b><br><b>B = ${pfHTML(B)}</b><br>Find the HCF and the LCM of A and B. Give your answers as products of primes.`, a: `HCF = ${pfHTML(gcd(A, B))} = ${gcd(A, B)}; LCM = ${pfHTML(lcm(A, B))} = ${C(lcm(A, B))}` }; },
    () => { let a, b; do { a = R(1, 5); b = R(1, 3); } while (a % 2 === 0 && b % 2 === 0); const N = Math.pow(2, a) * Math.pow(3, b), m = Math.pow(2, a % 2) * Math.pow(3, b % 2);
      return { q: `<b>N = 2${SUP(a)} × 3${SUP(b)}</b><br>(a) Work out the value of N.<br>(b) What is the smallest whole number you could multiply N by to make a square number?`, a: `(a) ${N} (b) ${m} → ${N * m} = ${Math.sqrt(N * m)}²` }; },
    () => { const n = P([360, 180, 240, 600, 450, 168]); const dbl = pfHTML(n).replace(/(\d+)(<sup>(\d+)<\/sup>)?/g, (m, p, s, e) => p + SUP((e ? +e : 1) * 2));
      return { q: `Write <b>${n}</b> as a product of prime factors.<br>Hence write <b>${n}²</b> as a product of prime factors.`, a: `${n} = ${pfHTML(n)}; ${n}² = ${dbl}` }; },
  ]);

add('powers', 'Powers & roots', 'Number', ['squares', 'cubes', 'square numbers', 'square roots', 'cube roots', 'powers', 'roots', 'squared', 'cubed'],
  () => P([() => { const a = R(2, 15); return { q: `<b>${a}²</b>`, a: a * a }; }, () => { const a = R(2, 15); return { q: `<b>√${a * a}</b>`, a }; },
    () => { const a = R(2, 6); return { q: `<b>${a}³</b>`, a: a * a * a }; }, () => { const a = R(2, 6); return { q: `<b>∛${a * a * a}</b>`, a }; }])(),
  [
    () => { const a = R(1, 8), b = R(a + 1, 12); return { q: `Find two square numbers that add up to <b>${a * a + b * b}</b>.`, a: `${a * a} + ${b * b} (${a}² + ${b}²)` }; },
    () => { const [p, q] = P([[2, 5], [3, 4], [2, 6], [4, 3], [3, 5], [2, 7]]), x = Math.pow(p, q), y = Math.pow(q, p);
      return { q: `Which is bigger, <b>${p}${SUP(q)}</b> or <b>${q}${SUP(p)}</b>? Show your working.`, a: `${p}${SUP(q)} = ${x}, ${q}${SUP(p)} = ${y}, so ${x > y ? p + SUP(q) : q + SUP(p)} is bigger` }; },
    () => { const s = R(4, 15); return { q: `A square has an area of <b>${s * s} cm²</b>.<br>What is its perimeter?`, a: `side ${s} cm, perimeter ${4 * s} cm` }; },
    () => { const s = R(2, 9); return { q: `A cube has a volume of <b>${s * s * s} cm³</b>.<br>Find the length of one edge and the total surface area.`, a: `edge ${s} cm, surface area ${6 * s * s} cm²` }; },
  ]);

add('rounding', 'Rounding & error intervals', 'Number', ['rounding', 'round', 'decimal places', 'significant figures', 'nearest', 'error intervals', 'bounds', 'dp', 'sf'],
  () => P([() => { const v = R(1, 99) + R(1, 9999) / 10000, d = R(1, 2); return { q: `Round <b>${v.toFixed(4)}</b> to ${d} decimal place${d > 1 ? 's' : ''}`, a: v.toFixed(d) }; },
    () => { const v = R(1000, 99999); const s = R(1, 2); return { q: `Round <b>${C(v)}</b> to ${s} significant figure${s > 1 ? 's' : ''}`, a: C(+v.toPrecision(s)) }; },
    () => { const v = R(1, 9) / 1000 + R(1, 99) / 100000; return { q: `Round <b>${v.toFixed(5)}</b> to 1 significant figure`, a: (+v.toPrecision(1)).toString() }; }])(),
  [
    () => { const X = R(3, 99) * 10; return { q: `A whole number rounded to the nearest 10 is <b>${X}</b>.<br>What is the smallest it could be? What is the largest?`, a: `smallest ${X - 5}, largest ${X + 4}` }; },
    () => { const I = R(2, 9), d3 = R(5, 9), d4 = R(1, 9), x = `${I}.04${d3}${d4}`, n = nm();
      return { q: `${n} rounds <b>${x}</b> to 2 decimal places and writes <b>${I}.5</b>.<br>Explain the mistake and give the correct answer.`, a: `2 d.p. means hundredths: ${I}.05` }; },
    () => { const h = (R(14, 19) / 10), n = nm();
      return { q: `${n}'s height is <b>${h.toFixed(1)} m</b>, correct to 1 decimal place.<br>Write down the error interval for ${n}'s height.`, a: `${(h - 0.05).toFixed(2)} ≤ h < ${(h + 0.05).toFixed(2)}` }; },
    () => { const m = R(3, 9) * 100, n = R(5, 12);
      return { q: `A lift can carry <b>${m} kg</b> (to the nearest 100 kg). ${n} people each weigh <b>80 kg</b> to the nearest 10 kg.<br>Can you be certain the lift is safe? Explain using bounds.`, a: `Max people mass ${n} × 85 = ${n * 85} kg; lift lower bound ${m - 50} kg → ${n * 85 <= m - 50 ? 'yes, certain' : 'no, not certain'}` }; },
  ]);

add('estimation', 'Estimation', 'Number', ['estimate', 'estimation', 'approximate', 'approximation', 'round to estimate'],
  () => { const a = R(11, 99) + R(1, 9) / 10, b = R(2, 9) + R(1, 99) / 100; return { q: `Estimate <b>${a.toFixed(1)} × ${b.toFixed(2)}</b>`, a: `${C(sf1(a))} × ${C(sf1(b))} = ${C(sf1(a) * sf1(b))}` }; },
  [
    () => { const n = R(17, 19), T = P([20, 30, 40, 50]), p = T - R(1, 4) - 0.05;
      return { q: `Tickets cost <b>${GBP(p)}</b> each. A class buys <b>${n}</b> tickets.<br>Estimate the total cost. Is your estimate an overestimate or an underestimate? Why?`, a: `20 × £${T} = £${20 * T}; overestimate (both numbers rounded up)` }; },
    () => { const l = R(3, 7) + P([0.2, 0.25, 0.3, 0.4]), w = R(3, 6) + P([0.6, 0.75, 0.8, 0.85]), c = P([14.99, 19.99, 24.99, 29.99]);
      return { q: `A room is <b>${l} m</b> by <b>${w} m</b>. Carpet costs <b>${GBP(c)}</b> per m².<br>Estimate the cost of carpeting the room.`, a: `${sf1(l)} × ${sf1(w)} × £${sf1(c)} ≈ £${C(sf1(l) * sf1(w) * sf1(c))}` }; },
    () => { const a = R(19, 51) + R(1, 9) / 10, b = R(2, 9) + R(1, 9) / 10, c = P([1.9, 2.1, 4.8, 5.2, 9.7, 10.3]);
      return { q: `Estimate the value of<br><span style="font-size:1.25em">${F(`${a.toFixed(1)} × ${b.toFixed(1)}`, c)}</span><br>Show your rounding.`, a: `${F(`${sf1(a)} × ${sf1(b)}`, sf1(c))} = ${C(+(sf1(a) * sf1(b) / sf1(c)).toFixed(2))}` }; },
  ]);

/* ===== FRACTIONS, DECIMALS, PERCENTAGES ===== */
const NICE_FR = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5], [4, 5], [5, 6], [3, 8], [5, 8], [7, 10], [3, 10], [5, 12], [7, 12]];
add('simpfrac', 'Equivalent & simplifying fractions', 'Number', ['simplify fractions', 'equivalent fractions', 'simplest form', 'cancel fractions', 'ordering fractions', 'fractions'],
  () => { let a, b; do { a = R(1, 8); b = R(a + 1, 12); } while (gcd(a, b) > 1); const k = R(2, 9); return { q: `Write <b>${F(a * k, b * k)}</b> in its simplest form`, a: F(a, b) }; },
  [
    () => { const [a, b] = P([[2, 3], [3, 4], [2, 5], [3, 5], [4, 7], [5, 6]]), ks = SH([2, 3, 4, 5, 6, 7]).slice(0, 4);
      const opts = ks.map((k, i) => i === 3 ? [a * k + 1, b * k] : [a * k, b * k]); const wrong = opts[3];
      return { q: `Which of these fractions is <b>not</b> equivalent to ${F(a, b)}?<br>${SH(opts).map(([n, d]) => F(n, d)).join(' &nbsp; ')}<br>Explain how you know.`, a: `${F(wrong[0], wrong[1])} (the others all simplify to ${F(a, b)})` }; },
    () => { const t = P([8, 10, 12, 15, 16, 20]); let e; do { e = R(2, t - 2); } while (gcd(t - e, t) === 1); const n = nm();
      return { q: `A cake is cut into <b>${t}</b> equal slices. ${n} eats <b>${e}</b> slices.<br>What fraction of the cake is left? Give your answer in its simplest form.`, a: FS(t - e, t) }; },
    () => { const fr = SH(NICE_FR).slice(0, 4).filter((x, i, A) => A.findIndex(y => y[0] / y[1] === x[0] / x[1]) === i);
      return { q: `Write these fractions in order, smallest first:<br>${SH(fr).map(([n, d]) => F(n, d)).join(' &nbsp; ')}`, a: fr.slice().sort((x, y) => x[0] / x[1] - y[0] / y[1]).map(([n, d]) => F(n, d)).join(', ') }; },
  ]);

const fpair = () => { let a, b, c, d; do { b = R(2, 10); d = R(2, 12); a = R(1, b - 1); c = R(1, d - 1); } while (b === d || gcd(a, b) > 1 || gcd(c, d) > 1); return [a, b, c, d]; };
add('addfrac', 'Adding & subtracting fractions', 'Number', ['adding fractions', 'subtracting fractions', 'add fractions', 'subtract fractions', 'fractions', 'common denominator'],
  () => { const [a, b, c, d] = fpair(); if (P([0, 1]) && a / b > c / d) return { q: `<b>${F(a, b)} − ${F(c, d)}</b>`, a: FS(a * d - c * b, b * d) }; return { q: `<b>${F(a, b)} + ${F(c, d)}</b>`, a: MX(a * d + c * b, b * d) }; },
  [
    () => { let b1, b2; do { b1 = R(2, 6); b2 = R(2, 8); } while (b1 === b2 || 1 / b1 + 1 / b2 >= 1); const L = lcm(b1, b2), X = L * R(3, 12), n = nm();
      return { q: `${n} spends ${F(1, b1)} of their money on clothes and ${F(1, b2)} on food.<br>(a) What fraction of their money is left?<br>(b) They started with <b>£${X}</b>. How much is left?`, a: `(a) ${FS(L - L / b1 - L / b2, L)} (b) £${X - X / b1 - X / b2}` }; },
    () => { let a, b, c, d; do { [a, b, c, d] = fpair(); } while (a / b === c / d); if (a / b > c / d) [a, b, c, d] = [c, d, a, b];
      return { q: `A recipe uses ${F(a, b)} kg of flour and ${F(c, d)} kg of sugar.<br>How much more sugar than flour is used? How much is used altogether?`, a: `${FS(c * b - a * d, b * d)} kg more; ${MX(a * d + c * b, b * d)} kg altogether` }; },
    () => { let a, b, c, d; do { [a, b, c, d] = fpair(); } while (a * d + c * b >= b * d); const s = [a * d + c * b, b * d]; const g = gcd(s[0], s[1]);
      return { q: `Find the missing fraction:<br><b style="font-size:1.2em">${F(a, b)} + <span class="bx"></span> = ${F(s[0] / g, s[1] / g)}</b>`, a: FS(c, d) }; },
    () => { const [n1, n2, n3] = nm3(); let a, b; do { a = R(1, 3); b = R(1, 5); } while (a / 4 + b / 8 >= 1 || b === 2 * a); const rest = 8 - 2 * a - b;
      const sh = [[n1, 2 * a], [n2, b], [n3, rest]].sort((x, y) => y[1] - x[1]);
      return { q: `${n1}, ${n2} and ${n3} share a pizza. ${n1} eats ${FS(a, 4)}, ${n2} eats ${F(b, 8)} and ${n3} eats the rest.<br>Who eats the most? Show your working.`, a: `${n3} eats ${FS(rest, 8)}; most: ${sh[0][1] === sh[1][1] ? sh[0][0] + ' and ' + sh[1][0] + ' (equal)' : sh[0][0]}` }; },
  ]);

add('muldivfrac', 'Multiplying & dividing fractions', 'Number', ['multiplying fractions', 'dividing fractions', 'multiply fractions', 'divide fractions', 'fractions', 'reciprocal'],
  () => { const [a, b, c, d] = fpair(); return P([{ q: `<b>${F(a, b)} × ${F(c, d)}</b>`, a: FS(a * c, b * d) }, { q: `<b>${F(a, b)} ÷ ${F(c, d)}</b>`, a: MX(a * d, b * c) }]); },
  [
    () => { for (;;) { const W = R(2, 9), b = R(2, 5), a = R(1, b - 1); if (gcd(a, b) === 1 && (W * b) % a === 0) return { q: `How many ${F(a, b)} litre bottles can be filled from <b>${W} litres</b> of juice?`, a: `${W} ÷ ${F(a, b)} = ${W * b / a} bottles` }; } },
    () => { const [a, b, c, d] = fpair(); return { q: `A rectangle measures ${F(a, b)} m by ${F(c, d)} m.<br>Find its area. Is it more or less than ${F(1, 4)} m²?`, a: `${FS(a * c, b * d)} m² – ${a * c / (b * d) > 0.25 ? 'more' : a * c / (b * d) < 0.25 ? 'less' : 'equal'}` }; },
    () => { const a = R(2, 4), b = R(a + 1, 9), n = nm();
      return { q: `${n} says <b>${F(1, a)} ÷ ${F(1, b)} = ${F(1, a * b)}</b>.<br>Explain why ${n} is wrong and find the correct answer.`, a: `Dividing by ${F(1, b)} is multiplying by ${b}: ${MX(b, a)}` }; },
    () => { const t = R(3, 8) * 4, n = nm();
      return { q: `${n} has <b>${t} m</b> of ribbon. ${n} uses ${F(3, 4)} of it, then cuts the rest into pieces ${F(1, 2)} m long.<br>How many pieces are there?`, a: `${t / 4} m left → ${t / 2} pieces` }; },
  ]);

add('fracamount', 'Fractions of amounts', 'Number', ['fraction of an amount', 'fraction of', 'find a fraction of', 'fractions'],
  () => { let a, b; do { b = R(3, 9); a = R(1, b - 1); } while (gcd(a, b) > 1); const N = b * R(3, 15); return { q: `Find ${F(a, b)} of <b>${N}</b>`, a: a * N / b }; },
  [
    () => { const b = P([4, 5, 3]), a = b === 4 ? P([1, 3]) : R(1, b - 1), d = P([3, 4, 5]), c = 1, X = b * d * R(4, 12) * 5, n = nm(); const saved = X * a / b, rest = X - saved, rent = rest / d;
      return { q: `${n} earns <b>£${C(X)}</b>. ${n} saves ${F(a, b)} of it and spends ${F(c, d)} of what is left on travel.<br>How much money does ${n} have left?`, a: `saves £${C(saved)}, travel £${C(rent)}, left £${C(rest - rent)}` }; },
    () => { let a, b; do { b = R(3, 9); a = R(1, b - 1); } while (gcd(a, b) > 1); const k = R(3, 12); return { q: `${F(a, b)} of a number is <b>${a * k}</b>.<br>What is the number?`, a: b * k }; },
    () => { for (;;) { const b1 = P([2, 3, 4, 5, 6]), b2 = P([3, 4, 5, 6, 8, 10]); if (b1 === b2) continue; const L = lcm(b1, b2), tot = L * R(1, 3); if (tot > 60 || tot < 12) continue; const a1 = 1, a2 = R(1, 2);
        const left = tot - tot * a1 / b1 - tot * a2 / b2; if (left <= 0) continue;
        return { q: `A class has <b>${tot}</b> students. ${F(a1, b1)} walk to school and ${F(a2, b2)} come by bus. The rest are driven.<br>How many are driven?`, a: `${left}` }; } },
  ]);

add('mixed', 'Mixed numbers & improper fractions', 'Number', ['mixed numbers', 'improper fractions', 'top heavy fractions', 'fractions'],
  () => { const d = R(2, 9), n = R(1, d - 1), w = R(1, 6); if (gcd(n, d) > 1) return { q: `Write <b>${w} ${F(1, d)}</b> as an improper fraction`, a: F(w * d + 1, d) }; return P([{ q: `Write <b>${w} ${F(n, d)}</b> as an improper fraction`, a: F(w * d + n, d) }, { q: `Write <b>${F(w * d + n, d)}</b> as a mixed number`, a: `${w} ${F(n, d)}` }]); },
  [
    () => { const Lq = R(9, 25), p = P([1, 2, 3]), pieces = Math.floor(Lq / p), left = Lq % p;
      return { q: `A ribbon is <b>${MX(Lq, 4)} m</b> long. It is cut into pieces that are each <b>${FS(p, 4)} m</b> long.<br>How many pieces can be cut? How much ribbon is left?`, a: `${pieces} pieces, ${left ? FS(left, 4) + ' m' : 'nothing'} left` }; },
    () => { const [a, b, c, d] = fpair(), w1 = R(1, 4), w2 = R(1, 4), n = nm(); const num = (w1 * b + a) * d + (w2 * d + c) * b;
      return { q: `${n} walks <b>${w1} ${F(a, b)} km</b> to school and then <b>${w2} ${F(c, d)} km</b> to the park.<br>How far does ${n} walk altogether?`, a: `${MX(num, b * d)} km` }; },
    () => { const w = R(1, 5), d = P([2, 3, 4, 5]), a = R(1, d - 1), k = R(2, 4), n = nm();
      return { q: `${n} says <b>${w} ${F(a, d)} × ${k} = ${w * k} ${F(a, d)}</b>.<br>Is ${n} right? Explain and give the correct answer.`, a: `No – the fraction must be multiplied too: ${MX((w * d + a) * k, d)}` }; },
  ]);

const FDP = [[1, 2, 0.5], [1, 4, 0.25], [3, 4, 0.75], [1, 5, 0.2], [2, 5, 0.4], [3, 5, 0.6], [4, 5, 0.8], [1, 8, 0.125], [3, 8, 0.375], [7, 10, 0.7], [3, 20, 0.15], [9, 25, 0.36], [1, 10, 0.1], [7, 20, 0.35], [11, 20, 0.55], [17, 25, 0.68]];
add('fdp', 'Fractions, decimals & percentages', 'Number', ['fdp', 'convert fractions decimals percentages', 'converting', 'percentage to fraction', 'decimal to fraction', 'percentages', 'decimals'],
  () => { const [n, d, v] = P(FDP); return P([{ q: `Write ${F(n, d)} as a decimal and as a percentage`, a: `${v}, ${C(v * 100)}%` }, { q: `Write <b>${C(v * 100)}%</b> as a fraction in its simplest form`, a: F(n, d) }, { q: `Write <b>${v}</b> as a fraction in its simplest form`, a: F(n, d) }]); },
  [
    () => { const pick = SH(FDP).slice(0, 4); const forms = pick.map(([n, d, v], i) => [[F(n, d), v], [String(v), v], [C(v * 100) + '%', v], [F(n, d), v]][i]);
      if (new Set(pick.map(p => p[2])).size < 4) return TOPICS.find(t => t.id === 'fdp').ps[0]();
      return { q: `Write these in order, smallest first:<br><b>${SH(forms).map(f => f[0]).join(', &nbsp; ')}</b>`, a: forms.slice().sort((x, y) => x[1] - y[1]).map(f => f[0]).join(', ') }; },
    () => { const [n1, n2] = nm2(); const d = P([20, 25, 40, 50]), s = R(Math.ceil(d * 0.6), d - 1), p = Math.round(s / d * 100) + P([-2, -1, 1, 2]);
      return { q: `In a test ${n1} scored <b>${s} out of ${d}</b>. ${n2} scored <b>${p}%</b>.<br>Who did better? Show how you know.`, a: `${n1}: ${C(r2(s / d * 100))}% so ${s / d * 100 > p ? n1 : n2} did better` }; },
    () => { const [n, d, v] = P(FDP.filter(x => x[2] * 100 % 5 === 0)), off = P([5, 10, -5]);
      const items = SH([F(n, d), String(v), C(v * 100) + '%', C(v * 100 + off) + '%']);
      return { q: `Which is the odd one out? Explain why.<br><b>${items.join(' &nbsp; ')}</b>`, a: `${C(v * 100 + off)}% – the others all equal ${C(v * 100)}%` }; },
  ]);

add('pctamount', 'Percentages of amounts', 'Number', ['percentage of an amount', 'percent of', 'percentages', 'percentage', 'find percentage'],
  () => { const p = P([5, 10, 15, 20, 25, 30, 35, 40, 45, 60, 75, 12.5]); const N = P([40, 80, 120, 160, 200, 240, 320, 360, 400]); return { q: `Find <b>${p}%</b> of <b>${N}</b>`, a: C(N * p / 100) }; },
  [
    () => { const p1 = R(3, 9) * 5, d1 = P([10, 20, 25, 30]), p2 = R(3, 9) * 5 + 2, d2 = P([10, 15, 20, 40]); const s1 = p1 * d1 / 100, s2 = p2 * d2 / 100;
      return { q: `In a sale, a <b>£${p1}</b> jumper has <b>${d1}%</b> off and a <b>£${p2}</b> coat has <b>${d2}%</b> off.<br>Which item has the bigger saving? By how much?`, a: s1 === s2 ? `Both save ${GBP(s1)}` : `${s1 > s2 ? 'Jumper' : 'Coat'} by ${GBP(Math.abs(s1 - s2))} (${GBP(s1)} vs ${GBP(s2)})` }; },
    () => { let N, p; do { N = 50 * R(12, 24); p = R(40, 58); } while ((N * p) % 100); return { q: `A school has <b>${C(N)}</b> students. <b>${p}%</b> of them are boys.<br>How many girls are there?`, a: C(N - N * p / 100) }; },
    () => { const b = P([80, 120, 160, 200, 240, 320]), p = P([17.5, 12.5, 35, 65, 15, 2.5]);
      return { q: `Work out <b>${p}%</b> of <b>£${b}</b> <u>without</u> a calculator. Show your method.`, a: `${GBP(b * p / 100)} (e.g. using 10%, 5%, 2.5%…)` }; },
  ]);

add('pctincdec', 'Percentage increase & decrease', 'Number', ['percentage increase', 'percentage decrease', 'discount', 'sale price', 'vat', 'multiplier', 'increase by percentage'],
  () => { const N = R(2, 20) * 20, p = P([5, 10, 15, 20, 25, 30, 40]); return P([{ q: `Increase <b>£${N}</b> by <b>${p}%</b>`, a: GBP(N * (1 + p / 100)) }, { q: `Decrease <b>£${N}</b> by <b>${p}%</b>`, a: GBP(N * (1 - p / 100)) }]); },
  [
    () => { const Pp = R(2, 8) * 100, d1 = P([10, 20, 25, 30]), d2 = P([5, 10, 20]);
      return { q: `A TV costs <b>£${Pp}</b>. In a sale it is reduced by <b>${d1}%</b>. A week later the sale price is reduced by a further <b>${d2}%</b>.<br>What does the TV cost now? Is this the same as ${d1 + d2}% off?`, a: `${GBP(Pp * (1 - d1 / 100) * (1 - d2 / 100))} – not the same as ${d1 + d2}% off (${GBP(Pp * (1 - (d1 + d2) / 100))})` }; },
    () => { const S = R(1, 5) * 100, p = P([10, 20, 25, 50]), n = nm();
      return { q: `${n} says “If you increase a price by ${p}% and then decrease it by ${p}%, you get back to where you started.”<br>Test this with <b>£${S}</b>. Is ${n} right?`, a: `£${S} → ${GBP(S * (1 + p / 100))} → ${GBP(S * (1 + p / 100) * (1 - p / 100))}; no` }; },
    () => { const b = R(8, 80) * 5; return { q: `A bill is <b>£${b}</b> before VAT. VAT of <b>20%</b> is added.<br>What is the total bill? What single number could you multiply by?`, a: `${GBP(b * 1.2)}; × 1.2` }; },
  ]);

add('pctchange', 'Percentage change & profit', 'Number', ['percentage change', 'percentage profit', 'percentage loss', 'percentage difference', 'express as a percentage'],
  () => { const o = R(2, 10) * 10, p = P([10, 20, 25, 40, 50, 5, 15]), up = P([1, -1]); const nw = o * (1 + up * p / 100); return { q: `A price changes from <b>£${o}</b> to <b>${GBP(nw)}</b>. Find the percentage ${up > 0 ? 'increase' : 'decrease'}.`, a: `${p}%` }; },
  [
    () => { const n = R(20, 60), c0 = R(3, 8), p = P([25, 50, 20, 40]), s = c0 * (1 + p / 100);
      return { q: `A trader buys <b>${n}</b> T-shirts for <b>£${n * c0}</b> altogether. She sells them all for <b>${GBP(s)}</b> each.<br>Find her percentage profit.`, a: `profit ${GBP(n * s - n * c0)}; ${p}%` }; },
    () => { const a = R(12, 30) * 2, pa = P([25, 50, 20]), b = R(10, 25) * 5, pb = P([20, 40, 10, 30]);
      return { q: `Plant A grew from <b>${a} cm</b> to <b>${C(a * (1 + pa / 100))} cm</b>. Plant B grew from <b>${b} cm</b> to <b>${C(b * (1 + pb / 100))} cm</b>.<br>Which plant grew by the greater percentage?`, a: pa === pb ? `Same (${pa}%)` : `${pa > pb ? 'A' : 'B'} (A ${pa}%, B ${pb}%)` }; },
    () => { const [n1] = nm2(); const s1 = R(30, 54), d1 = 60, s2 = R(30, 45), d2 = 50; const p1 = s1 / d1 * 100, p2 = s2 / d2 * 100;
      return { q: `${n1} scored <b>${s1} out of ${d1}</b> in Paper 1 and <b>${s2} out of ${d2}</b> in Paper 2.<br>In which paper did ${n1} do better?`, a: p1 === p2 ? `Same (${C(r2(p1))}%)` : `Paper ${p1 > p2 ? 1 : 2} (${C(r2(p1))}% vs ${C(r2(p2))}%)` }; },
  ]);

add('reversepct', 'Reverse percentages', 'Number', ['reverse percentage', 'original price', 'original amount', 'before the increase', 'percentages'],
  () => { const o = R(2, 20) * 10, p = P([10, 20, 25, 40, 50]), up = P([1, -1]); return { q: `After a <b>${p}% ${up > 0 ? 'increase' : 'decrease'}</b> a price is <b>${GBP(o * (1 + up * p / 100))}</b>. Find the original price.`, a: `£${o}` }; },
  [
    () => { const o = R(4, 15) * 10, p = P([20, 25, 30, 40]); return { q: `In a sale everything is <b>${p}% off</b>. A jacket costs <b>${GBP(o * (1 - p / 100))}</b> in the sale.<br>What was the original price?`, a: `${GBP(o * (1 - p / 100))} ÷ ${1 - p / 100} = £${o}` }; },
    () => { const o = R(4, 12) * 20, p = P([20, 25]), s = o * (1 - p / 100), n = nm();
      return { q: `A coat costs <b>${GBP(s)}</b> after <b>${p}%</b> off. ${n} says the original price was ${GBP(s)} + ${p}% of ${GBP(s)} = <b>${GBP(s * (1 + p / 100))}</b>.<br>Explain why ${n} is wrong and find the correct original price.`, a: `The ${p}% is of the original, not the sale price. Original = £${o}` }; },
    () => { const o = R(40, 99) * 100, p = P([2, 4, 5, 8, 10]); return { q: `A town's population increased by <b>${p}%</b> to <b>${C(o * (1 + p / 100))}</b>.<br>What was the population before the increase?`, a: C(o) }; },
  ]);

add('interest', 'Simple & compound interest', 'Number', ['simple interest', 'compound interest', 'depreciation', 'savings', 'interest', 'growth and decay'],
  () => { const p0 = R(2, 20) * 100, r = R(2, 6), y = R(2, 5); return P([{ q: `Find the simple interest on <b>£${C(p0)}</b> at <b>${r}%</b> per year for <b>${y}</b> years`, a: GBP(p0 * r / 100 * y) }, { q: `<b>£${C(p0)}</b> is invested at <b>${r}%</b> compound interest. Find its value after <b>2</b> years.`, a: GBP(r2(p0 * Math.pow(1 + r / 100, 2))) }]); },
  [
    () => { const p0 = R(1, 5) * 1000, rA = R(3, 5), rB = rA - 0.5, y = 3; const A = p0 * (1 + rA * y / 100), B = r2(p0 * Math.pow(1 + rB / 100, y));
      return { q: `<b>Bank A:</b> ${rA}% simple interest per year.<br><b>Bank B:</b> ${rB}% compound interest per year.<br>Which bank gives more on <b>£${C(p0)}</b> after <b>${y}</b> years? By how much?`, a: `A: ${GBP(A)}, B: ${GBP(B)} → ${A > B ? 'A' : 'B'} by ${GBP(r2(Math.abs(A - B)))}` }; },
    () => { const V = R(8, 20) * 1000, r = P([10, 15, 20]); return { q: `A car is worth <b>£${C(V)}</b>. It loses <b>${r}%</b> of its value each year.<br>What is it worth after 2 years?`, a: GBP(r2(V * Math.pow(1 - r / 100, 2))) }; },
    () => { const r = P([5, 8, 10]), tgt = P([1300, 1500]); let n = 0, v = 1000; while (v <= tgt) { v *= 1 + r / 100; n++; }
      return { q: `<b>£1,000</b> is invested at <b>${r}%</b> compound interest per year.<br>After how many whole years will it first be worth more than <b>£${C(tgt)}</b>?`, a: `${n} years (${GBP(r2(v))})` }; },
  ]);

add('stdform', 'Standard form', 'Number', ['standard form', 'scientific notation', 'powers of 10', 'large numbers', 'small numbers'],
  () => P([() => { const m = R(11, 99) / 10, e = R(3, 7); return { q: `Write <b>${C(m * Math.pow(10, e))}</b> in standard form`, a: stdF(m * Math.pow(10, e)) }; },
    () => { const m = R(11, 99) / 10, e = -R(2, 5); return { q: `Write <b>${(m * Math.pow(10, e)).toFixed(-e + 1)}</b> in standard form`, a: stdF(m * Math.pow(10, e)) }; },
    () => { const m = R(11, 99) / 10, e = R(-4, 6); return { q: `Write <b>${M(m)} × 10${SUP(e)}</b> as an ordinary number`, a: e >= 0 ? C(+(m * Math.pow(10, e)).toFixed(0)) : (m * Math.pow(10, e)).toFixed(-e + 1) }; }])(),
  [
    () => { const a = R(10, 70) / 10, b = +(a + R(5, 25) / 10).toFixed(1); return { q: `Planet X is <b>${a} × 10${SUP(8)}</b> km from its star. Planet Y is <b>${b} × 10${SUP(8)}</b> km from the star.<br>How much further is Planet Y? Give your answer in standard form.`, a: stdF(+((b - a) * 1e8).toFixed(0)) + ' km' }; },
    () => { const v = [R(11, 99) / 10 * 1e4, R(11, 99) / 10 * 1e3, R(11, 99) / 10 * 1e5, R(2, 9) / 10 * 1e5]; const txt = [stdF(v[0]), stdF(v[1]), stdF(v[2]), `${M(v[3] / 1e5)} × 10${SUP(5)}`];
      const order = v.map((x, i) => [x, txt[i]]).sort((x, y) => x[0] - y[0]);
      return { q: `Write in order, smallest first:<br><b>${SH(txt).join(', &nbsp; ')}</b>`, a: order.map(o => o[1]).join(', ') }; },
    () => { const a = R(2, 9), b = R(2, 9), m = R(2, 6), n = R(2, 6); return { q: `Work out <b>(${a} × 10${SUP(m)}) × (${b} × 10${SUP(n)})</b>.<br>Give your answer in standard form.`, a: stdF(a * b * Math.pow(10, m + n)) }; },
  ]);

add('indices', 'Laws of indices', 'Number', ['index laws', 'indices', 'laws of indices', 'powers', 'exponents'],
  () => { const v = P(['a', 'x', 'y', 'm']), m = R(2, 9), n = R(2, 6); return P([{ q: `Simplify <b>${v}${SUP(m)} × ${v}${SUP(n)}</b>`, a: v + SUP(m + n) }, { q: `Simplify <b>${v}${SUP(m + n)} ÷ ${v}${SUP(n)}</b>`, a: v + SUP(m) }, { q: `Simplify <b>(${v}${SUP(m)})${SUP(n)}</b>`, a: v + SUP(m * n) }]); },
  [
    () => { const b = P([2, 3, 5, 7]), p = R(2, 6), n = R(2, 7); return { q: `Find the value of <i>n</i>:<br><b>${b}${SUP(p)} × ${b}<sup>n</sup> = ${b}${SUP(p + n)}</b>`, a: `n = ${n}` }; },
    () => { const a = R(2, 5), b = R(2, 5), n = nm(); return { q: `${n} says <b>2${SUP(a)} × 2${SUP(b)} = 4${SUP(a + b)}</b>.<br>Explain the mistake and work out the correct value.`, a: `Keep the base: 2${SUP(a + b)} = ${Math.pow(2, a + b)}` }; },
    () => { const [x, base, k] = P([[8, 2, 3], [4, 2, 2], [16, 2, 4], [9, 3, 2], [27, 3, 3], [25, 5, 2]]), e = R(2, 6); return { q: `Write <b>${x} × ${base}${SUP(e)}</b> as a single power of ${base}.`, a: base + SUP(k + e) }; },
  ]);

/* ===== RATIO & PROPORTION ===== */
add('ratiosimp', 'Simplifying ratios', 'Ratio', ['ratio', 'simplify ratio', 'simplest form ratio', 'ratio 1:n', 'writing ratios'],
  () => P([() => { const k = R(2, 9), a = R(1, 7), b = R(2, 9); const g = gcd(a, b); return { q: `Simplify <b>${a * k} : ${b * k}</b>`, a: `${a / g} : ${b / g}` }; },
    () => { const k = R(2, 6), a = R(1, 5), b = R(1, 5), c = R(1, 5); const g = gcd(gcd(a, b), c); return { q: `Simplify <b>${a * k} : ${b * k} : ${c * k}</b>`, a: `${a / g} : ${b / g} : ${c / g}` }; }])(),
  [
    () => { let x, y; do { x = R(1, 5); y = R(1, 5); } while (gcd(x, y) > 1 || x === y); const k = R(3, 6);
      return { q: `A class has <b>${x * k} boys</b> and <b>${y * k} girls</b>.<br>(a) Write the ratio of boys to girls in its simplest form.<br>(b) What fraction of the class are boys?`, a: `(a) ${x} : ${y} (b) ${F(x, x + y)}` }; },
    () => { const m = P([1.5, 2, 2.5, 3]), cm = P([25, 50, 75, 30, 60]); const a = m * 100, g = gcd(a, cm);
      return { q: `Write <b>${m} m : ${cm} cm</b> as a ratio in its simplest form.`, a: `${a / g} : ${cm / g}` }; },
    () => { const a = R(2, 5), b = R(a + 1, 12); return { q: `Write <b>${a} : ${b}</b> in the form <b>1 : n</b>.`, a: `1 : ${C(r2(b / a))}` }; },
  ]);

add('ratioshare', 'Sharing in a ratio', 'Ratio', ['share in a ratio', 'sharing ratio', 'divide in a ratio', 'ratio problems', 'ratio'],
  () => P([() => { const a = R(1, 5), b = R(1, 7), k = R(3, 12) * 5; return { q: `Share <b>£${(a + b) * k}</b> in the ratio <b>${a} : ${b}</b>`, a: `£${a * k} and £${b * k}` }; },
    () => { const a = R(1, 4), b = R(1, 4), c = R(1, 4), k = R(2, 10); return { q: `Share <b>${(a + b + c) * k}</b> sweets in the ratio <b>${a} : ${b} : ${c}</b>`, a: `${a * k}, ${b * k}, ${c * k}` }; }])(),
  [
    () => { let a, b; do { a = R(1, 5); b = R(a + 1, 8); } while (gcd(a, b) > 1); const k = R(3, 10), [n1, n2] = nm2();
      return { q: `${n1} and ${n2} share some sweets in the ratio <b>${a} : ${b}</b>. ${n2} gets <b>${(b - a) * k}</b> more sweets than ${n1}.<br>How many sweets were there altogether?`, a: `${(a + b) * k}` }; },
    () => { const [c, s, g] = P([[1, 2, 3], [1, 2, 4], [1, 3, 5], [2, 3, 5]]), k = R(10, 40), tot = (c + s + g) * k;
      return { q: `Concrete is made from cement, sand and gravel in the ratio <b>${c} : ${s} : ${g}</b>.<br>How much sand is needed to make <b>${tot} kg</b> of concrete?`, a: `${s * k} kg` }; },
    () => { const pr = P([[1, 2, 3], [2, 3, 4], [1, 1, 4], [3, 4, 5], [2, 3, 5], [1, 3, 5], [1, 2, 6], [4, 5, 6]]); const s = pr[0] + pr[1] + pr[2];
      return { q: `The angles in a triangle are in the ratio <b>${pr.join(' : ')}</b>.<br>Find the size of each angle. What type of triangle is it?`, a: pr.map(x => x * 180 / s + '°').join(', ') + (pr[2] * 180 / s === 90 ? ' (right-angled)' : pr[2] * 180 / s > 90 ? ' (obtuse)' : ' (acute)') }; },
  ]);

add('proportion', 'Direct & inverse proportion, best buys', 'Ratio', ['best buy', 'value for money', 'direct proportion', 'inverse proportion', 'unitary method', 'proportion'],
  () => { const n = R(3, 8), u = R(20, 95) / 100 * 5, m = R(n + 1, 15); return { q: `<b>${n}</b> pens cost <b>${GBP(r2(n * u))}</b>. How much do <b>${m}</b> pens cost?`, a: GBP(r2(r2(n * u) / n * m)) }; },
  [
    () => { for (;;) { const a = P([4, 6, 8]), b = P([10, 12, 15]), pa = R(10, 30) / 100, pb = pa - R(1, 4) / 100; const ca = r2(a * pa), cb = r2(b * pb); if (ca / a === cb / b) continue;
        const better = ca / a < cb / b ? `the pack of ${a}` : `the pack of ${b}`;
        return { q: `Which is better value?<br><b>${a} rolls for ${GBP(ca)}</b> or <b>${b} rolls for ${GBP(cb)}</b><br>Show your working.`, a: `${better} (${C(r2(ca / a * 100))}p vs ${C(r2(cb / b * 100))}p per roll)` }; } },
    () => { for (;;) { const w = R(2, 8), d = R(3, 12), w2 = R(2, 10); if (w2 === w || (w * d) % w2) continue; return { q: `<b>${w}</b> builders take <b>${d}</b> days to build a wall.<br>How long would <b>${w2}</b> builders take, working at the same rate?`, a: `${w * d / w2} days` }; } },
    () => { const l = R(15, 30), mpl = R(6, 9), l2 = R(32, 50); return { q: `A car travels <b>${l * mpl}</b> miles on <b>${l}</b> litres of fuel.<br>How far can it travel on <b>${l2}</b> litres? How many litres for 300 miles?`, a: `${l2 * mpl} miles; ${C(r2(300 / mpl))} litres` }; },
  ]);

add('recipes', 'Recipes & scaling', 'Ratio', ['recipe', 'recipes', 'scaling', 'ingredients', 'proportion'],
  () => { const p = P([2, 4, 6]), g = R(2, 8) * 50, q = P([3, 8, 9, 10, 12]); return { q: `A recipe for <b>${p}</b> people uses <b>${g} g</b> of flour. How much flour is needed for <b>${q}</b> people?`, a: `${C(g / p * q)} g` }; },
  [
    () => { const f = R(4, 8) * 50, b = R(2, 4) * 50, e = 3, m = R(2, 4) * 100, have = b * R(2, 3) + 50;
      return { q: `Cake for <b>6</b> people:<br>${table(['Flour', 'Butter', 'Eggs', 'Milk'], [[f + ' g', b + ' g', e, m + ' ml']])}(a) How much flour for 10 people?<br>(b) There is only <b>${have} g</b> of butter. What is the most people the cake could serve?`, a: `(a) ${C(r2(f / 6 * 10))} g (b) ${Math.floor(have / b * 6)} people` }; },
    () => { const eg = 2, fl = 120, mk = 300, hE = R(3, 9), hF = R(2, 8) * 100, hM = P([500, 750, 1000]);
      const batches = Math.min(Math.floor(hE / eg), Math.floor(hF / fl), Math.floor(hM / mk));
      return { q: `<b>2 eggs, 120 g flour and 300 ml milk</b> make <b>8</b> pancakes.<br>${nm()} has ${hE} eggs, ${hF} g of flour and ${hM} ml of milk.<br>What is the greatest number of pancakes that can be made (using whole recipes)?`, a: `${batches} batches → ${batches * 8} pancakes` }; },
    () => { const c = 12, b = P([100, 125, 150]), pack = 250, pr = P([1.8, 2.2, 2.5]), k = P([3, 4, 5]); const need = b * k, packs = Math.ceil(need / pack);
      return { q: `<b>${c}</b> cookies need <b>${b} g</b> of butter. Butter is sold in <b>${pack} g</b> packs costing <b>${GBP(pr)}</b>.<br>How much will the butter cost to make <b>${c * k}</b> cookies?`, a: `${need} g → ${packs} packs → ${GBP(r2(packs * pr))}` }; },
  ]);

add('sdt', 'Speed, distance & time', 'Ratio', ['speed', 'distance', 'time', 'sdt', 'average speed', 'compound measures', 'journey'],
  () => P([() => { const s = R(4, 14) * 5, t = P([1.5, 2, 2.5, 3, 4]); return { q: `A car travels <b>${C(s * t)} km</b> in <b>${t} hours</b>. Find its average speed.`, a: `${s} km/h` }; },
    () => { const s = R(4, 14) * 5, t = P([0.5, 1.5, 2, 3]); return { q: `A train travels at <b>${s} mph</b> for <b>${t} hours</b>. How far does it go?`, a: `${C(s * t)} miles` }; },
    () => { const s = P([40, 50, 60, 80]), d = s * P([0.5, 1.5, 2.5, 0.75]); return { q: `How long does it take to travel <b>${C(d)} km</b> at <b>${s} km/h</b>?`, a: `${C(d / s)} hours (${C(d / s * 60)} min)` }; }])(),
  [
    () => { const d1 = P([8, 12, 16]), s1 = P([16, 24, 32]), d2 = P([6, 9, 18]), s2 = P([12, 18]); const t = d1 / s1 * 60 + d2 / s2 * 60;
      return { q: `${nm()} cycles <b>${d1} km</b> at <b>${s1} km/h</b>, then <b>${d2} km</b> at <b>${s2} km/h</b>.<br>How long does the whole journey take, in minutes? What is the average speed?`, a: `${C(t)} minutes; ${C(r2((d1 + d2) / (t / 60)))} km/h` }; },
    () => { const st = R(7, 10) * 60 + P([0, 15, 30, 45]), s = P([40, 50, 60, 80]), h = P([1.5, 2.5, 3, 3.5, 2.25]);
      return { q: `A train leaves at <b>${time(st)}</b> and travels <b>${C(s * h)} miles</b> at an average speed of <b>${s} mph</b>.<br>What time does it arrive?`, a: `${h} h = ${h * 60} min → ${time(st + h * 60)}` }; },
    () => { const [n1, n2] = nm2(), t1 = P([80, 64, 100]), t2 = P([200, 210, 225, 240]);
      return { q: `${n1} runs <b>400 m</b> in <b>${t1} seconds</b>. ${n2} runs <b>1 km</b> in <b>${Math.floor(t2 / 60)} min ${t2 % 60} s</b>.<br>Who runs faster? Show your working.`, a: `${n1}: ${C(r2(400 / t1))} m/s, ${n2}: ${C(r2(1000 / t2))} m/s → ${400 / t1 > 1000 / t2 ? n1 : n2}` }; },
  ]);

add('density', 'Density & pressure', 'Ratio', ['density', 'mass', 'volume', 'compound measures', 'pressure', 'dmv'],
  () => { const d = R(2, 12), v = R(5, 40); return P([{ q: `A block has mass <b>${d * v} g</b> and volume <b>${v} cm³</b>. Find its density.`, a: `${d} g/cm³` }, { q: `A metal has density <b>${d} g/cm³</b>. Find the mass of <b>${v} cm³</b>.`, a: `${d * v} g` }]); },
  [
    () => { const l = R(8, 12), w = R(3, 5), h = R(2, 3), dn = 19.3; return { q: `A gold bar is a cuboid <b>${l} cm × ${w} cm × ${h} cm</b>. Gold has a density of <b>19.3 g/cm³</b>.<br>Find the mass of the bar in kg.`, a: `${l * w * h} cm³ × 19.3 = ${C(r2(l * w * h * dn))} g = ${C(r2(l * w * h * dn / 1000))} kg` }; },
    () => { const mA = R(10, 20) * 10, vA = R(4, 8) * 10, mB = R(10, 25) * 10, vB = R(4, 9) * 10; const dA = mA / vA, dB = mB / vB; if (dA === dB) return TOPICS.find(t => t.id === 'density').ps[1]();
      return { q: `Object A has mass <b>${mA} g</b> and volume <b>${vA} cm³</b>.<br>Object B has mass <b>${mB} g</b> and volume <b>${vB} cm³</b>.<br>Which is more dense?`, a: `A ${C(r2(dA))}, B ${C(r2(dB))} g/cm³ → ${dA > dB ? 'A' : 'B'}` }; },
    () => { const f = R(3, 12) * 100, a = P([0.5, 1.5, 2, 2.5, 4]); return { q: `A force of <b>${f} N</b> acts on an area of <b>${a} m²</b>. Pressure = force ÷ area.<br>Find the pressure. What happens to the pressure if the area is halved?`, a: `${C(r2(f / a))} N/m²; it doubles (${C(r2(2 * f / a))} N/m²)` }; },
  ]);

add('units', 'Converting units & time', 'Ratio', ['units', 'converting units', 'metric units', 'unit conversion', 'cm to m', 'kg', 'litres', 'time', 'timetables'],
  () => P([{ q: `Convert <b>${R(2, 9)}.${R(1, 9)} km</b> to metres`, f: q => q }, null].filter(Boolean).map(() => { const k = P([['km', 'm', 1000], ['m', 'cm', 100], ['kg', 'g', 1000], ['litres', 'ml', 1000], ['cm', 'mm', 10]]), v = R(2, 95) / 10;
      return P([{ q: `Convert <b>${C(v)} ${k[0]}</b> to ${k[1]}`, a: `${C(v * k[2])} ${k[1]}` }, { q: `Convert <b>${C(v * k[2])} ${k[1]}</b> to ${k[0]}`, a: `${C(v)} ${k[0]}` }]); })),
  [
    () => { const j = P([1.5, 2, 2.5, 3]), g = P([200, 250, 300]); return { q: `A jug holds <b>${j} litres</b>. Glasses hold <b>${g} ml</b>.<br>How many glasses can be completely filled? How much is left in the jug?`, a: `${Math.floor(j * 1000 / g)} glasses, ${j * 1000 % g} ml left` }; },
    () => { const st = R(17, 20) * 60 + P([10, 25, 40, 45, 50]), d = R(95, 165); return { q: `A film starts at <b>${time(st)}</b> and lasts <b>${Math.floor(d / 60)} h ${d % 60} min</b>.<br>What time does it finish? Will it finish before 10 pm?`, a: `${time(st + d)} – ${st + d < 22 * 60 ? 'yes' : 'no'}` }; },
    () => { const L = R(3, 6) + R(1, 9) / 10, p = P([25, 30, 35, 40]); const cm = Math.round(L * 100); return { q: `A rope is <b>${L.toFixed(1)} m</b> long. It is cut into pieces <b>${p} cm</b> long.<br>How many pieces? How much is left over?`, a: `${Math.floor(cm / p)} pieces, ${cm % p} cm left` }; },
  ]);
// fix units fluency (simpler)
TOPICS[TOPICS.length - 1].flu = () => { const k = P([['km', 'm', 1000], ['m', 'cm', 100], ['kg', 'g', 1000], ['litres', 'ml', 1000], ['cm', 'mm', 10]]), v = R(2, 95) / 10;
  return P([{ q: `Convert <b>${C(v)} ${k[0]}</b> to ${k[1]}`, a: `${C(v * k[2])} ${k[1]}` }, { q: `Convert <b>${C(+(v * k[2]).toFixed(2))} ${k[1]}</b> to ${k[0]}`, a: `${C(v)} ${k[0]}` }, { q: `How many minutes in <b>${P([1.5, 2.25, 3.75, 0.4])} hours</b>?`, a: '' }]).a === '' ? (() => { const h = P([1.5, 2.25, 3.75, 0.4]); return { q: `How many minutes are in <b>${h} hours</b>?`, a: `${h * 60} minutes` }; })() : { q: `Convert <b>${C(v)} ${k[0]}</b> to ${k[1]}`, a: `${C(v * k[2])} ${k[1]}` }; };

add('exchange', 'Exchange rates', 'Ratio', ['exchange rate', 'currency', 'euros', 'dollars', 'money conversion', 'converting currency'],
  () => { const r = P([1.15, 1.16, 1.2, 1.25, 1.3]), cur = P([['€', 'euros'], ['$', 'dollars']]), v = R(2, 20) * 20; return P([{ q: `£1 = ${cur[0]}${r}. Convert <b>£${v}</b> to ${cur[1]}.`, a: `${cur[0]}${C(r2(v * r))}` }, { q: `£1 = ${cur[0]}${r}. Convert <b>${cur[0]}${C(r2(v * r))}</b> to pounds.`, a: `£${v}` }]); },
  [
    () => { const r = P([1.25, 1.3, 1.2]), uk = R(60, 120), us = Math.round(uk * r + P([-12, -6, 6, 12])); return { q: `Trainers cost <b>£${uk}</b> in the UK and <b>$${us}</b> in the USA.<br>The exchange rate is <b>£1 = $${r}</b>. Where are they cheaper, and by how much (in £)?`, a: `$${us} = ${GBP(r2(us / r))} → ${us / r < uk ? 'USA' : 'UK'} cheaper by ${GBP(r2(Math.abs(uk - us / r)))}` }; },
    () => { const p = R(2, 6) * 100, r1 = 1.16, r2_ = 1.2, sp = Math.round(p * r1 * P([0.6, 0.7, 0.75])); const left = r2(p * r1 - sp);
      return { q: `${nm()} changes <b>£${p}</b> to euros at <b>£1 = €${r1}</b> and spends <b>€${sp}</b> on holiday.<br>The rest is changed back to pounds at <b>£1 = €${r2_}</b>. How many pounds is that?`, a: `€${C(r2(p * r1))} − €${sp} = €${C(left)} → ${GBP(r2(left / r2_))}` }; },
  ]);

/* ===== ALGEBRA ===== */
add('simplify', 'Simplifying expressions', 'Algebra', ['collecting like terms', 'simplify', 'simplifying expressions', 'like terms', 'algebra', 'expressions'],
  () => { const a = R(2, 9), b = R(1, 9), c = R(1, 9), d = R(1, 9), s1 = P([1, -1]), s2 = P([1, -1]); const v = P([['a', 'b'], ['x', 'y'], ['m', 'n']]);
    return { q: `Simplify <b>${sumTerms([[a, v[0]], [b, v[1]], [s1 * c, v[0]], [s2 * d, v[1]]])}</b>`, a: sumTerms([[a + s1 * c, v[0]], [b + s2 * d, v[1]]]) }; },
  [
    () => { const a = R(2, 6), b = R(1, 9), c = R(1, 4), d = R(1, 5); return { q: `A rectangle has length <b>(${lin(a, b)})</b> cm and width <b>(${lin(c, -d)})</b> cm.<br>Write an expression for its perimeter in its simplest form.`, a: `${lin(2 * (a + c), 2 * (b - d))} cm` }; },
    () => { const a = R(3, 9), b = R(2, 6), c = R(1, a - 1), d = R(1, 5), n = nm(); const right = sumTerms([[a - c, 'x'], [b + d, 'y']]), wrong = sumTerms([[a - c, 'x'], [b, 'y']]);
      return { q: `${n} simplifies <b>${sumTerms([[a, 'x'], [b, 'y'], [-c, 'x'], [d, 'y']])}</b> and gets <b>${wrong}</b>.<br>Explain the mistake and write the correct answer.`, a: `Forgot the +${d}y: ${right}` }; },
    () => { const p = R(2, 5), q = R(1, 5), r = R(1, 4), s = R(1, 4); // bottom bricks: p a | q b | r a + s b
      return { q: `In a number wall, each brick is the sum of the two bricks below it.<br>The bottom row is <b>${p}a</b>, <b>${q}b</b>, <b>${sumTerms([[r, 'a'], [s, 'b']])}</b>.<br>Find an expression for the top brick.`, a: `Middle: ${sumTerms([[p, 'a'], [q, 'b']])}, ${sumTerms([[r, 'a'], [q + s, 'b']])}; top: ${sumTerms([[p + r, 'a'], [2 * q + s, 'b']])}` }; },
  ]);

add('substitution', 'Substitution', 'Algebra', ['substitution', 'substitute', 'formula', 'evaluate', 'algebra'],
  () => { const a = R(2, 6), b = -R(1, 5), p = R(2, 5), q = R(2, 5); return P([{ q: `If <b>a = ${a}</b> and <b>b = ${M(b)}</b>, find <b>${p}a − ${q}b</b>`, a: M(p * a - q * b) }, { q: `If <b>x = ${M(b)}</b>, find <b>x² + ${p}x</b>`, a: M(b * b + p * b) }]); },
  [
    () => { const base = P([2.5, 3, 3.5]), pm = P([1.6, 1.8, 2, 2.2]), m = R(6, 15), m2 = R(5, 12);
      return { q: `A taxi fare is <b>C = ${base} + ${pm}m</b>, where m is the number of miles.<br>(a) Find the cost of a ${m} mile journey.<br>(b) A journey costs <b>${GBP(r2(base + pm * m2))}</b>. How many miles was it?`, a: `(a) ${GBP(r2(base + pm * m))} (b) ${m2} miles` }; },
    () => { const x = -R(2, 5), k = R(2, 5); const a = x * x, b = k * x;
      return { q: `When <b>x = ${M(x)}</b>, which is bigger: <b>x²</b> or <b>${k}x</b>? Show your working.`, a: `x² = ${a}, ${k}x = ${M(b)} → x² is bigger` }; },
    () => { const n = R(3, 6), k = R(2, 5), nmn = nm(); return { q: `${nmn} says that when <b>n = ${n}</b>, <b>${k}n² = ${(k * n) * (k * n)}</b>.<br>Explain the mistake and find the correct value.`, a: `Square first: ${k} × ${n * n} = ${k * n * n}` }; },
  ]);

add('expand', 'Expanding single brackets', 'Algebra', ['expanding brackets', 'expand', 'single brackets', 'multiply out brackets', 'algebra'],
  () => { const k = R(2, 9), a = R(1, 6), b = R(1, 9) * P([1, -1]); return { q: `Expand <b>${k}(${lin(a, b)})</b>`, a: lin(k * a, k * b) }; },
  [
    () => { const p = R(2, 5), a = R(1, 4), b = R(1, 6), q = R(2, 4), c = R(1, 3), d = R(1, 6); return { q: `Expand and simplify <b>${p}(${lin(a, b)}) − ${q}(${lin(c, -d)})</b>`, a: lin(p * a - q * c, p * b + q * d) }; },
    () => { const w = R(3, 9), a = R(2, 5), b = R(1, 7); return { q: `A rectangle has width <b>${w}</b> cm and length <b>(${lin(a, b)})</b> cm.<br>Show that its area is <b>${lin(w * a, w * b)}</b> cm².`, a: `${w}(${lin(a, b)}) = ${lin(w * a, w * b)}` }; },
    () => { const k = R(2, 6), a = R(2, 5), b = R(2, 7); return { q: `Fill in the boxes:<br><b style="font-size:1.2em"><span class="bx"></span>(${a}x + <span class="bx"></span>) = ${k * a}x + ${k * b}</b>`, a: `${k}(${a}x + ${b})` }; },
  ]);

add('factorise', 'Factorising expressions', 'Algebra', ['factorising', 'factorise', 'common factor', 'factorise fully', 'algebra'],
  () => { let k, a, b; do { k = R(2, 9); a = R(1, 6); b = R(1, 9); } while (gcd(a, b) > 1); return { q: `Factorise <b>${lin(k * a, k * b)}</b>`, a: `${k}(${lin(a, b)})` }; },
  [
    () => { let k, a, b; do { k = R(2, 6); a = R(1, 5); b = R(1, 5); } while (gcd(a, b) > 1); return { q: `Factorise fully <b>${k * a}x² + ${k * b}x</b>`, a: `${k}x(${lin(a, b)})` }; },
    () => { let a, b; do { a = R(1, 5); b = R(1, 5); } while (gcd(a, b) > 1); const n = nm(); return { q: `${n} factorises <b>${lin(4 * a, 4 * b)}</b> as <b>2(${lin(2 * a, 2 * b)})</b>.<br>Is this fully factorised? Explain.`, a: `No – 4(${lin(a, b)})` }; },
    () => { let w, a, b; do { w = R(3, 9); a = R(1, 5); b = R(1, 6); } while (gcd(a, b) > 1); return { q: `A rectangle has area <b>${lin(w * a, w * b)}</b> cm² and width <b>${w}</b> cm.<br>Find an expression for its length.`, a: `${lin(a, b)} cm` }; },
  ]);

add('solve', 'Solving linear equations', 'Algebra', ['solving equations', 'solve', 'linear equations', 'find x', 'equations', 'algebra'],
  () => P([() => { const x = R(-5, 12), a = R(2, 9), b = R(1, 20) * P([1, -1]); return { q: `Solve <b>${lin(a, b)} = ${M(a * x + b)}</b>`, a: `x = ${M(x)}` }; },
    () => { const x = R(1, 10), a = R(3, 9), c = R(1, a - 1), b = R(-10, 10), d = (a - c) * x + b; return { q: `Solve <b>${lin(a, b)} = ${lin(c, d)}</b>`, a: `x = ${x}` }; },
    () => { const x = R(1, 9), k = R(2, 5), b = R(1, 6); return { q: `Solve <b>${k}(x + ${b}) = ${k * (x + b)}</b>`, a: `x = ${x}` }; }])(),
  [
    () => { const x = R(3, 15), m = R(2, 6), s = R(1, 12); return { q: `I think of a number. I multiply it by <b>${m}</b> and then subtract <b>${s}</b>. The answer is <b>${m * x - s}</b>.<br>What was my number?`, a: `${x}` }; },
    () => { const x = R(1, 9), a = R(4, 9), c = R(1, a - 2), b = -R(1, 9), d = (a - c) * x + b; return { q: `Solve <b>${lin(a, b)} = ${lin(c, d)}</b><br>Check your answer by substituting it back in.`, a: `x = ${x}` }; },
    () => { const x = R(2, 9), k = R(2, 4), b = R(1, 5), n = nm(); const rhs = k * (x + b);
      return { q: `${n} solves <b>${k}(x + ${b}) = ${rhs}</b> and gets <b>x = ${M(r2((rhs - b) / k))}</b>.<br>Find the mistake and solve it correctly.`, a: `${n} didn't multiply ${b} by ${k}. ${k}x + ${k * b} = ${rhs} → x = ${x}` }; },
  ]);

add('forming', 'Forming & solving equations', 'Algebra', ['forming equations', 'form an equation', 'word problems', 'equations', 'algebra'],
  () => { const x = P([20, 30, 36, 18, 12]); const [a, b, c] = x === 30 ? [1, 2, 3] : x === 20 ? [2, 3, 4] : x === 36 ? [1, 1, 3] : x === 18 ? [3, 3, 4] : [3, 4, 8]; return { q: `The angles in a triangle are <b>${a === 1 ? '' : a}x</b>, <b>${b === 1 ? '' : b}x</b> and <b>${c}x</b>. Find x.`, a: `x = ${180 / (a + b + c)}°` }; },
  [
    () => { const x = R(8, 16), d = R(2, 6), [n1, n2, n3] = nm3(); return { q: `${n1} is x years old. ${n2} is ${d} years older than ${n1}. ${n3} is twice as old as ${n1}.<br>Their ages add up to <b>${4 * x + d}</b>. How old is each person?`, a: `4x + ${d} = ${4 * x + d} → ${n1} ${x}, ${n2} ${x + d}, ${n3} ${2 * x}` }; },
    () => { const w = R(3, 12), d = R(2, 6); return { q: `A rectangle's length is <b>${d} cm</b> more than its width. Its perimeter is <b>${2 * (2 * w + d)} cm</b>.<br>Find the area of the rectangle.`, a: `w = ${w}, l = ${w + d}, area ${w * (w + d)} cm²` }; },
    () => { const c = R(4, 10), d = R(2, 5), na = R(2, 3), nc = R(2, 4); return { q: `An adult ticket costs <b>£${d}</b> more than a child ticket. <b>${na}</b> adult and <b>${nc}</b> child tickets cost <b>£${na * (c + d) + nc * c}</b>.<br>Find the price of a child ticket.`, a: `£${c} (adult £${c + d})` }; },
  ]);

add('inequalities', 'Inequalities', 'Algebra', ['inequalities', 'inequality', 'solve inequalities', 'number line', 'integers', 'algebra'],
  () => P([() => { const x = R(-3, 9), a = R(2, 6), b = R(-9, 9), s = P(['&lt;', '&gt;', '≤', '≥']); return { q: `Solve <b>${lin(a, b)} ${s} ${M(a * x + b)}</b>`, a: `x ${s} ${M(x)}` }; },
    () => { const a = R(-4, 1), b = R(a + 2, a + 6); const v = []; for (let n = a + 1; n <= b; n++) v.push(M(n)); return { q: `List the integers n such that <b>${M(a)} &lt; n ≤ ${M(b)}</b>`, a: v.join(', ') }; }])(),
  [
    () => { const lo = R(1, 5), hi = R(lo + 2, lo + 5), a = R(2, 4), b = R(1, 9); const v = []; for (let x = lo + 1; x <= hi; x++) v.push(x);
      return { q: `x is an integer. <b>${lin(a, b)} > ${a * lo + b}</b> and <b>x ≤ ${hi}</b>.<br>List all the possible values of x.`, a: v.join(', ') }; },
    () => { const base = P([2.5, 3, 3.5]), pm = P([1.5, 2]), have = R(15, 30); const m = Math.floor((have - base) / pm);
      return { q: `A taxi charges <b>£${base}</b> plus <b>£${pm}</b> per mile. ${nm()} has <b>£${have}</b>.<br>Write and solve an inequality to find the greatest whole number of miles they can travel.`, a: `${base} + ${pm}m ≤ ${have} → m ≤ ${C(r2((have - base) / pm))} → ${m} miles` }; },
    () => { const a = -R(2, 6), b = R(4, 10); const v = []; for (let n = Math.ceil(a / 2); 2 * n < b; n++) v.push(M(n));
      return { q: `Find all the integers n that satisfy <b>${M(a)} ≤ 2n &lt; ${b}</b>.`, a: v.join(', ') }; },
  ]);

add('sequences', 'Sequences & nth term', 'Algebra', ['sequences', 'nth term', 'term to term', 'arithmetic sequence', 'linear sequence', 'patterns'],
  () => { const d = R(2, 9) * P([1, 1, -1]), c = R(-5, 10); const t = [1, 2, 3, 4].map(n => d * n + c); return { q: `Find the nth term of <b>${t.map(M).join(', ')}, …</b>`, a: lin(d, c, 'n') }; },
  [
    () => { const d = R(3, 7), c = R(-2, 5), tgt = R(60, 140); const yes = (tgt - c) % d === 0; const t = [1, 2, 3, 4].map(n => d * n + c);
      return { q: `Is <b>${tgt}</b> a term in the sequence <b>${t.map(M).join(', ')}, …</b>? Explain how you know.`, a: `nth term ${lin(d, c, 'n')}; ${yes ? `yes, it is term ${(tgt - c) / d}` : `no – ${lin(d, c, 'n')} = ${tgt} gives n = ${C(r2((tgt - c) / d))}, not a whole number`}` }; },
    () => { const d = P([3, 4, 5]), c = P([1, 2]), k = R(15, 30); const t = [1, 2, 3].map(n => d * n + c), want = d * R(10, 20) + c;
      return { q: `Pattern 1 uses <b>${t[0]}</b> matchsticks, Pattern 2 uses <b>${t[1]}</b>, Pattern 3 uses <b>${t[2]}</b>.<br>(a) How many matchsticks are in Pattern ${k}?<br>(b) Which pattern uses <b>${want}</b> matchsticks?`, a: `(a) ${d * k + c} (b) Pattern ${(want - c) / d}` }; },
    () => { const d = R(2, 6), c = R(-4, 6), p = 3, q = 7; return { q: `In an arithmetic sequence the <b>3rd term is ${M(d * p + c)}</b> and the <b>7th term is ${M(d * q + c)}</b>.<br>Find the nth term.`, a: lin(d, c, 'n') }; },
  ]);

add('formulae', 'Formulae & rearranging', 'Algebra', ['rearranging', 'change the subject', 'formula', 'subject of a formula', 'writing formulae', 'algebra'],
  () => { const a = R(2, 9), b = R(1, 12); return P([{ q: `Make x the subject of <b>y = ${lin(a, b)}</b>`, a: `x = ${F('y − ' + b, a)}` }, { q: `Make x the subject of <b>y = ${lin(a, -b)}</b>`, a: `x = ${F('y + ' + b, a)}` }]); },
  [
    () => { const c = P([10, 15, 20, 25, 30, 35]); return { q: `To convert °C to °F: <b>F = 1.8C + 32</b>.<br>(a) Convert ${c}°C to °F.<br>(b) Rearrange the formula to make C the subject.`, a: `(a) ${C(1.8 * c + 32)}°F (b) C = ${F('F − 32', '1.8')}` }; },
    () => { const l = R(5, 15), w = R(2, l - 1); return { q: `The perimeter of a rectangle is <b>P = 2(l + w)</b>.<br>Find w when <b>P = ${2 * (l + w)}</b> and <b>l = ${l}</b>.`, a: `w = ${w}` }; },
    () => { const p = R(6, 12), f = R(1, 3); return { q: `Cinema tickets cost <b>£${p}</b> each, plus a booking fee of <b>£${f}</b> per order.<br>Write a formula for the total cost T (£) of n tickets. Use it to find n when T = £${p * R(3, 8) + f}.`, a: `T = ${p}n + ${f}` }; },
  ]);
// last ps answer needs n
TOPICS[TOPICS.length - 1].ps[2] = () => { const p = R(6, 12), f = R(1, 3), n = R(3, 8); return { q: `Cinema tickets cost <b>£${p}</b> each, plus a booking fee of <b>£${f}</b> per order.<br>Write a formula for the total cost T (£) of n tickets. Use it to find n when T = £${p * n + f}.`, a: `T = ${p}n + ${f}; n = ${n}` }; };

add('lines', 'Straight line graphs (y = mx + c)', 'Algebra', ['straight line graphs', 'y = mx + c', 'gradient', 'y-intercept', 'linear graphs', 'coordinates', 'equation of a line', 'parallel lines graph'],
  () => { const m = R(-5, 6) || 2, c = R(-8, 9); return { q: `Write down the gradient and y-intercept of <b>y = ${lin(m, c)}</b>`, a: `gradient ${M(m)}, y-intercept ${M(c)}` }; },
  [
    () => { const m = R(-4, 5) || 3, c = R(-6, 8), x1 = R(-2, 2), x2 = x1 + R(1, 4); return { q: `Find the equation of the straight line through <b>(${M(x1)}, ${M(m * x1 + c)})</b> and <b>(${M(x2)}, ${M(m * x2 + c)})</b>.`, a: `y = ${lin(m, c)}` }; },
    () => { const m = R(2, 5), c = R(-5, 6), x = R(1, 6), off = P([0, 1, -1]); const y = m * x + c + off;
      return { q: `Does the point <b>(${x}, ${M(y)})</b> lie on the line <b>y = ${lin(m, c)}</b>? Show how you know.`, a: `When x = ${x}, y = ${M(m * x + c)} → ${off === 0 ? 'yes' : 'no'}` }; },
    () => { const m = R(2, 5), c1 = R(1, 6), c2 = -R(1, 6), o = m + P([1, -1]); const lines = SH([`y = ${lin(m, c1)}`, `y = ${lin(o, c1)}`, `y = ${lin(m, c2)}`, `2y = ${lin(2 * m, 2 * R(1, 5))}`, `y = ${lin(c1, m)}`]);
      const par = lines.filter(l => l.startsWith('2y') ? true : new RegExp(`^y = ${m === 1 ? '' : m}x`).test(l) && !/^y = \d+x/.test(l.replace(`y = ${m}x`, 'Q')) );
      return { q: `Which of these lines are parallel to <b>y = ${m}x</b>?<br><b>${lines.join(' &nbsp;&nbsp; ')}</b>`, a: `Those with gradient ${m}: y = ${lin(m, c1)}, y = ${lin(m, c2)} and the 2y = ${2 * m}x… line` }; },
  ]);

add('dblbrackets', 'Expanding double brackets', 'Algebra', ['double brackets', 'expand double brackets', 'foil', 'expanding quadratics', 'algebra'],
  () => { const a = R(-7, 9) || 2, b = R(-7, 9) || 3; return { q: `Expand and simplify <b>(${lin(1, a)})(${lin(1, b)})</b>`, a: `x² ${term(a + b, 'x', false).trim() ? term(a + b, 'x', false) : ''} ${a * b === 0 ? '' : (a * b > 0 ? '+ ' : '− ') + Math.abs(a * b)}`.replace(/\s+/g, ' ') }; },
  [
    () => { const s = R(2, 9); return { q: `A square has sides of length <b>(x + ${s})</b> cm.<br>Show that its area is <b>x² + ${2 * s}x + ${s * s}</b> cm².`, a: `(x + ${s})(x + ${s}) = x² + ${s}x + ${s}x + ${s * s}` }; },
    () => { const s = R(2, 9), n = nm(); return { q: `${n} says <b>(x + ${s})² = x² + ${s * s}</b>.<br>Explain why ${n} is wrong.`, a: `(x + ${s})(x + ${s}) = x² + ${2 * s}x + ${s * s}` }; },
    () => { const a = R(2, 8), b = R(2, 8); return { q: `<b>(x + a)(x + ${b}) = x² + kx + ${a * b}</b><br>Find the values of a and k.`, a: `a = ${a}, k = ${a + b}` }; },
  ]);

add('quadratics', 'Factorising & solving quadratics', 'Algebra', ['quadratics', 'factorise quadratics', 'solve quadratics', 'quadratic equations', 'x squared', 'algebra'],
  () => { let p, q; do { p = R(-7, 8); q = R(-7, 8); } while (!p || !q); const b = p + q, c = p * q; const ex = `x²${b ? term(b, 'x', false) : ''}${term(c, '', false)}`;
    return P([{ q: `Factorise <b>${ex}</b>`, a: `(${lin(1, p)})(${lin(1, q)})` }, { q: `Solve <b>${ex} = 0</b>`, a: `x = ${M(-p)} or x = ${M(-q)}` }]); },
  [
    () => { const x = R(3, 9), k = R(2, 6); return { q: `A rectangle has width <b>x</b> cm and length <b>(x + ${k})</b> cm. Its area is <b>${x * (x + k)} cm²</b>.<br>Form and solve an equation to find x.`, a: `x² + ${k}x − ${x * (x + k)} = 0 → (x − ${x})(x + ${x + k}) = 0 → x = ${x}` }; },
    () => { const x = R(4, 9), k = R(2, 3); return { q: `I think of a positive number. I square it, then subtract <b>${k}</b> times the number. The answer is <b>${x * x - k * x}</b>.<br>What is my number?`, a: `x² − ${k}x − ${x * x - k * x} = 0 → x = ${x}` }; },
    () => { const n = R(6, 14); return { q: `The product of two consecutive integers is <b>${n * (n + 1)}</b>.<br>Find both possible pairs of integers.`, a: `${n} and ${n + 1}, or −${n + 1} and −${n}` }; },
  ]);

/* ===== GEOMETRY ===== */
add('anglesline', 'Angles on a line & around a point', 'Geometry', ['angles on a straight line', 'angles around a point', 'vertically opposite angles', 'angles', 'angle facts'],
  () => { const a = R(20, 160); return P([{ q: `Two angles on a straight line are <b>${a}°</b> and <b>x</b>. Find x.`, a: `${180 - a}°` }, { q: `Angles around a point are <b>${a}°</b>, <b>${R(30, 100)}°</b> and <b>x</b>. Find x.`, a: '' }]).a === '' ? (() => { const b = R(30, 100); return { q: `Three angles around a point are <b>${a}°</b>, <b>${b}°</b> and <b>x</b>. Find x.`, a: `${360 - a - b}°` }; })() : { q: `Two angles on a straight line are <b>${a}°</b> and <b>x</b>. Find x.`, a: `${180 - a}°` }; },
  [
    () => { const [p, q, r, s] = P([[2, 3, 4, 90], [1, 2, 3, 120], [3, 4, 5, 120], [2, 2, 5, 72], [1, 3, 4, 120]]); const x = (360 - s) / (p + q + r);
      return { q: `Four angles around a point are <b>${p === 1 ? '' : p}x</b>, <b>${q}x</b>, <b>${r}x</b> and <b>${s}°</b>.<br>Find the size of the largest angle.`, a: `x = ${x}°; largest ${Math.max(r * x, s)}°` }; },
    () => { const d = P([20, 40, 60, 8, 28]), x = (180 - d) / 4; return { q: `Three angles on a straight line are <b>x</b>, <b>x + ${d}°</b> and <b>2x</b>.<br>Find the size of each angle.`, a: `x = ${x}° → ${x}°, ${x + d}°, ${2 * x}°` }; },
    () => { const a = R(25, 85); return { q: `Two straight lines cross. One of the angles is <b>${a}°</b>.<br>Find the other three angles. Give a reason for each.`, a: `${a}° (vertically opposite), ${180 - a}° and ${180 - a}° (angles on a straight line)` }; },
  ]);

add('anglestri', 'Angles in triangles & quadrilaterals', 'Geometry', ['angles in a triangle', 'isosceles triangle', 'angles in a quadrilateral', 'triangle angles', 'angles'],
  () => { const a = R(25, 80), b = R(25, 80); return { q: `Find angle x.`, a: `${180 - a - b}°`, d: D.tri(a + '°', b + '°', 'x') }; },
  [
    () => { const a = P([40, 50, 70, 30, 80, 20]); return { q: `An isosceles triangle has one angle of <b>${a}°</b>.<br>Find the two possible pairs of values for the other two angles.`, a: `${(180 - a) / 2}° and ${(180 - a) / 2}°, or ${a}° and ${180 - 2 * a}°` }; },
    () => { const [p, q, r, s] = P([[1, 2, 3, 4], [2, 3, 3, 4], [1, 1, 2, 2], [3, 4, 5, 6], [1, 2, 2, 3]]); const x = 360 / (p + q + r + s); return { q: `The angles of a quadrilateral are <b>${p === 1 ? '' : p}x</b>, <b>${q === 1 ? '' : q}x</b>, <b>${r}x</b> and <b>${s}x</b>.<br>Find the size of the largest angle.`, a: `x = ${x}°; largest ${s * x}°` }; },
    () => { const t = 2 * R(15, 50); return { q: `Find the size of each base angle. Give reasons.`, a: `${(180 - t) / 2}° each (isosceles: base angles equal; angles in a triangle sum to 180°)`, d: D.isos(t + '°', 'x') }; },
    () => { const n = nm(); return { q: `${n} says a triangle can have two obtuse angles.<br>Is ${n} right? Explain.`, a: `No – two obtuse angles already add to more than 180°` }; },
  ]);

const PAR_REL = [['tr', 'tr', 'corresponding', 1], ['bl', 'tr', 'alternate', 1], ['bl', 'tl', 'co-interior', 0], ['tr', 'bl', 'vertically opposite then corresponding', 1]];
add('parallel', 'Angles in parallel lines', 'Geometry', ['parallel lines', 'alternate angles', 'corresponding angles', 'co-interior angles', 'allied angles', 'angles', 'transversal'],
  () => { const [pa, pb, why, eq] = P(PAR_REL.slice(0, 3)); const a = R(45, 80); return { q: `Find x. Give a reason.`, a: `${eq ? a : 180 - a}° (${why} angles${eq ? ' are equal' : ' add to 180°'})`, d: D.parallel(pa, a + '°', pb, 'x') }; },
  [
    () => { const x = R(12, 30), a = R(2, 4), b = a + R(1, 3), c = R(5, 30); const d = (b - a) * x + c; const v = a * x + c;
      if (v <= 20 || v >= 160) return TOPICS.find(t => t.id === 'parallel').ps[0]();
      return { q: `The two marked angles are <b>alternate</b>.<br>Find x, then find the size of each angle.`, a: `${lin(a, c)} = ${lin(b, c - d)} → x = ${x}; angle = ${v}°`, d: D.parallel('bl', `${a}x + ${c}`, 'tr', `${b}x − ${d - c}`) }; },
    () => { let x, a, b, c; do { x = R(15, 30); a = R(1, 3); b = R(1, 3); c = 180 - (a + b) * x; } while (c < 5 || c > 60 || a * x + c > 170 || a * x + c < 95); const A = a * x + c, Bv = b * x;
      return { q: `The two marked angles are <b>co-interior</b>.<br>Find x and the size of each angle.`, a: `${a === 1 ? '' : a}x + ${c} + ${b === 1 ? '' : b}x = 180 → x = ${x}; angles ${A}° and ${Bv}°`, d: D.parallel('bl', `${a === 1 ? '' : a}x + ${c}`, 'tl', `${b === 1 ? '' : b}x`) }; },
    () => { const a = R(50, 75); return { q: `Find angle x. Show each step and give reasons.`, a: `${a}° (vertically opposite) then ${a}° corresponding → x = ${a}°`, d: D.parallel('tr', a + '°', 'bl', 'x') }; },
  ]);

add('polygons', 'Angles in polygons', 'Geometry', ['polygons', 'interior angles', 'exterior angles', 'regular polygon', 'pentagon', 'hexagon', 'octagon', 'angles'],
  () => { const [n, name] = P([[5, 'pentagon'], [6, 'hexagon'], [8, 'octagon'], [10, 'decagon'], [7, 'heptagon']]); return P([{ q: `Find the sum of the interior angles of a <b>${name}</b>`, a: `${(n - 2) * 180}°` }, { q: `Find the size of each exterior angle of a regular <b>${name}</b>`, a: `${C(r2(360 / n))}°` }]); },
  [
    () => { const n = P([8, 9, 10, 12, 15, 18, 20, 24]); return { q: `Each exterior angle of a regular polygon is <b>${360 / n}°</b>.<br>How many sides does it have? What is each interior angle?`, a: `${n} sides; interior ${180 - 360 / n}°` }; },
    () => { const ang = P([130, 144, 150, 135, 125, 160, 155]); const ext = 180 - ang, ok = 360 % ext === 0;
      return { q: `Could a regular polygon have an interior angle of <b>${ang}°</b>? Explain your answer.`, a: `Exterior = ${ext}°, 360 ÷ ${ext} = ${C(r2(360 / ext))} → ${ok ? `yes, ${360 / ext} sides` : 'no, not a whole number of sides'}` }; },
    () => { const a = [R(95, 120), R(95, 120), R(95, 120), R(95, 120)]; const x = 540 - a.reduce((s, v) => s + v, 0); if (x < 60 || x > 175) return TOPICS.find(t => t.id === 'polygons').ps[2]();
      return { q: `A pentagon has angles <b>${a.join('°, ')}°</b> and <b>x</b>.<br>Find x.`, a: `540 − ${540 - x} = ${x}°` }; },
  ]);

add('area', 'Perimeter & area', 'Geometry', ['area', 'perimeter', 'rectangle', 'area of a triangle', 'compound shapes', 'parallelogram', 'trapezium', 'composite shapes'],
  () => P([() => { const a = R(4, 15), b = R(3, 12); return { q: `Find the area and perimeter.`, a: `area ${a * b} cm², perimeter ${2 * (a + b)} cm`, d: D.rect(a + ' cm', b + ' cm') }; },
    () => { const b = R(4, 16), h = R(3, 12); return { q: `A triangle has base <b>${b} cm</b> and height <b>${h} cm</b>. Find its area.`, a: `${C(b * h / 2)} cm²` }; },
    () => { const a = R(3, 9), b = R(a + 2, 14), h = R(3, 9); return { q: `A trapezium has parallel sides <b>${a} cm</b> and <b>${b} cm</b> and height <b>${h} cm</b>. Find its area.`, a: `${C((a + b) / 2 * h)} cm²` }; }])(),
  [
    () => { const W = R(8, 14), H = R(6, 10), cw = R(2, W - 4), ch = R(2, H - 3); const area = W * H - cw * ch, per = 2 * (W + H);
      return { q: `Find the area and the perimeter of this shape. All lengths are in cm.`, a: `area ${area} cm², perimeter ${per} cm`, d: D.lshape(W, H, cw, ch, { top: W - cw, left: H, bottom: W, right: H - ch, inH: '', inV: '' }) }; },
    () => { const l = R(6, 14), w = R(2, l - 1); return { q: `A rectangle has a perimeter of <b>${2 * (l + w)} cm</b>. Its length is <b>${l} cm</b>.<br>Find its area.`, a: `width ${w} cm, area ${l * w} cm²` }; },
    () => { const l = R(3, 6), w = P([2.5, 3, 3.5, 4]), t = 0.5, pr = P([1.8, 2.4, 3.2]); const n = (l / t) * (w / t);
      return { q: `A floor is <b>${l} m</b> by <b>${w} m</b>. It is covered with square tiles of side <b>50 cm</b>. Tiles cost <b>${GBP(pr)}</b> each.<br>How much will the tiles cost?`, a: `${l / t} × ${w / t} = ${n} tiles → ${GBP(r2(n * pr))}` }; },
    () => { const s = P([4, 6, 8, 10, 12]); const a = s * s; let L, W; do { W = P([2, 3, 4, 6, 8]); L = a / W; } while (!Number.isInteger(L) || L === W);
      return { q: `A square and a rectangle have the same area. The rectangle is <b>${L} cm</b> by <b>${W} cm</b>.<br>Find the perimeter of the square.`, a: `area ${a} cm² → side ${s} cm → perimeter ${4 * s} cm` }; },
  ]);

add('circles', 'Circles: circumference & area', 'Geometry', ['circle', 'circles', 'circumference', 'area of a circle', 'pi', 'radius', 'diameter', 'semicircle'],
  () => { const r = R(2, 15), t = P(['r', 'd']); const lab = t === 'r' ? r + ' cm' : 2 * r + ' cm'; return P([{ q: `Find the area of the circle. Give your answer to 1 d.p.`, a: `${fx(Math.PI * r * r, 1)} cm²`, d: D.circle(lab, t) }, { q: `Find the circumference of the circle to 1 d.p.`, a: `${fx(2 * Math.PI * r, 1)} cm`, d: D.circle(lab, t) }]); },
  [
    () => { const d = R(4, 12), c = P([8.5, 12.5, 15]); const L = Math.PI * d; return { q: `A circular pond has a diameter of <b>${d} m</b>. Fencing costs <b>${GBP(c)}</b> per metre.<br>How much does it cost to fence all the way round?`, a: `${fx(L, 2)} m → ${GBP(r2(L * c))}` }; },
    () => { const d = P([6, 8, 10, 12, 14, 20]); return { q: `A semicircle has a diameter of <b>${d} cm</b>.<br>Find its perimeter and its area to 1 d.p.`, a: `perimeter ${fx(Math.PI * d / 2 + d, 1)} cm, area ${fx(Math.PI * (d / 2) * (d / 2) / 2, 1)} cm²` }; },
    () => { const r = P([30, 35, 40, 25]); const C0 = 2 * Math.PI * r; return { q: `A bicycle wheel has a radius of <b>${r} cm</b>.<br>How many complete turns does it make when the bike travels <b>1 km</b>?`, a: `circumference ${fx(C0, 1)} cm; 100 000 ÷ ${fx(C0, 1)} = ${fx(100000 / C0, 1)} → ${Math.floor(100000 / C0)} complete turns` }; },
  ]);

add('volume', 'Volume & surface area', 'Geometry', ['volume', 'surface area', 'cuboid', 'prism', 'cube', 'capacity', '3d shapes'],
  () => { const l = R(3, 12), w = R(2, 8), h = R(2, 9); return P([{ q: `Find the volume of the cuboid.`, a: `${l * w * h} cm³`, d: D.cuboid(l + ' cm', w + ' cm', h + ' cm') }, { q: `Find the surface area of the cuboid.`, a: `${2 * (l * w + l * h + w * h)} cm²`, d: D.cuboid(l + ' cm', w + ' cm', h + ' cm') }]); },
  [
    () => { const c = P([2, 3, 5]), a = c * R(2, 5), b = c * R(2, 4), h = c * R(1, 3); return { q: `How many <b>${c} cm</b> cubes will fit exactly into a box measuring <b>${a} cm × ${b} cm × ${h} cm</b>?`, a: `${a / c} × ${b / c} × ${h / c} = ${(a / c) * (b / c) * (h / c)}` }; },
    () => { const l = P([40, 50, 60, 80]), w = P([25, 30, 40]), h = P([30, 40, 50]), f = P([[3, 4], [1, 2], [2, 3]]); const v = l * w * h * f[0] / f[1];
      return { q: `A fish tank is <b>${l} cm × ${w} cm × ${h} cm</b>. It is filled ${F(f[0], f[1])} full of water.<br>How many litres of water are in the tank? (1 litre = 1000 cm³)`, a: `${C(v)} cm³ = ${C(v / 1000)} litres` }; },
    () => { const s = R(2, 9); return { q: `A cube has a surface area of <b>${6 * s * s} cm²</b>.<br>Find its volume.`, a: `face ${s * s} cm² → side ${s} cm → ${s * s * s} cm³` }; },
  ]);

const TRIPLES = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [7, 24, 25], [9, 12, 15], [12, 16, 20]];
add('pythag', "Pythagoras' theorem", 'Geometry', ['pythagoras', 'hypotenuse', 'right-angled triangle', 'pythagoras theorem', 'missing side'],
  () => { const a = R(3, 12), b = R(3, 12); return P([{ q: `Find the length of the hypotenuse to 1 d.p.`, a: `${fx(Math.hypot(a, b), 1)} cm`, d: D.rtri(a + ' cm', b + ' cm', 'x') }, { q: `Find the missing side to 1 d.p.`, a: `${fx(Math.sqrt((a + b) ** 2 - b * b), 1)} cm`, d: D.rtri('x', b + ' cm', (a + b) + ' cm') }]); },
  [
    () => { const L = P([4, 5, 6]), f = P([1, 1.2, 1.5, 1.8]); return { q: `A ladder <b>${L} m</b> long leans against a vertical wall. The foot of the ladder is <b>${f} m</b> from the wall.<br>How high up the wall does it reach? Give your answer to 2 d.p.`, a: `√(${L}² − ${f}²) = ${fx(Math.sqrt(L * L - f * f), 2)} m` }; },
    () => { const t = P(TRIPLES), k = P([0, 1]), s = k ? t : [t[0], t[1], t[2] + 1]; return { q: `A triangle has sides <b>${s.join(' cm, ')} cm</b>.<br>Is it a right-angled triangle? Show how you know.`, a: `${s[0]}² + ${s[1]}² = ${s[0] ** 2 + s[1] ** 2}, ${s[2]}² = ${s[2] ** 2} → ${k ? 'yes' : 'no'}` }; },
    () => { const [a, b, c] = P(TRIPLES), x1 = R(-3, 4), y1 = R(-3, 4); return { q: `Find the distance between the points <b>(${M(x1)}, ${M(y1)})</b> and <b>(${M(x1 + a)}, ${M(y1 + b)})</b>.`, a: `√(${a}² + ${b}²) = ${c}` }; },
  ]);

add('trig', 'Trigonometry (SOH CAH TOA)', 'Geometry', ['trigonometry', 'sohcahtoa', 'sin', 'cos', 'tan', 'trig', 'angle of elevation'],
  () => { const h = R(5, 15), ang = R(25, 65); const rad = ang * Math.PI / 180; return P([{ q: `Find x to 1 d.p.`, a: `${fx(h * Math.sin(rad), 1)} cm (x = ${h} sin ${ang}°)`, d: D.rtri('', 'x', h + ' cm', ang + '°') }, { q: `Find x to 1 d.p.`, a: `${fx(h * Math.cos(rad), 1)} cm (x = ${h} cos ${ang}°)`, d: D.rtri('x', '', h + ' cm', ang + '°') }]); },
  [
    () => { const L = P([3, 4, 5, 6]), r = P([0.4, 0.5, 0.6, 0.8]); return { q: `A ramp is <b>${L} m</b> long and rises <b>${r} m</b> vertically.<br>Find the angle the ramp makes with the ground, to 1 d.p.`, a: `sin⁻¹(${r} ÷ ${L}) = ${fx(Math.asin(r / L) * 180 / Math.PI, 1)}°` }; },
    () => { const L = R(20, 50), a = R(35, 65); return { q: `A kite string is <b>${L} m</b> long and makes an angle of <b>${a}°</b> with the ground.<br>How high is the kite? (Assume the string is straight.)`, a: `${L} sin ${a}° = ${fx(L * Math.sin(a * Math.PI / 180), 1)} m` }; },
    () => { const d = R(15, 40), a = R(25, 50); return { q: `${nm()} stands <b>${d} m</b> from the base of a tree. The angle of elevation to the top of the tree is <b>${a}°</b>.<br>How tall is the tree? (Ignore ${''}their height.)`, a: `${d} tan ${a}° = ${fx(d * Math.tan(a * Math.PI / 180), 1)} m` }; },
  ]);

/* ===== PROBABILITY ===== */
add('probability', 'Probability basics', 'Probability', ['probability', 'chance', 'likely', 'dice', 'spinner', 'counters', 'probability scale'],
  () => { const r = R(1, 6), b = R(1, 6), g = R(1, 6); const col = P([['red', r], ['blue', b], ['green', g]]); return { q: `A bag has <b>${r} red</b>, <b>${b} blue</b> and <b>${g} green</b> counters. One is taken at random. Find P(${col[0]}).`, a: FS(col[1], r + b + g) }; },
  [
    () => { const pr = R(2, 4) * 0.1, pb = R(2, 4) * 0.1 + 0.05; const pg = +(1 - pr - pb).toFixed(2), n = P([100, 200, 400]);
      return { q: `A spinner can land on red, blue or green.<br>P(red) = <b>${pr.toFixed(1)}</b>, P(blue) = <b>${pb.toFixed(2)}</b>.<br>(a) Find P(green).<br>(b) The spinner is spun <b>${n}</b> times. How many greens would you expect?`, a: `(a) ${pg} (b) ${C(pg * n)}` }; },
    () => { let a, b; do { a = R(1, 4); b = R(2, 5); } while (gcd(a, b) > 1 || a === b); const k = R(2, 6);
      return { q: `A bag has red and blue counters in the ratio <b>${a} : ${b}</b>. There are <b>${a * k}</b> red counters.<br>(a) How many blue counters are there?<br>(b) Find P(blue).`, a: `(a) ${b * k} (b) ${F(b, a + b)}` }; },
    () => { const n = R(3, 6), x = nm(); return { q: `A fair coin lands on heads <b>${n} times in a row</b>. ${x} says the next flip is more likely to be tails.<br>Is ${x} right? Explain.`, a: `No – each flip is independent; P(tails) is still ${F(1, 2)}` }; },
  ]);

add('relfreq', 'Relative frequency & expected outcomes', 'Probability', ['relative frequency', 'expected frequency', 'experimental probability', 'estimate probability', 'fair', 'biased'],
  () => { const n = P([50, 100, 200, 250]), k = R(2, 9) * n / 50; return { q: `A spinner landed on a 5 on <b>${k}</b> occasions in <b>${n}</b> spins. Find the relative frequency of landing on 5.`, a: `${FS(k, n)} = ${C(k / n)}` }; },
  [
    () => { const n = P([120, 180, 240, 300, 600]), exp = n / 6, six = Math.round(exp * P([1.4, 1.5, 0.98, 1.02, 1.6])); return { q: `A dice is rolled <b>${n}</b> times. It lands on six <b>${six}</b> times.<br>Do you think the dice is fair? Explain.`, a: `Expected ${exp} sixes; got ${six} → ${Math.abs(six - exp) / exp > 0.2 ? 'probably biased' : 'probably fair (close to expected)'}` }; },
    () => { const p = P([0.05, 0.1, 0.15, 0.2, 0.25]), d = P([20, 40, 60, 180]); return { q: `The probability that a train is late on any day is <b>${p}</b>.<br>How many days would you expect it to be late in <b>${d}</b> days?`, a: C(p * d) }; },
    () => { const t = [10, 50, 100, 500], hits = [R(2, 6), R(12, 22), R(25, 40), R(140, 175)]; return { q: `${nm()} throws a drawing pin and records how often it lands point up.<br>${table(['Throws', ...t], [['Point up', ...hits]])}Give the best estimate of P(point up). Explain your choice.`, a: `${FS(hits[3], 500)} = ${C(hits[3] / 500)} – most throws gives the most reliable estimate` }; },
  ]);

add('combined', 'Combined events & sample spaces', 'Probability', ['sample space', 'two way table', 'combined events', 'listing outcomes', 'product rule', 'tree diagram', 'two dice'],
  () => P([{ q: `Two fair coins are flipped. List all the outcomes and find P(two heads).`, a: `HH, HT, TH, TT; ${F(1, 4)}` }, { q: `Two fair coins are flipped. Find P(one head and one tail).`, a: F(1, 2) }, (() => { const t = R(2, 12); let c = 0; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b === t) c++; return { q: `Two dice are rolled and the scores added. Find P(total = <b>${t}</b>).`, a: FS(c, 36) }; })()]),
  [
    () => { const t = P([7, 8, 9, 10]); let c = 0; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b >= t) c++; return { q: `Two fair dice are rolled and the scores are added.<br>Draw a sample space diagram and find P(total is <b>${t} or more</b>).`, a: `${c}/36 = ${FS(c, 36)}` }; },
    () => { const s = R(2, 5), m = R(3, 6), d = R(2, 4); return { q: `A café offers <b>${s}</b> starters, <b>${m}</b> mains and <b>${d}</b> desserts.<br>How many different three-course meals are possible? How many if you skip the starter?`, a: `${s * m * d}; ${m * d}` }; },
    () => { const A = R(3, 5), B = R(2, 4); let ev = 0; for (let a = 1; a <= A; a++) for (let b = 1; b <= B; b++) if ((a * b) % 2 === 0) ev++; return { q: `Spinner A is numbered 1 to ${A}. Spinner B is numbered 1 to ${B}. Both are spun and the scores <b>multiplied</b>.<br>Find P(the answer is even).`, a: `${ev}/${A * B} = ${FS(ev, A * B)}` }; },
  ]);

/* ===== STATISTICS ===== */
add('averages', 'Averages & range', 'Statistics', ['mean', 'median', 'mode', 'range', 'averages', 'average'],
  () => { const v = Array.from({ length: P([5, 6, 7]) }, () => R(1, 20)); const s = v.slice().sort((a, b) => a - b), n = v.length; const med = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
    return P([{ q: `Find the mean of <b>${v.join(', ')}</b>`, a: C(r2(v.reduce((a, b) => a + b, 0) / n)) }, { q: `Find the median of <b>${v.join(', ')}</b>`, a: C(med) }, { q: `Find the range of <b>${v.join(', ')}</b>`, a: s[n - 1] - s[0] }]); },
  [
    () => { const v = [R(2, 9), R(5, 12), R(6, 14), R(8, 16)], mean = R(8, 12), fifth = mean * 5 - v.reduce((a, b) => a + b, 0); if (fifth < 0) return TOPICS.find(t => t.id === 'averages').ps[0]();
      return { q: `Five numbers have a mean of <b>${mean}</b>. Four of the numbers are <b>${v.join(', ')}</b>.<br>Find the fifth number.`, a: `${mean * 5} − ${v.reduce((a, b) => a + b, 0)} = ${fifth}` }; },
    () => { let v; do { v = Array.from({ length: 5 }, () => R(1, 15)).sort((a, b) => a - b); } while (v.reduce((a, b) => a + b, 0) % 5); const mean = v.reduce((a, b) => a + b, 0) / 5;
      return { q: `Write down <b>five</b> numbers that have a mean of <b>${mean}</b>, a median of <b>${v[2]}</b> and a range of <b>${v[4] - v[0]}</b>.`, a: `e.g. ${v.join(', ')}` }; },
    () => { const n = R(4, 6), m1 = R(150, 165), m2 = m1 + R(1, 3); return { q: `The mean height of <b>${n}</b> people is <b>${m1} cm</b>. Another person joins the group and the mean height becomes <b>${m2} cm</b>.<br>How tall is the new person?`, a: `${(n + 1) * m2} − ${n * m1} = ${(n + 1) * m2 - n * m1} cm` }; },
  ]);

add('freqtable', 'Averages from frequency tables', 'Statistics', ['frequency table', 'mean from a table', 'grouped data', 'estimate the mean', 'frequency', 'averages'],
  () => { const x = [0, 1, 2, 3, 4], f = x.map(() => R(1, 9)); const n = f.reduce((a, b) => a + b, 0), s = x.reduce((a, v, i) => a + v * f[i], 0);
    return { q: `Find the mean number of goals.${table(['Goals', ...x], [['Frequency', ...f]])}`, a: `${s} ÷ ${n} = ${C(r2(s / n))}` }; },
  [
    () => { const g = [[0, 10], [10, 20], [20, 30], [30, 40]], f = g.map(() => R(2, 12)); const n = f.reduce((a, b) => a + b, 0), s = g.reduce((a, [lo, hi], i) => a + (lo + hi) / 2 * f[i], 0);
      return { q: `The table shows the times taken (minutes) to finish a puzzle. Estimate the mean time.${table(['Time t (min)', 'Frequency'], g.map(([lo, hi], i) => [`${lo} &lt; t ≤ ${hi}`, f[i]]))}`, a: `Σfx = ${s}, n = ${n} → ${C(r2(s / n))} min` }; },
    () => { const x = [1, 2, 3, 4], f = [R(2, 6), R(3, 8), 0, R(2, 5)]; let k; let mean; for (k = 1; k <= 12; k++) { const ff = f.slice(); ff[2] = k; const n = ff.reduce((a, b) => a + b, 0), s = x.reduce((a, v, i) => a + v * ff[i], 0); if (Number.isInteger(s / n * 10)) { mean = s / n; break; } } if (!mean) return TOPICS.find(t => t.id === 'freqtable').ps[0]();
      return { q: `The mean number of pets is <b>${mean}</b>. Find the missing frequency, k.${table(['Pets', ...x], [['Frequency', f[0], f[1], 'k', f[3]]])}`, a: `k = ${k}` }; },
    () => { const x = [1, 2, 3, 4, 5], f = x.map(() => R(1, 8)); const n = f.reduce((a, b) => a + b, 0); let c = 0, med; const pos = (n + 1) / 2; for (let i = 0; i < 5; i++) { c += f[i]; if (c >= pos && med === undefined) med = x[i]; }
      if (!Number.isInteger(pos)) return { q: `Find the median and the mode shoe size group.${table(['Size', 3, 4, 5, 6, 7], [['Frequency', ...f]])}`, a: '' };
      return { q: `Find the median and the mode number of siblings.${table(['Siblings', ...x], [['Frequency', ...f]])}`, a: `median ${med} (${pos}th value), mode ${x[f.indexOf(Math.max(...f))]}` }; },
  ]);
// make the median template always valid (odd total)
TOPICS[TOPICS.length - 1].ps[2] = () => { const x = [0, 1, 2, 3, 4]; let f; do { f = x.map(() => R(1, 8)); } while (f.reduce((a, b) => a + b, 0) % 2 === 0 || new Set(f).size < 5 && f.filter(v => v === Math.max(...f)).length > 1);
  const n = f.reduce((a, b) => a + b, 0), pos = (n + 1) / 2; let c = 0, med; for (let i = 0; i < 5; i++) { c += f[i]; if (c >= pos && med === undefined) med = x[i]; }
  return { q: `Find the median and the mode number of siblings.${table(['Siblings', ...x], [['Frequency', ...f]])}`, a: `median ${med} (the ${pos}th value), mode ${x[f.indexOf(Math.max(...f))]}` }; };

add('piecharts', 'Pie charts', 'Statistics', ['pie chart', 'pie charts', 'angles in a pie chart', 'charts', 'graphs'],
  () => { const t = P([36, 60, 90, 120]), k = t / 360; const f = R(1, Math.floor(t / 3)); return { q: `In a survey of <b>${t}</b> people, <b>${f}</b> chose tea. What angle would tea have in a pie chart?`, a: `${C(r2(f * 360 / t))}°` }; },
  [
    () => { const t = P([72, 90, 120, 180]), a = P([30, 60, 90, 120, 150]); return { q: `A pie chart shows how <b>${t}</b> students travel to school. The angle for walking is <b>${a}°</b>.<br>How many students walk?`, a: `${a}/360 × ${t} = ${C(a * t / 360)}` }; },
    () => { const t = P([36, 60, 90, 120]); let v; do { const a = R(1, t / 3), b = R(1, t / 3), c = R(1, t / 3); v = [a, b, c, t - a - b - c]; } while (v[3] < 1 || v.some(x => (x * 360) % t));
      return { q: `Work out the angle for each type of transport in a pie chart.${table(['Bus', 'Car', 'Walk', 'Cycle'], [v])}`, a: v.map(x => x * 360 / t + '°').join(', ') }; },
    () => { const a = P([24, 36, 40]), b = P([60, 72, 90]); const ang = 90, n = nm(); return { q: `Two pie charts show favourite sports. Class A has <b>${a}</b> students, Class B has <b>${b}</b>. Both pie charts show <b>${ang}°</b> for football.<br>${n} says the same number of students like football in each class. Is ${n} right?`, a: `No – A: ${a / 4}, B: ${b / 4}` }; },
  ]);

add('venn', 'Venn diagrams & sets', 'Statistics', ['venn diagrams', 'venn', 'sets', 'two way tables', 'probability from venn'],
  () => { const t = R(25, 35), b = R(3, 7), f = R(b + 3, 15), te = R(b + 3, 14); const ne = t - (f + te - b); if (ne < 0) return { q: `${t} students: ${f} play football, ${te} tennis and ${b} both. How many play neither?`, a: '–' };
    return { q: `<b>${t}</b> students: <b>${f}</b> play football, <b>${te}</b> play tennis, <b>${b}</b> play both. How many play neither?`, a: ne }; },
  [
    () => { const both = R(3, 8), onlyA = R(4, 12), onlyB = R(4, 12), ne = R(2, 8), t = both + onlyA + onlyB + ne; return { q: `In a class of <b>${t}</b>, <b>${onlyA + both}</b> have a dog, <b>${onlyB + both}</b> have a cat and <b>${ne}</b> have neither.<br>Draw a Venn diagram. A student is picked at random. Find P(they have a dog and a cat).`, a: `both = ${both}; P = ${FS(both, t)}` }; },
    () => { const ev = [2, 4, 6, 8, 10, 12, 14], m3 = [3, 6, 9, 12, 15]; return { q: `ξ = {whole numbers 1 to 15}. A = {even numbers}. B = {multiples of 3}.<br>Draw a Venn diagram. Find P(A ∩ B) and P(A ∪ B).`, a: `A ∩ B = {6, 12} → ${F(2, 15)}; A ∪ B has 10 numbers → ${F(2, 3)}` }; },
  ]);

/* ---------------- tidy overrides ---------------- */
const byId = id => TOPICS.find(t => t.id === id);
byId('units').flu = () => { const k = P([['km', 'm', 1000], ['m', 'cm', 100], ['kg', 'g', 1000], ['litres', 'ml', 1000], ['cm', 'mm', 10]]), v = R(2, 95) / 10, t = R(0, 2);
  if (t === 0) return { q: `Convert <b>${C(v)} ${k[0]}</b> to ${k[1]}`, a: `${C(v * k[2])} ${k[1]}` };
  if (t === 1) return { q: `Convert <b>${C(+(v * k[2]).toFixed(2))} ${k[1]}</b> to ${k[0]}`, a: `${C(v)} ${k[0]}` };
  const h = P([1.5, 2.25, 3.75, 0.4, 1.2]); return { q: `How many minutes are in <b>${h} hours</b>?`, a: `${C(h * 60)} minutes` }; };
byId('anglesline').flu = () => { const a = R(20, 160); if (R(0, 1)) return { q: `Two angles on a straight line are <b>${a}°</b> and <b>x</b>. Find x.`, a: `${180 - a}°` };
  const b = R(30, 100), c = R(30, 130); return { q: `Three angles around a point are <b>${b}°</b>, <b>${c}°</b> and <b>x</b>. Find x.`, a: `${360 - b - c}°` }; };
byId('lines').ps[2] = () => { const m = R(2, 5), c1 = R(1, 6), c2 = -R(1, 6), k = R(1, 5); const g2 = c1 === m ? c1 + 1 : c1;
  const par = [`y = ${lin(m, c1)}`, `y = ${lin(m, c2)}`, `2y = ${lin(2 * m, 2 * k)}`], oth = [`y = ${lin(m + 1, c1)}`, `y = ${lin(g2, m)}`];
  return { q: `Which of these lines are parallel to <b>y = ${m}x</b>?<br><b>${SH([...par, ...oth]).join(' &nbsp;&nbsp; ')}</b>`, a: par.join(', ') + ` (all have gradient ${m})` }; };
byId('dblbrackets').flu = () => { let a, b; do { a = R(-7, 9); b = R(-7, 9); } while (!a || !b); return { q: `Expand and simplify <b>(${lin(1, a)})(${lin(1, b)})</b>`, a: `x²${a + b ? term(a + b, 'x', false) : ''}${term(a * b, '', false)}` }; };
byId('venn').flu = () => { for (;;) { const t = R(25, 35), b = R(3, 7), f = R(b + 3, 15), te = R(b + 3, 14), ne = t - (f + te - b); if (ne >= 0) return { q: `<b>${t}</b> students: <b>${f}</b> play football, <b>${te}</b> play tennis, <b>${b}</b> play both. How many play neither?`, a: String(ne) }; } };
byId('trig').ps[2] = () => { const d = R(15, 40), a = R(25, 50); return { q: `${nm()} stands <b>${d} m</b> from the base of a tree. The angle of elevation to the top of the tree is <b>${a}°</b>.<br>How tall is the tree? (Ignore eye height.)`, a: `${d} tan ${a}° = ${fx(d * Math.tan(a * Math.PI / 180), 1)} m` }; };
byId('place').ps[3] = () => { const v = [R(2, 9) * 1000 + R(1, 9) * 100, R(2, 9) * 1000 + R(1, 9) * 10, R(20, 99) * 100 + R(1, 9)], tot = v[0] + v[1] + v[2], claim = Math.round(tot / 1000) * 1000 + P([-1000, 1000]);
  return { q: `Three schools raised <b>£${C(v[0])}</b>, <b>£${C(v[1])}</b> and <b>£${C(v[2])}</b>. ${nm()} says the total is more than <b>£${C(claim)}</b>.<br>Is this right? Show how you decide.`, a: `Total £${C(tot)} → ${tot > claim ? 'yes' : 'no'}` }; };

byId('forming').flu = () => { if (R(0, 1)) { const x = P([20, 30, 36, 18, 12]); const [a, b, c] = x === 30 ? [1, 2, 3] : x === 20 ? [2, 3, 4] : x === 36 ? [1, 1, 3] : x === 18 ? [3, 3, 4] : [3, 4, 8]; return { q: `The angles in a triangle are <b>${a === 1 ? '' : a}x</b>, <b>${b === 1 ? '' : b}x</b> and <b>${c}x</b>. Find x.`, a: `x = ${180 / (a + b + c)}°` }; }
  const x = R(2, 12), k = R(1, 6); return { q: `Each side of a square is <b>(x + ${k}) cm</b>. Its perimeter is <b>${4 * (x + k)} cm</b>. Find x.`, a: `x = ${x}` }; };
byId('venn').ps[1] = () => { const N = R(12, 20); let a, b; do { a = R(2, 5); b = R(2, 6); } while (a === b || b % a === 0 || a % b === 0);
  const A = [], B = []; for (let i = 1; i <= N; i++) { if (i % a === 0) A.push(i); if (i % b === 0) B.push(i); } const I = A.filter(v => B.includes(v)), U = new Set([...A, ...B]).size;
  return { q: `ξ = {whole numbers 1 to ${N}}. A = {multiples of ${a}}. B = {multiples of ${b}}.<br>Draw a Venn diagram. Find P(A ∩ B) and P(A ∪ B).`, a: `A ∩ B = {${I.join(', ') || 'none'}} → ${FS(I.length, N)}; A ∪ B has ${U} numbers → ${FS(U, N)}` }; };
byId('venn').ps.push(() => { const t = R(40, 60), y = R(5, 12), both = R(3, 9), x = R(8, 16), ne = t - x - y - both; if (ne < 2) return byId('venn').ps[0]();
  return { q: `<b>${t}</b> people were asked if they like coffee (C) or tea (T). <b>${x + both}</b> like coffee, <b>${y + both}</b> like tea and <b>${ne}</b> like neither.<br>How many like both? A person is chosen at random – find P(likes tea only).`, a: `both = ${both}; P(tea only) = ${FS(y, t)}` }; });
byId('anglesline').ps[0] = () => { for (;;) { const p = R(1, 4), q = R(1, 4), r = R(2, 5), x = R(10, 30), s = 360 - (p + q + r) * x; if (s < 40 || s > 160) continue;
  const tx = v => (v === 1 ? '' : v) + 'x'; return { q: `Four angles around a point are <b>${tx(p)}</b>, <b>${tx(q)}</b>, <b>${tx(r)}</b> and <b>${s}°</b>.<br>Find x and the size of the largest angle.`, a: `x = ${x}°; largest ${Math.max(p * x, q * x, r * x, s)}°` }; } };

byId('pythag').ps.push(
  () => { const [a, b, c] = P(TRIPLES); const k = P([1, 2, 10]); return { q: `A rectangular field is <b>${a * k} m</b> by <b>${b * k} m</b>. ${nm()} walks diagonally across it instead of round two sides.<br>How much shorter is the diagonal route?`, a: `diagonal ${c * k} m; ${(a + b - c) * k} m shorter` }; },
  () => { const base = P([6, 8, 10, 12]), side = base / 2 + R(2, 6); return { q: `An isosceles triangle has two sides of <b>${side} cm</b> and a base of <b>${base} cm</b>.<br>Find its height and its area, to 1 d.p.`, a: `height √(${side}² − ${base / 2}²) = ${fx(Math.sqrt(side * side - base * base / 4), 1)} cm; area ${fx(base / 2 * Math.sqrt(side * side - base * base / 4), 1)} cm²` }; });
byId('trig').ps.push(
  () => { const h = R(20, 60), a = R(20, 40); return { q: `From the top of a <b>${h} m</b> cliff, the angle of depression to a boat is <b>${a}°</b>.<br>How far is the boat from the foot of the cliff?`, a: `${h} ÷ tan ${a}° = ${fx(h / Math.tan(a * Math.PI / 180), 1)} m` }; },
  () => { const o = R(3, 9), adj = R(4, 12); return { q: `A right-angled triangle has shorter sides <b>${o} cm</b> and <b>${adj} cm</b>.<br>Find the smallest angle in the triangle, to 1 d.p.`, a: `tan⁻¹(${Math.min(o, adj)} ÷ ${Math.max(o, adj)}) = ${fx(Math.atan(Math.min(o, adj) / Math.max(o, adj)) * 180 / Math.PI, 1)}°` }; });
byId('circles').ps.push(
  () => { const s = P([10, 12, 14, 16, 20]); const r = s / 2; return { q: `A circle fits exactly inside a square of side <b>${s} cm</b>.<br>Find the area of the square that is <b>not</b> covered by the circle, to 1 d.p.`, a: `${s * s} − π × ${r}² = ${fx(s * s - Math.PI * r * r, 1)} cm²` }; },
  () => { const A = P([50, 100, 154, 200, 314]); return { q: `A circle has an area of <b>${A} cm²</b>.<br>Find its radius and its circumference, to 1 d.p.`, a: `r = √(${A} ÷ π) = ${fx(Math.sqrt(A / Math.PI), 1)} cm; C = ${fx(2 * Math.PI * Math.sqrt(A / Math.PI), 1)} cm` }; });

/* ---------------- generation & search ---------------- */
function make(topic, kind, n) {
  const out = [], seen = new Set(); let tries = 0;
  const fns = kind === 'ps' ? topic.ps : [topic.flu];
  let order = SH(fns.map((_, i) => i));
  while (out.length < n && tries < 200) {
    tries++;
    const fn = fns[order[out.length % order.length]];
    let q; try { q = fn(); } catch (e) { continue; }
    if (!q || !q.q || q.a === undefined || q.a === '' || /NaN|undefined|Infinity/.test(q.q + q.a)) continue;
    const key = q.q + '|' + (q.d || '');
    if (seen.has(key)) continue;
    seen.add(key); out.push(q);
    if (out.length % order.length === 0) order = SH(order);
  }
  return out;
}
function search(query) {
  const q = query.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 1);
  if (!q.length) return TOPICS.slice();
  const stem = w => w.replace(/(ing|ion|s|es)$/, '');
  return TOPICS.map(t => {
    const hay = (t.name + ' ' + t.keys.join(' ') + ' ' + t.strand).toLowerCase(); const words = hay.replace(/[^a-z0-9 ]/g, ' ').split(/\s+/);
    let s = 0;
    if (t.name.toLowerCase().includes(query.toLowerCase().trim())) s += 10;
    if (t.keys.some(k => k === query.toLowerCase().trim())) s += 12;
    const nameWords = t.name.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/);
    for (const w of q) { const sw = stem(w); let best = 0; if (nameWords.some(h => h === w || stem(h) === sw)) best = 4.5; for (const h of words) { const sh = stem(h); if (h === w) best = Math.max(best, 4); else if (sh === sw && sw.length > 2) best = Math.max(best, 3.5); else if (sw.length > 2 && (h.startsWith(sw) || sh.startsWith(sw))) best = Math.max(best, 2.5); else if (sh.length > 3 && sw.startsWith(sh)) best = Math.max(best, 1.5); } s += best; }
    return [s, t];
  }).filter(x => x[0] > 0).sort((a, b) => b[0] - a[0]).map(x => x[1]);
}
window.QB = { TOPICS, make, search };
})();
