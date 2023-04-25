
import { fabric } from 'fabric';
import { TransformationMatrix } from './FidgetPincher/TransformationMatrix';

export function defaultObjectTransformationMatrix(object: fabric.Object) {
  const [a, b, c, d, e, f] = object.calcTransformMatrix();
  return new TransformationMatrix(a, b, c, d, e, f);
}

function radiansToDegrees(radians: number) {
  return radians * 180 / Math.PI;
}

// use fabric.util.qrDecompose to set object transformation matrix is more accurate
/*
  IMPORTANT: You should always call set first and then setPositionByOrigin for accurate transformation.
  It is so funny that these two official examples,
  http://fabricjs.com/using-transformations and http://fabricjs.com/matrix-transformation
  does not consistently use the same order, changing the order will result in different transformation!
  Former (http://fabricjs.com/using-transformations) uses setPositionByOrigin first and then set,
  which is wrong and produces offsets in the transformation!
*/
export function defaultObjectTransformationMatrixSetter(object: fabric.Object, transform: TransformationMatrix) {
  const { a, b, c, d, e, f } = transform;
  const opt = fabric.util.qrDecompose([a, b, c, d, e, f]);
  object.flipX = false;
  object.flipY = false;
  object.set(opt);
  object.setPositionByOrigin(
    new fabric.Point(opt.translateX, opt.translateY),
    'center',
    'center'
  );
  object.setCoords();
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
