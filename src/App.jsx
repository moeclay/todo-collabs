import { useEffect, useMemo, useState } from "react";

import AppToolbar from "./components/AppToolbar.jsx";
import DateBox from "./components/DateBox.jsx";
import FilterButtons from "./components/FilterButtons.jsx";
import MusicCard from "./components/MusicCard.jsx";
import PomodoroCard from "./components/PomodoroCard.jsx";
import ScheduleCard from "./components/ScheduleCard.jsx";
import TodoForm from "./components/TodoForm.jsx";
import TodoList from "./components/TodoList.jsx";
import WeatherCard from "./components/WeatherCard.jsx";
import useDarkMode from "./hooks/useDarkMode.js";
import { applyBackup, downloadBackup, parseBackupFile } from "./lib/backup.js";
import { reorderTodos } from "./lib/todoUtils.js";

const STORAGE_KEY = "todo-app-todos";

function loadTodosFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (t) =>
        t &&
        typeof t.id === "string" &&
        typeof t.text === "string" &&
        typeof t.completed === "boolean",
    );
  } catch {
    return [];
  }
}

export default function App() {
  const { isDark, toggleDark } = useDarkMode();
  const [todos, setTodos] = useState(loadTodosFromStorage);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  const counts = useMemo(() => {
    const totalCount = todos.length;
    const completedCount = todos.filter((t) => t.completed).length;
    return { totalCount, completedCount };
  }, [todos]);

  const { totalCount, completedCount } = counts;
  const canReorder = filter === "all" && !searchQuery.trim();

  const addTodo = (text) => {
    setTodos((prev) => [
      {
        id: crypto.randomUUID(),
        text,
        completed: false,
      },
      ...prev,
    ]);
  };

  const toggleTodo = (id) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  };

  const deleteTodo = (id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTodoText = (id, text) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, text } : t)),
    );
  };

  const clearCompleted = () => {
    setTodos((prev) => prev.filter((t) => !t.completed));
  };

  const handleReorder = (draggedId, targetId) => {
    setTodos((prev) => reorderTodos(prev, draggedId, targetId));
  };

  const handleExport = () => {
    downloadBackup(todos);
  };

  const handleImport = (text) => {
    try {
      const backup = parseBackupFile(text);
      const confirmed = window.confirm(
        "Import akan mengganti todo dan jadwal saat ini. Lanjutkan?",
      );
      if (!confirmed) return;

      const importedTodos = applyBackup(backup);
      setTodos(importedTodos);
      window.dispatchEvent(new CustomEvent("todo-app:schedules-imported"));
      window.alert("Backup berhasil diimport.");
    } catch (error) {
      window.alert(error.message || "Gagal mengimport backup.");
    }
  };

  return (
    <div className="app flex h-screen flex-col overflow-hidden bg-gradient-to-br from-indigo-100 via-purple-50 to-teal-100 px-4 py-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 md:py-6">
      <div className="app__container mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col">
        <header className="app__header mb-4 shrink-0 text-left">
          <h1 className="app__title text-3xl font-semibold tracking-tight text-slate-800 dark:text-slate-100 md:text-4xl">
            Todo List
          </h1>
          <p className="app__subtitle mt-2 text-sm text-slate-600 dark:text-slate-400">
            Simple Apps, local, and ready when you are.
          </p>
        </header>

        <div className="app__sidebar flex flex-row md:hidden gap-1 mb-2 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
          <DateBox />
          <WeatherCard />
          <ScheduleCard />
          <MusicCard />
          <PomodoroCard />
        </div>

        <div className="app__layout flex min-h-0 flex-1 items-stretch gap-3">
          <main className="app__surface flex min-h-0 min-w-0 flex-1 flex-col rounded-2xl border border-white/60 bg-white/70 p-5 shadow-xl shadow-indigo-500/15 backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-black/30 md:p-7">
            <AppToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              isDark={isDark}
              onToggleDark={toggleDark}
              onExport={handleExport}
              onImport={handleImport}
            />

            <TodoForm onAdd={addTodo} />

            <div className="app__filters flex shrink-0 justify-start">
              <FilterButtons activeFilter={filter} onChangeFilter={setFilter} />
            </div>

            <div className="app__list-scroll scrollbar-hide min-h-0 flex-1 overflow-y-auto">
              <TodoList
                todos={todos}
                filter={filter}
                searchQuery={searchQuery}
                canReorder={canReorder}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
                onUpdateText={updateTodoText}
                onReorder={handleReorder}
              />
            </div>

            <footer className="app__footer mt-4 hidden sm:flex shrink-0 flex-col gap-3 border-t border-slate-200/80 pt-5 dark:border-slate-700/80 sm:flex-row sm:items-center sm:justify-between">
              <p className="app__counter text-sm text-slate-600 dark:text-slate-400">
                {totalCount === 0 ? (
                  <span className="app__counter--empty font-medium">
                    No tasks yet
                  </span>
                ) : (
                  <>
                    <span className="app__counter--value font-semibold text-slate-800 dark:text-slate-100">
                      {completedCount}
                    </span>
                    {" of "}
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {totalCount}
                    </span>
                    {" tasks completed"}
                  </>
                )}
              </p>

              <button
                type="button"
                className={
                  `app__clear-completed rounded-lg px-4 py-2 text-sm font-medium transition ` +
                  (completedCount === 0
                    ? "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
                    : "bg-white text-rose-600 shadow-md ring-1 ring-rose-200 hover:bg-rose-50 hover:ring-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 dark:bg-slate-800 dark:text-rose-400 dark:ring-rose-900/50 dark:hover:bg-rose-950/50 dark:focus-visible:ring-offset-slate-900")
                }
                onClick={clearCompleted}
                disabled={completedCount === 0}
              >
                Delete Completed
              </button>
            </footer>
          </main>

          <aside className="hidden md:flex app__sidebar shrink-0 flex-col gap-3 self-start">
            <DateBox />
            <WeatherCard />
            <ScheduleCard />
            <MusicCard />
            <PomodoroCard />
          </aside>
        </div>
      </div>
    </div>
  );
}
