export function reorderTodos(todos, draggedId, targetId) {
  if (draggedId === targetId) return todos;

  const fromIndex = todos.findIndex((todo) => todo.id === draggedId);
  const toIndex = todos.findIndex((todo) => todo.id === targetId);
  if (fromIndex < 0 || toIndex < 0) return todos;

  const next = [...todos];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function filterTodos(todos, { filter, searchQuery }) {
  const query = searchQuery.trim().toLowerCase();

  return todos.filter((todo) => {
    if (filter === "active" && todo.completed) return false;
    if (filter === "completed" && !todo.completed) return false;
    if (query && !todo.text.toLowerCase().includes(query)) return false;
    return true;
  });
}
