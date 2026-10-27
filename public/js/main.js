(() => {
  'use strict';

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fineQuery   = window.matchMedia('(hover: hover) and (pointer: fine)');
  const sheetQuery  = window.matchMedia('(max-width: 560px)');

  const isReduced = () => motionQuery.matches;
  const isFine    = () => fineQuery.matches;

  /* =========================================================
     Very small utilities
     ========================================================= */
  function clickPoint(el, event) {
    const rect = el.getBoundingClientRect();
    const hasPoint = event && typeof event.clientX === 'number' &&
      (event.clientX !== 0 || event.clientY !== 0);
    return {
      x: hasPoint ? event.clientX : rect.left + rect.width / 2,
      y: hasPoint ? event.clientY : rect.top + rect.height / 2
    };
  }

  function spawnRipple(el, event) {
    if (isReduced()) return;
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.9;
    const point = clickPoint(el, event);
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (point.x - rect.left - size / 2) + 'px';
    ripple.style.top  = (point.y - rect.top  - size / 2) + 'px';
    el.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  }

  const BURST_COLORS = ['#6d5efc', '#22d3ee', '#22c55e', '#f59e0b', '#e879f9'];
  function spawnBurst(x, y) {
    if (isReduced()) return;
    const host = document.createElement('div');
    host.className = 'burst';
    host.style.left = x + 'px';
    host.style.top  = y + 'px';

    const count = 14;
    for (let i = 0; i < count; i++) {
      const piece = document.createElement('i');
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const distance = 34 + Math.random() * 54;
      piece.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
      piece.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
      piece.style.setProperty('--c', BURST_COLORS[i % BURST_COLORS.length]);
      piece.style.setProperty('--sz', `${3 + Math.random() * 4}px`);
      piece.style.animationDelay = `${Math.random() * 0.06}s`;
      host.appendChild(piece);
    }

    document.body.appendChild(host);
    window.setTimeout(() => host.remove(), 1100);
  }

  /* =========================================================
     Ambient sparkles + pointer glow + card tilt
     ========================================================= */
  (function initSparkles() {
    const host = $('#sparkles');
    if (!host || isReduced()) return;

    const count = window.innerWidth < 700 ? 10 : 18;
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
      const dot = document.createElement('span');
      dot.style.setProperty('--x', `${Math.random() * 100}%`);
      dot.style.setProperty('--y', `${Math.random() * 100}%`);
      dot.style.setProperty('--s', `${1.5 + Math.random() * 2.6}px`);
      dot.style.setProperty('--dur', `${5.5 + Math.random() * 6}s`);
      dot.style.setProperty('--delay', `${Math.random() * -9}s`);
      dot.style.left = dot.style.getPropertyValue('--x');
      dot.style.top  = dot.style.getPropertyValue('--y');
      fragment.appendChild(dot);
    }

    host.appendChild(fragment);
  })();

  (function initCursorGlow() {
    const glow = $('#cursorGlow');
    if (!glow || !isFine() || isReduced()) return;

    let targetX = window.innerWidth * 0.7;
    let targetY = window.innerHeight * 0.25;
    let x = targetX;
    let y = targetY;
    let frame = null;

    const loop = () => {
      x += (targetX - x) * 0.13;
      y += (targetY - y) * 0.13;
      glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      frame = requestAnimationFrame(loop);
    };

    window.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      targetX = event.clientX;
      targetY = event.clientY;
      glow.classList.add('on');
    }, { passive: true });

    document.addEventListener('pointerleave', () => glow.classList.remove('on'));

    requestAnimationFrame(() => {
      glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      loop();
    });

    // Keep the animation frame alive only while the page is visible.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = null;
      } else if (!frame) {
        loop();
      }
    });
  })();

  function addTilt(el, maxDeg = 7) {
    if (!isFine()) return;

    let frame = null;
    let px = 0;
    let py = 0;

    el.addEventListener('pointerenter', () => {
      if (!el.classList.contains('sel')) el.classList.add('tilting');
    });

    el.addEventListener('pointermove', (event) => {
      if (isReduced() || !isFine() || el.classList.contains('sel')) return;
      const rect = el.getBoundingClientRect();
      px = (event.clientX - rect.left) / rect.width - 0.5;
      py = (event.clientY - rect.top) / rect.height - 0.5;

      if (frame) return;
      frame = requestAnimationFrame(() => {
        el.style.setProperty('--mx', `${(px + 0.5) * 100}%`);
        el.style.setProperty('--my', `${(py + 0.5) * 100}%`);
        el.style.setProperty('--ry', `${(px * maxDeg).toFixed(2)}deg`);
        el.style.setProperty('--rx', `${(-py * maxDeg).toFixed(2)}deg`);
        frame = null;
      });
    });

    el.addEventListener('pointerleave', () => {
      el.classList.remove('tilting');
      el.style.setProperty('--mx', '50%');
      el.style.setProperty('--my', '50%');
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  }

  /* =========================================================
     Platform picker
     ========================================================= */
  const platformCards = $$('.plat-card');

  function setPlatformState(card, open) {
    const front  = $('.plat-front', card);
    const detail = $('.plat-detail', card);
    if (!front || !detail) return;

    card.classList.toggle('sel', open);
    front.setAttribute('aria-expanded', String(open));
    front.inert  = open;
    detail.inert = !open;
    card.classList.remove('tilting');
    if (!open) {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    }
  }

  function openPlatform(card, event) {
    if (!card || card.classList.contains('sel')) return;

    platformCards.forEach((other) => {
      if (other !== card && other.classList.contains('sel')) {
        setPlatformState(other, false);
      }
    });

    setPlatformState(card, true);
    spawnRipple(card, event);

    // Keyboard users get moved into the revealed panel, then back again.
    if (event && event.detail === 0) {
      window.setTimeout(() => {
        $('.dv-back', card)?.focus({ preventScroll: true });
      }, 320);
    }
  }

  function closePlatform(card, event) {
    event?.stopPropagation();
    if (!card || !card.classList.contains('sel')) return;

    setPlatformState(card, false);
    window.setTimeout(() => {
      $('.plat-front', card)?.focus({ preventScroll: true });
    }, 280);
  }

  platformCards.forEach((card) => {
    const front = $('.plat-front', card);
    const back  = $('.dv-back', card);

    front?.addEventListener('click', (event) => openPlatform(card, event));
    back?.addEventListener('click', (event) => closePlatform(card, event));

    addTilt(card, 7);
  });

  /* Close any open platform panel when clicking outside the grid. */
  document.addEventListener('pointerdown', (event) => {
    if ($('#guideModal')?.classList.contains('open')) return;
    if (!event.target.closest('.plat-card')) {
      platformCards.forEach((card) => {
        if (card.classList.contains('sel')) setPlatformState(card, false);
      });
    }
  });

  $$('.cfg-card').forEach((card) => addTilt(card, 4.5));

  /* =========================================================
     Scroll reveal
     ========================================================= */
  (function initReveal() {
    const elements = $$('.reveal');
    if (!elements.length) return;

    if (isReduced() || !('IntersectionObserver' in window)) {
      elements.forEach((el) => el.classList.add('in'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    elements.forEach((el) => observer.observe(el));
  })();

  /* =========================================================
     Theme switch (with a circular view-transition reveal)
     ========================================================= */
  const root       = document.documentElement;
  const themeBtn   = $('#themeToggle');
  const themeColor = $('#themeColor');

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    themeBtn?.setAttribute('aria-pressed', String(theme === 'dark'));
    themeColor?.setAttribute('content', theme === 'dark' ? '#060918' : '#eef1fb');
    try { localStorage.setItem('theme', theme); } catch (_) { /* private mode */ }
  }

  themeBtn?.setAttribute('aria-pressed', String(root.getAttribute('data-theme') === 'dark'));

  themeBtn?.addEventListener('click', (event) => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    const supportsTransition = typeof document.startViewTransition === 'function';

    if (!supportsTransition || isReduced()) {
      applyTheme(next);
      return;
    }

    const rect = themeBtn.getBoundingClientRect();
    const x = event.detail === 0 ? rect.left + rect.width / 2 : event.clientX;
    const y = event.detail === 0 ? rect.top  + rect.height / 2 : event.clientY;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(() => applyTheme(next));
    transition.ready
      .then(() => {
        root.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${radius}px at ${x}px ${y}px)`
            ]
          },
          {
            duration: 680,
            easing: 'cubic-bezier(.22,1,.36,1)',
            pseudoElement: '::view-transition-new(root)'
          }
        );
      })
      .catch(() => { /* the theme has already changed */ });
  });

  /* =========================================================
     Download feedback: progress bar, toast, burst
     ========================================================= */
  const toast     = $('#toast');
  const toastIco  = $('#toastIco');
  const toastText = $('#toastText');
  const progressFill = $('#progressBarFill');

  let toastTimer = null;
  let progressTimers = [];

  function showToast(message, icon = '⬇', iconClass = '') {
    if (!toast) return;
    toastIco.className = 'toast-ico ' + iconClass;
    toastIco.textContent = icon;
    toastText.textContent = message;

    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function runProgress() {
    if (!progressFill) return;

    progressTimers.forEach((timer) => clearTimeout(timer));
    progressTimers = [];

    progressFill.style.transition = 'none';
    progressFill.classList.remove('on');
    progressFill.style.width = '0%';
    void progressFill.offsetWidth;

    progressFill.style.transition = 'width .45s cubic-bezier(.4,0,.2,1), opacity .3s ease';
    progressFill.classList.add('on');

    requestAnimationFrame(() => { progressFill.style.width = '72%'; });
    progressTimers.push(setTimeout(() => { progressFill.style.width = '92%'; }, 430));
    progressTimers.push(setTimeout(() => { progressFill.style.width = '100%'; }, 900));
    progressTimers.push(setTimeout(() => { progressFill.classList.remove('on'); }, 1350));
    progressTimers.push(setTimeout(() => {
      progressFill.style.transition = 'none';
      progressFill.style.width = '0%';
    }, 1750));
  }

  const downloadTimers = new WeakMap();

  $$('[data-dl]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const label = link.getAttribute('data-dl-label') || 'فایل';
      const point = clickPoint(link, event);
      const stateIcon = link.querySelector('.dl-arrow') || link.querySelector('.cfg-dl-ico');

      runProgress();
      spawnBurst(point.x, point.y);
      showToast(`در حال آماده‌سازی ${label}…`, '↻', 'spin');

      if (!stateIcon) return;

      const previous = downloadTimers.get(link);
      if (previous) clearTimeout(previous);

      stateIcon.classList.remove('done');
      stateIcon.classList.add('loading');
      if (link.classList.contains('cfg-dl')) link.classList.add('loading');

      const firstTimer = setTimeout(() => {
        stateIcon.classList.remove('loading');
        stateIcon.classList.add('done');
        link.classList.remove('loading');
        showToast(`دانلود ${label} شروع شد`, '✓', 'ok');

        const resetTimer = setTimeout(() => stateIcon.classList.remove('done'), 2100);
        downloadTimers.set(link, resetTimer);
      }, 850);

      downloadTimers.set(link, firstTimer);
    });
  });

  /* =========================================================
     Guide data
     ========================================================= */
  const guides = {
    win: {
      name: 'ویندوز',
      logo: 'logos/windows.png',
      emoji: '🪟',
      tabs: ['نصب', 'وارد کردن کانفیگ', 'اتصال'],
      panels: [
        {
          steps: [
            ['دانلود فایل نصب', 'روی دکمه <strong>دانلود نصب‌کننده</strong> کلیک کنید تا فایل MSI دانلود شود.'],
            ['اجرای نصب‌کننده', 'فایل دانلودشده را اجرا کنید. اگر پنجره UAC باز شد، روی <strong>Yes</strong> کلیک کنید.'],
            ['اتمام نصب', 'مراحل نصب را دنبال کنید و در پایان روی <strong>Finish</strong> کلیک کنید.']
          ],
          tip: 'اگر Windows SmartScreen پیام داد، روی <strong>More info</strong> و سپس <strong>Run anyway</strong> بزنید.'
        },
        {
          steps: [
            ['دانلود فایل کانفیگ', 'یکی از فایل‌های <code>UDP.ovpn</code> یا <code>TCP.ovpn</code> را از بخش کانفیگ‌ها دانلود کنید.'],
            ['باز کردن برنامه', 'برنامه OpenVPN Connect را باز کنید و گزینه <strong>Upload File</strong> را انتخاب کنید.'],
            ['انتخاب فایل', 'فایل <code>.ovpn</code> را انتخاب کنید تا کانفیگ به برنامه اضافه شود.']
          ],
          tip: 'اگر فایل باز نشد، آن را با ماوس داخل پنجره برنامه بکشید و رها کنید.'
        },
        {
          steps: [
            ['انتخاب کانفیگ', 'در لیست کانفیگ‌ها روی کانفیگی که اضافه کردید کلیک کنید.'],
            ['اتصال', 'دکمه <strong>Connect</strong> را بزنید و در صورت نیاز <strong>OK</strong> را تأیید کنید.'],
            ['بررسی اتصال', 'وقتی آیکون VPN در تسک‌بار سبز شد، اتصال برقرار است.']
          ],
          tip: 'اگر اتصال قطع شد، کانفیگ <strong>TCP</strong> را امتحان کنید.'
        }
      ]
    },

    android: {
      name: 'اندروید',
      logo: 'logos/android.png',
      emoji: '🤖',
      tabs: ['نصب', 'وارد کردن کانفیگ', 'اتصال'],
      panels: [
        {
          steps: [
            ['دانلود برنامه', 'از طریق <strong>Google Play</strong> یا دانلود مستقیم <strong>APK</strong> برنامه را نصب کنید.'],
            ['نصب APK', 'به <strong>تنظیمات ← امنیت</strong> بروید و <strong>نصب از منابع ناشناس</strong> را برای فایل‌منیجر فعال کنید.'],
            ['باز کردن برنامه', 'بعد از نصب، برنامه <strong>OpenVPN Connect</strong> را باز کنید.']
          ],
          tip: 'اگر Play Store در دسترس نیست، نسخه APK را دانلود و نصب کنید.'
        },
        {
          steps: [
            ['دانلود فایل کانفیگ', 'فایل <code>UDP.ovpn</code> یا <code>TCP.ovpn</code> را روی گوشی دانلود کنید.'],
            ['باز کردن فایل', 'از فایل‌منیجر فایل را پیدا کنید و با <strong>Open with OpenVPN</strong> باز کنید.'],
            ['تأیید افزودن', 'در برنامه روی <strong>Add</strong> یا <strong>Import</strong> بزنید.']
          ],
          tip: 'اگر فایل در مرورگر ذخیره شد، از بخش Downloads مرورگر آن را باز کنید.'
        },
        {
          steps: [
            ['انتخاب کانفیگ', 'کانفیگ اضافه‌شده را در لیست پیدا کنید و روی آن بزنید.'],
            ['اتصال', 'دکمه <strong>Connect</strong> را بزنید و دسترسی VPN را تأیید کنید.'],
            ['بررسی اتصال', 'آیکون کلید VPN در نوار وضعیت نشان می‌دهد که متصل هستید.']
          ],
          tip: 'اگر اتصال برقرار نشد، یک‌بار برنامه را ببندید و دوباره باز کنید.'
        }
      ]
    },

    ios: {
      name: 'آیفون / آیپد',
      logo: 'logos/ios.png',
      emoji: '🍎',
      tabs: ['نصب', 'وارد کردن کانفیگ', 'اتصال'],
      panels: [
        {
          steps: [
            ['دانلود از App Store', 'روی دکمه <strong>App Store</strong> بزنید و <strong>OpenVPN Connect</strong> را نصب کنید.'],
            ['باز کردن برنامه', 'بعد از نصب، برنامه را باز کنید و مجوزهای درخواستی را تأیید کنید.']
          ],
          tip: 'برای نصب از App Store به Apple ID خود وارد شوید.'
        },
        {
          steps: [
            ['دانلود فایل کانفیگ', 'فایل <code>.ovpn</code> را در Safari دانلود کنید.'],
            ['باز کردن با OpenVPN', 'روی فایل بزنید، آیکون <strong>Share</strong> را انتخاب کنید و <strong>Copy to OpenVPN</strong> را بزنید.'],
            ['تأیید افزودن', 'در برنامه OpenVPN روی <strong>Add</strong> بزنید.']
          ],
          tip: 'اگر گزینه Copy to OpenVPN دیده نشد، در منوی Share روی <strong>More</strong> بزنید.'
        },
        {
          steps: [
            ['انتخاب کانفیگ', 'روی کانفیگ اضافه‌شده بزنید.'],
            ['اتصال', 'دکمه <strong>Connect</strong> را بزنید و <strong>Allow</strong> را تأیید کنید.'],
            ['بررسی اتصال', 'علامت <strong>VPN</strong> در نوار وضعیت بالای صفحه نشان می‌دهد که متصل هستید.']
          ],
          tip: 'اگر VPN وصل نشد، وضعیت آن را در Settings ← General ← VPN & Device Management بررسی کنید.'
        }
      ]
    }
  };

  /* =========================================================
     Guide modal
     ========================================================= */
  const overlay    = $('#guideModal');
  const modal      = $('.modal', overlay || document);
  const modalIcon  = $('#modalIcon');
  const modalTitle = $('#modalTitle');
  const modalTabs  = $('#modalTabs');
  const modalBody  = $('#modalBody');
  const modalClose = $('#modalClose');

  let lastFocused = null;
  let currentGuideKey = null;

  const toPersianNumber = (number) => Number(number).toLocaleString('fa-IR');

  function guideIcon() {
    const g = guides[currentGuideKey];
    if (!g) return '';
    return `<img src="${g.logo}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="fb" style="display:none">${g.emoji}</span>`;
  }

  function buildTabs(g) {
    return g.tabs.map((label, index) => (
      `<button class="mtab${index === 0 ? ' active' : ''}" type="button" role="tab"
        id="guide-tab-${index}" aria-selected="${index === 0}" aria-controls="guide-panel-${index}"
        tabindex="${index === 0 ? 0 : -1}">${label}</button>`
    )).join('');
  }

  function buildPanels(g) {
    return g.panels.map((panel, index) => {
      const steps = panel.steps.map((step, stepIndex) => (
        `<div class="step" style="--i:${stepIndex}">
          <div class="step-num">${toPersianNumber(stepIndex + 1)}</div>
          <div class="step-content">
            <div class="step-title">${step[0]}</div>
            <div class="step-desc">${step[1]}</div>
          </div>
        </div>`
      )).join('');

      const tip = panel.tip
        ? `<div class="guide-tip"><span aria-hidden="true">💡</span><span>${panel.tip}</span></div>`
        : '';

      return `<div class="tab-panel${index === 0 ? ' active' : ''}" role="tabpanel"
        id="guide-panel-${index}" aria-labelledby="guide-tab-${index}"
        tabindex="0"${index === 0 ? '' : ' hidden'}>
        <div class="steps">${steps}</div>${tip}
      </div>`;
    }).join('');
  }

  function selectTab(index) {
    if (!modalTabs || !modalBody) return;
    const tabs = $$('.mtab', modalTabs);
    const panels = $$('.tab-panel', modalBody);
    if (!tabs[index]) return;

    tabs.forEach((tab, tabIndex) => {
      const active = tabIndex === index;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });

    panels.forEach((panel, panelIndex) => {
      const active = panelIndex === index;
      panel.classList.toggle('active', active);
      if (active) panel.removeAttribute('hidden');
      else panel.setAttribute('hidden', '');
    });

    modalBody.scrollTop = 0;
  }

  function bindTabs() {
    const tabs = $$('.mtab', modalTabs);
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => selectTab(index));

      tab.addEventListener('keydown', (event) => {
        let next = null;

        if (event.key === 'ArrowRight') next = index === 0 ? tabs.length - 1 : index - 1;
        if (event.key === 'ArrowLeft')  next = index === tabs.length - 1 ? 0 : index + 1;
        if (event.key === 'Home')       next = 0;
        if (event.key === 'End')        next = tabs.length - 1;

        if (next === null) return;
        event.preventDefault();
        selectTab(next);
        tabs[next].focus({ preventScroll: true });
      });
    });
  }

  function renderGuide(key) {
    const g = guides[key];
    if (!g || !modal) return;

    currentGuideKey = key;
    if (modalIcon)  modalIcon.innerHTML = guideIcon();
    if (modalTitle) modalTitle.textContent = `آموزش اتصال — ${g.name}`;
    if (modalTabs)  modalTabs.innerHTML = buildTabs(g);
    if (modalBody)  modalBody.innerHTML = buildPanels(g);

    bindTabs();
    if (modalBody) modalBody.scrollTop = 0;
  }

  function openGuide(key) {
    if (!overlay || !guides[key]) return;

    lastFocused = document.activeElement;
    renderGuide(key);

    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    root.classList.add('modal-open');

    window.setTimeout(() => {
      modalClose?.focus({ preventScroll: true });
    }, 80);
  }

  function closeGuide() {
    if (!overlay || !overlay.classList.contains('open')) return;

    overlay.classList.remove('open');
    root.classList.remove('modal-open');

    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus({ preventScroll: true });
    }
    overlay.setAttribute('aria-hidden', 'true');
  }

  $$('[data-guide]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      openGuide(button.getAttribute('data-guide'));
    });
  });

  modalClose?.addEventListener('click', closeGuide);

  overlay?.addEventListener('click', (event) => {
    if (event.target === overlay) closeGuide();
  });

  document.addEventListener('keydown', (event) => {
    if (!overlay || !overlay.classList.contains('open')) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeGuide();
      return;
    }

    if (event.key !== 'Tab' || !modal) return;

    const focusables = $$(
      'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      modal
    ).filter((el) => !el.hasAttribute('hidden') && el.offsetParent !== null);

    if (!focusables.length) return;

    const first = focusables[0];
    const last  = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      last.focus();
      event.preventDefault();
    } else if (!event.shiftKey && document.activeElement === last) {
      first.focus();
      event.preventDefault();
    }
  });

  /* Swipe-down to dismiss the mobile bottom sheet */
  (function initSheetSwipe() {
    if (!modal || !overlay) return;

    let startY = null;
    let currentY = 0;
    let pointerId = null;

    const resetSheet = () => {
      modal.style.transition = '';
      modal.style.transform = '';
      startY = null;
      currentY = 0;
      pointerId = null;
    };

    modal.addEventListener('pointerdown', (event) => {
      if (!sheetQuery.matches || !overlay.classList.contains('open')) return;
      if (!(event.target instanceof Element)) return;
      if (!event.target.closest('.sheet-handle, .modal-head')) return;
      if (event.pointerType === 'mouse') return;

      startY = event.clientY;
      currentY = 0;
      pointerId = event.pointerId;
      modal.style.transition = 'none';

      try { modal.setPointerCapture(event.pointerId); } catch (_) { /* not critical */ }
    });

    modal.addEventListener('pointermove', (event) => {
      if (startY === null || event.pointerId !== pointerId) return;

      currentY = Math.max(0, event.clientY - startY);
      modal.style.transform = `translateY(${currentY}px)`;
    });

    modal.addEventListener('pointerup', () => {
      if (startY === null) return;

      if (currentY > 90) {
        resetSheet();
        closeGuide();
      } else {
        resetSheet();
      }
    });

    modal.addEventListener('pointercancel', resetSheet);
  })();

  /* =========================================================
     Little niceties
     ========================================================= */
  // Pause decorative animations while the tab is hidden.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      root.classList.add('page-hidden');
    } else {
      root.classList.remove('page-hidden');
    }
  });

  // Smoothly scroll the small "start" cue, respecting reduced motion.
  $$('.scroll-cue').forEach((cue) => {
    cue.addEventListener('click', (event) => {
      const target = document.getElementById('platforms');
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({
        behavior: isReduced() ? 'auto' : 'smooth',
        block: 'start'
      });
    });
  });
})();
