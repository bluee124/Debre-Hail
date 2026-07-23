/* Leadership hierarchy (ledarskap.html): renders two grouped trees — Präster
   and Kyrkoförvaltning — from content/leadership.json, using a photo per
   person (falling back to a placeholder avatar) instead of an emoji icon.
   The "add person" modal here is a client-side-only preview (like the
   original), not persisted — real additions should go through the Decap CMS
   "leadership" collection at /admin. */

(function () {
  let items = [];

  // Management gets one extra, initially-empty tier below its data (a
  // "volunteers welcome" row), matching the original 3-tier design.
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
      html += `<div class="tier" data-group="${group}" data-tier="${tier}">`;
      html += tierPeople.map((p) => personCardHtml(p, idx === 0)).join('');
      html += `<button type="button" class="add-person-btn" data-group="${group}" data-tier="${tier}">${window.t('about.add_person_btn')}</button>`;
      html += '</div>';
    });

    if (emptyTier) {
      html += '<div class="tree-line"></div>';
      html += `<div class="tier" data-group="${group}" data-tier="${emptyTier}">`;
      html += `<p class="tier-empty">${window.t('leadership.empty')}</p>`;
      html += `<button type="button" class="add-person-btn" data-group="${group}" data-tier="${emptyTier}">${window.t('about.add_person_btn')}</button>`;
      html += '</div>';
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

  function initModal() {
    const modal = document.getElementById('leadershipModal');
    const nameInput = document.getElementById('modalNameInput');
    const roleInput = document.getElementById('modalRoleInput');
    const imageInput = document.getElementById('modalImageInput');
    const saveBtn = document.getElementById('modalSaveBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');
    if (!modal) return;

    let targetGroup = null;
    let targetTier = null;

    function close() {
      modal.classList.remove('open');
      nameInput.value = '';
      roleInput.value = '';
      imageInput.value = '';
    }

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.add-person-btn');
      if (!btn) return;
      targetGroup = btn.dataset.group;
      targetTier = btn.dataset.tier;
      modal.classList.add('open');
      nameInput.focus();
    });

    cancelBtn.addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

    saveBtn.addEventListener('click', () => {
      const name = nameInput.value.trim();
      const role = roleInput.value.trim();
      if (!name || !role || !targetGroup) return;

      const tierEl = document.querySelector(`.tier[data-group="${targetGroup}"][data-tier="${targetTier}"]`);
      if (!tierEl) return;
      const addBtn = tierEl.querySelector('.add-person-btn');
      const emptyMsg = tierEl.querySelector('.tier-empty');
      if (emptyMsg) emptyMsg.remove();

      const src = imageInput.value.trim() || 'images/avatar-placeholder.svg';
      const card = document.createElement('div');
      card.className = 'person-card';
      card.innerHTML = `
        <img class="person-photo" src="${src}" alt="${name}">
        <span class="person-role">${role}</span>
        <span class="person-name">${name}</span>
      `;
      tierEl.insertBefore(card, addBtn);
      close();
    });
  }

  document.addEventListener('i18n:ready', async () => {
    initModal();
    await load();
  });
  document.addEventListener('dh:langchange', load);
})();
