import { useState } from "react";
import PropTypes from "prop-types";
import { Plus } from "lucide-react";

/**
 * Form untuk menambah todo baru.
 * Mencegah submit kosong (trim), dan mendukung Enter serta klik tombol.
 */
export default function TodoForm({ onAdd }) {
  const [value, setValue] = useState("");

  const submit = () => {
    const text = value.trim();
    if (!text) return;
    onAdd(text);
    setValue("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submit();
  };

  return (
    <form
      className="todo-form mb-2 md:mb-6 flex flex-row flex-nowrap items-center gap-2 w-full"
      onSubmit={handleSubmit}
    >
      <input
        type="text"
        className="todo-form__input min-h-11 flex-grow rounded-xl border border-slate-200/80 bg-white/90 px-4 py-2.5 text-slate-800 shadow-sm backdrop-blur-sm transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/35 dark:border-slate-600/80 dark:bg-slate-800/90 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-500 w-full min-w-0"
        placeholder="What needs to be done?"
        value={value}
        aria-label="New task"
        onChange={(e) => setValue(e.target.value)}
      />
      <button
        type="submit"
        className="todo-form__submit inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 font-medium text-white shadow-md shadow-indigo-500/25 transition hover:bg-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
      >
        <Plus className="h-5 w-5 hidden sm:block" aria-hidden />
        <span>Add</span>
      </button>
    </form>
  );
}

TodoForm.propTypes = {
  onAdd: PropTypes.func.isRequired,
};
