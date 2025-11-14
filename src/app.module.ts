import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './core/database/database.module';
import { EventsModule } from './events/events.module';
import { PartnersModule } from './partners/partners.module';
import { AdminsModule } from './admins/admins.module';
import { AuthModule } from './core/auth/auth.module';
import { BoardsModule } from './boards/boards.module';
import { MembersModule } from './members/members.module';
import { ContactsModule } from './contacts/contacts.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { BlockchainAreasModule } from './blockchain_areas/blockchain_areas.module';
import { UploadModule } from './shared/upload/upload.module';
import { BlogsModule } from './blogs/blogs.module';
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
        limit: 1000, // 10 requests
      },
    ]),
    
    // TypeORM configuration
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // Bật để tự động tạo bảng
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
    BoardsModule,
    MembersModule,
    ContactsModule,
    RegistrationsModule,
    BlockchainAreasModule,
    UploadModule,
    BlogsModule,
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
