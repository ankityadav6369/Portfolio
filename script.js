/* ============================================================
   ANKIT YADAV — PERSONAL PORTFOLIO
   File 3 of 3: script.js  (the BEHAVIOUR of the page)

   Contents
   1. Helpers & motion setting (on/off)
   2. Footer year
   3. Navbar: mobile menu, scrolled state, active link
   4. Reveal-on-scroll
   5. Card tilt + spotlight (hover effect)
   6. Background particles (2D canvas)
   7. 3D hero object (Three.js)
   8. Contact buttons (copy email) & back-to-top
   9. Start everything
   ============================================================ */

(() => {
  'use strict'; // helps catch typing mistakes

  /* ---------- 1. HELPERS & MOTION SETTING ---------- */
  const root = document.documentElement;
  root.classList.add('js'); // tells CSS that JavaScript is running

  // Short helpers for finding elements
  const $  = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

  // Read a color from style.css (e.g. "--blue") so you only change colors in one place
  const cssColor = (name, fallback) =>
    getComputedStyle(root).getPropertyValue(name).trim() || fallback;

  // Does the visitor's system ask for reduced motion?
  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  // motionOn = true means animations are allowed. Start from the system preference.
  let motionOn = !reducedQuery.matches;

  // Restore a saved choice (only when the system did not ask for reduced motion)
  try {
    if (!reducedQuery.matches && localStorage.getItem('motion') === 'off') motionOn = false;
  } catch (err) { /* storage can be blocked; ignore */ }

  // Other parts of the script can "subscribe" to be told when motion changes
  const motionListeners = [];
  const onMotionChange = (fn) => motionListeners.push(fn);

  function setMotion(on, save = false) {
    motionOn = on;
    root.dataset.motion = on ? 'full' : 'reduced'; // CSS reads this
    const button = $('#motion-toggle');
    if (button) {
      button.setAttribute('aria-pressed', String(on));
      $('#motion-state').textContent = on ? 'On' : 'Off';
    }
    if (save) {
      try { localStorage.setItem('motion', on ? 'on' : 'off'); } catch (err) { /* ignore */ }
    }
    motionListeners.forEach((fn) => fn(on));
  }

  function initMotionToggle() {
    const button = $('#motion-toggle');
    if (!button) return;
    button.addEventListener('click', () => setMotion(!motionOn, true));
    // If the system setting changes while the page is open, follow it
    reducedQuery.addEventListener('change', (e) => setMotion(!e.matches));
  }


  /* ---------- 2. FOOTER YEAR ---------- */
  function initYear() {
    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();
  }


  /* ---------- 3. NAVBAR ---------- */
  function initNav() {
    const header = $('#site-header');
    const toggle = $('#nav-toggle');
    const links  = $$('.nav__link');
    if (!header || !toggle) return;

    // Open / close the mobile menu
    function setMenu(open) {
      header.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }

    toggle.addEventListener('click', () => {
      setMenu(!header.classList.contains('nav-open'));
    });

    // Close the menu after choosing a link
    links.forEach((link) => link.addEventListener('click', () => setMenu(false)));

    // Close with the Escape key (and return focus to the button)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && header.classList.contains('nav-open')) {
        setMenu(false);
        toggle.focus();
      }
    });

    // Close when clicking outside the header
    document.addEventListener('click', (e) => {
      if (header.classList.contains('nav-open') && !header.contains(e.target)) setMenu(false);
    });

    // If the window becomes wide, make sure the mobile menu is closed
    window.matchMedia('(min-width: 821px)').addEventListener('change', (e) => {
      if (e.matches) setMenu(false);
    });

    // Add a dark glass background once the page is scrolled
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Highlight the link of the section currently on screen
    const sections = links
      .map((link) => $(link.getAttribute('href')))
      .filter(Boolean);

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((link) => {
            const active = link.getAttribute('href') === '#' + entry.target.id;
            link.classList.toggle('is-active', active);
            if (active) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
          });
        });
      }, { rootMargin: '-45% 0px -50% 0px' }); // a thin band in the middle of the screen
      sections.forEach((section) => observer.observe(section));
    }
  }


  /* ---------- 4. REVEAL-ON-SCROLL ---------- */
  function initReveal() {
    const items = $$('.reveal');

    // Stagger children: items inside [data-stagger] appear one after another
    $$('[data-stagger]').forEach((group) => {
      $$('.reveal', group).forEach((el, i) => el.style.setProperty('--delay', i * 90 + 'ms'));
    });

    // Old browsers: just show everything
    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target); // reveal only once
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    items.forEach((el) => observer.observe(el));
  }


  /* ---------- 5. CARD TILT + SPOTLIGHT ---------- */
  function initTilt() {
    $$('.card').forEach((card) => {
      const canTilt = card.classList.contains('tilt');

      card.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch') return; // no hover effects on touch screens
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Spotlight position (always, it is a subtle glow)
        card.style.setProperty('--mx', x + 'px');
        card.style.setProperty('--my', y + 'px');

        // Tilt only when motion is allowed
        if (canTilt && motionOn) {
          const rotateY = ((x / rect.width)  - 0.5) * 10;  // max ±5 degrees
          const rotateX = ((y / rect.height) - 0.5) * -10;
          card.style.setProperty('--rx', rotateX.toFixed(2) + 'deg');
          card.style.setProperty('--ry', rotateY.toFixed(2) + 'deg');
        }
      });

      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }


  /* ---------- 6. BACKGROUND PARTICLES ---------- */
  function initParticles() {
    const canvas = $('#particles');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');

    let width = 0, height = 0, particles = [], rafId = null;
    const colors = [cssColor('--blue', '#2ec5ff'), cssColor('--violet', '#9b5cff')];

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap for performance
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Fewer particles on small screens
      const count = Math.min(70, Math.floor((width * height) / 20000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.4 + 0.4,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        color: colors[Math.random() < 0.5 ? 0 : 1],
        alpha: Math.random() * 0.5 + 0.25,
      }));
      draw(false);
    }

    // Draw all particles. If "move" is true, update their positions first.
    function draw(move) {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        if (move) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0) p.x = width;  if (p.x > width)  p.x = 0;  // wrap around edges
          if (p.y < 0) p.y = height; if (p.y > height) p.y = 0;
        }
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function frame() {
      draw(true);
      rafId = requestAnimationFrame(frame);
    }

    // Start or stop the animation depending on motion setting and tab visibility
    function sync() {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      if (motionOn && !document.hidden) frame();
      else draw(false); // still show a static starfield
    }

    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', sync);
    onMotionChange(sync);
    resize();
    sync();
  }


  /* ---------- 7. 3D HERO OBJECT (THREE.JS) ---------- */
  function initHero() {
    const stage  = $('#hero-stage');
    const canvas = $('#hero-canvas');
    if (!stage || !canvas) return;

    // If the CDN failed or WebGL is missing, show the CSS fallback orb instead
    const useFallback = () => stage.classList.add('is-fallback');
    if (typeof THREE === 'undefined') { useFallback(); return; }

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch (err) { useFallback(); return; }

    const blue   = new THREE.Color(cssColor('--blue', '#2ec5ff'));
    const violet = new THREE.Color(cssColor('--violet', '#9b5cff'));

    // Scene + camera
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 7;

    // Everything lives in one group so we can rotate it together
    const group = new THREE.Group();
    scene.add(group);

    // Outer wireframe sphere (blue)
    const outer = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2, 2),
      new THREE.MeshBasicMaterial({ color: blue, wireframe: true, transparent: true, opacity: 0.55 })
    );
    group.add(outer);

    // Inner wireframe shape (violet), spins the other way
    const inner = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.2, 0),
      new THREE.MeshBasicMaterial({ color: violet, wireframe: true, transparent: true, opacity: 0.9 })
    );
    group.add(inner);

    // Soft glowing core
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 24, 24),
      new THREE.MeshBasicMaterial({ color: violet, transparent: true, opacity: 0.55 })
    );
    group.add(core);

    // Orbit ring
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.8, 0.012, 8, 160),
      new THREE.MeshBasicMaterial({ color: blue, transparent: true, opacity: 0.7 })
    );
    ring.rotation.x = Math.PI / 2.4;
    group.add(ring);

    // Cloud of tiny points around the object
    const pointCount = 350;
    const positions = new Float32Array(pointCount * 3);
    for (let i = 0; i < pointCount; i++) {
      const radius = 3 + Math.random() * 1.6;
      const theta  = Math.random() * Math.PI * 2;
      const phi    = Math.acos(2 * Math.random() - 1);
      positions[i * 3]     = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const points = new THREE.Points(
      pointsGeometry,
      new THREE.PointsMaterial({ color: violet, size: 0.035, transparent: true, opacity: 0.8 })
    );
    group.add(points);

    // Pointer position from -1 to 1 (0 = center of the window)
    const pointer = { x: 0, y: 0 };      // where the pointer is
    const tilt    = { x: 0, y: 0 };      // smoothed value we actually use
    window.addEventListener('pointermove', (e) => {
      pointer.x = (e.clientX / window.innerWidth)  * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    // Keep the canvas sharp and the right size
    function resize() {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      if (!w || !h) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); // cap for performance
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderOnce();
    }
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
    else window.addEventListener('resize', resize);

    // Draw one frame. "dt" is the time since the last frame (seconds).
    function render(dt) {
      if (motionOn) {
        // Smoothly follow the pointer
        tilt.x += (pointer.y * 0.5 - tilt.x) * 0.05;
        tilt.y += (pointer.x * 0.7 - tilt.y) * 0.05;
        group.rotation.x = tilt.x;

        group.rotation.y += dt * 0.25 ;
        inner.rotation.x -= dt * 0.5;
        inner.rotation.y -= dt * 0.35;
        ring.rotation.z  += dt * 0.3;
        points.rotation.y -= dt * 0.05;

        // Gentle "breathing" glow
        core.scale.setScalar(1 + Math.sin(performance.now() * 0.002) * 0.12);
      }
      renderer.render(scene, camera);
    }

    function renderOnce() { render(0); }

    // Run the animation loop only when needed (visible on screen, tab active, motion on)
    let rafId = null;
    let last = performance.now();
    let onScreen = true;

    function tick(now) {
      const dt = Math.min((now - last) / 1000, 0.05); // cap dt so big gaps do not cause jumps
      last = now;
      render(dt);
      rafId = requestAnimationFrame(tick);
    }

    function sync() {
      const shouldRun = motionOn && onScreen && !document.hidden;
      if (shouldRun && !rafId) {
        last = performance.now();
        rafId = requestAnimationFrame(tick);
      } else if (!shouldRun && rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
        renderOnce(); // leave a still frame on screen
      }
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        onScreen = entries[0].isIntersecting;
        sync();
      }).observe(stage);
    }
    document.addEventListener('visibilitychange', sync);
    onMotionChange(sync);

    resize();
    sync();
  }


  /* ---------- 8. CONTACT BUTTONS & BACK-TO-TOP ---------- */
  function initContact() {
    const button = $('#copy-email');
    const status = $('#copy-status');
    if (!button || !status) return;

    let timer = null;
    const say = (message) => {
      status.textContent = message;
      clearTimeout(timer);
      timer = setTimeout(() => { status.textContent = ''; }, 3000);
    };

    button.addEventListener('click', async () => {
      const email = button.dataset.email;
      try {
        await navigator.clipboard.writeText(email);
        say('Email address copied!');
      } catch (err) {
        // Older browsers: fall back to a temporary text box
        try {
          const box = document.createElement('textarea');
          box.value = email;
          box.setAttribute('readonly', '');
          box.style.position = 'fixed';
          box.style.opacity = '0';
          document.body.appendChild(box);
          box.select();
          const ok = document.execCommand('copy');
          document.body.removeChild(box);
          say(ok ? 'Email address copied!' : 'Could not copy. Please select the address manually.');
        } catch (err2) {
          say('Could not copy. Please select the address manually.');
        }
      }
    });
  }

  function initBackToTop() {
    const button = $('#back-to-top');
    if (!button) return;
    button.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: motionOn ? 'smooth' : 'auto' });
      const brand = $('.brand');
      if (brand) brand.focus({ preventScroll: true }); // keep keyboard users oriented
    });
  }


  /* ---------- 9. START EVERYTHING ---------- */
  // The script tag is at the end of <body>, so the page elements already exist.
  setMotion(motionOn);   // apply the starting motion setting
  initMotionToggle();
  initYear();
  initNav();
  initReveal();
  initTilt();
  initParticles();
  initHero();
  initContact();
  initBackToTop();
})();
