/* Loads translations from i18n.json and applies them to the DOM.
   Must run via a local server (Live Server) — fetch() fails on file:// */

(function () {
  let translations = null;
  window.currentLang = localStorage.getItem('dh-lang') || 'sv';

  function getPath(obj, path) {
    return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), obj);
  }

  function updateLangToggleLabel() {
    const btn = document.getElementById('langToggle');
    if (!btn) return;
    btn.textContent = window.currentLang === 'sv' ? '🇪🇹 አማርኛ' : '🇸🇪 Svenska';
  }

  function applyLang(lang) {
    if (!translations || !translations[lang]) return;
    window.currentLang = lang;
    const dict = translations[lang];

    document.documentElement.lang = lang;
    document.body.classList.toggle('lang-am', lang === 'am');

    const title = getPath(dict, 'meta.title');
    if (title) document.title = title;

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const value = getPath(dict, el.getAttribute('data-i18n'));
      if (value !== null) el.textContent = value;
    });

    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const value = getPath(dict, el.getAttribute('data-i18n-html'));
      if (value !== null) el.innerHTML = value;
    });

    document.querySelectorAll('.gallery-item').forEach((el) => {
      const titleEl = el.querySelector('.tile-title');
      if (!titleEl) return;
      titleEl.textContent = lang === 'am'
        ? el.getAttribute('data-title-am')
        : el.getAttribute('data-title-sv');
    });

    updateLangToggleLabel();
    localStorage.setItem('dh-lang', lang);
    document.dispatchEvent(new CustomEvent('dh:langchange', { detail: { lang } }));
  }

  window.applyLang = applyLang;

  window.t = function (path) {
    if (!translations) return '';
    return getPath(translations[window.currentLang], path) || '';
  };

  fetch('i18n.json')
    .then((res) => res.json())
    .then((data) => {
      translations = data;
      applyLang(window.currentLang);
      document.dispatchEvent(new CustomEvent('i18n:ready'));
    })
    .catch((err) => {
      console.error('Kunde inte ladda i18n.json. Kör sidan via en lokal server (t.ex. VS Code Live Server).', err);
    });
})();
