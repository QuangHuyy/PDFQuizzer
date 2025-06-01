
import { PdfService } from "../src/pdf/pdf.service";
import { MCAnswer, MCQuestion } from '../src/types';

describe('mergeQuestionsAndAnswers', () => {
  const service = new PdfService();
  const qs: MCQuestion[] = [
    { questionNumber: 1, questionText: 'Q1', choices: { A: 'a', B: 'b', C: 'c', D: 'd' } },
    { questionNumber: 2, questionText: 'Q2', choices: { A: 'a1', B: 'b1', C: 'c1', D: 'd1' } },
  ];
  const map: Map<number, MCAnswer> = new Map([
    [1, { correctChoice: 'A', explanation: 'because' }],
    [2, { correctChoice: 'D', explanation: 'why' }]
  ]);
  const merged = service.mergeQnA(qs, map);
  it('should attach answer', () => {
    expect(merged[0].answer).toStrictEqual({ correctChoice: 'A', explanation: 'because' });
    expect(merged[1].answer).toStrictEqual({ correctChoice: 'D', explanation: 'why' });
  });
});
