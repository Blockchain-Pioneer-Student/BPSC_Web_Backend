import { existsSync, unlinkSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { UploadService } from './upload.service';

describe('UploadService', () => {
  const filePath = join(tmpdir(), `bpsc-upload-${Date.now()}.png`);

  afterEach(() => {
    jest.restoreAllMocks();
    if (existsSync(filePath)) unlinkSync(filePath);
  });

  it('rejects local storage in production and removes the temporary file', async () => {
    writeFileSync(filePath, 'image');
    const config = {
      get: (key: string) =>
        key === 'UPLOAD_STORAGE'
          ? 'local'
          : key === 'NODE_ENV'
            ? 'production'
            : undefined,
    } as unknown as ConfigService;
    const service = new UploadService(config);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(
      service.uploadSingleFile(filePath, 'image.png', 5, 'image/png'),
    ).rejects.toThrow('Failed to store uploaded image');
    expect(existsSync(filePath)).toBe(false);
  });
});
