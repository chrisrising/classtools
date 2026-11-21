// A lime glow round whatever button was just pressed, fading away over two seconds, so a class
// watching the board can see which button was used. The glow is drawn as a ring on top of the
// button rather than as its box-shadow, so buttons that have a shadow of their own keep it.
(function(){
  var style = document.createElement('style');
  style.textContent =
    '@keyframes ctPressGlow{0%{opacity:1}60%{opacity:.55}100%{opacity:0}}' +
    '.ct-glow-host{position:relative}' +
    '.ct-press-glow::after{content:"";position:absolute;inset:-2px;border-radius:inherit;' +
    'pointer-events:none;z-index:5;box-shadow:0 0 0 3px rgba(132,204,22,.95),0 0 20px 8px rgba(132,204,22,.85);' +
    'animation:ctPressGlow 2s ease-out forwards}';
  (document.head || document.documentElement).appendChild(style);

  var SEL = 'button,[role="button"],.key,.tile,.mbtn,summary';
  function glow(el){
    if (getComputedStyle(el).position === 'static') el.classList.add('ct-glow-host');
    // Taken off and put back on so pressing the same button again restarts the fade.
    el.classList.remove('ct-press-glow');
    void el.offsetWidth;
    el.classList.add('ct-press-glow');
    clearTimeout(el.__ctGlowT);
    el.__ctGlowT = setTimeout(function(){ el.classList.remove('ct-press-glow'); }, 2050);
  }
  // Captured, so it still runs for buttons whose own handler stops the event going further.
  document.addEventListener('pointerdown', function(e){
    if (e.button !== undefined && e.button !== 0) return;
    var el = e.target && e.target.closest ? e.target.closest(SEL) : null;
    if (el && !el.disabled) glow(el);
  }, true);
})();
