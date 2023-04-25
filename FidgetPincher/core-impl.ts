import { TransformationMatrix } from './TransformationMatrix';
import { InertiaApplyResult, PinchSnapshot, TranslationSnapshot, applyFidgetSpinInertia, applyPinchInertia, applyTranslateInertia, calculateFidgetSpinInertia, calculatePinchInertia, calculateTranslateInertia, isPinchRelease } from './core-inertia';
import { Pinch, calculatePinch } from './core-math';

export interface FidgetPincherOptions {
  enableInertia: boolean; // set to false implies all other inertia options are false
  enableTranslateInertia: boolean; // inertia when touches from 1 to 0
  enableFidgetSpinInertia: boolean; // inertia when touches from 2 to 1
  enablePinchInertia: boolean; // inertia when touches from 2 to 0
  stopTranslateInertiaOnTouch: boolean; // stop translate inertia when touches from 0 to 1
  stopFidgetSpinInertiaOnPinch: boolean; // stop fidget spin inertia when touches from 1 to 2
  stopFidgetSpinInertiaOnTouch: boolean; // stop fidget spin inertia when touches from 0 to 1
  stopPinchInertiaOnPinch: boolean; // stop pinch inertia when touches from 1 to 2
  stopPinchInertiaOnTouch: boolean; // stop pinch inertia when touches from 0 to 1
  stopFidgetSpinInertiaOnPinchInertia: boolean; // stop fidget spin inertia when pinch inertia is applied
}

interface Get<T> {
  get(): T;
}

interface GetSet<T> {
  get(): T;
  set(value: T): void;
}

class ImplInertia {
  private t: number = 0;
  private translations: TranslationSnapshot[] = [];
  private translationApplyResult: InertiaApplyResult | null = null;
  private pinches: PinchSnapshot[] = [];
  private fidgetSpinApplyResult: InertiaApplyResult | null = null;
  private fidgetSpinPivot: { x: number, y: number } = { x: 0, y: 0 };
  private pinchApplyResult: InertiaApplyResult | null = null;
  private pinchReleaseTimestamp: number = 0;
  private get options(): FidgetPincherOptions {
    return this.optionsGetter.get();
  }

  constructor(
    private optionsGetter: Get<FidgetPincherOptions>,
    private transform: GetSet<TransformationMatrix>,
    private __owner: Impl, // temp for fidget spin
  ) {

  }

  onStart(touches: number, t: number) {
    this.translations = [];
    if (touches === 1) {
      if (this.options.stopTranslateInertiaOnTouch) {
        this.translationApplyResult?.stop();
        this.translationApplyResult = null;
      }
      if (this.options.stopFidgetSpinInertiaOnTouch) {
        this.fidgetSpinApplyResult?.stop();
        this.fidgetSpinApplyResult = null;
      }
      if (this.options.stopPinchInertiaOnTouch) {
        this.pinchApplyResult?.stop();
        this.pinchApplyResult = null;
      }
    } else if (touches === 2) {
      this.pinches = [];
      if (this.options.stopFidgetSpinInertiaOnPinch) {
        this.fidgetSpinApplyResult?.stop();
        this.fidgetSpinApplyResult = null;
      }
      if (this.options.stopPinchInertiaOnPinch) {
        this.pinchApplyResult?.stop();
        this.pinchApplyResult = null;
      }
    }
    this.t = t;
  }

  onTranslate(dx: number, dy: number, t: number) {
    /* update fidget spin pivot */
    this.fidgetSpinPivot.x = this.__owner.pointers[0].x;
    this.fidgetSpinPivot.y = this.__owner.pointers[0].y;
    /* update fidget spin pivot end */
    const dt = t - this.t;
    this.translations.push({ dx, dy, dt });
    this.t = t;
  }

  onPinch(pinch: Pinch, t: number) {
    const dt = t - this.t;
    this.pinches.push({ pinch, dt });
    this.t = t;
  }

  onEnd(touches: number) {
    if (!this.options.enableInertia) {
      return;
    }
    if (touches === 1) {
      this.pinchReleaseTimestamp = this.t;
    }
    if (touches === 0 && this.options.enablePinchInertia) {
      if (isPinchRelease(this.t - this.pinchReleaseTimestamp)) {
        this.pinchReleaseTimestamp = 0;
        if (this.options.stopFidgetSpinInertiaOnPinchInertia) {
          this.fidgetSpinApplyResult?.stop();
          this.fidgetSpinApplyResult = null;
        }
        const inertia = calculatePinchInertia(this.pinches);
        if (inertia) {
          const result = applyPinchInertia(inertia, (action) => {
            let transform = this.transform.get();
            transform = action.multiplyMatrix(transform);
            this.transform.set(transform);
          });
          this.pinchApplyResult = result;
        }
        return;
      }
    }
    if (touches === 0 && this.options.enableTranslateInertia) {
      const inertia = calculateTranslateInertia(this.translations);
      if (inertia) {
        const result = applyTranslateInertia(inertia, (dx, dy) => {
          /* update fidget spin pivot */
          this.fidgetSpinPivot.x += dx;
          this.fidgetSpinPivot.y += dy;
          /* update fidget spin pivot end */
          let transform = this.transform.get();
          transform = TransformationMatrix.translation(dx, dy).multiplyMatrix(transform);
          this.transform.set(transform);
        });
        this.translationApplyResult = result;
      }
    }
    if (touches === 1 && this.options.enableFidgetSpinInertia) {
      const inertia = calculateFidgetSpinInertia(this.pinches);
      if (inertia) {
        const result = applyFidgetSpinInertia(inertia, (rotation, scale) => {
          const { x, y } = this.fidgetSpinPivot;
          let transform = this.transform.get();
          const actions = [
            TransformationMatrix.translation(-x, -y),
            TransformationMatrix.rotation(rotation),
            TransformationMatrix.scale(scale, scale),
            TransformationMatrix.translation(x, y),
          ];
          for (const action of actions) {
            transform = action.multiplyMatrix(transform);
          }
          this.transform.set(transform);
        });
        this.fidgetSpinApplyResult = result;
      }
    }
  }

}

export class ImplPointer {
  constructor(
    private owner: Impl,
    public x: number,
    public y: number,
  ) {

  }

  // corresponding to mousemove or touchmove
  move(x: number, y: number, t: number) {
    if (this.owner.pointers.length === 1) {
      const dx = x - this.x;
      const dy = y - this.y;
      this.owner.transform = TransformationMatrix.translation(dx, dy).multiplyMatrix(this.owner.transform);
      this.x = x;
      this.y = y;
      this.owner.inertia.onTranslate(dx, dy, t);
      this.owner.notifyTransformed();
    } else if (this.owner.pointers.length >= 2) {
      const prevPoints = this.owner.pointers.map(p => ({ x: p.x, y: p.y }));
      this.x = x;
      this.y = y;
      const nextPoints = this.owner.pointers.map(p => ({ x: p.x, y: p.y }));
      const pinch = calculatePinch(prevPoints, nextPoints);
      const { dx, dy, scale, rotation, prevCentroid } = pinch;
      const actions = [
        TransformationMatrix.translation(-prevCentroid.x, -prevCentroid.y),
        TransformationMatrix.rotation(rotation),
        TransformationMatrix.scale(scale, scale),
        TransformationMatrix.translation(dx, dy),
        TransformationMatrix.translation(prevCentroid.x, prevCentroid.y)
      ];
      for (const action of actions) {
        this.owner.transform = action.multiplyMatrix(this.owner.transform);
      }
      this.owner.inertia.onPinch(pinch, t);
      this.owner.notifyTransformed();
    }
  }

  // corresponding to mouseup or touchend
  remove() {
    const index = this.owner.pointers.indexOf(this);
    if (index >= 0) {
      this.owner.pointers.splice(index, 1);
    }
    this.owner.inertia.onEnd(this.owner.pointers.length);
  }
}

export class Impl {
  pointers: ImplPointer[];
  transform: TransformationMatrix;
  inertia: ImplInertia;
  transformedCallbacks: ((transform: TransformationMatrix) => void)[] = [];

  constructor(
    private options: FidgetPincherOptions
  ) {
    this.pointers = [];
    this.transform = TransformationMatrix.identity();
    this.inertia = new ImplInertia(
      {
        get: () => this.options,
      },
      {
        get: () => this.transform,
        set: (value) => {
          this.transform = value;
          this.notifyTransformed();
        }
      },
      this
    );
  }

  setOptions(options: FidgetPincherOptions) {
    this.options = options;
  }

  // corresponding to mousedown or touchstart
  addPointer(x: number, y: number, t: number): ImplPointer {
    const pointer = new ImplPointer(this, x, y);
    this.pointers.push(pointer);
    this.inertia.onStart(this.pointers.length, t);
    return pointer;
  }

  addTransformedCallback(callback: (transform: TransformationMatrix) => void) {
    this.transformedCallbacks.push(callback);
  }

  notifyTransformed() {
    for (const callback of this.transformedCallbacks) {
      try {
        callback(this.transform);
      } catch (e) {
        console.error(e);
      }
    }
  }

}
