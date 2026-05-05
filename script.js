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

  /* ---------- 7. Set min date on booking ---------- */
  const dateInput = document.getElementById('b-date');
  if (dateInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.min = `${yyyy}-${mm}-${dd}`;
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
