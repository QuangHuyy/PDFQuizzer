import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api.js';
import { OutlineType } from '../types/pdfjsTypes.js';
import { MCQuestion } from '../types/ParsedQuestion.js';
import { mergeQnA, parseExamAnswers, parseExamQuestions } from './pdf.utils.js';

@Injectable()
export class PdfService {

  async extractTableOfContents(pdf: PDFDocumentProxy): Promise<void | OutlineType[]> {
    const outline: OutlineType[] = await pdf.getOutline();
    if (!outline || outline.length === 0) {
      console.log('⚠️ Không tìm thấy TOC (Outline) trong file PDF');
      return;
    }

    console.log(`✅ Đã tìm thấy ${outline.length} mục trong TOC:\n`);
    outline.forEach((item: OutlineType, index: number) => {
      console.log(`${index + 1}. ${item.title}`);
    });

    return outline;
  }

  async extractChapterExamContent(
    pdfPath: string,
    chapterTitle: string,
  ): Promise<void> {
    /* 1 ▸ Nạp tài liệu */
    const pdf = await this.loadPdf(pdfPath);

    /* 2 ▸ Lấy outline và node chương */
    const outline = await this.extractTableOfContents(pdf);
    if (!outline) throw new Error('⚠️  PDF không có TOC / Outline');

    const chapterNode = this.findOutlineItem(outline, chapterTitle);
    if (!chapterNode) throw new Error(`⚠️  Không tìm thấy chapter "${chapterTitle}"`);

    /* 3 ▸ Lấy node Questions & Answers */
    const qNode = chapterNode.items?.find((n) =>
      /^exam\s+questions?/i.test(n.title ?? ''),
    );
    const aNode = chapterNode.items?.find((n) =>
      /^exam\s+answers?/i.test(n.title ?? ''),
    );
    if (!qNode || !aNode || !qNode.dest || !aNode.dest) {
      console.log('⚠️  Chapter không có Exam Questions / Answers');
      return;
    }

    /* 4 ▸ Tính range trang */
    const qStart = await this.getPageFromDest(pdf, qNode.dest);
    const aStart = await this.getPageFromDest(pdf, aNode.dest);
    const qEnd = aStart - 1;

    const idxAnswers = chapterNode.items!.indexOf(aNode);
    const nextSibling = chapterNode.items![idxAnswers + 1];
    const aEnd = nextSibling && nextSibling.dest
      ? (await this.getPageFromDest(pdf, nextSibling.dest)) - 1
      : pdf.numPages;

    /* 5 ▸ Extract文本 */
    const [qText, aText] = await Promise.all([
      this.extractRangeText(pdf, qStart, qEnd),
      this.extractRangeText(pdf, aStart, aEnd),
    ]);

    /* 6 ▸ Parse */
    const questions: MCQuestion[] = parseExamQuestions(qText);
    const answers = parseExamAnswers(aText);
    const full = mergeQnA(questions, answers);

    /* 7 ▸ Log kết quả */
    console.log(JSON.stringify(full, null, 2));
  }
  parseExamAnswers(aText: string) {
    throw new Error('Method not implemented.');
  }

  private findOutlineItem(
    outline: OutlineType[],
    title: string,
  ): OutlineType | undefined {
    for (const item of outline) {
      if ((item.title ?? '').trim() === title.trim()) return item;
      if (item.items?.length) {
        const found = this.findOutlineItem(item.items, title);
        if (found) return found;
      }
    }
    return undefined;
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

  private async extractRangeText(
    pdf: PDFDocumentProxy,
    start: number,
    end: number,
  ): Promise<string> {
    let text = '';
    for (let i = start; i <= end; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((it: any) => it.str)
        .join(' ');
      text += ` ${pageText}`;
    }
    return text.replace(/\s{2,}/g, ' ').trim();
  }

  private async loadPdf(pdfPath: string): Promise<PDFDocumentProxy> {
    const rawData = new Uint8Array(fs.readFileSync(pdfPath));
    const loadingTask = pdfjsLib.getDocument({ data: rawData });
    return await loadingTask.promise;
  }
}