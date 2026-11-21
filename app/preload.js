const { contextBridge, ipcRenderer } = require('electron');
const page = location.pathname.split('/').pop();

// shared bridge for the dock, timer and PDF windows
contextBridge.exposeInMainWorld('cc', {
  move: (x, y) => ipcRenderer.send('win-move', Math.round(x), Math.round(y)),
  dock: name => ipcRenderer.send('dock', name),
  timerLayout: kind => ipcRenderer.send('timer-layout', kind),
  timerResize: d => ipcRenderer.send('timer-resize', d),
  timerHide: () => ipcRenderer.send('timer-hide'),
  timerShow: () => ipcRenderer.send('timer-show'),
  timerStatus: s => ipcRenderer.send('timer-status', s),
  pickerHide: () => ipcRenderer.send('picker-hide'),
  overlayDrawn: () => ipcRenderer.send('ov-drawn'),
  radialPick: id => ipcRenderer.send('radial-pick', id),
  radialColor: c => ipcRenderer.send('radial-color', c),
  radialClose: () => ipcRenderer.send('radial-close'),
  reactClose: () => ipcRenderer.send('react-close'),
  obj: (cmd, data) => ipcRenderer.send('obj', cmd, data),
  buildWorksheet: (html, name) => ipcRenderer.invoke('ws-build', html, name),
  convertDoc: (name, bytes) => ipcRenderer.invoke('doc-convert', name, bytes),
  reconvertDoc: (kind, bytes) => ipcRenderer.invoke('doc-reconvert', kind, bytes),
  openLink: url => ipcRenderer.send('open-link', url),
  docSidebar: w => ipcRenderer.send('doc-sidebar', w),
  on: (ch, f) => ipcRenderer.on(ch, (e, ...a) => f(...a))
});

// the calculator page looks for this to switch into desktop mode
if (page === 'calc.html') {
  contextBridge.exposeInMainWorld('classcalc', {
    expand: () => ipcRenderer.send('calc-show'),
    shrink: () => ipcRenderer.send('calc-hide'),
    resize: () => {},
    menu: () => ipcRenderer.send('calc-menu'),
    quit: () => ipcRenderer.send('app-quit'),
    holdOpen: on => ipcRenderer.send('calc-hold', on),
    onMode: f => ipcRenderer.on('mode', (e, m) => f(m)),
    onTheme: f => ipcRenderer.on('theme', (e, t) => f(t)),
    onModel: f => ipcRenderer.on('model', (e, m) => f(m)),
    onHelp: f => ipcRenderer.on('help', () => f())
  });
}
