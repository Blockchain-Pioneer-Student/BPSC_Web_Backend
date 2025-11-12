import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  UseGuards,
  ValidationPipe,
  Query,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { Contact } from './entity/contacts.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('contacts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Public()
  @Post('create')
  async create(
    @Body(ValidationPipe) createContactDto: CreateContactDto,
  ): Promise<{ success: boolean; message: string; data: Contact }> {
    try {
      const contact = await this.contactsService.create(createContactDto);
      return {
        success: true,
        message: 'Contact message sent successfully',
        data: contact,
      };
    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
  }

  @Roles('admin')
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<any> {
    // If pagination parameters are provided, use paginated method
    if (page || limit) {
      const pageNum = parseInt(page || '1', 10);
      const limitNum = parseInt(limit || '10', 10);
      return await this.contactsService.findAllPaginated(pageNum, limitNum);
    }
    
    // Otherwise, return all contacts (for backward compatibility)
    const contacts = await this.contactsService.findAll();
    return { contacts };
  }

  @Roles('admin')
  @Get(':id')
  async findById(@Param('id') id: string): Promise<Contact | null> {
    const contactId = parseInt(id, 10);
    return await this.contactsService.findById(contactId);
  }

  @Roles('admin')
  @Delete(':id')
  async delete(
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const contactId = parseInt(id, 10);
      await this.contactsService.delete(contactId);
      return {
        success: true,
        message: 'Contact deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  }
}
