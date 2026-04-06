const CONFIG = {
  SIMPLYBOOK_CLIENT: "YOUR_CLIENT",
  RECAPTCHA_SITE_KEY: "6LcYe5YsAAAAALUgOI3wi2aAY31oz4AMHR3Ad4Vk",
  RECAPTCHA_TEST_SITE_KEY: "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
};

const isLocalRecaptchaHost = ()=>{
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
};

const getRecaptchaSiteKey = ()=> isLocalRecaptchaHost()
  ? CONFIG.RECAPTCHA_TEST_SITE_KEY
  : CONFIG.RECAPTCHA_SITE_KEY;

const shouldUseRecaptcha = ()=> !isLocalRecaptchaHost();

function getSafeStorage(){
  try{
    const testKey = '__mentalia_storage_test__';
    localStorage.setItem(testKey, 'ok');
    localStorage.removeItem(testKey);
    return localStorage;
  }catch(err){
    console.warn('Local storage unavailable, cookie banner will not be persisted.', err);
    return null;
  }
}
const SAFE_STORAGE = getSafeStorage();
const getCookieChoice = ()=> SAFE_STORAGE ? SAFE_STORAGE.getItem('cookiesChoice') : null;
const setCookieChoice = (value)=>{
  if(!SAFE_STORAGE) return false;
  try{
    SAFE_STORAGE.setItem('cookiesChoice', value);
    return true;
  }catch(err){
    console.warn('Failed to persist cookie choice', err);
    return false;
  }
};

const forEachNode = (nodes, callback)=>{
  if(!nodes || typeof callback !== 'function') return;
  for(let i = 0; i < nodes.length; i += 1){
    callback(nodes[i], i);
  }
};

const header = document.getElementById('siteHeader');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('shrink', window.scrollY > 10);
  });
}

const heroSection = document.getElementById('home');
const heroAnim = document.querySelector('.hero-anim');
let heroVideoNodes = Array.from(document.querySelectorAll('.hero-video'));

const heroLogo = document.querySelector('.hero-logo');
const circleOuter = document.getElementById('circle-outer');
const circleMid = document.getElementById('circle-mid');
const circleInner = document.getElementById('circle-inner');
const isTouchViewport = ()=> window.matchMedia('(max-width: 1024px), (pointer: coarse)').matches;

if (heroSection && heroLogo && circleOuter && circleMid && circleInner) {
  const CENTER_X = 681;
  const CENTER_Y = 384;
  const R_OUTER = 260;
  const R_MID = 175;
  const R_INNER = 90;
  const STROKE = 18;
  let rafId = null;
  let targetX = 0;
  let targetY = 0;
  const INITIAL_ANGLE = -40 * (Math.PI / 180);

  const applyPositions = ()=>{
    rafId = null;
    const dx = targetX - CENTER_X;
    const dy = targetY - CENTER_Y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;

    const innerDist = (R_OUTER - R_INNER) - (STROKE / 2);
    const midDist = (R_OUTER - R_MID) - (STROKE / 2);

    circleInner.setAttribute('cx', String(CENTER_X + ux * innerDist));
    circleInner.setAttribute('cy', String(CENTER_Y + uy * innerDist));
    circleMid.setAttribute('cx', String(CENTER_X + ux * midDist));
    circleMid.setAttribute('cy', String(CENTER_Y + uy * midDist));
  };

  const scheduleUpdate = ()=>{
    if (rafId) return;
    rafId = requestAnimationFrame(applyPositions);
  };

  // Start from the original logo pose (upper-right contact on the outer ring).
  targetX = CENTER_X + Math.cos(INITIAL_ANGLE) * 100;
  targetY = CENTER_Y + Math.sin(INITIAL_ANGLE) * 100;
  applyPositions();

  const resetStaticLogo = ()=>{
    targetX = CENTER_X + Math.cos(INITIAL_ANGLE) * 100;
    targetY = CENTER_Y + Math.sin(INITIAL_ANGLE) * 100;
    applyPositions();
  };

  const handleMove = (event)=>{
    if(isTouchViewport()) return;
    const rect = heroLogo.getBoundingClientRect();
    const centerClientX = rect.left + rect.width / 2;
    const centerClientY = rect.top + rect.height / 2;
    const dx = event.clientX - centerClientX;
    const dy = event.clientY - centerClientY;
    targetX = CENTER_X + (dx * (1366 / rect.width));
    targetY = CENTER_Y + (dy * (768 / rect.height));
    scheduleUpdate();
  };

  const syncHeroMode = ()=>{
    const isStatic = isTouchViewport();
    document.body.classList.toggle('mobile-static-hero', isStatic);
    if(isStatic){
      resetStaticLogo();
    }
  };

  syncHeroMode();
  window.addEventListener('resize', syncHeroMode);
  window.addEventListener('pointermove', handleMove, { passive: true });
}


if (heroVideoNodes.length) {
  if (heroVideoNodes.length === 1 && heroAnim) {
    const clone = heroVideoNodes[0].cloneNode(true);
    heroAnim.appendChild(clone);
    heroVideoNodes = [heroVideoNodes[0], clone];
  }

  heroVideoNodes.forEach(video=>{
    video.muted = true;
    video.setAttribute('playsinline', 'true');
    video.loop = false;
    video.pause();
    video.classList.remove('is-active');
  });

  const introVideo = heroVideoNodes[0];
  const loopVideo = heroVideoNodes[1] || heroVideoNodes[0];
  loopVideo.loop = true;
  loopVideo.pause();
  loopVideo.currentTime = 0;
  loopVideo.classList.remove('is-active');

  let initialized = false;
  let loopStarted = false;
  let lastScrollY = window.scrollY;
  const LOOP_TRIGGER = 0.8;
  const FADE_DURATION = 2800;

  const heroInView = ()=>{
    if (!heroSection) return false;
    const rect = heroSection.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  };

  const safePlay = (video)=>{
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function'){
      playPromise.catch(()=>{});
    }
  };

  const startLoopPhase = ()=>{
    if (loopStarted) return;
    loopStarted = true;
    loopVideo.currentTime = 0;
    loopVideo.classList.add('is-active');
    safePlay(loopVideo);
    setTimeout(()=>{
      introVideo.pause();
      introVideo.classList.remove('is-active');
    }, FADE_DURATION);
  };

  const handleIntroTime = ()=>{
    if (!initialized || loopStarted) return;
    const duration = introVideo.duration || 0;
    if (!duration) return;
    if (duration - introVideo.currentTime <= LOOP_TRIGGER){
      startLoopPhase();
      introVideo.removeEventListener('timeupdate', handleIntroTime);
    }
  };

  const startIntro = ()=>{
    if (initialized || document.hidden || !heroInView()) return;
    initialized = true;
    introVideo.currentTime = 0;
    introVideo.classList.add('is-active');
    safePlay(introVideo);
    introVideo.addEventListener('timeupdate', handleIntroTime);
  };

  const handleInitialScroll = ()=>{
    if (initialized) return;
    const currentY = window.scrollY;
    const delta = currentY - lastScrollY;
    lastScrollY = currentY;
    if (delta > 3 && heroInView()) {
      startIntro();
      window.removeEventListener('scroll', handleInitialScroll);
    }
  };

  const handleVisibilityChange = ()=>{
    if (document.hidden || !document.hasFocus()) {
      heroVideoNodes.forEach(video=>video.pause());
      return;
    }
    if (!initialized) return;
    if (!loopStarted) {
      safePlay(introVideo);
    } else {
      safePlay(loopVideo);
    }
  };

  window.addEventListener('scroll', handleInitialScroll, { passive:true });
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', handleVisibilityChange);
  window.addEventListener('blur', handleVisibilityChange);
} else {
  const heroMedia = document.querySelector('.hero-media');
  if (heroMedia && heroMedia.tagName !== 'VIDEO') {
    let lastScrollY = window.scrollY;
    let offset = 0;
    let rafId = null;

    const clamp = (value, min, max)=> Math.min(Math.max(value, min), max);

    const applyTransform = ()=>{
      rafId = null;
      heroMedia.style.transform = `translate3d(0, ${offset}px, 0)`;
    };

    const scheduleTransform = ()=>{
      if (rafId) return;
      rafId = requestAnimationFrame(applyTransform);
    };

    const handleScroll = ()=>{
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY;
      lastScrollY = currentY;
      offset = clamp(offset + delta * 0.2, -120, 120);
      scheduleTransform();
    };

    const handleVisibility = ()=>{
      if (document.hidden) {
        offset = 0;
        heroMedia.style.transform = '';
        rafId = null;
        return;
      }
      lastScrollY = window.scrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive:true });
    window.addEventListener('resize', handleScroll);
    document.addEventListener('visibilitychange', handleVisibility);
  }
}

const toggle = document.querySelector('.menu-toggle');
const nav = document.getElementById('primaryNav');
const closeButton = document.querySelector('.menu-close');
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

const revealBlocks = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && revealBlocks.length) {
  const io = new IntersectionObserver((entries)=>{
    entries
      .filter(e=>e.isIntersecting)
      .sort((a,b)=>{
        const orderA = Number(a.target?.dataset?.revealOrder || 0);
        const orderB = Number(b.target?.dataset?.revealOrder || 0);
        return orderA - orderB;
      })
      .forEach((entry, idx)=>{
        const target = entry.target;
        const baseDelay = Number(target.dataset.revealDelay || 0);
        const stagger = target.dataset.revealStagger ? Number(target.dataset.revealStagger) : 120;
        const totalDelay = baseDelay + idx * stagger;
        target.style.setProperty('--reveal-delay', `${totalDelay}ms`);
        const svc = target.dataset.service;
        const isLeft = svc === 'psychiatry' || svc === 'coaching';
        const isRight = svc === 'psychotherapy' || svc === 'education';
        if (isLeft || isRight){
          const delay = (svc === 'coaching' || svc === 'education') ? '1s' : '0s';
          target.style.setProperty('--slide-delay', delay);
          target.classList.add(isLeft ? 'slide-left' : 'slide-right');
          const icon = target.querySelector('.service-icon-link');
          if (icon){
            icon.classList.add(svc === 'psychiatry' || svc === 'psychotherapy' ? 'icon-slide-down' : 'icon-slide-up');
          }
        }
        requestAnimationFrame(()=>target.classList.add('visible'));
        io.unobserve(target);
      });
  },{threshold:0.15});
  forEachNode(revealBlocks, el=>io.observe(el));
} else {
  forEachNode(revealBlocks, el=>el.classList.add('visible'));
}

document.addEventListener('DOMContentLoaded', () => {
  const y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();

  const heroContent = document.querySelector('.hero-content');
  if (heroContent) {
    requestAnimationFrame(()=>{
      heroContent.classList.add('is-visible');
    });
  }

  const navWrap = document.querySelector('.nav-wrap');
  if (navWrap) {
    requestAnimationFrame(()=>{
      navWrap.classList.add('is-visible');
    });
  }


  const socialRail = document.querySelector('.social-rail');
  if (socialRail) {
    requestAnimationFrame(()=>{
      socialRail.classList.add('is-visible');
    });
  }

  // Smooth scroll for in-page anchors
  const anchorLinks = document.querySelectorAll('a[href^="#"]');
  anchorLinks.forEach(link=>{
    link.addEventListener('click', evt=>{
      const targetId = link.getAttribute('href')?.slice(1);
      if (!targetId) return;
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;
      evt.preventDefault();
      const offset = 0;
      const targetTop = targetEl.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({top: Math.max(targetTop, 0), behavior:'smooth'});
      history.pushState(null, '', `#${targetId}`);
    });
  });

  // If the page loads with a hash (e.g. #team), align the section to the viewport
  if (window.location.hash){
    const targetId = window.location.hash.slice(1);
    const targetEl = document.getElementById(targetId);
    if (targetEl){
      setTimeout(()=>{
        const offset = 0;
        const targetTop = targetEl.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({top: Math.max(targetTop, 0), behavior:'auto'});
      }, 50);
    }
  }

  const serviceLinks = document.querySelectorAll('.cta-card[data-service]');
  if (serviceLinks.length) {
    serviceLinks.forEach(link=>{
      link.target = '_blank';
      link.rel = 'noopener';
      link.addEventListener('click', ()=>{
        const key = link.dataset.service;
        const data = SERVICE_PAGES[key];
        if(!data) return;
        const html = buildServicePage(data, window.location.href);
        const blob = new Blob([html], {type:'text/html'});
        const url = URL.createObjectURL(blob);
        link.href = url;
        setTimeout(()=>URL.revokeObjectURL(url), 1000);
      });
    });
  }

  const cf = document.getElementById('contactForm');
  if(cf){
    const wrap = cf.closest('.contact-form-wrap');
    const msg = document.getElementById('formMsg');
    const success = document.getElementById('formSuccess');
    const captchaNode = document.getElementById('contactRecaptcha');
    const formFields = Array.from(cf.querySelectorAll('input:not([type="checkbox"]), textarea'));
    let recaptchaWidgetId = null;
    const FIELD_ERROR_TEXT = 'Συμπληρώστε σωστά τα στοιχεία σας';
    const NAME_PATTERN = /^[\p{L}\s]+$/u;
    const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    const renderRecaptcha = ()=>{
      if(!shouldUseRecaptcha()){
        captchaNode?.closest('.recaptcha-slot')?.setAttribute('hidden', '');
        return;
      }
      if(!captchaNode || recaptchaWidgetId !== null) return;
      if(!window.grecaptcha || typeof window.grecaptcha.render !== 'function') return;
      recaptchaWidgetId = window.grecaptcha.render(captchaNode, {
        sitekey: getRecaptchaSiteKey()
      });
    };

    if(window.__mentaliaRecaptchaReady){
      renderRecaptcha();
    }else{
      window.addEventListener('mentalia:recaptcha-ready', renderRecaptcha, {once:true});
    }

    const showError = (text)=>{
      if(!msg) return;
      msg.textContent = text;
      msg.classList.remove('visually-hidden');
      msg.classList.add('is-error');
    };

    const clearError = ()=>{
      if(!msg) return;
      msg.textContent = '';
      msg.classList.remove('is-error');
      msg.classList.remove('visually-hidden');
    };

    const getFieldContainer = (field)=> field.closest('.field');

    const setFieldError = (field, text)=>{
      const fieldContainer = getFieldContainer(field);
      if(!fieldContainer) return;
      fieldContainer.classList.add('is-error');
      const errorNode = fieldContainer.querySelector('.field-error');
      if(!errorNode) return;
      errorNode.hidden = false;
      errorNode.textContent = text;
    };

    const clearFieldError = (field)=>{
      const fieldContainer = getFieldContainer(field);
      if(!fieldContainer) return;
      fieldContainer.classList.remove('is-error');
      const errorNode = fieldContainer.querySelector('.field-error');
      if(errorNode){
        errorNode.hidden = true;
        errorNode.textContent = '';
      }
    };

    const validateName = (value)=>{
      const normalized = value.trim().replace(/\s+/g, ' ');
      if(!normalized) return 'Το ονοματεπώνυμο είναι υποχρεωτικό.';
      if(normalized.length < 3) return 'Το ονοματεπώνυμο πρέπει να έχει τουλάχιστον 3 χαρακτήρες.';
      if(!NAME_PATTERN.test(normalized)) return 'Χρησιμοποιήστε μόνο γράμματα και κενά.';
      if(normalized.split(' ').length < 2) return 'Συμπληρώστε όνομα και επώνυμο.';
      return '';
    };

    const validateEmail = (value)=>{
      const normalized = value.trim();
      if(!normalized) return 'Το email είναι υποχρεωτικό.';
      if(/\s/.test(normalized)) return 'Το email δεν πρέπει να περιέχει κενά.';
      if((normalized.match(/@/g) || []).length !== 1) return 'Το email πρέπει να περιέχει ένα μόνο @.';
      if(!EMAIL_PATTERN.test(normalized)) return 'Συμπληρώστε ένα έγκυρο email.';
      return '';
    };

    const validateMessage = (value)=> value.trim()
      ? ''
      : 'Το μήνυμα είναι υποχρεωτικό.';

    const getFieldErrorText = (field)=>{
      if(field.id === 'name') return validateName(field.value);
      if(field.id === 'email') return validateEmail(field.value);
      if(field.id === 'message') return validateMessage(field.value);
      return field.checkValidity() ? '' : FIELD_ERROR_TEXT;
    };

    const validateField = (field, silent = false)=>{
      clearFieldError(field);
      const errorText = getFieldErrorText(field);
      field.setCustomValidity(errorText);

      if(errorText){
        if(!silent){
          setFieldError(field, errorText);
        }
        return false;
      }

      return true;
    };

    formFields.forEach((field)=>{
      field.addEventListener('input', ()=> validateField(field));
      field.addEventListener('blur', ()=> validateField(field));
    });

    cf.addEventListener('submit', async e=>{
      e.preventDefault();
      const invalidFields = formFields.filter((field)=> !validateField(field));
      if(invalidFields.length){
        showError(FIELD_ERROR_TEXT);
        invalidFields[0].focus();
        return;
      }
      if(shouldUseRecaptcha() && window.grecaptcha && typeof window.grecaptcha.getResponse === 'function'){
        const captchaToken = window.grecaptcha.getResponse(recaptchaWidgetId ?? undefined);
        if(!captchaToken){
          showError('Επιβεβαιώστε ότι δεν είστε ρομπότ.');
          return;
        }
        try{
          const response = await fetch('/api/verify-recaptcha', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({token: captchaToken})
          });
          const payload = await response.json();
          if(!response.ok || !payload.success){
            showError('Η επαλήθευση ασφαλείας απέτυχε. Δοκιμάστε ξανά.');
            if(window.grecaptcha && typeof window.grecaptcha.reset === 'function'){
              window.grecaptcha.reset(recaptchaWidgetId ?? undefined);
            }
            return;
          }
        }catch(err){
          showError('Δεν ήταν δυνατή η επαλήθευση ασφαλείας. Δοκιμάστε ξανά.');
          return;
        }
      }

      clearError();
      if(msg){
        msg.textContent = 'Το μήνυμα εστάλη.';
        msg.classList.add('visually-hidden');
      }
      if(wrap) wrap.classList.add('is-sent');
      if(success) success.setAttribute('aria-hidden', 'false');
      cf.reset();
      if(shouldUseRecaptcha() && window.grecaptcha && typeof window.grecaptcha.reset === 'function'){
        window.grecaptcha.reset(recaptchaWidgetId ?? undefined);
      }
    });
  }

  const detailCards = document.querySelectorAll('.service-details');
  const servicePosts = Array.from(document.querySelectorAll('.service-post'));

  const setServiceLayers = ()=>{
    if(!servicePosts.length) return;
    const columns = window.matchMedia('(min-width: 900px)').matches ? 2 : 1;
    servicePosts.forEach((card, idx)=>{
      const row = Math.floor(idx / columns);
      const baseLayer = Math.max(1, 20 - row);
      card.style.setProperty('--layer', String(baseLayer));
    });
  };
  setServiceLayers();
  window.addEventListener('resize', setServiceLayers);

  if(detailCards.length){
    detailCards.forEach(details=>{
      const card = details.closest('.service-post');
      if(!card) return;
      const syncCardState = ()=>{
        card.classList.toggle('is-expanded', details.open);
      };
      syncCardState();
      details.addEventListener('toggle', syncCardState);
    });
  }

  initCookieBanner();
});

const slider = document.querySelector('.team-slider');
if (slider) {
  let scrollDir = 1;
  setInterval(()=>{
    slider.scrollBy({left: slider.clientWidth * 0.8 * scrollDir, behavior:'smooth'});
    if (slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 10) scrollDir = -1;
    if (slider.scrollLeft <= 10) scrollDir = 1;
  }, 4000);
}

document.addEventListener('DOMContentLoaded', ()=>{
  const sb = document.querySelector('.sb-container iframe');
  if (sb && CONFIG.SIMPLYBOOK_CLIENT && CONFIG.SIMPLYBOOK_CLIENT !== 'YOUR_CLIENT') {
    try{
      const url = new URL(sb.src);
      url.searchParams.set('client', CONFIG.SIMPLYBOOK_CLIENT);
      sb.src = url.toString();
    }catch(e){ console.warn('SimplyBook URL not updated:', e); }
  }
  const teamSection = document.getElementById('team');
  if (teamSection){
    const teamContainer = teamSection.querySelector('.container');
    const miniGrids = Array.from(teamSection.querySelectorAll('.team-mini-grid'));
    const triggeredGrids = new WeakSet();
    const tryTriggerGrids = ()=>{
      const vh = window.innerHeight || document.documentElement.clientHeight || 0;
      let allTriggered = true;
      miniGrids.forEach(grid=>{
        if (triggeredGrids.has(grid)) return;
        allTriggered = false;
        const rect = grid.getBoundingClientRect();
        const gridVisible = rect.top < vh * 0.8 && rect.bottom > vh * 0.1;
        if (gridVisible){
          grid.classList.add('pop-trigger');
          triggeredGrids.add(grid);
        }
      });
      if (allTriggered){
        window.removeEventListener('scroll', tryTriggerGrids, true);
        window.removeEventListener('resize', tryTriggerGrids, true);
      }
    };
    if (miniGrids.length){
      window.addEventListener('scroll', tryTriggerGrids, {passive:true, capture:true});
      window.addEventListener('resize', tryTriggerGrids, {passive:true, capture:true});
      requestAnimationFrame(tryTriggerGrids);
    }

    const resetTeamAnim = ()=>{
      teamSection.classList.remove('team-animate');
      void teamSection.offsetWidth; // reflow για να επανεκκινεί το animation
    };
    const triggerTeamAnim = ()=>{
      resetTeamAnim();
      teamSection.classList.add('team-animate');
      if (teamContainer){
        teamContainer.classList.add('visible');
      }
    };
    const teamInView = ()=>{
      const rect = teamSection.getBoundingClientRect();
      const viewHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      return rect.top < viewHeight * 0.85 && rect.bottom > viewHeight * 0.1;
    };
    let observer = null;
    const runAndCleanup = ()=>{
      triggerTeamAnim();
      if (observer){
        observer.disconnect();
        observer = null;
      }
      window.removeEventListener('scroll', manualCheck, listenerOpts);
      window.removeEventListener('resize', manualCheck, listenerOpts);
    };
    const manualCheck = ()=>{
      if (teamInView()) runAndCleanup();
    };
    const listenerOpts = {passive:true};
    if ('IntersectionObserver' in window){
      observer = new IntersectionObserver((entries)=>{
        entries.forEach(entry=>{
          if (entry.isIntersecting){
            runAndCleanup();
          }
        });
      }, {threshold:0.18});
      observer.observe(teamSection);
      window.addEventListener('scroll', manualCheck, listenerOpts);
      window.addEventListener('resize', manualCheck, listenerOpts);
    } else {
      window.addEventListener('scroll', manualCheck, listenerOpts);
      window.addEventListener('resize', manualCheck, listenerOpts);
      manualCheck();
    }
    // Αν ο χρήστης φορτώνει απευθείας στο #team (π.χ. refresh σε anchor)
    if (window.location.hash === '#team' && teamInView()){
      runAndCleanup();
    }
  }
});

// Parallax background + panels
(() => {
  const parallaxSections = Array.from(document.querySelectorAll('.parallax-section'));
  if (!parallaxSections.length) return;

  const clamp = (v, min, max)=>Math.min(Math.max(v, min), max);
  let rafId = null;

  const updateParallax = ()=>{
    rafId = null;
    const y = window.scrollY || 0;
    document.documentElement.style.setProperty('--bg-parallax', `${-y * 0.04}px`);
    parallaxSections.forEach(section=>{
      const rect = section.getBoundingClientRect();
      const progress = 1 - rect.top / (window.innerHeight || 1);
      const shift = clamp((progress - 0.5) * 14, -26, 26);
      section.style.setProperty('--panel-shift', `${shift}px`);
    });
  };

  const onScroll = ()=>{
    if (rafId) return;
    rafId = requestAnimationFrame(updateParallax);
  };

  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', onScroll);
  updateParallax();
})();

const POSTS = [
  {
    slug: "blog-holistic-care.html",
    title: "Τι είναι η ολιστική φροντίδα ψυχικής υγείας;",
    date: "2025-10-01",
    excerpt: "Η ολιστική φροντίδα βλέπει τον άνθρωπο πέρα από τα συμπτώματα: συνδέει ιατρική, ψυχοθεραπεία και τεχνολογία με τρόπο που σέβεται τη μοναδικότητα κάθε ατόμου.",
    tags: ["Ολιστική φροντίδα", "Mind-body", "Εξατομίκευση"]
  },
  {
    slug: "blog-anxiety-management.html",
    title: "Άγχος: πρακτικά βήματα διαχείρισης",
    date: "2025-09-20",
    excerpt: "Απλές τεχνικές που μειώνουν το φορτίο του άγχους: ρύθμιση αναπνοής, αναδόμηση σκέψεων και μικρά σχέδια δράσης που χτίζουν ανθεκτικότητα.",
    tags: ["Άγχος", "CBT", "Αυτοφροντίδα"]
  },
  {
    slug: "blog-ai-mental-health.html",
    title: "Τεχνητή Νοημοσύνη στην ψυχική υγεία",
    date: "2025-08-10",
    excerpt: "Η AI λειτουργεί ως βοηθός του κλινικού: οργανώνει δεδομένα, εντοπίζει μοτίβα και υποστηρίζει την παρακολούθηση προόδου, πάντα με ανθρώπινη εποπτεία.",
    tags: ["Τεχνολογία", "AI", "Καινοτομία"]
  }
];

function buildPostCards(posts){
  return posts.map((p)=>{
    const tags = (p.tags || []).map(tag=>`<span class="post-tag">${tag}</span>`).join('');
    const monthLabel = new Date(`${p.date}T00:00:00`).toLocaleDateString('el-GR', { month: 'short' }).replace('.', '');
    const dayLabel = new Date(`${p.date}T00:00:00`).toLocaleDateString('el-GR', { day: '2-digit' });
    return `
      <a class="post post-card" href="${p.slug}" aria-label="Διαβάστε το άρθρο: ${p.title}">
        <div class="post-meta">
          <div class="post-tags">${tags}</div>
        </div>
        <h3>${p.title}</h3>
        <div class="post-card__date" aria-hidden="true">
          <strong>${dayLabel}</strong>
          <span>${monthLabel}</span>
        </div>
        <p class="post-lead">${p.excerpt}</p>
        <span class="post-cta">Διαβάστε το άρθρο</span>
      </a>
    `;
  }).join('');
}

function renderBlog(){
  const posts = [...POSTS].sort((a,b)=> new Date(b.date) - new Date(a.date));
  const recent = document.getElementById('blogRecent');
  const library = document.getElementById('blogLibrary');
  if(recent){
    recent.innerHTML = buildPostCards(posts.slice(0, 3));
  }
  if(library){
    library.innerHTML = buildPostCards(posts);
  }
}
renderBlog();

function initCookieBanner(){
  const bar = document.getElementById('cookiesBar');
  if(!bar) return;
  const card = bar.querySelector('.cookies-card');
  const setBarVisibility = (isVisible)=>{
    bar.hidden = !isVisible;
    bar.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
    bar.style.display = isVisible ? 'grid' : 'none';
    if(isVisible && card){
      requestAnimationFrame(()=>{
        card.classList.add('is-visible');
      });
    }else if(card){
      card.classList.remove('is-visible');
    }
  };
  const buttons = bar.querySelectorAll('[data-action]');
  if(!buttons.length) return;
  const feedback = document.getElementById('cookiesFeedback');

  const handleChoice = (choice)=>{
    if(!choice) return;
    const persisted = setCookieChoice(choice);
    if (feedback) {
      feedback.hidden = false;
      feedback.textContent = choice === 'accept'
        ? 'Έκανες αποδοχή των cookies. Μπορείς να αλλάξεις επιλογή από τις ρυθμίσεις του browser.'
        : 'Απέρριψες τα μη απαραίτητα cookies. Η βασική λειτουργικότητα παραμένει ενεργή.';
      if(!persisted){
        feedback.textContent += ' (Δεν ήταν δυνατό να αποθηκεύσουμε την επιλογή σε αυτό το πρόγραμμα.)';
      }
    }
    setBarVisibility(false);
  };

  setBarVisibility(true);

  const attachHandler = (btn)=>{
    if(!btn) return;
    btn.addEventListener('click', (event)=>{
      event.preventDefault();
      handleChoice(btn.dataset.action);
    });
  };

  forEachNode(buttons, attachHandler);

  window.__mentaliaHandleCookies = (choice)=>{
    handleChoice(choice);
    return false;
  };
}
const SERVICE_PAGES = {
  psychiatry: {
    title: "ΨΥΧΙΑΤΡΙΚΗ ΦΡΟΝΤΙΔΑ",
    intro: "Ολοκληρωμένη αξιολόγηση, διάγνωση και φαρμακευτική παρακολούθηση με εξατομικευμένο πλάνο.",
    bullets: [
      "Ψυχιατρική αξιολόγηση & διάγνωση",
      "Συνταγογράφηση και παρακολούθηση φαρμακευτικής αγωγής",
      "Διαχείριση αγχωδών, καταθλιπτικών, ψυχωτικών & διπολικών διαταραχών",
      "Follow-up συνεδρίες και συνεχής υποστήριξη"
    ],
    cta: "Κλείσε ραντεβού στο info@mentalia.gr"
  },
  psychotherapy: {
    title: "ΨΥΧΟΘΕΡΑΠΕΙΑ",
    intro: "Εξειδικευμένα θεραπευτικά προγράμματα για άτομα, ζεύγη, οικογένειες και ομάδες.",
    bullets: [
      "Ατομική ψυχοθεραπεία (CBT / ACT / EMDR)",
      "Θεραπεία ζεύγους και οικογενειακή θεραπεία",
      "Ομαδικά προγράμματα και ψυχοεκπαίδευση",
      "Συμβουλευτική για ύπνο, στρες & ψυχοσωματικά"
    ],
    cta: "Έναρξη συνεδρίας στο info@mentalia.gr"
  },
  coaching: {
    title: "COACHING & ΑΝΑΠΤΥΞΗ",
    intro: "Life & executive coaching με στόχο την ηγεσία, το reskilling και την ψυχική ανθεκτικότητα.",
    bullets: [
      "Προσωπικό coaching πλάνο",
      "Executive coaching για ηγέτες & ομάδες",
      "Προγράμματα διαχείρισης άγχους και burnout",
      "Υποστήριξη φροντιστών & επαγγελματιών υγείας"
    ],
    cta: "Ζήτησε ενημέρωση στο info@mentalia.gr"
  },
  education: {
    title: "ΕΚΠΑΙΔΕΥΣΗ & ΣΕΜΙΝΑΡΙΑ",
    intro: "Workshops, tailor-made προγράμματα και ολιστικές ψυχοεκπαιδευτικές δράσεις.",
    bullets: [
      "Θεματικά workshops για ομάδες & εταιρείες",
      "Ψυχοεκπαιδευτικά modules για δεξιότητες",
      "Ιατρικές γνωματεύσεις & επίσημες βεβαιώσεις",
      "Παρεμβάσεις στο εργασιακό περιβάλλον"
    ],
    cta: "Ζήτησε προσφορά στο info@mentalia.gr"
  }
};

const buildServicePage = (data, currentUrl)=>{
  const cssHref = new URL('style.css', currentUrl).href;
  return `<!doctype html>
  <html lang="el">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${data.title} | MENTALIA</title>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <link rel="stylesheet" href="${cssHref}" />
      <style>
        main{min-height:100vh;display:flex;align-items:center}
        .service-content{background:rgba(255,255,255,.9);border-radius:1.2rem;padding:2rem;box-shadow:0 25px 50px rgba(0,0,0,.15)}
        .service-content h1{text-align:center;margin-top:0}
        .service-content ul{list-style:disc;margin:1rem 0 2rem 1.2rem;color:var(--text)}
      </style>
    </head>
    <body>
      <main class="fullpage-section tone-cream">
        <div class="container narrow service-content">
          <h1>${data.title}</h1>
          <p>${data.intro}</p>
          <ul>
            ${data.bullets.map(item=>`<li>${item}</li>`).join('')}
          </ul>
          <p class="center"><a class="btn" href="mailto:info@mentalia.gr">${data.cta}</a></p>
          <p class="center"><a class="btn outline" href="${currentUrl}" target="_self">Επιστροφή στην αρχική</a></p>
        </div>
      </main>
    </body>
  </html>`;
};
