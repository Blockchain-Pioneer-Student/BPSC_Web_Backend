import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlockchainArea } from './entity/blockchain_areas.entity';

@Injectable()
export class BlockchainAreasService {
  constructor(
    @InjectRepository(BlockchainArea)
    private blockchainAreaRepository: Repository<BlockchainArea>,
  ) {}

  async getAllBlockchainAreas(): Promise<BlockchainArea[]> {
    return await this.blockchainAreaRepository.find({
      order: {
        id: 'ASC',
      },
    });
  }

  async createBlockchainArea(name: string): Promise<BlockchainArea> {
    const area = this.blockchainAreaRepository.create({ name });
    return await this.blockchainAreaRepository.save(area);
  }
}
