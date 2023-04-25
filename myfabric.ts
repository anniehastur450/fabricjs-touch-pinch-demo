
import { fabric } from 'fabric';
import { FidgetPincher } from './FidgetPincher/FidgetPincher';
import { TransformationMatrix } from './FidgetPincher/TransformationMatrix';
import { defaultObjectTransformationMatrix, defaultObjectTransformationMatrixSetter, updateDeltaTransformToFabricJsAllObjects } from './fidget-pinch-fabricjs-adapter';

// Create a new canvas
const canvas = new fabric.Canvas('myfabric', {
  width: 600,
  height: 300
});

// Create a rectangle
const rectangle = new fabric.Rect({
  left: 100,
  top: 100,
  fill: 'red',
  width: 100,
  height: 100
});

// Create a circle
const circle = new fabric.Circle({
  left: 250,
  top: 100,
  fill: 'green',
  radius: 50
});

// Create a triangle
const triangle = new fabric.Triangle({
  left: 400,
  top: 100,
  fill: 'blue',
  width: 100,
  height: 100
});

// Add the shapes to the canvas
canvas.add(rectangle, circle, triangle);

////////////////////////////////////////////////////////////////////////////

// implement your canvas center function
function getCanvasCenter() {
  return {
    x: canvas.getWidth() / 2,
    y: canvas.getHeight() / 2
  };
}

// below assumed every object this transform origin is its top-left corner (the default of fabricjs)

const myFabricContainer = document.getElementById('myfabric-container') as HTMLDivElement;
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

myFabricContainer.style.touchAction = 'none';
fidgetPincher.setTouchElement(myFabricContainer, {
  onTransformed: (transform) => {
    repaint();
  }
});
