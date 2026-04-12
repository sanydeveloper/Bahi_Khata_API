import { ApiProperty } from '@nestjs/swagger';
import { BankBranch } from '../stock.entity';

export class StockResponseDto {
  @ApiProperty() id: number;
  @ApiProperty({ description: 'Auto generated bill number (p1, s1, etc)' }) billNo: string;
  @ApiProperty() date: string;
  @ApiProperty({ enum: ['didwana', 'rajaldesar'] }) godown: string;
  @ApiProperty() amount: number;
  @ApiProperty() customerName: string;
  @ApiProperty() weightChorsa: number;
  @ApiProperty() weightBank999: number;
  @ApiProperty() weightKachiSilver: number;
  @ApiProperty() weightBankPeti: number;
  @ApiProperty({ description: 'Auto calculated: sum of all weights' }) weightTotal: number;
  @ApiProperty({ description: 'Running total stock in kg' }) totalStockKg: number;
  @ApiProperty() rate: number;
  @ApiProperty({ nullable: true }) bookingRate: number;
  @ApiProperty({ nullable: true }) bookingWeight: number;
  @ApiProperty({ description: 'Auto calculated: rate / qty' }) avgRate: number;
  @ApiProperty({ description: 'Auto calculated running balance' }) balanceTotal: number;
  @ApiProperty({ description: 'Profit per sell row: avg_rate - rate (null for buy)' }) profit: number;
  @ApiProperty({ description: 'Cumulative net profit up to this row' }) netProfit: number;
  @ApiProperty({ enum: BankBranch, nullable: true }) bank: BankBranch;
  @ApiProperty() createdAt: Date;
}
