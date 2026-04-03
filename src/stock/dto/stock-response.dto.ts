import { ApiProperty } from '@nestjs/swagger';

export class StockResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  date: string;

  @ApiProperty({ enum: ['didwana', 'rajaldesar'] })
  godown: string;

  @ApiProperty({ enum: ['sell', 'buy'] })
  sellBuy: string;

  @ApiProperty()
  qty: number;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  customerName: string;

  @ApiProperty()
  weightChorsa: number;

  @ApiProperty()
  weightBank999: number;

  @ApiProperty()
  weightKachiSilver: number;

  @ApiProperty()
  weightBankPeti: number;

  @ApiProperty({ description: 'Auto calculated: sum of all weights' })
  weightTotal: number;

  @ApiProperty()
  rate: number;

  @ApiProperty()
  balanceTotal: number;

  @ApiProperty()
  avgRate: number;

  @ApiProperty()
  bank: number;

  @ApiProperty()
  createdAt: Date;
}
