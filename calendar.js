/* Ethiopian Orthodox (Ge'ez) calendar widget.
   Standalone module: builds its own Ethiopian<->Gregorian date math and
   renders an interactive month view into #eoCalendar. Feast-day data is
   best-effort from widely published Ethiopian Orthodox calendars — verify
   with clergy before treating it as authoritative (see calendar.disclaimer). */

(function () {
  const ETHIOPIC_EPOCH = 1723856; // JDN of Ethiopian epoch (Amete Mihret year 1, Meskerem 1)

  /* ---------- Julian Day Number <-> Gregorian ---------- */
  function gregorianToJdn(year, month, day) {
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;
    return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  }

  function jdnToGregorian(jdn) {
    const a = jdn + 32044;
    const b = Math.floor((4 * a + 3) / 146097);
    const c = a - Math.floor((146097 * b) / 4);
    const d = Math.floor((4 * c + 3) / 1461);
    const e = c - Math.floor((1461 * d) / 4);
    const m = Math.floor((5 * e + 2) / 153);
    const day = e - Math.floor((153 * m + 2) / 5) + 1;
    const month = m + 3 - 12 * Math.floor(m / 10);
    const year = 100 * b + d - 4800 + Math.floor(m / 10);
    return [year, month, day];
  }

  /* ---------- Julian Day Number <-> Ethiopian ---------- */
  function ethiopicToJdn(year, month, day) {
    return ETHIOPIC_EPOCH + 365 + 365 * (year - 1) + Math.floor(year / 4) + 30 * month + day - 31;
  }

  function jdnToEthiopic(jdn) {
    const r = (jdn - ETHIOPIC_EPOCH) % 1461;
    const n = (r % 365) + 365 * Math.floor(r / 1460);
    const year = 4 * Math.floor((jdn - ETHIOPIC_EPOCH) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
    const month = Math.floor(n / 30) + 1;
    const day = (n % 30) + 1;
    return [year, month, day];
  }

  function isEthiopianLeap(year) {
    return year % 4 === 3;
  }

  function daysInEthMonth(year, month) {
    if (month <= 12) return 30;
    return isEthiopianLeap(year) ? 6 : 5;
  }

  function weekdayOf(jdn) {
    const [gy, gm, gd] = jdnToGregorian(jdn);
    return new Date(Date.UTC(gy, gm - 1, gd)).getUTCDay(); // 0 = Sunday
  }

  /* ---------- Orthodox Easter (Fasika), Meeus' Julian algorithm ---------- */
  function orthodoxEasterJdn(gYear) {
    const a = gYear % 4;
    const b = gYear % 7;
    const c = gYear % 19;
    const d = (19 * c + 15) % 30;
    const e = (2 * a + 4 * b - d + 34) % 7;
    const month = Math.floor((d + e + 114) / 31);
    const day = ((d + e + 114) % 31) + 1;
    // Julian calendar date -> Gregorian (valid offset for 1900-2099)
    const julianJdn = gregorianToJdn(gYear, month, day); // treat as if Gregorian fields of the Julian date
    return julianJdn + 13;
  }

  /* ---------- Names ---------- */
  const MONTHS = {
    sv: ['Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit', 'Megabit', 'Miazia', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'],
    am: ['መስከረም', 'ጥቅምት', 'ኅዳር', 'ታኅሳስ', 'ጥር', 'የካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ']
  };
  const WEEKDAYS = {
    sv: ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'],
    am: ['እሑድ', 'ሰኞ', 'ማክሰ', 'ረቡዕ', 'ሐሙስ', 'አርብ', 'ቅዳሜ']
  };

  /* ---------- Fixed monthly commemorations (every Ethiopian month) ---------- */
  const MONTHLY_FEASTS = {
    12: { sv: 'Ärkeängeln Mikael', am: 'ቅዱስ ሚካኤል' },
    16: { sv: 'Kidane Mihret', am: 'ኪዳነ ምሕረት' },
    19: { sv: 'Ärkeängeln Gabriel', am: 'ቅዱስ ገብርኤል' },
    21: { sv: 'Jungfru Maria', am: 'ቅድስት ማርያም' },
    22: { sv: 'Ärkeängeln Uriel', am: 'ቅዱስ ዑራኤል' },
    23: { sv: 'Sankt Georgios', am: 'ቅዱስ ጊዮርጊስ' },
    24: { sv: 'Abune Teklehaymanot', am: 'አቡነ ተክለ ሃይማኖት' },
    27: { sv: 'Medhane Alem', am: 'መድኃኔ ዓለም' },
    29: { sv: 'Kristi födelse (månatlig)', am: 'በዓለ ልደታ' }
  };

  /* ---------- Fixed annual feasts, keyed "month-day" (Ethiopian calendar) ---------- */
  const ANNUAL_FEASTS = {
    '1-1': { sv: 'Enkutatash (Nyår)', am: 'እንቁጣጣሽ' },
    '1-17': { sv: 'Meskel (Korsets upphöjelse)', am: 'መስቀል' },
    '4-29': { sv: 'Genna (Jul)', am: 'ገና' },
    '5-11': { sv: 'Timkat (Epifania)', am: 'ጥምቀት' },
    '11-5': { sv: 'Petrus och Paulus', am: 'ቅዱሳን ጴጥሮስ ወጳውሎስ' },
    '12-16': { sv: 'Debre Tabor (Buhe)', am: 'ደብረ ታቦር (ቡሄ)' }
  };

  /* ---------- Moveable feasts + fasting ranges derived from Fasika ---------- */
  function moveableEventsForEthYear(ethYear) {
    // The Ethiopian year starts in Gregorian September; Fasika for that
    // Ethiopian year falls in the following Gregorian calendar year.
    const [gYearStart] = jdnToGregorian(ethiopicToJdn(ethYear, 1, 1));
    const fasikaJdn = orthodoxEasterJdn(gYearStart + 1);

    const singleDay = [
      { jdn: fasikaJdn - 7, sv: 'Hosaena (Palmsöndagen)', am: 'ሆሣዕና' },
      { jdn: fasikaJdn - 2, sv: 'Siklet (Långfredagen)', am: 'ስቅለት' },
      { jdn: fasikaJdn, sv: 'Fasika (Påsk)', am: 'ትንሣኤ (ፋሲካ)' },
      { jdn: fasikaJdn + 39, sv: 'Erget (Kristi himmelsfärd)', am: 'ዕርገት' },
      { jdn: fasikaJdn + 50, sv: 'Paraclete (Pingst)', am: 'ጰራቅሊጦስ' }
    ];

    const fastingRanges = [
      { start: fasikaJdn - 73, end: fasikaJdn - 71, label: 'Nineve-fastan' }, // Tsome Nineve
      { start: fasikaJdn - 55, end: fasikaJdn - 1, label: 'Stora fastan' }    // Abiy Tsom incl. Holy Week
    ];

    return { fasikaJdn, singleDay, fastingRanges };
  }

  function fixedFastingRangesForEthYear(ethYear) {
    return [
      { start: ethiopicToJdn(ethYear, 3, 15), end: ethiopicToJdn(ethYear, 4, 28), label: 'Adventsfastan (Tsome Gahad)' },
      { start: ethiopicToJdn(ethYear, 12, 1), end: ethiopicToJdn(ethYear, 12, 15), label: 'Filseta-fastan' }
    ];
  }

  /* ---------- State ---------- */
  const todayJdn = gregorianToJdn(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    new Date().getDate()
  );
  const [todayEthY, todayEthM, todayEthD] = jdnToEthiopic(todayJdn);
  let viewYear = todayEthY;
  let viewMonth = todayEthM;

  /* ---------- Events (content/events.json), shared with the Evenemang tab ---------- */
  let eventsList = [];
  let eventsByJdn = {};

  async function loadEvents() {
    try {
      const { items } = await fetch('content/events.json').then((res) => res.json());
      eventsList = items;
      eventsByJdn = {};
      items.forEach((ev) => {
        const [y, m, d] = ev.date.split('-').map(Number);
        eventsByJdn[gregorianToJdn(y, m, d)] = ev;
      });
    } catch (err) {
      console.error('Kunde inte ladda content/events.json', err);
    }
  }

  function renderEventsTab() {
    const list = document.getElementById('eventsUpcomingList');
    const select = document.getElementById('rsvpEventSelect');
    if (!list) return;
    const L = lang();

    const upcoming = eventsList
      .filter((ev) => {
        const [y, m, d] = ev.date.split('-').map(Number);
        return gregorianToJdn(y, m, d) >= todayJdn;
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    if (!upcoming.length) {
      list.innerHTML = `<p class="events-empty">${window.t('events.empty')}</p>`;
    } else {
      list.innerHTML = upcoming.map((ev) => `
        <div class="event-card">
          <div class="event-date">${ev.date}</div>
          <h4>${escapeHtml(evText(ev, 'title', L))}</h4>
          <p>${escapeHtml(evText(ev, 'desc', L))}</p>
          ${ev.video ? `<video class="event-video" controls preload="metadata" src="${ev.video}"></video>` : ''}
          <button type="button" class="btn btn-gold event-rsvp-btn" data-event-id="${ev.id}">${window.t('events.rsvp_btn')}</button>
        </div>`).join('');
    }

    if (select) {
      select.innerHTML = upcoming.map((ev) => `<option value="${ev.id}">${escapeHtml(evText(ev, 'title', L))} — ${ev.date}</option>`).join('');
    }
  }

  /* ---------- Rendering ---------- */
  function lang() {
    return window.currentLang === 'am' ? 'am' : 'sv';
  }

  // Falls back to the Swedish field when a translation hasn't been filled in.
  function evText(ev, field, L) {
    return ev[`${field}_${L}`] || ev[`${field}_sv`] || '';
  }

  function dayInfo(jdn, ethMonth, ethDay, moveable, apostlesFastEndJdn) {
    const info = { feast: null, fasting: false, fastingLabel: null };

    const monthlyFeast = MONTHLY_FEASTS[ethDay];
    const annualFeast = ANNUAL_FEASTS[`${ethMonth}-${ethDay}`];
    const moveableFeast = moveable.singleDay.find((m) => m.jdn === jdn);

    if (moveableFeast) info.feast = moveableFeast;
    else if (annualFeast) info.feast = annualFeast;
    else if (monthlyFeast) info.feast = monthlyFeast;

    const inMoveableFast = moveable.fastingRanges.some((r) => jdn >= r.start && jdn <= r.end);
    const inFixedFast = fixedFastingRangesForEthYear(viewYear).some((r) => jdn >= r.start && jdn <= r.end);
    const inApostlesFast = apostlesFastEndJdn && jdn > moveable.fasikaJdn + 50 && jdn <= apostlesFastEndJdn;

    if (inMoveableFast || inFixedFast || inApostlesFast) {
      info.fasting = true;
    } else {
      const wd = weekdayOf(jdn);
      const inPostFasikaSuspension = jdn >= moveable.fasikaJdn && jdn <= moveable.fasikaJdn + 49;
      if ((wd === 3 || wd === 5) && !inPostFasikaSuspension && !info.feast) {
        info.fasting = true;
      }
    }

    return info;
  }

  function render() {
    const grid = document.getElementById('eoCalGrid');
    const weekdaysEl = document.getElementById('eoCalWeekdays');
    const monthSelect = document.getElementById('eoCalMonthSelect');
    const yearInput = document.getElementById('eoCalYearInput');
    const todayLabel = document.getElementById('eoCalTodayLabel');
    if (!grid) return;

    const L = lang();

    // Weekday header
    weekdaysEl.innerHTML = WEEKDAYS[L].map((w) => `<div class="eo-wd">${w}</div>`).join('');

    // Month select + year input
    if (monthSelect.dataset.lang !== L) {
      monthSelect.innerHTML = MONTHS[L].map((name, idx) => `<option value="${idx + 1}">${name}</option>`).join('');
      monthSelect.dataset.lang = L;
    }
    monthSelect.value = String(viewMonth);
    yearInput.value = viewYear;

    todayLabel.textContent = `${MONTHS[L][todayEthM - 1]} ${todayEthD}, ${todayEthY}`;

    // Feast/fasting data for this Ethiopian year (and Apostles' fast, which
    // starts the day after Paraclete and ends the day before Hamle 5).
    const moveable = moveableEventsForEthYear(viewYear);
    const apostlesFastEnd = ethiopicToJdn(viewYear, 11, 4);

    const daysCount = daysInEthMonth(viewYear, viewMonth);
    const firstJdn = ethiopicToJdn(viewYear, viewMonth, 1);
    const leadingBlanks = weekdayOf(firstJdn);

    let html = '';
    for (let i = 0; i < leadingBlanks; i++) {
      html += '<div class="eo-cell eo-cell-empty"></div>';
    }

    for (let d = 1; d <= daysCount; d++) {
      const jdn = firstJdn + (d - 1);
      const [gy, gm, gd] = jdnToGregorian(jdn);
      const wd = weekdayOf(jdn);
      const info = dayInfo(jdn, viewMonth, d, moveable, apostlesFastEnd);
      const isToday = jdn === todayJdn;
      const hasEvent = Boolean(eventsByJdn[jdn]);

      const classes = ['eo-cell'];
      if (wd === 0) classes.push('is-sunday');
      if (info.feast) classes.push('is-feast');
      else if (info.fasting) classes.push('is-fasting');
      if (isToday) classes.push('is-today');
      if (hasEvent) classes.push('has-event');

      const label = info.feast ? `<span class="eo-cell-label">${info.feast[L]}</span>` : '';

      html += `
        <div class="${classes.join(' ')}" data-jdn="${jdn}">
          <span class="eo-cell-day">${d}</span>
          <span class="eo-cell-greg">${gd}/${gm}</span>
          ${label}
        </div>`;
    }

    grid.innerHTML = html;
  }

  function changeMonth(delta) {
    viewMonth += delta;
    if (viewMonth < 1) { viewMonth = 13; viewYear -= 1; }
    if (viewMonth > 13) { viewMonth = 1; viewYear += 1; }
    render();
  }

  /* ---------- Day-detail modal (tap any cell, key on mobile where the
     inline feast label is hidden for space) ---------- */
  function showDayModal(jdn) {
    const modal = document.getElementById('eoDayModal');
    if (!modal) return;
    const L = lang();
    const [ethY, ethM, ethD] = jdnToEthiopic(jdn);
    const [gy, gm, gd] = jdnToGregorian(jdn);
    const moveable = moveableEventsForEthYear(ethY);
    const apostlesFastEnd = ethiopicToJdn(ethY, 11, 4);
    const info = dayInfo(jdn, ethM, ethD, moveable, apostlesFastEnd);
    const event = eventsByJdn[jdn];

    document.getElementById('eoDayModalTitle').textContent = `${MONTHS[L][ethM - 1]} ${ethD}, ${ethY}`;
    document.getElementById('eoDayModalGreg').textContent = `${gd}/${gm}/${gy}`;

    const feastEl = document.getElementById('eoDayModalFeast');
    if (info.feast) {
      feastEl.textContent = info.feast[L];
      feastEl.style.display = '';
    } else if (info.fasting) {
      feastEl.textContent = window.t('calendar.legend_fasting');
      feastEl.style.display = '';
    } else {
      feastEl.textContent = '';
      feastEl.style.display = 'none';
    }

    const eventEl = document.getElementById('eoDayModalEvent');
    if (event) {
      const evDesc = evText(event, 'desc', L);
      eventEl.textContent = `${evText(event, 'title', L)}${evDesc ? ' — ' + evDesc : ''}`;
      eventEl.style.display = '';
    } else {
      eventEl.textContent = '';
      eventEl.style.display = 'none';
    }

    modal.classList.add('open');
  }

  function initDayModal() {
    const modal = document.getElementById('eoDayModal');
    const closeBtn = document.getElementById('eoDayModalClose');
    const grid = document.getElementById('eoCalGrid');
    if (!modal || !grid) return;

    grid.addEventListener('click', (e) => {
      const cell = e.target.closest('.eo-cell');
      if (!cell || cell.classList.contains('eo-cell-empty')) return;
      showDayModal(parseInt(cell.dataset.jdn, 10));
    });
    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });
  }

  function initEventsTab() {
    const list = document.getElementById('eventsUpcomingList');
    if (!list) return;
    list.addEventListener('click', (e) => {
      const btn = e.target.closest('.event-rsvp-btn');
      if (!btn) return;
      const select = document.getElementById('rsvpEventSelect');
      if (select) select.value = btn.dataset.eventId;
      document.getElementById('rsvpForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  async function init() {
    const prevBtn = document.getElementById('eoCalPrev');
    const nextBtn = document.getElementById('eoCalNext');
    const todayBtn = document.getElementById('eoCalTodayBtn');
    const monthSelect = document.getElementById('eoCalMonthSelect');
    const yearInput = document.getElementById('eoCalYearInput');
    if (!prevBtn) return;

    prevBtn.addEventListener('click', () => changeMonth(-1));
    nextBtn.addEventListener('click', () => changeMonth(1));
    todayBtn.addEventListener('click', () => {
      viewYear = todayEthY;
      viewMonth = todayEthM;
      render();
    });
    monthSelect.addEventListener('change', () => {
      viewMonth = parseInt(monthSelect.value, 10);
      render();
    });
    yearInput.addEventListener('change', () => {
      const y = parseInt(yearInput.value, 10);
      if (y) { viewYear = y; render(); }
    });

    initDayModal();
    initEventsTab();

    await loadEvents();
    render();
    renderEventsTab();
  }

  document.addEventListener('i18n:ready', init);
  document.addEventListener('dh:langchange', () => {
    render();
    renderEventsTab();
  });
})();
