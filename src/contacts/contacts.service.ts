import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from './entity/contacts.entity';
import { CreateContactDto } from './dto/create-contact.dto';

export interface PaginatedContacts {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
  ) {}

  async create(createContactDto: CreateContactDto): Promise<Contact> {
    const contact = this.contactRepository.create(createContactDto);
    return await this.contactRepository.save(contact);
  }

  async findAll(): Promise<Contact[]> {
    return await this.contactRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async findAllPaginated(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedContacts> {
    const offset = (page - 1) * limit;
    
    const [contacts, total] = await this.contactRepository.findAndCount({
      order: { created_at: 'DESC' },
      skip: offset,
      take: limit,
    });

    return {
      contacts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: number): Promise<Contact | null> {
    return await this.contactRepository.findOne({
      where: { id },
    });
  }

  async delete(id: number): Promise<void> {
    await this.contactRepository.delete(id);
  }
}
