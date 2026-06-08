// Lightweight wrappers around canvas-confetti. We lazy-load the library on demand
// so it never runs during SSR and only ships to the client when something fires.

const BRAND_COLORS = ["#58cc02", "#84d62f", "#ffc800", "#ffdd4d", "#46a302"];

type ConfettiFn = (opts: Record<string, unknown>) => void;

async function load(): Promise<ConfettiFn | null> {
  if (typeof window === "undefined") return null;
  // Tolerate either default or namespace export shape.
  const mod = (await import("canvas-confetti")) as unknown as {
    default?: ConfettiFn;
  } & ConfettiFn;
  return (mod.default ?? mod) as ConfettiFn;
}

// Quick reward pop — used when a meal is committed to the log.
export async function burstConfetti(): Promise<void> {
  const confetti = await load();
  if (!confetti) return;
  confetti({
    particleCount: 90,
    spread: 75,
    startVelocity: 38,
    origin: { y: 0.7 },
    colors: BRAND_COLORS,
    scalar: 0.95,
    disableForReducedMotion: true,
  });
}

// Big celebration — used when the user nails their calorie target for the day.
export async function celebrateConfetti(): Promise<void> {
  const confetti = await load();
  if (!confetti) return;

  confetti({
    particleCount: 140,
    spread: 100,
    startVelocity: 45,
    origin: { y: 0.6 },
    colors: BRAND_COLORS,
    scalar: 1.1,
    disableForReducedMotion: true,
  });

  // Streamers in from both bottom corners.
  const end = Date.now() + 850;
  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.85 },
      colors: BRAND_COLORS,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.85 },
      colors: BRAND_COLORS,
      disableForReducedMotion: true,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
