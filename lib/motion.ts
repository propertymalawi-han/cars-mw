export const motionMs = {
  page: 200,
  overlay: 220,
  overlayExit: 200,
  fade: 150,
  routeDelay: 300,
} as const;

export const motionEase = {
  out: [0, 0, 0.2, 1] as const,
  in: [0.4, 0, 1, 1] as const,
};

export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
  transition: {
    duration: motionMs.page / 1000,
    ease: motionEase.out,
  },
};

/** Radix open/close: ease-out in, ease-in out, 200–250ms. */
export const overlayPresenceClass =
  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:duration-overlay data-[state=closed]:duration-overlay-exit data-[state=open]:ease-out data-[state=closed]:ease-in";

export const overlayPanelClass = `${overlayPresenceClass} data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2`;
