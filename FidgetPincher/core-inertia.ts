
interface InertiaOptions {
  minimumTime: number;
  minimumSnapshots: number;
  brakingTime: number;
}

function defaultOptions(): InertiaOptions {
  return {
    minimumTime: 100,
    minimumSnapshots: 3,
    brakingTime: 1000
  }
}

function completeOptions(options?: InertiaOptions): InertiaOptions {
  return {
    ...defaultOptions(),
    ...options
  }
}

interface Snapshot {
  deltas: number[];
  dt: number;
}

interface SnapshotInertia {
  velocities: number[];
  time: number;
}

function calculateInertia(history: Snapshot[], options: InertiaOptions): SnapshotInertia {
  if (history.length < options.minimumSnapshots) {
    throw new Error('Not enough snapshots');
  }
  let dt = 0;
  let deltas: number[] = Array(history[0].deltas.length).fill(0);
  let count = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    const snapshot = history[i];
    dt += snapshot.dt;
    for (let j = 0; j < snapshot.deltas.length; j++) {
      deltas[j] += snapshot.deltas[j];
    }
    count++;
    if (dt >= options.minimumTime && count >= options.minimumSnapshots) {
      break;
    }
  }
  return {
    velocities: deltas.map(d => d / dt),
    time: dt
  };
}

//

export interface TranslationSnapshot {
  dx: number;
  dy: number;
  dt: number;
}

export interface TranslationInertia {
  vx: number;
  vy: number;
}

export function calculateTranslateInertia(
  translationHistory: TranslationSnapshot[],
  options?: InertiaOptions
): TranslationInertia | null {
  options = completeOptions(options);

  if (translationHistory.length < options.minimumSnapshots) {
    return null;
  }
  const inertia = calculateInertia(
    translationHistory.map(s => ({ deltas: [s.dx, s.dy], dt: s.dt })),
    options
  );
  const [vx, vy] = inertia.velocities;
  return { vx, vy };
}

export interface InertiaApplyResult {
  isRunning(): boolean;
  stop(): void;
}

export function applyTranslateInertia(
  inertia: TranslationInertia,
  callback: (dx: number, dy: number) => void,
  options?: InertiaOptions
): InertiaApplyResult {
  options = completeOptions(options);
  const { brakingTime } = options;
  const start = performance.now();
  function factor(t: number) {
    const elapsed = t - start;
    return elapsed > brakingTime ? 0 : 1 - elapsed / brakingTime;
  }

  let running = true;
  let t = start;
  let task = requestAnimationFrame(animate);

  function animate(now: number) {
    if (!running) {
      return;
    }
    const dt = now - t;
    t = now;
    const f = factor(now);
    const dx = inertia.vx * dt * f;
    const dy = inertia.vy * dt * f;
    callback(dx, dy);
    if (f > 0) {
      task = requestAnimationFrame(animate);
    } else {
      running = false;
    }
  }

  return {
    isRunning: () => running,
    stop: () => {
      running = false;
      cancelAnimationFrame(task);
    }
  }
}
