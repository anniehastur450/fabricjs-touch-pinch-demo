import { calculateFit, loadImage } from './utils/utils';

import { FidgetPincher } from './FidgetPincher/FidgetPincher';
import { addStateChangedCallback, getState } from './index';

const myCssContainer = document.getElementById('mycss-container') as HTMLDivElement;
const myCss = document.getElementById('mycss') as HTMLDivElement;
const fidgetPincher = new FidgetPincher();
let myCssStyle: 'css1' | 'css2' = 'css1';

function diagnosticPrint() {
  const css1 = document.getElementById('details-css1') as HTMLDivElement;
  const css2 = document.getElementById('details-css2') as HTMLDivElement;
  css1.innerText = `transform: ${fidgetPincher.getTransform().toCSSMatrix()};`;
  css2.innerText = `transform: ${fidgetPincher.getTransform().toCSSDecomposed()};`;
}

function repaint() {
  if (myCssStyle === 'css1') {
    myCss.style.transform = fidgetPincher.getTransform().toCSSMatrix();
  } else if (myCssStyle === 'css2') {
    myCss.style.transform = fidgetPincher.getTransform().toCSSDecomposed();
  }
  // print diagnostic info to page
  diagnosticPrint();
}

async function onInit() {
  const resizeObserver = new ResizeObserver((entries, observer) => {
    const { clientWidth: w, clientHeight: h } = myCssContainer;
    const imgWidth = Math.min(w, h) * (2 / 3);
    myCss.style.setProperty('--img-width', `${imgWidth}px`);
    repaint();
  });
  resizeObserver.observe(myCssContainer);
  myCssContainer.style.touchAction = 'none';
  // use container is better, as the transformed element is moving
  fidgetPincher.setTouchElement(myCssContainer, {
    onTransformed: (transform) => {
      repaint();
    },
  });
}
onInit();

window.addEventListener('load', (e) => {
  myCssStyle = getState().myCssStyle;
  repaint();
  addStateChangedCallback((state) => {
    myCssStyle = state.myCssStyle;
    repaint();
  });
});
