import { describe, it, expect } from "vitest";
import { Fraction } from "../fraction";
import { Matrix2x2, Vector2 } from "../matrix";
import { validateAnswer } from "../validator";
import {
  generateQ1,
  generateQ2,
  generateQ3,
  generateQ4,
  generateQ5,
  generateQ6,
  generateQ7,
  generateQ8,
  generateQ9,
  generateQ10,
} from "../templates";
import { generateMatchQuestions, sanitizeQuestionForClient } from "../generator";

describe("Fraction arithmetic & conversions", () => {
  it("simplifies fractions using GCD correctly", () => {
    const f1 = new Fraction(6, 8);
    expect(f1.num).toBe(3);
    expect(f1.den).toBe(4);

    const f2 = new Fraction(-4, -8);
    expect(f2.num).toBe(1);
    expect(f2.den).toBe(2);

    const f3 = new Fraction(5, -10);
    expect(f3.num).toBe(-1);
    expect(f3.den).toBe(2);
  });

  it("handles basic arithmetic operations", () => {
    const a = new Fraction(1, 2);
    const b = new Fraction(1, 3);

    expect(a.add(b).toString()).toBe("5/6");
    expect(a.sub(b).toString()).toBe("1/6");
    expect(a.mul(b).toString()).toBe("1/6");
    expect(a.div(b).toString()).toBe("3/2");
  });

  it("throws on division by zero", () => {
    expect(() => new Fraction(1, 0)).toThrow();
    const a = new Fraction(1, 2);
    const zero = new Fraction(0, 1);
    expect(() => a.div(zero)).toThrow();
  });

  it("parses strings accurately (fractions, decimals, shorthand)", () => {
    expect(Fraction.fromString("0.5")?.toNumber()).toBe(0.5);
    expect(Fraction.fromString(".5")?.toNumber()).toBe(0.5);
    expect(Fraction.fromString("1/2")?.toNumber()).toBe(0.5);
    expect(Fraction.fromString("2/4")?.toNumber()).toBe(0.5);
    expect(Fraction.fromString("-3/6")?.toNumber()).toBe(-0.5);
    expect(Fraction.fromString("-0.5")?.toNumber()).toBe(-0.5);
    expect(Fraction.fromString("3")?.toNumber()).toBe(3);
  });
});

describe("Matrix and Vector operations", () => {
  it("multiplies matrix by vector", () => {
    // [1 2; 3 4] * [2; 3] = [1*2 + 2*3; 3*2 + 4*3] = [8; 18]
    const M = new Matrix2x2(1, 2, 3, 4);
    const v = new Vector2(2, 3);
    const res = M.mulVector(v);
    expect(res.x.toNumber()).toBe(8);
    expect(res.y.toNumber()).toBe(18);
  });

  it("calculates 2x2 determinant correctly", () => {
    // det([2 5; 1 3]) = 2*3 - 5*1 = 1
    const M = new Matrix2x2(2, 5, 1, 3);
    expect(M.det().toNumber()).toBe(1);
  });

  it("multiplies matrices respecting non-commutativity", () => {
    const A = new Matrix2x2(1, 2, 0, 1);
    const B = new Matrix2x2(2, 0, 1, 3);
    const AB = A.mulMatrix(B);
    const BA = B.mulMatrix(A);

    expect(AB.equals(BA)).toBe(false);
  });

  it("verifies notable rotation matrices", () => {
    const r90 = Matrix2x2.rotate90();
    const v = new Vector2(1, 0);
    const vRot = r90.mulVector(v);
    // (1, 0) rotated 90 deg CCW should be (0, 1)
    expect(vRot.x.toNumber()).toBe(0);
    expect(vRot.y.toNumber()).toBe(1);
  });
});

describe("Equivalence validator (validator.ts)", () => {
  it("accepts reduced, unreduced fractions, and decimals", () => {
    expect(validateAnswer("0.5", "1/2", "numeric")).toBe(true);
    expect(validateAnswer(".5", "1/2", "numeric")).toBe(true);
    expect(validateAnswer("1/2", "0.5", "numeric")).toBe(true);
    expect(validateAnswer("2/4", "0.5", "numeric")).toBe(true);
    expect(validateAnswer("-3/6", "-0.5", "numeric")).toBe(true);
    expect(validateAnswer("-0.5", "-1/2", "numeric")).toBe(true);
  });

  it("rejects wrong answers", () => {
    expect(validateAnswer("0.51", "1/2", "numeric")).toBe(false);
    expect(validateAnswer("3/4", "1/2", "numeric")).toBe(false);
    expect(validateAnswer("-1/2", "1/2", "numeric")).toBe(false);
  });

  it("validates multiple choice strings correctly", () => {
    const latex = "\\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix}";
    expect(validateAnswer(latex, latex, "multiple_choice")).toBe(true);
    expect(validateAnswer(" A ", "A", "multiple_choice")).toBe(true);
    expect(validateAnswer("b", "B", "multiple_choice")).toBe(true);
  });
});

describe("Question Generator (100 random runs per level)", () => {
  it("Level 1 (Básico: Q1, Q2, Q3) generates without errors or duplicate options", () => {
    for (let i = 0; i < 100; i++) {
      const q1 = generateQ1();
      expect(q1.optionsLatex).toBeDefined();
      expect(q1.optionsLatex?.length).toBe(4);
      expect(new Set(q1.optionsLatex).size).toBe(4);
      expect(q1.optionsLatex?.includes(q1.correctAnswer)).toBe(true);

      const q2 = generateQ2();
      expect(q2.optionsLatex).toBeDefined();
      expect(q2.optionsLatex?.length).toBe(4);
      expect(new Set(q2.optionsLatex).size).toBe(4);
      expect(q2.optionsLatex?.includes(q2.correctAnswer)).toBe(true);

      const q3 = generateQ3();
      expect(q3.correctAnswer).toBeDefined();
      expect(isNaN(Number(q3.correctAnswer))).toBe(false);
    }
  });

  it("Level 2 (Intermedio: Q4, Q5, Q6, Q7) generates without errors or duplicate options", () => {
    for (let i = 0; i < 100; i++) {
      const q4 = generateQ4();
      expect(q4.optionsLatex?.length).toBe(4);
      expect(new Set(q4.optionsLatex).size).toBe(4);
      expect(q4.optionsLatex?.includes(q4.correctAnswer)).toBe(true);

      const q5 = generateQ5();
      expect(q5.optionsLatex?.length).toBe(4);
      expect(new Set(q5.optionsLatex).size).toBe(4);
      expect(q5.optionsLatex?.includes(q5.correctAnswer)).toBe(true);

      const q6 = generateQ6();
      expect(q6.correctAnswer).toBeDefined();
      expect(isNaN(Number(q6.correctAnswer))).toBe(false);

      const q7 = generateQ7();
      expect(q7.correctAnswer).toBeDefined();
      expect(isNaN(Number(q7.correctAnswer))).toBe(false);
    }
  });

  it("Level 3 (Avanzado: Q8, Q9, Q10) generates without errors or duplicate options", () => {
    for (let i = 0; i < 100; i++) {
      const q8 = generateQ8();
      expect(q8.optionsLatex?.length).toBe(4);
      expect(new Set(q8.optionsLatex).size).toBe(4);
      expect(q8.optionsLatex?.includes(q8.correctAnswer)).toBe(true);

      const q9 = generateQ9();
      expect(q9.optionsLatex?.length).toBe(4);
      expect(new Set(q9.optionsLatex).size).toBe(4);
      expect(q9.optionsLatex?.includes(q9.correctAnswer)).toBe(true);

      const q10 = generateQ10();
      expect(q10.optionsLatex?.length).toBe(4);
      expect(new Set(q10.optionsLatex).size).toBe(4);
      expect(q10.optionsLatex?.includes(q10.correctAnswer)).toBe(true);
    }
  });

  it("generates a complete 10-question match with correct indices and client sanitization", () => {
    const match = generateMatchQuestions();
    expect(match.length).toBe(10);

    for (let i = 0; i < 10; i++) {
      expect(match[i].questionIndex).toBe(i);
      const client = sanitizeQuestionForClient(match[i]);
      expect((client as unknown as Record<string, unknown>).correctAnswer).toBeUndefined();
      expect((client as unknown as Record<string, unknown>).explanationLatex).toBeUndefined();
      expect(client.promptLatex).toBeDefined();
    }
  });
});

describe("MathRenderer KaTeX HTML parser", () => {
  it("renders pure matrix and vector expressions into valid KaTeX HTML", async () => {
    const { renderLatexToHtml } = await import("../../../components/MathRenderer");

    const matrixLatex = "\\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix}";
    const html1 = renderLatexToHtml(matrixLatex);
    expect(html1).toContain("katex");
    expect(html1).toContain("pmatrix");

    const vectorLatex = "\\begin{pmatrix} 3 \\\\ -2 \\end{pmatrix}";
    const html2 = renderLatexToHtml(vectorLatex);
    expect(html2).toContain("katex");
  });

  it("renders mixed prompts with matrices and bold text without raw LaTeX artifacts", async () => {
    const { renderLatexToHtml } = await import("../../../components/MathRenderer");

    const prompt1 = "Dada la matriz de transformación: \\\\[6pt] $$A = \\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}$$ \\\\[6pt] **Calcula el valor del determinante:**";
    const html = renderLatexToHtml(prompt1);
    expect(html).toContain("katex");
    expect(html).toContain("<strong>");
    expect(html).not.toContain("\\textbf");
    expect(html).not.toContain("$$");
  });

  it("successfully parses all 10 match questions and options without throwing or leaving raw $$", async () => {
    const { renderLatexToHtml } = await import("../../../components/MathRenderer");
    const match = generateMatchQuestions();

    for (const q of match) {
      const promptHtml = renderLatexToHtml(q.promptLatex);
      expect(promptHtml).toBeDefined();
      expect(promptHtml).not.toContain("$$");
      expect(promptHtml).not.toContain("\\textbf");

      if (q.optionsLatex) {
        for (const opt of q.optionsLatex) {
          const optHtml = renderLatexToHtml(opt);
          expect(optHtml).toBeDefined();
          expect(optHtml).toContain("katex");
        }
      }

      // Check explanation KaTeX rendering
      const explHtml = renderLatexToHtml(q.explanationLatex);
      expect(explHtml).toBeDefined();
      expect(explHtml).toContain("katex");
      expect(explHtml).not.toContain("<br/> 0 &"); // ensures matrix row break was not corrupted into <br/>
    }
  });

  it("never corrupts matrix row breaks inside inline or display formulas", async () => {
    const { renderLatexToHtml } = await import("../../../components/MathRenderer");
    const mixed = "La matriz es $M = \\begin{pmatrix} 2 & 5 \\\\ -1 & 3 \\end{pmatrix}$ y el vector es $v = \\begin{pmatrix} 4 \\\\ 7 \\end{pmatrix}$.";
    const html = renderLatexToHtml(mixed);
    expect(html).toContain("katex");
    expect(html).not.toContain("<br/>");
    expect(html).toContain("matrix");
  });
});

describe("Profanity and albur filter (profanity.ts)", () => {
  it("blocks offensive words, insults and vulgarities in Spanish", async () => {
    const { containsProfanity } = await import("../../profanity");

    expect(containsProfanity("puta")).toBe(true);
    expect(containsProfanity("gonorrea")).toBe(true);
    expect(containsProfanity("hijueputa")).toBe(true);
    expect(containsProfanity("mierda")).toBe(true);
    expect(containsProfanity("malparido")).toBe(true);
    expect(containsProfanity("pendejo")).toBe(true);
    expect(containsProfanity("chingar")).toBe(true);
  });

  it("blocks common double entendre puns and albures", async () => {
    const { containsProfanity } = await import("../../profanity");

    expect(containsProfanity("Elver Galarga")).toBe(true);
    expect(containsProfanity("elvergalarga")).toBe(true);
    expect(containsProfanity("Deborah Melo")).toBe(true);
    expect(containsProfanity("Benito Camelas")).toBe(true);
    expect(containsProfanity("Rosa Melano")).toBe(true);
    expect(containsProfanity("Aquiles Baeza")).toBe(true);
  });

  it("detects leetspeak evasions", async () => {
    const { containsProfanity } = await import("../../profanity");

    expect(containsProfanity("p0rn0")).toBe(true);
    expect(containsProfanity("pvt4")).toBe(false); // standard text
    expect(containsProfanity("p_u_t_a")).toBe(true);
    expect(containsProfanity("puuutaaaa")).toBe(true);
  });

  it("permits legitimate and educational student names without false positives", async () => {
    const { containsProfanity } = await import("../../profanity");

    expect(containsProfanity("Laura Vanessa Mazo Herrera")).toBe(false);
    expect(containsProfanity("Sofia Gauss")).toBe(false);
    expect(containsProfanity("Carl Friedrich Gauss")).toBe(false);
    expect(containsProfanity("Leonhard Euler")).toBe(false);
    expect(containsProfanity("Ada Lovelace")).toBe(false);
    expect(containsProfanity("Estudiante_Algebra_2026")).toBe(false);
  });
});

describe("Room Questions and Solucionario (game-store)", () => {
  it("generates and manages master questions with correct answers and explanations", async () => {
    const {
      getRoomMasterQuestions,
      setRoomMasterQuestions,
      regenerateRoomMasterQuestions,
    } = await import("../../game/game-store");

    const code = "TEST01";
    const qList = getRoomMasterQuestions(code);
    expect(qList).toHaveLength(10);

    for (const q of qList) {
      expect(q.promptLatex).toBeDefined();
      expect(q.correctAnswer).toBeDefined();
      expect(q.explanationLatex).toBeDefined();
      expect(["basico", "intermedio", "avanzado"]).toContain(q.level);
    }

    // Regenerate
    const regenerated = regenerateRoomMasterQuestions(code);
    expect(regenerated).toHaveLength(10);

    // Custom questions
    const customList = [...regenerated];
    customList[0] = {
      ...customList[0],
      promptLatex: "¿Pregunta personalizada?",
      correctAnswer: "42",
      explanationLatex: "Explicación personalizada",
    };
    setRoomMasterQuestions(code, customList);
    const updated = getRoomMasterQuestions(code);
    expect(updated[0].promptLatex).toBe("¿Pregunta personalizada?");
    expect(updated[0].correctAnswer).toBe("42");
  });

  it("strictly validates the moderator secret key 'que increible juego'", async () => {
    const { isValidModeratorKey, createGameRoom } = await import("../../game/game-store");

    expect(isValidModeratorKey("que increible juego")).toBe(true);
    expect(isValidModeratorKey("que increíble juego")).toBe(true); // with accent
    expect(isValidModeratorKey("  QUE INCREIBLE JUEGO  ")).toBe(true); // case-insensitive & trimmed
    expect(isValidModeratorKey("clave incorrecta")).toBe(false);
    expect(isValidModeratorKey("")).toBe(false);
    expect(isValidModeratorKey(undefined)).toBe(false);

    // createGameRoom rejects invalid key
    await expect(createGameRoom(60, 30, "clave_invalida")).rejects.toThrow("Clave secreta incorrecta");
    await expect(createGameRoom(60, 30, "")).rejects.toThrow("Clave secreta incorrecta");

    // createGameRoom succeeds with secret key
    const result = await createGameRoom(60, 30, "que increible juego");
    expect(result.room).toBeDefined();
    expect(result.room.code).toBeDefined();
    expect(result.hostToken).toBeDefined();
  });

  it("generates different randomized questions for each new room", async () => {
    const { createGameRoom, getRoomMasterQuestions } = await import("../../game/game-store");

    const r1 = await createGameRoom(60, 30, "que increible juego");
    const r2 = await createGameRoom(60, 30, "que increible juego");

    const q1 = getRoomMasterQuestions(r1.room.code);
    const q2 = getRoomMasterQuestions(r2.room.code);

    expect(q1).toHaveLength(10);
    expect(q2).toHaveLength(10);

    // Compare prompt strings across questions to ensure randomization
    const prompts1 = q1.map((q) => q.promptLatex).join(" | ");
    const prompts2 = q2.map((q) => q.promptLatex).join(" | ");
    expect(prompts1).not.toBe(prompts2);
  });
});

describe("Visual Math Parser & Natural Language Editor (visual-parser.ts)", () => {
  it("correctly parses 2x2 matrices into 4 visual cells and builds LaTeX back", async () => {
    const { parseMatrix2x2, buildMatrix2x2, detectMathFormat } = await import(
      "../visual-parser"
    );

    const mLatex = "\\begin{pmatrix} 5 & 0 \\\\ 0 & 5 \\end{pmatrix}";
    expect(detectMathFormat(mLatex)).toBe("matrix_2x2");

    const parsed = parseMatrix2x2(mLatex);
    expect(parsed).toEqual({ a: "5", b: "0", c: "0", d: "5" });

    const rebuilt = buildMatrix2x2("5", "0", "0", "5");
    expect(rebuilt).toBe("\\begin{pmatrix} 5 & 0 \\\\ 0 & 5 \\end{pmatrix}");
  });

  it("correctly parses 2D vectors and distinguishes them from matrices", async () => {
    const { parseVector2, buildVector2, detectMathFormat } = await import(
      "../visual-parser"
    );

    const vLatex = "\\begin{pmatrix} 3 \\\\ -2 \\end{pmatrix}";
    expect(detectMathFormat(vLatex)).toBe("vector_2d");

    const parsed = parseVector2(vLatex);
    expect(parsed).toEqual({ x: "3", y: "-2" });

    const rebuilt = buildVector2("3", "-2");
    expect(rebuilt).toBe("\\begin{pmatrix} 3 \\\\ -2 \\end{pmatrix}");

    // Matrix should not be detected as vector
    const mLatex = "\\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}";
    expect(parseVector2(mLatex)).toBeNull();
  });

  it("detects scalar / plain text inputs accurately", async () => {
    const { detectMathFormat } = await import("../visual-parser");

    expect(detectMathFormat("42")).toBe("scalar_text");
    expect(detectMathFormat("-3/4")).toBe("scalar_text");
    expect(detectMathFormat("Opción de texto")).toBe("scalar_text");
  });
});
