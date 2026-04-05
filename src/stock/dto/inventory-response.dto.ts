import { ApiProperty } from '@nestjs/swagger';

export class InventoryResponseDto {
  @ApiProperty({ example: 'chorsa', description: 'Type of silver' })
  silver_type: string;

  @ApiProperty({ example: 150.5, description: 'Current stock quantity (buy - sell)' })
  current_stock: number;
}
