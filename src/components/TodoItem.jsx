import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { GripVertical, Trash2 } from "lucide-react";

export default function TodoItem({
  todo,
  canDrag,
  isDragOver,
  onToggle,
  onDelete,
  onUpdateText,
  onDragStart,
  onDragEnd,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);
  const [removing, setRemoving] = useState(false);

  const inputRef = useRef(null);

  useEffect(() => {
    if (!editing) setDraft(todo.text);
  }, [todo.text, editing]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const saveEdit = () => {
    const next = draft.trim();
    if (next) onUpdateText(todo.id, next);
    else setDraft(todo.text);
    setEditing(false);
  };

  const cancelEdit = () => {
    setDraft(todo.text);
    setEditing(false);
  };

  const handleKeyDownInput = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  };

  const handleDeleteClick = () => {
    setRemoving(true);
    window.setTimeout(() => onDelete(todo.id), 220);
  };

  const wrapClasses =
    `todo-item flex items-center gap-2 rounded-xl border border-slate-200/85 bg-white/90 p-3 shadow-sm backdrop-blur-sm transition dark:border-slate-600/85 dark:bg-slate-800/90 ` +
    (todo.completed
      ? "todo-item--completed opacity-80"
      : "todo-item--active hover:border-indigo-200/85 dark:hover:border-indigo-500/40") +
    ` ${editing ? "todo-item--editing ring-2 ring-indigo-400/35" : ""}` +
    ` ${removing ? "animate-fadeOutShrink pointer-events-none" : "animate-fadeInUp"}` +
    ` ${isDragOver ? "border-indigo-400 ring-2 ring-indigo-400/30 dark:border-indigo-500" : ""}`;

  return (
    <div className={wrapClasses}>
      {canDrag && !editing && (
        <button
          type="button"
          draggable
          className="todo-item__drag shrink-0 cursor-grab rounded p-1 text-slate-300 transition hover:text-slate-500 active:cursor-grabbing dark:text-slate-600 dark:hover:text-slate-400"
          aria-label={`Drag to reorder: ${todo.text}`}
          onDragStart={(event) => {
            event.dataTransfer.setData("text/plain", todo.id);
            event.dataTransfer.effectAllowed = "move";
            onDragStart();
          }}
          onDragEnd={onDragEnd}
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </button>
      )}

      <div className="todo-item__check flex shrink-0 items-center">
        <label className="flex cursor-pointer items-center gap-0">
          <span className="sr-only">
            Mark &quot;
            {todo.text}
            &quot; complete
          </span>
          <input
            type="checkbox"
            checked={todo.completed}
            disabled={editing}
            onChange={() => onToggle(todo.id)}
            className="todo-item__checkbox h-5 w-5 cursor-pointer rounded border-slate-300 text-indigo-500 transition focus:ring-indigo-400 dark:border-slate-600 dark:bg-slate-700"
          />
        </label>
      </div>

      <div className="todo-item__content min-w-0 flex-1">
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            className="todo-item__input w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/35 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            value={draft}
            aria-label="Edit task"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDownInput}
            onBlur={saveEdit}
          />
        ) : (
          <button
            type="button"
            className={
              `todo-item__label w-full rounded-lg px-2 py-2 text-left text-base transition ` +
              (todo.completed
                ? "text-slate-400 line-through dark:text-slate-500"
                : "text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-700/50")
            }
            onClick={() => setEditing(true)}
          >
            {todo.text}
          </button>
        )}
      </div>

      <div className="todo-item__actions flex shrink-0 items-center">
        <button
          type="button"
          className="todo-item__delete rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteClick();
          }}
          aria-label={`Delete task: ${todo.text}`}
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

TodoItem.propTypes = {
  todo: PropTypes.shape({
    id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    completed: PropTypes.bool.isRequired,
  }).isRequired,
  canDrag: PropTypes.bool.isRequired,
  isDragOver: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onUpdateText: PropTypes.func.isRequired,
  onDragStart: PropTypes.func.isRequired,
  onDragEnd: PropTypes.func.isRequired,
};

TodoItem.defaultProps = {
  isDragOver: false,
};
