/* ================================================================
   KHADIJA ALAMOUDI PORTFOLIO — main.js
================================================================ */

'use strict';

/* ── Detect reduced motion ── */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ================================================================
   MOCKUP SCALER
   Renders iframe at native dimensions, then scales to fit container
   via CSS transform + ResizeObserver. Zero crop, correct ratio.
================================================================ */
function initMockupScaler(wrap) {
  const src = wrap.dataset.src;
  if (!src) return;

  const ratio  = wrap.dataset.ratio || '1500x980';
  const [nW, nH] = ratio.split('x').map(Number);

  /* Insert iframe */
  const iframe = document.createElement('iframe');
  iframe.src          = src;
  iframe.title        = wrap.dataset.title || 'App preview';
  iframe.loading      = 'lazy';
  iframe.scrolling    = 'no';
  iframe.setAttribute('aria-label', wrap.dataset.title ? `${wrap.dataset.title} app preview` : 'App preview');
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
    const cw = wrap.clientWidth;
    const s  = cw / nW;
    iframe.style.transform = `scale(${s})`;
  }
  scale();
  new ResizeObserver(scale).observe(wrap);
}

/* Initialise all scalers */
document.querySelectorAll('.ms-wrap[data-src]').forEach(initMockupScaler);

/* ================================================================
   LIGHTBOX
================================================================ */
const lb        = document.getElementById('lb');
const lbScaler  = document.getElementById('lb-scaler');
const lbCaption = document.getElementById('lb-caption');
const lbClose   = document.getElementById('lb-close');
let   lbRO      = null; /* ResizeObserver for lb iframe */

function openLightbox(src, title, ratio) {
  const [nW, nH] = (ratio || '1500x980').split('x').map(Number);
  const ptop = ((nH / nW) * 100).toFixed(4) + '%';

  /* Reset */
  lbScaler.innerHTML      = '';
  lbScaler.style.paddingTop = ptop;
  lbCaption.textContent   = title || '';
  if (lbRO) { lbRO.disconnect(); lbRO = null; }

  const iframe = document.createElement('iframe');
  iframe.src          = src;
  iframe.title        = title || 'App preview';
  iframe.scrolling    = 'no';
  iframe.setAttribute('aria-label', `${title || 'App'} fullscreen preview`);
  Object.assign(iframe.style, {
    position:        'absolute',
    top:             '0', left: '0',
    width:           nW + 'px',
    height:          nH + 'px',
    border:          'none',
    pointerEvents:   'none',
    transformOrigin: 'top left',
  });
  lbScaler.appendChild(iframe);

  function scaleLb() {
    const cw = lbScaler.clientWidth;
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
  }, 280);
}

if (lbClose) lbClose.addEventListener('click', closeLightbox);
if (lb) lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && lb.classList.contains('open')) closeLightbox(); });

/* Wire up click areas */
document.querySelectorAll('.ms-click-area').forEach(area => {
  area.addEventListener('click', () => {
    const wrap  = area.closest('.ms-wrap');
    const src   = wrap.dataset.src;
    const title = wrap.dataset.title;
    const ratio = wrap.dataset.ratio;
    if (src) openLightbox(src, title, ratio);
  });
});

/* ================================================================
   NAVIGATION
================================================================ */
const nav = document.getElementById('main-nav');

/* Sticky state */
window.addEventListener('scroll', () => {
  nav.classList.toggle('stuck', window.scrollY > 24);
}, { passive: true });

/* Active link */
const sections  = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav-link');
const activeIO  = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });
sections.forEach(s => activeIO.observe(s));

/* Mobile menu */
const burger  = document.getElementById('nav-burger');
const mobMenu = document.getElementById('nav-mob-menu');

burger.addEventListener('click', () => {
  const open = mobMenu.classList.toggle('open');
  burger.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', open);
  document.body.style.overflow = open ? 'hidden' : '';
});
document.querySelectorAll('.nav-mob-link').forEach(l => {
  l.addEventListener('click', () => {
    mobMenu.classList.remove('open');
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  });
});

/* ================================================================
   HERO ENTRANCE
================================================================ */
window.addEventListener('DOMContentLoaded', () => {
  const heroInner = document.querySelector('.hero-inner');
  if (heroInner) {
    requestAnimationFrame(() => {
      setTimeout(() => heroInner.classList.add('loaded'), 60);
    });
  }
});

/* ================================================================
   SCROLL REVEAL
================================================================ */
const revealIO = new IntersectionObserver((entries, obs) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      obs.unobserve(e.target);
    }
  });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => revealIO.observe(el));

/* ================================================================
   SUBTLE PARALLAX ON FEATURED MOCKUP (desktop only)
================================================================ */
if (!prefersReducedMotion && window.innerWidth > 1024) {
  const featVisual = document.querySelector('.proj-featured-visual');
  const parallaxEl = document.querySelector('.parallax-inner');

  if (featVisual && parallaxEl) {
    featVisual.addEventListener('mousemove', e => {
      const rect = featVisual.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      const dx   = (e.clientX - cx) / rect.width;
      const dy   = (e.clientY - cy) / rect.height;
      /* max 6px movement, gentle */
      parallaxEl.style.transform = `translate(${dx * 6}px, ${dy * 4}px)`;
    });
    featVisual.addEventListener('mouseleave', () => {
      parallaxEl.style.transform = 'translate(0,0)';
    });
  }
}
