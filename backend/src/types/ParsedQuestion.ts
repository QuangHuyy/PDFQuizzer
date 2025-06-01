export type ParsedQuestion = {
  questionNumber: number;
  questionText: string;
  choices: {
    A?: string;
    B?: string;
    C?: string;
    D?: string;
  };
};

export interface MCQChoices {
  A: string;
  B: string;
  C: string;
  D: string;
}

export interface MCQuestion {
  questionNumber: number;
  questionText: string;
  choices: MCQChoices;
  answer?: MCAnswer;
}

export interface MCAnswer {
  correctChoice: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}
