import {
  QuestionData,
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
} from "./templates";

export interface ClientQuestion {
  questionIndex: number;
  level: "basico" | "intermedio" | "avanzado";
  questionType: "multiple_choice" | "numeric";
  promptLatex: string;
  optionsLatex?: string[];
}

export function generateMatchQuestions(): QuestionData[] {
  return [
    generateQ1(),
    generateQ2(),
    generateQ3(),
    generateQ4(),
    generateQ5(),
    generateQ6(),
    generateQ7(),
    generateQ8(),
    generateQ9(),
    generateQ10(),
  ];
}

export function sanitizeQuestionForClient(q: QuestionData): ClientQuestion {
  return {
    questionIndex: q.questionIndex,
    level: q.level,
    questionType: q.questionType,
    promptLatex: q.promptLatex,
    optionsLatex: q.optionsLatex,
  };
}
