/* ================================================================
   KHADIJA ALAMOUDI PORTFOLIO — main.js
================================================================ */

'use strict';

/* ── Environment ── */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasFinePointer       = window.matchMedia('(pointer: fine)').matches;

/* ================================================================
   SHARED: SCALED IFRAME RENDERER
   Renders an iframe at native app dimensions inside a container,
   then scales it to fit via CSS transform + ResizeObserver.
   Used by inline card mockups, the lightbox, and the case-study modal.
================================================================ */
function mountScaledIframe(container, src, title, ratio) {
  const [nW, nH] = (ratio || '1500x980').split('x').map(Number);

  const iframe = document.createElement('iframe');
  iframe.src       = src;
  iframe.title     = title || 'App preview';
  iframe.loading   = 'lazy';
  iframe.scrolling = 'no';
  iframe.setAttribute('aria-label', title ? `${title} app preview` : 'App preview');
  Object.assign(iframe.style, {
    position:        'absolute',
    top:              '0',
    left:             '0',
    width:            nW + 'px',
    height:           nH + 'px',
    border:           'none',
    pointerEvents:    'none',
    transformOrigin:  'top left',
  });
  container.appendChild(iframe);

  function scale() {
    const cw = container.clientWidth;
    if (!cw) return;
    iframe.style.transform = `scale(${cw / nW})`;
  }
  scale();
  const ro = new ResizeObserver(scale);
  ro.observe(container);
  return { iframe, resizeObserver: ro };
}

/* Initialise all inline card mockups */
document.querySelectorAll('.ms-wrap[data-src]').forEach(wrap => {
  mountScaledIframe(wrap, wrap.dataset.src, wrap.dataset.title, wrap.dataset.ratio);
});

/* ================================================================
   LIGHTBOX (quick fullscreen mockup view)
================================================================ */
const lb        = document.getElementById('lb');
const lbScaler  = document.getElementById('lb-scaler');
const lbCaption = document.getElementById('lb-caption');
const lbClose   = document.getElementById('lb-close');
let   lbHandle  = null;

function openLightbox(src, title, ratio) {
  const [nW, nH] = (ratio || '1500x980').split('x').map(Number);
  lbScaler.innerHTML        = '';
  lbScaler.style.paddingTop = ((nH / nW) * 100).toFixed(4) + '%';
  lbCaption.textContent     = title || '';
  if (lbHandle) { lbHandle.resizeObserver.disconnect(); lbHandle = null; }

  lbHandle = mountScaledIframe(lbScaler, src, title, ratio);

  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
  lbClose.focus();
}

function closeLightbox() {
  lb.classList.remove('open');
  document.body.style.overflow = '';
  setTimeout(() => {
    lbScaler.innerHTML = '';
    if (lbHandle) { lbHandle.resizeObserver.disconnect(); lbHandle = null; }
  }, 280);
}

if (lbClose) lbClose.addEventListener('click', closeLightbox);
if (lb) lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && lb.classList.contains('open')) closeLightbox();
});

document.querySelectorAll('.ms-click-area').forEach(area => {
  area.addEventListener('click', () => {
    const wrap = area.closest('.ms-wrap');
    if (!wrap) return;
    /* Card mockups open the full case-study experience; the lightbox
       is reserved for wraps without a linked case study (e.g. inside a modal). */
    if (wrap.dataset.case) { openCaseStudy(wrap.dataset.case); return; }
    if (wrap.dataset.src) openLightbox(wrap.dataset.src, wrap.dataset.title, wrap.dataset.ratio);
  });
});

/* ================================================================
   NAVIGATION
================================================================ */
const nav = document.getElementById('main-nav');

window.addEventListener('scroll', () => {
  nav.classList.toggle('stuck', window.scrollY > 24);
}, { passive: true });

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
   PREMIUM TILT + SPOTLIGHT ON PROJECT MOCKUPS (desktop, fine pointer only)
   Subtle 3D tilt following the cursor, plus a soft light that
   tracks pointer position. Disabled entirely for touch/reduced motion.
================================================================ */
if (!prefersReducedMotion && hasFinePointer) {
  const MAX_TILT = 5; // degrees
  const tiltTargets = document.querySelectorAll(
    '.proj-featured-visual .ms-wrap, .proj-mindtrack-visual .ms-wrap, .proj-card-visual .ms-wrap'
  );

  tiltTargets.forEach(el => {
    el.classList.add('tilt');
    let raf = null;

    el.addEventListener('mousemove', e => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;   // 0 → 1
      const py = (e.clientY - rect.top)  / rect.height;  // 0 → 1

      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rx = (0.5 - py) * MAX_TILT;
        const ry = (px - 0.5) * MAX_TILT;
        el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.015) translateY(-2px)`;
        el.style.setProperty('--mx', `${px * 100}%`);
        el.style.setProperty('--my', `${py * 100}%`);
      });
    });

    el.addEventListener('mouseenter', () => el.classList.add('tilt-active'));
    el.addEventListener('mouseleave', () => {
      el.classList.remove('tilt-active');
      el.style.transform = '';
    });
  });
}

/* ================================================================
   PROJECT CASE-STUDY MODAL
================================================================ */
const CASE_STUDIES = {
  taskmate: {
    badge: '● Live on Google Play',
    title: 'TaskMate',
    overview: 'A local-first Flutter task management app designed to keep tasks, reminders, and recurring schedules reliable — fully offline, no internet required. Shipped and published on Google Play.',
    mockup: { src: './assets/mockups/taskmate.html', ratio: '1500x980' },
    features: [
      'Recurring tasks — daily, weekly, monthly & yearly',
      'Scheduled local notifications & reminders',
      'Flexible calendar with date selection',
      'Light / dark theme persistence',
      'English & Arabic localization infrastructure',
    ],
    architecture: [
      'Domain · data · presentation layer separation',
      'Repository abstraction for testable business logic',
      'Riverpod for state management',
      'SQLite (sqflite) for fully offline storage',
      'Unit tests + GitHub Actions CI on every push',
    ],
    stack: ['Flutter', 'Dart', 'Riverpod', 'SQLite', 'GetStorage', 'Local Notifications', 'Timezone', 'GitHub Actions'],
    links: [
      { label: 'Google Play', url: 'https://play.google.com/store/apps/details?id=com.khdooja.taskmate', primary: true },
      { label: 'GitHub', url: 'https://github.com/khadooja/ToDo_App' },
    ],
  },
  mindtrack: {
    badge: '✦ Featured',
    title: 'MindTrack',
    overview: 'Mood journaling and emotional pattern tracking app, built offline-first with automated deployment via GitHub Actions CI/CD.',
    mockup: { src: './assets/mockups/mindtrack.html', ratio: '1500x980' },
    features: [
      'Daily mood tracking & journaling',
      'AI-assisted mood analysis on entries',
      'Weekly and monthly analytics with fl_chart',
      'Streaks, entry search, and mood calendar',
    ],
    architecture: [
      'Offline-first architecture on Hive',
      'Cubit state management (flutter_bloc)',
      'Clean Architecture across features',
      'CI/CD pipeline via GitHub Actions',
    ],
    stack: ['Flutter', 'Cubit', 'Hive', 'fl_chart', 'GitHub Actions', 'Clean Architecture'],
    links: [
      { label: '✦ Behance', url: 'https://www.behance.net/gallery/251583607/MindTrack-AI-Powered-Mood-Journaling-App', primary: true },
      { label: 'GitHub', url: 'https://github.com/khadooja/Mood-Journal-App' },
    ],
  },
  recipe: {
    badge: 'Project',
    title: 'Recipe App',
    overview: 'A Clean Architecture recipe manager focused on real UX details — favorites, empty-state handling, and optimized image loading — built with Material 3.',
    mockup: { src: './assets/mockups/recipe.html', ratio: '1500x980' },
    features: [
      'Browse, search and favorite recipes',
      'Guided recipe creation form with validation',
      'Ingredient & step-by-step detail view',
      'Thoughtful empty states throughout',
    ],
    architecture: [
      'Clean Architecture layering',
      'Riverpod for state management',
      'Material 3 design system',
      'Optimized image loading',
    ],
    stack: ['Flutter', 'Riverpod', 'Material 3', 'Clean Architecture'],
    links: [
      { label: 'GitHub', url: 'https://github.com/khadooja/recipe_app', primary: true },
      { label: 'Behance', url: 'https://www.behance.net/khadijaalamoudi' },
    ],
  },
  chat: {
    badge: 'Project',
    title: 'Chat App',
    overview: 'Real-time messaging with Firebase Authentication and Cloud Firestore — instant sync, a full auth flow, and a clean conversational UI.',
    mockup: { src: './assets/mockups/chat.html', ratio: '1440x940' },
    features: [
      'Real-time message sync via Cloud Firestore',
      'Email/password sign up & login flow',
      'Profile photo upload to Firebase Storage',
      'Empty-state handling for new conversations',
    ],
    architecture: [
      'Firebase Authentication for identity',
      'Live Firestore snapshot streams',
      'Clean conversational UI patterns',
    ],
    stack: ['Flutter', 'Firebase Auth', 'Firestore', 'Firebase Storage'],
    links: [
      { label: 'GitHub', url: 'https://github.com/khadooja/AppChat', primary: true },
    ],
  },
};

const cs         = document.getElementById('cs');
const csClose    = document.getElementById('cs-close');
const csBadge    = document.getElementById('cs-badge');
const csTitle    = document.getElementById('cs-title');
const csOverview = document.getElementById('cs-overview');
const csVisual   = document.getElementById('cs-visual');
const csFeatures = document.getElementById('cs-features');
const csArch     = document.getElementById('cs-arch');
const csStack    = document.getElementById('cs-stack');
const csLinks    = document.getElementById('cs-links');
let   csHandle   = null;
let   csLastFocused = null;

function fillList(el, items) {
  el.innerHTML = '';
  items.forEach(text => {
    const li = document.createElement('li');
    li.textContent = text;
    el.appendChild(li);
  });
}

function openCaseStudy(id) {
  const data = CASE_STUDIES[id];
  if (!data || !cs) return;

  csLastFocused = document.activeElement;

  csBadge.textContent    = data.badge;
  csTitle.textContent    = data.title;
  csOverview.textContent = data.overview;

  const [mw, mh] = data.mockup.ratio.split('x').map(Number);
  csVisual.innerHTML        = '';
  csVisual.style.paddingTop = ((mh / mw) * 100).toFixed(4) + '%';
  if (csHandle) { csHandle.resizeObserver.disconnect(); csHandle = null; }
  csHandle = mountScaledIframe(csVisual, data.mockup.src, data.title, data.mockup.ratio);

  fillList(csFeatures, data.features);
  fillList(csArch, data.architecture);

  csStack.innerHTML = '';
  data.stack.forEach(t => {
    const span = document.createElement('span');
    span.className = 'tag';
    span.textContent = t;
    csStack.appendChild(span);
  });

  csLinks.innerHTML = '';
  data.links.forEach(l => {
    const a = document.createElement('a');
    a.href = l.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = l.primary ? 'btn-sm btn-sm-primary' : 'btn-sm btn-sm-ghost';
    a.textContent = l.label;
    csLinks.appendChild(a);
  });

  cs.classList.add('open');
  document.body.style.overflow = 'hidden';
  csClose.focus();
}

function closeCaseStudy() {
  if (!cs) return;
  cs.classList.remove('open');
  document.body.style.overflow = '';
  setTimeout(() => {
    csVisual.innerHTML = '';
    if (csHandle) { csHandle.resizeObserver.disconnect(); csHandle = null; }
  }, 300);
  if (csLastFocused && typeof csLastFocused.focus === 'function') csLastFocused.focus();
}

document.querySelectorAll('[data-case]').forEach(trigger => {
  trigger.addEventListener('click', () => openCaseStudy(trigger.dataset.case));
});
if (csClose) csClose.addEventListener('click', closeCaseStudy);
if (cs) cs.addEventListener('click', e => { if (e.target === cs) closeCaseStudy(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && cs && cs.classList.contains('open')) closeCaseStudy();
});
