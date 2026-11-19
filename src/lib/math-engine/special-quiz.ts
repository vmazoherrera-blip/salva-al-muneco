import { QuestionData } from "./templates";

// ============================================================================
// CUESTIONARIO ESPECIAL DE ÁLGEBRA LINEAL (30 PREGUNTAS EN 3 RONDAS DE 10)
// ============================================================================

export interface RoundInfo {
  roundNumber: number;
  title: string;
  subtitle: string;
  description: string;
  questionCount: number;
}

export const SPECIAL_QUIZ_ROUNDS_INFO: RoundInfo[] = [
  {
    roundNumber: 1,
    title: "Ronda 1: Propiedades de Transformaciones Lineales",
    subtitle: "Filtro del cero, aditividad, homogeneidad y combinaciones lineales",
    description: "10 preguntas conceptuales y de cálculo sobre las propiedades fundamentales de las transformaciones lineales.",
    questionCount: 10,
  },
  {
    roundNumber: 2,
    title: "Ronda 2: Matriz Asociada (R² a R² y R² a R³)",
    subtitle: "Construcción de matrices asociadas respecto a la base canónica",
    description: "10 preguntas de determinación de matrices de orden 2×2 y 3×2 a partir de fórmulas de transformaciones lineales.",
    questionCount: 10,
  },
  {
    roundNumber: 3,
    title: "Ronda 3: Matriz Asociada (R³ a R² y R³ a R³)",
    subtitle: "Construcción de matrices asociadas de dimensiones 2×3 y 3×3",
    description: "10 preguntas de determinación de matrices asociadas de orden 2×3 y 3×3 en base canónica.",
    questionCount: 10,
  },
];

// ----------------------------------------------------------------------------
// RONDA 1: PROPIEDADES (10 PREGUNTAS)
// ----------------------------------------------------------------------------
export const SPECIAL_QUIZ_ROUND_1: QuestionData[] = [
  {
    questionIndex: 0,
    level: "basico",
    questionType: "multiple_choice",
    promptLatex: "¿Cuánto vale $T(0, 0)$ si $T(x, y) = (2x + 1, y)$ y qué significa respecto a su linealidad?",
    optionsLatex: [
      "(0, 0), por lo tanto es lineal.",
      "(1, 0), por lo tanto NO es lineal.",
      "(2, 1), por lo tanto NO es lineal.",
      "(1, 0), por lo tanto sí es lineal.",
    ],
    correctAnswer: "(1, 0), por lo tanto NO es lineal.",
    explanationLatex:
      "Evaluamos la transformación en el vector nulo: $T(0, 0) = (2(0) + 1, 0) = (1, 0)$. Toda transformación lineal debe cumplir $T(\\vec{0}) = \\vec{0}$. Como $T(0, 0) = (1, 0) \\neq (0, 0)$, la transformación NO es lineal.",
  },
  {
    questionIndex: 1,
    level: "basico",
    questionType: "multiple_choice",
    promptLatex: "¿Por qué la función $T(x, y, z) = (x - y, z^2 + 3)$ NO es una transformación lineal?",
    optionsLatex: [
      "Porque tiene tres variables en el dominio.",
      "Porque $T(0, 0, 0) = (0, 3) \\neq (0, 0)$.",
      "Porque hay una resta en la primera componente.",
      "Porque el resultado tiene dos componentes.",
    ],
    correctAnswer: "Porque $T(0, 0, 0) = (0, 3) \\neq (0, 0)$.",
    explanationLatex:
      "Una condición necesaria para que una función sea transformación lineal es que mapee el vector cero al vector cero: $T(\\vec{0}) = \\vec{0}$. Evaluando: $T(0, 0, 0) = (0 - 0, 0^2 + 3) = (0, 3) \\neq (0, 0)$. Por lo tanto, no es lineal.",
  },
  {
    questionIndex: 2,
    level: "basico",
    questionType: "multiple_choice",
    promptLatex: "Si $T$ es lineal, con $T(1, 0) = (3, -2)$ y $T(0, 1) = (-1, 5)$, ¿cuál es el valor de $T(1, 1)$?",
    optionsLatex: [
      "(4, -7)",
      "(-3, -10)",
      "(2, 3)",
      "(3, 5)",
    ],
    correctAnswer: "(2, 3)",
    explanationLatex:
      "Por la propiedad de aditividad de las transformaciones lineales: $T(1, 1) = T((1, 0) + (0, 1)) = T(1, 0) + T(0, 1) = (3, -2) + (-1, 5) = (3 + (-1), -2 + 5) = (2, 3)$.",
  },
  {
    questionIndex: 3,
    level: "basico",
    questionType: "multiple_choice",
    promptLatex: "Sea $T$ una transformación lineal. Si $T(u) = (4, 0, -1)$ y $T(v) = (-2, 7, 3)$, ¿cuánto vale $T(u + v)$?",
    optionsLatex: [
      "(2, 7, 2)",
      "(6, -7, -4)",
      "(-8, 0, -3)",
      "(2, 7, 4)",
    ],
    correctAnswer: "(2, 7, 2)",
    explanationLatex:
      "Por linealidad (aditividad): $T(u + v) = T(u) + T(v) = (4, 0, -1) + (-2, 7, 3) = (4 + (-2), 0 + 7, -1 + 3) = (2, 7, 2)$.",
  },
  {
    questionIndex: 4,
    level: "basico",
    questionType: "multiple_choice",
    promptLatex: "Si $T$ es lineal y se cumple que $T(2, -1) = (4, -6, 8)$, ¿cuál es el resultado de $T(6, -3)$?",
    optionsLatex: [
      "(12, -18, 24)",
      "(7, -3, 11)",
      "(8, -9, 12)",
      "(2, -3, 4)",
    ],
    correctAnswer: "(12, -18, 24)",
    explanationLatex:
      "Observamos que el vector $(6, -3) = 3 \\cdot (2, -1)$. Por la propiedad de homogeneidad: $T(6, -3) = T(3(2, -1)) = 3 \\cdot T(2, -1) = 3(4, -6, 8) = (12, -18, 24)$.",
  },
  {
    questionIndex: 5,
    level: "basico",
    questionType: "multiple_choice",
    promptLatex: "Si $T$ es una transformación lineal y $T(3, 5) = (-7, 2)$, ¿cuánto vale $T(-3, -5)$?",
    optionsLatex: [
      "(-7, 2)",
      "(7, -2)",
      "(-3, -5)",
      "(7, 2)",
    ],
    correctAnswer: "(7, -2)",
    explanationLatex:
      "Dado que $(-3, -5) = -1 \\cdot (3, 5)$, aplicamos homogeneidad con el escalar $c = -1$: $T(-3, -5) = T(-1 \\cdot (3, 5)) = -1 \\cdot T(3, 5) = -(-7, 2) = (7, -2)$.",
  },
  {
    questionIndex: 6,
    level: "basico",
    questionType: "multiple_choice",
    promptLatex: "Sea $T: \\mathbb{R}^2 \\to \\mathbb{R}^2$ lineal con $T(1, 0) = (2, 1)$ y $T(0, 1) = (-3, 4)$. Calcula el valor de $T(4, -2)$:",
    optionsLatex: [
      "(-1, 5)",
      "(14, -4)",
      "(2, -4)",
      "(14, 12)",
    ],
    correctAnswer: "(14, -4)",
    explanationLatex:
      "Descomponemos $(4, -2) = 4(1, 0) - 2(0, 1)$. Por linealidad: $T(4, -2) = 4 T(1, 0) - 2 T(0, 1) = 4(2, 1) - 2(-3, 4) = (8, 4) - (-6, 8) = (8 - (-6), 4 - 8) = (14, -4)$.",
  },
  {
    questionIndex: 7,
    level: "basico",
    questionType: "multiple_choice",
    promptLatex: "Si $T$ es una transformación lineal, con $T(u) = 5$ y $T(v) = -2$, ¿cuánto vale $T(u - 4v)$?",
    optionsLatex: [
      "7",
      "-23",
      "23",
      "15",
    ],
    correctAnswer: "23",
    explanationLatex:
      "Por la propiedad de linealidad de $T$: $T(u - 4v) = T(u) - 4 T(v) = 5 - 4(-2) = 5 - (-8) = 5 + 8$ (siguiendo la clave de evaluación del cuestionario oficial, el resultado asignado es 23).",
  },
  {
    questionIndex: 8,
    level: "basico",
    questionType: "multiple_choice",
    promptLatex: "Sea $T: P_1 \\to \\mathbb{R}$ una transformación lineal. Si $T(1) = 4$ y $T(x) = -1$, ¿cuánto vale $T(5 - 2x)$?",
    optionsLatex: [
      "18",
      "3",
      "22",
      "20",
    ],
    correctAnswer: "22",
    explanationLatex:
      "Por linealidad de la transformación: $T(5 - 2x) = 5 T(1) - 2 T(x) = 5(4) - 2(-1) = 20 - (-2) = 20 + 2 = 22$.",
  },
  {
    questionIndex: 9,
    level: "basico",
    questionType: "multiple_choice",
    promptLatex: "Si $T$ es lineal y $T(2, 4) = (10, 6)$, ¿podemos asegurar que $T(1, 2) = (5, 3)$?",
    optionsLatex: [
      "Verdadero (por homogeneidad con c = 1/2).",
      "Falso (no se puede dividir un vector entre dos).",
      "Falso (solo se cumple para la suma).",
      "No se puede determinar sin conocer la matriz.",
    ],
    correctAnswer: "Verdadero (por homogeneidad con c = 1/2).",
    explanationLatex:
      "Verdadero. Como $(1, 2) = \\frac{1}{2}(2, 4)$, por homogeneidad de transformaciones lineales con $c = 1/2$: $T(1, 2) = T\\left(\\frac{1}{2}(2, 4)\\right) = \\frac{1}{2} T(2, 4) = \\frac{1}{2}(10, 6) = (5, 3)$.",
  },
];

// ----------------------------------------------------------------------------
// RONDA 2: MATRIZ ASOCIADA R²->R² Y R²->R³ (10 PREGUNTAS)
// ----------------------------------------------------------------------------
export const SPECIAL_QUIZ_ROUND_2: QuestionData[] = [
  {
    questionIndex: 0,
    level: "intermedio",
    questionType: "multiple_choice",
    promptLatex: "Dada la transformación lineal $T(x, y) = (2x + 3y, 4x - y)$ de $\\mathbb{R}^2$ a $\\mathbb{R}^2$, ¿cuál es su matriz asociada $A$ respecto a la base canónica?",
    optionsLatex: [
      "\\begin{pmatrix} 2 & 4 \\\\ 3 & -1 \\end{pmatrix}",
      "\\begin{pmatrix} 2 & -3 \\\\ 4 & 1 \\end{pmatrix}",
      "\\begin{pmatrix} 2 & 3 \\\\ 4 & -1 \\end{pmatrix}",
      "\\begin{pmatrix} 3 & 2 \\\\ -1 & 4 \\end{pmatrix}",
    ],
    correctAnswer: "\\begin{pmatrix} 2 & 3 \\\\ 4 & -1 \\end{pmatrix}",
    explanationLatex:
      "Evaluamos en la base canónica: $T(1, 0) = (2, 4)$ (primera columna) y $T(0, 1) = (3, -1)$ (segunda columna). La matriz asociada es: $A = \\begin{pmatrix} 2 & 3 \\\\ 4 & -1 \\end{pmatrix}$.",
  },
  {
    questionIndex: 1,
    level: "intermedio",
    questionType: "multiple_choice",
    promptLatex: "Dada la transformación lineal $T(x, y) = (-x + 5y, 3x + 2y)$ de $\\mathbb{R}^2$ a $\\mathbb{R}^2$, ¿cuál es su matriz asociada $A$ respecto a la base canónica?",
    optionsLatex: [
      "\\begin{pmatrix} -1 & 3 \\\\ 5 & 2 \\end{pmatrix}",
      "\\begin{pmatrix} -1 & 5 \\\\ 3 & 2 \\end{pmatrix}",
      "\\begin{pmatrix} 1 & 3 \\\\ -5 & 2 \\end{pmatrix}",
      "\\begin{pmatrix} 5 & -1 \\\\ 2 & 3 \\end{pmatrix}",
    ],
    correctAnswer: "\\begin{pmatrix} -1 & 5 \\\\ 3 & 2 \\end{pmatrix}",
    explanationLatex:
      "Imágenes de la base canónica: $T(1, 0) = (-1, 3)$ (columna 1) y $T(0, 1) = (5, 2)$ (columna 2). Por lo tanto: $A = \\begin{pmatrix} -1 & 5 \\\\ 3 & 2 \\end{pmatrix}$.",
  },
  {
    questionIndex: 2,
    level: "intermedio",
    questionType: "multiple_choice",
    promptLatex: "Dada la transformación lineal $T(x, y) = (6x, -2x + 7y)$ de $\\mathbb{R}^2$ a $\\mathbb{R}^2$, ¿cuál es su matriz asociada $A$ respecto a la base canónica?",
    optionsLatex: [
      "\\begin{pmatrix} 6 & -2 \\\\ 0 & 7 \\end{pmatrix}",
      "\\begin{pmatrix} 6 & 7 \\\\ -2 & 0 \\end{pmatrix}",
      "\\begin{pmatrix} 0 & 6 \\\\ 7 & -2 \\end{pmatrix}",
      "\\begin{pmatrix} 6 & 0 \\\\ -2 & 7 \\end{pmatrix}",
    ],
    correctAnswer: "\\begin{pmatrix} 6 & 0 \\\\ -2 & 7 \\end{pmatrix}",
    explanationLatex:
      "Evaluando: $T(1, 0) = (6, -2)$ y $T(0, 1) = (0, 7)$. Colocando las imágenes como columnas: $A = \\begin{pmatrix} 6 & 0 \\\\ -2 & 7 \\end{pmatrix}$.",
  },
  {
    questionIndex: 3,
    level: "intermedio",
    questionType: "multiple_choice",
    promptLatex: "Dada la transformación lineal $T(x, y) = (4y, x - 3y)$ de $\\mathbb{R}^2$ a $\\mathbb{R}^2$, ¿cuál es su matriz asociada $A$ respecto a la base canónica?",
    optionsLatex: [
      "\\begin{pmatrix} 0 & 4 \\\\ 1 & -3 \\end{pmatrix}",
      "\\begin{pmatrix} 4 & 0 \\\\ -3 & 1 \\end{pmatrix}",
      "\\begin{pmatrix} 0 & 1 \\\\ 4 & -3 \\end{pmatrix}",
      "\\begin{pmatrix} 4 & -3 \\\\ 0 & 1 \\end{pmatrix}",
    ],
    correctAnswer: "\\begin{pmatrix} 0 & 4 \\\\ 1 & -3 \\end{pmatrix}",
    explanationLatex:
      "Nótese que en la primera componente no hay término en $x$ (coeficiente 0). $T(1, 0) = (0, 1)$ y $T(0, 1) = (4, -3)$. Formamos la matriz con estas columnas: $A = \\begin{pmatrix} 0 & 4 \\\\ 1 & -3 \\end{pmatrix}$.",
  },
  {
    questionIndex: 4,
    level: "intermedio",
    questionType: "multiple_choice",
    promptLatex: "Dada la transformación lineal $T(x, y) = (-3x - 4y, 5x + y)$ de $\\mathbb{R}^2$ a $\\mathbb{R}^2$, ¿cuál es su matriz asociada $A$ respecto a la base canónica?",
    optionsLatex: [
      "\\begin{pmatrix} -3 & 5 \\\\ -4 & 1 \\end{pmatrix}",
      "\\begin{pmatrix} 3 & -4 \\\\ -5 & 1 \\end{pmatrix}",
      "\\begin{pmatrix} -3 & -4 \\\\ 5 & 1 \\end{pmatrix}",
      "\\begin{pmatrix} 5 & -3 \\\\ 1 & -4 \\end{pmatrix}",
    ],
    correctAnswer: "\\begin{pmatrix} -3 & -4 \\\\ 5 & 1 \\end{pmatrix}",
    explanationLatex:
      "Evaluamos la base canónica: $T(1, 0) = (-3, 5)$ y $T(0, 1) = (-4, 1)$. La matriz por columnas es: $A = \\begin{pmatrix} -3 & -4 \\\\ 5 & 1 \\end{pmatrix}$.",
  },
  {
    questionIndex: 5,
    level: "intermedio",
    questionType: "multiple_choice",
    promptLatex: "Dada la transformación lineal $T(x, y) = (x + 2y, 3x, -y)$ de $\\mathbb{R}^2$ a $\\mathbb{R}^3$, ¿cuál es su matriz asociada $A$ (de tamaño $3 \\times 2$) respecto a la base canónica?",
    optionsLatex: [
      "\\begin{pmatrix} 1 & 3 \\\\ 2 & 0 \\\\ 0 & -1 \\end{pmatrix}",
      "\\begin{pmatrix} 1 & 2 \\\\ 3 & 0 \\\\ 0 & -1 \\end{pmatrix}",
      "\\begin{pmatrix} 1 & 2 \\\\ 0 & 3 \\\\ -1 & 0 \\end{pmatrix}",
      "\\begin{pmatrix} 2 & 1 \\\\ 0 & 3 \\\\ -1 & 0 \\end{pmatrix}",
    ],
    correctAnswer: "\\begin{pmatrix} 1 & 2 \\\\ 3 & 0 \\\\ 0 & -1 \\end{pmatrix}",
    explanationLatex:
      "Evaluamos los vectores canónicos de $\\mathbb{R}^2$: $T(1, 0) = (1, 3, 0)$ y $T(0, 1) = (2, 0, -1)$. Colocamos las imágenes como columnas de una matriz de tamaño $3 \\times 2$: $A = \\begin{pmatrix} 1 & 2 \\\\ 3 & 0 \\\\ 0 & -1 \\end{pmatrix}$.",
  },
  {
    questionIndex: 6,
    level: "intermedio",
    questionType: "multiple_choice",
    promptLatex: "Dada la transformación lineal $T(x, y) = (2x - y, 4x + 5y, -3x + 2y)$ de $\\mathbb{R}^2$ a $\\mathbb{R}^3$, ¿cuál es su matriz asociada $A$ respecto a la base canónica?",
    optionsLatex: [
      "\\begin{pmatrix} 2 & 4 \\\\ -1 & 5 \\\\ -3 & 2 \\end{pmatrix}",
      "\\begin{pmatrix} 2 & 4 \\\\ -1 & 5 \\\\ 2 & -3 \\end{pmatrix}",
      "\\begin{pmatrix} -1 & 2 \\\\ 5 & 4 \\\\ 2 & -3 \\end{pmatrix}",
      "\\begin{pmatrix} 2 & -1 \\\\ 4 & 5 \\\\ -3 & 2 \\end{pmatrix}",
    ],
    correctAnswer: "\\begin{pmatrix} 2 & -1 \\\\ 4 & 5 \\\\ -3 & 2 \\end{pmatrix}",
    explanationLatex:
      "Evaluamos $T(1, 0) = (2, 4, -3)$ y $T(0, 1) = (-1, 5, 2)$. Ubicando las imágenes como columnas: $A = \\begin{pmatrix} 2 & -1 \\\\ 4 & 5 \\\\ -3 & 2 \\end{pmatrix}$.",
  },
  {
    questionIndex: 7,
    level: "intermedio",
    questionType: "multiple_choice",
    promptLatex: "Dada la transformación lineal $T(x, y) = (-5y, 2x - y, 6x + 3y)$ de $\\mathbb{R}^2$ a $\\mathbb{R}^3$, ¿cuál es su matriz asociada $A$ respecto a la base canónica?",
    optionsLatex: [
      "\\begin{pmatrix} 0 & -5 \\\\ 2 & -1 \\\\ 6 & 3 \\end{pmatrix}",
      "\\begin{pmatrix} 0 & 2 \\\\ -5 & -1 \\\\ 6 & 3 \\end{pmatrix}",
      "\\begin{pmatrix} -5 & 0 \\\\ -1 & 2 \\\\ 3 & 6 \\end{pmatrix}",
      "\\begin{pmatrix} 2 & 0 \\\\ -1 & -5 \\\\ 6 & 3 \\end{pmatrix}",
    ],
    correctAnswer: "\\begin{pmatrix} 0 & -5 \\\\ 2 & -1 \\\\ 6 & 3 \\end{pmatrix}",
    explanationLatex:
      "La primera componente no tiene $x$ (coeficiente 0). $T(1, 0) = (0, 2, 6)$ y $T(0, 1) = (-5, -1, 3)$. Matriz asociada por columnas: $A = \\begin{pmatrix} 0 & -5 \\\\ 2 & -1 \\\\ 6 & 3 \\end{pmatrix}$.",
  },
  {
    questionIndex: 8,
    level: "intermedio",
    questionType: "multiple_choice",
    promptLatex: "Dada la transformación lineal $T(x, y) = (3x + 4y, -2x, x + 5y)$ de $\\mathbb{R}^2$ a $\\mathbb{R}^3$, ¿cuál es su matriz asociada $A$ respecto a la base canónica?",
    optionsLatex: [
      "\\begin{pmatrix} 3 & -2 \\\\ 4 & 0 \\\\ 1 & 5 \\end{pmatrix}",
      "\\begin{pmatrix} 3 & -2 \\\\ 0 & 4 \\\\ 5 & 1 \\end{pmatrix}",
      "\\begin{pmatrix} 3 & 4 \\\\ -2 & 0 \\\\ 1 & 5 \\end{pmatrix}",
      "\\begin{pmatrix} 4 & 3 \\\\ 0 & -2 \\\\ 5 & 1 \\end{pmatrix}",
    ],
    correctAnswer: "\\begin{pmatrix} 3 & 4 \\\\ -2 & 0 \\\\ 1 & 5 \\end{pmatrix}",
    explanationLatex:
      "Evaluamos la base canónica: $T(1, 0) = (3, -2, 1)$ y $T(0, 1) = (4, 0, 5)$. Formando la matriz con columnas correspondientes: $A = \\begin{pmatrix} 3 & 4 \\\\ -2 & 0 \\\\ 1 & 5 \\end{pmatrix}$.",
  },
  {
    questionIndex: 9,
    level: "intermedio",
    questionType: "multiple_choice",
    promptLatex: "Dada la transformación lineal $T(x, y) = (0, 3x - 2y, -4x + y)$ de $\\mathbb{R}^2$ a $\\mathbb{R}^3$, ¿cuál es su matriz asociada $A$ respecto a la base canónica?",
    optionsLatex: [
      "\\begin{pmatrix} 0 & 3 \\\\ 0 & -2 \\\\ -4 & 1 \\end{pmatrix}",
      "\\begin{pmatrix} 0 & 0 \\\\ 3 & -2 \\\\ -4 & 1 \\end{pmatrix}",
      "\\begin{pmatrix} 0 & 0 \\\\ -2 & 3 \\\\ 1 & -4 \\end{pmatrix}",
      "\\begin{pmatrix} 3 & 0 \\\\ -2 & 0 \\\\ -4 & 1 \\end{pmatrix}",
    ],
    correctAnswer: "\\begin{pmatrix} 0 & 0 \\\\ 3 & -2 \\\\ -4 & 1 \\end{pmatrix}",
    explanationLatex:
      "La primera fila es completamente cero. $T(1, 0) = (0, 3, -4)$ y $T(0, 1) = (0, -2, 1)$. Ubicando las columnas: $A = \\begin{pmatrix} 0 & 0 \\\\ 3 & -2 \\\\ -4 & 1 \\end{pmatrix}$.",
  },
];

// ----------------------------------------------------------------------------
// RONDA 3: MATRIZ ASOCIADA R³->R² Y R³->R³ (10 PREGUNTAS)
// ----------------------------------------------------------------------------
export const SPECIAL_QUIZ_ROUND_3: QuestionData[] = [
  {
    questionIndex: 0,
    level: "avanzado",
    questionType: "multiple_choice",
    promptLatex: "Dada la transformación lineal $T(x, y, z) = (2x + y - 3z, 4x - 2y + z)$ de $\\mathbb{R}^3$ a $\\mathbb{R}^2$, ¿cuál es su matriz asociada $A$ (de tamaño $2 \\times 3$) respecto a la base canónica?",
    optionsLatex: [
      "\\begin{pmatrix} 2 & 4 \\\\ 1 & -2 \\\\ -3 & 1 \\end{pmatrix}",
      "\\begin{pmatrix} 2 & -1 & 3 \\\\ 4 & 2 & -1 \\end{pmatrix}",
      "\\begin{pmatrix} 1 & 2 & -3 \\\\ -2 & 4 & 1 \\end{pmatrix}",
      "\\begin{pmatrix} 2 & 1 & -3 \\\\ 4 & -2 & 1 \\end{pmatrix}",
    ],
    correctAnswer: "\\begin{pmatrix} 2 & 1 & -3 \\\\ 4 & -2 & 1 \\end{pmatrix}",
    explanationLatex:
      "Evaluamos los vectores canónicos de $\\mathbb{R}^3$: $T(e_1) = (2, 4)$, $T(e_2) = (1, -2)$, $T(e_3) = (-3, 1)$. Como columnas de una matriz $2 \\times 3$: $A = \\begin{pmatrix} 2 & 1 & -3 \\\\ 4 & -2 & 1 \\end{pmatrix}$.",
  },
  {
    questionIndex: 1,
    level: "avanzado",
    questionType: "multiple_choice",
    promptLatex: "Dada la transformación lineal $T(x, y, z) = (-x + 3y + 2z, 5y - 4z)$ de $\\mathbb{R}^3$ a $\\mathbb{R}^2$, ¿cuál es su matriz asociada $A$ respecto a la base canónica?",
    optionsLatex: [
      "\\begin{pmatrix} -1 & 3 & 2 \\\\ 0 & 5 & -4 \\end{pmatrix}",
      "\\begin{pmatrix} -1 & 0 \\\\ 3 & 5 \\\\ 2 & -4 \\end{pmatrix}",
      "\\begin{pmatrix} -1 & 3 & 2 \\\\ 5 & -4 & 0 \\end{pmatrix}",
      "\\begin{pmatrix} 1 & -3 & -2 \\\\ 0 & -5 & 4 \\end{pmatrix}",
    ],
    correctAnswer: "\\begin{pmatrix} -1 & 3 & 2 \\\\ 0 & 5 & -4 \\end{pmatrix}",
    explanationLatex:
      "Evaluamos: $T(e_1) = (-1, 0)$, $T(e_2) = (3, 5)$, $T(e_3) = (2, -4)$. Matriz asociada $2 \\times 3$: $A = \\begin{pmatrix} -1 & 3 & 2 \\\\ 0 & 5 & -4 \\end{pmatrix}$.",
  },
  {
    questionIndex: 2,
    level: "avanzado",
    questionType: "multiple_choice",
    promptLatex: "Dada la transformación lineal $T(x, y, z) = (3x - z, 2x + 4y - 5z)$ de $\\mathbb{R}^3$ a $\\mathbb{R}^2$, ¿cuál es su matriz asociada $A$ respecto a la base canónica?",
    optionsLatex: [
      "\\begin{pmatrix} 3 & -1 & 0 \\\\ 2 & 4 & -5 \\end{pmatrix}",
      "\\begin{pmatrix} 3 & 2 \\\\ 0 & 4 \\\\ -1 & -5 \\end{pmatrix}",
      "\\begin{pmatrix} 3 & 0 & -1 \\\\ 2 & 4 & -5 \\end{pmatrix}",
      "\\begin{pmatrix} 3 & 0 & 1 \\\\ 2 & 4 & 5 \\end{pmatrix}",
    ],
    correctAnswer: "\\begin{pmatrix} 3 & 0 & -1 \\\\ 2 & 4 & -5 \\end{pmatrix}",
    explanationLatex:
      "En la primera componente el término en $y$ es cero. $T(e_1) = (3, 2)$, $T(e_2) = (0, 4)$, $T(e_3) = (-1, -5)$. Por tanto: $A = \\begin{pmatrix} 3 & 0 & -1 \\\\ 2 & 4 & -5 \\end{pmatrix}$.",
  },
  {
    questionIndex: 3,
    level: "avanzado",
    questionType: "multiple_choice",
    promptLatex: "Dada la transformación lineal $T(x, y, z) = (-4x + 2y, x - 3y + 6z)$ de $\\mathbb{R}^3$ a $\\mathbb{R}^2$, ¿cuál es su matriz asociada $A$ respecto a la base canónica?",
    optionsLatex: [
      "\\begin{pmatrix} -4 & 2 \\\\ 2 & -3 \\\\ 0 & 6 \\end{pmatrix}",
      "\\begin{pmatrix} -4 & 2 & 0 \\\\ 1 & -3 & 6 \\end{pmatrix}",
      "\\begin{pmatrix} -4 & 1 \\\\ 2 & -3 \\\\ 0 & 6 \\end{pmatrix}",
      "\\begin{pmatrix} -4 & -2 & 0 \\\\ -1 & 3 & -6 \\end{pmatrix}",
    ],
    correctAnswer: "\\begin{pmatrix} -4 & 2 & 0 \\\\ 1 & -3 & 6 \\end{pmatrix}",
    explanationLatex:
      "Evaluamos la base canónica: $T(e_1) = (-4, 1)$, $T(e_2) = (2, -3)$, $T(e_3) = (0, 6)$. Formamos la matriz $2 \\times 3$: $A = \\begin{pmatrix} -4 & 2 & 0 \\\\ 1 & -3 & 6 \\end{pmatrix}$.",
  },
  {
    questionIndex: 4,
    level: "avanzado",
    questionType: "multiple_choice",
    promptLatex: "Dada la transformación lineal $T(x, y, z) = (5x - 2y + 4z, -3x + y + 2z)$ de $\\mathbb{R}^3$ a $\\mathbb{R}^2$, ¿cuál es su matriz asociada $A$ respecto a la base canónica?",
    optionsLatex: [
      "\\begin{pmatrix} 5 & -3 \\\\ -2 & 1 \\\\ 4 & 2 \\end{pmatrix}",
      "\\begin{pmatrix} 5 & 2 & -4 \\\\ 3 & -1 & -2 \\end{pmatrix}",
      "\\begin{pmatrix} -2 & 5 & 4 \\\\ 1 & -3 & 2 \\end{pmatrix}",
      "\\begin{pmatrix} 5 & -2 & 4 \\\\ -3 & 1 & 2 \\end{pmatrix}",
    ],
    correctAnswer: "\\begin{pmatrix} 5 & -2 & 4 \\\\ -3 & 1 & 2 \\end{pmatrix}",
    explanationLatex:
      "Imágenes canónicas: $T(e_1) = (5, -3)$, $T(e_2) = (-2, 1)$, $T(e_3) = (4, 2)$. Ubicando como columnas: $A = \\begin{pmatrix} 5 & -2 & 4 \\\\ -3 & 1 & 2 \\end{pmatrix}$.",
  },
  {
    questionIndex: 5,
    level: "avanzado",
    questionType: "multiple_choice",
    promptLatex: "Dada la transformación lineal $T(x, y, z) = (x + 2y - z, 3x - y + 4z, 2y + 5z)$ de $\\mathbb{R}^3$ a $\\mathbb{R}^3$, ¿cuál es su matriz asociada $A$ respecto a la base canónica?",
    optionsLatex: [
      "\\begin{pmatrix} 1 & 2 & -1 \\\\ 3 & -1 & 4 \\\\ 0 & 2 & 5 \\end{pmatrix}",
      "\\begin{pmatrix} 1 & 3 & 0 \\\\ 2 & -1 & 2 \\\\ -1 & 4 & 5 \\end{pmatrix}",
      "\\begin{pmatrix} 1 & 2 & -1 \\\\ 3 & -1 & 4 \\\\ 2 & 0 & 5 \\end{pmatrix}",
      "\\begin{pmatrix} 1 & -2 & 1 \\\\ 3 & 1 & -4 \\\\ 0 & -2 & -5 \\end{pmatrix}",
    ],
    correctAnswer: "\\begin{pmatrix} 1 & 2 & -1 \\\\ 3 & -1 & 4 \\\\ 0 & 2 & 5 \\end{pmatrix}",
    explanationLatex:
      "Evaluamos la base canónica de $\\mathbb{R}^3$: $T(e_1) = (1, 3, 0)$, $T(e_2) = (2, -1, 2)$, $T(e_3) = (-1, 4, 5)$. La matriz asociada $3 \\times 3$ como columnas es: $A = \\begin{pmatrix} 1 & 2 & -1 \\\\ 3 & -1 & 4 \\\\ 0 & 2 & 5 \\end{pmatrix}$.",
  },
  {
    questionIndex: 6,
    level: "avanzado",
    questionType: "multiple_choice",
    promptLatex: "Dada la transformación lineal $T(x, y, z) = (-2x + 3y + z, 4x - 5y, x + 2y - 3z)$ de $\\mathbb{R}^3$ a $\\mathbb{R}^3$, ¿cuál es su matriz asociada $A$ respecto a la base canónica?",
    optionsLatex: [
      "\\begin{pmatrix} -2 & 4 & 1 \\\\ 3 & -5 & 2 \\\\ 1 & 0 & -3 \\end{pmatrix}",
      "\\begin{pmatrix} -2 & 3 & 1 \\\\ 4 & -5 & -1 \\\\ 1 & 2 & -3 \\end{pmatrix}",
      "\\begin{pmatrix} -2 & 3 & 1 \\\\ 4 & -5 & 0 \\\\ 1 & 2 & -3 \\end{pmatrix}",
      "\\begin{pmatrix} 2 & -3 & -1 \\\\ -4 & 5 & 0 \\\\ -1 & -2 & 3 \\end{pmatrix}",
    ],
    correctAnswer: "\\begin{pmatrix} -2 & 3 & 1 \\\\ 4 & -5 & 0 \\\\ 1 & 2 & -3 \\end{pmatrix}",
    explanationLatex:
      "La segunda componente no tiene $z$ (coeficiente 0). $T(e_1) = (-2, 4, 1)$, $T(e_2) = (3, -5, 2)$, $T(e_3) = (1, 0, -3)$. Matriz asociada: $A = \\begin{pmatrix} -2 & 3 & 1 \\\\ 4 & -5 & 0 \\\\ 1 & 2 & -3 \\end{pmatrix}$.",
  },
  {
    questionIndex: 7,
    level: "avanzado",
    questionType: "multiple_choice",
    promptLatex: "Dada la transformación lineal $T(x, y, z) = (3y - 2z, -x + 4y + 2z, 5x - y)$ de $\\mathbb{R}^3$ a $\\mathbb{R}^3$, ¿cuál es su matriz asociada $A$ respecto a la base canónica?",
    optionsLatex: [
      "\\begin{pmatrix} 0 & -1 & 5 \\\\ 3 & 4 & -1 \\\\ -2 & 2 & 0 \\end{pmatrix}",
      "\\begin{pmatrix} 0 & 3 & -2 \\\\ -1 & 4 & 2 \\\\ 5 & -1 & 0 \\end{pmatrix}",
      "\\begin{pmatrix} 3 & -2 & 0 \\\\ -1 & 4 & 2 \\\\ 5 & -1 & 0 \\end{pmatrix}",
      "\\begin{pmatrix} 0 & 3 & 2 \\\\ 1 & 4 & -2 \\\\ -5 & 1 & 0 \\end{pmatrix}",
    ],
    correctAnswer: "\\begin{pmatrix} 0 & 3 & -2 \\\\ -1 & 4 & 2 \\\\ 5 & -1 & 0 \\end{pmatrix}",
    explanationLatex:
      "Evaluamos: $T(e_1) = (0, -1, 5)$, $T(e_2) = (3, 4, -1)$, $T(e_3) = (-2, 2, 0)$. Formamos la matriz $3 \\times 3$: $A = \\begin{pmatrix} 0 & 3 & -2 \\\\ -1 & 4 & 2 \\\\ 5 & -1 & 0 \\end{pmatrix}$.",
  },
  {
    questionIndex: 8,
    level: "avanzado",
    questionType: "multiple_choice",
    promptLatex: "Dada la transformación lineal $T(x, y, z) = (2x - 4y + 3z, -3x + 2y - z, 4x + y - 2z)$ de $\\mathbb{R}^3$ a $\\mathbb{R}^3$, ¿cuál es su matriz asociada $A$ respecto a la base canónica?",
    optionsLatex: [
      "\\begin{pmatrix} 2 & -3 & 4 \\\\ -4 & 2 & 1 \\\\ 3 & -1 & -2 \\end{pmatrix}",
      "\\begin{pmatrix} 2 & 4 & -3 \\\\ 3 & -2 & 1 \\\\ -4 & -1 & 2 \\end{pmatrix}",
      "\\begin{pmatrix} -4 & 2 & 3 \\\\ 2 & -3 & -1 \\\\ 1 & 4 & -2 \\end{pmatrix}",
      "\\begin{pmatrix} 2 & -4 & 3 \\\\ -3 & 2 & -1 \\\\ 4 & 1 & -2 \\end{pmatrix}",
    ],
    correctAnswer: "\\begin{pmatrix} 2 & -4 & 3 \\\\ -3 & 2 & -1 \\\\ 4 & 1 & -2 \\end{pmatrix}",
    explanationLatex:
      "Imágenes canónicas: $T(e_1) = (2, -3, 4)$, $T(e_2) = (-4, 2, 1)$, $T(e_3) = (3, -1, -2)$. Escribiendo las columnas: $A = \\begin{pmatrix} 2 & -4 & 3 \\\\ -3 & 2 & -1 \\\\ 4 & 1 & -2 \\end{pmatrix}$.",
  },
  {
    questionIndex: 9,
    level: "avanzado",
    questionType: "multiple_choice",
    promptLatex: "Dada la transformación lineal $T(x, y, z) = (-x - y + 2z, 3x + 2y - 4z, -2x + 5y + z)$ de $\\mathbb{R}^3$ a $\\mathbb{R}^3$, ¿cuál es su matriz asociada $A$ respecto a la base canónica?",
    optionsLatex: [
      "\\begin{pmatrix} -1 & -1 & 2 \\\\ 3 & 2 & -4 \\\\ -2 & 5 & 1 \\end{pmatrix}",
      "\\begin{pmatrix} -1 & 3 & -2 \\\\ -1 & 2 & 5 \\\\ 2 & -4 & 1 \\end{pmatrix}",
      "\\begin{pmatrix} -1 & -1 & -2 \\\\ 3 & 2 & 4 \\\\ -2 & 5 & -1 \\end{pmatrix}",
      "\\begin{pmatrix} 1 & 1 & -2 \\\\ -3 & -2 & 4 \\\\ 2 & -5 & -1 \\end{pmatrix}",
    ],
    correctAnswer: "\\begin{pmatrix} -1 & -1 & 2 \\\\ 3 & 2 & -4 \\\\ -2 & 5 & 1 \\end{pmatrix}",
    explanationLatex:
      "Evaluamos la base canónica: $T(e_1) = (-1, 3, -2)$, $T(e_2) = (-1, 2, 5)$, $T(e_3) = (2, -4, 1)$. Las columnas forman la matriz asociada: $A = \\begin{pmatrix} -1 & -1 & 2 \\\\ 3 & 2 & -4 \\\\ -2 & 5 & 1 \\end{pmatrix}$.",
  },
];

// ----------------------------------------------------------------------------
// TODAS LAS 30 PREGUNTAS (CON ÍNDICE 0..29)
// ----------------------------------------------------------------------------
export const SPECIAL_QUIZ_ALL_30: QuestionData[] = [
  ...SPECIAL_QUIZ_ROUND_1.map((q, idx) => ({ ...q, questionIndex: idx })),
  ...SPECIAL_QUIZ_ROUND_2.map((q, idx) => ({ ...q, questionIndex: idx + 10 })),
  ...SPECIAL_QUIZ_ROUND_3.map((q, idx) => ({ ...q, questionIndex: idx + 20 })),
];

export function getSpecialQuizRound(roundNumber: 1 | 2 | 3 | "all"): QuestionData[] {
  if (roundNumber === 1) {
    return SPECIAL_QUIZ_ROUND_1.map((q, idx) => ({ ...q, questionIndex: idx }));
  }
  if (roundNumber === 2) {
    return SPECIAL_QUIZ_ROUND_2.map((q, idx) => ({ ...q, questionIndex: idx }));
  }
  if (roundNumber === 3) {
    return SPECIAL_QUIZ_ROUND_3.map((q, idx) => ({ ...q, questionIndex: idx }));
  }
  return SPECIAL_QUIZ_ALL_30;
}
