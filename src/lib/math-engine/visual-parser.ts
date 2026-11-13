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

export interface ExtractedPromptItem {
  id: string;
  name: string;
  type: "matrix_2x2" | "vector_2d";
  matrix?: ParsedMatrix2x2;
  vector?: ParsedVector2;
  rawMatch: string;
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

/**
 * Cleans unwanted LaTeX formatting artifacts (e.g. \\[6pt], \\[4pt]) into natural paragraphs,
 * and strips unnecessary math dollar signs/markdown asterisks for natural reading.
 */
export function cleanLatexToNaturalText(latex: string): string {
  if (!latex) return "";
  return latex
    .replace(/\\\\\[\d+pt\]/g, "\n\n")
    .replace(/\\\\\[\d+px\]/g, "\n\n")
    .replace(/\\\[\d+pt\]/g, "\n\n")
    .replace(/\\\[\d+px\]/g, "\n\n")
    .replace(/\\mathbb\{R\}\^2/g, "ℝ²")
    // Clean dollar signs wrapping simple variable names or values: $k = 2$, $k$, $x$, $y$, $v$, $A$
    .replace(/\$([A-Za-z0-9_'\s=+-]+)\$/g, "$1")
    // Clean markdown double asterisks for bold
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\n{3,}/g, "\n\n");
}

/**
 * Extracts all 2x2 matrices and 2D vectors embedded in a prompt string.
 * This powers the visual matrix inspector so teachers can visually inspect
 * and edit numbers directly without seeing LaTeX markup.
 */
export function extractPromptMatrices(prompt: string): ExtractedPromptItem[] {
  if (!prompt) return [];
  const results: ExtractedPromptItem[] = [];
  const matrixRegex = /\\begin\{(?:pmatrix|bmatrix|matrix)\}\s*([\s\S]*?)\s*\\end\{(?:pmatrix|bmatrix|matrix)\}/gi;

  let match: RegExpExecArray | null;
  let counter = 1;

  while ((match = matrixRegex.exec(prompt)) !== null) {
    const rawMatch = match[0];
    const matchIndex = match.index;
    const inner = match[1];

    // Detect preceding name (e.g., "A = ", "v = ", "S = ")
    const beforeText = prompt.slice(Math.max(0, matchIndex - 35), matchIndex);
    const nameMatch = beforeText.match(/([A-Za-z0-9_()]+)\s*=\s*$/);
    const detectedName = nameMatch ? nameMatch[1].trim() : `M${counter}`;

    if (inner.includes("&")) {
      const parsed = parseMatrix2x2(rawMatch);
      if (parsed) {
        results.push({
          id: `matrix_${matchIndex}_${counter}`,
          name: detectedName,
          type: "matrix_2x2",
          matrix: parsed,
          rawMatch,
        });
        counter++;
      }
    } else {
      const parsed = parseVector2(rawMatch);
      if (parsed) {
        results.push({
          id: `vector_${matchIndex}_${counter}`,
          name: detectedName,
          type: "vector_2d",
          vector: parsed,
          rawMatch,
        });
        counter++;
      }
    }
  }

  return results;
}

/**
 * Updates a matrix or vector inside a prompt string with new values.
 */
export function replacePromptMatrix(
  prompt: string,
  targetRaw: string,
  newRaw: string
): string {
  if (!prompt || !targetRaw) return prompt;
  return prompt.replace(targetRaw, newRaw);
}
