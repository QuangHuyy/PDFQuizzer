import { Controller, Post, Get, Param, UseInterceptors, UploadedFile, ParseIntPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PdfService } from './pdf.service';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (file.mimetype !== 'application/pdf') {
          return callback(new Error('Only PDF files are allowed'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadPDF(@UploadedFile() file: Express.Multer.File) {
    const filePath = await this.pdfService.savePDFFile(file);
    return { filePath };
  }

  @Get(':filePath/toc')
  async getTableOfContents(@Param('filePath') filePath: string) {
    return await this.pdfService.extractTableOfContents(filePath);
  }

  @Get(':filePath/chapter/:chapterNumber/exam')
  async getChapterExamContent(
    @Param('filePath') filePath: string,
    @Param('chapterNumber', ParseIntPipe) chapterNumber: number,
  ) {
    return await this.pdfService.extractChapterExamContent(filePath, chapterNumber);
  }
} 