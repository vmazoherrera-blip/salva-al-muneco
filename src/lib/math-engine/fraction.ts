/**
 * Exact Fraction arithmetic to prevent floating-point inaccuracies.
 */

export class Fraction {
  readonly num: number;
  readonly den: number;

  constructor(numerator: number, denominator: number = 1) {
    if (denominator === 0) {
      throw new Error("Denominator cannot be zero");
    }

    if (!Number.isInteger(numerator) || !Number.isInteger(denominator)) {
      // If floats are passed, approximate to integer fraction
      const f = Fraction.fromNumber(numerator / denominator);
      this.num = f.num;
      this.den = f.den;
      return;
    }

    const gcdVal = Fraction.gcd(Math.abs(numerator), Math.abs(denominator));
    const sign = denominator < 0 ? -1 : 1;
    this.num = (numerator / gcdVal) * sign;
    this.den = Math.abs(denominator) / gcdVal;
  }

  static gcd(a: number, b: number): number {
    let x = Math.abs(Math.round(a));
    let y = Math.abs(Math.round(b));
    while (y !== 0) {
      const temp = y;
      y = x % y;
      x = temp;
    }
    return x || 1;
  }

  static zero(): Fraction {
    return new Fraction(0, 1);
  }

  static one(): Fraction {
    return new Fraction(1, 1);
  }

  add(other: Fraction | number): Fraction {
    const o = typeof other === "number" ? new Fraction(other) : other;
    return new Fraction(
      this.num * o.den + o.num * this.den,
      this.den * o.den
    );
  }

  sub(other: Fraction | number): Fraction {
    const o = typeof other === "number" ? new Fraction(other) : other;
    return new Fraction(
      this.num * o.den - o.num * this.den,
      this.den * o.den
    );
  }

  mul(other: Fraction | number): Fraction {
    const o = typeof other === "number" ? new Fraction(other) : other;
    return new Fraction(this.num * o.num, this.den * o.den);
  }

  div(other: Fraction | number): Fraction {
    const o = typeof other === "number" ? new Fraction(other) : other;
    if (o.num === 0) {
      throw new Error("Division by zero fraction");
    }
    return new Fraction(this.num * o.den, this.den * o.num);
  }

  neg(): Fraction {
    return new Fraction(-this.num, this.den);
  }

  abs(): Fraction {
    return new Fraction(Math.abs(this.num), this.den);
  }

  equals(other: Fraction | number): boolean {
    const o = typeof other === "number" ? Fraction.fromNumber(other) : other;
    return this.num === o.num && this.den === o.den;
  }

  toNumber(): number {
    return this.num / this.den;
  }

  toString(): string {
    if (this.den === 1) return `${this.num}`;
    return `${this.num}/${this.den}`;
  }

  toLatex(): string {
    if (this.den === 1) return `${this.num}`;
    if (this.num < 0) {
      return `-\\frac{${Math.abs(this.num)}}{${this.den}}`;
    }
    return `\\frac{${this.num}}{${this.den}}`;
  }

  /**
   * Parse string like "0.5", ".5", "1/2", "-3/4", "4"
   */
  static fromString(input: string): Fraction | null {
    if (!input) return null;
    const trimmed = input.trim().replace(/,/g, ".");
    if (!trimmed) return null;

    // Check fraction "a/b"
    if (trimmed.includes("/")) {
      const parts = trimmed.split("/");
      if (parts.length !== 2) return null;
      const num = parseFloat(parts[0].trim());
      const den = parseFloat(parts[1].trim());
      if (isNaN(num) || isNaN(den) || den === 0) return null;
      return Fraction.fromNumber(num).div(Fraction.fromNumber(den));
    }

    // Check float or integer
    const val = parseFloat(trimmed);
    if (isNaN(val)) return null;
    return Fraction.fromNumber(val);
  }

  /**
   * Convert a floating-point number into an exact fraction using continued fractions
   */
  static fromNumber(val: number, maxDen = 10000): Fraction {
    if (!isFinite(val)) throw new Error("Cannot convert non-finite number to fraction");
    if (Number.isInteger(val)) return new Fraction(val, 1);

    const sign = val < 0 ? -1 : 1;
    let x = Math.abs(val);

    let h1 = 1, h2 = 0;
    let k1 = 0, k2 = 1;
    let b = x;

    do {
      const a = Math.floor(b);
      let aux = h1;
      h1 = a * h1 + h2;
      h2 = aux;
      aux = k1;
      k1 = a * k1 + k2;
      k2 = aux;

      if (k1 > maxDen) break;
      if (Math.abs(x - h1 / k1) < 1e-9) break;

      b = 1 / (b - a);
    } while (isFinite(b) && Math.abs(x - h1 / k1) > 1e-9);

    return new Fraction(sign * h1, k1);
  }
}
