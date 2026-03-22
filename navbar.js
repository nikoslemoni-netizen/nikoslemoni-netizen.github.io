const toggle = document.querySelector('.menu-toggle');
const nav = document.getElementById('primaryNav');
const logoLink = document.querySelector('.logo-link');
const navWrap = document.querySelector('.nav-wrap');
if(navWrap){
  navWrap.classList.add('is-visible');
}
if(logoLink){
  logoLink.style.display = 'flex';
}
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.style.display === 'flex';
    nav.style.display = open ? '' : 'flex';
    toggle.setAttribute('aria-expanded', String(!open));
  });
}
