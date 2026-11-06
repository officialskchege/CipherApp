const THEME_STORAGE_KEY = "cipherapp-theme";
const root = document.documentElement;

function readSavedTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "light"
      ? "light"
      : "dark";
  } catch {
    return "dark";
  }
}

function applyTheme(theme) {
  const isLight = theme === "light";
  root.dataset.theme = isLight ? "light" : "dark";
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.setAttribute("aria-pressed", String(isLight));
    button.setAttribute(
      "aria-label",
      `Switch to ${isLight ? "dark" : "light"} theme`,
    );
    button.title = `Switch to ${isLight ? "dark" : "light"} theme`;
    const label = button.querySelector(".theme-label");
    if (label) label.textContent = isLight ? "Light theme" : "Dark theme";
  });
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) {
    themeColor.content = isLight ? "#f3f8f6" : "#071219";
  }
}

const initialTheme = readSavedTheme();
root.dataset.theme = initialTheme;
document.addEventListener("DOMContentLoaded", () => {
  applyTheme(initialTheme);
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextTheme = root.dataset.theme === "light" ? "dark" : "light";
      try {
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      } catch {
        // Keep the selected theme for this page even when storage is unavailable.
      }
      applyTheme(nextTheme);
    });
  });
});
