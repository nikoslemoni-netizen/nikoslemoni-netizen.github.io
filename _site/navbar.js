const toggle = document.querySelector('.menu-toggle');
const nav = document.getElementById('primaryNav');
const closeButton = document.querySelector('.menu-close');
const logoLink = document.querySelector('.logo-link');
const navWrap = document.querySelector('.nav-wrap');
const articleBackLink = document.querySelector('.article-back');
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
    document.body.classList.toggle('menu-open', open);
    closeButton?.classList.toggle('is-open', open);
  };

  toggle.addEventListener('click', () => {
    const open = nav.classList.contains('is-open');
    setMenuState(!open);
  });

  nav.querySelectorAll('a').forEach((link)=>{
    link.addEventListener('click', ()=> setMenuState(false));
  });

  closeButton?.addEventListener('click', ()=> setMenuState(false));

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
