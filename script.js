(() => {
  const root = document.documentElement;

  // Theme (saved -> system -> default)
  const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
  const saved = localStorage.getItem("theme");
  root.dataset.theme = (saved === "light" || saved === "dark") ? saved : (prefersLight ? "light" : "dark");

  const themeBtn = document.querySelector("[data-theme-toggle]");
  const themeLabel = document.querySelector("[data-theme-label]");
  const themeIcon = document.querySelector("[data-theme-icon]");

  const syncSkillBadges = () => {
    const isDark = root.dataset.theme === "dark";

    document.querySelectorAll(".badge").forEach((badge) => {
      if (!badge.dataset.originalRating) {
        badge.dataset.originalRating = badge.textContent.trim();
      }

      const original = badge.dataset.originalRating;

      badge.textContent = isDark
        ? original
            .replaceAll("⚫", "__FULL__")
            .replaceAll("⚪", "⚫")
            .replaceAll("__FULL__", "⚪")
        : original;
    });
  };

  const syncThemeUI = () => {
    const t = root.dataset.theme === "light" ? "light" : "dark";
    const next = t === "light" ? "dark" : "light";

    if (themeLabel) themeLabel.textContent = t === "light" ? "Light" : "Dark";
    if (themeIcon) themeIcon.textContent = t === "light" ? "☀" : "☾";

    if (themeBtn) {
      themeBtn.setAttribute("aria-pressed", String(t === "light"));
      themeBtn.setAttribute("title", `Switch to ${next === "light" ? "Light" : "Dark"} mode`);
      themeBtn.setAttribute("aria-label", `Switch to ${next === "light" ? "Light" : "Dark"} mode`);
    }

    syncSkillBadges();
  };

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      root.dataset.theme = (root.dataset.theme === "light") ? "dark" : "light";
      localStorage.setItem("theme", root.dataset.theme);
      syncThemeUI();
    });
  }
  syncThemeUI();

  // Topbar offset for fixed header (prevents content overlap + correct anchor positioning)
  const setTopbarOffset = () => {
    const tb = document.querySelector(".topbar");
    if (!tb) return;
    const h = Math.ceil(tb.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--topbar-offset", `${h}px`);
  };
  setTopbarOffset();
  window.addEventListener("resize", setTopbarOffset);
  window.requestAnimationFrame(setTopbarOffset);

  // Mobile menu (drawer)
  const menu = document.querySelector("[data-mobile-menu]");
  const openBtn = document.querySelector("[data-mobile-menu-toggle]");
  const closeBtns = Array.from(document.querySelectorAll("[data-mobile-menu-close]"));

  const openMenu = () => {
    if (!menu || !openBtn) return;
    menu.hidden = false;
    openBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    const firstLink = menu.querySelector(".drawer-nav a");
    if (firstLink) firstLink.focus();
  };

  const closeMenu = () => {
    if (!menu || !openBtn) return;
    menu.hidden = true;
    openBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    openBtn.focus();
  };

  if (openBtn && menu) {
    openBtn.addEventListener("click", () => (menu.hidden ? openMenu() : closeMenu()));
  }
  closeBtns.forEach(btn => btn.addEventListener("click", closeMenu));
  if (menu) {
    menu.addEventListener("click", (e) => {
      const link = e.target.closest("a[href^='#']");
      const backdrop = e.target.closest("[data-mobile-menu-close]");
      if (link || backdrop) closeMenu();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu && !menu.hidden) closeMenu();
  });

  // Active nav (desktop)
  const navLinks = Array.from(document.querySelectorAll(".nav a[href^='#']"));
  const sections = navLinks.map(a => document.querySelector(a.getAttribute("href"))).filter(Boolean);

  const setActive = (id) => {
    navLinks.forEach(a => a.removeAttribute("aria-current"));
    const active = navLinks.find(a => a.getAttribute("href") === `#${id}`);
    if (active) active.setAttribute("aria-current", "page");
  };

  if ("IntersectionObserver" in window && sections.length) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: "-40% 0px -55% 0px", threshold: 0.01 });
    sections.forEach(s => obs.observe(s));
  }

  // Reveal
  const revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && revealEls.length) {
    const ro = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          ro.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => ro.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add("is-visible"));
  }

  // Email copy
  const copyBtn = document.querySelector("[data-copy-email]");
  const emailEl = document.querySelector("[data-email]");
  if (copyBtn && emailEl) {
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(emailEl.textContent.trim());
        const prev = copyBtn.textContent;
        copyBtn.textContent = "Copied";
        setTimeout(() => copyBtn.textContent = prev, 1200);
      } catch {
        // no-op
      }
    });
  }
})();


function getCurrentTheme() {
  // Dopasuj do tego, jak realnie zapisujesz theme.
  // Typowo: document.documentElement.dataset.theme = "dark" / "light"
  const t = document.documentElement.getAttribute("data-theme")
      || document.documentElement.dataset.theme
      || document.body.getAttribute("data-theme")
      || document.body.dataset.theme;

  // Fallback: jeśli nie masz atrybutu, bierz z systemu
  if (t === "dark" || t === "light") return t;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyThemedIcons(theme) {
  document.querySelectorAll("img.themed-icon").forEach(img => {
    const lightSrc = img.getAttribute("data-light");
    const darkSrc  = img.getAttribute("data-dark");
    const next = theme === "dark" ? darkSrc : lightSrc;

    if (next && img.getAttribute("src") !== next) {
      img.setAttribute("src", next);
    }
  });
}

// 1) Ustaw przy starcie
applyThemedIcons(getCurrentTheme());

// 2) Ustaw po kliknięciu w toggle (działa bez ingerencji w Twój istniejący kod toggle)
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-theme-toggle]");
  if (!btn) return;

  // Daj Twojemu kodowi przełączyć theme, a potem zaktualizuj ikony
  requestAnimationFrame(() => applyThemedIcons(getCurrentTheme()));
});

// 3) (Opcjonalnie) reakcja na zmianę motywu systemowego, jeśli nie wymuszasz ręcznie
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  applyThemedIcons(getCurrentTheme());
});
