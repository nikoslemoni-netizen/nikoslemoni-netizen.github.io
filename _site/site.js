// MENTALIA — shared behaviour for inner pages: menu, header state, reveal, year.
document.documentElement.classList.add('js');
document.addEventListener('DOMContentLoaded', () => {
  initToTop();
  initNewBadges();
  if (!document.body.classList.contains('inner')) return;   // the home page runs its own menu/header code
  const top = document.getElementById('top');
  const menuBtn = document.getElementById('menuBtn');
  const nav = document.getElementById('nav');

  const onScroll = () => top && top.classList.toggle('solid', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (menuBtn && nav) {
    const close = () => { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); };
    menuBtn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
    addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  const blocks = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.filter(e => e.isIntersecting).forEach((e, i) => {
        e.target.style.setProperty('--reveal-delay', (i * 110) + 'ms');
        e.target.classList.add('visible');
        io.unobserve(e.target);
      });
    }, { threshold: 0.12 });
    blocks.forEach(el => io.observe(el));
  } else {
    blocks.forEach(el => el.classList.add('visible'));
  }

  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
});

// "back to top" button on every page; on the home page it appears once the film is over
function initToTop() {
  const btn = document.createElement('a');
  btn.href = '#top'; btn.className = 'totop'; btn.setAttribute('aria-label', 'Επιστροφή στην αρχή της σελίδας');
  btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5"/></svg><span>Αρχή</span>';
  document.body.appendChild(btn);
  const film = document.querySelector('.film');
  const limit = () => film ? film.offsetHeight - innerHeight * 0.5 : innerHeight * 0.9;
  const update = () => btn.classList.toggle('show', scrollY > limit());
  addEventListener('scroll', update, { passive: true }); addEventListener('resize', update); update();
  btn.addEventListener('click', e => {
    e.preventDefault();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    history.replaceState(null, '', location.pathname + location.search);
    document.querySelector('.wordmark')?.focus({ preventScroll: true });
  });
}

// "ΝΕΟ" badge on fresh articles: shown until the date in data-new-until (two days after publishing)
function initNewBadges() {
  document.querySelectorAll('[data-new-until]').forEach(card => {
    const until = Date.parse(card.dataset.newUntil);
    const left = until - Date.now();
    if (!Number.isFinite(left) || left <= 0) return;
    const badge = document.createElement('span');
    badge.className = 'post-new'; badge.textContent = 'ΝΕΟ';
    badge.setAttribute('aria-label', 'Νέο άρθρο');
    (card.querySelector('.post-meta') || card.querySelector('.t') || card).appendChild(badge);
    setTimeout(() => badge.remove(), Math.min(left, 2147483647));
  });
}
