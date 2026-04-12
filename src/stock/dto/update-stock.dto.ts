import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { BankBranch } from '../stock.entity';

export class UpdateStockDto {
  @ApiPropertyOptional({ example: '2026-04-03' })
  @IsOptional()
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ enum: ['didwana', 'rajaldesar'] })
  @IsOptional()
  @IsEnum(['didwana', 'rajaldesar'])
  godown: string;

  @ApiPropertyOptional({ enum: ['buy', 'sell'], description: 'Transaction type (used internally)' })
  @IsOptional()
  @IsEnum(['buy', 'sell'])
  type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  weightChorsa: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  weightBank999: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  weightKachiSilver: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  weightBankPeti: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  rate: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bookingRate: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bookingWeight: number;

  @ApiPropertyOptional({ enum: BankBranch })
  @IsOptional()
  @IsEnum(BankBranch)
  bank: BankBranch;
}
