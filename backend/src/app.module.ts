import { Module } from '@nestjs/common';
import { PdfModule } from './pdf/pdf.module.js';

@Module({
  imports: [PdfModule],
})
export class AppModule {}