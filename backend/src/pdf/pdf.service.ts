import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { OutlineType } from '../types'

const pdfjsLib: typeof import('pdfjs-dist') = require('pdfjs-dist/legacy/build/pdf.mjs');

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
}