/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable prettier/prettier */
import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFile, 
  UploadedFiles,
  BadRequestException,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { UploadService } from './upload.service';
import { singleFileOptions, multipleFilesOptions } from '../middleware/multer.middleware';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', singleFileOptions))
  async uploadSingleFile(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const result = await this.uploadService.uploadSingleFile(
        file.path,
        file.originalname,
        file.size,
        file.mimetype,
      );

      return {
        url: result.url,
        publicId: result.public_id,
        originalName: result.file_info.original_name,
        size: result.file_info.size,
        format: extname(result.file_info.original_name).substring(1),
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw new BadRequestException('Failed to upload file');
    }
  }

  @Post('multiple')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FilesInterceptor('files', 10, multipleFilesOptions))
  async uploadMultipleFiles(@UploadedFiles() files: any[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    try {
      const fileData = files.map(file => ({
        path: file.path,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      }));

      const results = await this.uploadService.uploadMultipleFiles(fileData);

      return results.map(result => ({
        url: result.url,
        publicId: result.public_id,
        originalName: result.file_info.original_name,
        size: result.file_info.size,
        format: extname(result.file_info.original_name).substring(1),
        width: result.width,
        height: result.height,
      }));
    } catch (error) {
      console.error('Multiple upload error:', error);
      throw new BadRequestException('Failed to upload files');
    }
  }
}
