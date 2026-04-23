import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const SESSION_KEY = 'analytics_session_id';
const LAST_TRACK_KEY = 'analytics_last_track';

function getSessionId() {
  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;

  const next = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  window.sessionStorage.setItem(SESSION_KEY, next);
  return next;
}

export async function trackPageVisit(pathname) {
  const now = Date.now();
  const lastTrack = window.sessionStorage.getItem(LAST_TRACK_KEY);

  if (lastTrack) {
    try {
      const parsed = JSON.parse(lastTrack);
      if (parsed.pathname === pathname && now - parsed.ts < 1500) {
        return;
      }
    } catch {
      // Ignore invalid cached analytics state.
    }
  }

  window.sessionStorage.setItem(
    LAST_TRACK_KEY,
    JSON.stringify({
      pathname,
      ts: now,
    }),
  );

  await addDoc(collection(db, 'analytics_visits'), {
    pathname,
    sessionId: getSessionId(),
    referrer: document.referrer || 'direct',
    userAgent: navigator.userAgent,
    language: navigator.language || 'unknown',
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    createdAt: serverTimestamp(),
  });
}
