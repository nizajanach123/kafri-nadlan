document.getElementById('year').textContent = new Date().getFullYear();

  // Reveal on scroll
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // FAQ: answers open and close smoothly (height + fade) instead of snapping
  (function () {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !Element.prototype.animate) return;
    const ease = 'cubic-bezier(.22, 1, .36, 1)';
    document.querySelectorAll('.faq details').forEach(d => {
      const s = d.querySelector('summary'), p = d.querySelector('p');
      s.addEventListener('click', e => {
        e.preventDefault();
        if (d._closing) { d._a.cancel(); p.getAnimations().forEach(a => a.cancel()); d._closing = false; return; }
        if (d._a) d._a.cancel();
        const border = d.offsetHeight - d.clientHeight;
        if (d.open) {
          const start = d.offsetHeight, end = s.offsetHeight + border;
          d._closing = true;
          p.animate({ opacity: [1, 0] }, { duration: 180, fill: 'forwards' });
          d._a = d.animate({ height: [start + 'px', end + 'px'] }, { duration: 320, easing: ease });
          d._a.onfinish = () => { d.open = false; d._closing = false; d._a = null; p.getAnimations().forEach(a => a.cancel()); };
        } else {
          const start = d.offsetHeight;
          d.open = true;
          const end = d.offsetHeight;
          p.animate({ opacity: [0, 1] }, { duration: 450, delay: 90, easing: ease, fill: 'backwards' });
          d._a = d.animate({ height: [start + 'px', end + 'px'] }, { duration: 380, easing: ease });
          d._a.onfinish = () => { d._a = null; };
        }
      });
    });
  })();

  // Project: the development-area number counts up to 58 and its bar fills when it scrolls into view
  document.querySelectorAll('.spec-dev').forEach(function (tile) {
    const num = tile && tile.querySelector('.count');
    if (!tile || !num) return;
    const to = +num.dataset.to;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { tile.classList.add('go'); return; }
    num.textContent = '0';
    new IntersectionObserver(([e], io) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      tile.classList.add('go');
      const start = performance.now(), dur = 1300;
      (function step(now) {
        const p = Math.min(1, (now - start - 200) / dur);
        const eased = p <= 0 ? 0 : 1 - Math.pow(1 - p, 3);
        num.textContent = Math.round(to * eased);
        if (p < 1) requestAnimationFrame(step); else num.textContent = to;
      })(start);
    }, { threshold: 0.6 }).observe(tile);
  });

  // Hero intro: photo alone -> logo appears small in the middle -> grows and travels to its spot -> text follows (CSS, --t0)
  (function () {
    const hero = document.querySelector('.hero');
    const logo = hero && hero.querySelector('.hero-logo');
    if (!hero || !logo) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || window.scrollY > 120 || /^#\//.test(location.hash)) { logo.style.animation = 'none'; logo.style.opacity = '1'; return; }
    const run = () => {
      const hr = hero.getBoundingClientRect(), lr = logo.getBoundingClientRect();
      const phone = matchMedia('(max-width: 600px)').matches;           // on phones the bar is at the bottom
      const barH = phone ? document.querySelector('header').offsetHeight : 0;
      const top = Math.max(hr.top, phone ? 0 : 68), bottom = Math.min(hr.bottom, window.innerHeight - barH);   // visible part of the hero, under the sticky header
      const dx = hr.left + hr.width / 2 - (lr.left + lr.width / 2);
      const dy = (top + bottom) / 2 - (lr.top + lr.height / 2);
      const small = `translate(${dx}px, ${dy}px) scale(.22)`;
      logo.style.animation = 'none';
      logo.animate([
        { opacity: 0, transform: small, filter: 'blur(14px)', offset: 0, easing: 'cubic-bezier(.22, 1, .36, 1)' },
        { opacity: 1, transform: small, filter: 'blur(0px)', offset: .3, easing: 'linear' },
        { opacity: 1, transform: small, filter: 'blur(0px)', offset: .4, easing: 'cubic-bezier(.65, 0, .35, 1)' },
        { opacity: 1, transform: 'translate(0px, 0px) scale(1)', filter: 'blur(0px)', offset: 1 }
      ], { duration: 2300, delay: 1000, fill: 'both' });
    };
    const img = logo.querySelector('img');
    if (!img || img.complete) run(); else img.addEventListener('load', run, { once: true });
  })();

  // Hero: the button leans toward the cursor (springy, mouse only, skipped for reduced motion); the logo stays still
  (function () {
    const hero = document.querySelector('.hero');
    const cta = hero && hero.querySelector('.hero-cta');
    if (!hero || !cta) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const t = { cx: 0, cy: 0 }, c = { cx: 0, cy: 0 };
    let raf = 0, visible = true;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }).observe(hero);
    hero.addEventListener('mousemove', e => {
      const r = hero.getBoundingClientRect();
      const b = cta.getBoundingClientRect();
      const bx = e.clientX - (b.left + b.width / 2), by = e.clientY - (b.top + b.height / 2);
      const near = Math.hypot(bx, by) < 220;
      t.cx = near ? clamp(bx / 8, -8, 8) : 0; t.cy = near ? clamp(by / 8, -6, 6) : 0;
      kick();
    });
    hero.addEventListener('mouseleave', () => { t.cx = t.cy = 0; kick(); });
    function kick() { if (!raf && visible) raf = requestAnimationFrame(tick); }
    function tick() {
      raf = 0;
      let moving = false;
      for (const k in t) { c[k] += (t[k] - c[k]) * 0.12; if (Math.abs(t[k] - c[k]) > 0.05) moving = true; else c[k] = t[k]; }
      cta.style.transform = `translate3d(${c.cx}px, ${c.cy}px, 0)`;
      if (moving) raf = requestAnimationFrame(tick);
    }
  })();

  // Form validation; every submission is emailed through Web3Forms
  const form = document.getElementById('lead-form');
  const msg = document.getElementById('form-msg');
  // mark a field invalid/valid; an invalid one shakes once (restarted on every failed submit)
  const flag = (field, bad) => {
    field.classList.toggle('invalid', bad);
    field.classList.remove('shake');
    if (bad) { void field.offsetWidth; field.classList.add('shake'); }
  };
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    ['name', 'phone', 'email'].forEach(id => {
      const input = document.getElementById(id);
      const valid = input.value.trim() && input.checkValidity();
      flag(input.closest('.field'), !valid);
      if (!valid) ok = false;
    });
    const equity = form.querySelector('input[name=equity]:checked');
    flag(document.getElementById('equity-field'), !equity);
    if (!equity) ok = false;
    if (!ok) { msg.className = 'msg'; return; }

    const qualified = equity.value === 'yes';
    const done = () => {
      form.querySelectorAll('input, button').forEach(el => el.disabled = true);
      form.querySelector('button[type=submit]').textContent = 'נשלח ✓';
      msg.setAttribute('role', 'status');
      if (qualified) {
        msg.className = 'msg ok';
        msg.textContent = 'תודה! קיבלנו את הפרטים ונחזור אליך בהקדם לתיאום הפגישה.';
      } else {
        msg.className = 'msg no';
        msg.textContent = 'תודה על הכנות. כרגע ההשקעה דורשת הון עצמי של 190,000 ש"ח לפחות – נשמח לעמוד לרשותך בעתיד.';
      }
    };

    // bots fill the hidden field; pretend success and send nothing
    if (document.getElementById('website').value) { done(); return; }

    const submitBtn = form.querySelector('button[type=submit]');
    const label = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'שולח...';
    msg.className = 'msg';

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    fetch('https://api.web3forms.com/submit', {
      signal: ctrl.signal,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        access_key: 'a92ea0ce-382a-41fe-947a-e6b8d09afe20',
        subject: 'פנייה חדשה מאתר קבוצת כפרי נדל״ן – תיאום פגישת ייעוץ',
        from_name: 'אתר קבוצת כפרי נדל״ן',
        'שם מלא': document.getElementById('name').value.trim(),
        'טלפון': document.getElementById('phone').value.trim(),
        'email': document.getElementById('email').value.trim(),
        'הון עצמי פנוי של 190,000 ש"ח ומעלה': qualified ? 'כן' : 'לא'
      })
    })
      .then(res => res.json().then(data => ({ ok: res.ok && data.success === true })))
      .then(({ ok }) => {
        if (!ok) throw new Error('send failed');
        done();
      })
      .catch(() => {
        // network down, server refused, or no answer within 15s: say clearly that nothing was sent, keep the data, allow a retry
        submitBtn.disabled = false;
        submitBtn.textContent = label;
        msg.className = 'msg fail';
        msg.setAttribute('role', 'alert');
        msg.innerHTML = 'ההודעה <b>לא נשלחה</b>. הפרטים שמילאתם נשמרו בטופס, אפשר ללחוץ שוב על השליחה, או לפנות אלינו ישירות ב<a href="https://wa.me/972542653666" target="_blank" rel="noopener">וואטסאפ</a>.';
      })
      .finally(() => clearTimeout(timer));
  });