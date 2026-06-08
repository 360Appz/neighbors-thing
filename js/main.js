(function () {
  "use strict";

  /* ---------------------------------------------------------
     Seeded RNG — so "shuffle every hour / every day" is
     deterministic for everyone looking at the same moment,
     yet still feels alive because it changes over time.
  --------------------------------------------------------- */
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function seedFromString(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) { h = Math.imul(31, h) + str.charCodeAt(i) | 0; }
    return h;
  }
  function dayKey(d) { return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; }
  function hourKey(d) { return `${dayKey(d)}-${d.getHours()}`; }
  function shuffled(arr, rng) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function pick(arr, key) {
    const rng = mulberry32(seedFromString(key));
    return arr[Math.floor(rng() * arr.length)];
  }

  /* ---------------------------------------------------------
     Toast
  --------------------------------------------------------- */
  const toastEl = document.getElementById("toast");
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
  }

  /* ---------------------------------------------------------
     Sound toggle
  --------------------------------------------------------- */
  const soundBtn = document.getElementById("soundToggle");
  function syncSoundLabel() {
    soundBtn.textContent = SFX.isEnabled() ? "🔊 Sound on" : "🔇 Sound off";
  }
  syncSoundLabel();
  soundBtn.addEventListener("click", () => {
    const on = SFX.toggle();
    syncSoundLabel();
    toast(on ? "Sound effects enabled — let's gooo 🔊" : "Sound effects muted 🔇");
  });

  /* generic hover/click sfx for interactive elements */
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest(".btn, .nav__link, .filecard, .carousel__btn, .opt, .nav__cta")) SFX.hover();
  });
  document.addEventListener("click", (e) => {
    if (e.target.closest(".btn, .nav__link, .nav__cta, .carousel__btn")) SFX.click();
  });

  /* ---------------------------------------------------------
     Mobile drawer
  --------------------------------------------------------- */
  const burger = document.getElementById("burger");
  const drawer = document.getElementById("drawer");
  const drawerOverlay = document.getElementById("drawerOverlay");
  function setDrawer(open) {
    drawer.classList.toggle("open", open);
    drawerOverlay.classList.toggle("open", open);
    document.body.style.overflow = open ? "hidden" : "";
  }
  burger.addEventListener("click", () => { SFX.click(); setDrawer(!drawer.classList.contains("open")); });
  drawerOverlay.addEventListener("click", () => setDrawer(false));
  drawer.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setDrawer(false)));

  /* ---------------------------------------------------------
     Reveal on scroll
  --------------------------------------------------------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add("in"); });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  /* ---------------------------------------------------------
     Hero parallax tilt (spatial 3D feel)
  --------------------------------------------------------- */
  const hero = document.querySelector(".hero");
  const heroH1 = document.querySelector(".hero h1");
  if (hero && heroH1 && matchMedia("(pointer:fine)").matches) {
    hero.addEventListener("mousemove", (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      heroH1.style.transform = `rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 10).toFixed(2)}deg)`;
      hero.querySelectorAll(".hero__orb").forEach((orb, i) => {
        const depth = (i + 1) * 14;
        orb.style.transform = `translate3d(${x * depth}px, ${y * depth}px, 0)`;
      });
    });
    hero.addEventListener("mouseleave", () => { heroH1.style.transform = ""; });
  }

  /* ---------------------------------------------------------
     MODALS — render full dossier word-for-word
  --------------------------------------------------------- */
  const overlay = document.getElementById("modalOverlay");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");
  const modalClose = document.getElementById("modalClose");

  const FILES = {
    1: { title: "File 01 — MY vs SG: The Honest Citizen Comparison", content: window.CONTENT_1 },
    2: { title: "File 02 — Are MY & SG Doing Well in ASEAN?", content: window.CONTENT_2 },
    3: { title: "File 03 — MY & SG on the Global Stage", content: window.CONTENT_3 },
    4: { title: "File 04 — Things to Be Grateful For as a Malaysian", content: window.CONTENT_4 },
    5: { title: "File 05 — Things to Be Grateful For as a Singaporean", content: window.CONTENT_5 }
  };

  function openModal(html, title) {
    modalTitle.textContent = title;
    modalBody.innerHTML = html;
    modalBody.scrollTop = 0;
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
    SFX.open();
  }
  function closeModal() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
    SFX.close();
  }
  modalClose.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  document.querySelectorAll("[data-open-file]").forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.getAttribute("data-open-file");
      const f = FILES[id];
      openModal(renderMarkdown(f.content), f.title);
    });
  });

  /* generic [data-modal-html] / [data-modal-title] triggers (quotes, questions, etc.) */
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-modal-trigger]");
    if (trigger) {
      const title = trigger.getAttribute("data-modal-title") || "Details";
      const body = trigger.getAttribute("data-modal-body") || "";
      openModal(`<p>${body}</p>`, title);
    }
  });

  /* ---------------------------------------------------------
     CAROUSEL helper — single-row, one item per view, no dots
  --------------------------------------------------------- */
  function wireCarousel(root) {
    const viewport = root.querySelector(".carousel__viewport");
    const prev = root.querySelector("[data-prev]");
    const next = root.querySelector("[data-next]");
    const counter = root.querySelector("[data-counter]");
    const slides = [...viewport.children];
    let idx = 0;
    function update() {
      const slideW = viewport.clientWidth;
      viewport.scrollTo({ left: idx * slideW, behavior: "smooth" });
      counter.textContent = `${String(idx + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    }
    prev.addEventListener("click", () => { idx = (idx - 1 + slides.length) % slides.length; update(); SFX.swoosh(); });
    next.addEventListener("click", () => { idx = (idx + 1) % slides.length; update(); SFX.swoosh(); });
    let resizeTimer;
    window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(update, 150); });
    viewport.addEventListener("scroll", () => {
      clearTimeout(viewport._t);
      viewport._t = setTimeout(() => {
        idx = Math.round(viewport.scrollLeft / viewport.clientWidth);
        counter.textContent = `${String(idx + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
      }, 80);
    });
    update();
  }
  document.querySelectorAll(".carousel").forEach(wireCarousel);

  /* ---------------------------------------------------------
     QUOTE OF THE DAY — re-shuffles every hour (seeded)
  --------------------------------------------------------- */
  const quoteText = document.getElementById("quoteText");
  const quoteSrc = document.getElementById("quoteSrc");
  const quoteMeta = document.getElementById("quoteMeta");
  const quoteShuffleBtn = document.getElementById("quoteShuffle");
  let quoteOrder = [];
  let quoteCursor = 0;

  function buildHourlyOrder() {
    const now = new Date();
    const rng = mulberry32(seedFromString("quote-" + hourKey(now)));
    quoteOrder = shuffled(window.QUOTES.map((_, i) => i), rng);
    quoteCursor = 0;
    quoteMeta.textContent = `Refreshed hourly · ${now.getHours()}:00 deck`;
  }
  function showQuote(animate) {
    const q = window.QUOTES[quoteOrder[quoteCursor % quoteOrder.length]];
    quoteText.textContent = `“${q.text}”`;
    quoteSrc.textContent = `— ${q.src}`;
    if (animate) {
      const stage = document.getElementById("quoteStage");
      stage.classList.remove("quote-fade");
      void stage.offsetWidth;
      stage.classList.add("quote-fade");
    }
  }
  buildHourlyOrder();
  showQuote(false);
  quoteShuffleBtn.addEventListener("click", () => {
    SFX.shuffle();
    quoteCursor++;
    if (quoteCursor % quoteOrder.length === 0) {
      // reshuffle into a brand-new order for an "infinite remix" feel
      const rng = mulberry32(Date.now() & 0xffffffff);
      quoteOrder = shuffled(quoteOrder, rng);
    }
    showQuote(true);
    toast("Quote remixed ✨ — new vibe loaded");
  });
  // auto-refresh check every minute in case the hour rolls over while open
  setInterval(() => {
    const now = new Date();
    if (quoteMeta.textContent.indexOf(`${now.getHours()}:00`) === -1) {
      buildHourlyOrder();
      showQuote(true);
    }
  }, 60000);

  /* ---------------------------------------------------------
     QUESTION OF THE DAY — changes daily (seeded by date)
  --------------------------------------------------------- */
  const qotdText = document.getElementById("qotdText");
  const qotdMeta = document.getElementById("qotdMeta");
  const qotdShuffle = document.getElementById("qotdShuffle");
  let qotdIdx = 0;
  function loadQOTD(forceRandom) {
    const now = new Date();
    if (forceRandom) {
      qotdIdx = Math.floor(Math.random() * window.QOTD.length);
    } else {
      const rng = mulberry32(seedFromString("qotd-" + dayKey(now)));
      qotdIdx = Math.floor(rng() * window.QOTD.length);
    }
    qotdText.textContent = window.QOTD[qotdIdx];
    qotdMeta.textContent = forceRandom
      ? "Bonus prompt — shuffled just for you"
      : `Today's prompt · ${now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}`;
  }
  loadQOTD(false);
  qotdShuffle.addEventListener("click", () => {
    SFX.shuffle();
    loadQOTD(true);
    toast("New question of the moment loaded 🎲");
  });
  document.getElementById("qotdDiscuss").addEventListener("click", () => {
    openModal(`<p style="font-size:1.2rem;font-weight:700;line-height:1.5">${qotdText.textContent}</p>
      <p>Sit with it for a minute. There's no leaderboard for this one — it's a mirror, drawn straight from the MY × SG dossier. Talk it over with a friend who lives on the "other side" of the Causeway. 🌉</p>`, "Let's discuss this one");
  });

  /* ---------------------------------------------------------
     RAPID FIRE DECK — shuffled question order, scored
  --------------------------------------------------------- */
  const deckEl = document.getElementById("deck");
  const progressEl = document.getElementById("deckProgress");
  const scoreEl = document.getElementById("deckScore");
  const restartBtn = document.getElementById("deckRestart");

  let order = [];
  let cursor = 0;
  let score = 0;
  let answered = false;

  function newOrder() {
    const now = new Date();
    // mixes a per-hour seed with the question count, so order *and* the practical
    // selection rotates through the day — "intelligence built into shuffling"
    const rng = mulberry32(seedFromString("rapidfire-" + hourKey(now)));
    order = shuffled(window.RAPID_FIRE.map((_, i) => i), rng);
    cursor = 0; score = 0; answered = false;
  }

  function renderCard() {
    deckEl.innerHTML = "";
    if (cursor >= order.length) {
      const card = document.createElement("div");
      card.className = "flashcard quote-fade";
      card.innerHTML = `
        <div class="flashcard__kicker"><span>Round complete</span><span>🎉</span></div>
        <div class="flashcard__q">You scored ${score} / ${order.length} on this hour's deck.</div>
        <p style="color:var(--ink-soft);line-height:1.6">${score === order.length
          ? "Flawless. You clearly read the dossier word-for-word. 🏆"
          : score >= order.length * 0.6
          ? "Sharp instincts — a few facts slipped through. Replay for a fresh shuffled order."
          : "The dossier has receipts on all of these — pop into the File cards above and replay!"}</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:6px">
          <button class="btn btn--pop" id="deckPlayAgain">Shuffle a new round</button>
        </div>`;
      deckEl.appendChild(card);
      progressEl.textContent = `Done · ${order.length}/${order.length}`;
      document.getElementById("deckPlayAgain").addEventListener("click", () => {
        SFX.win(); fireConfetti(); newOrder(); renderCard();
      });
      if (score === order.length) { SFX.win(); fireConfetti(); }
      return;
    }
    const item = window.RAPID_FIRE[order[cursor]];
    answered = false;
    const card = document.createElement("div");
    card.className = "flashcard quote-fade";
    card.innerHTML = `
      <div class="flashcard__kicker"><span>Rapid Fire · Card ${cursor + 1}</span><span>⚡</span></div>
      <div class="flashcard__q">${item.q}</div>
      <div class="flashcard__opts">
        ${item.opts.map((o, i) => `<button class="opt" data-i="${i}"><b>${String.fromCharCode(65 + i)}</b><span>${o}</span></button>`).join("")}
      </div>
      <div class="flashcard__note"></div>
    `;
    deckEl.appendChild(card);
    progressEl.textContent = `Card ${cursor + 1} / ${order.length}`;
    scoreEl.textContent = `Score: ${score}`;

    card.querySelectorAll(".opt").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (answered) return;
        answered = true;
        const chosen = parseInt(btn.getAttribute("data-i"), 10);
        const correct = item.a;
        card.querySelectorAll(".opt").forEach((b, i) => {
          if (i === correct) b.classList.add("correct");
          else if (i === chosen) b.classList.add("wrong");
        });
        const note = card.querySelector(".flashcard__note");
        note.textContent = `${chosen === correct ? "✅ Correct — " : "❌ Not quite — "}${item.note}`;
        note.classList.add("show");
        if (chosen === correct) { score++; SFX.correct(); } else { SFX.wrong(); }
        scoreEl.textContent = `Score: ${score}`;
        setTimeout(() => { cursor++; renderCard(); }, 1450);
      });
    });
  }
  newOrder();
  renderCard();
  restartBtn.addEventListener("click", () => { SFX.shuffle(); newOrder(); renderCard(); toast("Deck reshuffled — fresh order, same brain-bending facts 🔀"); });

  /* ---------------------------------------------------------
     Confetti — light, cheap canvas burst
  --------------------------------------------------------- */
  const confettiCanvas = document.getElementById("confetti");
  const cctx = confettiCanvas.getContext("2d");
  function resizeConfetti() { confettiCanvas.width = innerWidth; confettiCanvas.height = innerHeight; }
  resizeConfetti();
  window.addEventListener("resize", resizeConfetti);
  const colors = ["#ff5b3c", "#ffd23f", "#4d6bff", "#19d3c5", "#ff48b0", "#9a6bff"];
  function fireConfetti() {
    const particles = Array.from({ length: 90 }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * 200,
      y: innerHeight * 0.35,
      vx: (Math.random() - 0.5) * 9,
      vy: Math.random() * -9 - 3,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      life: 0
    }));
    let frame = 0;
    function tick() {
      cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      frame++;
      let alive = false;
      particles.forEach((p) => {
        p.life++;
        p.vy += 0.28;
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        if (p.life < 130) alive = true;
        cctx.save();
        cctx.translate(p.x, p.y);
        cctx.rotate(p.rot);
        cctx.fillStyle = p.color;
        cctx.globalAlpha = Math.max(0, 1 - p.life / 130);
        cctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        cctx.restore();
      });
      if (alive) requestAnimationFrame(tick);
      else cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
    tick();
  }

  /* ---------------------------------------------------------
     Hour-by-hour ambience — subtle theme accent rotation
     "intelligence built into the game logic" beyond just quizzes
  --------------------------------------------------------- */
  const accentSets = [
    ["--my-1", "--sg-1"], ["--pop-1", "--sg-2"], ["--sg-1", "--my-2"], ["--pop-2", "--my-1"]
  ];
  function applyHourlyAccent() {
    const now = new Date();
    const rng = mulberry32(seedFromString("accent-" + hourKey(now)));
    const set = accentSets[Math.floor(rng() * accentSets.length)];
    document.documentElement.style.setProperty("--dyn-a", `var(${set[0]})`);
    document.documentElement.style.setProperty("--dyn-b", `var(${set[1]})`);
    document.querySelectorAll(".hero__kicker .hero__dot").forEach((dot) => {
      dot.style.background = `linear-gradient(135deg, var(${set[0]}), var(${set[1]}))`;
    });
  }
  applyHourlyAccent();
  setInterval(applyHourlyAccent, 5 * 60000);

  /* live clock badge in nav (re-affirms "hour by hour" intelligence) */
  const clockEl = document.getElementById("liveClock");
  function tickClock() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }
  tickClock();
  setInterval(tickClock, 15000);

})();
