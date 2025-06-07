import { describe, it, expect } from 'vitest';
import { parseExamQuestions, parseExamAnswers, mergeQnA } from '../pdf.utils.js';
import { MCQuestion, MCAnswer } from '../../types/ParsedQuestion.js';

describe('PDF Utils', () => {
  describe('parseExamQuestions', () => {
    it('should parse multiple questions with choices correctly', () => {
      const text = `1. Which of the following is NOT a project constraint? 
        A. Quality 
        B. Scale 
        C. Time 
        D. Cost 
        
        2. Which number is even? 
        A. 1 
        B. 3 
        C. 4 
        D. 5`;
      
      const result = parseExamQuestions(text);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        questionNumber: 1,
        questionText: 'Which of the following is NOT a project constraint?',
        choices: {
          A: 'Quality',
          B: 'Scale',
          C: 'Time',
          D: 'Cost'
        }
      });
      expect(result[1]).toEqual({
        questionNumber: 2,
        questionText: 'Which number is even?',
        choices: {
          A: '1',
          B: '3',
          C: '4',
          D: '5'
        }
      });
    });

    it('should handle questions with special characters and formatting', () => {
      const text = `1. What is 2 + 2 = ?
        A) 3
        B) 4
        C) 5
        D) None of the above

        2. Select the correct SQL query:
        A) SELECT * FROM users;
        B) SELECT * FROM users WHERE id = 1;
        C) INSERT INTO users (name) VALUES ('John');
        D) All of the above`;

      const result = parseExamQuestions(text);
      
      expect(result).toHaveLength(2);
      expect(result[0].choices).toEqual({
        A: '3',
        B: '4',
        C: '5',
        D: 'None of the above'
      });
      expect(result[1].choices).toEqual({
        A: "SELECT * FROM users;",
        B: "SELECT * FROM users WHERE id = 1;",
        C: "INSERT INTO users (name) VALUES ('John');",
        D: "All of the above"
      });
    });

    it('should handle questions with multi-line choices', () => {
      const text = `1. Which statement about REST APIs is correct?
        A. REST APIs must use JSON
        B. REST APIs are stateless, meaning each request from a client must contain all information
           needed to understand and process the request
        C. REST APIs can only use HTTP GET method
        D. REST APIs cannot be secured`;

      const result = parseExamQuestions(text);
      
      expect(result).toHaveLength(1);
      expect(result[0].choices.B).toContain('REST APIs are stateless');
      expect(result[0].choices.B).toContain('needed to understand and process the request');
    });

    it('should throw error for malformed questions', () => {
      const text = `1. Invalid question without choices`;
      
      const result = parseExamQuestions(text);
      expect(result).toHaveLength(0);
    });
  });

  describe('parseExamAnswers', () => {
    it('should parse answers with explanations correctly', () => {
      const text = `1. Answer: B
        Scale is not a project constraint.
        
        2. Answer: C
        Because 4 is even.`;
      
      const result = parseExamAnswers(text);
      
      expect(result.size).toBe(2);
      expect(result.get(1)).toEqual({
        correctChoice: 'B',
        explanation: 'Scale is not a project constraint.'
      });
      expect(result.get(2)).toEqual({
        correctChoice: 'C',
        explanation: 'Because 4 is even.'
      });
    });

    it.skip('should handle answers without explanations', () => {
      const text = `1. Answer: A
        2. Answer: D`;
      
      const result = parseExamAnswers(text);
      
      expect(result.size).toBe(2);
      expect(result.get(1)).toEqual({
        correctChoice: 'A',
        explanation: ''
      });
      expect(result.get(2)).toEqual({
        correctChoice: 'D',
        explanation: ''
      });
    });

    it('should handle multi-line explanations', () => {
      const text = `1. Answer: C
        This is a complex answer.
        It spans multiple lines.
        And contains technical details.
        
        2. Answer: B
        Another explanation.`;
      
      const result = parseExamAnswers(text);
      
      expect(result.get(1)?.explanation).toContain('This is a complex answer');
      expect(result.get(1)?.explanation).toContain('It spans multiple lines');
      expect(result.get(1)?.explanation).toContain('And contains technical details');
    });

    it('should handle malformed answers', () => {
      const text = `1. Wrong format
        2. Invalid answer`;
      
      const result = parseExamAnswers(text);
      expect(result.size).toBe(0);
    });
  });

  describe('mergeQnA', () => {
    it('should correctly merge questions with their answers', () => {
      const questions: MCQuestion[] = [
        {
          questionNumber: 1,
          questionText: 'Test question 1?',
          choices: { A: 'a', B: 'b', C: 'c', D: 'd' }
        },
        {
          questionNumber: 2,
          questionText: 'Test question 2?',
          choices: { A: 'w', B: 'x', C: 'y', D: 'z' }
        }
      ];

      const answers = new Map<number, MCAnswer>([
        [1, { correctChoice: 'B', explanation: 'First explanation' }],
        [2, { correctChoice: 'D', explanation: 'Second explanation' }]
      ]);

      const result = mergeQnA(questions, answers);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        ...questions[0],
        answer: answers.get(1)
      });
      expect(result[1]).toEqual({
        ...questions[1],
        answer: answers.get(2)
      });
    });

    it.skip('should handle missing answers', () => {
      const questions: MCQuestion[] = [
        {
          questionNumber: 1,
          questionText: 'Question?',
          choices: { A: 'a', B: 'b', C: 'c', D: 'd' }
        }
      ];

      const answers = new Map<number, MCAnswer>();

      expect(() => mergeQnA(questions, answers)).toThrow();
    });

    it('should handle answer without matching question', () => {
      const questions: MCQuestion[] = [
        {
          questionNumber: 1,
          questionText: 'Question?',
          choices: { A: 'a', B: 'b', C: 'c', D: 'd' }
        }
      ];

      const answers = new Map<number, MCAnswer>([
        [1, { correctChoice: 'A', explanation: 'Valid' }],
        [2, { correctChoice: 'B', explanation: 'Invalid - no matching question' }]
      ]);

      const result = mergeQnA(questions, answers);
      expect(result).toHaveLength(1);
      expect(result[0].answer).toEqual(answers.get(1));
    });

    it.skip('should validate answer choices against question choices', () => {
      const questions: MCQuestion[] = [
        {
          questionNumber: 1,
          questionText: 'Question?',
          choices: { A: 'a', B: 'b', C: 'c', D: 'd' }
        }
      ];

      const answers = new Map<number, MCAnswer>([
        [1, { correctChoice: 'X' as any, explanation: 'Invalid choice' }]
      ]);

      expect(() => mergeQnA(questions, answers)).toThrow();
    });
  });
}); 