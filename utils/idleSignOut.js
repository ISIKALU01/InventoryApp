// Automatic sign-out after a period without activity. Set per device in
// Settings > Security, so a shared till can lock sooner than an office PC.
// The last activity time is kept in localStorage, so every open tab shares
// it: working in one tab keeps the others signed in too.

export const IDLE_MINUTES_KEY = "security.idleMinutes";
export const LAST_ACTIVITY_KEY = "security.lastActivity";
export const IDLE_EVENT = "idlesettingchange";

// Seconds of warning before the sign-out happens
export const IDLE_WARNING_SECONDS = 60;

export const IDLE_OPTIONS = [
  { minutes: 0, label: "Never" },
  { minutes: 5, label: "5 minutes" },
  { minutes: 15, label: "15 minutes" },
  { minutes: 30, label: "30 minutes" },
  { minutes: 60, label: "1 hour" },
  { minutes: 120, label: "2 hours" },
];

export const loadIdleMinutes = () => {
  try {
    const minutes = Number(localStorage.getItem(IDLE_MINUTES_KEY));
    return IDLE_OPTIONS.some((o) => o.minutes === minutes) ? minutes : 0;
  } catch {
    return 0;
  }
};

export const saveIdleMinutes = (minutes) => {
  try {
    if (minutes) localStorage.setItem(IDLE_MINUTES_KEY, String(minutes));
    else localStorage.removeItem(IDLE_MINUTES_KEY);
  } catch {
    // Storage blocked: the setting lasts for this page only
  }
  markActivity();
  window.dispatchEvent(new CustomEvent(IDLE_EVENT, { detail: minutes }));
  return minutes;
};

// 0 when nothing is stored (or storage is blocked)
export const readLastActivity = () => {
  try {
    return Number(localStorage.getItem(LAST_ACTIVITY_KEY)) || 0;
  } catch {
    return 0;
  }
};

export const markActivity = () => {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
  } catch {
    // Storage blocked: each tab then times out on its own
  }
};
