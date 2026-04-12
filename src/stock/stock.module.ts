import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { Stock } from './stock.entity';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { ExportService } from './export.service';

@Module({
  imports: [TypeOrmModule.forFeature([Stock])],
  controllers: [StockController, InventoryController],
  providers: [StockService, InventoryService, ExportService],
})
export class StockModule {}
