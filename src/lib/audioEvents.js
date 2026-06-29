export const AUDIO_EVENTS = {
  STOP_MUSIC: "todo-app:stop-music",
};

export function stopMusic() {
  window.dispatchEvent(new CustomEvent(AUDIO_EVENTS.STOP_MUSIC));
}
