import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockchainAreasController } from './blockchain_areas.controller';
import { BlockchainAreasService } from './blockchain_areas.service';
import { BlockchainArea } from './entity/blockchain_areas.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BlockchainArea])],
  controllers: [BlockchainAreasController],
  providers: [BlockchainAreasService],
  exports: [BlockchainAreasService],
})
export class BlockchainAreasModule {}
