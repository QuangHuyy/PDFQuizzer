import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import { OutlineType } from '../types/pdfjsTypes';
import { MCQuestion, ParsedQuestion } from '../types/ParsedQuestion';

@Injectable()
export class PdfService {
  async extractTableOfContents(pdfPath: string): Promise<void> {
    console.log('pdfPath', pdfPath);

    const rawData = new Uint8Array(fs.readFileSync(pdfPath));
    const loadingTask = pdfjsLib.getDocument({ data: rawData });
    const pdf: PDFDocumentProxy = await loadingTask.promise;

    const outline: OutlineType[] = await pdf.getOutline();
    if (!outline || outline.length === 0) {
      console.log('⚠️ Không tìm thấy TOC (Outline) trong file PDF');
      return;
    }

    console.log(`✅ Đã tìm thấy ${outline.length} mục trong TOC:\n`);
    console.log('Outline 1', outline[1]);
    // outline.forEach((item: OutlineType, index: number) => {
    //   console.log(`${item.title}`, item.items[0]);
    //   // console.log(`${index + 1}. ${item.title}`);
    // });
  }

  async extractChapterExamContent(pdfPath: string, chapterTitle: string): Promise<void> {
    const pdf = await this.loadPdf(pdfPath);
    const outline: OutlineType[] | null = await pdf.getOutline();
    const chapterItem: OutlineType | undefined = outline?.find((item) => item.title === chapterTitle);
    if (!chapterItem || !chapterItem.items) {
      console.log(`⚠️ Không tìm thấy chương "${chapterTitle}" hoặc chương không có mục con.`);
      return;
    }

    for (const label of ['exam questions']) {
      const item: OutlineType | undefined = chapterItem.items.find((i) =>
        i.title.toLowerCase().includes(label)
      );
      if (item && item.dest) {
        const startPage = await this.getPageFromDest(pdf, item.dest);
        if (startPage === -1) {
          console.warn(`⚠️ Không xác định được trang bắt đầu cho "${label}"`);
          continue;
        }
        const endPage = await this.findNextOutlinePage(pdf, outline, startPage);
        const fullText = await this.extractFullText(pdf, startPage, endPage);
        const questions: ParsedQuestion[] = this.parseExamQuestions(fullText);
        console.log(questions);
      } else {
        console.log(`⚠️ Không tìm thấy mục "${label}" trong chương "${chapterTitle}"`);
      }
    }
  }


  private parseExamQuestions(text: string): MCQuestion[] {
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

  private async loadPdf(pdfPath: string): Promise<PDFDocumentProxy> {
    const rawData = new Uint8Array(fs.readFileSync(pdfPath));
    const loadingTask = pdfjsLib.getDocument({ data: rawData });
    return await loadingTask.promise;
  }

  private async getPageFromDest(pdf: PDFDocumentProxy, dest: string | any[]): Promise<number> {
    try {
      let ref;
      if (Array.isArray(dest)) {
        ref = dest[0];
      } else {
        const resolved = await pdf.getDestination(dest);
        if (!resolved || !Array.isArray(resolved) || !resolved[0]) {
          throw new Error("Invalid resolved destination.");
        }
        ref = resolved[0];
      }
      const pageIndex: number = await pdf.getPageIndex(ref);
      return pageIndex + 1;
    } catch (error) {
      console.error("❌ Lỗi khi lấy trang từ dest:", error);
      return -1;
    }
  }

  private async extractTextFromPage(pdf: PDFDocumentProxy, pageNum: number): Promise<string> {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    return content.items.map((item: any) => item.str).join(' ');
  }

  private async extractFullText(pdf: PDFDocumentProxy, startPage: number, endPage: number): Promise<string> {
    const chunks: string[] = [];
    for (let i = startPage; i < endPage; i++) {
      const text = await this.extractTextFromPage(pdf, i);
      chunks.push(text);
    }
    return chunks.join(' ');
  }

  private async findNextOutlinePage(
    pdf: PDFDocumentProxy,
    outline: OutlineType[],
    startPage: number
  ): Promise<number> {
    const pageNumbers: number[] = [];

    const collectPages = async (items: OutlineType[]): Promise<void> => {
      for (const item of items) {
        if (item.dest) {
          const page = await this.getPageFromDest(pdf, item.dest);
          if (page > startPage) pageNumbers.push(page);
        }
        if (item.items) await collectPages(item.items);
      }
    };

    await collectPages(outline || []);
    return Math.min(...pageNumbers.filter((p) => p > startPage), pdf.numPages + 1);
  }
}