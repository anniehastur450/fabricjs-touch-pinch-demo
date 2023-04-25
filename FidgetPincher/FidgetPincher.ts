import { TransformationMatrix } from './TransformationMatrix';
import { FidgetPincherOptions, Impl, ImplPointer } from './core-impl';

interface TouchElementOptions {
  onTransformed?: (transform: TransformationMatrix) => void;
}

type TouchIdentifier = 'mouse' | number;

interface TouchElementEvents {
  mousedown: (event: MouseEvent) => void;
  mousemove: (event: MouseEvent) => void;
  mouseup: (event: MouseEvent) => void;
  touchstart: (event: TouchEvent) => void;
  touchmove: (event: TouchEvent) => void;
  touchend: (event: TouchEvent) => void;
}

function defaultOptions(): FidgetPincherOptions {
  return {
    enableInertia: true,
    enableTranslateInertia: true,
    enableFidgetSpinInertia: true,
    enablePinchInertia: true,
    stopTranslateInertiaOnTouch: true,
    stopFidgetSpinInertiaOnPinch: true,
    stopFidgetSpinInertiaOnTouch: true,
    stopPinchInertiaOnPinch: true,
    stopPinchInertiaOnTouch: true,
    stopFidgetSpinInertiaOnPinchInertia: true,
  }
}

export class FidgetPincher {
  private impl: Impl
  private pointerMap: Map<TouchIdentifier, ImplPointer>;

  constructor(
    options?: Partial<FidgetPincherOptions>
  ) {
    this.impl = new Impl({
      ...defaultOptions(),
      ...options
    });
    this.pointerMap = new Map();
  }

  setOptions(options: Partial<FidgetPincherOptions>) {
    this.impl.setOptions({
      ...defaultOptions(),
      ...options
    });
  }

  private addPointer(id: TouchIdentifier, x: number, y: number, t: number) {
    const pointer = this.impl.addPointer(x, y, t);
    this.pointerMap.set(id, pointer);
  }

  private movePointer(id: TouchIdentifier, x: number, y: number, t: number) {
    const pointer = this.pointerMap.get(id);
    if (pointer) {
      pointer.move(x, y, t);
    }
  }

  private removePointer(id: TouchIdentifier) {
    const pointer = this.pointerMap.get(id);
    if (pointer) {
      pointer.remove();
    }
  }

  setTouchElement(element: HTMLElement, options: TouchElementOptions) {
    const events = this.createEvents(element);
    element.addEventListener('mousedown', events.mousedown);
    element.addEventListener('touchstart', events.touchstart);
    element.addEventListener('touchmove', events.touchmove);
    element.addEventListener('touchend', events.touchend);
    if (options.onTransformed !== undefined) {
      this.impl.addTransformedCallback(options.onTransformed);
    }
  }

  getTransform(): TransformationMatrix {
    return this.impl.transform;
  }

  // won't trigger onTransformed callback
  setTransform(transform: TransformationMatrix) {
    this.impl.transform = transform;
  }

  // call this function when browser default touch events should interrupt the operation
  // e.g. page zoom, scroll, text selection, etc.
  clearTouchPointers() {
    this.pointerMap.clear();
    this.impl.pointers = [];
  }

  private createEvents(element: HTMLElement): TouchElementEvents {
    const events: TouchElementEvents = {
      mousedown: (event) => {
        // register mousemove and mouseup
        window.addEventListener('mousemove', events.mousemove);
        window.addEventListener('mouseup', events.mouseup);
        // map cursor x y relative to element center
        const { clientX: x, clientY: y } = event;
        const { left, top, width, height } = element.getBoundingClientRect();
        const cx = left + width / 2;
        const cy = top + height / 2;
        const dx = x - cx;
        const dy = y - cy;
        const t = performance.now();
        this.addPointer('mouse', dx, dy, t);
      },
      mousemove: (event) => {
        // map cursor x y relative to element center
        const { clientX: x, clientY: y } = event;
        const { left, top, width, height } = element.getBoundingClientRect();
        const cx = left + width / 2;
        const cy = top + height / 2;
        const dx = x - cx;
        const dy = y - cy;
        const t = performance.now();
        this.movePointer('mouse', dx, dy, t);
      },
      mouseup: (event) => {
        // unregister mousemove and mouseup
        window.removeEventListener('mousemove', events.mousemove);
        window.removeEventListener('mouseup', events.mouseup);
        // map cursor x y relative to element center
        const { clientX: x, clientY: y } = event;
        const { left, top, width, height } = element.getBoundingClientRect();
        const cx = left + width / 2;
        const cy = top + height / 2;
        const dx = x - cx;
        const dy = y - cy;
        const t = performance.now();
        this.movePointer('mouse', dx, dy, t);
        this.removePointer('mouse');
      },
      touchstart: (event) => {
        // map touches x y relative to element center
        const { left, top, width, height } = element.getBoundingClientRect();
        const cx = left + width / 2;
        const cy = top + height / 2;
        const t = performance.now();
        for (const touch of event.changedTouches) {
          const { identifier, clientX: x, clientY: y } = touch;
          const dx = x - cx;
          const dy = y - cy;
          this.addPointer(identifier, dx, dy, t);
        }
      },
      touchmove: (event) => {
        // map touches x y relative to element center
        const { left, top, width, height } = element.getBoundingClientRect();
        const cx = left + width / 2;
        const cy = top + height / 2;
        const t = performance.now();
        for (const touch of event.changedTouches) {
          const { identifier, clientX: x, clientY: y } = touch;
          const dx = x - cx;
          const dy = y - cy;
          this.movePointer(identifier, dx, dy, t);
        }
      },
      touchend: (event) => {
        // map touches x y relative to element center
        const { left, top, width, height } = element.getBoundingClientRect();
        const cx = left + width / 2;
        const cy = top + height / 2;
        const t = performance.now();
        for (const touch of event.changedTouches) {
          const { identifier, clientX: x, clientY: y } = touch;
          const dx = x - cx;
          const dy = y - cy;
          this.movePointer(identifier, dx, dy, t);
          this.removePointer(identifier);
        }
      }
    }
    return events;
  }

}
