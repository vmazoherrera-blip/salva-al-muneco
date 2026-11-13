/**
 * Visual Math Parser & Builder for Natural Language Teacher Editing.
 * Allows educators to edit 2x2 matrices and vectors simply as numbers/grids,
 * while automatically handling standard KaTeX formatting behind the scenes.
 */

export type MathElementFormat = "matrix_2x2" | "vector_2d" | "scalar_text";

export interface ParsedMatrix2x2 {
  a: string;
  b: string;
  c: string;
  d: string;
}

export interface ParsedVector2 {
  x: string;
  y: string;
}

/**
 * Attempts to parse a 2x2 matrix from LaTeX syntax:
 * \begin{pmatrix} a & b \\ c & d \end{pmatrix}
 */
export function parseMatrix2x2(latex: string): ParsedMatrix2x2 | null {
  if (!latex) return null;
  const clean = latex.trim();
  const m = clean.match(
    /\\begin\{(?:pmatrix|bmatrix|matrix)\}\s*([\s\S]*?)\s*\&\s*([\s\S]*?)\s*\\\\\s*([\s\S]*?)\s*\&\s*([\s\S]*?)\s*\\end\{(?:pmatrix|bmatrix|matrix)\}/i
  );
  if (m) {
    return {
      a: m[1].trim(),
      b: m[2].trim(),
      c: m[3].trim(),
      d: m[4].trim(),
    };
  }
  return null;
}

/**
 * Builds a 2x2 LaTeX matrix from 4 natural number/text values.
 */
export function buildMatrix2x2(a: string, b: string, c: string, d: string): string {
  const vA = a.trim() === "" ? "0" : a.trim();
  const vB = b.trim() === "" ? "0" : b.trim();
  const vC = c.trim() === "" ? "0" : c.trim();
  const vD = d.trim() === "" ? "0" : d.trim();
  return `\\begin{pmatrix} ${vA} & ${vB} \\\\ ${vC} & ${vD} \\end{pmatrix}`;
}

/**
 * Attempts to parse a 2D vector from LaTeX syntax:
 * \begin{pmatrix} x \\ y \end{pmatrix}
 */
export function parseVector2(latex: string): ParsedVector2 | null {
  if (!latex || latex.includes("&")) return null;
  const clean = latex.trim();
  const m = clean.match(
    /\\begin\{(?:pmatrix|bmatrix|matrix)\}\s*([\s\S]*?)\s*\\\\\s*([\s\S]*?)\s*\\end\{(?:pmatrix|bmatrix|matrix)\}/i
  );
  if (m) {
    return {
      x: m[1].trim(),
      y: m[2].trim(),
    };
  }
  return null;
}

/**
 * Builds a 2D LaTeX vector from 2 natural values.
 */
export function buildVector2(x: string, y: string): string {
  const vX = x.trim() === "" ? "0" : x.trim();
  const vY = y.trim() === "" ? "0" : y.trim();
  return `\\begin{pmatrix} ${vX} \\\\ ${vY} \\end{pmatrix}`;
}

/**
 * Detects whether a string is a 2x2 matrix, a vector, or scalar/text.
 */
export function detectMathFormat(latex: string): MathElementFormat {
  if (parseMatrix2x2(latex) !== null) return "matrix_2x2";
  if (parseVector2(latex) !== null) return "vector_2d";
  return "scalar_text";
}
