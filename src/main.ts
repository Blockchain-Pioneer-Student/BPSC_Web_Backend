/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-floating-promises */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import type { NextFunction, Request, Response } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Enable cookie parser for HTTP-only cookies
  app.use(cookieParser());

  const isProduction =
    configService.get<string>('NODE_ENV') === 'production';

  if (!isProduction) {
    const localUploadsDir = path.resolve(process.cwd(), 'uploads');
    fs.mkdirSync(localUploadsDir, { recursive: true });
    app.use('/uploads', express.static(localUploadsDir));
  }

  // Enable CORS for frontend with environment-based origins
  const allowedOrigins = configService
    .get<string>('ALLOWED_ORIGINS')
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) || [
    'http://localhost:8080',
    'http://localhost:8081',
    'https://bpsclub-admin-dashboard.vercel.app',
    'https://web-clb-blockchain-utc.vercel.app',
    'https://bpsclub.com',
    'https://admin.bpsclub.com',
    'https://www.bpsclub.com'
  ];

  // CSRF-style browser origin check for cookie-authenticated mutations.
  // Browser mutations must come from an allowed origin. Bearer/server-to-server
  // requests without auth cookies remain available without Origin/Referer.
  app.use(
    (req: Request, res: Response, next: NextFunction) => {
      const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);
      if (safeMethods.has(req.method.toUpperCase())) {
        return next();
      }

      const origin = req.headers.origin;
      const referer = req.headers.referer;
      let browserOrigin = origin;

      if (!browserOrigin && referer) {
        try {
          browserOrigin = new URL(referer).origin;
        } catch {
          return res.status(403).json({ message: 'Invalid request origin' });
        }
      }

      const hasAuthCookie = Boolean(
        req.cookies?.access_token || req.cookies?.refresh_token,
      );

      if (!browserOrigin && isProduction && hasAuthCookie) {
        return res.status(403).json({ message: 'Request origin is required' });
      }

      if (browserOrigin && !allowedOrigins.includes(browserOrigin)) {
        return res.status(403).json({ message: 'Request origin is not allowed' });
      }

      return next();
    },
  );

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
  const host = isProduction ? '0.0.0.0' : '::'; // '::' accepts both IPv4 and IPv6 localhost in dev

  await app.listen(port, host);

  console.log(
    `🚀 Backend API server running on http://${host}:${port}/api`,
  );
  console.log(
    `📦 Environment: ${configService.get<string>('NODE_ENV') || 'development'}`,
  );
}

bootstrap();
