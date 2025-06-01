import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PdfService } from './pdf/pdf.service';
import * as path from 'path';

declare const __dirname: string;
const ritaFileName = "[Should_Read] Rita PMP 10 - Bookmarked .pdf"
const headFirstFileName = "Head First PMP 04.pdf"
const simplifiedFileName = "Pmp Exam Prep Simplified (Andrew Ramdayal).pdf"

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const pdfService = app.get(PdfService);

  const pdfPath = path.join(__dirname, '..', headFirstFileName);
  // await pdfService.extractTableOfContents(pdfPath);
  const title = '2: The organizational environment';
  await pdfService.extractChapterExamContent(pdfPath, title);

  await app.close();
}
bootstrap();