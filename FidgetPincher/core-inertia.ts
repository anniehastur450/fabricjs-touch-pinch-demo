import { Pinch } from './core-math';

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
  count: number;
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
    time: dt,
    count
  };
}

export interface InertiaApplyResult {
  isRunning(): boolean;
  stop(): void;
}

interface InertiaApplyCallbackDetails {
  mappedTime: number; // normal time is mapped to simulate deceleration effect
}

function applyInertia(
  options: InertiaOptions,
  callback: (details: InertiaApplyCallbackDetails) => void
): InertiaApplyResult {
  const { brakingTime } = options;
  const start = performance.now();

  let running = true;
  let task = requestAnimationFrame(animate);

  function animate(now: number) {
    if (!running) {
      return;
    }
    const elapsed = now - start;
    const dt = Math.min(elapsed, brakingTime);
    const mappedTime = dt * (1 - dt / (2 * brakingTime));
    callback({ mappedTime });
    if (elapsed < brakingTime) {
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

export function applyTranslateInertia(
  inertia: TranslationInertia,
  callback: (dx: number, dy: number) => void,
  options?: InertiaOptions
): InertiaApplyResult {
  options = completeOptions(options);
  let sx = 0;
  let sy = 0;
  return applyInertia(options,
    ({ mappedTime }) => {
      const dx = inertia.vx * mappedTime - sx;
      const dy = inertia.vy * mappedTime - sy;
      sx += dx;
      sy += dy;
      callback(dx, dy);
    }
  );
}

//

export interface PinchSnapshot {
  pinch: Pinch;
  dt: number;
}

export interface FidgetSpinInertia {
  angularVelocity: number;
  scalingConstant: number;
}

export function calculateFidgetSpinInertia(
  pinchHistory: PinchSnapshot[],
  options?: InertiaOptions
): FidgetSpinInertia | null {
  options = completeOptions(options);

  if (pinchHistory.length < options.minimumSnapshots) {
    return null;
  }
  const inertia = calculateInertia(
    pinchHistory.map(s => ({ deltas: [s.pinch.rotation], dt: s.dt })),
    options
  );
  const [angularVelocity] = inertia.velocities;
  // calculate product of last [count] scales
  const scaleProduct = pinchHistory
    .slice(-inertia.count)
    .map(s => s.pinch.scale)
    .reduce((a, b) => a * b, 1);
  // calculate scaling constant
  // scale(t) = scalingConstant ^ t
  const scalingConstant = Math.pow(scaleProduct, 1 / inertia.time);

  return { angularVelocity, scalingConstant };
}

export function applyFidgetSpinInertia(
  inertia: FidgetSpinInertia,
  callback: (rotation: number, scale: number) => void,
  options?: InertiaOptions
): InertiaApplyResult {
  options = completeOptions(options);
  let r = 0;
  let s = 1;
  return applyInertia(options,
    ({ mappedTime }) => {
      const rotation = inertia.angularVelocity * mappedTime - r;
      const scale = Math.pow(inertia.scalingConstant, mappedTime) / s;
      r += rotation;
      s *= scale;
      callback(rotation, scale);
    }
  );
}
