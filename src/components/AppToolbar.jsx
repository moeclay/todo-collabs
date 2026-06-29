import { useRef } from "react";
import PropTypes from "prop-types";
import { Download, Moon, Sun, Upload } from "lucide-react";

const iconButtonClass =
  "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white/90 text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 dark:border-slate-600/80 dark:bg-slate-800/90 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-indigo-400 dark:focus-visible:ring-offset-slate-900";

export default function AppToolbar({
  searchQuery,
  onSearchChange,
  isDark,
  onToggleDark,
  onExport,
  onImport,
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      onImport(text);
    } catch {
      window.alert("Gagal membaca file backup.");
    }
  };

  return (
    <div className="app-toolbar mb-1 flex items-center gap-2">
      <div className="app-toolbar__search relative min-w-0 flex-1">
        <input
          type="search"
          className="w-full rounded-xl border border-slate-200/80 bg-white/90 py-2.5 pl-4 pr-4 text-sm text-slate-800 shadow-sm backdrop-blur-sm placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/35 dark:border-slate-600/80 dark:bg-slate-800/90 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-500"
          placeholder="Cari todo..."
          value={searchQuery}
          aria-label="Cari todo"
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="app-toolbar__actions flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          className={iconButtonClass}
          aria-label={isDark ? "Mode terang" : "Mode gelap"}
          onClick={onToggleDark}
        >
          {isDark ? (
            <Sun className="h-4 w-4" aria-hidden />
          ) : (
            <Moon className="h-4 w-4" aria-hidden />
          )}
        </button>

        <button
          type="button"
          className={iconButtonClass+" hidden md:inline-block"}
          aria-label="Export backup JSON"
          onClick={onExport}
        >
          <Download className="h-4 w-4" aria-hidden />
        </button>

        <button
          type="button"
          className={iconButtonClass+" hidden md:inline-block"}
          aria-label="Import backup JSON"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4" aria-hidden />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-hidden
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}

AppToolbar.propTypes = {
  searchQuery: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  isDark: PropTypes.bool.isRequired,
  onToggleDark: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  onImport: PropTypes.func.isRequired,
};
