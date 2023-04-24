
type Array9 = [number, number, number, number, number, number, number, number, number];

function multiplyMatrices(a: Array9, b: Array9): Array9 {
  const [a0, a1, a2, a3, a4, a5, a6, a7, a8] = a;
  const [b0, b1, b2, b3, b4, b5, b6, b7, b8] = b;
  return [
    a0 * b0 + a1 * b3 + a2 * b6,
    a0 * b1 + a1 * b4 + a2 * b7,
    a0 * b2 + a1 * b5 + a2 * b8,
    a3 * b0 + a4 * b3 + a5 * b6,
    a3 * b1 + a4 * b4 + a5 * b7,
    a3 * b2 + a4 * b5 + a5 * b8,
    a6 * b0 + a7 * b3 + a8 * b6,
    a6 * b1 + a7 * b4 + a8 * b7,
    a6 * b2 + a7 * b5 + a8 * b8,
  ];
}

// solve linear system of equations with 2 unknowns
function solveLinearSystem(
  a: number, b: number, c: number,
  d: number, e: number, f: number,
): [number, number] | null {
  const det = a * e - b * d;
  if (det === 0) {
    return null;
  }
  return [
    (c * e - b * f) / det,
    (a * f - c * d) / det,
  ];
}

export class TransformationMatrix {
  static identity(): TransformationMatrix {
    return new TransformationMatrix(1, 0, 0, 1, 0, 0);
  }

  static translation(x: number, y: number): TransformationMatrix {
    return new TransformationMatrix(1, 0, 0, 1, x, y);
  }

  static rotation(angle: number): TransformationMatrix {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return new TransformationMatrix(c, s, -s, c, 0, 0);
  }

  static scale(x: number, y: number): TransformationMatrix {
    return new TransformationMatrix(x, 0, 0, y, 0, 0);
  }

  /**
   * The transformation matrix is described by: [
   *   [a, c, e],
   *   [b, d, f],
   *   [0, 0, 1]
   * ]
   */
  constructor(
    public a: number,
    public b: number,
    public c: number,
    public d: number,
    public e: number,
    public f: number,
  ) { }

  multiplyMatrix(other: TransformationMatrix) {
    const a: Array9 = [this.a, this.c, this.e, this.b, this.d, this.f, 0, 0, 1];
    const b: Array9 = [other.a, other.c, other.e, other.b, other.d, other.f, 0, 0, 1];
    const [c0, c1, c2, c3, c4, c5, c6, c7, c8] = multiplyMatrices(a, b);
    return new TransformationMatrix(c0, c3, c1, c4, c2, c5);
  }

  toCSSMatrix() {
    const { a, b, c, d, e, f } = this;
    return `matrix(${a}, ${b}, ${c}, ${d}, ${e}, ${f})`;
  }

  decompose() {
    // decompose the matrix into translate, rotate, scale
    const { a, b, c, d, e, f } = this;
    const translateX = e;
    const translateY = f;
    // ignore skew
    const scale = Math.hypot(a, b);
    const rotate = Math.atan2(b, a);
    return { translateX, translateY, scale, rotate };
  }

  toCSSDecomposed() {
    const { translateX, translateY, scale, rotate } = this.decompose();
    return `translate(${translateX}px, ${translateY}px) rotate(${rotate}rad) scale(${scale})`;
  }

  /**
   * solve [ax + cy + e] = [x]
   *       [bx + dy + f] = [y]
   */
  calculateTransformOrigin(): { x: number, y: number } | null {
    const { a, b, c, d, e, f } = this;
    const result = solveLinearSystem(
      a - 1, c, -e,
      b, d - 1, -f,
    );
    if (result === null) {
      return null;
    }
    const [x, y] = result;
    return { x, y };
  }
}
