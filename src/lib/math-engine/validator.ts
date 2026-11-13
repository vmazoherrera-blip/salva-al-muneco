import { Fraction } from "./fraction";

/**
 * Validates equivalence between user submitted answer and the expected answer.
 * Accepts unreduced fractions, reduced fractions, decimals, signed numbers.
 */
export function validateAnswer(
  userAnswer: string,
  expectedAnswer: string,
  questionType: "multiple_choice" | "numeric" = "numeric"
): boolean {
  if (!userAnswer || !expectedAnswer) return false;

  const userTrimmed = userAnswer.trim();
  const expectedTrimmed = expectedAnswer.trim();

  // Direct string equality (case-insensitive for multiple choice letters or exact formulas)
  if (userTrimmed.toLowerCase() === expectedTrimmed.toLowerCase()) {
    return true;
  }

  // Attempt numeric / fractional equivalence
  const uFrac = Fraction.fromString(userTrimmed);
  const eFrac = Fraction.fromString(expectedTrimmed);

  if (uFrac && eFrac) {
    if (uFrac.equals(eFrac)) {
      return true;
    }
    // Tolerance for floating approximations
    if (Math.abs(uFrac.toNumber() - eFrac.toNumber()) < 1e-6) {
      return true;
    }
  }

  return false;
}
