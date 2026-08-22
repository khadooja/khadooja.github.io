/* ================================================================
   KHADIJA ALAMOUDI PORTFOLIO — main.js
================================================================ */

'use strict';

/* ── Detect reduced motion ── */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ================================================================
   MOCKUP SCALER
   Two modes:
   - RATIO mode (default): container has padding-top ratio, iframe
     scales to match container width. Used for cards/mindtrack.
   - FILL mode (featured): container is position:absolute inset:0,
     iframe scales to COVER the container (like object-fit:cover
     but anchored top-left for best poster visibility).
================================================================ */
function initMockupScaler(wrap) {
  const src = wrap.dataset.src;
  if (!src) return;

  const ratio  = wrap.dataset.ratio || '1500x980';
  const [nW, nH] = ratio.split('x').map(Number);

  /* Detect fill mode: featured visual uses position:absolute inset:0 */
  const isFill = wrap.closest('.proj-featured-visual') !== null;

  const iframe = document.createElement('iframe');
  iframe.src          = src;
  iframe.title        = wrap.dataset.title || 'App preview';
  iframe.loading      = 'lazy';
  iframe.scrolling    = 'no';
  iframe.setAttribute('aria-label', wrap.dataset.title
    ? `${wrap.dataset.title} app preview` : 'App preview');
  Object.assign(iframe.style, {
    position:        'absolute',
    top:             '0',
    left:            '0',
    width:           nW + 'px',
    height:          nH + 'px',
    border:          'none',
    pointerEvents:   'none',
    transformOrigin: 'top left',
  });
  wrap.appendChild(iframe);

  function scale() {
    if (isFill) {
      /* FILL MODE: scale so poster covers the container fully.
         Use whichever axis gives a larger scale factor. */
      const cw = wrap.offsetWidth;
      const ch = wrap.offsetHeight;
      if (!cw || !ch) return;
      const scaleW = cw / nW;
      const scaleH = ch / nH;
      /* Use the larger scale so the poster covers — anchored top-left
         so the top of the poster (with app UI) is always visible */
      const s = Math.max(scaleW, scaleH);
      iframe.style.transform = `scale(${s})`;
    } else {
      /* RATIO MODE: scale to container width, height follows ratio */
      const cw = wrap.clientWidth;
      const s  = cw / nW;
      iframe.style.transform = `scale(${s})`;
    }
  }

  scale();
  const ro = new ResizeObserver(scale);
  ro.observe(wrap);
  /* Also observe the parent panel for fill mode */
  if (isFill && wrap.parentElement) ro.observe(wrap.parentElement);
  window.addEventListener('resize', scale, { passive: true });
}

/* Initialise all scalers */
document.querySelectorAll('.ms-wrap[data-src]').forEach(initMockupScaler);

/* ================================================================
   LIGHTBOX — shows full poster, max viewport width
================================================================ */
const lb        = document.getElementById('lb');
const lbScaler  = document.getElementById('lb-scaler');
const lbCaption = document.getElementById('lb-caption');
const lbClose   = document.getElementById('lb-close');
let   lbRO      = null;

function openLightbox(src, title, ratio) {
  const [nW, nH] = (ratio || '1500x980').split('x').map(Number);
  const ptop = ((nH / nW) * 100).toFixed(4) + '%';

  lbScaler.innerHTML        = '';
  lbScaler.style.paddingTop = ptop;
  lbCaption.textContent     = (title ? title + ' · ' : '') + 'Press Esc to close';
  if (lbRO) { lbRO.disconnect(); lbRO = null; }

  const iframe = document.createElement('iframe');
  iframe.src     = src;
  iframe.title   = title || 'App preview';
  iframe.scrolling = 'no';
  iframe.setAttribute('aria-label', `${title || 'App'} fullscreen preview`);
  Object.assign(iframe.style, {
    position: 'absolute', top: '0', left: '0',
    width:    nW + 'px', height: nH + 'px',
    border:   'none', pointerEvents: 'none',
    transformOrigin: 'top left',
  });
  lbScaler.appendChild(iframe);

  function scaleLb() {
    const cw = lbScaler.clientWidth;
    if (!cw) return;
    iframe.style.transform = `scale(${cw / nW})`;
  }
  scaleLb();
  lbRO = new ResizeObserver(scaleLb);
  lbRO.observe(lbScaler);

  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
  lbClose.focus();
}

function closeLightbox() {
  lb.classList.remove('open');
  document.body.style.overflow = '';
  setTimeout(() => {
    lbScaler.innerHTML = '';
    if (lbRO) { lbRO.disconnect(); lbRO = null; }
  }, 300);
}

if (lbClose) lbClose.addEventListener('click', closeLightbox);
if (lb)      lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && lb.classList.contains('open')) closeLightbox();
});

/* Wire click areas (data-src wrappers have ms-click-area buttons) */
document.querySelectorAll('.ms-click-area').forEach(area => {
  area.addEventListener('click', () => {
    const wrap = area.closest('.ms-wrap');
    if (wrap?.dataset.src)
      openLightbox(wrap.dataset.src, wrap.dataset.title, wrap.dataset.ratio);
  });
});

/* ================================================================
   NAVIGATION
================================================================ */
const nav = document.getElementById('main-nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('stuck', window.scrollY > 24);
}, { passive: true });

/* Active link highlight */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');
new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting)
      navLinks.forEach(l =>
        l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
  });
}, { rootMargin: '-40% 0px -55% 0px' }).observe(document.body); // dummy, real below
sections.forEach(s =>
  new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting)
        navLinks.forEach(l =>
          l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-40% 0px -55% 0px' }).observe(s)
);

/* Mobile menu */
const burger  = document.getElementById('nav-burger');
const mobMenu = document.getElementById('nav-mob-menu');
burger.addEventListener('click', () => {
  const open = mobMenu.classList.toggle('open');
  burger.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', open);
  document.body.style.overflow = open ? 'hidden' : '';
});
document.querySelectorAll('.nav-mob-link').forEach(l =>
  l.addEventListener('click', () => {
    mobMenu.classList.remove('open');
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  })
);

/* ================================================================
   HERO ENTRANCE
================================================================ */
window.addEventListener('DOMContentLoaded', () => {
  const heroInner = document.querySelector('.hero-inner');
  if (heroInner)
    requestAnimationFrame(() => setTimeout(() => heroInner.classList.add('loaded'), 60));
});

/* ================================================================
   SCROLL REVEAL
================================================================ */
const revealIO = new IntersectionObserver((entries, obs) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
  });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => revealIO.observe(el));

/* ================================================================
   PARALLAX ON FEATURED MOCKUP (desktop only, respects motion pref)
================================================================ */
if (!prefersReducedMotion && window.innerWidth > 1024) {
  const featVisual = document.querySelector('.proj-featured-visual');
  const parallaxEl = document.querySelector('.proj-featured-visual .parallax-inner');
  if (featVisual && parallaxEl) {
    featVisual.addEventListener('mousemove', e => {
      const r  = featVisual.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width  / 2) / r.width;
      const dy = (e.clientY - r.top  - r.height / 2) / r.height;
      parallaxEl.style.transform = `translate(${dx * 5}px, ${dy * 3}px)`;
    });
    featVisual.addEventListener('mouseleave', () => {
      parallaxEl.style.transform = 'translate(0,0)';
    });
  }
}
