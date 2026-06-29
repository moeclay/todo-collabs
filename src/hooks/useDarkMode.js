import { useEffect, useState } from "react";

import { applyTheme, getStoredIsDark } from "../lib/theme.js";

export default function useDarkMode() {
  const [isDark, setIsDark] = useState(() => getStoredIsDark());

  useEffect(() => {
    applyTheme(isDark);
  }, [isDark]);

  const toggleDark = () => {
    setIsDark((value) => {
      const next = !value;
      applyTheme(next);
      return next;
    });
  };

  return { isDark, toggleDark };
}
