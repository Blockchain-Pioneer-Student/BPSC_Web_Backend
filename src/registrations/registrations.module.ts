import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsService } from './registrations.service';
import { Registration } from './entity/registrations.entity';
import { RegistrationBlockchainArea } from './entity/registration_blockchain_areas.entity';
import { BlockchainArea } from '../blockchain_areas/entity/blockchain_areas.entity';
import { AuthModule } from 'src/auth/auth.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Registration,
      RegistrationBlockchainArea,
      BlockchainArea,
    ]),
    AuthModule,
  ],
  controllers: [RegistrationsController],
  providers: [RegistrationsService],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}
