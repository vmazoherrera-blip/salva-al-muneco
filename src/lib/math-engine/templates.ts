import { Fraction } from "./fraction";
import { Matrix2x2, Vector2 } from "./matrix";

export type QuestionLevel = "basico" | "intermedio" | "avanzado";
export type QuestionType = "multiple_choice" | "numeric";

export interface QuestionData {
  questionIndex: number;
  level: QuestionLevel;
  questionType: QuestionType;
  promptLatex: string;
  optionsLatex?: string[];
  correctAnswer: string;
  explanationLatex: string;
}

// Helper: random integer in [min, max] inclusive
export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper: random non-zero integer
export function randNonZeroInt(min: number, max: number): number {
  let val = 0;
  while (val === 0) {
    val = randInt(min, max);
  }
  return val;
}

// Helper: shuffle array
export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Helper: ensure 4 unique multiple choice options
export function makeUniqueOptions(correct: string, distractors: string[], fallbackGenerator?: () => string): string[] {
  const uniqueSet = new Set<string>();
  uniqueSet.add(correct.trim());

  for (const d of distractors) {
    const trimmed = d.trim();
    if (!uniqueSet.has(trimmed) && uniqueSet.size < 4) {
      uniqueSet.add(trimmed);
    }
  }

  let counter = 1;
  while (uniqueSet.size < 4) {
    if (fallbackGenerator) {
      const extra = fallbackGenerator().trim();
      if (!uniqueSet.has(extra)) {
        uniqueSet.add(extra);
      }
    } else {
      uniqueSet.add(`\\text{Opción auxiliar } ${counter++}`);
    }
  }

  return shuffle(Array.from(uniqueSet));
}

// ---------------------------------------------------------------------------
// LEVEL 1: BÁSICO (Preguntas 1, 2, 3)
// ---------------------------------------------------------------------------

/**
 * Q1: Identificación de matrices de transformación (Reflexión X, Y, Escalamiento)
 */
export function generateQ1(): QuestionData {
  const types = ["reflect_x", "reflect_y", "uniform_scale"] as const;
  const picked = types[randInt(0, types.length - 1)];

  if (picked === "reflect_x") {
    const correct = Matrix2x2.reflectX();
    const distractors = [
      new Matrix2x2(-1, 0, 0, 1).toLatex(), // reflect Y
      new Matrix2x2(-1, 0, 0, -1).toLatex(), // reflect Origin
      new Matrix2x2(0, 1, 1, 0).toLatex(), // reflect y=x
    ];
    const options = makeUniqueOptions(correct.toLatex(), distractors);

    return {
      questionIndex: 0,
      level: "basico",
      questionType: "multiple_choice",
      promptLatex: "¿Cuál es la matriz de transformación estándar para una **reflexión respecto al eje X** en $\\mathbb{R}^2$?",
      optionsLatex: options,
      correctAnswer: correct.toLatex(),
      explanationLatex: "La reflexión respecto al eje X mantiene la coordenada $x$ y cambia de signo a $y$: $T(x, y) = (x, -y)$. En base canónica: $T(e_1) = \\begin{pmatrix} 1 \\\\ 0 \\end{pmatrix}$ y $T(e_2) = \\begin{pmatrix} 0 \\\\ -1 \\end{pmatrix}$. Por tanto, $A = \\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix}$.",
    };
  } else if (picked === "reflect_y") {
    const correct = Matrix2x2.reflectY();
    const distractors = [
      new Matrix2x2(1, 0, 0, -1).toLatex(), // reflect X
      new Matrix2x2(-1, 0, 0, -1).toLatex(), // reflect Origin
      new Matrix2x2(0, -1, -1, 0).toLatex(), // reflect y=-x
    ];
    const options = makeUniqueOptions(correct.toLatex(), distractors);

    return {
      questionIndex: 0,
      level: "basico",
      questionType: "multiple_choice",
      promptLatex: "¿Cuál es la matriz estándar para una reflexión respecto al eje Y en ℝ²?",
      optionsLatex: options,
      correctAnswer: correct.toLatex(),
      explanationLatex: "La reflexión sobre el eje Y invierte el signo de x y mantiene y: T(x, y) = (-x, y). En forma matricial: \\begin{pmatrix} -1 & 0 \\\\ 0 & 1 \\end{pmatrix}.",
    };
  } else {
    const k = randNonZeroInt(2, 5);
    const correct = Matrix2x2.uniformScale(k);
    const distractors = [
      new Matrix2x2(k, 0, 0, 1).toLatex(), // non-uniform
      new Matrix2x2(1, 0, 0, k).toLatex(),
      new Matrix2x2(0, k, k, 0).toLatex(),
    ];
    const options = makeUniqueOptions(correct.toLatex(), distractors);

    return {
      questionIndex: 0,
      level: "basico",
      questionType: "multiple_choice",
      promptLatex: `¿Cuál es la matriz de escalamiento uniforme con factor de escala k = ${k}?`,
      optionsLatex: options,
      correctAnswer: correct.toLatex(),
      explanationLatex: `Un escalamiento uniforme por k multiplica ambas coordenadas por k: T(v) = k · v = \\begin{pmatrix} k & 0 \\\\ 0 & k \\end{pmatrix} v. Con k = ${k}, la matriz es ${correct.toLatex()}.`,
    };
  }
}

/**
 * Q2: Multiplicación matriz-vector básica A * v
 */
export function generateQ2(): QuestionData {
  const a = randInt(-3, 3);
  const b = randInt(-3, 3);
  const c = randInt(-3, 3);
  const d = randInt(-3, 3);
  const M = new Matrix2x2(a, b, c, d);

  const vx = randNonZeroInt(-3, 3);
  const vy = randNonZeroInt(-3, 3);
  const v = new Vector2(vx, vy);

  const correctV = M.mulVector(v);

  // Distractor 1: Row-by-row direct multiplication (common mistake: [a*x, d*y])
  const dist1 = new Vector2(a * vx, d * vy).toLatex();
  // Distractor 2: Inverted columns multiplication: (b*x + a*y, d*x + c*y)
  const dist2 = new Vector2(b * vx + a * vy, d * vx + c * vy).toLatex();
  // Distractor 3: Sign error on second component
  const dist3 = new Vector2(correctV.x, correctV.y.neg()).toLatex();

  const options = makeUniqueOptions(correctV.toLatex(), [dist1, dist2, dist3], () => {
    return new Vector2(randInt(-10, 10), randInt(-10, 10)).toLatex();
  });

  return {
    questionIndex: 1,
    level: "basico",
    questionType: "multiple_choice",
    promptLatex: `Calcula el producto de la matriz por el vector:\n\n$$A = ${M.toLatex()}, \\quad v = ${v.toLatex()}$$\n\n¿Cuál es el vector resultante $A \\cdot v$?`,
    optionsLatex: options,
    correctAnswer: correctV.toLatex(),
    explanationLatex: `Multiplicamos fila por columna:\n\n$x' = (${a})(${vx}) + (${b})(${vy}) = ${correctV.x.toString()}$\n\n$y' = (${c})(${vx}) + (${d})(${vy}) = ${correctV.y.toString()}$\n\nPor tanto, $A \\cdot v = ${correctV.toLatex()}$.`,
  };
}

/**
 * Q3: Reflexión de un vector o escalamiento simple (Numérico: componente específica)
 */
export function generateQ3(): QuestionData {
  const isReflect = Math.random() > 0.5;
  const vx = randNonZeroInt(-5, 5);
  const vy = randNonZeroInt(-5, 5);
  const v = new Vector2(vx, vy);

  if (isReflect) {
    const axis = Math.random() > 0.5 ? "X" : "Y";
    const M = axis === "X" ? Matrix2x2.reflectX() : Matrix2x2.reflectY();
    const res = M.mulVector(v);
    const askComponent = Math.random() > 0.5 ? "x" : "y";
    const answer = askComponent === "x" ? res.x.toString() : res.y.toString();

    return {
      questionIndex: 2,
      level: "basico",
      questionType: "numeric",
      promptLatex: `Al reflejar el vector v = ${v.toLatex()} respecto al eje ${axis}, se obtiene el vector $v' = \\begin{pmatrix} x' \\\\ y' \\end{pmatrix}$.\n\nCalcula el valor numérico de la componente ${askComponent}':`,
      correctAnswer: answer,
      explanationLatex: axis === "X"
        ? `La reflexión respecto al eje X produce $v' = \\begin{pmatrix} ${vx} \\\\ -(${vy}) \\end{pmatrix} = ${res.toLatex()}$. Por tanto, $${askComponent}' = ${answer}$.`
        : `La reflexión respecto al eje Y produce $v' = \\begin{pmatrix} -(${vx}) \\\\ ${vy} \\end{pmatrix} = ${res.toLatex()}$. Por tanto, $${askComponent}' = ${answer}$.`,
    };
  } else {
    const k = randNonZeroInt(-4, 4);
    const res = v.scale(k);
    const askComponent = Math.random() > 0.5 ? "x" : "y";
    const answer = askComponent === "x" ? res.x.toString() : res.y.toString();

    return {
      questionIndex: 2,
      level: "basico",
      questionType: "numeric",
      promptLatex: `Si se aplica un escalamiento con factor k = ${k} al vector v = ${v.toLatex()}, se obtiene $v' = ${k}v$.\n\nCalcula el valor numérico de la componente ${askComponent}':`,
      correctAnswer: answer,
      explanationLatex: `El vector resultante es $v' = ${k} \\cdot ${v.toLatex()} = ${res.toLatex()}$. La componente $${askComponent}'$ es $${answer}$.`,
    };
  }
}

// ---------------------------------------------------------------------------
// LEVEL 2: INTERMEDIO (Preguntas 4, 5, 6, 7)
// ---------------------------------------------------------------------------

/**
 * Q4: Escalamiento no uniforme S(sx, sy) * v
 */
export function generateQ4(): QuestionData {
  const sx = randNonZeroInt(-4, 4);
  let sy = randNonZeroInt(-4, 4);
  while (sy === sx) {
    sy = randNonZeroInt(-4, 4);
  }
  const S = Matrix2x2.scale(sx, sy);

  const vx = randNonZeroInt(-5, 5);
  const vy = randNonZeroInt(-5, 5);
  const v = new Vector2(vx, vy);

  const res = S.mulVector(v);

  // Distractors
  const d1 = new Vector2(sy * vx, sx * vy).toLatex(); // swapped scaling
  const d2 = new Vector2(sx * vx, sx * vy).toLatex(); // uniform sx
  const d3 = new Vector2(sy * vx, sy * vy).toLatex(); // uniform sy

  const options = makeUniqueOptions(res.toLatex(), [d1, d2, d3], () => {
    return new Vector2(randInt(-20, 20), randInt(-20, 20)).toLatex();
  });

  return {
    questionIndex: 3,
    level: "intermedio",
    questionType: "multiple_choice",
    promptLatex: `Se aplica un escalamiento no uniforme con factores sx = ${sx} y sy = ${sy} mediante la matriz:\n\n$$S = ${S.toLatex()}$$\n\nal vector v = ${v.toLatex()}. ¿Cuál es el vector resultante?`,
    optionsLatex: options,
    correctAnswer: res.toLatex(),
    explanationLatex: `Multiplicamos la matriz de escala por el vector:\n\n$S \\cdot v = \\begin{pmatrix} (${sx})(${vx}) \\\\ (${sy})(${vy}) \\end{pmatrix} = ${res.toLatex()}$.`,
  };
}

/**
 * Q5: Rotaciones notables (90°, 180°, 270°, -90°)
 */
export function generateQ5(): QuestionData {
  const angles = [
    { deg: "90^\\circ", mat: Matrix2x2.rotate90(), name: "90° antihorario" },
    { deg: "180^\\circ", mat: Matrix2x2.rotate180(), name: "180°" },
    { deg: "270^\\circ", mat: Matrix2x2.rotate270(), name: "270° antihorario (o -90°)" },
    { deg: "-90^\\circ", mat: Matrix2x2.rotateMinus90(), name: "-90° (sentido horario)" },
  ];
  const choice = angles[randInt(0, angles.length - 1)];

  const vx = randNonZeroInt(-6, 6);
  const vy = randNonZeroInt(-6, 6);
  const v = new Vector2(vx, vy);

  const res = choice.mat.mulVector(v);

  // Distractors simulate angle opposite sign or swapped
  const d1 = choice.mat.mulMatrix(Matrix2x2.reflectX()).mulVector(v).toLatex();
  const d2 = Matrix2x2.rotate90().mulVector(v).toLatex();
  const d3 = Matrix2x2.rotate270().mulVector(v).toLatex();

  const options = makeUniqueOptions(res.toLatex(), [d1, d2, d3], () => {
    return new Vector2(randInt(-8, 8), randInt(-8, 8)).toLatex();
  });

  return {
    questionIndex: 4,
    level: "intermedio",
    questionType: "multiple_choice",
    promptLatex: `Determina la imagen del vector v = ${v.toLatex()} bajo una rotación de ${choice.deg} alrededor del origen:`,
    optionsLatex: options,
    correctAnswer: res.toLatex(),
    explanationLatex: `La matriz de rotación para $${choice.deg}$ es $R = ${choice.mat.toLatex()}$.\n\nAl multiplicar $R \\cdot v = ${res.toLatex()}$.`,
  };
}

/**
 * Q6: Determinante de matriz 2x2 (Numérico)
 */
export function generateQ6(): QuestionData {
  const a = randInt(-4, 5);
  const b = randInt(-4, 5);
  const c = randInt(-4, 5);
  const d = randInt(-4, 5);
  const M = new Matrix2x2(a, b, c, d);

  const det = M.det();

  return {
    questionIndex: 5,
    level: "intermedio",
    questionType: "numeric",
    promptLatex: `Dada la matriz de transformación:\n\n$$A = ${M.toLatex()}$$\n\n**Calcula el valor numérico del determinante $\\det(A)$:**`,
    correctAnswer: det.toString(),
    explanationLatex: `El determinante de una matriz $2 \\times 2$ es $ad - bc$:\n\n$\\det(A) = (${a})(${d}) - (${b})(${c}) = ${a * d} - (${b * c}) = ${det.toString()}$.`,
  };
}

/**
 * Q7: Cálculo de imagen de un vector bajo transformación lineal dada
 */
export function generateQ7(): QuestionData {
  const a = randInt(-3, 4);
  const b = randInt(-3, 4);
  const c = randInt(-3, 4);
  const d = randInt(-3, 4);
  const M = new Matrix2x2(a, b, c, d);

  const vx = randNonZeroInt(-4, 4);
  const vy = randNonZeroInt(-4, 4);
  const v = new Vector2(vx, vy);

  const res = M.mulVector(v);
  const askComp = Math.random() > 0.5 ? "x" : "y";
  const answer = askComp === "x" ? res.x.toString() : res.y.toString();

  return {
    questionIndex: 6,
    level: "intermedio",
    questionType: "numeric",
    promptLatex: `Sea $T: \\mathbb{R}^2 \\to \\mathbb{R}^2$ la transformación lineal con:\n\n$$A = ${M.toLatex()}, \\quad v = ${v.toLatex()}$$\n\nSi $T(v) = \\begin{pmatrix} x' \\\\ y' \\end{pmatrix}$, **ingresa el valor numérico de la componente $${askComp}'$:**`,
    correctAnswer: answer,
    explanationLatex: `Calculamos $T(v) = ${M.toLatex()} ${v.toLatex()} = \\begin{pmatrix} (${a})(${vx}) + (${b})(${vy}) \\\\ (${c})(${vx}) + (${d})(${vy}) \\end{pmatrix} = ${res.toLatex()}$.\n\nLa componente $${askComp}'$ solicitada es $${answer}$.`,
  };
}

// ---------------------------------------------------------------------------
// LEVEL 3: AVANZADO (Preguntas 8, 9, 10)
// ---------------------------------------------------------------------------

/**
 * Q8: Composición de transformaciones B * A (respetando orden de aplicación)
 */
export function generateQ8(): QuestionData {
  const ma1 = randInt(-2, 2);
  const mb1 = randInt(-2, 2);
  const mc1 = randInt(-2, 2);
  const md1 = randInt(-2, 2);
  const A = new Matrix2x2(ma1, mb1, mc1, md1);

  const ma2 = randInt(-2, 2);
  const mb2 = randInt(-2, 2);
  const mc2 = randInt(-2, 2);
  const md2 = randInt(-2, 2);
  const B = new Matrix2x2(ma2, mb2, mc2, md2);

  // Correct composition: (T2 o T1)(v) = B * A * v, so matrix is B * A
  const correct = B.mulMatrix(A);

  // Classic Distractor 1: Order inverted: A * B
  const d1 = A.mulMatrix(B).toLatex();
  // Distractor 2: Element-wise addition
  const d2 = new Matrix2x2(ma1 + ma2, mb1 + mb2, mc1 + mc2, md1 + md2).toLatex();
  // Distractor 3: Element-wise multiplication
  const d3 = new Matrix2x2(ma1 * ma2, mb1 * mb2, mc1 * mc2, md1 * md2).toLatex();

  const options = makeUniqueOptions(correct.toLatex(), [d1, d2, d3], () => {
    return new Matrix2x2(randInt(-5, 5), randInt(-5, 5), randInt(-5, 5), randInt(-5, 5)).toLatex();
  });

  return {
    questionIndex: 7,
    level: "avanzado",
    questionType: "multiple_choice",
    promptLatex: `Sean dos transformaciones lineales con matrices asociadas:\n\n$$A = ${A.toLatex()} \\quad \\text{y} \\quad B = ${B.toLatex()}$$\n\n¿Cuál es la matriz estándar de la composición $(T_2 \\circ T_1)$ que aplica **primero $T_1$ y luego $T_2$**?`,
    optionsLatex: options,
    correctAnswer: correct.toLatex(),
    explanationLatex: `Cuando se aplica primero $T_1$ y luego $T_2$, la fórmula es $(T_2 \\circ T_1)(v) = T_2(T_1(v)) = B(Av) = (B \\cdot A)v$.\n\nPor tanto, la matriz es $B \\cdot A = ${B.toLatex()} ${A.toLatex()} = ${correct.toLatex()}$. Recuerda que el producto de matrices no es conmutativo: $B \\cdot A \\neq A \\cdot B$.`,
  };
}

/**
 * Q9: Vectores canónicos y matriz asociada
 */
export function generateQ9(): QuestionData {
  const u1 = randNonZeroInt(-4, 4);
  const u2 = randInt(-4, 4);
  const v1 = randInt(-4, 4);
  const v2 = randNonZeroInt(-4, 4);

  const T_e1 = new Vector2(u1, u2);
  const T_e2 = new Vector2(v1, v2);

  // The columns of the standard matrix are T(e1) and T(e2):
  // [ u1  v1 ]
  // [ u2  v2 ]
  const correct = new Matrix2x2(u1, v1, u2, v2);

  // Distractor 1: Rows instead of columns (transpose)
  const d1 = new Matrix2x2(u1, u2, v1, v2).toLatex();
  // Distractor 2: Swapped columns
  const d2 = new Matrix2x2(v1, u1, v2, u2).toLatex();
  // Distractor 3: Negated signs
  const d3 = new Matrix2x2(-u1, -v1, -u2, -v2).toLatex();

  const options = makeUniqueOptions(correct.toLatex(), [d1, d2, d3], () => {
    return new Matrix2x2(randInt(-5, 5), randInt(-5, 5), randInt(-5, 5), randInt(-5, 5)).toLatex();
  });

  return {
    questionIndex: 8,
    level: "avanzado",
    questionType: "multiple_choice",
    promptLatex: `Una transformación lineal $T: \\mathbb{R}^2 \\to \\mathbb{R}^2$ envía los vectores de la base canónica a:\n\n$$T(e_1) = ${T_e1.toLatex()}, \\quad T(e_2) = ${T_e2.toLatex()}$$\n\n¿Cuál es la matriz estándar de la transformación $T$?`,
    optionsLatex: options,
    correctAnswer: correct.toLatex(),
    explanationLatex: `Por el Teorema Fundamental de Transformaciones Lineales, las columnas de la matriz estándar $A$ son las imágenes de los vectores canónicos:\n\n$A = \\begin{pmatrix} T(e_1) & T(e_2) \\end{pmatrix} = \\begin{pmatrix} ${u1} & ${v1} \\\\ ${u2} & ${v2} \\end{pmatrix} = ${correct.toLatex()}$.`,
  };
}

/**
 * Q10: Problema integrador (composición geométrica sobre un vector)
 */
export function generateQ10(): QuestionData {
  const is90ThenRefX = Math.random() > 0.5;

  const vx = randNonZeroInt(-5, 5);
  const vy = randNonZeroInt(-5, 5);
  const v = new Vector2(vx, vy);

  let T1: Matrix2x2;
  let T2: Matrix2x2;
  let desc1: string;
  let desc2: string;

  if (is90ThenRefX) {
    T1 = Matrix2x2.rotate90();
    desc1 = "una rotación de $90^\\circ$ antihoraria";
    T2 = Matrix2x2.reflectX();
    desc2 = "una reflexión respecto al eje X";
  } else {
    const k = randInt(2, 3);
    T1 = Matrix2x2.uniformScale(k);
    desc1 = `un escalamiento uniforme de factor k = ${k}`;
    T2 = Matrix2x2.rotate180();
    desc2 = "una rotación de $180^\\circ$";
  }

  const composedMatrix = T2.mulMatrix(T1);
  const correctV = composedMatrix.mulVector(v);

  // Distractor 1: Reverse order of operations (T1 * T2)
  const d1 = T1.mulMatrix(T2).mulVector(v).toLatex();
  // Distractor 2: Applied only first transformation
  const d2 = T1.mulVector(v).toLatex();
  // Distractor 3: Sign error
  const d3 = new Vector2(correctV.x.neg(), correctV.y).toLatex();

  const options = makeUniqueOptions(correctV.toLatex(), [d1, d2, d3], () => {
    return new Vector2(randInt(-15, 15), randInt(-15, 15)).toLatex();
  });

  return {
    questionIndex: 9,
    level: "avanzado",
    questionType: "multiple_choice",
    promptLatex: `Se aplica sucesivamente al vector v = ${v.toLatex()} primero ${desc1}, y a continuación ${desc2}.\n\n¿Cuál es el vector resultante final?`,
    optionsLatex: options,
    correctAnswer: correctV.toLatex(),
    explanationLatex: `La matriz de la primera transformación es $A = ${T1.toLatex()}$ y la de la segunda es $B = ${T2.toLatex()}$.\n\nLa matriz combinada es $M = B \\cdot A = ${composedMatrix.toLatex()}$.\n\nMultiplicando por el vector: $M \\cdot v = ${correctV.toLatex()}$.`,
  };
}
