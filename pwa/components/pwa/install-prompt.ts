/**
 * The browser's install offer (§8), captured as early as the module loads.
 *
 * Chrome fires `beforeinstallprompt` once, whenever it decides the app is
 * installable — often before React has mounted anything. Listening from a
 * component's effect would miss it, so the listener lives at module scope and
 * the component subscribes to the result.
 */

/** Not in lib.dom: Chromium-only. */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

/** §8: "Dismissing stores a timestamp in localStorage; suppress re-showing for 30 days." */
const DISMISSED_KEY = 'unipocket_install_dismissed_at';
const SUPPRESS_MS = 30 * 24 * 60 * 60 * 1000;

let pending: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

/** Whether a dismissal less than 30 days old is on record. Storage failing means "no". */
export function recentlyDismissed(now = Date.now()): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISSED_KEY));
    return Number.isFinite(at) && at > 0 && now - at < SUPPRESS_MS;
  } catch {
    return false;
  }
}

export function recordDismissal(): void {
  try {
    // Epoch milliseconds: UTC by construction, compared as a number.
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
  } catch {
    // Private mode: the banner simply comes back next time.
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    // Inside the 30 days the browser keeps its own install UI: preventDefault
    // only when this app is going to offer the banner instead.
    if (recentlyDismissed()) return;
    event.preventDefault();
    pending = event as BeforeInstallPromptEvent;
    emit();
  });

  window.addEventListener('appinstalled', () => {
    pending = null;
    emit();
  });
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPending(): BeforeInstallPromptEvent | null {
  return pending;
}

/** The server never has an install offer. */
export function getServerPending(): BeforeInstallPromptEvent | null {
  return null;
}

/** Spends the event: Chrome allows `prompt()` once per event. */
export function clearPending(): void {
  pending = null;
  emit();
}
