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
    path === 'blog-library.html' ||
    path === 'blog-ai-mental-health.html' ||
    path === 'blog-anxiety-management.html' ||
    path === 'blog-holistic-care.html'
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
  const setMenuState = (open)=>{
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Κλείσιμο μενού' : 'Άνοιγμα μενού');
    document.body.classList.toggle('menu-open', open);
  };

  toggle.addEventListener('click', () => {
    const open = nav.classList.contains('is-open');
    setMenuState(!open);
  });

  nav.querySelectorAll('a').forEach((link)=>{
    link.addEventListener('click', ()=> setMenuState(false));
  });

  window.addEventListener('resize', ()=>{
    if(window.innerWidth > 900){
      setMenuState(false);
    }
  });

  document.addEventListener('keydown', (event)=>{
    if(event.key === 'Escape'){
      setMenuState(false);
    }
  });
}
