// Signs the user out after the idle time chosen in Settings > Security, with
// a minute's warning first. Mounted once for the whole app.
import { useEffect, useRef, useState } from "react";
import { FaClock } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import {
  IDLE_EVENT,
  IDLE_MINUTES_KEY,
  IDLE_WARNING_SECONDS,
  LAST_ACTIVITY_KEY,
  loadIdleMinutes,
  markActivity,
  readLastActivity,
} from "../../utils/idleSignOut";

const ACTIVITY_EVENTS = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart", "scroll"];
// Activity is written at most this often, so moving the mouse stays cheap
const WRITE_EVERY_MS = 5_000;
const CHECK_EVERY_MS = 1_000;

export default function IdleSignOut() {
  const { status, logout } = useAuth();
  const [minutes, setMinutes] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(null); // shown while warning
  const lastLocal = useRef(Date.now());
  const lastWrite = useRef(0);
  const signingOut = useRef(false);

  useEffect(() => {
    setMinutes(loadIdleMinutes());
    const onSetting = (e) => setMinutes(e.detail);
    const onStorage = (e) => {
      if (e.key === IDLE_MINUTES_KEY) setMinutes(loadIdleMinutes());
      if (e.key === LAST_ACTIVITY_KEY) setSecondsLeft(null);
    };
    window.addEventListener(IDLE_EVENT, onSetting);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(IDLE_EVENT, onSetting);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const active = status === "ready" && minutes > 0;

  useEffect(() => {
    if (!active) {
      setSecondsLeft(null);
      return undefined;
    }

    signingOut.current = false;
    lastLocal.current = Date.now();
    markActivity();

    const onActivity = () => {
      const now = Date.now();
      lastLocal.current = now;
      if (now - lastWrite.current >= WRITE_EVERY_MS) {
        lastWrite.current = now;
        markActivity();
      }
    };

    const check = () => {
      if (signingOut.current) return;
      const last = Math.max(lastLocal.current, readLastActivity());
      const left = Math.ceil((last + minutes * 60_000 - Date.now()) / 1000);
      if (left <= 0) {
        signingOut.current = true;
        setSecondsLeft(null);
        logout();
      } else {
        setSecondsLeft(left <= IDLE_WARNING_SECONDS ? left : null);
      }
    };

    ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, onActivity, { passive: true }));
    const timer = setInterval(check, CHECK_EVERY_MS);
    // Coming back to a tab (or waking the computer) checks at once
    document.addEventListener("visibilitychange", check);
    return () => {
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, onActivity));
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [active, minutes, logout]);

  if (secondsLeft === null) return null;

  const stay = () => {
    lastLocal.current = Date.now();
    markActivity();
    setSecondsLeft(null);
  };

  return (
    <div role="alertdialog" aria-live="assertive" className="fixed z-[70] bottom-4 right-4 left-4 sm:left-auto sm:w-96">
      <div className="bg-white border border-gray-200 border-l-4 border-l-amber-500 shadow-xl">
        <div className="flex items-start gap-3 px-4 py-3.5">
          <FaClock className="mt-0.5 shrink-0 text-lg text-amber-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Still there?</p>
            <p className="mt-0.5 text-sm text-gray-600">
              You&apos;ll be signed out in {secondsLeft} second{secondsLeft === 1 ? "" : "s"} because nothing has
              happened for a while.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-4 pb-3.5">
          <button
            type="button"
            onClick={() => logout()}
            className="px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-100"
          >
            Sign out now
          </button>
          <button
            type="button"
            autoFocus
            onClick={stay}
            className="px-3 py-2 text-xs font-medium text-white bg-blue-600 border border-blue-600 hover:bg-blue-700"
          >
            Stay signed in
          </button>
        </div>
      </div>
    </div>
  );
}
