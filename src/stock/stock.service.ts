import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Stock } from './stock.entity';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<Stock[]> {
    return this.dataSource.query('SELECT * FROM get_stocks()');
  }

  async create(dto: CreateStockDto): Promise<{ message: string }> {
    await this.dataSource.query(
      `CALL manage_stock($1, NULL, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        'I',
        dto.date,
        dto.godown,
        dto.type,
        dto.qty ?? null,
        dto.amount ?? null,
        dto.customerName ?? null,
        dto.weightChorsa ?? 0,
        dto.weightBank999 ?? 0,
        dto.weightKachiSilver ?? 0,
        dto.weightBankPeti ?? 0,
        dto.rate ?? null,
        dto.bank ?? null,
        dto.bookingRate ?? null,
        dto.bookingWeight ?? null,
      ],
    );
    return { message: 'Stock created successfully' };
  }

  async update(id: number, dto: UpdateStockDto): Promise<{ message: string }> {
    await this.dataSource.query(
      `CALL manage_stock($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        'U',
        id,
        dto.date ?? null,
        dto.godown ?? null,
        dto.type ?? null,
        dto.qty ?? null,
        dto.amount ?? null,
        dto.customerName ?? null,
        dto.weightChorsa ?? null,
        dto.weightBank999 ?? null,
        dto.weightKachiSilver ?? null,
        dto.weightBankPeti ?? null,
        dto.rate ?? null,
        dto.bank ?? null,
        dto.bookingRate ?? null,
        dto.bookingWeight ?? null,
      ],
    );
    return { message: `Stock with id ${id} updated successfully` };
  }

  async remove(id: number): Promise<{ message: string }> {
    const stock = await this.stockRepository.findOne({ where: { id } });
    if (!stock) throw new NotFoundException(`Stock with id ${id} not found`);
    await this.dataSource.query(`CALL manage_stock($1, $2)`, ['D', id]);
    return { message: `Stock with id ${id} deleted successfully` };
  }
}
