import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

@Injectable()
export class PdfService {
  async extractTableOfContents(pdfPath: string): Promise<void> {
    const rawData = new Uint8Array(fs.readFileSync(pdfPath));
    const loadingTask = pdfjsLib.getDocument({ data: rawData });
    const pdf = await loadingTask.promise;

    const outline = await pdf.getOutline();
    if (!outline || outline.length === 0) {
      console.log('⚠️ Không tìm thấy TOC (Outline) trong file PDF');
      return;
    }

    console.log(`✅ Đã tìm thấy ${outline.length} mục trong TOC:\n`);
    outline.forEach((item, index) => {
      console.log(`${index + 1}. ${item.title}`);
    });
  }
}