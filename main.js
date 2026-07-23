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
  initLeadershipModal();
  initDonationPage();

  await Promise.all([loadGalleryData(), loadNewsData()]);
  initGallery();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : str;
  return div.innerHTML;
}

/* ---------- Gallery data (content/gallery.json) ---------- */
function renderGalleryTile(item) {
  const hasImage = Boolean(item.image);
  const style = hasImage
    ? ` style="background-image:url('${item.image}');background-size:cover;background-position:center;"`
    : '';
  const cls = hasImage ? '' : ` ${item.gradient || ''}`;
  const emoji = hasImage ? '' : `<span class="tile-emoji">${item.emoji || ''}</span>`;
  const title = window.currentLang === 'am' ? item.title_am : item.title_sv;

  return `<div class="gallery-item${cls}" data-cat="${item.category}" data-title-sv="${escapeHtml(item.title_sv)}" data-title-am="${escapeHtml(item.title_am)}"${style}>${emoji}<div class="tile-overlay"><span class="tile-title">${escapeHtml(title)}</span></div></div>`;
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
  const date = window.currentLang === 'am' ? item.date_am : item.date_sv;
  const title = window.currentLang === 'am' ? item.title_am : item.title_sv;
  const excerpt = window.currentLang === 'am' ? item.excerpt_am : item.excerpt_sv;
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
  const date = window.currentLang === 'am' ? item.date_am : item.date_sv;
  const title = window.currentLang === 'am' ? item.title_am : item.title_sv;
  const excerpt = window.currentLang === 'am' ? item.excerpt_am : item.excerpt_sv;
  const body = window.currentLang === 'am' ? item.body_am : item.body_sv;
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

/* Re-render language-baked content (gallery/news) on toggle, since their
   text is written directly into the generated HTML rather than via data-i18n. */
document.addEventListener('dh:langchange', async () => {
  await loadGalleryData();
  initGallery();
  await loadNewsData();
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

/* ---------- Mobile nav ---------- */
function initMobileNav() {
  const hamburger = document.getElementById('hamburgerBtn');
  const nav = document.getElementById('mainNav');
  if (!hamburger || !nav) return;

  hamburger.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', String(open));
  });

  nav.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
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
    const emoji = item.querySelector('.tile-emoji').textContent;
    const title = window.currentLang === 'am' ? item.dataset.titleAm : item.dataset.titleSv;
    const tileClass = Array.from(item.classList).find((c) => c.startsWith('tile-'));

    lightboxContent.className = 'lightbox-content';
    if (tileClass) lightboxContent.classList.add(tileClass);
    lightboxContent.innerHTML = `<span>${emoji}</span><span class="lb-title">${title}</span>`;
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
  const sections = ['hem', 'nyheter', 'om', 'gudstjanster', 'galleri', 'kontakt']
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

/* ---------- Leadership "add person" modal ---------- */
function initLeadershipModal() {
  const modal = document.getElementById('leadershipModal');
  const nameInput = document.getElementById('modalNameInput');
  const roleInput = document.getElementById('modalRoleInput');
  const iconSelect = document.getElementById('modalIconSelect');
  const saveBtn = document.getElementById('modalSaveBtn');
  const cancelBtn = document.getElementById('modalCancelBtn');
  if (!modal) return;

  let targetTier = 2;

  function close() {
    modal.classList.remove('open');
    nameInput.value = '';
    roleInput.value = '';
    iconSelect.selectedIndex = 0;
  }

  window.openModal = function (tier) {
    targetTier = tier;
    modal.classList.add('open');
    nameInput.focus();
  };

  cancelBtn.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

  saveBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    const role = roleInput.value.trim();
    if (!name || !role) return;

    const tierEl = document.getElementById(`tier${targetTier}`);
    const addBtn = tierEl.querySelector('.add-person-btn');
    const card = document.createElement('div');
    card.className = 'person-card';
    card.innerHTML = `
      <span class="person-icon">${iconSelect.value}</span>
      <span class="person-role">${role}</span>
      <span class="person-name">${name}</span>
    `;
    tierEl.insertBefore(card, addBtn);
    close();
  });
}

/* ---------- Donation page (donera.html): Swish deep-links + QR ----------
   Single constant below is the only thing that needs editing once the
   church's real Swish number is known — every link/QR derives from it. */
const SWISH_NUMBER = 'ÄNDRA_TILL_ERT_SWISHNUMMER';

function swishLink(amount) {
  const params = new URLSearchParams({ sw: SWISH_NUMBER, cur: 'SEK', msg: 'Gåva' });
  if (amount) params.set('amt', amount);
  return `https://app.swish.nu/1/p/sw/?${params.toString()}`;
}

function initDonationPage() {
  const qr = document.getElementById('swishQr');
  const payBtn = document.getElementById('swishPayBtn');
  const customAmount = document.getElementById('donateCustomAmount');
  const amountButtons = document.querySelectorAll('.donate-amount-btn');
  if (!qr || !payBtn) return;

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
