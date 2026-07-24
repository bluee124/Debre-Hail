/* Debre Hail S:t Gabriel — site interactivity.
   Waits for i18n:ready (dispatched by i18n.js after translations load) before
   touching any text, so nothing runs against an empty DOM. */

document.addEventListener('i18n:ready', initAll);

async function initAll() {
  initLangToggle();
  initSlider();
  initMobileNav();
  initAccordion();
  initAboutTabs();
  initSchedTabs();
  initContactTabs();
  initCounters();
  initForms();
  initScrollTop();
  initActiveNav();
  initDonationPage();
  initPrayerFeeNote();

  await Promise.all([loadGalleryData(), loadNewsData(), loadEventsData()]);
  initGallery();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : str;
  return div.innerHTML;
}

/* ---------- Gallery data (content/gallery.json) ---------- */
function renderGalleryTile(item) {
  const hasVideo = Boolean(item.video);
  const hasImage = !hasVideo && Boolean(item.image);
  const title = window.currentLang === 'am' ? (item.title_am || item.title_sv) : item.title_sv;
  const cls = (hasVideo || hasImage) ? '' : ` ${item.gradient || ''}`;
  const label = title ? ` aria-label="${escapeHtml(title)}"` : '';

  let media;
  if (hasVideo) {
    media = `<video class="tile-media" src="${item.video}" muted preload="metadata" playsinline></video><span class="tile-play-icon">▶</span>`;
  } else if (hasImage) {
    media = `<img class="tile-media" src="${item.image}" alt="${escapeHtml(title || '')}" loading="lazy">`;
  } else {
    media = `<span class="tile-emoji">${item.emoji || ''}</span>`;
  }

  return `<div class="gallery-item${cls}" data-cat="${item.category}" data-title-sv="${escapeHtml(item.title_sv || '')}" data-title-am="${escapeHtml(item.title_am || item.title_sv || '')}" data-video="${item.video || ''}" data-image="${item.image || ''}"${label}>${media}</div>`;
}

async function loadGalleryData() {
  const fullGrid = document.getElementById('galleryGrid');
  const previewGrid = document.querySelector('.gallery-grid-preview');
  if (!fullGrid && !previewGrid) return;

  try {
    const { items } = await fetch('content/gallery.json').then((res) => res.json());
    if (fullGrid) fullGrid.innerHTML = items.map(renderGalleryTile).join('');
    if (previewGrid) previewGrid.innerHTML = items.slice(0, 6).map(renderGalleryTile).join('');
  } catch (err) {
    console.error('Kunde inte ladda content/gallery.json', err);
  }
}

/* ---------- News data (content/news.json) ---------- */
function renderNewsPreviewCard(item) {
  const date = window.currentLang === 'am' ? (item.date_am || item.date_sv) : item.date_sv;
  const title = window.currentLang === 'am' ? (item.title_am || item.title_sv) : item.title_sv;
  const excerpt = window.currentLang === 'am' ? (item.excerpt_am || item.excerpt_sv) : item.excerpt_sv;
  return `
    <article class="news-preview-card">
      <div class="news-icon">📰</div>
      <div class="news-body">
        <span class="news-date">${escapeHtml(date)}</span>
        <h3>${escapeHtml(title)}</h3>
        <p class="news-excerpt">${escapeHtml(excerpt)}</p>
        <a class="news-toggle" href="nyheter.html#${item.id}" data-i18n="news.read_more">${window.t('news.read_more')}</a>
      </div>
    </article>`;
}

function renderNewsFullCard(item) {
  const date = window.currentLang === 'am' ? (item.date_am || item.date_sv) : item.date_sv;
  const title = window.currentLang === 'am' ? (item.title_am || item.title_sv) : item.title_sv;
  const excerpt = window.currentLang === 'am' ? (item.excerpt_am || item.excerpt_sv) : item.excerpt_sv;
  const body = window.currentLang === 'am' ? (item.body_am || item.body_sv) : item.body_sv;
  return `
    <article class="news-preview-card" id="${item.id}">
      <div class="news-icon">📰</div>
      <div class="news-body">
        <span class="news-date">${escapeHtml(date)}</span>
        <h3>${escapeHtml(title)}</h3>
        <p class="news-excerpt">${escapeHtml(excerpt)}</p>
        <div class="news-full"><p>${escapeHtml(body)}</p></div>
      </div>
    </article>`;
}

async function loadNewsData() {
  const previewList = document.getElementById('newsFeedList');
  const fullList = document.getElementById('newsFullList');
  if (!previewList && !fullList) return;

  try {
    const { items } = await fetch('content/news.json').then((res) => res.json());
    if (previewList) previewList.innerHTML = items.slice(0, 4).map(renderNewsPreviewCard).join('');
    if (fullList) {
      fullList.innerHTML = items.map(renderNewsFullCard).join('');
      // The browser tries to scroll to the #article-N anchor before this async
      // render finishes, so the target doesn't exist yet — do it manually.
      if (window.location.hash) {
        const target = document.querySelector(window.location.hash);
        if (target) target.scrollIntoView();
      }
    }
  } catch (err) {
    console.error('Kunde inte ladda content/news.json', err);
  }
}

/* ---------- Events (content/events.json): compact teaser in the front-page
   sidebar, full list with videos on evenemang.html ---------- */
function renderSidebarEvent(ev) {
  const L = window.currentLang === 'am' ? 'am' : 'sv';
  const title = ev[`title_${L}`] || ev.title_sv;
  const [y, m, d] = ev.date.split('-');
  return `<p class="sidebar-event"><strong>${d}/${m}</strong> — ${escapeHtml(title)} <a href="evenemang.html#${ev.id}">${window.t('news.read_more')}</a></p>`;
}

// TikTok only offers a stable iframe embed keyed by the numeric video ID
// (found in any full-video URL as /video/<id>) — pulled straight from the
// pasted CMS link, no API call needed. Only public TikTok videos embed;
// private ones render nothing (TikTok blocks the iframe itself).
function tiktokEmbedHtml(url) {
  const match = /\/video\/(\d+)/.exec(url || '');
  if (!match) return '';
  return `<div class="event-tiktok-wrap"><iframe src="https://www.tiktok.com/embed/v2/${match[1]}" allow="encrypted-media" allowfullscreen loading="lazy"></iframe></div>`;
}

function renderEventCard(ev) {
  const L = window.currentLang === 'am' ? 'am' : 'sv';
  const title = ev[`title_${L}`] || ev.title_sv;
  const desc = ev[`desc_${L}`] || ev.desc_sv || '';
  const media = ev.video
    ? `<video class="event-video" controls preload="metadata" src="${ev.video}"></video>`
    : (ev.video_tiktok ? tiktokEmbedHtml(ev.video_tiktok) : '');
  return `
    <div class="event-card" id="${ev.id}">
      <div class="event-date">${ev.date}</div>
      <h4>${escapeHtml(title)}</h4>
      <p>${escapeHtml(desc)}</p>
      ${media}
    </div>`;
}

async function loadEventsData() {
  const sidebarList = document.getElementById('sidebarEventsList');
  const fullList = document.getElementById('eventsFullList');
  if (!sidebarList && !fullList) return;

  try {
    const { items } = await fetch('content/events.json').then((res) => res.json());
    const todayStr = new Date().toISOString().slice(0, 10);
    const upcoming = items
      .filter((ev) => ev.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (sidebarList) {
      sidebarList.innerHTML = upcoming.length
        ? upcoming.slice(0, 2).map(renderSidebarEvent).join('')
        : `<p class="sidebar-event-empty">${window.t('sidebar.events_empty')}</p>`;
    }
    if (fullList) {
      fullList.innerHTML = upcoming.length
        ? upcoming.map(renderEventCard).join('')
        : `<p class="events-empty">${window.t('events.empty')}</p>`;
      // Same async-render-vs-native-anchor-scroll issue as the news list.
      if (window.location.hash) {
        const target = document.querySelector(window.location.hash);
        if (target) target.scrollIntoView();
      }
    }
  } catch (err) {
    console.error('Kunde inte ladda content/events.json', err);
  }
}

/* Re-render language-baked content (gallery/news/events) on toggle, since
   their text is written directly into the generated HTML rather than via
   data-i18n. */
document.addEventListener('dh:langchange', async () => {
  await loadGalleryData();
  initGallery();
  await loadNewsData();
  await loadEventsData();
});

function initLangToggle() {
  const btn = document.getElementById('langToggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    window.applyLang(window.currentLang === 'sv' ? 'am' : 'sv');
  });
}

/* ---------- Hero slider ---------- */
function initSlider() {
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.dot');
  const prevBtn = document.getElementById('prevSlide');
  const nextBtn = document.getElementById('nextSlide');
  if (!slides.length) return;

  let current = 0;
  let timer = null;

  function show(idx) {
    slides[current].classList.remove('active');
    dots[current] && dots[current].classList.remove('active');
    current = (idx + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current] && dots[current].classList.add('active');
  }

  function restartTimer() {
    clearInterval(timer);
    timer = setInterval(() => show(current + 1), 5500);
  }

  prevBtn.addEventListener('click', () => { show(current - 1); restartTimer(); });
  nextBtn.addEventListener('click', () => { show(current + 1); restartTimer(); });
  dots.forEach((dot) => {
    dot.addEventListener('click', () => { show(parseInt(dot.dataset.slide, 10)); restartTimer(); });
  });

  restartTimer();
}

/* ---------- Mobile nav: right-side slide-in drawer ---------- */
function initMobileNav() {
  const hamburger = document.getElementById('hamburgerBtn');
  const nav = document.getElementById('mainNav');
  const backdrop = document.getElementById('navBackdrop');
  const closeBtn = document.getElementById('navCloseBtn');
  if (!hamburger || !nav) return;

  const isMobile = () => window.matchMedia('(max-width: 900px)').matches;

  function openNav() {
    nav.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('nav-open-lock');
  }

  function closeNav() {
    nav.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open-lock');
  }

  hamburger.addEventListener('click', () => {
    nav.classList.contains('open') ? closeNav() : openNav();
  });
  if (backdrop) backdrop.addEventListener('click', closeNav);
  if (closeBtn) closeBtn.addEventListener('click', closeNav);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });

  // Dropdown parents (Gudstjänster & Evenemang / Mer) toggle an accordion
  // on mobile instead of navigating/no-op'ing immediately — the actual
  // destinations are the sub-links underneath.
  nav.querySelectorAll('.nav-dropdown-parent').forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      if (!isMobile()) return;
      e.preventDefault();
      const item = trigger.closest('.nav-item');
      const expanded = item.classList.toggle('expanded');
      trigger.setAttribute('aria-expanded', String(expanded));
    });
  });

  // Any real destination link closes the drawer (dropdown parents are
  // excluded — they toggle their accordion instead, handled above).
  nav.querySelectorAll('.nav-link:not(.nav-dropdown-parent), .nav-dropdown-link').forEach((link) => {
    link.addEventListener('click', closeNav);
  });
}

/* ---------- FAQ accordion ---------- */
function initAccordion() {
  document.querySelectorAll('.faq-item').forEach((item) => {
    const q = item.querySelector('.faq-q');
    if (!q) return;
    q.addEventListener('click', () => item.classList.toggle('open'));
  });
}

/* ---------- About tabs ---------- */
function initAboutTabs() {
  const buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.querySelector(`.tab-panel[data-panel="${btn.dataset.tab}"]`);
      if (panel) panel.classList.add('active');
    });
  });
}

/* ---------- Schedule tabs ---------- */
function initSchedTabs() {
  const buttons = document.querySelectorAll('.sched-tab-btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.sched-panel').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.querySelector(`.sched-panel[data-sched-panel="${btn.dataset.schedTab}"]`);
      if (panel) panel.classList.add('active');
    });
  });
}

/* ---------- Kontakt tabs (Allmänt / Bönebegäran / Sakrament) ---------- */
function initContactTabs() {
  const buttons = document.querySelectorAll('.contact-tab-btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.contact-tab-panel').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.querySelector(`.contact-tab-panel[data-contact-panel="${btn.dataset.contactTab}"]`);
      if (panel) panel.classList.add('active');
    });
  });
}

/* ---------- Gallery: filters + lightbox ---------- */
function initGallery() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const items = Array.from(document.querySelectorAll('.gallery-item'));

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      items.forEach((item) => {
        item.classList.toggle('hidden', filter !== 'all' && item.dataset.cat !== filter);
      });
    });
  });

  const lightbox = document.getElementById('lightbox');
  const lightboxContent = document.getElementById('lightboxContent');
  const lightboxCounter = document.getElementById('lightboxCounter');
  const closeBtn = document.getElementById('lightboxClose');
  const prevBtn = document.getElementById('lightboxPrev');
  const nextBtn = document.getElementById('lightboxNext');
  if (!lightbox) return;

  let currentIndex = 0;

  function render(idx) {
    currentIndex = (idx + items.length) % items.length;
    const item = items[currentIndex];
    const videoSrc = item.dataset.video;
    const imageSrc = item.dataset.image;
    const title = window.currentLang === 'am' ? item.dataset.titleAm : item.dataset.titleSv;

    lightboxContent.className = 'lightbox-content';

    let media;
    if (videoSrc) {
      media = `<video src="${videoSrc}" controls preload="metadata"></video>`;
    } else if (imageSrc) {
      media = `<img src="${imageSrc}" alt="${escapeHtml(title || '')}">`;
    } else {
      const tileClass = Array.from(item.classList).find((c) => c.startsWith('tile-'));
      if (tileClass) lightboxContent.classList.add(tileClass);
      const emoji = item.querySelector('.tile-emoji')?.textContent || '';
      media = `<span class="lb-emoji">${emoji}</span>`;
    }
    const caption = title ? `<span class="lb-title">${escapeHtml(title)}</span>` : '';

    lightboxContent.innerHTML = `${media}${caption}`;
    lightboxCounter.textContent = `${currentIndex + 1} / ${items.length}`;
  }

  function open(idx) {
    render(idx);
    lightbox.classList.add('open');
  }

  function close() {
    lightbox.classList.remove('open');
  }

  items.forEach((item, idx) => {
    item.addEventListener('click', () => open(idx));
  });

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', () => render(currentIndex - 1));
  nextBtn.addEventListener('click', () => render(currentIndex + 1));
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') render(currentIndex - 1);
    if (e.key === 'ArrowRight') render(currentIndex + 1);
  });
}

/* ---------- Counters ---------- */
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1500;
  const start = performance.now();

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent = Math.floor(progress * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  }
  requestAnimationFrame(step);
}

function initCounters() {
  const counters = document.querySelectorAll('.counter-num');
  if (!counters.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  counters.forEach((c) => observer.observe(c));
}

/* ---------- Forms (Formspree submit) ----------
   Every form on the site (contact, membership, prayer/sacrament requests,
   event RSVP) shares this one handler: client-side validation, then a real
   POST to Formspree via fetch so the page never reloads. Mark a form with
   data-simple-form and give it a `.form-msg` element to use it. */
function initSimpleForm(form) {
  const msg = form.querySelector('.form-msg');
  if (!msg) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let valid = true;
    form.querySelectorAll('[required]').forEach((input) => {
      if (input.type === 'checkbox') {
        if (!input.checked) valid = false;
      } else if (input.type === 'email') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) valid = false;
      } else if (!input.value.trim()) {
        valid = false;
      }
    });

    if (!valid) {
      msg.textContent = window.t('contact.error_msg');
      msg.className = 'form-msg error';
      return;
    }

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error('Formspree responded with an error');
      msg.textContent = window.t('contact.success_msg');
      msg.className = 'form-msg success';
      form.reset();
    } catch (err) {
      msg.textContent = window.t('contact.error_msg');
      msg.className = 'form-msg error';
    }
  });
}

function initForms() {
  document.querySelectorAll('form[data-simple-form]').forEach(initSimpleForm);
}

/* ---------- Scroll to top ---------- */
function initScrollTop() {
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ---------- Active nav highlight ---------- */
function initActiveNav() {
  const sections = ['hem', 'om', 'gudstjanster', 'kontakt']
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const navLinks = document.querySelectorAll('.nav-link');
  if (!sections.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinks.forEach((link) => {
          link.classList.toggle('active', link.dataset.nav === entry.target.id);
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

  sections.forEach((section) => observer.observe(section));
}

/* ---------- Donation page (donera.html): Swish deep-links + QR ----------
   Single constant below is the only thing that needs editing if the
   church's Swish number ever changes — every link/QR/display label derives
   from it, so it can't drift out of sync the way it did before (the
   displayed number and this constant used to be edited separately). */
const SWISH_NUMBER = '1234453502';

function formatSwishNumber(num) {
  return num.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
}

function swishLink(amount, message) {
  const params = new URLSearchParams({ sw: SWISH_NUMBER, cur: 'SEK', msg: message || 'Gåva' });
  if (amount) params.set('amt', amount);
  return `https://app.swish.nu/1/p/sw/?${params.toString()}`;
}

/* ---------- Prayer request fee note (index.html, Bönebegäran tab) ----------
   Fixed 300 kr fee, reusing the same SWISH_NUMBER as the donation page so
   there's still only one place to update the number. */
function initPrayerFeeNote() {
  const numberLabel = document.getElementById('prayerSwishNumber');
  const payBtn = document.getElementById('prayerSwishPayBtn');
  if (!numberLabel || !payBtn) return;

  numberLabel.textContent = formatSwishNumber(SWISH_NUMBER);
  payBtn.href = swishLink(300, 'Bönebegäran');
}

function initDonationPage() {
  const qr = document.getElementById('swishQr');
  const payBtn = document.getElementById('swishPayBtn');
  const customAmount = document.getElementById('donateCustomAmount');
  const amountButtons = document.querySelectorAll('.donate-amount-btn');
  const numberLabel = document.getElementById('swishNumberLabel');
  if (!qr || !payBtn) return;

  if (numberLabel) numberLabel.textContent = formatSwishNumber(SWISH_NUMBER);
  qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(swishLink())}`;

  function updatePayLink() {
    const amount = customAmount.value.trim();
    payBtn.href = swishLink(amount || null);
  }

  amountButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      amountButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      customAmount.value = btn.dataset.amount;
      updatePayLink();
    });
  });

  customAmount.addEventListener('input', () => {
    amountButtons.forEach((b) => b.classList.remove('active'));
    updatePayLink();
  });

  updatePayLink();
}
