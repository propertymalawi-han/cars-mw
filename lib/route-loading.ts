import { motionMs } from "@/lib/motion";

const SHOW_DELAY_MS = motionMs.routeDelay;
const SAFETY_TIMEOUT_MS = 15_000;

type Listener = (visible: boolean) => void;

let pendingNav = false;
let suspenseCount = 0;
let visible = false;
let showTimer: number | null = null;
let safetyTimer: number | null = null;
let completeTimer: number | null = null;
let installed = false;
let navId = 0;
const listeners = new Set<Listener>();

function isBusy() {
  return pendingNav || suspenseCount > 0;
}

function emit() {
  listeners.forEach((listener) => listener(visible));
}

function clearTimer(id: number | null) {
  if (id != null) window.clearTimeout(id);
  return null;
}

function hide() {
  showTimer = clearTimer(showTimer);
  safetyTimer = clearTimer(safetyTimer);
  completeTimer = clearTimer(completeTimer);
  pendingNav = false;
  if (!visible) return;
  visible = false;
  emit();
}

function scheduleShow() {
  if (visible || showTimer != null) return;
  showTimer = window.setTimeout(() => {
    showTimer = null;
    if (!isBusy()) return;
    visible = true;
    emit();
  }, SHOW_DELAY_MS);
}

function armSafety() {
  safetyTimer = clearTimer(safetyTimer);
  safetyTimer = window.setTimeout(() => hide(), SAFETY_TIMEOUT_MS);
}

export function startRouteNavigation() {
  navId += 1;
  completeTimer = clearTimer(completeTimer);
  pendingNav = true;
  scheduleShow();
  armSafety();
}

export function completeRouteNavigation() {
  pendingNav = false;
  if (suspenseCount > 0) return;
  hide();
}

export function completeRouteNavigationSoon() {
  const id = navId;
  completeTimer = clearTimer(completeTimer);
  pendingNav = false;
  completeTimer = window.setTimeout(() => {
    completeTimer = null;
    if (id !== navId) return;
    if (suspenseCount > 0 && document.querySelector("[data-route-loading-signal]")) {
      return;
    }
    suspenseCount = 0;
    hide();
  }, 100);
}

export function beginRouteSuspense() {
  completeTimer = clearTimer(completeTimer);
  suspenseCount += 1;
  pendingNav = true;
  scheduleShow();
  armSafety();
}

export function endRouteSuspense() {
  suspenseCount = Math.max(0, suspenseCount - 1);
  if (suspenseCount > 0) return;
  pendingNav = false;
  hide();
}

export function notifyRouteTemplateReady() {
  completeRouteNavigationSoon();
}

export function subscribeRouteLoading(listener: Listener) {
  listeners.add(listener);
  listener(visible);
  return () => {
    listeners.delete(listener);
  };
}

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

function isInternalNavigation(anchor: HTMLAnchorElement) {
  if (anchor.target && anchor.target !== "" && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return false;
  }
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return false;
  if (url.pathname === window.location.pathname && url.search === window.location.search) {
    return false;
  }
  return true;
}

export function installRouteLoadingListeners() {
  if (installed || typeof window === "undefined") return () => undefined;
  installed = true;

  const onClick = (event: MouseEvent) => {
    if (isModifiedClick(event)) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const anchor = target.closest("a");
    if (!(anchor instanceof HTMLAnchorElement)) return;
    if (!isInternalNavigation(anchor)) return;
    startRouteNavigation();
  };

  const onPopState = () => {
    startRouteNavigation();
  };

  document.addEventListener("click", onClick, true);
  window.addEventListener("popstate", onPopState);

  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);

  history.pushState = ((...args: Parameters<History["pushState"]>) => {
    const nextUrl = args[2];
    const changed = Boolean(nextUrl) && String(nextUrl) !== `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const result = originalPushState(...args);
    if (changed) completeRouteNavigationSoon();
    return result;
  }) as History["pushState"];

  history.replaceState = ((...args: Parameters<History["replaceState"]>) => {
    const nextUrl = args[2];
    const changed =
      Boolean(nextUrl) &&
      String(nextUrl) !== `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const result = originalReplaceState(...args);
    if (changed) completeRouteNavigationSoon();
    return result;
  }) as History["replaceState"];

  return () => {
    document.removeEventListener("click", onClick, true);
    window.removeEventListener("popstate", onPopState);
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
    installed = false;
  };
}
