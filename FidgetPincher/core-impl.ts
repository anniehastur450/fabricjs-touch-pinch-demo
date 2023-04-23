import { TransformationMatrix } from './TransformationMatrix';

export interface FidgetPincherOptions {
  enableInertia: boolean;
}

export class ImplPointer {
  constructor(
    private owner: Impl,
    private x: number,
    private y: number,
    private t: number,
  ) {

  }

  // corresponding to mousemove or touchmove
  move(x: number, y: number, t: number) {
    if (this.owner.pointers.length === 1) {
      const dx = x - this.x;
      const dy = y - this.y;
      const dt = t - this.t;
      this.owner.transform = TransformationMatrix.translation(dx, dy).multiplyMatrix(this.owner.transform);
    }
    this.x = x;
    this.y = y;
    this.t = t;
    this.owner.notifyTransformed();
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
