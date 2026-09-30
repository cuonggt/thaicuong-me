/*
  thaicuong.me
  Small enhancements on top of a page that works without them: the theme
  toggle, copy buttons, demo playback, and keys that move like omassh.
*/
(() => {
  "use strict";

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
  const scrollBehavior = () => (reduceMotion.matches ? "auto" : "smooth");

  // Storage can be missing or throw (private windows, blocked site data).
  const store = {
    get(key) {
      try { return localStorage.getItem(key); } catch { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch { /* not remembered, still works */ }
    },
  };

  /* Toast --------------------------------------------------------------- */

  const toast = document.getElementById("toast");
  let toastTimer = 0;

  function say(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  /* Theme --------------------------------------------------------------- */

  const themeButton = document.getElementById("theme-btn");
  const themeColors = { light: "#f5f2ea", dark: "#131210" };
  const currentTheme = () => root.dataset.theme || (prefersDark.matches ? "dark" : "light");

  function paintTheme() {
    const theme = currentTheme();
    themeButton.dataset.current = theme;
    themeButton.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    if (root.dataset.theme) {
      document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
        meta.content = themeColors[theme];
      });
    }
  }

  function toggleTheme() {
    root.dataset.theme = currentTheme() === "dark" ? "light" : "dark";
    store.set("theme", root.dataset.theme);
    paintTheme();
  }

  themeButton.addEventListener("click", toggleTheme);
  prefersDark.addEventListener("change", paintTheme);
  paintTheme();

  /* Copy ---------------------------------------------------------------- */

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const focused = document.activeElement;
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
      document.body.append(area);
      area.select();
      let copied = false;
      try { copied = document.execCommand("copy"); } catch { copied = false; }
      area.remove();
      if (focused instanceof HTMLElement) focused.focus({ preventScroll: true });
      return copied;
    }
  }

  async function copyFrom(button) {
    const text = button.dataset.copy;
    if (await copyText(text)) {
      button.dataset.copied = "";
      setTimeout(() => { delete button.dataset.copied; }, 1600);
      say(`Copied: ${text}`);
    } else {
      say("Couldn’t reach the clipboard. Select the command to copy it.");
    }
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-copy]");
    if (button) copyFrom(button);
  });

  /* Demos: play while on screen, never against the reader's wishes. ----- */

  document.querySelectorAll("[data-demo]").forEach((figure) => {
    const video = figure.querySelector("video");
    const button = figure.querySelector(".demo-toggle");
    const label = button.querySelector(".demo-label");
    let heldByReader = reduceMotion.matches;

    const paint = () => {
      const playing = !video.paused;
      button.dataset.state = playing ? "playing" : "paused";
      button.setAttribute("aria-label", playing ? "Pause demo" : "Play demo");
      label.textContent = playing ? "Pause" : "Play";
    };

    video.addEventListener("play", paint);
    video.addEventListener("pause", paint);
    button.addEventListener("click", () => {
      heldByReader = !video.paused;
      if (heldByReader) video.pause();
      else video.play().catch(paint);
    });

    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !heldByReader) video.play().catch(paint);
      else if (!entry.isIntersecting && !video.paused) video.pause();
    }, { threshold: 0.4 }).observe(video);

    paint();
  });

  /* Keys ---------------------------------------------------------------- */

  const items = Array.from(document.querySelectorAll("[data-nav]"));
  const sections = Array.from(document.querySelectorAll("main [data-path]"));
  const dialog = document.getElementById("keys");
  const shortcutsToggle = document.getElementById("shortcuts-toggle");
  const statusMode = document.getElementById("sb-mode");
  const statusPath = document.getElementById("sb-path");
  const statusPos = document.getElementById("sb-pos");
  let selected = -1;

  const shortcutsOn = () => !root.classList.contains("shortcuts-off");
  const top = (el) => el.getBoundingClientRect().top;
  const onScreen = (el) => {
    const rect = el.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  };

  function sectionInView() {
    const line = window.innerHeight * 0.35;
    let current = sections[0];
    for (const section of sections) if (top(section) <= line) current = section;
    return current;
  }

  function pathOf(el) {
    const section = el.closest("[data-path]");
    const base = section && section.dataset.path ? `~/${section.dataset.path}` : "~";
    return el.dataset.nav ? `${base}/${el.dataset.nav}` : base;
  }

  function paintStatus() {
    const el = selected >= 0 ? items[selected] : sectionInView();
    statusPath.textContent = pathOf(el);
    statusPos.textContent = `${selected >= 0 ? selected + 1 : "–"}/${items.length}`;
  }

  function select(index, { scroll = true } = {}) {
    const next = Math.max(0, Math.min(items.length - 1, index));
    if (selected >= 0) items[selected].classList.remove("is-selected");
    selected = next;
    const el = items[selected];
    el.classList.add("is-selected");
    if (scroll) {
      el.focus({ preventScroll: true });
      const tall = el.offsetHeight > window.innerHeight * 0.6;
      el.scrollIntoView({ block: tall ? "start" : "center", behavior: scrollBehavior() });
    }
    paintStatus();
  }

  function clearSelection() {
    if (selected >= 0) items[selected].classList.remove("is-selected");
    if (document.activeElement && document.activeElement.hasAttribute("data-nav")) {
      document.activeElement.blur();
    }
    selected = -1;
    paintStatus();
  }

  // The item being read: the first one that still reaches into the top quarter of the screen.
  function itemInView() {
    const line = window.innerHeight * 0.25;
    const index = items.findIndex((el) => el.getBoundingClientRect().bottom > line);
    return index === -1 ? items.length - 1 : index;
  }

  // Move from the selection while it is on screen; otherwise pick up where the reader is.
  function move(step) {
    if (selected >= 0 && onScreen(items[selected])) select(selected + step);
    else select(itemInView());
  }

  function openSelected() {
    const link = items[selected].querySelector("[data-primary]");
    if (link) link.click();
  }

  function copySelected() {
    const button = items[selected].querySelector("[data-copy]");
    if (button) copyFrom(button);
    else say(`No install command for ${items[selected].dataset.nav}.`);
  }

  function openKeys() {
    if (dialog.open) return;
    statusMode.textContent = "help";
    dialog.showModal();
  }

  document.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    if (!shortcutsOn() || dialog.open) return;
    const target = event.target;
    if (target.closest('textarea, select, [contenteditable], input:not([type="radio"]):not([type="checkbox"])')) return;

    switch (event.key) {
      case "j": move(1); break;
      case "k": move(-1); break;
      case "Enter":
        // Links and buttons keep their own Enter; only the selected item itself opens.
        if (selected < 0 || target !== items[selected]) return;
        openSelected();
        break;
      case "o":
        if (selected < 0) return;
        openSelected();
        break;
      case "y":
        if (selected < 0) return;
        copySelected();
        break;
      case "g":
        clearSelection();
        window.scrollTo({ top: 0, behavior: scrollBehavior() });
        break;
      case "G":
        clearSelection();
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: scrollBehavior() });
        break;
      case "t": toggleTheme(); break;
      case "?": openKeys(); break;
      case "Escape":
        if (selected < 0) return;
        clearSelection();
        break;
      default: return;
    }
    event.preventDefault();
  });

  // Once someone is using the keys, a click moves the selection too.
  document.addEventListener("pointerdown", (event) => {
    if (selected < 0) return;
    const item = event.target.closest("[data-nav]");
    if (item) select(items.indexOf(item), { scroll: false });
  });

  // Arriving at a project from the contents list selects it.
  function selectFromHash() {
    let id = window.location.hash.slice(1);
    try { id = decodeURIComponent(id); } catch { /* a malformed hash selects nothing */ }
    const el = id && document.getElementById(id);
    const index = el ? items.indexOf(el) : -1;
    if (index >= 0) select(index, { scroll: false });
  }
  window.addEventListener("hashchange", selectFromHash);

  document.getElementById("keys-btn").addEventListener("click", openKeys);
  document.querySelectorAll("[data-open-keys]").forEach((button) => button.addEventListener("click", openKeys));

  dialog.addEventListener("close", () => { statusMode.textContent = "normal"; });
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    const inside = event.clientX >= rect.left && event.clientX <= rect.right
      && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!inside) dialog.close();
  });

  shortcutsToggle.checked = shortcutsOn();
  shortcutsToggle.addEventListener("change", () => {
    root.classList.toggle("shortcuts-off", !shortcutsToggle.checked);
    store.set("shortcuts", shortcutsToggle.checked ? "on" : "off");
    if (!shortcutsToggle.checked) clearSelection();
  });

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking || selected >= 0) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      paintStatus();
    });
  }, { passive: true });

  paintStatus();
  selectFromHash();
})();
