import { useState } from "react";
import PropTypes from "prop-types";

import TodoItem from "./TodoItem.jsx";
import { filterTodos } from "../lib/todoUtils.js";

export default function TodoList({
  todos,
  filter,
  searchQuery,
  canReorder,
  onToggle,
  onDelete,
  onUpdateText,
  onReorder,
}) {
  const [dragOverId, setDragOverId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);

  const visibleTodos = filterTodos(todos, { filter, searchQuery });
  const hasSearch = searchQuery.trim().length > 0;

  if (visibleTodos.length === 0) {
    return (
      <div className="todo-list mt-6 rounded-xl border border-dashed border-slate-200/90 bg-white/40 px-4 py-10 text-center text-sm text-slate-500 backdrop-blur-sm dark:border-slate-600/90 dark:bg-slate-800/40 dark:text-slate-400">
        <p className="todo-list__empty">
          {hasSearch
            ? "No tasks match your search."
            : todos.length === 0
              ? "No tasks yet. Add one above."
              : filter === "active"
                ? "No active tasks. Nice work!"
                : filter === "completed"
                  ? "No completed tasks to show."
                  : "Nothing to display."}
        </p>
      </div>
    );
  }

  const handleDrop = (targetId) => {
    if (!draggingId || draggingId === targetId) return;
    onReorder(draggingId, targetId);
    setDraggingId(null);
    setDragOverId(null);
  };

  return (
    <ul className="todo-list mt-4 space-y-3" aria-label="Tasks">
      {!canReorder && (
        <p className="todo-list__hint text-center text-xs text-slate-400 dark:text-slate-500">
          Drag & drop aktif saat filter All dan pencarian kosong.
        </p>
      )}
      {visibleTodos.map((todo) => (
        <li
          key={todo.id}
          className={
            `todo-list__item transition ` +
            (dragOverId === todo.id ? "scale-[1.01]" : "") +
            (draggingId === todo.id ? " opacity-50" : "")
          }
          onDragOver={(event) => {
            if (!canReorder) return;
            event.preventDefault();
            setDragOverId(todo.id);
          }}
          onDragLeave={() => {
            if (dragOverId === todo.id) setDragOverId(null);
          }}
          onDrop={(event) => {
            if (!canReorder) return;
            event.preventDefault();
            handleDrop(todo.id);
          }}
        >
          <TodoItem
            todo={todo}
            canDrag={canReorder}
            isDragOver={dragOverId === todo.id}
            onToggle={onToggle}
            onDelete={onDelete}
            onUpdateText={onUpdateText}
            onDragStart={() => setDraggingId(todo.id)}
            onDragEnd={() => {
              setDraggingId(null);
              setDragOverId(null);
            }}
          />
        </li>
      ))}
    </ul>
  );
}

TodoList.propTypes = {
  todos: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
      completed: PropTypes.bool.isRequired,
    }),
  ).isRequired,
  filter: PropTypes.oneOf(["all", "active", "completed"]).isRequired,
  searchQuery: PropTypes.string.isRequired,
  canReorder: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onUpdateText: PropTypes.func.isRequired,
  onReorder: PropTypes.func.isRequired,
};
