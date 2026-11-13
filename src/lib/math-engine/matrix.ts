import { Fraction } from "./fraction";

export class Vector2 {
  readonly x: Fraction;
  readonly y: Fraction;

  constructor(x: Fraction | number, y: Fraction | number) {
    this.x = typeof x === "number" ? new Fraction(x) : x;
    this.y = typeof y === "number" ? new Fraction(y) : y;
  }

  add(other: Vector2): Vector2 {
    return new Vector2(this.x.add(other.x), this.y.add(other.y));
  }

  sub(other: Vector2): Vector2 {
    return new Vector2(this.x.sub(other.x), this.y.sub(other.y));
  }

  scale(factor: Fraction | number): Vector2 {
    const f = typeof factor === "number" ? new Fraction(factor) : factor;
    return new Vector2(this.x.mul(f), this.y.mul(f));
  }

  equals(other: Vector2): boolean {
    return this.x.equals(other.x) && this.y.equals(other.y);
  }

  toLatex(): string {
    return `\\begin{pmatrix} ${this.x.toLatex()} \\\\ ${this.y.toLatex()} \\end{pmatrix}`;
  }

  toString(): string {
    return `(${this.x.toString()}, ${this.y.toString()})`;
  }

  static canonicalE1(): Vector2 {
    return new Vector2(1, 0);
  }

  static canonicalE2(): Vector2 {
    return new Vector2(0, 1);
  }
}

export class Matrix2x2 {
  readonly a: Fraction;
  readonly b: Fraction;
  readonly c: Fraction;
  readonly d: Fraction;

  constructor(
    a: Fraction | number,
    b: Fraction | number,
    c: Fraction | number,
    d: Fraction | number
  ) {
    this.a = typeof a === "number" ? new Fraction(a) : a;
    this.b = typeof b === "number" ? new Fraction(b) : b;
    this.c = typeof c === "number" ? new Fraction(c) : c;
    this.d = typeof d === "number" ? new Fraction(d) : d;
  }

  static identity(): Matrix2x2 {
    return new Matrix2x2(1, 0, 0, 1);
  }

  static zero(): Matrix2x2 {
    return new Matrix2x2(0, 0, 0, 0);
  }

  static scale(sx: Fraction | number, sy: Fraction | number): Matrix2x2 {
    return new Matrix2x2(sx, 0, 0, sy);
  }

  static uniformScale(s: Fraction | number): Matrix2x2 {
    return new Matrix2x2(s, 0, 0, s);
  }

  static reflectX(): Matrix2x2 {
    return new Matrix2x2(1, 0, 0, -1);
  }

  static reflectY(): Matrix2x2 {
    return new Matrix2x2(-1, 0, 0, 1);
  }

  static reflectOrigin(): Matrix2x2 {
    return new Matrix2x2(-1, 0, 0, -1);
  }

  static reflectLineYX(): Matrix2x2 {
    return new Matrix2x2(0, 1, 1, 0);
  }

  static reflectLineYMinusX(): Matrix2x2 {
    return new Matrix2x2(0, -1, -1, 0);
  }

  static rotate90(): Matrix2x2 {
    // 90 deg counter-clockwise: [cos 90, -sin 90; sin 90, cos 90] = [0, -1; 1, 0]
    return new Matrix2x2(0, -1, 1, 0);
  }

  static rotate180(): Matrix2x2 {
    // 180 deg: [-1, 0; 0, -1]
    return new Matrix2x2(-1, 0, 0, -1);
  }

  static rotate270(): Matrix2x2 {
    // 270 deg (or -90 deg): [0, 1; -1, 0]
    return new Matrix2x2(0, 1, -1, 0);
  }

  static rotateMinus90(): Matrix2x2 {
    return Matrix2x2.rotate270();
  }

  static shearX(k: Fraction | number): Matrix2x2 {
    return new Matrix2x2(1, k, 0, 1);
  }

  static shearY(k: Fraction | number): Matrix2x2 {
    return new Matrix2x2(1, 0, k, 1);
  }

  static projectionX(): Matrix2x2 {
    return new Matrix2x2(1, 0, 0, 0);
  }

  static projectionY(): Matrix2x2 {
    return new Matrix2x2(0, 0, 0, 1);
  }

  det(): Fraction {
    return this.a.mul(this.d).sub(this.b.mul(this.c));
  }

  mulVector(v: Vector2): Vector2 {
    const rx = this.a.mul(v.x).add(this.b.mul(v.y));
    const ry = this.c.mul(v.x).add(this.d.mul(v.y));
    return new Vector2(rx, ry);
  }

  mulMatrix(other: Matrix2x2): Matrix2x2 {
    const newA = this.a.mul(other.a).add(this.b.mul(other.c));
    const newB = this.a.mul(other.b).add(this.b.mul(other.d));
    const newC = this.c.mul(other.a).add(this.d.mul(other.c));
    const newD = this.c.mul(other.b).add(this.d.mul(other.d));
    return new Matrix2x2(newA, newB, newC, newD);
  }

  equals(other: Matrix2x2): boolean {
    return (
      this.a.equals(other.a) &&
      this.b.equals(other.b) &&
      this.c.equals(other.c) &&
      this.d.equals(other.d)
    );
  }

  toLatex(): string {
    return `\\begin{pmatrix} ${this.a.toLatex()} & ${this.b.toLatex()} \\\\ ${this.c.toLatex()} & ${this.d.toLatex()} \\end{pmatrix}`;
  }
}
