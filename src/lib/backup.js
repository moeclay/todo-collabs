const SCHEDULES_KEY = "todo-app-schedules";

function isValidTodo(item) {
  return (
    item &&
    typeof item.id === "string" &&
    typeof item.text === "string" &&
    typeof item.completed === "boolean"
  );
}

function isValidSchedule(item) {
  return (
    item &&
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.date === "string" &&
    typeof item.description === "string"
  );
}

export function buildBackupPayload(todos) {
  let schedules = [];
  try {
    const raw = localStorage.getItem(SCHEDULES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        schedules = parsed.filter(isValidSchedule);
      }
    }
  } catch {
    schedules = [];
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    todos: todos.filter(isValidTodo),
    schedules,
  };
}

export function downloadBackup(todos) {
  const payload = buildBackupPayload(todos);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `todo-backup-${date}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function parseBackupFile(text) {
  const parsed = JSON.parse(text);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Format backup tidak valid.");
  }

  const todos = Array.isArray(parsed.todos)
    ? parsed.todos.filter(isValidTodo)
    : [];
  const schedules = Array.isArray(parsed.schedules)
    ? parsed.schedules.filter(isValidSchedule)
    : [];

  if (todos.length === 0 && schedules.length === 0) {
    throw new Error("Backup tidak berisi data todo atau jadwal.");
  }

  return { todos, schedules };
}

export function applyBackup({ todos, schedules }) {
  localStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));
  return todos;
}
