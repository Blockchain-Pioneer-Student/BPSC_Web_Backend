/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-floating-promises */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Enable CORS for frontend with environment-based origins
  const allowedOrigins = configService
    .get<string>('ALLOWED_ORIGINS')
    ?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://shop-nest-premium.onrender.com',
    'https://shop-nest-premium.vercel.app',
  ];

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Set global API prefix
  app.setGlobalPrefix('api');

  // Enable validation pipes globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove non-DTO properties
      forbidNonWhitelisted: true, // Throw error for non-DTO properties
      transform: true, // Auto transform payloads
    }),
  );

  const port = configService.get<number>('PORT') || 10000; // Use PORT from environment or default to 10000
  const host = configService.get<string>('NODE_ENV') === 'production'
    ? '0.0.0.0'
    : 'localhost';

  await app.listen(port, host);

  console.log(
    `🚀 Backend API server running on http://${host}:${port}/api`,
  );
  console.log(
    `📦 Environment: ${configService.get<string>('NODE_ENV') || 'development'}`,
  );
}

bootstrap();