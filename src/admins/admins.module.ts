import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminsController } from './admins.controller';
import { AdminsService } from './admins.service';
import { AdminsRepository } from './admins.repository';
import { Admin } from './entity/admins.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Admin]), UsersModule, AuthModule],
  controllers: [AdminsController],
  providers: [AdminsService, AdminsRepository],
  exports: [AdminsService, AdminsRepository],
})
export class AdminsModule {}