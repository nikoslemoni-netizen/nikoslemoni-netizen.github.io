(function () {
  var left = document.querySelector('.left');
  if (!left) return;
  var mq = window.matchMedia('(max-width:1080px)');

  var BUFFER = 100; // extra px of breathing room left above the viewport bottom when pinned
  var lastApplied = null;

  function apply() {
    if (!mq.matches) {
      if (lastApplied !== '') {
        left.style.top = '';
        lastApplied = '';
      }
      return;
    }
    var offset = window.innerHeight - left.offsetHeight - BUFFER;
    var value = (offset < 0 ? offset : 0) + 'px';
    if (value !== lastApplied) {
      left.style.top = value;
      lastApplied = value;
    }
  }

  function start() {
    apply();

    // Catch any late content reflow (e.g. a slow-loading web font swapping
    // in) for a short grace window right after load, then disconnect for
    // good — so nothing can shift the pin point once the user is actually
    // scrolling.
    if ('ResizeObserver' in window) {
      var ro = new ResizeObserver(apply);
      ro.observe(left);
      setTimeout(function () { ro.disconnect(); }, 2000);
    }

    // Mobile browsers change window.innerHeight as the address bar shows/hides
    // while scrolling, firing spurious resize events. Only react to a real
    // width change (rotation / different device), never a height-only one,
    // so the pin point never shifts mid-scroll.
    var lastWidth = window.innerWidth;
    window.addEventListener('resize', function () {
      if (window.innerWidth === lastWidth) {
        return;
      }
      lastWidth = window.innerWidth;
      apply();
    });
  }

  // Wait for web fonts (and a short settle delay) so the initial measurement
  // is taken after layout has finished shifting, avoiding a second re-pin
  // mid-scroll. Race against a timeout so a slow/blocked font request can
  // never leave the panel unpinned indefinitely.
  var fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  var timeout = new Promise(function (resolve) { setTimeout(resolve, 500); });
  Promise.race([fontsReady, timeout]).then(function () {
    setTimeout(start, 50);
  });
})();
