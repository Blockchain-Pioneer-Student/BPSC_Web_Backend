/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from './entity/contacts.entity';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Contact]),
    AuthModule],
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [ContactsService, TypeOrmModule],
})
export class ContactsModule {}
