import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";

import CenterModal from "./CenterModal.jsx";

const STORAGE_KEY = "todo-app-schedules";
const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function loadSchedulesFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        typeof item.date === "string" &&
        typeof item.description === "string",
    );
  } catch {
    return [];
  }
}

function toDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

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

function formatDisplayDate(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ScheduleCard() {
  const now = useMemo(() => new Date(), []);
  const todayKey = toDateKey(now.getFullYear(), now.getMonth(), now.getDate());

  const [open, setOpen] = useState(false);
  const [schedules, setSchedules] = useState(loadSchedulesFromStorage);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [form, setForm] = useState({ name: "", date: todayKey, description: "" });

  const monthTitle = useMemo(
    () =>
      new Date(viewYear, viewMonth, 1).toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      }),
    [viewYear, viewMonth],
  );

  const calendarDays = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const scheduleDates = useMemo(
    () => new Set(schedules.map((item) => item.date)),
    [schedules],
  );

  const monthScheduleCount = useMemo(() => {
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return schedules.filter((item) => item.date.startsWith(prefix)).length;
  }, [schedules, now]);

  const selectedSchedules = useMemo(
    () =>
      schedules
        .filter((item) => item.date === selectedDate)
        .sort((a, b) => a.name.localeCompare(b.name, "id")),
    [schedules, selectedDate],
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    const handleImport = () => setSchedules(loadSchedulesFromStorage());
    window.addEventListener("todo-app:schedules-imported", handleImport);
    return () =>
      window.removeEventListener("todo-app:schedules-imported", handleImport);
  }, []);

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((year) => year - 1);
      return;
    }
    setViewMonth((month) => month - 1);
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((year) => year + 1);
      return;
    }
    setViewMonth((month) => month + 1);
  };

  const handleDayClick = (day) => {
    const dateKey = toDateKey(viewYear, viewMonth, day);
    setSelectedDate(dateKey);
    setForm((prev) => ({ ...prev, date: dateKey }));
  };

  const handleAddSchedule = (event) => {
    event.preventDefault();
    const name = form.name.trim();
    const description = form.description.trim();
    if (!name || !form.date) return;

    setSchedules((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name,
        date: form.date,
        description,
      },
    ]);

    setSelectedDate(form.date);
    setForm({ name: "", date: form.date, description: "" });
  };

  const handleDeleteSchedule = (id) => {
    setSchedules((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="schedule-card shrink-0">
      <button
        type="button"
        className="schedule-card__trigger flex h-20 w-20 md:h-20 md:w-20 flex-col items-center justify-center rounded-xl border border-white/60 bg-white/70 text-center shadow-xl shadow-indigo-500/15 backdrop-blur-md transition hover:bg-white/90 dark:border-slate-600/60 dark:bg-slate-800/80 dark:shadow-black/30 dark:hover:bg-slate-700/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
        aria-label={`Jadwal bulan ini: ${monthScheduleCount} jadwal`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <CalendarDays className="h-5 w-5 text-indigo-500" aria-hidden />
        <span className="mt-1 text-lg font-bold leading-none text-slate-800 dark:text-slate-100">
          {monthScheduleCount}
        </span>
        <span className="mt-0.5 text-[10px] font-medium leading-none text-slate-500 dark:text-slate-300">
          Jadwal
        </span>
      </button>

      <CenterModal
        open={open}
        onClose={() => setOpen(false)}
        ariaLabel={`Jadwal ${monthTitle}`}
        className="max-w-sm"
      >
        <div className="schedule-card__calendar mb-4">
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label="Bulan sebelumnya"
                onClick={goToPrevMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p className="text-sm font-semibold capitalize text-slate-800">
                {monthTitle}
              </p>
              <button
                type="button"
                className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label="Bulan berikutnya"
                onClick={goToNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7 gap-1">
              {WEEKDAYS.map((label) => (
                <span
                  key={label}
                  className="text-center text-[10px] font-medium uppercase text-slate-400"
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <span key={`empty-${index}`} aria-hidden />;
                }

                const dateKey = toDateKey(viewYear, viewMonth, day);
                const hasSchedule = scheduleDates.has(dateKey);
                const isToday = dateKey === todayKey;
                const isSelected = dateKey === selectedDate;

                return (
                  <button
                    key={dateKey}
                    type="button"
                    className={
                      `flex h-8 items-center justify-center rounded-lg text-sm transition ` +
                      (hasSchedule
                        ? "bg-teal-500 font-semibold text-white hover:bg-teal-600 "
                        : "text-slate-700 hover:bg-slate-100 ") +
                      (isSelected ? " ring-2 ring-indigo-400 ring-offset-1 " : "") +
                      (isToday && !hasSchedule
                        ? " bg-indigo-100 font-semibold text-indigo-700 "
                        : "") +
                      (isToday && hasSchedule
                        ? " ring-2 ring-white ring-offset-1 ring-offset-teal-500 "
                        : "")
                    }
                    onClick={() => handleDayClick(day)}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="schedule-card__selected mb-4">
            <p className="mb-2 text-xs font-medium text-slate-500">
              {formatDisplayDate(selectedDate)}
            </p>
            {selectedSchedules.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-400">
                Belum ada jadwal di tanggal ini.
              </p>
            ) : (
              <ul className="scrollbar-hide max-h-28 space-y-2 overflow-y-auto">
                {selectedSchedules.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800">
                        {item.name}
                      </p>
                      {item.description && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                      aria-label={`Hapus jadwal ${item.name}`}
                      onClick={() => handleDeleteSchedule(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form
            className="schedule-card__form space-y-2 border-t border-slate-200/80 pt-4"
            onSubmit={handleAddSchedule}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Tambah Jadwal
            </p>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/35"
              placeholder="Nama jadwal"
              value={form.name}
              required
              aria-label="Nama jadwal"
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
            />
            <input
              type="date"
              className="w-full rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/35"
              value={form.date}
              required
              aria-label="Tanggal jadwal"
              onChange={(event) => {
                const dateKey = event.target.value;
                setForm((prev) => ({ ...prev, date: dateKey }));
                setSelectedDate(dateKey);
                const [year, month] = dateKey.split("-").map(Number);
                setViewYear(year);
                setViewMonth(month - 1);
              }}
            />
            <textarea
              className="w-full resize-none rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/35"
              placeholder="Keterangan"
              rows={2}
              value={form.description}
              aria-label="Keterangan jadwal"
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
            />
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Tambah
          </button>
        </form>
      </CenterModal>
    </div>
  );
}
