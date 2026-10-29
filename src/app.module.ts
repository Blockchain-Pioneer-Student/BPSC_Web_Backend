import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
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
import { SiteContentModule } from './site-content/site-content.module';
import { RecruitmentCampaignsModule } from './recruitment-campaigns/recruitment-campaigns.module';
import { LocalDevelopmentDatabaseService } from './core/database/local-development-database.service';
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
        synchronize:
          configService.get<string>('NODE_ENV') !== 'production' &&
          configService.get<string>('TYPEORM_SYNCHRONIZE') === 'true',
        ssl:
          process.env.NODE_ENV === 'production'
            ? { rejectUnauthorized: false }
            : false,
      }),
      inject: [ConfigService],
    }),
    
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
    SiteContentModule,
    RecruitmentCampaignsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    LocalDevelopmentDatabaseService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
