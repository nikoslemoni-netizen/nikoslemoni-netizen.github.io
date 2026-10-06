const MENTALIA_GA_ID = 'G-1HN4BGTK3S';

(() => {
  window[`ga-disable-${MENTALIA_GA_ID}`] = false;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(){ window.dataLayer.push(arguments); };

  window.gtag('js', new Date());
  window.gtag('config', MENTALIA_GA_ID);

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MENTALIA_GA_ID}`;
  script.dataset.mentaliaGa = MENTALIA_GA_ID;
  script.addEventListener('error', () => {
    console.warn('Google Analytics failed to load.');
  }, { once: true });
  document.head.appendChild(script);
})();
