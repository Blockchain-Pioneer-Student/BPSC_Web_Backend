import { Controller, Get, Post, Body } from '@nestjs/common';
import { BlockchainAreasService } from './blockchain_areas.service';
import { BlockchainArea } from './entity/blockchain_areas.entity';
import { Public } from '../auth/decorators/public.decorator';

@Controller('blockchain-areas')
export class BlockchainAreasController {
  constructor(
    private readonly blockchainAreasService: BlockchainAreasService,
  ) {}

  @Public()
  @Get('get-all')
  async getAllBlockchainAreas(): Promise<{
    success: boolean;
    message: string;
    data: BlockchainArea[];
    count: number;
  }> {
    const areas = await this.blockchainAreasService.getAllBlockchainAreas();

    return {
      success: true,
      message: 'Blockchain areas retrieved successfully',
      data: areas,
      count: areas.length,
    };
  }

  @Public()
  @Post('create')
  async createBlockchainArea(@Body() body: { name: string }): Promise<{
    success: boolean;
    message: string;
    data: BlockchainArea;
  }> {
    const area = await this.blockchainAreasService.createBlockchainArea(
      body.name,
    );

    return {
      success: true,
      message: 'Blockchain area created successfully',
      data: area,
    };
  }

  @Public()
  @Post('init')
  async initBlockchainAreas(): Promise<{
    success: boolean;
    message: string;
    data: BlockchainArea[];
  }> {
    const areas = [
      'DeFi (Decentralized Finance)',
      'NFT (Non-Fungible Tokens)',
      'Smart Contracts',
      'Web3 Development',
      'Cryptocurrency Trading',
      'Blockchain Security',
      'Layer 2 Solutions',
      'Cross-chain Development',
      'GameFi',
      'Metaverse',
      'DAO (Decentralized Autonomous Organization)',
      'Staking & Yield Farming',
    ];

    const createdAreas: BlockchainArea[] = [];
    for (const name of areas) {
      try {
        const area = await this.blockchainAreasService.createBlockchainArea(
          name,
        );
        createdAreas.push(area);
      } catch (error: any) {
        console.log(
          `Area ${name} might already exist:`,
          error?.message || error,
        );
      }
    }

    return {
      success: true,
      message: 'Blockchain areas initialized',
      data: createdAreas,
    };
  }
}
