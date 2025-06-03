import { MCAnswer, MCQuestion } from "../types/index.js";

// Loại bỏ header/footer không mong muốn
export const cleanAnswerBlock = (raw: string): string => {
  return raw
    .replace(/Chapter\s+\d+\s+exam\s+answers?/i, '')
    .replace(/Exam Questions\s+Answers/gi, '')
    .replace(/you are here\s+\d+\s+\d+\s+[^\d]+/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Nhận chuỗi text từ phần “Exam Answers”, trả về Map<num, MCAnswer>
 */
export const parseExamAnswers = (text: string): Map<number, MCAnswer> => {
  const cleaned = cleanAnswerBlock(text);

  // <num>. Answer: <Letter> <giải thích>  (đến câu tiếp theo hoặc hết)
  const aRegex =
    /(?:^|\s)(\d{1,3})\.\s+Answer:\s+([A-D])\s+(.*?)(?=(?:\s+\d{1,3}\.\s+Answer)|$)/gs;

  const answers = new Map<number, MCAnswer>();
  let m: RegExpExecArray | null;

  while ((m = aRegex.exec(cleaned)) !== null) {
    const [, numStr, choice, explain] = m;
    answers.set(Number(numStr), {
      correctChoice: choice as MCAnswer['correctChoice'],
      explanation: explain.trim()
    });
  }
  return answers;
}

export const mergeQnA = (
  questions: MCQuestion[],
  answerMap: Map<number, MCAnswer>
): MCQuestion[] => {
  return questions.map(q => ({
    ...q,
    answer: answerMap.get(q.questionNumber)
  }));
}

export const parseExamQuestions = (text: string): MCQuestion[] => {
  // 1. Làm sạch các phần đầu/trailer của trang
  let cleaned = text
    .replace(/Chapter\s+\d+\s+exam\s+questions?/i, '')
    .replace(/Exam Questions/gi, '')
    .replace(/you are here.*?\d+\s+[^\d]+/i, '')
    .replace(/\s{2,}/g, ' ')        // nhiều space → một space
    .trim();

  // 2. Regex lần lượt khớp block “<num>. … A.… B.… C.… D.…”
  const qRegex =
    /(?:^|\s)(\d{1,3})\.\s+(.*?)\s+A\.\s+(.*?)\s+B\.\s+(.*?)\s+C\.\s+(.*?)\s+D\.\s+(.*?)(?=(?:\s+\d{1,3}\.\s)|$)/gs;

  const questions: MCQuestion[] = [];
  let match: RegExpExecArray | null;

  while ((match = qRegex.exec(cleaned)) !== null) {
    const [
      _full,
      numStr,
      qText,
      choiceA,
      choiceB,
      choiceC,
      choiceD
    ] = match;

    const question: MCQuestion = {
      questionNumber: Number.parseInt(numStr, 10),
      questionText: qText.trim(),
      choices: {
        A: choiceA.trim(),
        B: choiceB.trim(),
        C: choiceC.trim(),
        D: choiceD.trim()
      }
    };

    questions.push(question);
  }

  return questions;
}
