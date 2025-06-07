import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PdfService } from '../pdf.service.js';
import { OutlineType } from '../../types/pdfjsTypes.js';
import { MCQuestion } from '../../types/ParsedQuestion.js';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import * as fs from 'fs';

vi.mock('fs');
vi.mock('pdfjs-dist/legacy/build/pdf.mjs');

describe('PdfService', () => {
  let service: PdfService;
  let mockPdf: any;
  let mockColor: Uint8ClampedArray;

  beforeEach(() => {
    service = new PdfService();
    mockPdf = {
      getOutline: vi.fn(),
      getDestination: vi.fn(),
      getPageIndex: vi.fn(),
      getPage: vi.fn(),
      numPages: 10
    };
    mockColor = new Uint8ClampedArray([0, 0, 0]);
  });

  describe('extractTableOfContents', () => {
    it('should extract and return outline items', async () => {
      const mockOutline: Partial<OutlineType>[] = [
        { 
          title: 'Chapter 1', 
          items: [], 
          bold: false, 
          italic: false, 
          color: mockColor,
          url: null,
          unsafeUrl: undefined,
          newWindow: undefined,
          count: undefined,
          dest: null
        },
        { 
          title: 'Chapter 2', 
          items: [], 
          bold: false, 
          italic: false, 
          color: mockColor,
          url: null,
          unsafeUrl: undefined,
          newWindow: undefined,
          count: undefined,
          dest: null
        }
      ];
      mockPdf.getOutline.mockResolvedValue(mockOutline);

      const result = await service.extractTableOfContents(mockPdf);

      expect(result).toEqual(mockOutline);
      expect(mockPdf.getOutline).toHaveBeenCalled();
    });

    it('should handle empty outline', async () => {
      mockPdf.getOutline.mockResolvedValue([]);

      const result = await service.extractTableOfContents(mockPdf);

      expect(result).toBeUndefined();
    });
  });

  describe('extractChapterExamContent', () => {
    const mockOutline: Partial<OutlineType>[] = [
      {
        title: 'Chapter 1',
        items: [
          { 
            title: 'Exam Questions', 
            dest: 'q1', 
            bold: false, 
            italic: false, 
            color: mockColor,
            url: null,
            unsafeUrl: undefined,
            newWindow: undefined,
            count: undefined,
            items: []
          },
          { 
            title: 'Exam Answers', 
            dest: 'a1', 
            bold: false, 
            italic: false, 
            color: mockColor,
            url: null,
            unsafeUrl: undefined,
            newWindow: undefined,
            count: undefined,
            items: []
          },
          { 
            title: 'Next Section', 
            dest: 'next', 
            bold: false, 
            italic: false, 
            color: mockColor,
            url: null,
            unsafeUrl: undefined,
            newWindow: undefined,
            count: undefined,
            items: []
          }
        ],
        bold: false,
        italic: false,
        color: mockColor,
        url: null,
        unsafeUrl: undefined,
        newWindow: undefined,
        count: undefined,
        dest: null
      }
    ];

    beforeEach(() => {
      vi.spyOn(service as any, 'loadPdf').mockResolvedValue(mockPdf);
      mockPdf.getOutline.mockResolvedValue(mockOutline);
      mockPdf.getDestination.mockImplementation(async (dest: string) => {
        const destMap: Record<string, string[]> = {
          q1: ['page2'],
          a1: ['page4'],
          next: ['page6']
        };
        return destMap[dest];
      });
      mockPdf.getPageIndex.mockImplementation(async (ref: string) => {
        const pageMap: Record<string, number> = {
          page2: 1,
          page4: 3,
          page6: 5
        };
        return pageMap[ref];
      });
      mockPdf.getPage.mockImplementation(async () => ({
        getTextContent: async () => ({
          items: [{ str: 'Sample text' }]
        })
      }));
    });

    it('should extract chapter exam content successfully', async () => {
      await service.extractChapterExamContent('test.pdf', 'Chapter 1');

      expect(mockPdf.getOutline).toHaveBeenCalled();
      expect(mockPdf.getDestination).toHaveBeenCalledWith('q1');
      expect(mockPdf.getDestination).toHaveBeenCalledWith('a1');
      expect(mockPdf.getPage).toHaveBeenCalled();
    });

    it('should throw error for non-existent chapter', async () => {
      await expect(service.extractChapterExamContent('test.pdf', 'Non-existent Chapter'))
        .rejects.toThrow('⚠️  Không tìm thấy chapter');
    });

    it('should handle missing exam sections', async () => {
      const outlineWithoutExam = [
        {
          title: 'Chapter 1',
          items: [
            { 
              title: 'Section 1', 
              dest: 's1',
              bold: false,
              italic: false,
              color: mockColor,
              url: null,
              unsafeUrl: undefined,
              newWindow: undefined,
              count: undefined,
              items: []
            },
            { 
              title: 'Section 2', 
              dest: 's2',
              bold: false,
              italic: false,
              color: mockColor,
              url: null,
              unsafeUrl: undefined,
              newWindow: undefined,
              count: undefined,
              items: []
            }
          ],
          bold: false,
          italic: false,
          color: mockColor,
          url: null,
          unsafeUrl: undefined,
          newWindow: undefined,
          count: undefined,
          dest: null
        }
      ];
      mockPdf.getOutline.mockResolvedValue(outlineWithoutExam);

      await service.extractChapterExamContent('test.pdf', 'Chapter 1');
      // Should log warning but not throw error
    });

    it('should handle missing destination in exam sections', async () => {
      const outlineWithMissingDest = [
        {
          title: 'Chapter 1',
          items: [
            { 
              title: 'Exam Questions',
              dest: null,
              bold: false,
              italic: false,
              color: mockColor,
              url: null,
              unsafeUrl: undefined,
              newWindow: undefined,
              count: undefined,
              items: []
            },
            { 
              title: 'Exam Answers',
              dest: null,
              bold: false,
              italic: false,
              color: mockColor,
              url: null,
              unsafeUrl: undefined,
              newWindow: undefined,
              count: undefined,
              items: []
            }
          ],
          bold: false,
          italic: false,
          color: mockColor,
          url: null,
          unsafeUrl: undefined,
          newWindow: undefined,
          count: undefined,
          dest: null
        }
      ];
      mockPdf.getOutline.mockResolvedValue(outlineWithMissingDest);

      await service.extractChapterExamContent('test.pdf', 'Chapter 1');
      // Should log warning but not throw error
    });

    it('should handle invalid page references', async () => {
      mockPdf.getPageIndex.mockRejectedValue(new Error('Invalid page reference'));

      await service.extractChapterExamContent('test.pdf', 'Chapter 1');
      // Should log error but not throw
    });

    it.skip('should handle text extraction errors', async () => {
      mockPdf.getPage.mockRejectedValue(new Error('Failed to extract text'));

      await expect(
        service.extractChapterExamContent('test.pdf', 'Chapter 1')
      ).resolves.not.toThrow();
      // Should log error but not throw
    });

    it('should handle nested chapters', async () => {
      const nestedOutline = [
        {
          title: 'Part 1',
          items: [
            {
              title: 'Chapter 1',
              items: [
                { 
                  title: 'Exam Questions', 
                  dest: 'q1',
                  bold: false,
                  italic: false,
                  color: mockColor,
                  url: null,
                  unsafeUrl: undefined,
                  newWindow: undefined,
                  count: undefined,
                  items: []
                },
                { 
                  title: 'Exam Answers', 
                  dest: 'a1',
                  bold: false,
                  italic: false,
                  color: mockColor,
                  url: null,
                  unsafeUrl: undefined,
                  newWindow: undefined,
                  count: undefined,
                  items: []
                }
              ],
              bold: false,
              italic: false,
              color: mockColor,
              url: null,
              unsafeUrl: undefined,
              newWindow: undefined,
              count: undefined,
              dest: null
            }
          ],
          bold: false,
          italic: false,
          color: mockColor,
          url: null,
          unsafeUrl: undefined,
          newWindow: undefined,
          count: undefined,
          dest: null
        }
      ];
      mockPdf.getOutline.mockResolvedValue(nestedOutline);

      await service.extractChapterExamContent('test.pdf', 'Chapter 1');
      expect(mockPdf.getDestination).toHaveBeenCalledWith('q1');
      expect(mockPdf.getDestination).toHaveBeenCalledWith('a1');
    });
  });

  describe('PDF loading and text extraction', () => {
    it('should load PDF file correctly', async () => {
      const mockRawData = new Uint8Array([1, 2, 3]);
      (fs.readFileSync as any).mockReturnValue(mockRawData);
      (pdfjsLib.getDocument as any).mockReturnValue({ promise: Promise.resolve(mockPdf) });

      const pdf = await (service as any).loadPdf('test.pdf');

      expect(fs.readFileSync).toHaveBeenCalledWith('test.pdf');
      expect(pdfjsLib.getDocument).toHaveBeenCalledWith({ data: mockRawData });
      expect(pdf).toBe(mockPdf);
    });

    it('should handle file read errors', async () => {
      (fs.readFileSync as any).mockImplementation(() => {
        throw new Error('File not found');
      });

      await expect((service as any).loadPdf('nonexistent.pdf'))
        .rejects.toThrow('File not found');
    });

    it('should handle PDF parsing errors', async () => {
      const mockRawData = new Uint8Array([1, 2, 3]);
      (fs.readFileSync as any).mockReturnValue(mockRawData);
      (pdfjsLib.getDocument as any).mockReturnValue({ 
        promise: Promise.reject(new Error('Invalid PDF format')) 
      });

      await expect((service as any).loadPdf('invalid.pdf'))
        .rejects.toThrow('Invalid PDF format');
    });

    it.skip('should extract text from page range', async () => {
      const mockPage = {
        getTextContent: vi.fn().mockResolvedValue({
          items: [
            { str: 'First' },
            { str: 'Second' }
          ]
        })
      };
      mockPdf.getPage.mockResolvedValue(mockPage);

      const text = await (service as any).extractRangeText(mockPdf, 1, 2);

      expect(mockPdf.getPage).toHaveBeenCalledTimes(2);
      expect(text).toBe('First Second');
    });

    it('should handle page extraction errors', async () => {
      mockPdf.getPage.mockRejectedValue(new Error('Page not found'));

      await expect((service as any).extractRangeText(mockPdf, 1, 2))
        .rejects.toThrow('Page not found');
    });

    it('should handle page index resolution', async () => {
      mockPdf.getDestination.mockResolvedValue(['page1']);
      mockPdf.getPageIndex.mockResolvedValue(0);

      const pageNum = await (service as any).getPageFromDest(mockPdf, 'dest1');

      expect(mockPdf.getDestination).toHaveBeenCalledWith('dest1');
      expect(mockPdf.getPageIndex).toHaveBeenCalledWith('page1');
      expect(pageNum).toBe(1);
    });

    it('should handle invalid destination', async () => {
      mockPdf.getDestination.mockResolvedValue(null);

      const pageNum = await (service as any).getPageFromDest(mockPdf, 'invalid');

      expect(pageNum).toBe(-1);
    });

    it('should handle direct array destination', async () => {
      mockPdf.getPageIndex.mockResolvedValue(1);

      const pageNum = await (service as any).getPageFromDest(mockPdf, ['page2']);

      expect(mockPdf.getPageIndex).toHaveBeenCalledWith('page2');
      expect(pageNum).toBe(2);
    });

    it('should handle page index resolution errors', async () => {
      mockPdf.getDestination.mockResolvedValue(['page1']);
      mockPdf.getPageIndex.mockRejectedValue(new Error('Invalid page reference'));

      const pageNum = await (service as any).getPageFromDest(mockPdf, 'dest1');

      expect(pageNum).toBe(-1);
    });
  });
}); 