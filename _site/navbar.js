const toggle = document.querySelector('.menu-toggle');
const nav = document.getElementById('primaryNav');
const logoLink = document.querySelector('.logo-link');
const navWrap = document.querySelector('.nav-wrap');
const articleBackLink = document.querySelector('.article-back');

function initNavCurrentState(){
  if(!nav) return;
  const links = Array.from(nav.querySelectorAll('a'));
  if(!links.length) return;

  const clearCurrent = ()=>{
    links.forEach((link)=> link.removeAttribute('aria-current'));
  };

  const setCurrent = (matcher)=>{
    const match = links.find(matcher);
    if(!match) return false;
    clearCurrent();
    match.setAttribute('aria-current', 'page');
    return true;
  };

  const path = window.location.pathname.split('/').pop() || 'index.html';
  const hash = window.location.hash.replace('#', '');

  if(path === 'about.html'){
    setCurrent((link)=> (link.getAttribute('href') || '') === 'about.html');
    return;
  }

  if(
    path === 'blog.html' ||
    path === 'blog-library.html'
  ){
    setCurrent((link)=> (link.getAttribute('href') || '') === 'blog.html' || (link.getAttribute('href') || '') === 'blog-library.html');
    return;
  }

  if(path === 'index.html' || path === ''){
    if(hash === 'services' || hash === 'team' || hash === 'contact' || hash === 'home'){
      setCurrent((link)=>{
        const href = link.getAttribute('href') || '';
        return href === `#${hash}` || href === `index.html#${hash}`;
      });
      return;
    }
    setCurrent((link)=>{
      const href = link.getAttribute('href') || '';
      return href === '#home' || href === 'index.html#home';
    });
  }
}

initNavCurrentState();

if(navWrap){
  navWrap.classList.add('is-visible');
}
if(logoLink){
  logoLink.style.display = 'flex';
}
if(articleBackLink){
  const defaultHref = articleBackLink.getAttribute('href') || 'blog.html';
  const defaultLabel = articleBackLink.textContent.trim() || 'Επιστροφή';
  try{
    const referrerUrl = document.referrer ? new URL(document.referrer) : null;
    const isSameOrigin = referrerUrl && referrerUrl.origin === window.location.origin;
    if(isSameOrigin){
      const refPath = referrerUrl.pathname.split('/').pop() || '';
      if(refPath === 'blog-library.html'){
        articleBackLink.setAttribute('href', 'blog-library.html');
        articleBackLink.textContent = 'ΒΙΒΛΙΟΘΗΚΗ';
      }else if(refPath === 'blog.html'){
        articleBackLink.setAttribute('href', 'blog.html');
        articleBackLink.textContent = 'Επιστροφή';
      }else{
        articleBackLink.setAttribute('href', defaultHref);
        articleBackLink.textContent = defaultLabel;
      }
    }
  }catch(err){
    articleBackLink.setAttribute('href', defaultHref);
    articleBackLink.textContent = defaultLabel;
  }
}
if (toggle && nav) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:98;display:none;cursor:pointer';
  document.body.appendChild(overlay);

  const setMenuState = (open)=>{
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Κλείσιμο μενού' : 'Άνοιγμα μενού');
    document.body.classList.toggle('menu-open', open);
    overlay.style.display = open ? 'block' : 'none';
  };

  toggle.addEventListener('click', ()=>{
    setMenuState(!nav.classList.contains('is-open'));
  });

  overlay.addEventListener('click', ()=> setMenuState(false));

  let _tx = 0, _ty = 0;
  overlay.addEventListener('touchstart', e=>{ _tx = e.touches[0].clientX; _ty = e.touches[0].clientY; }, {passive:true});
  overlay.addEventListener('touchend', e=>{
    const dx = Math.abs(e.changedTouches[0].clientX - _tx);
    const dy = Math.abs(e.changedTouches[0].clientY - _ty);
    if(dx < 8 && dy < 8) setMenuState(false);
  }, {passive:true});

  nav.querySelectorAll('a').forEach((link)=>{
    link.addEventListener('click', ()=> setMenuState(false));
  });

  window.addEventListener('resize', ()=>{
    if(window.innerWidth > 900) setMenuState(false);
  });

  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape') setMenuState(false);
  });
}
