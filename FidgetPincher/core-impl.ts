import { TransformationMatrix } from './TransformationMatrix';
import { InertiaApplyResult, TranslationSnapshot, applyTranslateInertia, calculateTranslateInertia } from './core-inertia';
import { calculatePinch } from './core-math';

export interface FidgetPincherOptions {
  enableInertia: boolean; // set to false implies all other inertia options are false
  enableTranslateInertia: boolean; // inertia when touches from 1 to 0
  enableFidgetSpinInertia: boolean; // inertia when touches from 2 to 1
  enablePinchInertia: boolean; // inertia when touches from 2 to 0
}

interface GetSet<T> {
  get(): T;
  set(value: T): void;
}

class ImplInertia {
  private t: number = 0;
  private translations: TranslationSnapshot[] = [];
  private translationApplyResult: InertiaApplyResult | null = null;

  constructor(
    private options: FidgetPincherOptions,
    private transform: GetSet<TransformationMatrix>
  ) {

  }

  onStart(touches: number, t: number) {
    this.translations = [];
    if (touches === 1) {
      this.translationApplyResult?.stop();
      this.translationApplyResult = null;
    }
    this.t = t;
  }

  onTranslate(dx: number, dy: number, t: number) {
    const dt = t - this.t;
    this.translations.push({ dx, dy, dt });
    this.t = t;
  }

  onPinch(t: number) {

  }

  onEnd(touches: number) {
    if (!this.options.enableInertia) {
      return;
    }
    if (touches === 0 && this.options.enableTranslateInertia) {
      const inertia = calculateTranslateInertia(this.translations);
      if (inertia) {
        const result = applyTranslateInertia(inertia, (dx, dy) => {
          let transform = this.transform.get();
          transform = TransformationMatrix.translation(dx, dy).multiplyMatrix(transform);
          this.transform.set(transform);
        });
        this.translationApplyResult = result;
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
      const { dx, dy, scale, rotation, prevCentroid } = calculatePinch(prevPoints, nextPoints);
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
      this.owner.inertia.onPinch(t);
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
    this.inertia = new ImplInertia(options, {
      get: () => this.transform,
      set: (value) => {
        this.transform = value;
        this.notifyTransformed();
      }
    });
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
