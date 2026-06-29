import PropTypes from "prop-types";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
];

/**
 * Tombol filter: mengubah cara daftar todo ditampilkan tanpa menghapus data.
 */
export default function FilterButtons({ activeFilter, onChangeFilter }) {
  return (
    <div
      className="filter-buttons flex flex-wrap gap-2"
      role="group"
      aria-label="Task filters"
    >
      {FILTERS.map(({ id, label }) => {
        const isActive = activeFilter === id;
        return (
          <button
            key={id}
            type="button"
            className={
              `filter-buttons__btn rounded-lg px-4 py-2 text-sm font-medium transition ` +
              (isActive
                ? "filter-buttons__btn--active bg-white text-indigo-600 shadow-md ring-1 ring-indigo-500/35 dark:bg-slate-700 dark:text-indigo-400 dark:ring-indigo-500/40"
                : "filter-buttons__btn--inactive bg-white/55 text-slate-600 backdrop-blur-sm hover:bg-white/90 dark:bg-slate-800/55 dark:text-slate-400 dark:hover:bg-slate-700/90")
            }
            onClick={() => onChangeFilter(id)}
            aria-pressed={isActive}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

FilterButtons.propTypes = {
  activeFilter: PropTypes.oneOf(["all", "active", "completed"]).isRequired,
  onChangeFilter: PropTypes.func.isRequired,
};
