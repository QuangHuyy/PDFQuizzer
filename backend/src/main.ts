import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PdfService } from './pdf/pdf.service';
import * as path from 'path';

declare const __dirname: string;

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const pdfService = app.get(PdfService);

  const pdfPath = path.join(__dirname, '..', 'Pmp Exam Prep Simplified (Andrew Ramdayal).pdf');
  await pdfService.extractTableOfContents(pdfPath);

  await app.close();
}
bootstrap();