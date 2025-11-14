/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from './entity/members.entity';
import { MemberRole } from './entity/member_roles.entity';
import { MemberSocial } from './entity/member_socials.entity';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { MembersRepository } from './members.repository';
import { BoardsModule } from '../boards/boards.module';
import { AuthModule } from 'src/core/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Member, MemberRole, MemberSocial]),
    BoardsModule,
    AuthModule,
  ],
  controllers: [MembersController],
  providers: [MembersService, MembersRepository],
  exports: [MembersService, MembersRepository, TypeOrmModule],
})
export class MembersModule {}