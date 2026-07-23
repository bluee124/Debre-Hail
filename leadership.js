/* Leadership hierarchy (ledarskap.html): renders two grouped trees — Präster
   and Kyrkoförvaltning — from content/leadership.json, using a photo per
   person (falling back to a placeholder avatar) instead of an emoji icon.
   Read-only: visitors cannot add or edit anyone here. New people (beside an
   existing one on the same tier, or beneath as a new tier) are added by
   editing content/leadership.json through the Decap CMS at /admin. */

(function () {
  let items = [];

  // Management shows one extra, always-empty tier below its data — an
  // informational "volunteers welcome" row, not an add point.
  const GROUP_CONFIG = {
    priest: { extraEmptyTier: false },
    management: { extraEmptyTier: true }
  };

  function lang() {
    return window.currentLang === 'am' ? 'am' : 'sv';
  }

  function personCardHtml(person, isTopTier) {
    const L = lang();
    const src = person.image || 'images/avatar-placeholder.svg';
    return `
      <div class="person-card${isTopTier ? ' gold-border' : ''}">
        <img class="person-photo" src="${src}" alt="${escapeHtml(person.name)}">
        <span class="person-role">${escapeHtml(person[`role_${L}`] || '')}</span>
        <span class="person-name">${escapeHtml(person.name)}</span>
      </div>`;
  }

  function renderGroup(group, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const people = items.filter((p) => p.group === group);
    const tiers = [...new Set(people.map((p) => p.tier))].sort((a, b) => a - b);
    const config = GROUP_CONFIG[group] || {};
    const lastTier = tiers.length ? tiers[tiers.length - 1] : 0;
    const emptyTier = config.extraEmptyTier ? lastTier + 1 : null;

    let html = '';
    tiers.forEach((tier, idx) => {
      if (idx > 0) html += '<div class="tree-line"></div>';
      const tierPeople = people.filter((p) => p.tier === tier);
      html += `<div class="tier">${tierPeople.map((p) => personCardHtml(p, idx === 0)).join('')}</div>`;
    });

    if (emptyTier) {
      html += '<div class="tree-line"></div>';
      html += `<div class="tier"><p class="tier-empty">${window.t('leadership.empty')}</p></div>`;
    }

    container.innerHTML = html;
  }

  async function load() {
    try {
      const { items: data } = await fetch('content/leadership.json').then((res) => res.json());
      items = data;
      renderGroup('priest', 'priestTree');
      renderGroup('management', 'managementTree');
    } catch (err) {
      console.error('Kunde inte ladda content/leadership.json', err);
    }
  }

  document.addEventListener('i18n:ready', load);
  document.addEventListener('dh:langchange', load);
})();
