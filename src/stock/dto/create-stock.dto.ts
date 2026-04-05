import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { BankBranch } from '../stock.entity';

export class CreateStockDto {
  @ApiProperty({ example: '2026-04-03' })
  @IsDateString()
  date: string;

  @ApiProperty({ enum: ['didwana', 'rajaldesar'] })
  @IsEnum(['didwana', 'rajaldesar'])
  godown: string;

  @ApiProperty({ enum: ['sell', 'buy'] })
  @IsEnum(['sell', 'buy'])
  sellBuy: string;

  @ApiPropertyOptional({ example: 10.5 })
  @IsOptional()
  @IsNumber()
  qty: number;

  @ApiPropertyOptional({ example: 50000.00 })
  @IsOptional()
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ example: 'Test Customer' })
  @IsOptional()
  @IsString()
  customerName: string;

  @ApiPropertyOptional({ example: 1.0 })
  @IsOptional()
  @IsNumber()
  weightChorsa: number;

  @ApiPropertyOptional({ example: 2.0 })
  @IsOptional()
  @IsNumber()
  weightBank999: number;

  @ApiPropertyOptional({ example: 0.5 })
  @IsOptional()
  @IsNumber()
  weightKachiSilver: number;

  @ApiPropertyOptional({ example: 1.0 })
  @IsOptional()
  @IsNumber()
  weightBankPeti: number;

  @ApiPropertyOptional({ example: 4800.00 })
  @IsOptional()
  @IsNumber()
  rate: number;

  @ApiPropertyOptional({ example: 4750.00 })
  @IsOptional()
  @IsNumber()
  bookingRate: number;

  @ApiPropertyOptional({ example: 2.5 })
  @IsOptional()
  @IsNumber()
  bookingWeight: number;

  @ApiPropertyOptional({ enum: BankBranch })
  @IsOptional()
  @IsEnum(BankBranch)
  bank: BankBranch;
}
