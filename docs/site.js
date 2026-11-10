// Brisk website: the wind field, the demo window, and reveals as sections come into view.
// Every piece checks for its elements, so one file serves both pages.
(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const fmt = (n) => Math.round(n).toLocaleString("en-US");

  /** Runs `fn` once, the first time `el` is at least `ratio` visible. */
  function onSeen(el, fn, ratio = 0.35) {
    if (!el) return;
    if (!("IntersectionObserver" in window)) return fn();
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        fn();
      }
    }, { threshold: ratio });
    io.observe(el);
  }

  /** Counts `el`'s number from `from` to `to` over `ms`, easing out. */
  function countTo(el, from, to, ms, done) {
    if (reduced) {
      el.textContent = fmt(to);
      return done?.();
    }
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms);
      el.textContent = fmt(from + (to - from) * (1 - (1 - k) ** 3));
      if (k < 1) requestAnimationFrame(step);
      else done?.();
    };
    requestAnimationFrame(step);
  }

  // --- header frosts once the page scrolls under it ---------------------------------
  const head = $(".site-head");
  if (head) {
    const sync = () => head.classList.toggle("is-scrolled", scrollY > 8);
    addEventListener("scroll", sync, { passive: true });
    sync();
  }

  // --- mobile menu ---------------------------------------------------------------------
  const menuBtn = $(".menu-btn");
  const nav = $("#site-nav");
  if (menuBtn && nav) {
    const setOpen = (open) => {
      menuBtn.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
    };
    menuBtn.addEventListener("click", () => setOpen(menuBtn.getAttribute("aria-expanded") !== "true"));
    nav.addEventListener("click", (e) => e.target.closest("a") && setOpen(false));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        menuBtn.focus();
      }
    });
    document.addEventListener("click", (e) => {
      if (!nav.contains(e.target) && !menuBtn.contains(e.target)) setOpen(false);
    });
  }

  // --- features page: the section you're reading is marked in the jump bar ------------
  const jumps = $$(".jump a");
  if (jumps.length && "IntersectionObserver" in window) {
    const byId = new Map(jumps.map((a) => [a.hash.slice(1), a]));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          jumps.forEach((a) => a.classList.toggle("is-here", a === byId.get(e.target.id)));
          // Keep the marked chip in view inside the bar, without scrolling the page.
          const a = byId.get(e.target.id);
          const bar = a?.closest("ul");
          bar?.scrollTo({ left: a.offsetLeft - bar.clientWidth / 2 + a.offsetWidth / 2, behavior: reduced ? "auto" : "smooth" });
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    byId.forEach((_, id) => {
      const sec = document.getElementById(id);
      if (sec) io.observe(sec);
    });
  }

  // --- the wind field: streaks drift rightward on a slow flow, the pointer gusts them --
  const canvas = $(".wind-field");
  if (canvas && !reduced && canvas.getContext) {
    const ctx = canvas.getContext("2d");
    const hero = canvas.parentElement;
    let w = 0, h = 0, dpr = 1, parts = [], running = false, raf = 0;
    const pointer = { x: -1e4, y: -1e4, vx: 0, vy: 0, t: 0 };

    const spawn = (p, anywhere) => {
      p.x = anywhere ? Math.random() * w : -20 - Math.random() * 80;
      p.y = Math.random() * h;
      p.vx = 0;
      p.vy = 0;
      p.speed = 0.6 + Math.random() * 1.1;
      p.life = 200 + Math.random() * 400;
      return p;
    };
    const resize = () => {
      dpr = Math.min(2, devicePixelRatio || 1);
      w = hero.clientWidth;
      h = hero.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(220, Math.round((w * h) / 7000));
      parts = Array.from({ length: n }, () => spawn({}, true));
    };
    const frame = (now) => {
      const t = now * 0.001;
      // Fade the last frames so each streak leaves a short trail.
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.09)";
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
      ctx.lineCap = "round";
      ctx.lineWidth = 1.3;
      ctx.strokeStyle = "rgba(47,111,237,0.32)";
      ctx.beginPath();
      const decay = Math.max(0, 1 - (now - pointer.t) / 400);
      for (const p of parts) {
        const angle = Math.sin(p.y * 0.006 + t * 0.4) * 0.35 + Math.cos(p.x * 0.004 - t * 0.25) * 0.25;
        let ax = Math.cos(angle) * p.speed;
        let ay = Math.sin(angle) * p.speed * 0.6;
        // A gust where the pointer moves, fading with distance and since it last moved.
        const dx = p.x - pointer.x, dy = p.y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (decay > 0 && d2 < 160 * 160) {
          const f = (1 - Math.sqrt(d2) / 160) * decay;
          ax += pointer.vx * f * 0.35;
          ay += pointer.vy * f * 0.35;
        }
        p.vx += (ax - p.vx) * 0.12;
        p.vy += (ay - p.vy) * 0.12;
        const x0 = p.x, y0 = p.y;
        p.x += p.vx * 1.6;
        p.y += p.vy * 1.6;
        ctx.moveTo(x0, y0);
        ctx.lineTo(p.x, p.y);
        if (--p.life < 0 || p.x > w + 20 || p.y < -20 || p.y > h + 20 || p.x < -120) spawn(p, false);
      }
      ctx.stroke();
      raf = running ? requestAnimationFrame(frame) : 0;
    };
    const setRunning = (on) => {
      on = on && document.visibilityState === "visible";
      if (on === running) return;
      running = on;
      if (on && !raf) raf = requestAnimationFrame(frame);
    };

    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (pointer.t) {
        pointer.vx = Math.max(-30, Math.min(30, x - pointer.x));
        pointer.vy = Math.max(-30, Math.min(30, y - pointer.y));
      }
      pointer.x = x;
      pointer.y = y;
      pointer.t = performance.now();
    });
    hero.addEventListener("pointerleave", () => (pointer.t = 0));
    addEventListener("resize", resize);
    resize();
    document.documentElement.classList.add("has-wind");
    let visible = true;
    new IntersectionObserver(([e]) => setRunning((visible = e.isIntersecting))).observe(hero);
    document.addEventListener("visibilitychange", () => setRunning(visible));
    setRunning(true);
  }

  // --- the demo window: a page loading with ad blocking on or off -----------------------
  // Load times are Brisk's measured medians (speed.html): 943 ms on, 1,383 ms off.
  const demo = $("#demo");
  if (demo) {
    const toggle = $("#demo-toggle");
    const progress = $("#demo-progress");
    const count = $("#demo-count");
    const shield = $(".demo-shield", demo);
    const time = $("#demo-time");
    const skeleton = $$(".sk, .sk-img", demo);
    const ads = $$("[data-ad]", demo);
    let timers = [];
    const at = (ms, fn) => timers.push(setTimeout(fn, reduced ? 0 : ms));

    const run = () => {
      timers.forEach(clearTimeout);
      timers = [];
      const on = toggle.checked;
      const total = on ? 943 : 1383;
      demo.dataset.adblock = on ? "on" : "off";
      let blocked = 0;
      count.textContent = "0";
      time.textContent = "Loading…";
      skeleton.forEach((el) => el.classList.remove("is-shown"));
      ads.forEach((el) => {
        el.classList.remove("is-loaded", "is-blocked");
        el.textContent = "Ad";
      });

      // The progress bar runs for exactly the load time.
      progress.style.transition = "none";
      progress.style.width = "0";
      progress.style.opacity = "1";
      void progress.offsetWidth;
      progress.style.transition = reduced ? "none" : `width ${total}ms cubic-bezier(.3,.1,.3,1)`;
      progress.style.width = "100%";

      skeleton.forEach((el, i) => at((total * 0.85 * (i + 1)) / skeleton.length, () => el.classList.add("is-shown")));
      ads.forEach((el, i) => {
        if (on) {
          // Blocked as the request goes out: early, and the page never jumps.
          at(total * (0.15 + i * 0.18), () => {
            el.classList.add("is-blocked");
            el.textContent = "Blocked";
            blocked += 2 + i; // an ad slot usually pulls in more than one request
            count.textContent = String(blocked);
            shield.classList.remove("bump");
            void shield.offsetWidth;
            shield.classList.add("bump");
          });
        } else {
          // Ads arrive late and push the article around.
          at(total * (0.55 + i * 0.15), () => el.classList.add("is-loaded"));
        }
      });
      at(total, () => {
        progress.style.opacity = "0";
        time.innerHTML = on
          ? `Loaded in <b>${fmt(total)} ms</b>, ${blocked} blocked`
          : `Loaded in <b>${fmt(total)} ms</b>`;
      });
    };

    toggle.addEventListener("change", run);
    // Clicking the page reloads it, like pressing refresh.
    $(".demo-page", demo).addEventListener("click", run);
    onSeen(demo, run, 0.5);
  }

  // --- sleeping tabs fall asleep one by one; memory counts down -------------------------
  const sleepy = $("#sleepy");
  if (sleepy) {
    const naps = $$(".naps i", sleepy).slice(1); // the first is the tab you're looking at
    const mb = $("#sleepy-mb");
    mb.textContent = "1,921";
    onSeen(sleepy, () => {
      naps.forEach((n, i) => setTimeout(() => n.classList.add("is-asleep"), reduced ? 0 : 300 + i * 160));
      setTimeout(() => countTo(mb, 1921, 375, 160 * naps.length + 200), reduced ? 0 : 300);
    }, 0.6);
  }

  // --- numbers that count up, the drawn mark, chart bars ----------------------------------
  $$("[data-count]").forEach((el) => {
    const to = Number(el.dataset.count);
    el.textContent = "0";
    onSeen(el, () => countTo(el, 0, to, 900), 0.8);
  });
  const study = $(".mark-study");
  onSeen(study, () => study.classList.add("is-drawing"), 0.5);
  $$(".chart").forEach((chart) => onSeen(chart, () => chart.classList.add("is-seen"), 0.4));

  // --- the home headline rises word by word (motion.css .w) -------------------------------
  const h1 = $(".hero h1");
  if (h1 && !reduced) {
    const words = h1.textContent.trim().split(/\s+/);
    h1.setAttribute("aria-label", h1.textContent.trim());
    h1.replaceChildren(
      ...words.flatMap((word, i) => {
        const outer = document.createElement("span");
        outer.className = "w";
        outer.setAttribute("aria-hidden", "true");
        const inner = document.createElement("span");
        inner.textContent = word;
        inner.style.setProperty("--i", String(i));
        outer.append(inner);
        return i < words.length - 1 ? [outer, document.createTextNode(" ")] : [outer];
      }),
    );
  }

  // --- the demo window leans toward the pointer --------------------------------------------
  const win = $(".demo-win");
  const heroEl = $(".hero");
  if (win && heroEl && !reduced && matchMedia("(hover: hover) and (min-width: 901px)").matches) {
    heroEl.addEventListener("pointermove", (e) => {
      const r = win.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) / innerWidth;
      const y = (e.clientY - (r.top + r.height / 2)) / innerHeight;
      win.style.setProperty("--ry", `${(-6 + x * 14).toFixed(2)}deg`);
      win.style.setProperty("--rx", `${(2 - y * 10).toFixed(2)}deg`);
    });
    heroEl.addEventListener("pointerleave", () => {
      win.style.removeProperty("--ry");
      win.style.removeProperty("--rx");
    });
  }

  // --- things gust into view, staggered within their group ---------------------------------
  if (!reduced && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    const heads = $$("main section h2, .page-head h1").filter((h) => !h.classList.contains("sr"));
    heads.forEach((h) => {
      h.classList.add("rv-head");
      io.observe(h);
    });
    const groups = [
      ".pillars > li",
      ".also > li",
      ".details > div",
      ".tenets > li",
      ".stack > div",
      ".steps > li",
      ".facts > li",
      ".reqs > li",
      ".faq > details",
      ".changes > li",
      ".logo-tiles > div",
      ".swatches > li",
      ".feature-head",
      ".chart",
      ".long-read > p",
      ".release-meta",
    ];
    for (const sel of groups) {
      // Stagger counts restart in each parent, so every list cascades on its own.
      const counts = new Map();
      $$(sel).forEach((el) => {
        const n = counts.get(el.parentElement) ?? 0;
        counts.set(el.parentElement, n + 1);
        el.style.setProperty("--d", String(Math.min(n, 8)));
        el.classList.add("rv");
        io.observe(el);
      });
    }
  }

  // --- scroll-linked: reading progress, the wind tunnel, the changelog rail -----------------
  const bar = document.createElement("div");
  bar.className = "progress-bar";
  bar.setAttribute("aria-hidden", "true");
  document.body.prepend(bar);
  const rows = $$(".tunnel-row");
  const rail = $(".release-rail-fill");
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    if (!reduced) {
      for (const row of rows) {
        const r = row.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) continue;
        const k = (innerHeight - r.top) / (innerHeight + r.height); // 0 → 1 while it crosses the screen
        const dir = Number(row.dataset.drift);
        row.style.transform = `translateX(${(dir < 0 ? -k : k - 1) * 40}%)`;
      }
    }
    if (rail) {
      const r = rail.parentElement.getBoundingClientRect();
      const k = Math.min(1, Math.max(0, (innerHeight * 0.6 - r.top) / r.height));
      rail.style.setProperty("--fill", reduced ? "1" : k.toFixed(3));
    }
  };
  addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true },
  );
  addEventListener("resize", onScroll);
  onScroll();
})();
