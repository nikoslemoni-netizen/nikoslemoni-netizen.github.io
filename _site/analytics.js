const MENTALIA_GA_ID = 'G-1HN4BGTK3S';
const MENTALIA_COOKIE_KEY = 'cookiesChoice';

const mentaliaAnalytics = (() => {
  const disableKey = `ga-disable-${MENTALIA_GA_ID}`;
  let scriptPromise = null;
  let isConfigured = false;

  const safeGetChoice = () => {
    try{
      return sessionStorage.getItem(MENTALIA_COOKIE_KEY);
    }catch(err){
      return null;
    }
  };

  const safeSetChoice = (value) => {
    try{
      sessionStorage.setItem(MENTALIA_COOKIE_KEY, value);
      return true;
    }catch(err){
      console.warn('Failed to persist cookie choice', err);
      return false;
    }
  };

  const ensureGtag = () => {
    window.dataLayer = window.dataLayer || [];
    if(typeof window.gtag !== 'function'){
      window.gtag = function gtag(){ window.dataLayer.push(arguments); };
    }
    window.gtag('consent', 'default', {
      analytics_storage: 'denied'
    });
  };

  const loadScript = () => {
    if(scriptPromise) return scriptPromise;
    scriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-mentalia-ga="${MENTALIA_GA_ID}"]`);
      if(existing){
        if(existing.dataset.loaded === 'true'){
          resolve();
          return;
        }
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${MENTALIA_GA_ID}`;
      script.dataset.mentaliaGa = MENTALIA_GA_ID;
      script.addEventListener('load', () => {
        script.dataset.loaded = 'true';
        resolve();
      }, { once: true });
      script.addEventListener('error', reject, { once: true });
      document.head.appendChild(script);
    });
    return scriptPromise;
  };

  const enable = async () => {
    window[disableKey] = false;
    ensureGtag();
    try{
      await loadScript();
      window.gtag('consent', 'update', {
        analytics_storage: 'granted'
      });
      if(!isConfigured){
        window.gtag('js', new Date());
        window.gtag('config', MENTALIA_GA_ID);
        isConfigured = true;
      }
    }catch(err){
      console.warn('Google Analytics failed to load.', err);
    }
  };

  const disable = () => {
    window[disableKey] = true;
    ensureGtag();
    window.gtag('consent', 'update', {
      analytics_storage: 'denied'
    });
  };

  const setConsent = (choice) => {
    if(choice === 'accept'){
      enable();
      return;
    }
    disable();
  };

  const wireBanner = () => {
    const bar = document.getElementById('cookiesBar');
    if(!bar) return;
    const card = bar.querySelector('.cookies-card');
    const feedback = bar.querySelector('#cookiesFeedback');
    const currentChoice = safeGetChoice();

    const setBarVisibility = (isVisible) => {
      bar.hidden = !isVisible;
      bar.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
      bar.style.display = isVisible ? 'grid' : 'none';
      if(card){
        if(isVisible){
          requestAnimationFrame(() => {
            card.classList.add('is-visible');
          });
        }else{
          card.classList.remove('is-visible');
        }
      }
    };

    const handleChoice = (choice) => {
      if(choice !== 'accept' && choice !== 'reject') return false;
      const persisted = safeSetChoice(choice);
      setConsent(choice);
      if(feedback){
        feedback.hidden = false;
        feedback.textContent = choice === 'accept'
          ? 'Έκανες αποδοχή των cookies.'
          : 'Απέρριψες τα μη απαραίτητα cookies.';
        if(!persisted){
          feedback.textContent += ' Δεν ήταν δυνατό να αποθηκευτεί η επιλογή σου.';
        }
      }
      setTimeout(() => setBarVisibility(false), 120);
      return false;
    };

    bar.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        handleChoice(btn.dataset.action);
      });
    });

    window.__mentaliaHandleCookies = handleChoice;
    setBarVisibility(!currentChoice);
  };

  disable();
  if(safeGetChoice() === 'accept'){
    enable();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', wireBanner, { once: true });
  }else{
    wireBanner();
  }

  return { setConsent };
})();

window.__mentaliaAnalytics = mentaliaAnalytics;
