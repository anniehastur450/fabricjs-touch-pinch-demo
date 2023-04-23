import { calculateFit, loadImage } from './utils/utils';

const POLAR_IMG_SRC = 'https://github.com/anniehastur450/fabricjs-touch-pinch-demo/blob/main/images/cute-white-polar-bear.png?raw=true';
import { FidgetPincher } from './FidgetPincher/FidgetPincher';
let img: HTMLImageElement;

const myCanvasContainer = document.getElementById('mycanvas-container') as HTMLDivElement;
const myCanvas = document.getElementById('mycanvas') as HTMLCanvasElement;
const ctx = myCanvas.getContext('2d')!;
const fidgetPincher = new FidgetPincher();

function repaint() {
  ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);
  const containerW = myCanvas.width / window.devicePixelRatio;
  const containerH = myCanvas.height / window.devicePixelRatio;
  const { naturalWidth: w, naturalHeight: h } = img;
  const { fitW, fitH } = calculateFit(containerW, containerH, w, h);
  // apply transform
  ctx.save();
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  const { a, b, c, d, e, f } = fidgetPincher.getTransform();
  ctx.transform(a, b, c, d, e, f);
  // centering
  ctx.drawImage(img,
    (containerW - fitW) / 2,
    (containerH - fitH) / 2,
    fitW,
    fitH
  );
  // restore state
  ctx.restore();
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
