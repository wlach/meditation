"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const bell = document.getElementById("bell");
  const content = document.getElementById("content");
  const timeIntervals = [5, 10, 20, 25, 30, 45, 60];

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js");
  }

  const themeToggle = document.getElementById("theme-toggle");
  const root = document.documentElement;
  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
    localStorage.theme = theme;
  }
  function currentTheme() {
    return (
      localStorage.theme ||
      (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
    );
  }
  applyTheme(currentTheme());
  themeToggle.addEventListener("click", () => {
    applyTheme(currentTheme() === "dark" ? "light" : "dark");
  });

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => root.querySelectorAll(sel);
  const dd = (n) => (n < 10 ? "0" + n : String(n));
  const fmt = (secs) => dd(Math.floor(secs / 60)) + ":" + dd(secs % 60);

  function fadeIn(el) {
    el.style.display = "";
    el.style.opacity = "0";
    el.classList.remove("fade-out");
    requestAnimationFrame(() => {
      el.style.opacity = "";
      el.classList.add("fade-in");
    });
  }
  function fadeOut(el, cb) {
    el.classList.remove("fade-in");
    el.classList.add("fade-out");
    el.addEventListener("animationend", function handler() {
      el.removeEventListener("animationend", handler);
      el.style.display = "none";
      if (cb) cb();
    });
  }

  function setupTimer() {
    let selectedTimeInterval = parseInt(localStorage.defaultTimeInterval, 10);
    if (!timeIntervals.includes(selectedTimeInterval)) {
      selectedTimeInterval = 20;
    }
    let timer = null;
    let wakeLock = null;

    content.innerHTML = document.getElementById("tmpl-meditation").innerHTML;
    const dialog = $("#meditation-dialog");
    const textEl = $("#meditation-text");
    const startBtn = $("#start-button");
    const aboutLink = $("#about-link");
    const timeOpts = $("#time-options");

    timeOpts.innerHTML = timeIntervals
      .map(
        (v) =>
          `<button id="time-button-${v}" class="time-selector-btn" aria-pressed="false">${v}</button>`,
      )
      .join("");

    function intervalSelected(t) {
      selectedTimeInterval = t;
      localStorage.defaultTimeInterval = t;
      textEl.textContent = t + " minutes";
      $$(".time-selector-btn").forEach((b) => {
        b.classList.remove("btn-link-selected");
        b.setAttribute("aria-pressed", "false");
      });
      $(`#time-button-${t}`).classList.add("btn-link-selected");
      $(`#time-button-${t}`).setAttribute("aria-pressed", "true");
    }

    timeIntervals.forEach((t) => {
      $(`#time-button-${t}`).addEventListener("click", () =>
        intervalSelected(t),
      );
    });
    intervalSelected(selectedTimeInterval);
    fadeIn(dialog);

    async function acquireWakeLock() {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await navigator.wakeLock.request("screen");
        }
      } catch (_) {
        /* not critical */
      }
    }

    function releaseWakeLock() {
      if (wakeLock) {
        wakeLock.release();
        wakeLock = null;
      }
    }

    function reset() {
      bell.removeEventListener("ended", reset);
      releaseWakeLock();
      clearTimeout(timer);
      timer = null;
      intervalSelected(selectedTimeInterval);
      timeOpts.style.display = "";
      aboutLink.style.display = "";
      themeToggle.style.display = "";
      textEl.classList.remove("countdown");
      startBtn.textContent = "Begin";
    }

    startBtn.addEventListener("click", () => {
      if (timer) {
        bell.pause();
        reset();
        return;
      }

      acquireWakeLock();
      startBtn.textContent = "Cancel";
      timeOpts.style.display = "none";
      aboutLink.style.display = "none";
      themeToggle.style.display = "none";
      textEl.innerHTML =
        "Prepare for meditation <span class='blink'>...</span>";

      timer = setTimeout(() => {
        textEl.classList.add("countdown");
        const startTime = Date.now();
        let bellRung = false;

        function tick() {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const remaining = selectedTimeInterval * 60 - elapsed;
          if (remaining > 0) {
            textEl.textContent = fmt(remaining);
          } else {
            if (!bellRung) {
              bellRung = true;
              bell.currentTime = 0;
              bell.play();
              startBtn.textContent = "Done";
            }
            textEl.textContent =
              remaining === 0 ? "00:00" : "-" + fmt(-remaining);
          }
          timer = setTimeout(tick, 1000);
        }

        bell.play();
        tick();
      }, 10000);
    });

    aboutLink.addEventListener("click", (e) => {
      e.preventDefault();
      fadeOut(dialog, () => {
        content.innerHTML = document.getElementById("tmpl-about").innerHTML;
        const aboutDialog = $("#about-dialog");
        fadeIn(aboutDialog);
        $("#return-button").addEventListener("click", () => {
          fadeOut(aboutDialog, () => setupTimer());
        });
      });
    });
  }

  setupTimer();
});
