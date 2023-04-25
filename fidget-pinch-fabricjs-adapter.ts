
import { fabric } from 'fabric';
import { TransformationMatrix } from './FidgetPincher/TransformationMatrix';

export function defaultObjectTransformationMatrix(object: fabric.Object) {
  const [a, b, c, d, e, f] = object.calcTransformMatrix();
  return new TransformationMatrix(a, b, c, d, e, f);
}

function radiansToDegrees(radians: number) {
  return radians * 180 / Math.PI;
}

// you can use fabric.util.qrDecompose instead if you want to use fabricjs's own decomposition
export function defaultObjectTransformationMatrixSetter(object: fabric.Object, transform: TransformationMatrix) {
  const { translateX, translateY, scale, rotate } = transform.decompose();
  object.setPositionByOrigin(
    new fabric.Point(translateX, translateY),
    'center',
    'center',
  );
  object.set({
    scaleX: scale,
    scaleY: scale,
    angle: radiansToDegrees(rotate),
  });
}

export function updateDeltaTransformToFabricJsAllObjects(
  deltaTransform: TransformationMatrix,
  canvas: fabric.Canvas,
  fidgetPinchTransformOrigin: { x: number, y: number },
  objectTransformationMatrix: (object: fabric.Object) => TransformationMatrix,
  objectTransformationMatrixSetter: (object: fabric.Object, transform: TransformationMatrix) => void,
) {
  const objects = canvas.getObjects();
  for (const object of objects) {
    const { x, y } = fidgetPinchTransformOrigin;
    let transform = objectTransformationMatrix(object);
    const actions = [
      TransformationMatrix.translation(-x, -y),
      deltaTransform,
      TransformationMatrix.translation(x, y),
    ];
    for (const action of actions) {
      transform = action.multiplyMatrix(transform);
    }
    objectTransformationMatrixSetter(object, transform);
  }

  canvas.renderAll();
}
