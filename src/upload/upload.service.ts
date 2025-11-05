/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, BadRequestException } from '@nestjs/common';
import { CloudinaryConfig } from '../config/cloudinary.config';
import cloudinary from '../config/cloudinary.config';
import * as fs from 'fs';

@Injectable()
export class UploadService {
  constructor(private readonly cloudinaryConfig: CloudinaryConfig) {
    // Cloudinary đã được cấu hình
  }

  async uploadSingleFile(
    filePath: string,
    originalName: string,
    size: number,
    mimeType: string,
  ): Promise<any> {
    try {
      this.validateUploadedFile({ path: filePath, filename: originalName });
      const result = await this.safeUpload(filePath);
      if (!result || !result.secure_url) {
        throw new Error('Failed to retrieve secure URL from Cloudinary response');
      }
      this.cleanupTempFile(filePath);
      return {
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        file_info: {
          original_name: originalName,
          size: size,
          mime_type: mimeType,
        },
      };
    } catch (error) {
      console.error('Error uploading file to Cloudinary:', error);
      throw new Error('Failed to upload file');
    }
  }

  async uploadMultipleFiles(
    files: { path: string; originalName: string; size: number; mimeType: string }[],
  ): Promise<any[]> {
    try {
      for (const file of files) {
        this.validateUploadedFile({ path: file.path, filename: file.originalName });
      }
      const uploadPromises = files.map(async (file) => {
        const result = await this.safeUpload(file.path);
        if (!result || !result.secure_url) {
          throw new Error('Failed to retrieve secure URL from Cloudinary response');
        }
        this.cleanupTempFile(file.path);
        return {
          url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
          file_info: {
            original_name: file.originalName,
            size: file.size,
            mime_type: file.mimeType,
          },
        };
      });
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading files to Cloudinary:', error);
      throw new Error('Failed to upload files');
    }
  }

  cleanupTempFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Temporary file ${filePath} deleted successfully.`);
      }
    } catch (error) {
      console.error(`Error deleting temporary file ${filePath}:`, error);
    }
  }

  private async safeUpload(filePath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        filePath,
        {
          folder: 'bpsclub/events',
          resource_type: 'image',
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto' },
            { format: 'webp' },
          ],
        },
        (error: any, result: any) => {
          if (error) {
            reject(new Error(`Cloudinary upload error: ${error.message || 'Unknown error'}`));
          } else if (result) {
            resolve(result);
          } else {
            reject(new Error('Unknown error during Cloudinary upload'));
          }
        },
      );
    });
  }

  private validateUploadedFile(file: { path: string; filename: string }): void {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Kiểm tra file đã được xử lý bởi multer
    if (!file.path || !file.filename) {
      throw new BadRequestException('File processing failed');
    }

    // Kiểm tra file có tồn tại trên disk không
    if (!fs.existsSync(file.path)) {
      throw new BadRequestException('Uploaded file not found');
    }
  }
}