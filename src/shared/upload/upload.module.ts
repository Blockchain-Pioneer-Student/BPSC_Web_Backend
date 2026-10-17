/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { CloudinaryConfig } from '../../core/config/cloudinary.config';
import { storage, imageFileFilter, limits } from '../../core/middleware/multer.middleware';
import { AuthModule } from '../../core/auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MulterModule.register({
      storage,
      fileFilter: imageFileFilter,
      limits,
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService, CloudinaryConfig],
  exports: [UploadService],
})
export class UploadModule {}
