import { useEffect, useRef } from "react";

/**
 * Re-runs `refresh` on a timer for as long as `active` is true.
 *
 * This exists because the product had no way to notice that work had finished.
 * Avatar generation and video rendering both happen on HeyGen and take minutes;
 * the app fetched their status once, on mount, and then sat there. The only way
 * to find out whether your avatar was ready was to press a small circular
 * arrow on the card — so the product's answer to "is this done yet?" was to ask
 * the person to poll it by hand, indefinitely, with no indication that pressing
 * the button was even the thing to do.
 *
 * Three behaviours make this safe to leave running:
 *
 * BACKOFF. The first checks are quick, because most things finish fast and a
 * result that appears within seconds feels instant. If it is still going after
 * a minute it is a slow render, and asking every five seconds for ten minutes
 * is 120 pointless requests — so the interval grows toward `maxInterval`.
 *
 * VISIBILITY. A backgrounded tab polls nothing. Browsers already throttle timers
 * in hidden tabs, but not reliably or consistently, and a laptop with twelve
 * tabs open should not be making requests for a screen nobody is looking at.
 * The moment the tab is shown again it refreshes immediately, so coming back to
 * it always shows current state rather than whatever was true when you left.
 *
 * NO OVERLAP. If a refresh is still in flight when the next tick fires, the
 * tick is skipped. On a slow connection an interval shorter than the response
 * time otherwise queues requests faster than they resolve.
 */

interface PollOptions {
  /** First delay, in ms. */
  interval?: number;
  /** Ceiling the delay grows to. */
  maxInterval?: number;
  /** Multiplier applied after each tick. */
  factor?: number;
}

export function usePollWhile(
  active: boolean,
  refresh: () => void | Promise<void>,
  { interval = 5000, maxInterval = 30000, factor = 1.4 }: PollOptions = {}
) {
  /*
    `refresh` is almost always an inline closure, so it is a new function on
    every render. Held in a ref and read at tick time, the effect below depends
    only on `active` — otherwise the timer would be torn down and recreated on
    every render, which in practice means it never fires at all.
  */
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  const inFlight = useRef(false);

  useEffect(() => {
    if (!active) return undefined;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let delay = interval;
    let cancelled = false;

    const run = async () => {
      if (cancelled || document.hidden || inFlight.current) return;
      inFlight.current = true;
      try {
        await refreshRef.current();
      } catch {
        // Swallowed on purpose. This is a background refresh the person did not
        // ask for; a failed one should leave the last good data on screen, not
        // raise an error toast over whatever they are doing. A genuinely broken
        // API surfaces through the actions they DO take.
      } finally {
        inFlight.current = false;
      }
    };

    const schedule = () => {
      timer = setTimeout(async () => {
        await run();
        delay = Math.min(delay * factor, maxInterval);
        if (!cancelled) schedule();
      }, delay);
    };

    const onVisible = () => {
      if (document.hidden) return;
      // Back on screen: show current state now, and restart the backoff so a
      // tab left open for an hour does not resume at its slowest interval.
      delay = interval;
      void run();
    };

    schedule();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [active, interval, maxInterval, factor]);
}

export default usePollWhile;
