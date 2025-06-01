
import { PdfService } from "../src/pdf/pdf.service";

describe('parseExamQuestions', () => {
  const service = new PdfService();
  const text = `1. Which of the following is NOT a project constraint? A. Quality B. Scale C. Time D. Cost 2. Which number is even? A. 1 B. 3 C. 4 D. 5`;
  const result = service.parseExamQuestions(text);
  it('should parse two questions', () => {
    expect(result.length).toBe(2);
    expect(result[0].questionNumber).toBe(1);
    expect(result[1].choices.D).toBe('5');
  });
});
