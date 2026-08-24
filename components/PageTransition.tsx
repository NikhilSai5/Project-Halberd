import { useEffect, useRef, useState } from "react";

/*
 * "exit"  - old page plays the close animation (page-window-close)
 * "swap"  - old page is replaced instantly, without any animation
 * "enter" - new page plays the open animation (page-window-open)
 */
type TransitionPhase = "idle" | "exit" | "swap" | "enter";

const EXIT_DURATION_MS = 220;
const ENTER_DURATION_MS = 550;

interface PageTransitionProps<K extends string> {
  pageKey: K;
  renderPage: (pageKey: K) => React.ReactNode;
  /*
   * Whether navigating TO the given key should play the close
   * animation on the current page. Defaults to true.
   */
  animateExitFor?: (pageKey: K) => boolean;
  /*
   * Whether the given key should play the open animation when it
   * appears. Defaults to true.
   */
  animateEnterFor?: (pageKey: K) => boolean;
}

const alwaysAnimate = () => true;

/*
 * Windows-style window transition for navbar navigation.
 *
 * Only reacts to changes of `pageKey` (the active navbar target):
 *   1. If animateExitFor(newKey) returns true, the current page gets
 *      `.page-window-exit` (shrinks and sinks toward the bottom-center).
 *      Otherwise it is swapped out instantly.
 *   2. After that, the new page is mounted. If animateEnterFor(newKey)
 *      returns true it gets `.page-window-enter` (rises up from below
 *      and expands into place, anchored at center bottom).
 *
 * Internal state changes inside pages never retrigger this component.
 */
export default function PageTransition<K extends string>({
  pageKey,
  renderPage,
  animateExitFor = alwaysAnimate,
  animateEnterFor = alwaysAnimate,
}: PageTransitionProps<K>) {
  const [displayedKey, setDisplayedKey] = useState(pageKey);
  const [phase, setPhase] = useState<TransitionPhase>("idle");

  const latestKeyRef = useRef(pageKey);
  const displayedKeyRef = useRef(pageKey);
  const isFirstRenderRef = useRef(true);

  /*
   * Predicates are stored in refs so inline arrow functions from the
   * parent never invalidate the effects below.
   */
  const animateExitForRef = useRef(animateExitFor);
  const animateEnterForRef = useRef(animateEnterFor);

  displayedKeyRef.current = displayedKey;
  animateExitForRef.current = animateExitFor;
  animateEnterForRef.current = animateEnterFor;

  /*
   * React to navbar target changes only.
   * The first run (initial app load) does not animate.
   */
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    latestKeyRef.current = pageKey;

    setPhase((currentPhase) => {
      if (currentPhase !== "idle") {
        /*
         * Already transitioning: keep it running; the timeout below
         * will pick up the latest requested key when it completes.
         */
        return currentPhase;
      }
      if (pageKey === displayedKeyRef.current) {
        return currentPhase;
      }
      return animateExitForRef.current(pageKey) ? "exit" : "swap";
    });
  }, [pageKey]);

  useEffect(() => {
    if (phase === "exit" || phase === "swap") {
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const delay = phase === "swap" || prefersReducedMotion ? 0 : EXIT_DURATION_MS;

      const timeoutId = window.setTimeout(() => {
        const nextKey = latestKeyRef.current;

        setDisplayedKey(nextKey);
        setPhase(animateEnterForRef.current(nextKey) ? "enter" : "idle");
      }, delay);

      return () => window.clearTimeout(timeoutId);
    }

    if (phase === "enter") {
      const timeoutId = window.setTimeout(() => {
        setPhase("idle");
      }, ENTER_DURATION_MS);

      return () => window.clearTimeout(timeoutId);
    }
  }, [phase]);

  const wrapperClassName =
    phase === "exit"
      ? "page-window-exit"
      : phase === "enter"
        ? "page-window-enter"
        : undefined;

  const isLeaving = phase === "exit" || phase === "swap";

  return (
    <div className={wrapperClassName} aria-hidden={isLeaving ? true : undefined}>
      {renderPage(displayedKey)}
    </div>
  );
}
