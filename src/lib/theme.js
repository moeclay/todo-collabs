const THEME_KEY = "todo-app-theme";

export function getStoredIsDark() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "dark") return true;
    if (stored === "light") return false;
  } catch {
    // ignore
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyTheme(isDark) {
  const root = document.documentElement;
  root.classList.toggle("dark", isDark);
  root.style.colorScheme = isDark ? "dark" : "light";

  try {
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  } catch {
    // ignore
  }
}

export function initTheme() {
  applyTheme(getStoredIsDark());
}
