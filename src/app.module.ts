import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { EventsModule } from './events/events.module';
import { PartnersModule } from './partners/partners.module';
import { AdminsModule } from './admins/admins.module';
import { AuthModule } from './auth/auth.module';
@Module({
  imports: [
    // Config module để đọc .env
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Rate limiting: 10 requests per 60 seconds per IP
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 10 requests
      },
    ]),
    
    // TypeORM configuration
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // Tắt auto-sync để tránh conflict với DB hiện có
        ssl:
          process.env.NODE_ENV === 'production'
            ? { rejectUnauthorized: false }
            : false,
      }),
      inject: [ConfigService],
    }),
    
    DatabaseModule,
    EventsModule,
    PartnersModule,
    AdminsModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
