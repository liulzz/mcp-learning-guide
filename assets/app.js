(() => {
  "use strict";

  const THEME_STORAGE_KEY = "mcp-learning-guide-theme";
  const COPY_STATUS_DURATION = 2000;

  const onReady = (callback) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
    } else {
      callback();
    }
  };

  onReady(() => {
    const root = document.documentElement;
    const readingProgress = document.querySelector("#reading-progress");
    const siteNav = document.querySelector("#site-nav");
    const sections = Array.from(
      document.querySelectorAll("main article section[id]")
    );
    const navLinks = Array.from(
      document.querySelectorAll("[data-nav-target]")
    );
    const copyButtons = Array.from(document.querySelectorAll(".copy-code"));
    const themeToggle = document.querySelector("#theme-toggle");
    const backToTop = document.querySelector("#back-to-top");
    const reducedMotionQuery =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;

    const prefersReducedMotion = () =>
      Boolean(reducedMotionQuery && reducedMotionQuery.matches);

    const getScrollTop = () =>
      Math.max(
        0,
        window.scrollY ||
          root.scrollTop ||
          (document.body ? document.body.scrollTop : 0)
      );

    const getTargetId = (link) => {
      if (!link) return "";
      const rawTarget = link.getAttribute("data-nav-target");
      return rawTarget ? rawTarget.trim().replace(/^#/, "") : "";
    };

    const getTargetSection = (link) => {
      const targetId = getTargetId(link);
      return targetId ? document.getElementById(targetId) : null;
    };

    const setActiveSection = (sectionId) => {
      if (!sectionId) return;

      navLinks.forEach((link) => {
        const isActive = getTargetId(link) === sectionId;
        link.classList.toggle("is-active", isActive);
        link.classList.toggle("active", isActive);

        if (isActive) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });

      if (siteNav) {
        siteNav.setAttribute("data-active-section", sectionId);
      }
    };

    const updateReadingProgress = () => {
      if (!readingProgress) return;

      const scrollableHeight = Math.max(0, root.scrollHeight - window.innerHeight);
      const ratio =
        scrollableHeight === 0
          ? 1
          : Math.min(1, Math.max(0, getScrollTop() / scrollableHeight));
      const percentage = Math.round(ratio * 100);

      readingProgress.style.setProperty(
        "--reading-progress",
        `${percentage}%`
      );
      readingProgress.style.setProperty(
        "--reading-progress-percent",
        `${percentage}%`
      );

      if (readingProgress instanceof HTMLProgressElement) {
        readingProgress.max = 100;
        readingProgress.value = percentage;
      } else {
        readingProgress.setAttribute("role", "progressbar");
      }

      readingProgress.setAttribute("aria-valuemin", "0");
      readingProgress.setAttribute("aria-valuemax", "100");
      readingProgress.setAttribute("aria-valuenow", String(percentage));
      readingProgress.setAttribute("aria-valuetext", `阅读进度 ${percentage}%`);
    };

    const updateActiveSection = () => {
      if (sections.length === 0) return;

      const marker = getScrollTop() + Math.max(96, window.innerHeight * 0.25);
      let activeSection = sections[0];

      for (const section of sections) {
        if (section.offsetTop <= marker) {
          activeSection = section;
        } else {
          break;
        }
      }

      const pageBottom = getScrollTop() + window.innerHeight;
      const documentBottom = root.scrollHeight - 2;
      if (pageBottom >= documentBottom) {
        activeSection = sections[sections.length - 1];
      }

      setActiveSection(activeSection.id);
    };

    let originalBackToTopTabIndex = null;
    if (backToTop) {
      originalBackToTopTabIndex = backToTop.getAttribute("tabindex");
    }

    const updateBackToTop = () => {
      if (!backToTop) return;

      const isVisible = getScrollTop() > Math.max(320, window.innerHeight * 0.5);
      backToTop.hidden = !isVisible;
      backToTop.classList.toggle("is-visible", isVisible);
      backToTop.setAttribute("aria-hidden", String(!isVisible));

      if (isVisible) {
        if (originalBackToTopTabIndex === null) {
          backToTop.removeAttribute("tabindex");
        } else {
          backToTop.setAttribute("tabindex", originalBackToTopTabIndex);
        }
      } else {
        backToTop.setAttribute("tabindex", "-1");
      }
    };

    let framePending = false;
    const updateScrollState = () => {
      updateReadingProgress();
      updateActiveSection();
      updateBackToTop();
      framePending = false;
    };

    const requestScrollUpdate = () => {
      if (framePending) return;
      framePending = true;

      window.setTimeout(updateScrollState, 16);
    };

    window.addEventListener("scroll", requestScrollUpdate, { passive: true });
    window.addEventListener("resize", requestScrollUpdate, { passive: true });
    window.addEventListener("load", requestScrollUpdate, { once: true });

    navLinks.forEach((link) => {
      const target = getTargetSection(link);
      if (!target) return;

      link.addEventListener("click", (event) => {
        event.preventDefault();

        target.scrollIntoView({
          behavior: prefersReducedMotion() ? "auto" : "smooth",
          block: "start",
        });

        setActiveSection(target.id);

        try {
          const url = new URL(window.location.href);
          url.hash = target.id;
          window.history.pushState(null, "", url);
        } catch (_error) {
          // Navigation still succeeds when History API access is unavailable.
        }

        const hadTabIndex = target.hasAttribute("tabindex");
        if (!hadTabIndex) target.setAttribute("tabindex", "-1");

        try {
          target.focus({ preventScroll: true });
        } catch (_error) {
          // Avoid a second, abrupt scroll in browsers without preventScroll.
        }

        if (!hadTabIndex) {
          target.addEventListener(
            "blur",
            () => {
              target.removeAttribute("tabindex");
            },
            { once: true }
          );
        }
      });
    });

    const copyButtonStates = new WeakMap();
    const copyRestoreTimers = new WeakMap();

    const getCopyLabel = (button) =>
      button.querySelector("[data-copy-label], .copy-label") || button;

    const rememberCopyButtonState = (button) => {
      let state = copyButtonStates.get(button);
      if (state) return state;

      const label = getCopyLabel(button);
      state = {
        label,
        labelMarkup: label.innerHTML,
        ariaLabel: button.getAttribute("aria-label"),
        title: button.getAttribute("title"),
        ariaLive: button.getAttribute("aria-live"),
        disabled: "disabled" in button ? button.disabled : false,
      };
      copyButtonStates.set(button, state);
      return state;
    };

    const restoreCopyButton = (button) => {
      const state = copyButtonStates.get(button);
      if (!state) return;

      state.label.innerHTML = state.labelMarkup;

      if (state.ariaLabel === null) button.removeAttribute("aria-label");
      else button.setAttribute("aria-label", state.ariaLabel);

      if (state.title === null) button.removeAttribute("title");
      else button.setAttribute("title", state.title);

      if (state.ariaLive === null) button.removeAttribute("aria-live");
      else button.setAttribute("aria-live", state.ariaLive);

      if ("disabled" in button) button.disabled = state.disabled;
      button.classList.remove("is-copied", "copy-failed");
      copyRestoreTimers.delete(button);
    };

    const showCopyStatus = (button, message, succeeded) => {
      const state = rememberCopyButtonState(button);
      const previousTimer = copyRestoreTimers.get(button);
      if (previousTimer) window.clearTimeout(previousTimer);

      state.label.textContent = message;
      button.setAttribute("aria-live", "polite");
      button.setAttribute("aria-label", message);
      button.classList.toggle("is-copied", succeeded);
      button.classList.toggle("copy-failed", !succeeded);
      if ("disabled" in button) button.disabled = true;

      const timer = window.setTimeout(
        () => restoreCopyButton(button),
        COPY_STATUS_DURATION
      );
      copyRestoreTimers.set(button, timer);
    };

    const getCodeText = (button) => {
      const codeBlock = button.closest(".code-block");
      if (!codeBlock) return null;

      const code = codeBlock.querySelector("pre code, code");
      if (code) return code.textContent || "";

      const pre = codeBlock.querySelector("pre");
      return pre ? pre.textContent || "" : null;
    };

    const fallbackCopy = (text) => {
      if (typeof document.execCommand !== "function") return false;

      const selection = window.getSelection ? window.getSelection() : null;
      const savedRanges = [];
      if (selection) {
        for (let index = 0; index < selection.rangeCount; index += 1) {
          savedRanges.push(selection.getRangeAt(index).cloneRange());
        }
      }

      const activeElement = document.activeElement;
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.setAttribute("aria-hidden", "true");
      textarea.style.position = "fixed";
      textarea.style.top = "0";
      textarea.style.left = "-9999px";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);

      let copied = false;
      try {
        copied = document.execCommand("copy");
      } catch (_error) {
        copied = false;
      } finally {
        textarea.remove();
        if (selection) {
          selection.removeAllRanges();
          savedRanges.forEach((range) => selection.addRange(range));
        }
        if (activeElement && typeof activeElement.focus === "function") {
          try {
            activeElement.focus({ preventScroll: true });
          } catch (_error) {
            // Focus restoration is optional when preventScroll is unsupported.
          }
        }
      }

      return copied;
    };

    const copyText = async (text) => {
      if (
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch (_error) {
          // The legacy path supports denied or unavailable Clipboard API access.
        }
      }
      return fallbackCopy(text);
    };

    copyButtons.forEach((button) => {
      if (!(button instanceof HTMLElement)) return;
      rememberCopyButtonState(button);

      button.addEventListener("click", async () => {
        const codeText = getCodeText(button);
        if (codeText === null) {
          showCopyStatus(button, "无可复制内容", false);
          return;
        }

        if ("disabled" in button) button.disabled = true;
        const copied = await copyText(codeText);
        showCopyStatus(button, copied ? "已复制" : "复制失败", copied);
      });
    });

    const readStoredTheme = () => {
      try {
        const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
        return storedTheme === "dark" || storedTheme === "light"
          ? storedTheme
          : "light";
      } catch (_error) {
        return "light";
      }
    };

    const updateThemeControl = (theme) => {
      if (!themeToggle) return;

      const isDark = theme === "dark";
      const nextThemeLabel = isDark ? "切换到浅色主题" : "切换到深色主题";
      themeToggle.setAttribute("aria-pressed", String(isDark));
      themeToggle.setAttribute("aria-label", nextThemeLabel);
      themeToggle.setAttribute("title", nextThemeLabel);
      themeToggle.setAttribute("data-theme", theme);

      const label = themeToggle.querySelector("[data-theme-label]");
      if (label) label.textContent = isDark ? "浅色主题" : "深色主题";
    };

    const applyTheme = (theme, persist = false) => {
      const normalizedTheme = theme === "dark" ? "dark" : "light";

      if (normalizedTheme === "dark") {
        root.setAttribute("data-theme", "dark");
      } else {
        root.removeAttribute("data-theme");
      }
      root.style.colorScheme = normalizedTheme;
      updateThemeControl(normalizedTheme);

      if (persist) {
        try {
          window.localStorage.setItem(THEME_STORAGE_KEY, normalizedTheme);
        } catch (_error) {
          // Theme switching remains available when storage is blocked.
        }
      }
    };

    applyTheme(readStoredTheme());

    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        const currentTheme = root.getAttribute("data-theme") === "dark"
          ? "dark"
          : "light";
        applyTheme(currentTheme === "dark" ? "light" : "dark", true);
      });
    }

    window.addEventListener("storage", (event) => {
      if (
        event.key === THEME_STORAGE_KEY &&
        (event.newValue === "dark" || event.newValue === "light")
      ) {
        applyTheme(event.newValue);
      }
    });

    if (backToTop) {
      backToTop.addEventListener("click", (event) => {
        event.preventDefault();
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: prefersReducedMotion() ? "auto" : "smooth",
        });
      });
    }

    updateScrollState();
  });
})();
