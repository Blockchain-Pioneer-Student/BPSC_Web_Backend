/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Registration } from './entity/registrations.entity';
import { RegistrationBlockchainArea } from './entity/registration_blockchain_areas.entity';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { BlockchainArea } from '../blockchain_areas/entity/blockchain_areas.entity';

@Injectable()
export class RegistrationsService {
  constructor(
    @InjectRepository(Registration)
    private registrationRepository: Repository<Registration>,
    @InjectRepository(RegistrationBlockchainArea)
    private registrationBlockchainAreaRepository: Repository<RegistrationBlockchainArea>,
    @InjectRepository(BlockchainArea)
    private blockchainAreaRepository: Repository<BlockchainArea>,
  ) {}

  async createRegistration(
    createRegistrationDto: CreateRegistrationDto,
  ): Promise<Registration> {
    const { blockchain_area_ids, ...registrationData } = createRegistrationDto;

    // Create registration
    const registration = this.registrationRepository.create(registrationData);
    const savedRegistration = await this.registrationRepository.save(
      registration,
    );

    // If blockchain areas are provided, create the associations
    if (blockchain_area_ids && blockchain_area_ids.length > 0) {
      // Validate that all area IDs exist
      const areas = await this.blockchainAreaRepository.findBy({
        id: In(blockchain_area_ids),
      });
      if (areas.length !== blockchain_area_ids.length) {
        throw new BadRequestException(
          'One or more blockchain area IDs are invalid',
        );
      }

      // Create registration-blockchain area associations
      const registrationAreas = blockchain_area_ids.map((areaId) =>
        this.registrationBlockchainAreaRepository.create({
          registration_id: savedRegistration.id,
          area_id: areaId,
        }),
      );

      await this.registrationBlockchainAreaRepository.save(registrationAreas);
    }

    return savedRegistration;
  }

  async getAllRegistrations(): Promise<Registration[]> {
    return await this.registrationRepository.find({
      relations: ['blockchainAreas', 'blockchainAreas.blockchainArea'],
      order: {
        id: 'DESC',
      },
    });
  }
}