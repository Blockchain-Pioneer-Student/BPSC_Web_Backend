import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Board } from './entity/boards.entity';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board)
    private boardRepository: Repository<Board>,
  ) {}

  async create(createBoardDto: CreateBoardDto): Promise<Board> {
    const board = this.boardRepository.create(createBoardDto);
    return await this.boardRepository.save(board);
  }

  async findAll(): Promise<Board[]> {
    return await this.boardRepository.find({
      relations: ['members'],
    });
  }

  async findOne(id: number): Promise<Board | null> {
    return await this.boardRepository.findOne({
      where: { id },
      relations: ['members'],
    });
  }

  async update(id: number, updateBoardDto: UpdateBoardDto): Promise<Board | null> {
    await this.boardRepository.update(id, updateBoardDto);
    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.boardRepository.delete(id);
  }
}