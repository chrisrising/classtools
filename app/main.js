// ClassTools – floating classroom assistant (dock + calculator + PDF pen + timer)
const { app, BrowserWindow, screen, ipcMain, Menu, dialog, session, Tray, nativeImage, shell } = require('electron');
const os = require('os');
const path = require('path');
const fs = require('fs');

app.setName('ClassTools');
// keep using the settings folder from earlier versions so positions and preferences carry over
app.setPath('userData', path.join(app.getPath('appData'), 'ClassCalc'));
if (process.platform === 'win32') app.setAppUserModelId('uk.classtools.app');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
// stop Windows from treating the see-through screen-pen layer as 'covered' and pausing its drawing
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');

const CALC_W = 420, CALC_H = 960;                // calculator aspect ratio
const DOCK_W = 70, DOCK_H_BASE = 629, DOCK_H_ANN = 755;
let DOCK_H = DOCK_H_BASE;
const W = {};                                     // windows
const hiddenAt = { calc: 0, timer: 0, picker: 0 };
let pickerMode = 'ext';
let menuOpen = false, timerKind = 'setup', quitting = false, tray = null;

/* ---------- saved positions ---------- */
const cfg = { dock: null, clock: null };
const cfgPath = () => path.join(app.getPath('userData'), 'layout.json');
function loadCfg() { try { Object.assign(cfg, JSON.parse(fs.readFileSync(cfgPath(), 'utf8'))); } catch (e) {} }
let saveT; function saveCfg() { clearTimeout(saveT); saveT = setTimeout(() => { try { fs.writeFileSync(cfgPath(), JSON.stringify(cfg)); } catch (e) {} }, 300); }

const areaOf = b => screen.getDisplayMatching(b).workArea;
function clamp(b, a) {
  a = a || areaOf(b);
  const w = Math.min(b.width, a.width), h = Math.min(b.height, a.height);
  return { x: Math.round(Math.min(Math.max(b.x, a.x), a.x + a.width - w)), y: Math.round(Math.min(Math.max(b.y, a.y), a.y + a.height - h)), width: Math.round(w), height: Math.round(h) };
}
const dockArea = () => W.dock ? areaOf(W.dock.getBounds()) : screen.getPrimaryDisplay().workArea;

function floating(opts) {
  const w = new BrowserWindow({
    frame: false, transparent: true, backgroundColor: '#00000000', hasShadow: false,
    resizable: false, maximizable: false, fullscreenable: false, alwaysOnTop: true, show: false,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, backgroundThrottling: false, spellcheck: false },
    ...opts
  });
  w.setAlwaysOnTop(true, 'screen-saver');        // above PowerPoint, even in slide show
  w.webContents.on('did-finish-load', () => { w.webContents.setZoomFactor(1); w.webContents.setVisualZoomLevelLimits(1, 1).catch(() => {}); });
  w.webContents.on('zoom-changed', () => w.webContents.setZoomFactor(1));
  w.webContents.on('before-input-event', (e, i) => { if ((i.control || i.meta) && ['+', '-', '=', '0'].includes(i.key)) e.preventDefault(); });
  w.setMenu(null);
  w.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  return w;
}

/* ---------- dock ---------- */
/* dock: snaps to the nearest side of the screen and tucks into a slim tab when idle */
const TAB_W = 30, TAB_H = 130, TUCK_AFTER = 5000;
const dockState = { tucked: false, dragging: false, timer: null };
function dockDisplayArea() {
  if (cfg.dock && cfg.dock.disp) { const d = screen.getAllDisplays().find(x => x.id === cfg.dock.disp); if (d) return d.workArea; }
  return screen.getPrimaryDisplay().workArea;
}
function dockSide() { return (cfg.dock && cfg.dock.side) || 'right'; }
function dockCentreY(a) { const y = cfg.dock && typeof cfg.dock.cy === 'number' ? cfg.dock.cy : a.y + a.height * 0.45; return Math.min(Math.max(y, a.y + DOCK_H / 2), a.y + a.height - DOCK_H / 2); }
function dockOpenBounds() {
  const a = dockDisplayArea(), cy = dockCentreY(a);
  const x = dockSide() === 'left' ? a.x + 4 : a.x + a.width - DOCK_W - 4;
  // On a short screen the dock is kept inside the work area; the page shrinks its buttons to suit.
  const h = Math.min(DOCK_H, a.height - 8);
  const y = Math.max(a.y + 4, Math.min(Math.round(cy - h / 2), a.y + a.height - h - 4));
  return { x, y, width: DOCK_W, height: h };
}
function dockTabBounds() { const a = dockDisplayArea(), cy = dockCentreY(a); const x = dockSide() === 'left' ? a.x : a.x + a.width - TAB_W; return { x, y: Math.round(Math.min(Math.max(cy - TAB_H / 2, a.y), a.y + a.height - TAB_H)), width: TAB_W, height: TAB_H }; }
const autoTuck = () => cfg.autoTuck !== false;
function setTucked(t) {
  clearTimeout(dockState.timer);
  dockState.tucked = t;
  W.dock.setBounds(t ? dockTabBounds() : dockOpenBounds());
  W.dock.webContents.send('dock-tuck', t, dockSide());
  if (!t) armTuck();
}
function armTuck() { clearTimeout(dockState.timer); if (autoTuck() && !annot.active) dockState.timer = setTimeout(() => { if (!dockState.dragging && !menuOpen) setTucked(true); else armTuck(); }, TUCK_AFTER); }
function snapDock() {
  // after a drag: pick the nearest side of whichever screen the dock is on, keep its height on screen
  const b = W.dock.getBounds(), d = screen.getDisplayMatching(b), a = d.workArea, cx = b.x + b.width / 2;
  cfg.dock = { disp: d.id, side: cx < a.x + a.width / 2 ? 'left' : 'right', cy: b.y + b.height / 2 };
  saveCfg(); setTucked(dockState.tucked);
}
function createDock() {
  W.dock = floating({ ...dockOpenBounds(), title: 'ClassTools', skipTaskbar: false, minimizable: true });
  W.dock.loadFile(path.join(__dirname, 'dock.html'));
  W.dock.once('ready-to-show', () => { W.dock.showInactive(); W.dock.webContents.send('dock-tuck', false, dockSide()); sendDockObj(); armTuck(); });
  W.dock.on('close', e => { if (!quitting) { e.preventDefault(); confirmQuit(); } });
}

/* ---------- ShapeXplorer (3D solids and 2D shapes) ---------- */
function createShapes() {
  W.shapes = new BrowserWindow({ show: false, width: 1200, height: 820, title: 'ShapeXplorer – ClassTools', autoHideMenuBar: true,
    icon: path.join(__dirname, 'icon.png'), backgroundColor: '#f3f4f8', webPreferences: { contextIsolation: true, backgroundThrottling: false, spellcheck: false } });
  W.shapes.setMenu(null);
  W.shapes.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  W.shapes.loadFile(path.join(__dirname, 'shapes', 'index.html'));
  W.shapes.on('closed', () => { W.shapes = null; });
}
function toggleShapes() {
  if (annot.active && annot.mode === 'draw') setAnnotMode('pointer');
  if (!W.shapes || W.shapes.isDestroyed()) { createShapes(); W.shapes.once('ready-to-show', () => { W.shapes.maximize(); W.shapes.show(); W.shapes.focus(); }); return; }
  if (!W.shapes.isVisible() || W.shapes.isMinimized()) { W.shapes.show(); W.shapes.restore(); W.shapes.focus(); }
  else if (W.shapes.isFocused()) W.shapes.minimize();
  else W.shapes.focus();
}

/* ---------- calculator ---------- */
function calcBounds() {
  if (pdfActive()) { const c = W.pdf.getContentBounds(), h = c.height - (tickerOn() ? tickerH() : 0); return { x: c.x + DOC_SIDEBAR, y: c.y, width: Math.round(h * CALC_W / CALC_H), height: h }; }
  const a = dockArea(); return { x: a.x, y: a.y, width: Math.round(a.height * CALC_W / CALC_H), height: a.height };
}
function createCalc() {
  W.calc = floating({ ...calcBounds(), title: 'ClassTools Calculator', skipTaskbar: true });
  W.calc.loadFile(path.join(__dirname, 'calc.html'));
  W.calc.on('blur', () => { if (!menuOpen && W.calc.isVisible() && !calcDocked()) hideCalc(); });   // beside the slides it stays open while you write
}
function showCalc() {
  W.calc.setBounds(calcBounds());
  W.calc.show(); W.calc.focus();
  W.calc.webContents.send('mode', 'expanded');
  relayout();
}
function hideCalc() { hiddenAt.calc = Date.now(); W.calc.hide(); W.calc.webContents.send('mode', 'compact'); relayout(); }
function toggleCalc() {
  if (W.calc.isVisible()) hideCalc();
  else if (Date.now() - hiddenAt.calc > 350) showCalc();
}

/* ---------- timer ---------- */
function createTimer() {
  W.timer = floating({ width: 360, height: 690, x: 0, y: 0, title: 'ClassTools Timer', skipTaskbar: true });
  W.timer.loadFile(path.join(__dirname, 'timer.html'));
  W.timer.on('moved', () => {
    if (timerKind === 'clock') { const b = W.timer.getBounds(); cfg.clock = { ...cfg.clock, x: b.x, y: b.y, width: b.width, height: b.height }; saveCfg(); }
  });
}
function clockBounds() {
  const a = dockArea();
  const c = cfg.clock || { width: 210, height: 252, x: a.x + a.width - 210 - DOCK_W - 24, y: a.y + 16 };
  return clamp({ x: c.x, y: c.y, width: c.width || 210, height: c.height || 252 }, a);
}
function setupBounds() {
  const d = W.dock.getBounds(), a = areaOf(d), w = 360, h = 690;
  let x = d.x - w - 10; if (x < a.x) x = d.x + d.width + 10;
  return clamp({ x, y: d.y + d.height / 2 - h / 2, width: w, height: h }, a);
}
function timerLayout(kind) {
  if (!W.timer) return;
  if (kind === 'setup') { timerKind = 'setup'; W.timer.setBounds(setupBounds()); if (!W.timer.isVisible()) W.timer.show(); W.timer.focus(); }
  else if (kind === 'clock') { timerKind = 'clock'; W.timer.setBounds(clockBounds()); if (!W.timer.isVisible()) W.timer.showInactive(); }
  else if (kind.startsWith('burst:')) {
    timerKind = 'burst';
    const s = parseFloat(kind.slice(6)) || 2, c = clockBounds(), cx = c.x + c.width / 2, cy = c.y + c.height / 2;
    const w = c.width * s, h = c.height * s;
    W.timer.setBounds(clamp({ x: cx - w / 2, y: cy - h / 2, width: w, height: h }));
  }
}
function toggleTimer() {
  if (!W.timer.isVisible()) {
    if (Date.now() - hiddenAt.timer < 350) return;
    W.timer.webContents.send('timer-open');
  } else W.timer.webContents.send('timer-dock');
}

/* ---------- screen pen (overlay) + radial menu ---------- */
const annot = { active: false, mode: 'draw', color: '#7a3cc8', tools: {}, tool: 'pen' };
const RAD_W = 250, RAD_H = 400;
function createOverlay() {
  const d = screen.getDisplayMatching(W.dock.getBounds()).bounds;
  W.overlay = new BrowserWindow({ ...d, frame: false, transparent: true, backgroundColor: '#00000000', hasShadow: false, resizable: false, movable: false,
    minimizable: false, maximizable: false, fullscreenable: false, focusable: false, skipTaskbar: true, alwaysOnTop: true, show: false, enableLargerThanScreen: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, backgroundThrottling: false } });
  W.overlay.setAlwaysOnTop(true, 'screen-saver'); W.overlay.setMenu(null);
  W.overlay.webContents.on('did-finish-load', () => { W.overlay.webContents.setVisualZoomLevelLimits(1, 1).catch(() => {}); });
  W.overlay.loadFile(path.join(__dirname, 'overlay.html'));
}
function raiseFloaters() { for (const k of ['ticker', 'calc', 'timer', 'picker', 'objp', 'radial', 'react', 'dock']) if (W[k] && !W[k].isDestroyed() && W[k].isVisible()) W[k].moveTop(); }
function sendAnnot() { if (W.dock) W.dock.webContents.send('annot', { active: annot.active, mode: annot.mode }); }
function resizeDockForAnnot() { DOCK_H = annot.active ? DOCK_H_ANN : DOCK_H_BASE; if (!dockState.tucked) W.dock.setBounds(dockOpenBounds()); }
async function ensureOverlay(stateJson) {
  if (W.overlay && !W.overlay.isDestroyed()) return;
  createOverlay(); await new Promise(r => W.overlay.webContents.once('did-finish-load', r));
  if (stateJson) await W.overlay.webContents.executeJavaScript(`__ov.importState(${JSON.stringify(stateJson)})`);
}
async function rebuildOverlay() {     // fresh window, same drawings – avoids Windows keeping a stale click-through state
  let st = null;
  if (W.overlay && !W.overlay.isDestroyed()) { try { st = await W.overlay.webContents.executeJavaScript('__ov.exportState()'); } catch (e) {} const old = W.overlay; W.overlay = null; old.destroy(); }
  await ensureOverlay(st);
  W.overlay.showInactive();
}
async function startAnnot(tool) {
  await ensureOverlay();
  const d = screen.getDisplayMatching(W.dock.getBounds()).bounds; W.overlay.setBounds(d);
  W.overlay.webContents.send('ov-color', annot.color);
  W.overlay.webContents.send('ov-tool', tool);
  if (['ruler', 'protractor'].includes(tool)) { annot.tools[tool] = !annot.tools[tool]; if (annot.tool !== 'eraser') annot.tool = 'pen'; } else annot.tool = tool;
  await setAnnotMode('draw');
  if (!W.overlay.isVisible()) W.overlay.showInactive();
  annot.active = true; if (dockState.tucked) setTucked(false); resizeDockForAnnot(); sendAnnot(); raiseFloaters();
}
async function setAnnotMode(m) {
  const was = annot.mode; annot.mode = m;
  if (m === 'draw' && was === 'pointer' && annot.active) await rebuildOverlay();
  if (W.overlay && !W.overlay.isDestroyed()) { W.overlay.setIgnoreMouseEvents(m === 'pointer'); W.overlay.webContents.send('ov-mode', m); }
  sendAnnot(); raiseFloaters();
}
function clearAnnot() {
  if (W.overlay && !W.overlay.isDestroyed()) { const o = W.overlay; W.overlay = null; o.destroy(); }
  annot.active = false; annot.mode = 'draw'; annot.tools = {}; annot.tool = 'pen'; resizeDockForAnnot(); sendAnnot(); armTuck();
}
function createRadial() {
  W.radial = floating({ width: RAD_W, height: RAD_H, x: 0, y: 0, title: 'ClassTools pen tools', skipTaskbar: true });
  W.radial.loadFile(path.join(__dirname, 'radial.html'));
  W.radial.on('blur', () => { if (W.radial.isVisible() && Date.now() - (W.radial._shownAt || 0) > 400) hideRadial(); });
}
function showRadial() {
  const b = W.dock.getBounds(), side = dockSide(), cy = b.y + 111, cx = b.x + 35;
  const x = side === 'right' ? cx - (RAD_W - 36) : cx - 36;
  W.radial.setBounds({ x: Math.round(x), y: Math.round(cy - RAD_H / 2), width: RAD_W, height: RAD_H });
  W.radial.webContents.send('radial-open', { side, color: annot.color, picking: false, annotActive: annot.active, active: { ...annot.tools, ...(annot.active && annot.mode === 'draw' ? { [annot.tool]: true } : {}) } });
  W.radial._shownAt = Date.now(); W.radial.show(); W.radial.focus(); W.radial.moveTop();
}
function hideRadial() { hiddenAt.radial = Date.now(); W.radial.hide(); }
function toggleRadial() {
  if (W.radial.isVisible()) { hideRadial(); return; }
  if (Date.now() - (hiddenAt.radial || 0) < 350) return;
  if (dockState.tucked) setTucked(false);
  showRadial();
}
ipcMain.on('radial-pick', (e, id) => { hideRadial(); if (id === 'pdf') { togglePdf(); return; } if (id === 'away') { clearAnnot(); return; } startAnnot(id); });
ipcMain.on('radial-color', (e, c) => { annot.color = c; if (W.overlay && !W.overlay.isDestroyed()) W.overlay.webContents.send('ov-color', c); });
ipcMain.on('radial-close', () => hideRadial());

/* ---------- reactions fan (sounds) ---------- */
function createReact() {
  W.react = floating({ width: RAD_W, height: RAD_H, x: 0, y: 0, title: 'ClassTools reactions', skipTaskbar: true });
  W.react.loadFile(path.join(__dirname, 'react.html'));
  W.react.on('blur', () => { if (W.react.isVisible() && Date.now() - (W.react._shownAt || 0) > 400) hideReact(); });
}
function hideReact() { hiddenAt.react = Date.now(); W.react.hide(); }
function toggleReact() {
  if (W.react.isVisible()) { hideReact(); return; }
  if (Date.now() - (hiddenAt.react || 0) < 350) return;
  if (dockState.tucked) setTucked(false);
  const b = W.dock.getBounds(), side = dockSide(), cy = b.y + 406, cx = b.x + 35;
  const x = side === 'right' ? cx - (RAD_W - 36) : cx - 36;
  W.react.setBounds({ x: Math.round(x), y: Math.round(cy - RAD_H / 2), width: RAD_W, height: RAD_H });
  W.react.webContents.send('react-open', { side });
  W.react._shownAt = Date.now(); W.react.show(); W.react.focus(); W.react.moveTop();
}
ipcMain.on('react-close', () => hideReact());
ipcMain.on('ov-drawn', () => {});

/* ---------- question picker ---------- */
function createPicker() {
  W.picker = floating({ width: 420, height: 640, x: 0, y: 0, title: 'ClassTools Questions', skipTaskbar: true });
  W.picker.loadFile(path.join(__dirname, 'picker.html'));
}
function pickerBounds() {
  const d = W.dock.getBounds(), a = areaOf(d), w = 420, h = 640;
  let x = d.x - w - 10; if (x < a.x) x = d.x + d.width + 10;
  return clamp({ x, y: d.y + d.height / 2 - h / 2, width: w, height: h }, a);
}
function togglePicker(mode) {
  if (dockState.tucked) setTucked(false);
  if (W.picker.isVisible()) {
    if (mode === pickerMode) { hidePicker(); return; }
  } else if (Date.now() - hiddenAt.picker < 350 && mode === pickerMode) return;
  pickerMode = mode;
  W.picker.setBounds(pickerBounds()); W.picker.show(); W.picker.focus();
  W.picker.webContents.send('picker-open', mode);
}
function hidePicker() { hiddenAt.picker = Date.now(); W.picker.hide(); }
async function buildWorksheet(html, name) {
  const file = path.join(os.tmpdir(), 'classtools-sheet-' + Date.now() + '.html');
  fs.writeFileSync(file, html, 'utf8');
  const w = new BrowserWindow({ show: false, width: 1123, height: 794, webPreferences: { javascript: false } });
  try {
    await w.loadFile(file);
    await new Promise(r => setTimeout(r, 250));
    const pdf = await w.webContents.printToPDF({ landscape: true, pageSize: 'A4', printBackground: true, preferCSSPageSize: true, margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    await openPdfBytes(pdf, name);
  } finally { w.destroy(); try { fs.unlinkSync(file); } catch (e) {} }
  hidePicker();
  return true;
}
async function openPdfBytes(bytes, name) {
  if (!W.pdf || W.pdf.isDestroyed()) {
    createPdf();
    await new Promise(r => W.pdf.webContents.once('did-finish-load', r));
  } else if (W.pdf.webContents.isLoading()) await new Promise(r => W.pdf.webContents.once('did-finish-load', r));
  W.pdf.show(); if (W.pdf.isMinimized()) W.pdf.restore(); fitPdfWin(); W.pdf.focus();
  W.pdf.webContents.send('load-pdf', new Uint8Array(bytes), name, true);
}

/* ---------- PDF pen ---------- */

function createPdf() {
  const a = dockArea();
  W.pdf = new BrowserWindow({
    x: a.x + 40, y: a.y + 30, width: Math.min(1280, a.width - 80), height: a.height - 60, show: false,
    title: 'ClassTools – Page & Document Pen', autoHideMenuBar: true, icon: path.join(__dirname, 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true }
  });
  W.pdf.setMenu(null);
  W.pdf.loadFile(path.join(__dirname, 'pdf.html'));
  W.pdf.once('ready-to-show', () => { fitPdfWin(); W.pdf.show(); });
  W.pdf.on('close', e => { if (!quitting) { e.preventDefault(); W.pdf.hide(); } });   // keep the open document for next time
  W.pdf.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  for (const ev of ['show', 'hide', 'minimize', 'restore', 'maximize', 'unmaximize', 'resize', 'move']) W.pdf.on(ev, relayout);
  W.pdf.webContents.on('did-finish-load', relayout);
}
// The folder on the dock: bring the document window up and go straight to choosing a file.
function openDocs() {
  const fresh = !W.pdf || W.pdf.isDestroyed();
  if (annot.active && annot.mode === 'draw') setAnnotMode('pointer');
  if (fresh) createPdf();
  else { W.pdf.show(); W.pdf.restore(); fitPdfWin(); W.pdf.focus(); }
  const ask = () => { try { W.pdf.webContents.send('doc-open'); } catch (_) {} };
  if (fresh) W.pdf.webContents.once('did-finish-load', () => setTimeout(ask, 250));
  else ask();
}

function togglePdf() {
  if (annot.active && annot.mode === 'draw') setAnnotMode('pointer');
  if (!W.pdf || W.pdf.isDestroyed()) { createPdf(); return; }
  if (!W.pdf.isVisible() || W.pdf.isMinimized()) { W.pdf.show(); W.pdf.restore(); fitPdfWin(); W.pdf.focus(); }
  else if (W.pdf.isFocused()) W.pdf.minimize();
  else W.pdf.focus();
}

/* ---------- Polypad (online maths manipulatives) ---------- */
const POLYPAD_URL = 'https://polypad.amplify.com/p/';
function togglePolypad() {
  if (annot.active && annot.mode === 'draw') setAnnotMode('pointer');
  if (W.poly && !W.poly.isDestroyed()) {
    if (!W.poly.isVisible() || W.poly.isMinimized()) { W.poly.show(); W.poly.restore(); W.poly.maximize(); W.poly.focus(); }
    else if (W.poly.isFocused()) W.poly.minimize(); else W.poly.focus();
    return;
  }
  W.poly = new BrowserWindow({ show: false, width: 1280, height: 800, title: 'Polypad – ClassTools', autoHideMenuBar: true, icon: path.join(__dirname, 'icon.png'), backgroundColor: '#ffffff' });
  W.poly.setMenu(null);
  W.poly.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/i.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  W.poly.webContents.on('did-fail-load', (e, code, desc, url, main) => {
    if (!main || code === -3) return;
    W.poly.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`<body style="font:18px system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f4f6fb;color:#333"><div style="text-align:center"><h2>Polypad needs the internet</h2><p>ClassTools couldn't reach polypad.amplify.com (${desc}).</p><button onclick="location.href='${POLYPAD_URL}'" style="font:700 16px system-ui;padding:10px 20px;border-radius:10px;border:0;background:#2457d6;color:#fff;cursor:pointer">Try again</button></div></body>`));
  });
  W.poly.on('close', e => { if (!quitting) { e.preventDefault(); W.poly.hide(); } });   // keep the board for later in the lesson
  W.poly.once('ready-to-show', () => { W.poly.maximize(); W.poly.show(); });
  W.poly.loadURL(POLYPAD_URL);
}

/* ---------- menus & quitting ---------- */
async function pdfDirty() {
  if (!W.pdf || W.pdf.isDestroyed()) return false;
  try { return await W.pdf.webContents.executeJavaScript('window.__isDirty ? window.__isDirty() : false'); } catch (e) { return false; }
}
async function confirmQuit() {
  if (await pdfDirty()) {
    const r = await dialog.showMessageBox({ type: 'question', buttons: ['Quit anyway', 'Cancel'], defaultId: 1, cancelId: 1,
      title: 'ClassTools', message: 'You have unsaved writing in the document pen.', detail: 'Quit and lose it?' });
    if (r.response !== 0) return;
  }
  quitting = true; app.quit();
}
function popup(win, tpl) {
  menuOpen = true;
  Menu.buildFromTemplate(tpl).popup({ window: win, callback: () => setTimeout(() => { menuOpen = false; }, 300) });
}
const themes = () => ['grey', 'black', 'blue', 'pink', 'atomic'].map(t => ({
  label: { grey: 'Grey', black: 'Black', blue: 'Blue', pink: 'Pink', atomic: 'Atomic green (see-through)' }[t],
  click: () => W.calc.webContents.send('theme', t) }));
const models = () => [['cw', 'CW (current calculator)'], ['plus', 'PLUS (natural display)'], ['tv', '595 style (natural display)']].map(([m, l]) => ({
  label: l, click: () => { W.calc.webContents.send('model', m); if (!W.calc.isVisible()) showCalc(); } }));
function dockMenu() {
  popup(W.dock, [
    { label: 'Calculator', click: toggleCalc }, { label: 'Open a document…', click: openDocs }, { label: 'Page / document pen', click: togglePdf }, { label: 'Screen pen tools…', click: toggleRadial }, { label: 'Clear screen drawings', click: clearAnnot }, { label: 'Timer', click: toggleTimer }, { label: 'Polypad', click: togglePolypad }, { label: 'ShapeXplorer', click: toggleShapes }, { label: 'Objective ticker', type: 'checkbox', checked: tickerOn(), click: () => setTicker(!tickerOn()) }, { label: 'Cancel timer', click: () => W.timer.webContents.send('timer-cancel') },
    { label: 'Extension questions', click: () => togglePicker('ext') }, { label: 'Fluency starter', click: () => togglePicker('flu') },
    { type: 'separator' },
    { label: 'Tuck dock into the side when not in use', type: 'checkbox', checked: autoTuck(), click: () => { cfg.autoTuck = !autoTuck(); saveCfg(); if (autoTuck()) armTuck(); else setTucked(false); } },
    { label: 'Calculator model', submenu: models() },
    { label: 'Calculator case colour', submenu: themes() },
    { label: 'Reset positions', click: () => { cfg.dock = null; cfg.clock = null; saveCfg(); setTucked(false);
        if (timerKind === 'clock') W.timer.setBounds(clockBounds()); } },
    { type: 'separator' },
    { label: 'Quit ClassTools', click: confirmQuit }
  ]);
}
function calcMenu() {
  popup(W.calc, [
    { label: 'Hide calculator', click: hideCalc },
    { label: 'Calculator model', submenu: models() },
    { label: 'Case colour', submenu: themes() },
    { label: 'Keyboard && help', click: () => W.calc.webContents.send('help') },
    { type: 'separator' },
    { label: 'Quit ClassTools', click: confirmQuit }
  ]);
}

/* ---------- IPC ---------- */
ipcMain.on('win-move', (e, x, y) => {
  const w = BrowserWindow.fromWebContents(e.sender); if (!w) return;
  const b = w.getBounds(); w.setBounds({ x, y, width: b.width, height: b.height });
  if (w === W.dock && !dockState.tucked) { dockState.dragging = true; clearTimeout(dockState.snapT); dockState.snapT = setTimeout(() => { if (dockState.dragging) { dockState.dragging = false; snapDock(); } }, 1200); }
});
ipcMain.on('dock', (e, name) => {
  if (['calc', 'docs', 'pen', 'timer', 'qs', 'ext', 'flu', 'ptr', 'rub', 'obj', 'rx', 'poly', 'shapes'].includes(name)) armTuck();
  if (name === 'calc') toggleCalc();
  else if (name === 'docs') openDocs();
  else if (name === 'pen') toggleRadial();
  else if (name === 'ptr') { if (annot.active) setAnnotMode(annot.mode === 'pointer' ? 'draw' : 'pointer'); }
  else if (name === 'rub') clearAnnot();
  else if (name === 'quit') confirmQuit();
  else if (name === 'obj') setTicker(!tickerOn());
  else if (name === 'rx') toggleReact();
  else if (name === 'poly') togglePolypad();
  else if (name === 'shapes') toggleShapes();
  else if (name === 'timer') toggleTimer();
  else if (name === 'qs') togglePicker(pickerMode);   // one button for both sheets; the picker has tabs
  else if (name === 'ext') togglePicker('ext');
  else if (name === 'flu') togglePicker('flu');
  else if (name === 'menu') dockMenu();
  else if (name === 'moved') { clearTimeout(dockState.snapT); dockState.dragging = false; snapDock(); }
  else if (name === 'drag-start') { dockState.dragging = true; clearTimeout(dockState.timer); }
  else if (name === 'untuck') setTucked(false);
  else if (name === 'activity') { if (!dockState.tucked) armTuck(); }
  else if (name === 'tab-moved') { const b = W.dock.getBounds(); cfg.dock = { ...(cfg.dock || {}), disp: screen.getDisplayMatching(b).id, cy: b.y + b.height / 2 }; saveCfg(); }
});
ipcMain.on('calc-show', showCalc);
ipcMain.on('picker-hide', hidePicker);
ipcMain.handle('ws-build', (e, html, name) => buildWorksheet(html, name));

/* ---------- objective ticker ---------- */
const objStart = () => ['ask', 'show', 'off'].includes(cfg.objStart) ? cfg.objStart : 'ask';
const objStyle = () => ({ anim: 'swipe', bg: '#121826', op: 95, fg: '#ffffff', ...(cfg.objStyle || {}) });
let objVisible = null;
const tickerOn = () => objVisible !== false;
const objList = () => Array.isArray(cfg.objectives) ? cfg.objectives : [];
function tickerDisplay() { return pdfActive() ? screen.getDisplayMatching(W.pdf.getBounds()) : W.dock ? screen.getDisplayMatching(W.dock.getBounds()) : screen.getPrimaryDisplay(); }
function tickerBounds() {
  const h = tickerH();
  if (pdfActive()) { const c = W.pdf.getContentBounds(); return { x: c.x, y: c.y + c.height - h, width: c.width, height: h }; }
  const a = tickerDisplay().workArea; return { x: a.x, y: a.y + a.height - h, width: a.width, height: h };
}
function placeTicker() { if (W.ticker && !W.ticker.isDestroyed()) W.ticker.setBounds(tickerBounds()); }
function createTicker() {
  W.ticker = floating({ ...tickerBounds(), focusable: false, skipTaskbar: true, title: 'Objective ticker' });
  W.ticker.loadFile(path.join(__dirname, 'ticker.html'));
  W.ticker.webContents.on('did-finish-load', () => { W.ticker.webContents.setVisualZoomLevelLimits(1, 1).catch(() => {}); if (objVisible === null) objVisible = objStart() !== 'off'; W.ticker.webContents.send('obj-style', objStyle()); W.ticker.webContents.send('obj-list', objList()); if (objStart() === 'ask' && !W.ticker._asked) { W.ticker._asked = true; W.ticker.webContents.send('obj-ask', { count: objList().length }); } if (tickerOn()) { W.ticker.showInactive(); raiseFloaters(); } sendDockObj(); relayout(); });
  W.objp = floating({ width: 700, height: 300, skipTaskbar: true, title: 'Lesson objectives' });
  W.objp.loadFile(path.join(__dirname, 'objectives.html'));
  W.objp.on('focus', () => { W.objp._hadFocus = true; });
  W.objp.on('blur', () => { if (W.objp.isVisible() && W.objp._hadFocus && Date.now() - (W.objp._shownAt || 0) > 500) W.objp.hide(); });
  sendDockObj();
}
function sendDockObj() { if (W.dock && !W.dock.isDestroyed()) W.dock.webContents.send('obj-on', tickerOn()); }
function setTicker(on) {
  objVisible = !!on;
  if (on) {
    // Shown again after being closed, the bar has to come back fully live: back in place, back on
    // top, taking mouse presses, and with the animation and any half-answered start-up prompt reset.
    if (!W.ticker || W.ticker.isDestroyed()) createTicker();
    if (W.ticker.webContents.isCrashed()) W.ticker.reload();
    placeTicker();
    W.ticker.setIgnoreMouseEvents(false);
    W.ticker.setAlwaysOnTop(true, 'screen-saver');
    W.ticker.showInactive(); W.ticker.moveTop();
    W.ticker.webContents.send('obj-style', objStyle());
    W.ticker.webContents.send('obj-list', objList());
    W.ticker.webContents.send('obj-wake');
    raiseFloaters();
  } else { W.ticker.hide(); if (W.objp.isVisible()) W.objp.hide(); }
  relayout(); sendDockObj();
}
/* Windows won't always hand focus to a window when the click came from a non-focusable one (the ticker) */
function grabFocus(w) {
  const go = () => { if (w.isDestroyed() || !w.isVisible() || w.isFocused()) return; if (process.platform === 'win32') { w.setAlwaysOnTop(false); w.setAlwaysOnTop(true, 'screen-saver'); } w.focus(); w.webContents.focus(); };
  go(); setTimeout(go, 120); setTimeout(go, 350);
}
function placeObjPanel(h) {
  const t = tickerBounds(), a = tickerDisplay().workArea, w = 700;
  h = Math.min(Math.max(200, Math.round(h || W.objp.getBounds().height)), Math.round(a.height * 0.8));
  W.objp.setBounds({ x: Math.round(a.x + (a.width - w) / 2), y: (tickerOn() ? t.y : a.y + a.height) - h + 6, width: w, height: h });
}
function openObjPanel(focus) {
  if (!tickerOn()) setTicker(true);
  W.objp.webContents.send('obj-open', { list: objList(), style: { ...objStyle(), start: objStart() }, focus: !!focus });
  placeObjPanel(); W.objp._shownAt = Date.now(); W.objp._hadFocus = false;
  W.objp.setAlwaysOnTop(true, 'screen-saver'); W.objp.show(); W.objp.moveTop(); grabFocus(W.objp);
}
ipcMain.on('obj', (e, cmd, data) => {
  if (cmd === 'open') { if (W.objp.isVisible()) W.objp.hide(); else openObjPanel(); }
  else if (cmd === 'set') { cfg.objectives = (data || []).filter(o => o && o.text).map(o => ({ text: String(o.text).slice(0, 300), done: !!o.done })); saveCfg(); W.ticker.webContents.send('obj-list', cfg.objectives); }
  else if (cmd === 'size') placeObjPanel(data);
  else if (cmd === 'close') W.objp.hide();
  else if (cmd === 'style') { const { start, ...st } = data || {}; cfg.objStyle = { ...objStyle(), ...st }; if (start) cfg.objStart = start; saveCfg(); W.ticker.webContents.send('obj-style', cfg.objStyle); }
  else if (cmd === 'start-keep') W.ticker.webContents.send('obj-list', objList());
  else if (cmd === 'start-new') { W.ticker.webContents.send('obj-list', objList()); openObjPanel(true); }
  else if (cmd === 'start-close') { W.ticker.webContents.send('obj-list', objList()); setTicker(false); }
  else if (cmd === 'start-never') { cfg.objStart = 'off'; saveCfg(); W.ticker.webContents.send('obj-list', objList()); setTicker(false); }
  else if (cmd === 'hide-ticker') setTicker(false);
});
/* keep the document pen above the ticker instead of underneath it */
/* ---------- the document window: maximised, with the calculator and ticker fitted around the slides ---------- */
let DOC_SIDEBAR = 142;
ipcMain.on('doc-sidebar', (e, w) => { w = Math.round(+w || 0); if (w > 40 && w < 800 && w !== DOC_SIDEBAR) { DOC_SIDEBAR = w; relayout(); } });
function pdfActive() { return !!(W.pdf && !W.pdf.isDestroyed() && W.pdf.isVisible() && !W.pdf.isMinimized()); }
function tickerH() { return Math.max(36, Math.round(tickerDisplay().bounds.height * 0.06)); }
function calcDocked() { return !!(W.calc && W.calc.isVisible() && pdfActive()); }
function fitPdfWin() { if (!W.pdf || W.pdf.isDestroyed() || W.pdf.isMinimized()) return; if (!W.pdf.isMaximized()) W.pdf.maximize(); relayout(); }
let relayT;
function relayout() {
  clearTimeout(relayT);
  relayT = setTimeout(() => {
    placeTicker();
    if (W.calc && W.calc.isVisible()) W.calc.setBounds(calcBounds());
    if (W.pdf && !W.pdf.isDestroyed()) {
      const cb = calcDocked() ? W.calc.getBounds() : null;
      W.pdf.webContents.send('insets', { left: cb ? cb.width : 0, bottom: pdfActive() && tickerOn() ? tickerH() : 0 });
      W.pdf.webContents.send('calc-open', calcDocked());
    }
  }, 40);
}


/* ---------- Word / PowerPoint → PDF for the document pen ---------- */
const { execFile } = require('child_process');
const { pathToFileURL } = require('url');
const runCmd = (cmd, args, opts) => new Promise(res => { try { execFile(cmd, args, { windowsHide: true, timeout: 90000, maxBuffer: 4 << 20, ...opts }, (err, so, se) => res({ err, so: String(so || ''), se: String(se || '') })); } catch (err) { res({ err }); } });
const PS_WORD = `$ErrorActionPreference='Stop'
$w = New-Object -ComObject Word.Application
$mine = -not $w.Visible
$m = [Type]::Missing
$d = $w.Documents.Open($env:CT_IN, $false, $true, $false, $m, $m, $m, $m, $m, $m, $m, $false)
try { $d.ExportAsFixedFormat($env:CT_OUT, 17) } finally { $d.Close(0) }
if ($mine -and $w.Documents.Count -eq 0) { $w.Quit() }
[void][Runtime.InteropServices.Marshal]::ReleaseComObject($w)`;
const PS_PPT = `$ErrorActionPreference='Stop'
$p = New-Object -ComObject PowerPoint.Application
$mine = ($p.Presentations.Count -eq 0) -and ($p.Visible -eq 0)
$pr = $p.Presentations.Open($env:CT_IN, -1, 0, 0)
try { $pr.SaveAs($env:CT_OUT, 32) } finally { $pr.Close() }
if ($mine -and $p.Presentations.Count -eq 0) { $p.Quit() }
[void][Runtime.InteropServices.Marshal]::ReleaseComObject($p)`;
const VBS = `Dim a, i, o, isPpt, app, d, mine
Set a = WScript.Arguments : i = a(0) : o = a(1) : isPpt = (a(2) = "ppt")
If isPpt Then
  Set app = CreateObject("PowerPoint.Application")
  mine = (app.Presentations.Count = 0)
  Set d = app.Presentations.Open(i, -1, 0, 0)
  d.SaveAs o, 32 : d.Close
  If mine And app.Presentations.Count = 0 Then app.Quit
Else
  Set app = CreateObject("Word.Application")
  mine = Not app.Visible
  Set d = app.Documents.Open(i, False, True, False)
  d.ExportAsFixedFormat o, 17 : d.Close 0
  If mine And app.Documents.Count = 0 Then app.Quit
End If`;
function sofficePaths() {
  if (process.platform !== 'win32') return ['soffice', 'libreoffice', '/usr/bin/soffice', '/Applications/LibreOffice.app/Contents/MacOS/soffice'];
  const out = [];
  for (const base of [process.env.ProgramFiles, process.env['ProgramFiles(x86)'], process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Programs')].filter(Boolean))
    for (const n of ['LibreOffice', 'LibreOffice 7', 'LibreOffice 24', 'LibreOffice 25', 'OpenOffice 4']) { const f = path.join(base, n, 'program', 'soffice.exe'); if (fs.existsSync(f)) out.push(f); }
  return out;
}
async function withConverter(fn) {
  const w = new BrowserWindow({ show: false, width: 1280, height: 900, webPreferences: { contextIsolation: true, sandbox: true } });
  try { await w.loadFile(path.join(__dirname, 'convert.html')); return await fn(w); } finally { w.destroy(); }
}
async function builtInConvert(kind, file) {
  return withConverter(async w => {
    const b64 = fs.readFileSync(file).toString('base64');
    const r = await w.webContents.executeJavaScript(`render(${JSON.stringify(kind)}, ${JSON.stringify(b64)})`);
    if (!r || r.error) throw new Error(r && r.error || 'convert failed');
    return await w.webContents.printToPDF({ printBackground: true, preferCSSPageSize: true, pageSize: { width: r.w, height: r.h }, margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  });
}
async function expandAnimations(file) {
  try {
    return await withConverter(async w => {
      const b64 = fs.readFileSync(file).toString('base64');
      return await w.webContents.executeJavaScript(`expand(${JSON.stringify(b64)})`);
    });
  } catch (e) { return { error: String(e) }; }
}
async function convertOne(inF, dir, ext, isPpt, progress, tag) {
  const outF = path.join(dir, `out-${tag}.pdf`);
  const done = () => { try { return fs.statSync(outF).size > 200; } catch (e) { return false; } };
  if (process.platform === 'win32' && !/^\.(odt|odp)$/.test(ext)) {
    progress(isPpt ? 'Opening the slides with PowerPoint…' : 'Opening the document with Word…');
    await runCmd('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', isPpt ? PS_PPT : PS_WORD], { env: { ...process.env, CT_IN: inF, CT_OUT: outF } });
    if (done()) return { pdf: fs.readFileSync(outF), via: isPpt ? 'PowerPoint' : 'Word' };
    const vbs = path.join(dir, 'convert.vbs'); fs.writeFileSync(vbs, VBS);
    await runCmd('cscript.exe', ['//nologo', '//B', vbs, inF, outF, isPpt ? 'ppt' : 'doc']);
    if (done()) return { pdf: fs.readFileSync(outF), via: isPpt ? 'PowerPoint' : 'Word' };
  }
  for (const so of (process.env.CT_NO_SOFFICE ? [] : sofficePaths())) {
    progress('Converting with LibreOffice…');
    const od = path.join(dir, 'lo-' + tag); fs.mkdirSync(od, { recursive: true });
    await runCmd(so, ['-env:UserInstallation=' + pathToFileURL(path.join(dir, 'lo')).href, '--headless', '--norestore', '--nolockcheck', '--convert-to', 'pdf', '--outdir', od, inF]);
    const lo = path.join(od, path.basename(inF, ext) + '.pdf');
    if (fs.existsSync(lo) && fs.statSync(lo).size > 200) return { pdf: fs.readFileSync(lo), via: 'LibreOffice' };
  }
  if (/^\.(docx|pptx|ppsx|pptm)$/.test(ext)) {
    progress('Converting (built-in)…');
    return { pdf: await builtInConvert(ext === '.docx' ? 'docx' : 'pptx', inF), via: 'built-in', approx: true };
  }
  return null;
}
/* videos stored inside a PowerPoint are copied out so the viewer can play them */
const MEDIA_DIR = path.join(os.tmpdir(), 'classtools-media');
try { fs.rmSync(MEDIA_DIR, { recursive: true, force: true }); } catch (e) {}
async function extractVideos(file, map) {
  const want = new Set(); for (const m of map || []) for (const v of m.videos || []) if (v.media) want.add(v.media);
  if (!want.size) return;
  try {
    const JSZip = require(path.join(__dirname, 'lib', 'jszip.min.js'));
    const zip = await JSZip.loadAsync(fs.readFileSync(file));
    const dir = path.join(MEDIA_DIR, String(Date.now())); fs.mkdirSync(dir, { recursive: true });
    const out = {};
    for (const p of want) { const f = zip.file(p); if (!f) continue; const dest = path.join(dir, path.basename(p)); fs.writeFileSync(dest, await f.async('nodebuffer')); out[p] = pathToFileURL(dest).href; }
    for (const m of map) for (const v of m.videos || []) if (v.media) { v.file = out[v.media] || null; delete v.media; }
  } catch (e) { for (const m of map) for (const v of m.videos || []) if (v.media) delete v.media; }
}
ipcMain.on('open-link', (e, url) => { if (/^(https?:|mailto:)/i.test(String(url))) shell.openExternal(String(url)); });
async function officeToPdf(name, bytes, progress) {
  const ext = path.extname(name).toLowerCase();
  const isPpt = /^\.(pptx?|pptm|ppsx?|potx?|odp|key)$/.test(ext);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'classtools-doc-'));
  const inF = path.join(dir, 'document' + ext);
  fs.writeFileSync(inF, Buffer.from(bytes));
  try {
    // animations: turn each click into its own slide before converting, so every build step looks exactly right
    if (/^\.(pptx|ppsx|pptm)$/.test(ext)) {
      progress('Reading the animations…');
      const ex = await expandAnimations(inF);
      if (ex && !ex.error && ex.map) {
        let r = null;
        if (ex.b64) { const f2 = path.join(dir, 'builds' + ext); fs.writeFileSync(f2, Buffer.from(ex.b64, 'base64')); try { r = await convertOne(f2, dir, ext, true, progress, 'b'); } catch (e) { r = null; } }
        else r = await convertOne(inF, dir, ext, true, progress, 'a');
        if (r) { await extractVideos(inF, ex.map); return { ...r, builds: ex.map, slideSize: [ex.SW, ex.SH] }; }
      }
    }
    const r = await convertOne(inF, dir, ext, isPpt, progress, 'a');
    if (r) return r;
    return { error: `ClassTools needs Microsoft Office or LibreOffice installed to open ${ext} files. Save it as .pptx/.docx or PDF instead.` };
  } catch (e) {
    return { error: 'Could not open that file: ' + (e && e.message || e) };
  } finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {} }
}
ipcMain.handle('doc-convert', (e, name, bytes) => officeToPdf(name, bytes, msg => { try { e.sender.send('doc-progress', msg); } catch (_) {} }));

// Saving back out in the file type that was opened. The annotated pages are a PDF by then, so
// LibreOffice turns that back into slides or a document; it keeps the text as text and the ink as
// shapes rather than flattening each page to a picture. Without LibreOffice there is no way to do
// it, and the caller falls back to saving the PDF.
ipcMain.handle('doc-reconvert', async (e, kind, bytes) => {
  const filt = kind === 'pptx'
    ? { infilter: 'impress_pdf_import', to: 'pptx:Impress MS PowerPoint 2007 XML' }
    : { infilter: 'writer_pdf_import', to: 'docx:MS Word 2007 XML' };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'classtools-save-'));
  try {
    const inF = path.join(dir, 'annotated.pdf');
    fs.writeFileSync(inF, Buffer.from(bytes));
    for (const so of (process.env.CT_NO_SOFFICE ? [] : sofficePaths())) {
      const od = path.join(dir, 'out');
      try { fs.mkdirSync(od, { recursive: true }); } catch (_) {}
      try {
        await runCmd(so, ['-env:UserInstallation=' + pathToFileURL(path.join(dir, 'lo')).href,
          '--headless', '--norestore', '--nolockcheck', '--infilter=' + filt.infilter,
          '--convert-to', filt.to, '--outdir', od, inF]);
      } catch (_) { continue; }
      const f = path.join(od, 'annotated.' + kind);
      try { if (fs.existsSync(f) && fs.statSync(f).size > 500) return { data: fs.readFileSync(f) }; } catch (_) {}
    }
    return { error: 'no-converter' };
  } catch (err) {
    return { error: String(err && err.message || err) };
  } finally {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
  }
});

ipcMain.on('calc-hide', hideCalc);
ipcMain.on('calc-menu', calcMenu);
ipcMain.on('app-quit', () => confirmQuit());
ipcMain.on('timer-layout', (e, kind) => timerLayout(kind));
ipcMain.on('timer-hide', () => { hiddenAt.timer = Date.now(); W.timer.hide(); });
ipcMain.on('timer-show', () => { if (!W.timer.isVisible()) W.timer.showInactive(); });
ipcMain.on('timer-status', (e, s) => { if (W.dock) W.dock.webContents.send('timer-status', s); });
ipcMain.on('timer-resize', (e, d) => {
  if (timerKind !== 'clock') return;
  const b = W.timer.getBounds(), f = d < 0 ? 1.08 : 1 / 1.08;
  const w = Math.max(120, Math.min(700, b.width * f)), h = w * 252 / 210;
  const nb = clamp({ x: b.x + b.width / 2 - w / 2, y: b.y + b.height / 2 - h / 2, width: w, height: h });
  W.timer.setBounds(nb); cfg.clock = nb; saveCfg();
});

/* ---------- start ---------- */
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (W.dock) { W.dock.show(); setTucked(false); } });
  function youtubeReferrer() {
  const f = { urls: ['*://*.youtube.com/*', '*://*.youtube-nocookie.com/*', '*://*.googlevideo.com/*', '*://*.ytimg.com/*'] };
  session.defaultSession.webRequest.onBeforeSendHeaders(f, (d, cb) => {
    const h = d.requestHeaders; if (!h.Referer || /^file:/i.test(h.Referer)) h.Referer = 'https://classtools.app/';
    cb({ requestHeaders: h });
  });
}
app.whenReady().then(() => {
  youtubeReferrer();
    loadCfg();
    session.defaultSession.on('will-download', (e, item) => {
      // The filter follows whatever is actually being saved, now that it is not always a PDF.
      const fn = item.getFilename(), ex = (fn.split('.').pop() || 'pdf').toLowerCase();
      const named = { pdf: 'PDF', pptx: 'PowerPoint presentation', docx: 'Word document' }[ex] || ex.toUpperCase();
      item.setSaveDialogOptions({ title: 'Save annotated copy', defaultPath: path.join(app.getPath('documents'), fn), filters: [{ name: named, extensions: [ex] }] });
    });
    createDock(); createCalc(); createTimer(); createPicker(); createRadial(); createReact(); createTicker();
    try {
      tray = new Tray(nativeImage.createFromPath(path.join(__dirname, 'icon.png')).resize({ width: 16, height: 16 }));
      tray.setToolTip('ClassTools');
      tray.setContextMenu(Menu.buildFromTemplate([
        { label: 'Show dock', click: () => { W.dock.show(); setTucked(false); } },
        { label: 'Calculator', click: toggleCalc }, { label: 'Page / document pen', click: togglePdf }, { label: 'Screen pen tools…', click: toggleRadial }, { label: 'Clear screen drawings', click: clearAnnot }, { label: 'Timer', click: toggleTimer }, { label: 'Polypad', click: togglePolypad },
        { label: 'Reset positions', click: () => { cfg.dock = null; cfg.clock = null; saveCfg(); setTucked(false); W.dock.show(); } },
        { type: 'separator' }, { label: 'Quit ClassTools', click: confirmQuit }]));
      tray.on('click', () => { W.dock.show(); setTucked(false); });
    } catch (e) {}
    screen.on('display-metrics-changed', () => relayout());
  });
  app.on('before-quit', () => { quitting = true; });
  app.on('window-all-closed', () => app.quit());
}
