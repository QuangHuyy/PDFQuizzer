import { PdfService } from "../src/pdf/pdf.service";

describe('parseExamAnswers', () => {
  const service = new PdfService();
  const text = `1. Answer: B Scale is not a project constraint. 2. Answer: C Because 4 is even.`;
  const result = service.parseExamAnswers(text);
  it('should parse answers map', () => {
    expect(result.get(1)?.correctChoice).toBe('B');
    expect(result.get(2)?.explanation).toBe('Because 4 is even.');
  });
});
