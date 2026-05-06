/* ============================================
   CHALIANNA FIGUEROA — INTERACTIONS
============================================ */

(() => {
  'use strict';

  /* ---------- 1. Sticky / scrolled nav ---------- */
  const nav = document.getElementById('nav');
  const onScroll = () => {
    if (window.scrollY > 40) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 2. Mobile nav toggle ---------- */
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  const closeMenu = () => {
    navLinks.classList.remove('is-open');
    navToggle.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('is-open');
    navToggle.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  /* ---------- 3. Scroll-triggered reveals ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );

    revealEls.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i * 40, 200)}ms`;
      io.observe(el);
    });
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- 4. Portfolio filtering ---------- */
  const filters = document.querySelectorAll('.portfolio__filter');
  const items = document.querySelectorAll('.portfolio__item');

  filters.forEach((filter) => {
    filter.addEventListener('click', () => {
      filters.forEach((f) => f.classList.remove('is-active'));
      filter.classList.add('is-active');

      const cat = filter.dataset.filter;
      items.forEach((item) => {
        const match = cat === 'all' || item.dataset.cat === cat;
        item.classList.toggle('is-hidden', !match);
      });
    });
  });

  /* ---------- 5. Booking step indicator ---------- */
  const bookingForm = document.getElementById('bookingForm');
  const steps = document.querySelectorAll('.booking__step');

  if (bookingForm) {
    const service = bookingForm.querySelector('#b-service');
    const date = bookingForm.querySelector('#b-date');
    const name = bookingForm.querySelector('#b-name');

    const updateSteps = () => {
      const filled = [
        !!service.value,
        !!date.value,
        !!name.value,
      ];
      steps.forEach((step, i) => {
        step.classList.toggle('is-active', filled[i] || (i === 0 && !filled[0]));
      });
      // Activate the next pending step
      const nextIdx = filled.findIndex((v) => !v);
      steps.forEach((step, i) => step.classList.remove('is-active'));
      steps[nextIdx === -1 ? steps.length - 1 : nextIdx].classList.add('is-active');
    };

    [service, date, name].forEach((el) => {
      el.addEventListener('input', updateSteps);
      el.addEventListener('change', updateSteps);
    });
  }

  /* ---------- 6. Form submissions (front-end demo) ---------- */
  const handleForm = (formId, successId, nameField) => {
    const form = document.getElementById(formId);
    const success = document.getElementById(successId);
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      if (nameField) {
        const target = document.getElementById(nameField);
        const nameInput = form.querySelector('input[name="name"]');
        if (target && nameInput) target.textContent = nameInput.value.split(' ')[0];
      }

      form.style.opacity = '0.55';
      form.style.pointerEvents = 'none';
      success.hidden = false;
      success.scrollIntoView({ behavior: 'smooth', block: 'center' });

      setTimeout(() => {
        form.reset();
        form.style.opacity = '1';
        form.style.pointerEvents = '';
      }, 4000);
    });
  };

  handleForm('bookingForm', 'bookingSuccess', 'bookingName');
  handleForm('contactForm', 'contactSuccess');

  /* ---------- 7. Booking calendar (syncs with iCloud) ---------- */
  const cal = document.getElementById('calendar');
  if (cal) initCalendar();

  function initCalendar() {
    const grid       = document.getElementById('calGrid');
    const titleEl    = document.getElementById('calTitle');
    const prevBtn    = document.getElementById('calPrev');
    const nextBtn    = document.getElementById('calNext');
    const dateInput  = document.getElementById('b-date');
    const timeRow    = document.getElementById('timeRow');
    const timeSelect = document.getElementById('b-time');
    const helpEl     = document.getElementById('b-date-help');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 90-day horizon (matches the API)
    const horizon = new Date(today);
    horizon.setDate(horizon.getDate() + 90);

    let viewYear  = today.getFullYear();
    let viewMonth = today.getMonth();
    let busyDates = new Set();
    let busySlots = {};
    let selected  = null;

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    const pad = (n) => String(n).padStart(2, '0');
    const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    // Default time slots offered (Chalianna can refine in script.js if needed)
    const defaultSlots = [
      '09:00', '10:00', '11:00', '12:00',
      '13:00', '14:00', '15:00', '16:00',
      '17:00', '18:00', '19:00',
    ];

    // ---- Fetch availability from /api/availability (Azure Function) ----
    fetch('/api/availability')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        if (Array.isArray(data.busyDates)) busyDates = new Set(data.busyDates);
        if (data.busySlots && typeof data.busySlots === 'object') busySlots = data.busySlots;
        render();
      })
      .catch(() => {
        // API not deployed yet, or offline — calendar still works, just no busy days marked
        render();
      });

    // ---- Render the month grid ----
    function render() {
      titleEl.textContent = `${monthNames[viewMonth]} ${viewYear}`;
      grid.innerHTML = '';

      const firstOfMonth = new Date(viewYear, viewMonth, 1);
      const startWeekday = firstOfMonth.getDay();
      const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

      // Leading blanks
      for (let i = 0; i < startWeekday; i++) {
        const blank = document.createElement('span');
        blank.className = 'cal__cell cal__cell--blank';
        grid.appendChild(blank);
      }

      // Day cells
      for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(viewYear, viewMonth, day);
        const key = ymd(dateObj);
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'cal__cell';
        cell.textContent = day;
        cell.dataset.date = key;

        const isPast    = dateObj < today;
        const isFuture  = dateObj > horizon;
        const isBooked  = busyDates.has(key);
        const isToday   = key === ymd(today);
        const isSelected = selected === key;

        if (isPast || isFuture) cell.classList.add('cal__cell--past');
        if (isBooked) cell.classList.add('cal__cell--busy');
        if (isToday)  cell.classList.add('cal__cell--today');
        if (isSelected) cell.classList.add('cal__cell--selected');

        if (isPast || isFuture || isBooked) {
          cell.disabled = true;
          if (isBooked) cell.title = 'Booked — choose another day';
        } else {
          cell.addEventListener('click', () => selectDate(key, dateObj));
        }

        grid.appendChild(cell);
      }

      // Disable nav buttons at edges
      const prevMonth = new Date(viewYear, viewMonth - 1, 1);
      const lastOfPrev = new Date(viewYear, viewMonth, 0);
      prevBtn.disabled = lastOfPrev < today;

      const firstOfNext = new Date(viewYear, viewMonth + 1, 1);
      nextBtn.disabled = firstOfNext > horizon;
    }

    function selectDate(key, dateObj) {
      selected = key;
      dateInput.value = key;
      // Hidden inputs don't fire events on programmatic change — dispatch manually
      dateInput.dispatchEvent(new Event('change', { bubbles: true }));
      const human = dateObj.toLocaleDateString(undefined, {
        weekday: 'long', month: 'long', day: 'numeric',
      });
      helpEl.textContent = `— ${human}`;
      buildTimeSlots(key);
      render();
      timeRow.hidden = false;
    }

    function buildTimeSlots(key) {
      const taken = busySlots[key] || [];
      // Convert "HH:MM" to minutes for overlap check
      const toMin = (s) => {
        const [h, m] = s.split(':').map(Number);
        return h * 60 + m;
      };
      const overlaps = (slot) => {
        const start = toMin(slot);
        const end = start + 90; // assume 90 min appointment for slot conflict
        return taken.some((t) => {
          const ts = toMin(t.start);
          const te = toMin(t.end);
          return start < te && end > ts;
        });
      };

      timeSelect.innerHTML = '<option value="">Select a time</option>';
      defaultSlots.forEach((slot) => {
        const opt = document.createElement('option');
        opt.value = slot;
        opt.textContent = slot;
        if (overlaps(slot)) {
          opt.disabled = true;
          opt.textContent = `${slot} — booked`;
        }
        timeSelect.appendChild(opt);
      });
    }

    prevBtn.addEventListener('click', () => {
      if (prevBtn.disabled) return;
      viewMonth--;
      if (viewMonth < 0) { viewMonth = 11; viewYear--; }
      render();
    });
    nextBtn.addEventListener('click', () => {
      if (nextBtn.disabled) return;
      viewMonth++;
      if (viewMonth > 11) { viewMonth = 0; viewYear++; }
      render();
    });

    render();
  }

  /* ---------- 8. Footer year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- 9. Smooth-scroll for in-page anchors ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href');
      if (id.length > 1) {
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          const offset = nav.offsetHeight - 4;
          const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }
    });
  });

})();
