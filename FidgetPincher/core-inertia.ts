import { TransformationMatrix } from './TransformationMatrix';
import { Pinch } from './core-math';

interface InertiaOptions {
  minimumTime: number;
  minimumSnapshots: number;
  brakingTime: number;
  maximumPinchReleaseTime: number; // maximum time between 2 touches to be considered as pinch release
}

function defaultOptions(): InertiaOptions {
  return {
    minimumTime: 100,
    minimumSnapshots: 3,
    brakingTime: 1000,
    maximumPinchReleaseTime: 300
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

//

export interface PinchInertia {
  angularVelocity: number;
  scalingConstant: number;
  transformOrigin: { x: number, y: number } | null;
  velocityX: number;
  velocityY: number;
}

export function calculatePinchInertia(
  pinchHistory: PinchSnapshot[],
  options?: InertiaOptions
): PinchInertia | null {
  options = completeOptions(options);

  if (pinchHistory.length < options.minimumSnapshots) {
    return null;
  }
  const inertia = calculateInertia(
    pinchHistory.map(s => ({ deltas: [], dt: s.dt })),
    options
  );
  // calculate transform of last [count] pinch
  let transform = TransformationMatrix.identity();
  for (const snapshot of pinchHistory.slice(-inertia.count)) {
    const { dx, dy, scale, rotation, prevCentroid } = snapshot.pinch;
    const actions = [
      TransformationMatrix.translation(-prevCentroid.x, -prevCentroid.y),
      TransformationMatrix.rotation(rotation),
      TransformationMatrix.scale(scale, scale),
      TransformationMatrix.translation(dx, dy),
      TransformationMatrix.translation(prevCentroid.x, prevCentroid.y)
    ];
    for (const action of actions) {
      transform = action.multiplyMatrix(transform);
    }
  }

  const { translateX, translateY, scale, rotate } = transform.decompose();
  const angularVelocity = rotate / inertia.time;
  const scalingConstant = Math.pow(scale, 1 / inertia.time);
  const transformOrigin = transform.calculateTransformOrigin();
  const velocityX = translateX / inertia.time;
  const velocityY = translateY / inertia.time;

  return {
    angularVelocity,
    scalingConstant,
    transformOrigin,
    velocityX,
    velocityY
  };
}

export function applyPinchInertia(
  inertia: PinchInertia,
  callback: (transform: TransformationMatrix) => void,
  options?: InertiaOptions
): InertiaApplyResult {
  if (inertia.transformOrigin === null) {
    return applyTranslateInertia(
      { vx: inertia.velocityX, vy: inertia.velocityY },
      (dx, dy) => {
        callback(TransformationMatrix.translation(dx, dy));
      },
      options
    );
  }
  options = completeOptions(options);
  const { x, y } = inertia.transformOrigin;
  let r = 0;
  let s = 1;
  return applyInertia(options,
    ({ mappedTime }) => {
      const rotation = inertia.angularVelocity * mappedTime - r;
      const scale = Math.pow(inertia.scalingConstant, mappedTime) / s;
      r += rotation;
      s *= scale;
      const actions = [
        TransformationMatrix.translation(-x, -y),
        TransformationMatrix.rotation(rotation),
        TransformationMatrix.scale(scale, scale),
        TransformationMatrix.translation(x, y),
      ];
      let transform = TransformationMatrix.identity();
      for (const action of actions) {
        transform = action.multiplyMatrix(transform);
      }
      callback(transform);
    }
  );
}

export function isPinchRelease(time: number, options?: InertiaOptions): boolean {
  options = completeOptions(options);
  return time < options.maximumPinchReleaseTime;
}
