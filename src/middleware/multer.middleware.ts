/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';

// Tạo thư mục uploads nếu chưa tồn tại
const uploadDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
export const storage = multer.diskStorage({
  destination: function (req: any, file: any, cb: any) {
    cb(null, uploadDir);
  },
  filename: function (req: any, file: any, cb: any) {
    // Tạo tên file unique với timestamp và random number
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname as string);
    const fileName = `${uniqueSuffix}${fileExtension}`;
    cb(null, fileName);
  }
});

// File filter để kiểm tra loại file
export const imageFileFilter = (req: any, file: any, cb: any) => {
  // Kiểm tra MIME type
  if (file.mimetype && file.mimetype.startsWith('image/')) {
    // Kiểm tra extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const fileExtension = path.extname(file.originalname as string).toLowerCase();
    
    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ cho phép upload file ảnh với định dạng: JPG, JPEG, PNG, GIF, WEBP, BMP'), false);
    }
  } else {
    cb(new Error('Chỉ cho phép upload file ảnh!'), false);
  }
};

// Giới hạn kích thước file
export const limits = {
  fileSize: 5 * 1024 * 1024, // 5MB
  files: 10, // Tối đa 10 files cho multiple upload
};

// Multer options cho single file upload
export const singleFileOptions = {
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: limits.fileSize,
  },
};

// Multer options cho multiple files upload
export const multipleFilesOptions = {
  storage,
  fileFilter: imageFileFilter,
  limits,
};

// Default multer instance
const upload = multer({ 
  storage, 
  fileFilter: imageFileFilter, 
  limits 
});

export default upload;