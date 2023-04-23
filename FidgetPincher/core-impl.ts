import { TransformationMatrix } from './TransformationMatrix';
import { calculatePinch } from './core-math';

export interface FidgetPincherOptions {
  enableInertia: boolean;
}

export class ImplPointer {
  constructor(
    private owner: Impl,
    public x: number,
    public y: number,
    public t: number,
  ) {

  }

  // corresponding to mousemove or touchmove
  move(x: number, y: number, t: number) {
    if (this.owner.pointers.length === 1) {
      const dx = x - this.x;
      const dy = y - this.y;
      const dt = t - this.t;
      this.owner.transform = TransformationMatrix.translation(dx, dy).multiplyMatrix(this.owner.transform);
      this.x = x;
      this.y = y;
      this.t = t;
      this.owner.notifyTransformed();
    } else if (this.owner.pointers.length >= 2) {
      const prevPoints = this.owner.pointers.map(p => ({ x: p.x, y: p.y }));
      this.x = x;
      this.y = y;
      this.t = t;
      const nextPoints = this.owner.pointers.map(p => ({ x: p.x, y: p.y }));
      const { dx, dy, scale, rotation, prevCentroid, nextCentroid } = calculatePinch(prevPoints, nextPoints);
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
      this.owner.notifyTransformed();
    }
  }

  // corresponding to mouseup or touchend
  remove() {
    const index = this.owner.pointers.indexOf(this);
    if (index >= 0) {
      this.owner.pointers.splice(index, 1);
    }
  }
}

export class Impl {
  pointers: ImplPointer[];
  transform: TransformationMatrix;
  transformedCallbacks: ((transform: TransformationMatrix) => void)[] = [];

  constructor(
    private options: FidgetPincherOptions
  ) {
    this.pointers = [];
    this.transform = TransformationMatrix.identity();
    // test
    (window as any).zoomMatrix = () => {
      this.transform = TransformationMatrix.scale(1.1, 1.1).multiplyMatrix(this.transform);
      this.notifyTransformed();
    }
    (window as any).rotateMatrix = () => {
      this.transform = TransformationMatrix.rotation(0.1).multiplyMatrix(this.transform);
      this.notifyTransformed();
    }
  }

  // corresponding to mousedown or touchstart
  addPointer(x: number, y: number, t: number): ImplPointer {
    const pointer = new ImplPointer(this, x, y, t);
    this.pointers.push(pointer);
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
