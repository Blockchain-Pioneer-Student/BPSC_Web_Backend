/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';

interface UploadFileInput {
  path: string;
  originalName: string;
  size: number;
  mimeType: string;
}

type UploadStorageMode = 'local' | 'cloudinary';

@Injectable()
export class UploadService {
  private cloudinaryConfigured = false;

  constructor(private readonly configService: ConfigService) {}

  async uploadSingleFile(
    filePath: string,
    originalName: string,
    size: number,
    mimeType: string,
  ): Promise<any> {
    this.validateUploadedFile({ path: filePath, filename: originalName });

    try {
      const fileStats = fs.statSync(filePath);
      const originalFileSize = fileStats.size || size;

      if (this.getStorageMode() === 'local') {
        const fileName = path.basename(filePath);
        const baseUrl = (
          this.configService.get<string>('LOCAL_UPLOAD_BASE_URL') ||
          `http://localhost:${this.configService.get<string>('PORT') || '10000'}`
        ).replace(/\/$/, '');

        return {
          url: `${baseUrl}/uploads/${encodeURIComponent(fileName)}`,
          public_id: fileName,
          file_info: {
            original_name: originalName,
            size: originalFileSize,
            mime_type: mimeType,
          },
        };
      }

      const result = await this.safeCloudinaryUpload(filePath);
      if (!result?.secure_url) {
        throw new Error('Cloudinary did not return a secure image URL');
      }

      this.cleanupTempFile(filePath);
      return {
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        file_info: {
          original_name: originalName,
          size: originalFileSize,
          mime_type: mimeType,
        },
      };
    } catch (error) {
      this.cleanupTempFile(filePath);
      console.error('Error storing uploaded image:', error);
      throw new Error('Failed to store uploaded image');
    }
  }

  async uploadMultipleFiles(files: UploadFileInput[]): Promise<any[]> {
    return Promise.all(
      files.map((file) =>
        this.uploadSingleFile(
          file.path,
          file.originalName,
          file.size,
          file.mimeType,
        ),
      ),
    );
  }

  cleanupTempFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (error) {
      console.error('Could not delete temporary upload:', error);
    }
  }

  private getStorageMode(): UploadStorageMode {
    const configuredMode = this.configService
      .get<string>('UPLOAD_STORAGE')
      ?.trim()
      .toLowerCase();

    if (configuredMode === 'local' || configuredMode === 'cloudinary') {
      if (
        configuredMode === 'local' &&
        this.configService.get<string>('NODE_ENV') === 'production'
      ) {
        throw new Error(
          'Local upload storage is not supported in production; use Cloudinary.',
        );
      }
      return configuredMode;
    }

    if (configuredMode) {
      throw new Error(
        `Unsupported UPLOAD_STORAGE value "${configuredMode}". Use "local" or "cloudinary".`,
      );
    }

    return this.configService.get<string>('NODE_ENV') === 'production'
      ? 'cloudinary'
      : 'local';
  }

  private async safeCloudinaryUpload(filePath: string): Promise<any> {
    if (!this.cloudinaryConfigured) {
      const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
      const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
      const apiSecret =
        this.configService.get<string>('CLOUDINARY_API_SECRET') ||
        this.configService.get<string>('CLOUDINARY_SECRET_KEY');

      if (!cloudName || !apiKey || !apiSecret) {
        throw new Error(
          'Cloudinary credentials are required when UPLOAD_STORAGE=cloudinary',
        );
      }

      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
      this.cloudinaryConfigured = true;
    }

    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        filePath,
        { folder: 'bpsclub', resource_type: 'image' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );
    });
  }

  private validateUploadedFile(file: { path: string; filename: string }): void {
    if (!file?.path || !file.filename) {
      throw new BadRequestException('File processing failed');
    }
    if (!fs.existsSync(file.path)) {
      throw new BadRequestException('Uploaded file not found');
    }
  }
}
