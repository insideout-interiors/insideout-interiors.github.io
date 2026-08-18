/* ========== PRELOADER ========== */
/* Failsafe: if `load` never fires (a stalled image, a blocked font), the page
   must not stay scroll-locked forever. */
document.body.style.overflow = "hidden";

let preloaderDismissed = false;
function dismissPreloader() {
  if (preloaderDismissed) return;
  preloaderDismissed = true;
  const p = document.getElementById("preloader");
  if (p) p.classList.add("done");
  document.body.style.overflow = "auto";
}
window.addEventListener("load", () => setTimeout(dismissPreloader, 2200));
setTimeout(dismissPreloader, 6000);

/* ========== CUSTOM CURSOR ==========
   Touch/coarse-pointer devices never fire mousemove, so the rAF loop below
   would otherwise spin forever doing pointless work on every mobile visit. */
const cursor = document.getElementById("cursor");
const hasFinePointer = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
if (cursor && hasFinePointer) {
  let cursorX = 0, cursorY = 0, curX = 0, curY = 0;
  document.addEventListener("mousemove", e => { cursorX = e.clientX; cursorY = e.clientY; });
  function animateCursor() {
    curX += (cursorX - curX) * 0.15;
    curY += (cursorY - curY) * 0.15;
    cursor.style.left = curX + "px";
    cursor.style.top = curY + "px";
    requestAnimationFrame(animateCursor);
  }
  animateCursor();
  /* delegated so it also covers cards injected later */
  const HOVER_TARGETS = "a, button, .project, .viz-item, input, textarea";
  document.addEventListener("mouseover", e => {
    if (e.target.closest(HOVER_TARGETS)) cursor.classList.add("hover");
  });
  document.addEventListener("mouseout", e => {
    if (e.target.closest(HOVER_TARGETS)) cursor.classList.remove("hover");
  });
}

/* ========== HEADER SCROLL + HERO PARALLAX ==========
   One rAF-throttled listener drives both, instead of two unthrottled ones. */
const header = document.getElementById("header");
const heroImg = document.querySelector(".hero-photo img");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let scrollQueued = false;

function onScrollFrame() {
  scrollQueued = false;
  const st = window.pageYOffset;
  if (header) header.classList.toggle("scrolled", st > 80);
  if (heroImg && !reduceMotion && st < window.innerHeight) {
    heroImg.style.transform = `translateY(${st * 0.15}px) scale(1.05)`;
  }
}
window.addEventListener("scroll", () => {
  if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(onScrollFrame); }
}, { passive: true });

/* ========== SCROLL LOCK ==========
   `overflow:hidden` on body alone doesn't stop touch-scrolling the page
   behind a fixed overlay on iOS Safari, so pin it in place instead. Nested
   so the menu and lightbox can each lock/unlock without fighting each other. */
let scrollLockCount = 0;
let lockedScrollY = 0;
function lockScroll() {
  if (scrollLockCount++ === 0) {
    lockedScrollY = window.scrollY;
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.classList.add("scroll-locked");
  }
}
function unlockScroll() {
  if (scrollLockCount > 0 && --scrollLockCount === 0) {
    document.body.classList.remove("scroll-locked");
    document.body.style.top = "";
    window.scrollTo(0, lockedScrollY);
  }
}

/* ========== MOBILE MENU ========== */
const menuBtn = document.getElementById("menuBtn");
const mainNav = document.getElementById("mainNav");
menuBtn.addEventListener("click", () => {
  const open = mainNav.classList.toggle("open");
  menuBtn.textContent = open ? "✕" : "☰";
  menuBtn.setAttribute("aria-expanded", String(open));
  if (open) lockScroll(); else unlockScroll();
});
mainNav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
  if (mainNav.classList.contains("open")) unlockScroll();
  mainNav.classList.remove("open");
  menuBtn.textContent = "☰";
  menuBtn.setAttribute("aria-expanded", "false");
}));

/* ========== GALLERIES ========== */
const grid = document.querySelector("#projects");
const vizContainer = document.querySelector("#visualizations");
const lb = document.querySelector("#lightbox");
const img = document.querySelector("#lb");
const cap = document.querySelector("#cap");

/* lightbox state: which set is open, which item, which image */
let activeSet = projects, pi = 0, ii = 0;

if (grid) {
  grid.innerHTML = projects.map((p, i) => `
    <article class="project reveal reveal-delay-${(i % 4) + 1}" data-i="${i}"
             tabindex="0" role="button" aria-label="Open ${p.title} gallery">
      <div class="project-img">
        <img src="${p.cover}" alt="${p.title}" loading="lazy" decoding="async">
      </div>
      <div class="project-info">
        <h3>${p.title}</h3>
        <small>${p.category}</small>
        <small>${p.location}</small>
      </div>
    </article>
  `).join("");
  bindOpen(".project", projects);
}

if (vizContainer) {
  vizContainer.innerHTML = renders.map((r, i) => `
    <article class="viz-item reveal reveal-delay-${(i % 4) + 1}" data-i="${i}"
             tabindex="0" role="button" aria-label="View render: ${r.title}">
      <img src="${r.cover}" alt="${r.title}" loading="lazy" decoding="async">
      <span class="viz-index">${String(i + 1).padStart(2, "0")}</span>
      <span class="viz-open" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
        </svg>
      </span>
      <div class="viz-caption">
        <h4>${r.title}</h4>
        <p>${r.category}</p>
      </div>
    </article>
  `).join("");
  bindOpen(".viz-item", renders);
}

/* ========== LIGHTBOX ========== */
let lastFocused = null;

function bindOpen(selector, set) {
  document.querySelectorAll(selector).forEach(el => {
    const open = () => {
      lastFocused = el;
      activeSet = set;
      pi = +el.dataset.i;
      ii = 0;
      show();
      lb.classList.add("open");
      lb.setAttribute("aria-hidden", "false");
      lockScroll();
      document.querySelector("#close").focus();
    };
    el.addEventListener("click", open);
    el.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
  });
}

function show() {
  const item = activeSet[pi];
  const multi = item.images.length > 1;
  img.src = item.images[ii];
  img.alt = item.title;
  cap.textContent = multi
    ? `${item.title} · ${ii + 1} / ${item.images.length}`
    : item.title;
  /* single-image entries have nothing to page through */
  document.querySelector("#prev").style.display = multi ? "" : "none";
  document.querySelector("#next").style.display = multi ? "" : "none";
}

function step(dir) {
  const n = activeSet[pi].images.length;
  ii = (ii + dir + n) % n;
  show();
}

function closeLightbox() {
  lb.classList.remove("open");
  lb.setAttribute("aria-hidden", "true");
  unlockScroll();
  if (lastFocused) { lastFocused.focus(); lastFocused = null; }
}

document.querySelector("#next").addEventListener("click", () => step(1));
document.querySelector("#prev").addEventListener("click", () => step(-1));
document.querySelector("#close").addEventListener("click", closeLightbox);
lb.addEventListener("click", e => { if (e.target === lb) closeLightbox(); });

/* swipe left/right to page through images on touch devices */
let touchStartX = 0, touchStartY = 0;
lb.addEventListener("touchstart", e => {
  touchStartX = e.changedTouches[0].clientX;
  touchStartY = e.changedTouches[0].clientY;
}, { passive: true });
lb.addEventListener("touchend", e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  const SWIPE_THRESHOLD = 40;
  /* ignore mostly-vertical drags so scrolling/dismiss gestures still work */
  if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
    step(dx < 0 ? 1 : -1);
  }
}, { passive: true });

document.addEventListener("keydown", e => {
  if (!lb.classList.contains("open")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowRight") step(1);
  if (e.key === "ArrowLeft") step(-1);
});

/* ========== SCROLL REVEAL ========== */
const reveals = document.querySelectorAll(".reveal");
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
reveals.forEach(el => revealObserver.observe(el));

/* ========== SIDE DOT NAV ========== */
const sideNavLinks = document.querySelectorAll(".side-nav a");
const sections = ["home", "work", "services", "renders", "studio", "contact"];
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      sideNavLinks.forEach(l => l.classList.remove("active"));
      const idx = sections.indexOf(entry.target.id);
      if (idx !== -1 && sideNavLinks[idx]) sideNavLinks[idx].classList.add("active");
    }
  });
}, { threshold: 0.3 });
sections.forEach(id => {
  const el = document.getElementById(id);
  if (el) sectionObserver.observe(el);
});

/* ========== SMOOTH ANCHOR SCROLL ========== */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    const href = this.getAttribute("href");
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }
  });
});
