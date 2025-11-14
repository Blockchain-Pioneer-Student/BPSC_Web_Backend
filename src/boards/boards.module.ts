import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Board } from './entity/boards.entity';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import { AuthModule } from 'src/core/auth/auth.module';
@Module({
  imports: [TypeOrmModule.forFeature([Board])
    , AuthModule],
  controllers: [BoardsController],
  providers: [BoardsService],
  exports: [BoardsService, TypeOrmModule],
})
export class BoardsModule {}