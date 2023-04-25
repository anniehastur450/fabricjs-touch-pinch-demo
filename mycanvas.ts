import { calculateFit, loadImage } from './utils/utils';

import POLAR_IMG_SRC from './images/cute-white-polar-bear.png'
import { FidgetPincher } from './FidgetPincher/FidgetPincher';
import { addStateFidgetPincherOptionsChangedCallback, stateGetFidgetPincherOptions } from './state';
let img: HTMLImageElement;

const myCanvasContainer = document.getElementById('mycanvas-container') as HTMLDivElement;
const myCanvas = document.getElementById('mycanvas') as HTMLCanvasElement;
const ctx = myCanvas.getContext('2d')!;
const fidgetPincher = new FidgetPincher(stateGetFidgetPincherOptions());

function diagnosticPrint() {
  const css1 = document.getElementById('details-css1') as HTMLDivElement;
  const css2 = document.getElementById('details-css2') as HTMLDivElement;
  css1.innerText = `transform: ${fidgetPincher.getTransform().toCSSMatrix()};`;
  css2.innerText = `transform: ${fidgetPincher.getTransform().toCSSDecomposed()};`;
}

function repaint() {
  ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);
  const containerW = myCanvas.width / window.devicePixelRatio;
  const containerH = myCanvas.height / window.devicePixelRatio;
  const { naturalWidth: w, naturalHeight: h } = img;
  const { fitW, fitH } = calculateFit(containerW, containerH, w, h);
  // apply transform
  ctx.save();
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  ctx.translate(containerW / 2, containerH / 2);
  const { a, b, c, d, e, f } = fidgetPincher.getTransform();
  ctx.transform(a, b, c, d, e, f);
  ctx.translate(-containerW / 2, -containerH / 2);
  // centering
  ctx.drawImage(img,
    (containerW - fitW) / 2,
    (containerH - fitH) / 2,
    fitW,
    fitH
  );
  // restore state
  ctx.restore();
  // print diagnostic info to page
  diagnosticPrint();
}

async function onInit() {
  img = await loadImage(POLAR_IMG_SRC);
  const resizeObserver = new ResizeObserver((entries, observer) => {
    const { clientWidth: w, clientHeight: h } = myCanvasContainer;
    myCanvas.style.width = `${w}px`;
    myCanvas.style.height = `${h}px`;
    // mobile screen has higher dpi
    myCanvas.width = w * window.devicePixelRatio;
    myCanvas.height = h * window.devicePixelRatio;
    repaint();
  });
  resizeObserver.observe(myCanvasContainer);
  myCanvas.style.touchAction = 'none';
  fidgetPincher.setTouchElement(myCanvas, {
    onTransformed: (transform) => {
      repaint();
    },
  });
}
onInit();

addStateFidgetPincherOptionsChangedCallback(() => {
  fidgetPincher.setOptions(stateGetFidgetPincherOptions());
});
