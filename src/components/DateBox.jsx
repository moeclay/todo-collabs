import { useMemo, useState } from "react";

import CenterModal from "./CenterModal.jsx";

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function buildMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;

  const cells = Array.from({ length: startOffset }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }
  return cells;
}

export default function DateBox() {
  const [open, setOpen] = useState(false);

  const now = useMemo(() => new Date(), []);
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const display = useMemo(
    () => ({
      day: today,
      month: now.toLocaleDateString("id-ID", { month: "short" }),
      title: now.toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
    }),
    [now, today],
  );

  const calendarDays = useMemo(
    () => buildMonthGrid(year, month),
    [year, month],
  );

  return (
    <div className="date-box shrink-0">
      <button
        type="button"
        className="date-box__trigger flex h-20 w-20 flex-col items-center justify-center rounded-xl border border-white/60 bg-white/70 text-center shadow-xl shadow-indigo-500/15 backdrop-blur-md transition hover:bg-white/90 dark:border-slate-600/60 dark:bg-slate-800/80 dark:shadow-black/30 dark:hover:bg-slate-700/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
        aria-label={`Tanggal hari ini: ${display.day} ${display.month}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <span className="text-2xl font-bold leading-none text-slate-800 dark:text-slate-100">
          {display.day}
        </span>
        <span className="mt-1 text-xs font-medium uppercase leading-none text-slate-500 dark:text-slate-300">
          {display.month}
        </span>
      </button>

      <CenterModal
        open={open}
        onClose={() => setOpen(false)}
        ariaLabel={`Kalender ${display.title}`}
        className="max-w-xs"
      >
        <p className="date-box__popup-title mb-3 text-center text-sm font-semibold capitalize text-slate-800 dark:text-slate-100">
          {display.title}
        </p>

        <div className="date-box__weekdays mb-1 grid grid-cols-7 gap-1">
          {WEEKDAYS.map((label) => (
            <span
              key={label}
              className="text-center text-[10px] font-medium uppercase text-slate-400 dark:text-slate-500"
            >
              {label}
            </span>
          ))}
        </div>

        <div className="date-box__days grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) =>
            day === null ? (
              <span key={`empty-${index}`} aria-hidden />
            ) : (
              <span
                key={day}
                className={
                  `flex h-8 items-center justify-center rounded-lg text-sm ` +
                  (day === today
                    ? "bg-indigo-500 font-semibold text-white"
                    : "text-slate-700 dark:text-slate-200")
                }
              >
                {day}
              </span>
            ),
          )}
        </div>
      </CenterModal>
    </div>
  );
}
