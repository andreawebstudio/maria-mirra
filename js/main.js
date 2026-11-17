/* Dott.ssa Maria Mirra — interazioni leggere e accessibili */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  var toggleLabel = toggle ? toggle.querySelector('.visually-hidden') : null;
  var mqMobile = window.matchMedia('(max-width: 1099px)');

  /* ---------- Header ---------- */
  function onScrollHeader() { header.classList.toggle('is-scrolled', window.scrollY > 8); }
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  /* ---------- Menu burger (solo mobile/tablet) ---------- */
  function setMenu(open, returnFocus) {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    if (toggleLabel) toggleLabel.textContent = open ? 'Chiudi il menu' : 'Apri il menu';
    if (open) {
      var first = nav.querySelector('a');
      if (first) first.focus({ preventScroll: true });
    } else if (returnFocus) {
      toggle.focus();
    }
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a') && mqMobile.matches) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) setMenu(false, true);
    });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !nav.contains(e.target) && !toggle.contains(e.target)) setMenu(false);
    });
    mqMobile.addEventListener('change', function (e) { if (!e.matches) setMenu(false); });
  }

  /* ---------- Voce di menu attiva ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-list a'));
  if ('IntersectionObserver' in window) {
    var sectionMap = {};
    links.forEach(function (a) {
      var s = document.querySelector(a.getAttribute('href'));
      if (s) sectionMap[s.id] = a;
    });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && sectionMap[en.target.id]) {
          links.forEach(function (l) { l.classList.remove('is-active'); l.removeAttribute('aria-current'); });
          sectionMap[en.target.id].classList.add('is-active');
          sectionMap[en.target.id].setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(sectionMap).forEach(function (id) { spy.observe(document.getElementById(id)); });
  }

  /* ---------- Fade-in progressivo ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) {
      if (el.matches('.card, .service-card, .principle')) {
        var idx = Array.prototype.indexOf.call(el.parentElement.children, el);
        el.style.transitionDelay = (Math.min(idx, 4) * 90) + 'ms';
      }
      io.observe(el);
    });
  }

  /* ---------- Come funziona: percorso che si disegna con lo scroll ---------- */
  var journey = document.querySelector('.journey');
  if (journey) {
    var steps = Array.prototype.slice.call(journey.querySelectorAll('.jstep'));
    var track = journey.querySelector('.journey-track');
    // soglia di attivazione = posizione reale del punto lungo la linea
    var thresholdOf = function (step) {
      var t = track.getBoundingClientRect();
      var d = step.querySelector('.jdot').getBoundingClientRect();
      var vertical = t.height > t.width;
      var pos = vertical ? (d.top - t.top) / t.height : (d.left - t.left) / t.width;
      return Math.max(0, Math.min(1, pos));
    };
    var setProgress = function (p) {
      journey.style.setProperty('--p', p.toFixed(3));
      steps.forEach(function (s) {
        if (p >= thresholdOf(s) - 0.001) s.classList.add('is-active');
      });
    };
    if (reduce) {
      setProgress(1);
    } else {
      var ticking = false;
      var update = function () {
        ticking = false;
        var r = journey.getBoundingClientRect();
        var vh = window.innerHeight || document.documentElement.clientHeight;
        // inizia quando il percorso entra al 80% del viewport, completo al 45%
        var start = vh * 0.8, end = vh * 0.45;
        var total = r.height + (start - end);
        var p = (start - r.top) / total;
        p = Math.max(0, Math.min(1, p * 1.15));
        setProgress(Math.max(p, parseFloat(journey.style.getPropertyValue('--p')) || 0));
      };
      var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      update();
    }
  }

  /* ---------- Accordion FAQ (tutte chiuse all'avvio) ---------- */
  document.querySelectorAll('.acc-trigger').forEach(function (btn) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      panel.hidden = open;
      if (!open && !reduce && panel.animate) {
        panel.animate(
          [{ height: '0px', opacity: 0 }, { height: panel.scrollHeight + 'px', opacity: 1 }],
          { duration: 320, easing: 'cubic-bezier(.22,.61,.36,1)' }
        );
      }
    });
  });

  /* ---------- Modal Eventi ---------- */
  var dialog = document.getElementById('event-dialog');
  var trigger = document.querySelector('.event-trigger');
  if (dialog && trigger && typeof dialog.showModal === 'function') {
    trigger.addEventListener('click', function () {
      dialog.showModal();
      document.body.classList.add('dialog-open');
    });
    dialog.addEventListener('close', function () {
      document.body.classList.remove('dialog-open');
      trigger.focus({ preventScroll: true });
    });
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) dialog.close();               // clic sul backdrop
      var closer = e.target.closest('[data-close]');
      if (closer) {
        dialog.close();
        var href = closer.getAttribute('href');
        if (href && href.charAt(0) === '#') {
          e.preventDefault();
          var target = document.querySelector(href);
          if (target) target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
        }
      }
    });
  } else if (trigger) {
    // Browser senza <dialog>: porta direttamente ai contatti
    trigger.addEventListener('click', function () { location.hash = '#contatti'; });
  }

  /* ---------- Form contatti ---------- */
  var form = document.getElementById('contact-form');
  if (form) {
    var endpoint = (form.getAttribute('data-endpoint') || '').trim();
    var waNumber = (form.getAttribute('data-whatsapp') || '').trim();
    var status = form.querySelector('.form-status');
    var submitBtn = form.querySelector('button[type="submit"]');
    var note = form.querySelector('[data-channel-note]');
    if (endpoint && note) note.hidden = true;

    var validate = function () {
      var invalid = null;
      form.querySelectorAll('[required]').forEach(function (field) {
        var ok = field.type === 'checkbox' ? field.checked : field.checkValidity();
        field.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (!ok && !invalid) invalid = field;
      });
      return invalid;
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.textContent = '';
      status.className = 'form-status';

      var invalid = validate();
      if (invalid) {
        status.textContent = 'Controlla i campi obbligatori e il consenso privacy.';
        status.classList.add('is-error');
        invalid.focus();
        return;
      }
      if (form.querySelector('.hp').value) return; // anti-spam

      var data = new FormData(form);

      if (endpoint) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Invio in corso…';
        fetch(endpoint, { method: 'POST', body: data, headers: { 'Accept': 'application/json' } })
          .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            form.reset();
            status.textContent = 'Grazie, la tua richiesta è stata inviata. Ti risponderò appena possibile.';
            status.classList.add('is-success');
          })
          .catch(function () {
            status.textContent = 'Non è stato possibile inviare la richiesta. Riprova più tardi oppure scrivimi su WhatsApp.';
            status.classList.add('is-error');
          })
          .finally(function () {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Invia la tua richiesta';
          });
        return;
      }

      if (waNumber) {
        var lines = [
          'Buongiorno Dott.ssa Mirra, vorrei richiedere una consulenza.',
          '',
          'Nome: ' + data.get('nome'),
          'Email: ' + data.get('email')
        ];
        if (data.get('telefono')) lines.push('Telefono: ' + data.get('telefono'));
        lines.push('', data.get('messaggio'));
        var url = 'https://wa.me/' + waNumber + '?text=' + encodeURIComponent(lines.join('\n'));
        var win = window.open(url, '_blank');
        if (win) { win.opener = null; } else { location.href = url; }
        status.textContent = 'Si è aperto WhatsApp con il tuo messaggio: premi “Invia” per completare la richiesta.';
        status.classList.add('is-success');
      }
    });
  }

  /* ---------- Anno corrente ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
