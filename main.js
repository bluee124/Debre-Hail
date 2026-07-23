/* Debre Hail S:t Gabriel — site interactivity.
   Waits for i18n:ready (dispatched by i18n.js after translations load) before
   touching any text, so nothing runs against an empty DOM. */

document.addEventListener('i18n:ready', initAll);

function initAll() {
  initLangToggle();
  initSlider();
  initMobileNav();
  initNewsExpand();
  initAccordion();
  initAboutTabs();
  initSchedTabs();
  initGallery();
  initCounters();
  initContactForm();
  initScrollTop();
  initActiveNav();
  initLeadershipModal();
}

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

/* ---------- News expand/collapse ---------- */
function initNewsExpand() {
  document.querySelectorAll('.news-item').forEach((item) => {
    const btn = item.querySelector('.news-toggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const open = item.classList.toggle('open');
      const key = open ? 'news.read_less' : 'news.read_more';
      btn.setAttribute('data-i18n', key);
      btn.textContent = window.t(key);
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

/* ---------- Contact form (simulated submit) ---------- */
function initContactForm() {
  const form = document.getElementById('contactForm');
  const msg = document.getElementById('formMsg');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const message = document.getElementById('contactMessage').value.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!name || !emailOk || !message) {
      msg.textContent = window.t('contact.error_msg');
      msg.className = 'form-msg error';
      return;
    }
    msg.textContent = window.t('contact.success_msg');
    msg.className = 'form-msg success';
    form.reset();
  });
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
