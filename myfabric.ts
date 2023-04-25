
import { fabric } from 'fabric';
import { FidgetPincher } from './FidgetPincher/FidgetPincher';
import { TransformationMatrix } from './FidgetPincher/TransformationMatrix';
import { defaultObjectTransformationMatrix, defaultObjectTransformationMatrixSetter, updateDeltaTransformToFabricJsAllObjects } from './fidget-pinch-fabricjs-adapter';

// Create a new canvas
const canvas = new fabric.Canvas('myfabric', {
  width: 300,
  height: 300
});

// create four shapes with random sizes and colors
var shape1 = new fabric.Rect({ width: 100, height: 100, fill: 'red' });
var shape2 = new fabric.Circle({ radius: 50, fill: 'green' });
var shape3 = new fabric.Triangle({ width: 80, height: 80, fill: 'blue' });
var shape4 = new fabric.Rect({ width: 120, height: 80, fill: 'orange' });
shape1.set({ left: 50, top: 50 });
shape2.set({ left: 100, top: 100 });
shape3.set({ left: 175, top: 50 });
shape4.set({ left: 50, top: 175 });

// add the shapes to the canvas
canvas.add(shape1, shape2, shape3, shape4);

////////////////////////////////////////////////////////////////////////////

// implement your canvas center function
function getCanvasCenter() {
  return {
    x: canvas.getWidth() / 2,
    y: canvas.getHeight() / 2
  };
}

// below assumed every object this transform origin is its top-left corner (the default of fabricjs)

// const myFabricContainer = document.getElementById('myfabric-container') as HTMLDivElement;
const myFabricTouchControls = document.getElementById('myfabric-touch-controls') as HTMLDivElement;
const fidgetPincher = new FidgetPincher();
let accumulatedTransform = TransformationMatrix.identity(); // for print diagnostic info

function diagnosticPrint() {
  const css1 = document.getElementById('details-css1') as HTMLDivElement;
  const css2 = document.getElementById('details-css2') as HTMLDivElement;
  css1.innerText = `transform: ${accumulatedTransform.toCSSMatrix()};`;
  css2.innerText = `transform: ${accumulatedTransform.toCSSDecomposed()};`;
}

function repaint() {
  const transform = fidgetPincher.getTransform();
  const fidgetPinchTransformOrigin = getCanvasCenter();
  updateDeltaTransformToFabricJsAllObjects(
    transform,
    canvas,
    fidgetPinchTransformOrigin,
    defaultObjectTransformationMatrix,
    defaultObjectTransformationMatrixSetter,
  );
  // print diagnostic info to page
  accumulatedTransform = accumulatedTransform.multiplyMatrix(transform);
  diagnosticPrint();
  // reset transform to identity for delta transform
  fidgetPincher.setTransform(TransformationMatrix.identity());
};

myFabricTouchControls.style.touchAction = 'none';
fidgetPincher.setTouchElement(myFabricTouchControls, {
  onTransformed: (transform) => {
    repaint();
  }
});
